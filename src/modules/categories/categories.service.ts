import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { CreateCategoryDto, UpdateCategoryDto } from '@/modules/categories/categories.schema';

async function assertCategoryOwnership(catId: number, storeId: number) {
  const cat = await prisma.category.findUnique({ where: { id: catId } });
  if (!cat) throw ApiError.notFound('Category');
  if (cat.storeId !== storeId) throw ApiError.forbidden();
  return cat;
}

export async function listCategories(storeId: number) {
  return prisma.category.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createCategory(storeId: number, dto: CreateCategoryDto) {
  return prisma.category.create({
    data: {
      storeId,
      name: dto.name,
      sortOrder: dto.sortOrder,
    },
  });
}

export async function updateCategory(storeId: number, catId: number, dto: UpdateCategoryDto) {
  await assertCategoryOwnership(catId, storeId);
  return prisma.category.update({
    where: { id: catId },
    data: dto,
  });
}

export async function deleteCategory(storeId: number, catId: number) {
  await assertCategoryOwnership(catId, storeId);
  await prisma.category.delete({
    where: { id: catId },
  });
}

export async function reorderCategories(storeId: number, categoryIds: number[]) {
  // Update sortOrder for each category based on the order in the array
  const updates = categoryIds.map((id, index) =>
    prisma.category.update({
      where: { id, storeId },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);
}
