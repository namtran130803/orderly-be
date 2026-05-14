import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env';

const globalForPrisma = global as unknown as { prisma: any };

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

export const prisma = basePrisma.$extends({
  query: {
    order: {
      async create({ args, query }: any) {
        const order = await query(args);
        if (order.tableId) {
          await basePrisma.table.update({
            where: { id: order.tableId },
            data: { orderId: order.id },
          });
        }
        return order;
      },
    },
  },
}) as unknown as PrismaClient;

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;
