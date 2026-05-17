import { z } from 'zod';

export const createStoreSchema = z.object({
  name:    z.string().trim().min(1, 'Tên cửa hàng không được để trống').max(150),
  address: z.string().trim().max(255).optional().nullable(),
  userId:  z.number().int().positive().optional(),
});

export const updateStoreSchema = createStoreSchema.partial();

export const storeParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export type CreateStoreDto = z.infer<typeof createStoreSchema>;
export type UpdateStoreDto = z.infer<typeof updateStoreSchema>;
