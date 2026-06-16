import { z } from 'zod';
import { paginationSchema } from '@/lib/pagination';

export const assignRoleSchema = z.object({
  roleIds: z
    .array(z.number().int().positive('Vai trò không hợp lệ'))
    .min(1, 'Phải chọn ít nhất một vai trò'),
});

export const userListQuerySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  storeName: z.string().trim().optional(),
});

export const userRoleParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export type AssignRolesDto = z.infer<typeof assignRoleSchema>;
export type UserListQueryDto = z.infer<typeof userListQuerySchema>;
