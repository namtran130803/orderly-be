import type { DashboardQueryDto } from '@/modules/dashboard/dashboard.schema';
import { getDashboardFinance } from '@/modules/dashboard/dashboard-finance.service';
import {
  getDashboardOrders,
  getDashboardTopItemsLimited,
} from '@/modules/dashboard/dashboard-orders.service';

export async function getDashboardStats(
  storeId: number,
  query: DashboardQueryDto,
) {
  const [finance, topItems, orders] = await Promise.all([
    getDashboardFinance(storeId, query.from, query.to),
    getDashboardTopItemsLimited(storeId, query.from, query.to),
    getDashboardOrders(storeId, query.from, query.to),
  ]);

  return {
    revenue: finance.revenue,
    expense: finance.expense,
    orderCount: orders.orderCount,
    topItems,
  };
}
