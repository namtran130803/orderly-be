/** Múi giờ cố định cho chuẩn hoá ngày theo khu vực VN (không DST). */
export const VN_OFFSET = '+07:00';

/** ISO weekday: Thứ 2 = 1 … Chủ nhật = 7 (theo lịch làm việc trong plan). */
export function isoWeekdayFromVnDateString(yyyyMmDd: string): number {
  const d = new Date(`${yyyyMmDd}T12:00:00.000Z`);
  const wd = d.getUTCDay();
  return wd === 0 ? 7 : wd;
}

/**
 * Chuyển YYYY-MM-DD → Date để lưu @db.Date (Prisma/PostgreSQL).
 * Dùng 12:00 UTC để tránh lệch 1 ngày khi driver chuyển sang UTC.
 */
export function startOfVnDayFromDateString(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T12:00:00.000Z`);
}

/**
 * Đọc Date từ DB (@db.Date) → chuỗi YYYY-MM-DD.
 * Giả định ngày được lưu bằng startOfVnDayFromDateString (noon UTC).
 */
export function formatVnDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Hôm nay (theo VN) dạng YYYY-MM-DD. */
export function todayVnDateString(): string {
  const now = new Date();
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const vnTime = new Date(now.getTime() + vnOffsetMs);
  const y = vnTime.getUTCFullYear();
  const m = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

/** Ngày lịch VN (YYYY-MM-DD) của một thời điểm. */
export function vnDateStringFromInstant(d: Date): string {
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const vn = new Date(d.getTime() + vnOffsetMs);
  const y = vn.getUTCFullYear();
  const m = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vn.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Cộng thêm số ngày lịch (YYYY-MM-DD). */
export function addVnDays(yyyyMmDd: string, days: number): string {
  const base = startOfVnDayFromDateString(yyyyMmDd);
  return formatVnDateString(new Date(base.getTime() + days * 86400000));
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
