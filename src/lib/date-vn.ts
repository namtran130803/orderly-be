/** Múi giờ cố định cho chuẩn hoá ngày theo khu vực VN (không DST). */
export const VN_OFFSET = '+07:00';

/** ISO weekday: Thứ 2 = 1 … Chủ nhật = 7 (theo lịch làm việc trong plan). */
export function isoWeekdayFromVnDateString(yyyyMmDd: string): number {
  const d = new Date(`${yyyyMmDd}T12:00:00${VN_OFFSET}`);
  const wd = d.getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** Bắt đầu ngày theo VN (UTC instant tương ứng 00:00 local). */
export function startOfVnDayFromDateString(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000${VN_OFFSET}`);
}

/** Chuỗi YYYY-MM-DD của một Date ở timezone Asia/Ho_Chi_Minh. */
export function formatVnDateString(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Hôm nay (theo VN) dạng YYYY-MM-DD. */
export function todayVnDateString(): string {
  return formatVnDateString(new Date());
}

/** Liệt kê mọi ngày YYYY-MM-DD trong tháng (month: 1–12). */
export function enumerateMonthDays(year: number, month: number): string[] {
  const last = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  const out: string[] = [];
  for (let day = 1; day <= last; day++) {
    const dd = String(day).padStart(2, '0');
    out.push(`${year}-${mm}-${dd}`);
  }
  return out;
}

/** Mọi ngày từ `from` → `to` (YYYY-MM-DD), inclusive. */
export function enumerateDateRangeInclusive(from: string, to: string): string[] {
  if (from > to) return [];
  const out: string[] = [];
  let cur = startOfVnDayFromDateString(from);
  const endT = startOfVnDayFromDateString(to).getTime();
  while (cur.getTime() <= endT) {
    out.push(formatVnDateString(cur));
    cur = new Date(cur.getTime() + 86400000);
  }
  return out;
}
