import { z } from 'zod';

export const tableParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});
