import { z } from 'zod';

export const assignRoleSchema = z.object({
  roleIds: z.array(z.number().int().positive('Vai trò không hợp lệ')).min(1, 'Phải chọn ít nhất một vai trò'),
});

export const userRoleParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export type AssignRolesDto = z.infer<typeof assignRoleSchema>;
