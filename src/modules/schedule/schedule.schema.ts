import { z } from 'zod';
import { OverrideType } from '@prisma/client';

export const storeParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export const updateDefaultWorkDaysSchema = z.object({
  defaultWorkDays: z
    .array(z.number().int().min(1).max(7))
    .min(1, 'Chọn ít nhất một ngày trong tuần'),
});

export const createOverrideSchema = z.object({
  date: z.string().date('Ngày không hợp lệ'),
  type: z.nativeEnum(OverrideType),
});

export const overrideParamsSchema = storeParamsSchema.extend({
  overrideId: z.coerce.number().int().positive(),
});

export type UpdateDefaultWorkDaysDto = z.infer<typeof updateDefaultWorkDaysSchema>;
export type CreateOverrideDto = z.infer<typeof createOverrideSchema>;
