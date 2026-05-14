import { z } from 'zod';

export const createAreaSchema = z.object({
  name:       z.string().trim().min(1, 'Tên khu vực không được để trống').max(100),
  tableCount: z.number().int().positive('Số lượng bàn phải lớn hơn 0').max(100),
});

export const updateAreaSchema = createAreaSchema.partial().extend({
  newTableName: z.string().trim().optional(),
});

export const reorderAreasSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Danh sách ID không được rỗng'),
});

export const areaParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  areaId:  z.coerce.number().int().positive(),
});

export type CreateAreaDto = z.infer<typeof createAreaSchema>;
export type UpdateAreaDto = z.infer<typeof updateAreaSchema>;
export type ReorderAreasDto = z.infer<typeof reorderAreasSchema>;
