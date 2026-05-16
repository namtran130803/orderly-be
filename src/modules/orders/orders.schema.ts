import { z } from 'zod';
import { paginationSchema } from '@/lib/pagination';

export const orderQuerySchema = paginationSchema.extend({
  statusId: z.coerce.number().int().positive().optional(),
  date:     z.string().date().optional(),
  cursor:   z.coerce.number().int().positive().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.coerce.number().int().positive(),
  qty:        z.number().int().nonnegative('Số lượng không được âm'),
});

export const createOrderSchema = z.object({
  tableName: z.string().optional().nullable(),
  items:     z.array(orderItemInputSchema).min(1, 'Đơn hàng phải có ít nhất 1 món'),
});

export const updateOrderSchema = z.object({
  tableName: z.string().optional().nullable(),
  items:     z.array(orderItemInputSchema),
});

export const changeOrderStatusSchema = z.object({
  fromStatusId: z.coerce.number().int().positive(),
});

export const orderParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  orderId: z.coerce.number().int().positive(),
});

export type OrderQueryDto = z.infer<typeof orderQuerySchema>;
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;
export type ChangeOrderStatusDto = z.infer<typeof changeOrderStatusSchema>;
