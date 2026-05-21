import {
  AttendanceStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import {
  calcWorkMinutes,
  dayCountsAsPaid,
  isCompletedWorkShift,
  isOpenWorkShift,
  mergeAttendanceRowsForDay,
} from '@/lib/attendance-helpers';
import {
  enumerateMonthDays,
  formatVnDateString,
  startOfVnDayFromDateString,
  todayVnDateString,
} from '@/lib/date-vn';
import { loadOverridesForMonth } from '@/modules/schedule/schedule.service';
import {
  effectiveWorkDaysForEmployee,
  isWorkingDay,
  type OverrideMap,
} from '@/lib/schedule-helpers';
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

/** Ca mở quá 48h — quét tiếp sẽ vào ca mới (tránh checkout nhầm ca cũ). */
const OPEN_SHIFT_MAX_MS = 48 * 60 * 60 * 1000;

async function assertPayrollUnlocked(storeId: number, month: number, year: number) {
  const locked = await prisma.payrollSnapshot.findFirst({
    where: { storeId, month, year },
    select: { id: true },
  });
  if (locked) {
    throw ApiError.conflict('Kỳ lương đã khóa, không chỉnh sửa được');
  }
}

function monthYearFromDateString(dateStr: string): { month: number; year: number } {
  const [y, m] = dateStr.split('-').map(Number);
  return { month: m, year: y };
}

type Tx = Prisma.TransactionClient;

async function findOpenWorkShift(tx: Tx, employeeId: number, now: Date) {
  const cutoff = new Date(now.getTime() - OPEN_SHIFT_MAX_MS);
  return tx.attendance.findFirst({
    where: {
      employeeId,
      status: AttendanceStatus.WORK,
      checkIn: { not: null, gte: cutoff },
      checkOut: null,
    },
    orderBy: { checkIn: 'desc' },
  });
}

function formatScanResponse(record: {
  id: number;
  employeeId: number;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  workMinutes: number | null;
  status: AttendanceStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...record,
    date: formatVnDateString(record.date),
    checkIn: record.checkIn?.toISOString() ?? null,
    checkOut: record.checkOut?.toISOString() ?? null,
  };
}

/**
 * Quét QR linh hoạt:
 * - Có ca mở (đã vào, chưa ra) → ra ca (kể cả qua đêm; ngày công = ngày vào ca)
 * - Không có ca mở → vào ca mới (ngày lịch VN hôm nay)
 * - Có thể nhiều ca/ngày: mỗi cặp vào–ra = một bản ghi
 */
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

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const open = await findOpenWorkShift(tx, storeUser.id, now);

    if (open && open.checkIn) {
      const record = await tx.attendance.update({
        where: { id: open.id },
        data: {
          checkOut: now,
          workMinutes: calcWorkMinutes(open.checkIn, now),
        },
      });
      return formatScanResponse(record);
    }

    const dayStart = startOfVnDayFromDateString(todayStr);
    const record = await tx.attendance.create({
      data: {
        employeeId: storeUser.id,
        date: dayStart,
        checkIn: now,
        status: AttendanceStatus.WORK,
      },
    });
    return formatScanResponse(record);
  });
}

function mapRowToRuntime(
  dateStr: string,
  defaultWorkDays: number[],
  overrides: OverrideMap,
  row: { status: AttendanceStatus; checkIn: Date | null; checkOut: Date | null } | null,
): RuntimeCell {
  const working = isWorkingDay(dateStr, defaultWorkDays, overrides);
  if (!working) return 'OFF';
  if (!row) return 'ABSENT';
  switch (row.status) {
    case AttendanceStatus.WORK:
      if (isOpenWorkShift(row)) return 'WORK';
      if (isCompletedWorkShift(row)) return 'WORK';
      return 'ABSENT';
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
    orderBy: [{ date: 'asc' }, { checkIn: 'asc' }],
  });

  const byEmpDate = new Map<string, typeof rows>();
  for (const r of rows) {
    const dateKey = formatVnDateString(r.date);
    const key = `${r.employeeId}|${dateKey}`;
    const list = byEmpDate.get(key) ?? [];
    list.push(r);
    byEmpDate.set(key, list);
  }

  return {
    month,
    year,
    defaultWorkDays: store.defaultWorkDays,
    employees: employees.map((emp) => {
      const effDays = effectiveWorkDaysForEmployee(store.defaultWorkDays, emp.workDays);
      const cells = days.map((d) => {
        const dayRows = byEmpDate.get(`${emp.id}|${d}`) ?? [];
        const merged = mergeAttendanceRowsForDay(dayRows);
        const runtime = mapRowToRuntime(d, effDays, overrides, merged);
        return {
          date: d,
          runtime,
          record: merged
            ? {
                id: merged.id,
                status: merged.status,
                checkIn: merged.checkIn?.toISOString() ?? null,
                checkOut: merged.checkOut?.toISOString() ?? null,
                workMinutes: merged.workMinutes,
                note: merged.note,
                shiftCount: dayRows.filter((r) => r.status === AttendanceStatus.WORK).length,
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
  const isLeaveStatus =
    dto.status === 'PAID_LEAVE' || dto.status === 'UNPAID_LEAVE';
  const checkInValue = isLeaveStatus
    ? null
    : dto.checkIn
      ? new Date(dto.checkIn)
      : null;
  const checkOutValue = isLeaveStatus
    ? null
    : dto.checkOut
      ? new Date(dto.checkOut)
      : null;

  let workMinutes: number | null = null;
  if (checkInValue && checkOutValue) {
    workMinutes = calcWorkMinutes(checkInValue, checkOutValue);
  }

  if (isLeaveStatus) {
    await prisma.attendance.deleteMany({
      where: { employeeId: su.id, date: day },
    });
    return prisma.attendance.create({
      data: {
        employeeId: su.id,
        date: day,
        status: dto.status,
        note: dto.note ?? null,
        checkIn: null,
        checkOut: null,
        workMinutes: null,
      },
    });
  }

  return prisma.attendance.create({
    data: {
      employeeId: su.id,
      date: day,
      status: dto.status,
      note: dto.note ?? null,
      checkIn: checkInValue,
      checkOut: checkOutValue,
      workMinutes,
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

  const dateStr = formatVnDateString(row.date);
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

  const nextStatus = dto.status ?? row.status;
  const switchingToLeave =
    nextStatus === AttendanceStatus.PAID_LEAVE ||
    nextStatus === AttendanceStatus.UNPAID_LEAVE;

  if (switchingToLeave) {
    updateData.checkIn = null;
    updateData.checkOut = null;
    updateData.workMinutes = null;
  } else {
    const nextCheckIn =
      dto.checkIn !== undefined
        ? dto.checkIn
          ? new Date(dto.checkIn)
          : null
        : row.checkIn;
    const nextCheckOut =
      dto.checkOut !== undefined
        ? dto.checkOut
          ? new Date(dto.checkOut)
          : null
        : row.checkOut;

    if (dto.checkIn !== undefined) {
      updateData.checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    }
    if (dto.checkOut !== undefined) {
      updateData.checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
    }
    if (dto.workMinutes !== undefined) {
      updateData.workMinutes = dto.workMinutes;
    } else if (nextCheckIn && nextCheckOut) {
      updateData.workMinutes = calcWorkMinutes(nextCheckIn, nextCheckOut);
    } else if (dto.checkIn !== undefined || dto.checkOut !== undefined) {
      updateData.workMinutes = null;
    }
  }

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

export async function getAttendanceById(storeId: number, attendanceId: number) {
  const row = await prisma.attendance.findFirst({
    where: { id: attendanceId, employee: { storeId } },
    include: {
      employee: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });
  if (!row) throw ApiError.notFound('Attendance');
  return {
    id: row.id,
    employeeId: row.employeeId,
    employee: row.employee,
    date: formatVnDateString(row.date),
    status: row.status,
    checkIn: row.checkIn?.toISOString() ?? null,
    checkOut: row.checkOut?.toISOString() ?? null,
    workMinutes: row.workMinutes,
    note: row.note,
  };
}

/**
 * Đếm ngày công trả lương trong tháng:
 * - Ngày làm việc theo lịch
 * - Có ít nhất một ca WORK hoàn thành (đủ vào + ra), hoặc PAID_LEAVE
 * - Ca chỉ mới vào (chưa ra) chưa tính công
 */
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

  const byDate = new Map<string, typeof att>();
  for (const a of att) {
    const d = formatVnDateString(a.date);
    const list = byDate.get(d) ?? [];
    list.push(a);
    byDate.set(d, list);
  }

  const eff = effectiveWorkDaysForEmployee(store.defaultWorkDays, emp.workDays);

  let paid = 0;
  for (const d of days) {
    if (!isWorkingDay(d, eff, overrides)) continue;
    const dayRows = byDate.get(d) ?? [];
    if (dayCountsAsPaid(dayRows)) paid += 1;
  }
  return paid;
}
