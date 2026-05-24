import { prisma } from '@/config/prisma';
import { StatusType } from '@prisma/client';
import {
  addVnDays,
  enumerateDateRangeInclusive,
  formatVnDateString,
  startOfVnDayFromDateString,
  todayVnDateString,
} from '@/lib/date-vn';

/** Đơn/expense trong khoảng [from,to] inclusive theo calendar VN — dùng [start, nextDay) trong DB. */
export function vnDateRangeInclusiveToDbBounds(fromStr: string, toStr: string) {
  const start = startOfVnDayFromDateString(fromStr);
  const endExclusive = startOfVnDayFromDateString(addVnDays(toStr, 1));
  return { start, endExclusive };
}

export function vnPreviousPeriodInclusive(
  fromStr: string,
  toStr: string,
): { prevFrom: string; prevTo: string } | null {
  const days = enumerateDateRangeInclusive(fromStr, toStr);
  if (days.length === 0) return null;
  const prevToStr = addVnDays(fromStr, -1);
  const prevFromStr = addVnDays(prevToStr, -(days.length - 1));
  return { prevFrom: prevFromStr, prevTo: prevToStr };
}

export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

export async function getEndStatusId(storeId: number): Promise<number | null> {
  const s = await prisma.status.findFirst({
    where: { storeId, type: StatusType.end },
    select: { id: true },
  });
  return s?.id ?? null;
}

/** Giờ 0–23 theo Asia/Ho_Chi_Minh. */
export function vnHourFromUtcInstant(d: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const raw = parts.find((p) => p.type === 'hour')?.value ?? '0';
  return Number(raw);
}

export function currentVnMonthYear(): { year: number; month: number } {
  const t = todayVnDateString();
  const [y, m] = t.split('-').map(Number);
  return { year: y, month: m };
}

/** from–to cùng tháng năm VN với hôm nay. */
export function isEntirelyCurrentVnMonth(fromStr: string, toStr: string): boolean {
  const { year, month } = currentVnMonthYear();
  const [fy, fm] = fromStr.split('-').map(Number);
  const [ty, tm] = toStr.split('-').map(Number);
  return fy === year && fm === month && ty === year && tm === month;
}

export async function loadOverridesForDateRange(
  storeId: number,
  fromStr: string,
  toStr: string,
): Promise<Map<string, import('@prisma/client').OverrideType>> {
  const from = startOfVnDayFromDateString(fromStr);
  const to = startOfVnDayFromDateString(toStr);
  const rows = await prisma.scheduleOverride.findMany({
    where: { storeId, date: { gte: from, lte: to } },
  });
  const map = new Map<string, import('@prisma/client').OverrideType>();
  for (const r of rows) {
    map.set(formatVnDateString(r.date), r.type);
  }
  return map;
}
