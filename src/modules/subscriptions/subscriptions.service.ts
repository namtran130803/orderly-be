import { prisma } from "@/config/prisma";
import { env } from "@/config/env";
import { ApiError } from "@/lib/response";
import { createPaginationMeta, getPaginationParams } from "@/lib/pagination";
import {
  PaymentStatus,
  Prisma,
  SubscriptionSource,
  SubscriptionStatus,
} from "@prisma/client";
import { randomBytes } from "crypto";
import type {
  AdminRenewalDto,
  CreateSubscriptionPlanDto,
  StorePeriodsQueryDto,
  SubscriptionHistoryQueryDto,
  UpdateSubscriptionPlanDto,
} from "@/modules/subscriptions/subscriptions.schema";

const TRIAL_DAYS = 7;
type Tx = Prisma.TransactionClient;

export type SubscriptionSnapshot = {
  status: SubscriptionStatus;
  isReadOnly: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function resolveSubscriptionSnapshot(
  subscription?: {
    status: SubscriptionStatus;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  } | null,
  now = new Date(),
): SubscriptionSnapshot {
  const end = subscription?.currentPeriodEnd ?? null;
  const isActiveByDate = !!end && end.getTime() > now.getTime();
  const status = isActiveByDate
    ? subscription!.status === SubscriptionStatus.TRIALING
      ? SubscriptionStatus.TRIALING
      : SubscriptionStatus.ACTIVE
    : SubscriptionStatus.EXPIRED;

  const daysRemaining = end
    ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000))
    : 0;

  return {
    status,
    isReadOnly: status === SubscriptionStatus.EXPIRED,
    currentPeriodStart: subscription?.currentPeriodStart ?? null,
    currentPeriodEnd: end,
    daysRemaining,
  };
}

export async function ensureStoreSubscriptionForNewStore(
  tx: Tx,
  userId: number,
  storeId: number,
) {
  const ownedStoreCount = await tx.store.count({ where: { userId } });
  const existingTrial = await tx.userTrialGrant.findUnique({
    where: { userId },
  });

  if (ownedStoreCount === 1 && !existingTrial) {
    const startsAt = new Date();
    const endsAt = addDays(startsAt, TRIAL_DAYS);

    await tx.storeSubscription.create({
      data: {
        storeId,
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: startsAt,
        currentPeriodEnd: endsAt,
      },
    });
    await tx.userTrialGrant.create({
      data: {
        userId,
        storeId,
        startedAt: startsAt,
        endsAt,
      },
    });
    await tx.subscriptionPeriod.create({
      data: {
        storeId,
        source: SubscriptionSource.TRIAL,
        days: TRIAL_DAYS,
        startsAt,
        endsAt,
      },
    });
    return;
  }

  await tx.storeSubscription.create({
    data: {
      storeId,
      status: SubscriptionStatus.EXPIRED,
    },
  });
}

export async function listPlans() {
  return prisma.subscriptionPlan.findMany({
    where: {
      isActive: true,
    },
    orderBy: { days: "asc" },
  });
}

export async function createPlan(dto: CreateSubscriptionPlanDto) {
  const code = (dto.code?.trim() || `D${dto.days}`).toUpperCase();
  const name = dto.name?.trim() || `Gói ${dto.days} ngày`;
  const note = dto.note?.trim() || "";

  // Check conflict theo code (chỉ active)
  const existingByCode = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, code },
  });
  if (existingByCode) {
    throw ApiError.conflict(`Mã gói "${code}" đã tồn tại`);
  }

  // Nếu có plan inactive cùng code → reactivate
  const inactiveByCode = await prisma.subscriptionPlan.findFirst({
    where: { isActive: false, code },
  });
  if (inactiveByCode) {
    return prisma.subscriptionPlan.update({
      where: { id: inactiveByCode.id },
      data: {
        code,
        name,
        note,
        days: dto.days,
        price: dto.price,
        isActive: true,
      },
    });
  }

  return prisma.subscriptionPlan.create({
    data: {
      code,
      name,
      note,
      days: dto.days,
      price: dto.price,
      isActive: true,
    },
  });
}

export async function updatePlan(planId: number, dto: UpdateSubscriptionPlanDto) {
  const existing = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!existing) throw ApiError.notFound("Subscription plan");

  const code = dto.code?.trim().toUpperCase();
  if (code) {
    const conflict = await prisma.subscriptionPlan.findFirst({
      where: {
        isActive: true,
        id: { not: planId },
        code,
      },
    });
    if (conflict) throw ApiError.conflict(`Mã gói "${code}" đã tồn tại`);
  }

  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...(code ? { code } : {}),
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.note != null ? { note: dto.note.trim() } : {}),
      ...(dto.days ? { days: dto.days } : {}),
      ...(dto.price != null ? { price: dto.price } : {}),
      ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
    },
  });
}

export async function deletePlan(planId: number) {
  const existing = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!existing) throw ApiError.notFound("Subscription plan");

  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isActive: false },
  });
}

export async function getStoreSubscription(storeId: number) {
  const subscription = await prisma.storeSubscription.findUnique({
    where: { storeId },
  });
  const snapshot = resolveSubscriptionSnapshot(subscription);
  return {
    ...snapshot,
    trialUsed: Boolean(
      await prisma.userTrialGrant.findFirst({ where: { storeId } }),
    ),
  };
}

export async function getStoreSubscriptionStatus(storeId: number) {
  const subscription = await prisma.storeSubscription.findUnique({
    where: { storeId },
  });
  const snapshot = resolveSubscriptionSnapshot(subscription);
  return {
    ...snapshot,
    trialUsed: Boolean(
      await prisma.userTrialGrant.findFirst({ where: { storeId } }),
    ),
  };
}



export async function listPeriods(storeId: number) {
  return prisma.subscriptionPeriod.findMany({
    where: { storeId },
    include: {
      payment: {
        select: {
          id: true,
          paymentCode: true,
          amount: true,
          status: true,
          paidAt: true,
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function listStorePeriodsPaginated(
  storeId: number,
  query: StorePeriodsQueryDto,
) {
  const { page, limit, skip, take } = getPaginationParams(query);
  const where: Prisma.SubscriptionPeriodWhereInput = {
    storeId,
    ...(query.source ? { source: query.source } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.subscriptionPeriod.findMany({
      where,
      include: {
        payment: {
          select: {
            id: true,
            paymentCode: true,
            amount: true,
            status: true,
            paidAt: true,
            plan: true,
          },
        },
      },
      orderBy: { startsAt: "desc" },
      skip,
      take,
    }),
    prisma.subscriptionPeriod.count({ where }),
  ]);

  return { items, pagination: createPaginationMeta(page, limit, total) };
}

function dateRange(query: Pick<SubscriptionHistoryQueryDto, "from" | "to">) {
  if (!query.from && !query.to) return undefined;
  return {
    ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000+07:00`) } : {}),
    ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999+07:00`) } : {}),
  };
}


export async function listAllPeriods(query: SubscriptionHistoryQueryDto) {
  const { page, limit, skip, take } = getPaginationParams(query);
  const q = query.q?.trim();
  const startsAt = dateRange(query);
  const where: Prisma.SubscriptionPeriodWhereInput = {
    ...(query.source ? { source: query.source } : {}),
    ...(startsAt ? { startsAt } : {}),
    ...(query.phone
      ? { store: { user: { phone: { contains: query.phone, mode: "insensitive" } } } }
      : {}),
    ...(query.userName
      ? { store: { user: { name: { contains: query.userName, mode: "insensitive" } } } }
      : {}),
    ...(query.storeName
      ? { store: { name: { contains: query.storeName, mode: "insensitive" } } }
      : {}),
    ...(q
      ? {
          OR: [
            { store: { name: { contains: q, mode: "insensitive" } } },
            { store: { user: { name: { contains: q, mode: "insensitive" } } } },
            { store: { user: { phone: { contains: q, mode: "insensitive" } } } },
            { payment: { paymentCode: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.subscriptionPeriod.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        payment: {
          select: {
            id: true,
            paymentCode: true,
            amount: true,
            status: true,
            paidAt: true,
            plan: true,
          },
        },
      },
      orderBy: { startsAt: "desc" },
      skip,
      take,
    }),
    prisma.subscriptionPeriod.count({ where }),
  ]);

  return { items, pagination: createPaginationMeta(page, limit, total) };
}

export async function createCheckout(
  storeId: number,
  userId: number,
  planDays: number,
) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { days: planDays, isActive: true },
  });
  if (!plan) {
    throw ApiError.badRequest("Gói gia hạn không hợp lệ");
  }

  const payment = await prisma.payment.create({
    data: {
      storeId,
      userId,
      planId: plan.id,
      amount: plan.price,
      paymentCode: `${env.PAYMENT_CODE_PREFIX}${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`,
      transferContent: "",
    },
    include: { plan: true },
  });

  const transferContent = payment.paymentCode;
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { transferContent },
    include: { plan: true },
  });

  return {
    payment: updated,
    bank: {
      bankName: env.PAYMENT_BANK_NAME,
      accountNo: env.PAYMENT_BANK_ACCOUNT_NO,
      accountName: env.PAYMENT_BANK_ACCOUNT_NAME,
    },
  };
}

export async function renewFromPaidPayment(paymentId: number, paidAt = new Date()) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });
    if (!payment) throw ApiError.notFound("Payment");
    if (payment.status !== PaymentStatus.PAID) {
      throw ApiError.badRequest("Thanh toán chưa hoàn tất");
    }

    const existingPeriod = await tx.subscriptionPeriod.findFirst({
      where: { paymentId: payment.id },
    });
    if (existingPeriod) return existingPeriod;

    const current = await tx.storeSubscription.findUnique({
      where: { storeId: payment.storeId },
    });
    const currentSnapshot = resolveSubscriptionSnapshot(current, paidAt);
    const startsAt =
      currentSnapshot.currentPeriodEnd &&
      currentSnapshot.currentPeriodEnd.getTime() > paidAt.getTime()
        ? currentSnapshot.currentPeriodEnd
        : paidAt;
    const endsAt = addDays(startsAt, payment.plan.days);

    await tx.storeSubscription.upsert({
      where: { storeId: payment.storeId },
      update: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: startsAt,
        currentPeriodEnd: endsAt,
      },
      create: {
        storeId: payment.storeId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: startsAt,
        currentPeriodEnd: endsAt,
      },
    });

    return tx.subscriptionPeriod.create({
      data: {
        storeId: payment.storeId,
        paymentId: payment.id,
        source: SubscriptionSource.PAYMENT,
        days: payment.plan.days,
        startsAt,
        endsAt,
      },
    });
  });
}

export async function createAdminRenewal(dto: AdminRenewalDto) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({
      where: { id: dto.storeId },
      select: { id: true },
    });
    if (!store) throw ApiError.notFound("Store");

    const current = await tx.storeSubscription.findUnique({
      where: { storeId: dto.storeId },
    });
    const currentSnapshot = resolveSubscriptionSnapshot(current, now);
    const startsAt =
      currentSnapshot.currentPeriodEnd &&
      currentSnapshot.currentPeriodEnd.getTime() > now.getTime()
        ? currentSnapshot.currentPeriodEnd
        : now;
    const endsAt = addDays(startsAt, dto.days);

    await tx.storeSubscription.upsert({
      where: { storeId: dto.storeId },
      update: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: startsAt,
        currentPeriodEnd: endsAt,
      },
      create: {
        storeId: dto.storeId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: startsAt,
        currentPeriodEnd: endsAt,
      },
    });

    return tx.subscriptionPeriod.create({
      data: {
        storeId: dto.storeId,
        source: SubscriptionSource.ADMIN_ADJUSTMENT,
        days: dto.days,
        startsAt,
        endsAt,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
  });
}
