import { AttendanceStatus, LeaveRequestStatus } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import {
  enumerateDateRangeInclusive,
  formatVnDateString,
  startOfVnDayFromDateString,
} from '@/lib/date-vn';
import { loadOverridesForMonth } from '@/modules/schedule/schedule.service';
import { effectiveWorkDaysForEmployee, isWorkingDay } from '@/lib/schedule-helpers';
import type { CreateLeaveDto, LeaveQueryDto } from '@/modules/leave/leave.schema';

async function assertPayrollUnlockedForRange(storeId: number, fromStr: string, toStr: string) {
  const days = enumerateDateRangeInclusive(fromStr, toStr);
  const seen = new Set<string>();
  for (const d of days) {
    const [, m, y] = d.split('-');
    const key = `${y}-${m}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const month = Number(m);
    const year = Number(y);
    const locked = await prisma.payrollSnapshot.findFirst({
      where: { storeId, month, year },
      select: { id: true },
    });
    if (locked) {
      throw ApiError.conflict('Kỳ lương đã khóa, không chỉnh sửa được');
    }
  }
}

const leaveIncludes = {
  employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
  reviewer: { select: { id: true, name: true } },
} as const;

export async function listLeaves(storeId: number, query: LeaveQueryDto) {
  return prisma.leaveRequest.findMany({
    where: { storeId, ...(query.status ? { status: query.status } : {}) },
    include: leaveIncludes,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listMyLeaves(storeId: number, userId: number, query: LeaveQueryDto) {
  const su = await prisma.storeUser.findFirst({
    where: { storeId, userId },
    select: { id: true },
  });
  if (!su) throw ApiError.forbidden('Bạn không phải nhân viên cửa hàng này');

  return prisma.leaveRequest.findMany({
    where: {
      storeId,
      employeeId: su.id,
      ...(query.status ? { status: query.status } : {}),
    },
    include: leaveIncludes,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createLeave(storeId: number, userId: number, dto: CreateLeaveDto) {
  if (dto.fromDate > dto.toDate) {
    throw ApiError.badRequest('Khoảng ngày không hợp lệ');
  }

  await assertPayrollUnlockedForRange(storeId, dto.fromDate, dto.toDate);

  const su = await prisma.storeUser.findFirst({
    where: { storeId, userId },
  });
  if (!su) throw ApiError.forbidden('Bạn không thuộc cửa hàng này');

  return prisma.leaveRequest.create({
    data: {
      storeId,
      employeeId: su.id,
      fromDate: startOfVnDayFromDateString(dto.fromDate),
      toDate: startOfVnDayFromDateString(dto.toDate),
      isPaid: dto.isPaid,
      reason: dto.reason ?? null,
    },
    include: {
      employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
    },
  });
}

export async function approveLeave(
  storeId: number,
  leaveId: number,
  reviewerUserId: number,
) {
  const req = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, storeId },
    include: { employee: true },
  });
  if (!req) throw ApiError.notFound('Đơn nghỉ');
  if (req.status !== LeaveRequestStatus.PENDING) {
    throw ApiError.conflict('Đơn đã được xử lý');
  }

  const fromStr = formatVnDateString(req.fromDate);
  const toStr = formatVnDateString(req.toDate);
  await assertPayrollUnlockedForRange(storeId, fromStr, toStr);

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) throw ApiError.notFound('Store');

  const eff = effectiveWorkDaysForEmployee(store.defaultWorkDays, req.employee.workDays);
  const attStatus = req.isPaid ? AttendanceStatus.PAID_LEAVE : AttendanceStatus.UNPAID_LEAVE;

  const dates = enumerateDateRangeInclusive(fromStr, toStr);

  const monthKeys = new Set(dates.map((d) => d.slice(0, 7)));
  const overrideCache = new Map<string, Awaited<ReturnType<typeof loadOverridesForMonth>>>();
  for (const ym of monthKeys) {
    const [yStr, mStr] = ym.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    overrideCache.set(ym, await loadOverridesForMonth(storeId, y, m));
  }

  await prisma.$transaction(async (tx) => {
    for (const d of dates) {
      const ym = d.slice(0, 7);
      const ov = overrideCache.get(ym)!;
      if (!isWorkingDay(d, eff, ov)) continue;

      const day = startOfVnDayFromDateString(d);
      await tx.attendance.deleteMany({
        where: { employeeId: req.employeeId, date: day },
      });
      await tx.attendance.create({
        data: {
          employeeId: req.employeeId,
          date: day,
          status: attStatus,
        },
      });
    }

    await tx.leaveRequest.update({
      where: { id: req.id },
      data: {
        status: LeaveRequestStatus.APPROVED,
        reviewedBy: reviewerUserId,
      },
    });
  });

  return prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
      reviewer: { select: { id: true, name: true } },
    },
  });
}

export async function rejectLeave(
  storeId: number,
  leaveId: number,
  reviewerUserId: number,
) {
  const req = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, storeId },
  });
  if (!req) throw ApiError.notFound('Đơn nghỉ');
  if (req.status !== LeaveRequestStatus.PENDING) {
    throw ApiError.conflict('Đơn đã được xử lý');
  }

  const fromStr = formatVnDateString(req.fromDate);
  const toStr = formatVnDateString(req.toDate);
  await assertPayrollUnlockedForRange(storeId, fromStr, toStr);

  return prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: LeaveRequestStatus.REJECTED,
      reviewedBy: reviewerUserId,
    },
    include: {
      employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
      reviewer: { select: { id: true, name: true } },
    },
  });
}
