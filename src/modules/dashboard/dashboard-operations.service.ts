import {
  LeaveRequestStatus,
  StatusType,
} from '@prisma/client';
import { prisma } from '@/config/prisma';
import { todayVnDateString } from '@/lib/date-vn';
import { isWorkingDay } from '@/lib/schedule-helpers';
import { loadOverridesForDateRange } from '@/modules/dashboard/dashboard-shared';

export async function getDashboardOperations(storeId: number) {
  const date = todayVnDateString();

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) {
    return {
      date,
      storeOpenToday: false,
      openOrderCount: 0,
      busyTables: 0,
      totalTables: 0,
      unavailableMenuCount: 0,
      leavePendingCount: 0,
    };
  }

  const overrides = await loadOverridesForDateRange(storeId, date, date);
  const storeOpenToday = isWorkingDay(date, store.defaultWorkDays, overrides);

  const endStatus = await prisma.status.findFirst({
    where: { storeId, type: StatusType.end },
    select: { id: true },
  });

  const openOrderCount = endStatus
    ? await prisma.order.count({
        where: {
          storeId,
          NOT: { statusId: endStatus.id },
        },
      })
    : await prisma.order.count({ where: { storeId } });

  const [busyTables, totalTables] = await Promise.all([
    prisma.table.count({
      where: { orderId: { not: null }, area: { storeId } },
    }),
    prisma.table.count({ where: { area: { storeId } } }),
  ]);

  const unavailableMenuCount = await prisma.menuItem.count({
    where: {
      category: { storeId },
      isAvailable: false,
    },
  });

  const leavePendingCount = await prisma.leaveRequest.count({
    where: { storeId, status: LeaveRequestStatus.PENDING },
  });

  return {
    date,
    storeOpenToday,
    openOrderCount,
    busyTables,
    totalTables,
    unavailableMenuCount,
    leavePendingCount,
  };
}
