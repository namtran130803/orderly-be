import { z } from 'zod';
import { SalaryType } from '@prisma/client';

export const createEmployeeSchema = z.object({
  phone: z.string().regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  roleIds: z.array(z.number().int().positive()).min(1, 'Phải chọn ít nhất một vai trò'),
  salaryType: z.nativeEnum(SalaryType).default(SalaryType.MONTHLY),
  baseSalary: z.coerce.number().int().min(0).default(0),
  hourlyRate: z.coerce.number().int().min(0).optional().nullable(),
  // null / [] = dùng lịch cửa hàng; mảng 1–7 = lịch riêng (1=T2…7=CN)
  workDays: z.array(z.number().int().min(1).max(7)).optional().nullable(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const assignRolesSchema = z.object({
  roleIds: z.array(z.number().int().positive()).min(1, 'Phải chọn ít nhất một vai trò'),
});

export type AssignRolesDto = z.infer<typeof assignRolesSchema>;

export const updateSalarySchema = z.object({
  salaryType: z.nativeEnum(SalaryType),
  baseSalary: z.coerce.number().int().min(0),
  hourlyRate: z.coerce.number().int().min(0).optional().nullable(),
  workDays: z.array(z.number().int().min(1).max(7)).optional().nullable(),
});

export type UpdateSalaryDto = z.infer<typeof updateSalarySchema>;
