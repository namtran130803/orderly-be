import { z } from 'zod';
import { paginationSchema } from '@/lib/pagination';

export const expenseQuerySchema = paginationSchema.extend({
  cursor: z.coerce.number().int().positive().optional(),
  from:   z.string().date().optional(),
  to:     z.string().date().optional(),
});

export const createExpenseSchema = z.object({
  title:       z.string().trim().min(1, 'Tiêu đề không được để trống').max(255),
  description: z.string().trim().max(255).optional().nullable(),
  amount:      z.number().positive('Số tiền chi phải là số dương'),
  rawDate:     z.string().date().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseParamsSchema = z.object({
  storeId:   z.coerce.number().int().positive(),
  expenseId: z.coerce.number().int().positive(),
});

export type ExpenseQueryDto = z.infer<typeof expenseQuerySchema>;
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
