import type { OverrideType } from '@prisma/client';
import { enumerateMonthDays, isoWeekdayFromVnDateString } from '@/lib/date-vn';

export type OverrideMap = Map<string, OverrideType>;

/** Override theo chuỗi ngày YYYY-MM-DD. */
export function isWorkingDay(
  dateStr: string,
  defaultWorkDays: number[],
  overrides: OverrideMap,
): boolean {
  const o = overrides.get(dateStr);
  if (o === 'OFF') return false;
  if (o === 'WORKING_DAY') return true;
  const w = isoWeekdayFromVnDateString(dateStr);
  return defaultWorkDays.includes(w);
}

/** Số ngày làm chuẩn trong tháng (theo lịch cửa hàng + override). */
export function countStandardDaysInMonth(
  year: number,
  month: number,
  defaultWorkDays: number[],
  overrides: OverrideMap,
): number {
  let n = 0;
  for (const d of enumerateMonthDays(year, month)) {
    if (isWorkingDay(d, defaultWorkDays, overrides)) n += 1;
  }
  return n;
}

/** `workDays` rỗng → dùng `defaultWorkDays` của cửa hàng. */
export function effectiveWorkDaysForEmployee(
  storeDefault: number[],
  employeeWorkDays: number[],
): number[] {
  return employeeWorkDays.length > 0 ? employeeWorkDays : storeDefault;
}

/** standardDays cá nhân: đếm ngày làm theo effective workDays. */
export function countEmployeeStandardDaysInMonth(
  year: number,
  month: number,
  storeDefault: number[],
  employeeWorkDays: number[],
  overrides: OverrideMap,
): number {
  const days = effectiveWorkDaysForEmployee(storeDefault, employeeWorkDays);
  let n = 0;
  for (const d of enumerateMonthDays(year, month)) {
    const o = overrides.get(d);
    let isWork = false;
    if (o === 'OFF') isWork = false;
    else if (o === 'WORKING_DAY') isWork = true;
    else {
      const w = isoWeekdayFromVnDateString(d);
      isWork = days.includes(w);
    }
    if (isWork) n += 1;
  }
  return n;
}
