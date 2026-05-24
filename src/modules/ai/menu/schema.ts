import { z } from 'zod';

export const analyzeMenuSchema = z.object({
  image: z.string().min(1, 'Ảnh không được để trống'),
});

export const generateMenuSchema = z.object({
  description: z.string().min(1, 'Mô tả không được để trống'),
  mode: z.enum(['replace', 'append']).default('replace'),
});

export type AnalyzeMenuDto = z.infer<typeof analyzeMenuSchema>;
export type GenerateMenuDto = z.infer<typeof generateMenuSchema>;
