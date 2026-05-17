import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Tên vai trò không được để trống").max(100),
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9_]+$/,
      "Code chỉ được chứa chữ cái thường, số và dấu gạch dưới",
    )
    .optional(),
  permissionCodes: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9_]+$/,
      "Code chỉ được chứa chữ cái thường, số và dấu gạch dưới",
    )
    .optional(),
  permissionCodes: z.array(z.string()).optional(),
});

export const roleParamsSchema = z.object({
  roleId: z.coerce.number().int().positive(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
