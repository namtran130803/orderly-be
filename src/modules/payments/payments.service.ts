import { prisma } from "@/config/prisma";
import type { ListPaymentsQueryDto } from "./payments.schema";

export async function listPayments(query: ListPaymentsQueryDto) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.storeId) {
    where.storeId = query.storeId;
  }

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) {
      where.createdAt.gte = new Date(`${query.from}T00:00:00.000+07:00`);
    }
    if (query.to) {
      where.createdAt.lte = new Date(`${query.to}T23:59:59.999+07:00`);
    }
  }

  if (query.phone) {
    where.user = {
      ...where.user,
      phone: { contains: query.phone, mode: "insensitive" },
    };
  }

  if (query.userName) {
    where.user = {
      ...where.user,
      name: { contains: query.userName, mode: "insensitive" },
    };
  }

  if (query.storeName) {
    where.store = {
      ...where.store,
      name: { contains: query.storeName, mode: "insensitive" },
    };
  }

  const q = query.q?.trim();
  if (q) {
    where.OR = [
      { paymentCode: { contains: q, mode: "insensitive" } },
      { transferContent: { contains: q, mode: "insensitive" } },
      { user: { phone: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { store: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            days: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
