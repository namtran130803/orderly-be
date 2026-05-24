import { prisma } from '@/config/prisma';
import {
  getEndStatusId,
  pctDelta,
  vnDateRangeInclusiveToDbBounds,
  vnHourFromUtcInstant,
  vnPreviousPeriodInclusive,
} from '@/modules/dashboard/dashboard-shared';

export type OrderStatusCount = {
  statusId: number | null;
  name: string;
  count: number;
};

export type TopItemRow = { name: string; qty: number; revenue: number };

export type OrdersByHour = { hour: number; count: number };

export type OrdersCompare = {
  orderCount: number;
  completedOrderCount: number;
  orderCountPct: number | null;
  completedOrderCountPct: number | null;
};

async function orderCounts(
  storeId: number,
  start: Date,
  endExclusive: Date,
  endId: number | null,
) {
  const orderCount = await prisma.order.count({
    where: { storeId, createdAt: { gte: start, lt: endExclusive } },
  });

  const completedOrderCount =
    endId != null
      ? await prisma.order.count({
          where: {
            storeId,
            createdAt: { gte: start, lt: endExclusive },
            statusId: endId,
          },
        })
      : 0;

  return { orderCount, completedOrderCount };
}

export async function getDashboardOrders(storeId: number, fromStr: string, toStr: string) {
  const { start, endExclusive } = vnDateRangeInclusiveToDbBounds(fromStr, toStr);
  const endId = await getEndStatusId(storeId);

  const { orderCount, completedOrderCount } = await orderCounts(
    storeId,
    start,
    endExclusive,
    endId,
  );

  const dineInCount = await prisma.order.count({
    where: {
      storeId,
      createdAt: { gte: start, lt: endExclusive },
      tableSnapshot: { not: null },
    },
  });

  const takeawayCount = await prisma.order.count({
    where: {
      storeId,
      createdAt: { gte: start, lt: endExclusive },
      tableSnapshot: null,
    },
  });

  const revenueAgg = await prisma.$queryRaw<{ total: string }[]>`
    SELECT COALESCE(SUM(oi.price_snapshot * oi.qty), 0) AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = ${storeId}
      AND o.created_at >= ${start}
      AND o.created_at < ${endExclusive}
      AND o.status_id = ${endId ?? -1}
  `;
  const revenue = Number(revenueAgg[0]?.total ?? 0);
  const avgOrderValue =
    completedOrderCount > 0 ? Math.round(revenue / completedOrderCount) : 0;

  const orders = await prisma.order.findMany({
    where: { storeId, createdAt: { gte: start, lt: endExclusive } },
    select: { statusId: true, statusSnapshot: true },
  });

  const statusMap = new Map<string, OrderStatusCount>();
  for (const o of orders) {
    const sid = o.statusId;
    const key = sid != null ? `id:${sid}` : `snap:${o.statusSnapshot ?? 'null'}`;
    const prev = statusMap.get(key);
    const name = o.statusSnapshot ?? '—';
    if (prev) {
      prev.count += 1;
    } else {
      statusMap.set(key, { statusId: sid, name, count: 1 });
    }
  }
  const byStatus = [...statusMap.values()].sort((a, b) => b.count - a.count);

  const topRows = await prisma.$queryRaw<{ name: string; qty: string; revenue: string }[]>`
    SELECT oi.name_snapshot AS name,
           COALESCE(SUM(oi.qty), 0)::text AS qty,
           COALESCE(SUM(oi.price_snapshot * oi.qty), 0)::text AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = ${storeId}
      AND o.created_at >= ${start}
      AND o.created_at < ${endExclusive}
      AND o.status_id = ${endId ?? -1}
    GROUP BY oi.name_snapshot
    ORDER BY SUM(oi.qty) DESC
    LIMIT 10
  `;

  const topItems: TopItemRow[] = topRows.map((r) => ({
    name: r.name,
    qty: Number(r.qty),
    revenue: Number(r.revenue),
  }));

  const ordersForHour = await prisma.order.findMany({
    where: { storeId, createdAt: { gte: start, lt: endExclusive } },
    select: { createdAt: true },
  });

  const hourCounts = new Map<number, number>();
  for (let h = 0; h < 24; h++) hourCounts.set(h, 0);
  for (const o of ordersForHour) {
    const h = vnHourFromUtcInstant(o.createdAt);
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  }
  const ordersByHour: OrdersByHour[] = [];
  for (let h = 0; h < 24; h++) {
    ordersByHour.push({ hour: h, count: hourCounts.get(h) ?? 0 });
  }

  const prevRange = vnPreviousPeriodInclusive(fromStr, toStr);
  let comparePrevious: OrdersCompare | null = null;

  if (prevRange) {
    const pb = vnDateRangeInclusiveToDbBounds(prevRange.prevFrom, prevRange.prevTo);
    const p = await orderCounts(storeId, pb.start, pb.endExclusive, endId);
    comparePrevious = {
      orderCount: p.orderCount,
      completedOrderCount: p.completedOrderCount,
      orderCountPct: pctDelta(orderCount, p.orderCount),
      completedOrderCountPct: pctDelta(completedOrderCount, p.completedOrderCount),
    };
  }

  return {
    orderCount,
    completedOrderCount,
    avgOrderValue,
    dineInCount,
    takeawayCount,
    byStatus,
    topItems,
    ordersByHour,
    comparePrevious,
  };
}

/** Top N items by qty (legacy dashboard). */
export async function getDashboardTopItemsLimited(
  storeId: number,
  fromStr: string,
  toStr: string,
  take = 5,
): Promise<{ name: string; qty: number }[]> {
  const full = await getDashboardOrders(storeId, fromStr, toStr);
  return full.topItems.slice(0, take).map((t) => ({ name: t.name, qty: t.qty }));
}
