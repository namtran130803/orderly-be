import { z } from 'zod';

export const createEmployeeSchema = z.object({
  phone: z.string().regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  roleIds: z.array(z.number().int().positive()).min(1, 'Phải chọn ít nhất một vai trò'),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const assignRolesSchema = z.object({
  roleIds: z.array(z.number().int().positive()).min(1, 'Phải chọn ít nhất một vai trò'),
});

export type AssignRolesDto = z.infer<typeof assignRolesSchema>;
