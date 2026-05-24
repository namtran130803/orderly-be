import {
  AttendanceStatus,
  StoreUserRoleType,
} from '@prisma/client';
import { prisma } from '@/config/prisma';
import {
  enumerateDateRangeInclusive,
  formatVnDateString,
  startOfVnDayFromDateString,
  todayVnDateString,
} from '@/lib/date-vn';
import {
  mergeAttendanceRowsForDay,
  isCompletedWorkShift,
  isOpenWorkShift,
  type AttendanceRowLike,
} from '@/lib/attendance-helpers';
import type { OverrideMap } from '@/lib/schedule-helpers';
import {
  effectiveWorkDaysForEmployee,
  isWorkingDay,
} from '@/lib/schedule-helpers';
import {
  isEntirelyCurrentVnMonth,
  currentVnMonthYear,
  loadOverridesForDateRange,
} from '@/modules/dashboard/dashboard-shared';
import { ApiError } from '@/lib/response';
import { getPayrollPreview } from '@/modules/payroll/payroll.service';

function mapMergedToRuntimeCell(
  dateStr: string,
  empEffectiveDays: number[],
  overrides: OverrideMap,
  merged: AttendanceRowLike | null,
): 'OFF' | 'ABSENT' | 'WORK' | 'PAID_LEAVE' | 'UNPAID_LEAVE' {
  const scheduled = isWorkingDay(dateStr, empEffectiveDays, overrides);
  if (!scheduled) return 'OFF';
  if (!merged) return 'ABSENT';
  switch (merged.status) {
    case AttendanceStatus.WORK:
      if (isOpenWorkShift(merged)) return 'WORK';
      if (isCompletedWorkShift(merged)) return 'WORK';
      return 'ABSENT';
    case AttendanceStatus.PAID_LEAVE:
      return 'PAID_LEAVE';
    case AttendanceStatus.UNPAID_LEAVE:
      return 'UNPAID_LEAVE';
    default:
      return 'ABSENT';
  }
}

async function fetchEmployees(storeId: number) {
  return prisma.storeUser.findMany({
    where: { storeId, role: StoreUserRoleType.employee },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { id: 'asc' },
  });
}

export async function getDashboardStaff(
  storeId: number,
  fromStr: string,
  toStr: string,
) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) throw ApiError.notFound('Store');

  const employees = await fetchEmployees(storeId);
  const employeeIds = employees.map((e) => e.id);
  const todayStr = todayVnDateString();

  const overridesFull = await loadOverridesForDateRange(storeId, fromStr, toStr);
  const overridesTodayOnly = await loadOverridesForDateRange(
    storeId,
    todayStr,
    todayStr,
  );

  const daySpanFrom = startOfVnDayFromDateString(fromStr);
  const daySpanTo = startOfVnDayFromDateString(toStr);
  const allRows =
    employeeIds.length === 0
      ? []
      : await prisma.attendance.findMany({
          where: {
            employeeId: { in: employeeIds },
            date: { gte: daySpanFrom, lte: daySpanTo },
          },
          orderBy: [{ date: 'asc' }],
        });

  const byEmpDateKey = new Map<string, typeof allRows>();
  for (const r of allRows) {
    const dk = `${r.employeeId}|${formatVnDateString(r.date)}`;
    const list = byEmpDateKey.get(dk) ?? [];
    list.push(r);
    byEmpDateKey.set(dk, list);
  }

  let scheduledToday = 0;
  let workingToday = 0;
  let absentToday = 0;
  let paidLeaveToday = 0;
  let unpaidLeaveToday = 0;
  const onShiftNow: { employeeId: number; name: string }[] = [];

  for (const emp of employees) {
    const eff = effectiveWorkDaysForEmployee(store.defaultWorkDays, emp.workDays);
    const dayRows = byEmpDateKey.get(`${emp.id}|${todayStr}`) ?? [];
    const merged = mergeAttendanceRowsForDay(dayRows);
    const rt = mapMergedToRuntimeCell(todayStr, eff, overridesTodayOnly, merged);

    if (isWorkingDay(todayStr, eff, overridesTodayOnly)) {
      scheduledToday += 1;
      if (rt === 'ABSENT') absentToday += 1;
    }
    if (rt === 'WORK') workingToday += 1;
    if (rt === 'PAID_LEAVE') paidLeaveToday += 1;
    if (rt === 'UNPAID_LEAVE') unpaidLeaveToday += 1;
    if (merged?.status === AttendanceStatus.WORK && isOpenWorkShift(merged)) {
      onShiftNow.push({
        employeeId: emp.id,
        name: emp.user.name,
      });
    }
  }

  let workDaysEmp = 0;
  let absentDaysEmp = 0;
  let paidLeaveDaysEmp = 0;
  let unpaidLeaveDaysEmp = 0;
  let totalWorkMinutes = 0;

  for (const d of enumerateDateRangeInclusive(fromStr, toStr)) {
    for (const emp of employees) {
      const eff = effectiveWorkDaysForEmployee(store.defaultWorkDays, emp.workDays);
      const rows = byEmpDateKey.get(`${emp.id}|${d}`) ?? [];
      const merged = mergeAttendanceRowsForDay(rows);
      const rt = mapMergedToRuntimeCell(d, eff, overridesFull, merged);

      if (!isWorkingDay(d, eff, overridesFull)) continue;

      switch (rt) {
        case 'WORK':
          workDaysEmp += 1;
          if (merged && merged.workMinutes != null && merged.workMinutes > 0) {
            totalWorkMinutes += merged.workMinutes;
          }
          break;
        case 'ABSENT':
          absentDaysEmp += 1;
          break;
        case 'PAID_LEAVE':
          paidLeaveDaysEmp += 1;
          break;
        case 'UNPAID_LEAVE':
          unpaidLeaveDaysEmp += 1;
          break;
        default:
          break;
      }
    }
  }

  let estimatedPayrollTotal: number | undefined;
  let payrollLocked: boolean | undefined;
  if (isEntirelyCurrentVnMonth(fromStr, toStr)) {
    const { year, month } = currentVnMonthYear();
    const preview = await getPayrollPreview(storeId, { month, year });
    payrollLocked = preview.locked;
    estimatedPayrollTotal = preview.employees.reduce(
      (sum, row) => sum + row.salary,
      0,
    );
  }

  return {
    today: {
      scheduledCount: scheduledToday,
      workingCount: workingToday,
      onShiftNow,
      absentCount: absentToday,
      paidLeaveToday,
      unpaidLeaveToday,
    },
    period: {
      workDays: workDaysEmp,
      absentDays: absentDaysEmp,
      paidLeaveDays: paidLeaveDaysEmp,
      unpaidLeaveDays: unpaidLeaveDaysEmp,
      totalWorkMinutes,
      ...(estimatedPayrollTotal != null ? { estimatedPayrollTotal } : {}),
      ...(payrollLocked != null ? { payrollLocked } : {}),
    },
  };
}
