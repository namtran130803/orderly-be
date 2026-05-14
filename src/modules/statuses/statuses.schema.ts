import { z } from 'zod';

export const createStatusSchema = z.object({
  name: z.string().trim().min(1, 'Tên trạng thái không được để trống').max(50),
});

export const updateStatusSchema = createStatusSchema;

export const reorderStatusesSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Danh sách ID không được rỗng'),
});

export const statusParamsSchema = z.object({
  storeId:  z.coerce.number().int().positive(),
  statusId: z.coerce.number().int().positive().optional(),
});

export type CreateStatusDto = z.infer<typeof createStatusSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
export type ReorderStatusesDto = z.infer<typeof reorderStatusesSchema>;
