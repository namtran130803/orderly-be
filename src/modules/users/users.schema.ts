import { z } from 'zod';

export const assignRoleSchema = z.object({
  roleId: z.number().int().positive('Vai trò không hợp lệ'),
});

export const userRoleParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const userRoleDeleteParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
  roleId: z.coerce.number().int().positive(),
});

export type AssignRoleDto = z.infer<typeof assignRoleSchema>;
