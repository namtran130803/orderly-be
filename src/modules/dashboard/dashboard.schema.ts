import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  from: z.string(),
  to:   z.string(),
});

export const dashboardParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
