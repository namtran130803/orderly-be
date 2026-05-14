import { prisma } from '@/config/prisma';
import { DashboardQueryDto } from '@/modules/dashboard/dashboard.schema';

export async function getDashboardStats(storeId: number, query: DashboardQueryDto) {
  // 1. Thực thi câu lệnh truy vấn SQL thô tối ưu doanh thu và số lượng đơn hàng theo tài liệu thiết kế
  const sqlResult = await prisma.$queryRaw<any[]>`
    SELECT
      COALESCE(SUM(oi.price_snapshot * oi.qty)
        FILTER (WHERE s.type = 'end'), 0)                    AS revenue,
      COUNT(DISTINCT o.id)
        FILTER (WHERE o.status_snapshot = end_status.name)   AS order_count
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN statuses s     ON s.id = oi.status_id
    CROSS JOIN (
      SELECT name FROM statuses
      WHERE store_id = ${storeId} AND type = 'end' LIMIT 1
    ) AS end_status
    WHERE o.store_id = ${storeId}
      AND o.created_at >= ${query.from}::timestamptz
      AND o.created_at <  ${query.to}::timestamptz + INTERVAL '1 day';
  `;

  const rawRow = sqlResult?.[0] ?? {};
  const revenue = Number(rawRow.revenue ?? 0);
  const orderCount = Number(rawRow.order_count ?? 0);

  // 2. Tính toán tổng chi phí (expense) từ các phiếu chi
  const expenseResult = await prisma.expense.aggregate({
    where: {
      storeId,
      rawDate: {
        gte: new Date(`${query.from}T00:00:00.000Z`),
        lte: new Date(`${query.to}T23:59:59.999Z`),
      },
    },
    _sum: { amount: true },
  });
  const expense = Number(expenseResult._sum.amount ?? 0);

  // 3. Truy vấn danh sách Top món bán chạy nhất (đã hoàn thành)
  const topItemsData = await prisma.orderItem.groupBy({
    by: ['nameSnapshot'],
    where: {
      order: {
        storeId,
        createdAt: {
          gte: new Date(`${query.from}T00:00:00.000Z`),
          lte: new Date(`${query.to}T23:59:59.999Z`),
        },
      },
      status: {
        type: 'end',
      },
    },
    _sum: { qty: true },
    orderBy: {
      _sum: { qty: 'desc' },
    },
    take: 5,
  });

  const topItems = topItemsData.map((item) => ({
    name: item.nameSnapshot,
    qty: item._sum.qty ?? 0,
  }));

  return {
    revenue,
    expense,
    orderCount,
    topItems,
  };
}
