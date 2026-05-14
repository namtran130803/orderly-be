import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name:       z.string().trim().min(1, 'Tên không được để trống').max(150),
  price:      z.number().int().positive('Giá phải là số dương'),
  categoryId: z.coerce.number().int().positive(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const menuItemParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  itemId:  z.coerce.number().int().positive(),
});

// Type inference — dùng thẳng trong controller/service
export type CreateMenuItemDto = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemDto = z.infer<typeof updateMenuItemSchema>;
