import { z } from 'zod';

export const storeParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export const payrollMonthQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export type PayrollMonthQueryDto = z.infer<typeof payrollMonthQuerySchema>;

export const payrollEmployeeParamsSchema = storeParamsSchema.extend({
  employeeId: z.coerce.number().int().positive(),
});

export type PayrollEmployeeParamsDto = z.infer<typeof payrollEmployeeParamsSchema>;
