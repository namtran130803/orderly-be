import { prisma } from '@/config/prisma';
import { MODULE_DEFS, type ModuleDef } from '@/config/rbac/rbac-defs';

export function getSystemModules(): ModuleDef[] {
  return MODULE_DEFS;
}

export async function getSystemOverview() {
  // 1. Summary stats
  const totalStores = await prisma.store.count();
  const totalUsers = await prisma.user.count();
  const totalPlans = await prisma.subscriptionPlan.count();
  
  // Total Revenue: sum of all PAID payments
  const revenueAggregate = await prisma.payment.aggregate({
    where: { status: 'PAID' },
    _sum: { amount: true },
  });
  const totalRevenue = revenueAggregate._sum.amount || 0;

  // Active stores: count of stores with ACTIVE or TRIALING subscription
  const activeStores = await prisma.storeSubscription.count({
    where: {
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
  });

  // 2. Recent Stores (last 5)
  const recentStoresRaw = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });
  
  const recentStores = recentStoresRaw.map(s => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt.toISOString(),
    ownerName: s.user.name,
    ownerPhone: s.user.phone,
  }));

  // 3. Recent Payments (last 5)
  const recentPaymentsRaw = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      store: { select: { name: true } },
      user: { select: { name: true } },
      plan: { select: { name: true } },
    },
  });

  const recentPayments = recentPaymentsRaw.map(p => ({
    id: p.id,
    paymentCode: p.paymentCode,
    amount: p.amount,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    storeName: p.store.name,
    userName: p.user.name,
    planName: p.plan.name,
  }));

  // 4. Plan Distribution
  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, name: true },
  });
  
  const planCounts = await prisma.payment.groupBy({
    by: ['planId'],
    where: { status: 'PAID' },
    _count: { id: true },
  });

  const planMap = new Map(plans.map(p => [p.id, p.name]));
  const planDistribution = planCounts.map(pc => ({
    planName: planMap.get(pc.planId) || `Gói #${pc.planId}`,
    count: pc._count.id,
  }));

  // 5. Growth Trends (last 6 months) using native JavaScript Date math
  const growth: { month: string; newStores: number; revenue: number }[] = [];

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Count new stores created in this month
    const newStoresCount = await prisma.store.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Sum revenue for PAID payments in this month (based on paidAt if present)
    const revAggr = await prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: { amount: true },
    });
    const monthlyRevenue = revAggr._sum.amount || 0;

    growth.push({
      month: monthLabel,
      newStores: newStoresCount,
      revenue: monthlyRevenue,
    });
  }

  return {
    summary: {
      totalStores,
      totalUsers,
      totalPlans,
      totalRevenue,
      activeStores,
    },
    growth,
    recentStores,
    recentPayments,
    planDistribution,
  };
}
