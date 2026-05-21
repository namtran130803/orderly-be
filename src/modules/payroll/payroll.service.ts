import { AttendanceStatus, SalaryType } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import {
  enumerateMonthDays,
  formatVnDateString,
  startOfVnDayFromDateString,
} from '@/lib/date-vn';
import { loadOverridesForMonth } from '@/modules/schedule/schedule.service';
import {
  countEmployeeStandardDaysInMonth,
  effectiveWorkDaysForEmployee,
  isWorkingDay,
} from '@/lib/schedule-helpers';
import {
  buildWorkMinutesByVnDateForMonth,
  dayCountsAsPaid,
  isOpenWorkShift,
  mergeAttendanceRowsForDay,
} from '@/lib/attendance-helpers';
import { countPaidDaysForEmployee } from '@/modules/attendance/attendance.service';
import type { PayrollMonthQueryDto } from '@/modules/payroll/payroll.schema';

export type PayrollDayStatus = 'OFF' | 'WORK' | 'PAID_LEAVE' | 'UNPAID_LEAVE' | 'ABSENT';

/** Ca WORK hoàn thành có ngày vào (date) trong tháng lương. */
async function loadCompletedShiftsByCheckInMonth(
  employeeId: number,
  year: number,
  month: number,
) {
  const days = enumerateMonthDays(year, month);
  if (days.length === 0) return [];
  const from = startOfVnDayFromDateString(days[0]);
  const to = startOfVnDayFromDateString(days[days.length - 1]);

  return prisma.attendance.findMany({
    where: {
      employeeId,
      status: AttendanceStatus.WORK,
      checkIn: { not: null },
      checkOut: { not: null },
      date: { gte: from, lte: to },
    },
  });
}

async function sumWorkMinutesForMonth(
  employeeId: number,
  year: number,
  month: number,
): Promise<number> {
  const days = enumerateMonthDays(year, month);
  if (days.length === 0) return 0;
  const shifts = await loadCompletedShiftsByCheckInMonth(
    employeeId,
    year,
    month,
  );
  const minutesByDate = buildWorkMinutesByVnDateForMonth(shifts, days);
  let total = 0;
  for (const mins of minutesByDate.values()) total += mins;
  return total;
}

export async function getPayrollPreview(storeId: number, q: PayrollMonthQueryDto) {
  const locked = await prisma.payrollSnapshot.findFirst({
    where: { storeId, month: q.month, year: q.year },
    select: { id: true },
  });

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) throw ApiError.notFound('Store');

  const overrides = await loadOverridesForMonth(storeId, q.year, q.month);

  const employees = await prisma.storeUser.findMany({
    where: { storeId },
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: { id: 'asc' },
  });

  const rows = await Promise.all(
    employees.map(async (emp) => {
      const standardDays = countEmployeeStandardDaysInMonth(
        q.year,
        q.month,
        store.defaultWorkDays,
        emp.workDays,
        overrides,
      );
      const paidDays = await countPaidDaysForEmployee(storeId, emp.id, q.year, q.month);

      let salary = 0;
      if (emp.salaryType === SalaryType.MONTHLY) {
        salary =
          standardDays > 0
            ? Math.round((paidDays / standardDays) * emp.baseSalary)
            : 0;
      } else {
        const mins = await sumWorkMinutesForMonth(emp.id, q.year, q.month);
        const rate = emp.hourlyRate ?? 0;
        salary = Math.round((mins / 60) * rate);
      }

      return {
        employeeId: emp.id,
        user: emp.user,
        salaryType: emp.salaryType,
        baseSalary: emp.baseSalary,
        hourlyRate: emp.hourlyRate,
        standardDays,
        paidDays,
        salary,
      };
    }),
  );

  return {
    month: q.month,
    year: q.year,
    locked: Boolean(locked),
    employees: rows,
  };
}

export async function lockPayroll(storeId: number, q: PayrollMonthQueryDto) {
  const existing = await prisma.payrollSnapshot.findFirst({
    where: { storeId, month: q.month, year: q.year },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('Kỳ lương đã được khóa');
  }

  const preview = await getPayrollPreview(storeId, q);

  await prisma.$transaction(async (tx) => {
    for (const e of preview.employees) {
      await tx.payrollSnapshot.create({
        data: {
          storeId,
          employeeId: e.employeeId,
          month: q.month,
          year: q.year,
          standardDays: e.standardDays,
          paidDays: e.paidDays,
          salary: e.salary,
        },
      });
    }
  });

  return prisma.payrollSnapshot.findMany({
    where: { storeId, month: q.month, year: q.year },
    include: {
      employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
    },
  });
}

export async function unlockPayroll(storeId: number, q: PayrollMonthQueryDto) {
  await prisma.payrollSnapshot.deleteMany({
    where: { storeId, month: q.month, year: q.year },
  });
}

export async function getMyPayrollDetail(
  storeId: number,
  userId: number,
  q: PayrollMonthQueryDto,
) {
  const su = await prisma.storeUser.findFirst({
    where: { storeId, userId },
    select: { id: true },
  });
  if (!su) throw ApiError.forbidden('Bạn không phải nhân viên cửa hàng này');
  return getPayrollEmployeeDetail(storeId, su.id, q);
}

/** Chi tiết tính lương một nhân viên — dùng cho màn giải thích công thức. */
export async function getPayrollEmployeeDetail(
  storeId: number,
  employeeId: number,
  q: PayrollMonthQueryDto,
) {
  const emp = await prisma.storeUser.findFirst({
    where: { id: employeeId, storeId },
    include: { user: { select: { id: true, name: true, phone: true } } },
  });
  if (!emp) throw ApiError.notFound('Nhân viên');

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) throw ApiError.notFound('Store');

  const periodLocked = await prisma.payrollSnapshot.findFirst({
    where: { storeId, month: q.month, year: q.year },
    select: { id: true },
  });

  const snapshot = await prisma.payrollSnapshot.findUnique({
    where: {
      storeId_employeeId_month_year: {
        storeId,
        employeeId,
        month: q.month,
        year: q.year,
      },
    },
  });

  const overrides = await loadOverridesForMonth(storeId, q.year, q.month);
  const effWorkDays = effectiveWorkDaysForEmployee(store.defaultWorkDays, emp.workDays);
  const usesStoreSchedule = emp.workDays.length === 0;

  const standardDays = countEmployeeStandardDaysInMonth(
    q.year,
    q.month,
    store.defaultWorkDays,
    emp.workDays,
    overrides,
  );

  const days = enumerateMonthDays(q.year, q.month);
  const from = days.length ? startOfVnDayFromDateString(days[0]) : new Date();
  const to = days.length ? startOfVnDayFromDateString(days[days.length - 1]) : new Date();

  const att = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: from, lte: to } },
  });
  const byDate = new Map<string, typeof att>();
  for (const a of att) {
    const key = formatVnDateString(a.date);
    const list = byDate.get(key) ?? [];
    list.push(a);
    byDate.set(key, list);
  }

  const completedShifts = await loadCompletedShiftsByCheckInMonth(
    employeeId,
    q.year,
    q.month,
  );
  const minutesByDate = buildWorkMinutesByVnDateForMonth(completedShifts, days);

  let workDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;
  let offDays = 0;
  let totalWorkMinutes = 0;
  for (const mins of minutesByDate.values()) totalWorkMinutes += mins;

  const dayBreakdown: {
    date: string;
    status: PayrollDayStatus;
    workMinutes: number | null;
    countsTowardPaid: boolean;
  }[] = [];

  for (const d of days) {
    const working = isWorkingDay(d, effWorkDays, overrides);
    if (!working) {
      offDays += 1;
      dayBreakdown.push({ date: d, status: 'OFF', workMinutes: null, countsTowardPaid: false });
      continue;
    }

    const dayRows = byDate.get(d) ?? [];
    const merged = mergeAttendanceRowsForDay(dayRows);
    const dayWorkMinutes = minutesByDate.get(d) ?? 0;

    if (merged?.status === AttendanceStatus.PAID_LEAVE) {
      paidLeaveDays += 1;
      dayBreakdown.push({ date: d, status: 'PAID_LEAVE', workMinutes: null, countsTowardPaid: true });
      continue;
    }

    if (merged?.status === AttendanceStatus.UNPAID_LEAVE) {
      unpaidLeaveDays += 1;
      dayBreakdown.push({
        date: d,
        status: 'UNPAID_LEAVE',
        workMinutes: null,
        countsTowardPaid: false,
      });
      continue;
    }

    if (dayWorkMinutes > 0) {
      const countsPaidForDay = dayRows.length > 0 && dayCountsAsPaid(dayRows);
      if (countsPaidForDay) workDays += 1;
      dayBreakdown.push({
        date: d,
        status: 'WORK',
        workMinutes: dayWorkMinutes,
        countsTowardPaid: countsPaidForDay,
      });
      continue;
    }

    if (dayRows.some(isOpenWorkShift)) {
      dayBreakdown.push({
        date: d,
        status: 'WORK',
        workMinutes: null,
        countsTowardPaid: false,
      });
      continue;
    }

    if (!merged) {
      absentDays += 1;
      dayBreakdown.push({ date: d, status: 'ABSENT', workMinutes: null, countsTowardPaid: false });
      continue;
    }

    absentDays += 1;
    dayBreakdown.push({ date: d, status: 'ABSENT', workMinutes: null, countsTowardPaid: false });
  }

  const paidDays = workDays + paidLeaveDays;

  let salary = 0;
  if (emp.salaryType === SalaryType.MONTHLY) {
    salary =
      standardDays > 0 ? Math.round((paidDays / standardDays) * emp.baseSalary) : 0;
  } else {
    const rate = emp.hourlyRate ?? 0;
    salary = Math.round((totalWorkMinutes / 60) * rate);
  }

  const paidDaysVerified = await countPaidDaysForEmployee(storeId, employeeId, q.year, q.month);

  return {
    month: q.month,
    year: q.year,
    locked: Boolean(periodLocked),
    employee: {
      id: emp.id,
      user: emp.user,
      salaryType: emp.salaryType,
      baseSalary: emp.baseSalary,
      hourlyRate: emp.hourlyRate,
      workDays: emp.workDays,
      usesStoreSchedule,
      effectiveWorkDays: effWorkDays,
    },
    counts: {
      standardDays,
      paidDays: paidDaysVerified,
      workDays,
      paidLeaveDays,
      unpaidLeaveDays,
      absentDays,
      offDays,
      totalWorkMinutes,
      totalWorkHours: Math.round((totalWorkMinutes / 60) * 100) / 100,
    },
    salary,
    snapshot: snapshot
      ? {
          salary: snapshot.salary,
          standardDays: snapshot.standardDays,
          paidDays: snapshot.paidDays,
          lockedAt: snapshot.lockedAt.toISOString(),
        }
      : null,
    dayBreakdown,
  };
}
