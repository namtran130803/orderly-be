import { z } from 'zod';

export const createCategorySchema = z.object({
  name:      z.string().trim().min(1, 'Tên danh mục không được để trống').max(100),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  catId:   z.coerce.number().int().positive(),
});

export const reorderCategoriesSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'Phải có ít nhất 1 danh mục'),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesDto = z.infer<typeof reorderCategoriesSchema>;
