import { z } from 'zod';

export const createStoreRoleSchema = z.object({
  name: z.string().min(1, 'Tên vai trò không được để trống'),
  permissionCodes: z.array(z.string()).default([]),
});

export type CreateStoreRoleDto = z.infer<typeof createStoreRoleSchema>;

export const updateStoreRoleSchema = z.object({
  name: z.string().min(1, 'Tên vai trò không được để trống').optional(),
  permissionCodes: z.array(z.string()).optional(),
});

export type UpdateStoreRoleDto = z.infer<typeof updateStoreRoleSchema>;