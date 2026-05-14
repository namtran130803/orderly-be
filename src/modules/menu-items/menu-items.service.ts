import { prisma }  from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { CreateMenuItemDto, UpdateMenuItemDto } from '@/modules/menu-items/menu-items.schema';

// Kiểm tra category thuộc đúng store
async function assertCategoryBelongsToStore(categoryId: number, storeId: number) {
  const cat = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!cat) throw ApiError.notFound('Category');
  if (cat.storeId !== storeId) throw ApiError.forbidden();
  return cat;
}

export async function listMenuItems(storeId: number) {
  return prisma.menuItem.findMany({
    where: { category: { storeId } },
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
  });
}

export async function createMenuItem(storeId: number, dto: CreateMenuItemDto) {
  await assertCategoryBelongsToStore(dto.categoryId, storeId);
  return prisma.menuItem.create({ data: dto });
}

export async function updateMenuItem(
  storeId: number,
  itemId: number,
  dto: UpdateMenuItemDto,
) {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) throw ApiError.notFound('MenuItem');

  // Kiểm tra item thuộc store qua category
  const cat = await prisma.category.findUnique({ where: { id: item.categoryId } });
  if (cat?.storeId !== storeId) throw ApiError.forbidden();

  if (dto.categoryId) {
    await assertCategoryBelongsToStore(dto.categoryId, storeId);
  }

  return prisma.menuItem.update({ where: { id: itemId }, data: dto });
}

export async function deleteMenuItem(storeId: number, itemId: number) {
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: true },
  });
  if (!item) throw ApiError.notFound('MenuItem');
  if (item.category.storeId !== storeId) throw ApiError.forbidden();

  await prisma.menuItem.delete({ where: { id: itemId } });
}
