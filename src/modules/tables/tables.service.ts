import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';

export async function listTables(storeId: number) {
  return prisma.table.findMany({
    where: { area: { storeId } },
    include: { area: { select: { id: true, name: true } } },
    orderBy: [{ area: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
  });
}

export async function updateTable(storeId: number, tableId: number, name: string) {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { area: true },
  });
  if (!table) throw ApiError.notFound('Bàn');
  if (table.area.storeId !== storeId) throw ApiError.forbidden();

  return prisma.table.update({
    where: { id: tableId },
    data: { name },
  });
}

export async function deleteTable(storeId: number, tableId: number) {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { area: true },
  });
  if (!table) throw ApiError.notFound('Bàn');
  if (table.area.storeId !== storeId) throw ApiError.forbidden();

  await prisma.table.delete({
    where: { id: tableId },
  });
}
