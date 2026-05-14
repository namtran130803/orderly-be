import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  from: z.string().date('Định dạng ngày bắt đầu không hợp lệ'),
  to:   z.string().date('Định dạng ngày kết thúc không hợp lệ'),
});

export const dashboardParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
