import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { ExpenseQueryDto, CreateExpenseDto, UpdateExpenseDto } from '@/modules/expenses/expenses.schema';

async function assertExpenseOwnership(invId: number, storeId: number) {
  const inv = await prisma.expense.findUnique({ where: { id: invId } });
  if (!inv) throw ApiError.notFound('Expense');
  if (inv.storeId !== storeId) throw ApiError.forbidden();
  return inv;
}

export async function listExpenses(storeId: number, query: ExpenseQueryDto) {
  const limit = query.limit || 20;
  const whereClause: any = { storeId };

  if (query.from || query.to) {
    whereClause.rawDate = {};
    if (query.from) {
      whereClause.rawDate.gte = new Date(`${query.from}T00:00:00.000Z`);
    }
    if (query.to) {
      whereClause.rawDate.lte = new Date(`${query.to}T23:59:59.999Z`);
    }
  }

  if (query.cursor) {
    whereClause.id = { lt: query.cursor };
  }

  const data = await prisma.expense.findMany({
    where: whereClause,
    orderBy: { id: 'desc' },
    take: limit + 1,
  });

  let nextCursor: number | null = null;
  if (data.length > limit) {
    const lastItem = data.pop();
    nextCursor = lastItem?.id || null;
  }

  return {
    items: data,
    nextCursor,
  };
}

export async function createExpense(storeId: number, dto: CreateExpenseDto) {
  const targetDate = dto.rawDate ? new Date(`${dto.rawDate}T00:00:00.000Z`) : new Date();

  return prisma.expense.create({
    data: {
      storeId,
      title: dto.title,
      description: dto.description ?? null,
      amount: dto.amount,
      rawDate: targetDate,
    },
  });
}

export async function updateExpense(storeId: number, invId: number, dto: UpdateExpenseDto) {
  await assertExpenseOwnership(invId, storeId);

  const updateData: any = {};
  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.amount !== undefined) updateData.amount = dto.amount;
  if (dto.rawDate !== undefined) {
    updateData.rawDate = new Date(`${dto.rawDate}T00:00:00.000Z`);
  }

  return prisma.expense.update({
    where: { id: invId },
    data: updateData,
  });
}

export async function deleteExpense(storeId: number, invId: number) {
  await assertExpenseOwnership(invId, storeId);
  await prisma.expense.delete({
    where: { id: invId },
  });
}
