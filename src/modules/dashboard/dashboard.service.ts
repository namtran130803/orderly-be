import { prisma } from "@/config/prisma";
import { StatusType } from "@prisma/client";
import { DashboardQueryDto } from "@/modules/dashboard/dashboard.schema";

export async function getDashboardStats(
  storeId: number,
  query: DashboardQueryDto,
) {
  const startDate = new Date(query.from);
  const endDate = new Date(query.to);

  const endStatus = await prisma.status.findFirst({
    where: { storeId, type: StatusType.end },
  });

  // 1. Revenue: tổng tiền từ các order item thuộc đơn đã hoàn thành (end status)
  // Dùng raw SQL vì cần tính price_snapshot * qty
  const revenueResult = await prisma.$queryRaw<{ total: string }[]>`
    SELECT COALESCE(SUM(oi.price_snapshot * oi.qty), 0) AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = ${storeId}
      AND o.created_at >= ${startDate}
      AND o.created_at <= ${endDate}
      AND o.status_id = ${endStatus?.id ?? 0}
  `;
  const revenue = Number(revenueResult[0]?.total ?? 0);

  // 2. Order count: tổng số đơn tạo trong kỳ (không phân biệt trạng thái)
  const orderCount = await prisma.order.count({
    where: {
      storeId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  // 3. Expense: tổng chi tiêu từ các phiếu chi trong kỳ
  const expenseResult = await prisma.expense.aggregate({
    where: {
      storeId,
      rawDate: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });
  const expense = Number(expenseResult._sum.amount ?? 0);

  // 4. Top items: món bán chạy nhất (chỉ tính các item trong đơn đã hoàn thành)
  const topItemsData = await prisma.orderItem.groupBy({
    by: ["nameSnapshot"],
    where: {
      order: {
        storeId,
        createdAt: { gte: startDate, lte: endDate },
        statusId: endStatus?.id,
      },
    },
    _sum: { qty: true },
    orderBy: {
      _sum: { qty: "desc" },
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
