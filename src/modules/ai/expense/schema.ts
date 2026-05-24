import { z } from 'zod';

export const analyzeExpenseSchema = z.object({
  image: z.string().min(1, 'Ảnh không được để trống'),
});

export const generateExpenseSchema = z.object({
  description: z.string().trim().min(1, 'Mô tả không được để trống'),
});

export type AnalyzeExpenseDto = z.infer<typeof analyzeExpenseSchema>;
export type GenerateExpenseDto = z.infer<typeof generateExpenseSchema>;
