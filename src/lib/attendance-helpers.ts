import { AttendanceStatus } from '@prisma/client';
import { formatVnDateString } from '@/lib/date-vn';

/** Ca WORK đã hoàn thành (đủ vào + ra) — tính 1 công cho ngày đó. */
export function isCompletedWorkShift(row: {
  status: AttendanceStatus;
  checkIn: Date | null;
  checkOut: Date | null;
}): boolean {
  return (
    row.status === AttendanceStatus.WORK &&
    row.checkIn != null &&
    row.checkOut != null
  );
}

/** Ca WORK đang mở (đã vào, chưa ra). */
export function isOpenWorkShift(row: {
  status: AttendanceStatus;
  checkIn: Date | null;
  checkOut: Date | null;
}): boolean {
  return (
    row.status === AttendanceStatus.WORK &&
    row.checkIn != null &&
    row.checkOut == null
  );
}

export function calcWorkMinutes(checkIn: Date, checkOut: Date): number {
  return Math.max(
    0,
    Math.round((checkOut.getTime() - checkIn.getTime()) / 60000),
  );
}

type ShiftRow = {
  checkIn: Date | null;
  checkOut: Date | null;
  workMinutes: number | null;
  date: Date;
};

/**
 * Tổng phút làm theo ngày vào ca (attendance.date).
 * Ca qua đêm gộp hết vào ngày vào — VD 21/05 11:55 → 22/05 01:59 → cả ~14h trên 21/05.
 */
export function buildWorkMinutesByVnDateForMonth(
  rows: ShiftRow[],
  monthDays: string[],
): Map<string, number> {
  const monthSet = new Set(monthDays);
  const totals = new Map<string, number>();
  for (const d of monthDays) totals.set(d, 0);

  for (const row of rows) {
    const dateStr = formatVnDateString(row.date);
    if (!monthSet.has(dateStr)) continue;

    const mins =
      row.workMinutes ??
      (row.checkIn && row.checkOut && row.checkOut > row.checkIn
        ? calcWorkMinutes(row.checkIn, row.checkOut)
        : 0);
    if (mins > 0) {
      totals.set(dateStr, (totals.get(dateStr) ?? 0) + mins);
    }
  }
  return totals;
}

export type AttendanceRowLike = {
  id: number;
  status: AttendanceStatus;
  checkIn: Date | null;
  checkOut: Date | null;
  workMinutes: number | null;
  note: string | null;
};

/** Gộp nhiều bản ghi cùng ngày để hiển thị lưới tháng. */
export function mergeAttendanceRowsForDay(
  rows: AttendanceRowLike[],
): AttendanceRowLike | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0];

  const leave = rows.find(
    (r) =>
      r.status === AttendanceStatus.PAID_LEAVE ||
      r.status === AttendanceStatus.UNPAID_LEAVE,
  );
  if (leave) return leave;

  const workRows = rows.filter((r) => r.status === AttendanceStatus.WORK);
  if (workRows.length === 0) return rows[0];

  const open = workRows.find(isOpenWorkShift);
  const checkIns = workRows
    .map((r) => r.checkIn)
    .filter((t): t is Date => t != null);
  const checkOuts = workRows
    .map((r) => r.checkOut)
    .filter((t): t is Date => t != null);
  const totalMinutes = workRows.reduce((s, r) => s + (r.workMinutes ?? 0), 0);

  const earliestIn =
    checkIns.length > 0
      ? new Date(Math.min(...checkIns.map((d) => d.getTime())))
      : null;
  const latestOut =
    checkOuts.length > 0
      ? new Date(Math.max(...checkOuts.map((d) => d.getTime())))
      : null;

  // ID dùng cho link sửa: ca đang mở, hoặc ca có giờ ra muộn nhất (khớp checkOut hiển thị)
  let primary = open ?? workRows[workRows.length - 1];
  if (!open && latestOut) {
    const withLatestOut = workRows.find(
      (r) => r.checkOut?.getTime() === latestOut.getTime(),
    );
    if (withLatestOut) primary = withLatestOut;
  }

  return {
    id: primary.id,
    status: AttendanceStatus.WORK,
    checkIn: earliestIn,
    checkOut: open ? null : latestOut,
    workMinutes: totalMinutes > 0 ? totalMinutes : null,
    note: primary.note,
  };
}

/** Một ngày làm việc có ít nhất một ca WORK hoàn thành hoặc nghỉ có lương. */
export function dayCountsAsPaid(
  rows: { status: AttendanceStatus; checkIn: Date | null; checkOut: Date | null }[],
): boolean {
  if (rows.some((r) => r.status === AttendanceStatus.PAID_LEAVE)) return true;
  return rows.some(isCompletedWorkShift);
}
