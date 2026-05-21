import { prisma } from '@/config/prisma';
import { Prisma } from '@prisma/client';
import { ApiError } from '@/lib/response';
import { formatVnDateString, todayVnDateString } from '@/lib/date-vn';
import { ExpenseQueryDto, CreateExpenseDto, UpdateExpenseDto } from '@/modules/expenses/expenses.schema';

async function assertExpenseOwnership(invId: number, storeId: number) {
  const inv = await prisma.expense.findUnique({ where: { id: invId } });
  if (!inv) throw ApiError.notFound('Expense');
  if (inv.storeId !== storeId) throw ApiError.forbidden();
  return inv;
}

export async function listExpenses(storeId: number, query: ExpenseQueryDto) {
  const limit = query.limit || 20;
  const whereClause: Prisma.ExpenseWhereInput = { storeId };

  if (query.from || query.to) {
    whereClause.rawDate = {};
    if (query.from) {
      (whereClause.rawDate as any).gte = new Date(`${query.from}T00:00:00.000Z`);
    }
    if (query.to) {
      (whereClause.rawDate as any).lte = new Date(`${query.to}T23:59:59.999Z`);
    }
  }

  if (query.cursor) {
    const cursorItem = await prisma.expense.findUnique({
      where: { id: query.cursor },
      select: { rawDate: true, id: true },
    });
    if (cursorItem) {
      (whereClause as any).OR = [
        { rawDate: { lt: cursorItem.rawDate } },
        { rawDate: cursorItem.rawDate, id: { lt: cursorItem.id } },
      ];
    }
  }

  const data = await prisma.expense.findMany({
    where: whereClause,
    orderBy: [{ rawDate: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  let nextCursor: number | null = null;
  if (data.length > limit) {
    const lastItem = data.pop();
    nextCursor = lastItem?.id || null;
  }

  return { items: data, nextCursor };
}

export async function createExpense(storeId: number, dto: CreateExpenseDto) {
  // Ngày theo VN: nếu không có rawDate thì dùng hôm nay theo giờ VN
  const dateStr = dto.rawDate ?? todayVnDateString();
  const targetDate = new Date(`${dateStr}T00:00:00.000+07:00`);

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
  const expense = await assertExpenseOwnership(invId, storeId);

  const updateData: Prisma.ExpenseUpdateInput = {};
  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.amount !== undefined) updateData.amount = dto.amount;
  if (dto.rawDate !== undefined) {
    const existingDateStr = formatVnDateString(expense.rawDate);
    if (dto.rawDate !== existingDateStr) {
      // Ngày theo VN +07:00
      updateData.rawDate = new Date(`${dto.rawDate}T00:00:00.000+07:00`);
    }
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
