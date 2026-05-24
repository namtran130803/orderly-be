import { prisma } from '@/config/prisma';
import {
  getEndStatusId,
  pctDelta,
  vnDateRangeInclusiveToDbBounds,
  vnPreviousPeriodInclusive,
} from '@/modules/dashboard/dashboard-shared';

export type FinanceCompare = {
  revenue: number;
  expense: number;
  profit: number;
  revenuePct: number | null;
  expensePct: number | null;
  profitPct: number | null;
};

async function financeMetrics(
  storeId: number,
  start: Date,
  endExclusive: Date,
  endId: number | null,
) {
  const revenueResult = await prisma.$queryRaw<{ total: string }[]>`
    SELECT COALESCE(SUM(oi.price_snapshot * oi.qty), 0) AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = ${storeId}
      AND o.created_at >= ${start}
      AND o.created_at < ${endExclusive}
      AND o.status_id = ${endId ?? -1}
  `;
  const revenue = Number(revenueResult[0]?.total ?? 0);

  const expenseResult = await prisma.expense.aggregate({
    where: {
      storeId,
      rawDate: { gte: start, lt: endExclusive },
    },
    _sum: { amount: true },
  });
  const expense = Number(expenseResult._sum.amount ?? 0);
  const profit = revenue - expense;

  return { revenue, expense, profit };
}

export async function getDashboardFinance(
  storeId: number,
  fromStr: string,
  toStr: string,
): Promise<{
  revenue: number;
  expense: number;
  profit: number;
  comparePrevious: FinanceCompare | null;
}> {
  const endId = await getEndStatusId(storeId);
  const { start, endExclusive } = vnDateRangeInclusiveToDbBounds(fromStr, toStr);

  const { revenue, expense, profit } = await financeMetrics(
    storeId,
    start,
    endExclusive,
    endId,
  );

  const prevRange = vnPreviousPeriodInclusive(fromStr, toStr);
  let comparePrevious: FinanceCompare | null = null;

  if (prevRange) {
    const pb = vnDateRangeInclusiveToDbBounds(prevRange.prevFrom, prevRange.prevTo);
    const p = await financeMetrics(storeId, pb.start, pb.endExclusive, endId);

    comparePrevious = {
      revenue: p.revenue,
      expense: p.expense,
      profit: p.profit,
      revenuePct: pctDelta(revenue, p.revenue),
      expensePct: pctDelta(expense, p.expense),
      profitPct: pctDelta(profit, p.profit),
    };
  }

  return {
    revenue,
    expense,
    profit,
    comparePrevious,
  };
}
