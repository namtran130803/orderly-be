import {
  AttendanceStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import {
  enumerateMonthDays,
  startOfVnDayFromDateString,
  todayVnDateString,
} from '@/lib/date-vn';
import { loadOverridesForMonth } from '@/modules/schedule/schedule.service';
import {
  effectiveWorkDaysForEmployee,
  isWorkingDay,
  type OverrideMap,
} from '@/lib/schedule-helpers';
import { SCAN_COOLDOWN_MS } from '@/lib/attendance-constants';
import { verifyAttendanceQrToken } from '@/lib/jwt';
import type {
  MonthYearQueryDto,
  CreateManualAttendanceDto,
  PatchAttendanceDto,
} from '@/modules/attendance/attendance.schema';

export type RuntimeCell =
  | 'OFF'
  | 'ABSENT'
  | 'WORK'
  | 'PAID_LEAVE'
  | 'UNPAID_LEAVE';

async function assertPayrollUnlocked(storeId: number, month: number, year: number) {
  const locked = await prisma.payrollSnapshot.findFirst({
    where: { storeId, month, year },
    select: { id: true },
  });
  if (locked) {
    throw ApiError.conflict('Kỳ lương đã khóa, không chỉnh sửa được');
  }
}

/** Tháng của một ngày (theo chuỗi VN YYYY-MM-DD). */
function monthYearFromDateString(dateStr: string): { month: number; year: number } {
  const [y, m] = dateStr.split('-').map(Number);
  return { month: m, year: y };
}

export async function scanAttendance(
  storeId: number,
  userId: number,
  qrToken: string,
) {
  let storeFromQr: number;
  try {
    ({ storeId: storeFromQr } = verifyAttendanceQrToken(qrToken));
  } catch {
    throw ApiError.unauthorized('QR không hợp lệ hoặc đã hết hạn');
  }
  if (storeFromQr !== storeId) {
    throw ApiError.badRequest('QR không khớp cửa hàng');
  }

  const storeUser = await prisma.storeUser.findFirst({
    where: { storeId, userId },
  });
  if (!storeUser) {
    throw ApiError.forbidden('Bạn không phải nhân viên cửa hàng này');
  }

  const todayStr = todayVnDateString();
  const { month, year } = monthYearFromDateString(todayStr);
  await assertPayrollUnlocked(storeId, month, year);

  const dayStart = startOfVnDayFromDateString(todayStr);
  const now = new Date();

  const lastEvent = await prisma.attendance.findFirst({
    where: { employeeId: storeUser.id, checkIn: { not: null } },
    orderBy: [{ checkIn: 'desc' }],
    select: { checkIn: true },
  });
  if (lastEvent?.checkIn && now.getTime() - lastEvent.checkIn.getTime() < SCAN_COOLDOWN_MS) {
    throw new ApiError(409, 'SCAN_TOO_FAST', 'Chấm công quá nhanh, thử lại sau 5 phút');
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.attendance.findUnique({
      where: {
        employeeId_date: { employeeId: storeUser.id, date: dayStart },
      },
    });

    if (!existing) {
      return tx.attendance.create({
        data: {
          employeeId: storeUser.id,
          date: dayStart,
          checkIn: now,
          status: AttendanceStatus.WORK,
        },
      });
    }

    if (existing.checkIn && !existing.checkOut) {
      const diffMin = Math.max(
        0,
        Math.round((now.getTime() - existing.checkIn.getTime()) / 60000),
      );
      return tx.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: now,
          workMinutes: diffMin,
        },
      });
    }

    throw ApiError.conflict('Đã chấm công đủ trong ngày');
  });
}

function mapRowToRuntime(
  dateStr: string,
  defaultWorkDays: number[],
  overrides: OverrideMap,
  row: { status: AttendanceStatus } | null,
): RuntimeCell {
  const working = isWorkingDay(dateStr, defaultWorkDays, overrides);
  if (!working) return 'OFF';
  if (!row) return 'ABSENT';
  switch (row.status) {
    case AttendanceStatus.WORK:
      return 'WORK';
    case AttendanceStatus.PAID_LEAVE:
      return 'PAID_LEAVE';
    case AttendanceStatus.UNPAID_LEAVE:
      return 'UNPAID_LEAVE';
    default:
      return 'ABSENT';
  }
}

async function buildAttendanceGrid(
  storeId: number,
  year: number,
  month: number,
  employeeIds?: number[],
) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) throw ApiError.notFound('Store');

  const overrides = await loadOverridesForMonth(storeId, year, month);
  const days = enumerateMonthDays(year, month);

  const employees = await prisma.storeUser.findMany({
    where: { storeId, ...(employeeIds ? { id: { in: employeeIds } } : {}) },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { id: 'asc' },
  });

  const from = startOfVnDayFromDateString(days[0]);
  const to = startOfVnDayFromDateString(days[days.length - 1]);

  const rows = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      date: { gte: from, lte: to },
    },
  });

  const byEmpDate = new Map<string, (typeof rows)[0]>();
  for (const r of rows) {
    const key = `${r.employeeId}|${r.date.toISOString().slice(0, 10)}`;
    byEmpDate.set(key, r);
  }

  return {
    month,
    year,
    defaultWorkDays: store.defaultWorkDays,
    employees: employees.map((emp) => {
      const effDays = effectiveWorkDaysForEmployee(store.defaultWorkDays, emp.workDays);
      const cells = days.map((d) => {
        const row = byEmpDate.get(`${emp.id}|${d}`) ?? null;
        const runtime = mapRowToRuntime(d, effDays, overrides, row);
        return {
          date: d,
          runtime,
          record: row
            ? {
                id: row.id,
                status: row.status,
                checkIn: row.checkIn?.toISOString() ?? null,
                checkOut: row.checkOut?.toISOString() ?? null,
                workMinutes: row.workMinutes,
                note: row.note,
              }
            : null,
        };
      });
      return {
        employeeId: emp.id,
        user: emp.user,
        salaryType: emp.salaryType,
        baseSalary: emp.baseSalary,
        workDays: emp.workDays,
        hourlyRate: emp.hourlyRate,
        cells,
      };
    }),
  };
}

export async function listAttendance(storeId: number, year: number, month: number) {
  return buildAttendanceGrid(storeId, year, month);
}

export async function getEmployeeAttendance(
  storeId: number,
  employeeId: number,
  year: number,
  month: number,
) {
  const su = await prisma.storeUser.findFirst({
    where: { id: employeeId, storeId },
    select: { id: true },
  });
  if (!su) throw ApiError.notFound('Nhân viên');
  return buildAttendanceGrid(storeId, year, month, [employeeId]);
}

export async function getMyAttendance(
  storeId: number,
  userId: number,
  year: number,
  month: number,
) {
  const su = await prisma.storeUser.findFirst({
    where: { storeId, userId },
    select: { id: true },
  });
  if (!su) throw ApiError.forbidden('Bạn không phải nhân viên cửa hàng này');
  return buildAttendanceGrid(storeId, year, month, [su.id]);
}

export async function createManualAttendance(
  storeId: number,
  dto: CreateManualAttendanceDto,
) {
  const su = await prisma.storeUser.findFirst({
    where: { id: dto.employeeId, storeId },
  });
  if (!su) throw ApiError.notFound('Nhân viên');

  const { month, year } = monthYearFromDateString(dto.date);
  await assertPayrollUnlocked(storeId, month, year);

  const day = startOfVnDayFromDateString(dto.date);
  const data: Prisma.AttendanceUncheckedCreateInput = {
    employeeId: su.id,
    date: day,
    status: dto.status,
    note: dto.note ?? null,
    checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
    checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
  };

  return prisma.attendance.upsert({
    where: {
      employeeId_date: { employeeId: su.id, date: day },
    },
    create: data,
    update: {
      status: dto.status,
      note: dto.note ?? null,
      checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
    },
  });
}

export async function patchAttendance(
  storeId: number,
  attendanceId: number,
  editorUserId: number,
  dto: PatchAttendanceDto,
) {
  const row = await prisma.attendance.findFirst({
    where: { id: attendanceId, employee: { storeId } },
    include: { employee: true },
  });
  if (!row) throw ApiError.notFound('Attendance');

  const dateStr = row.date.toISOString().slice(0, 10);
  const { month, year } = monthYearFromDateString(dateStr);
  await assertPayrollUnlocked(storeId, month, year);

  const before = {
    status: row.status,
    checkIn: row.checkIn?.toISOString() ?? null,
    checkOut: row.checkOut?.toISOString() ?? null,
    workMinutes: row.workMinutes,
    note: row.note,
  };

  const updateData: Prisma.AttendanceUpdateInput = {};
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.note !== undefined) updateData.note = dto.note;
  if (dto.checkIn !== undefined) {
    updateData.checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
  }
  if (dto.checkOut !== undefined) {
    updateData.checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
  }
  if (dto.workMinutes !== undefined) updateData.workMinutes = dto.workMinutes;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.attendance.update({
      where: { id: row.id },
      data: updateData,
    });

    await tx.attendanceEditLog.create({
      data: {
        attendanceId: row.id,
        before,
        after: {
          status: u.status,
          checkIn: u.checkIn?.toISOString() ?? null,
          checkOut: u.checkOut?.toISOString() ?? null,
          workMinutes: u.workMinutes,
          note: u.note,
        },
        editedBy: editorUserId,
      },
    });
    return u;
  });

  return updated;
}

/** Tiện ích bảng lương: đếm paidDays (WORK + PAID_LEAVE) trong tháng. */
export async function countPaidDaysForEmployee(
  storeId: number,
  employeeId: number,
  year: number,
  month: number,
): Promise<number> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) throw ApiError.notFound('Store');

  const emp = await prisma.storeUser.findFirst({
    where: { id: employeeId, storeId },
  });
  if (!emp) throw ApiError.notFound('Nhân viên');

  const overrides = await loadOverridesForMonth(storeId, year, month);
  const days = enumerateMonthDays(year, month);

  const from = startOfVnDayFromDateString(days[0]);
  const to = startOfVnDayFromDateString(days[days.length - 1]);

  const att = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: from, lte: to } },
  });
  const byDate = new Map(att.map((a) => [a.date.toISOString().slice(0, 10), a]));

  const eff = effectiveWorkDaysForEmployee(store.defaultWorkDays, emp.workDays);

  let paid = 0;
  for (const d of days) {
    if (!isWorkingDay(d, eff, overrides)) {
      continue;
    }
    const r = byDate.get(d);
    if (!r) continue;
    if (
      r.status === AttendanceStatus.WORK ||
      r.status === AttendanceStatus.PAID_LEAVE
    ) {
      paid += 1;
    }
  }
  return paid;
}
