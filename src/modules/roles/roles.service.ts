import { prisma } from "@/config/prisma";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/response";
import { MODULE_DEFS } from "@/config/rbac/rbac-defs";
import type {
  CreateRoleDto,
  UpdateRoleDto,
} from "@/modules/roles/roles.schema";

function getAllApiCodes(): string[] {
  return MODULE_DEFS.flatMap((m) => m.apis.map((a) => a.code));
}

function validatePermissionCodes(codes: string[]) {
  const validCodes = getAllApiCodes();
  const invalid = codes.filter((c) => !validCodes.includes(c));
  if (invalid.length > 0) {
    throw ApiError.badRequest(`Mã quyền không hợp lệ: ${invalid.join(", ")}`);
  }
}

export async function listRoles() {
  return prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMyRoles(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return [];

  return user.userRoles.map((ur) => ({
    id: ur.role.id,
    name: ur.role.name,
    code: ur.role.code,
    isSystem: ur.role.isSystem,
    permissions: ur.role.permissions.map((p) => p.permission.code),
  }));
}

export async function createRole(dto: CreateRoleDto) {
  const existing = await prisma.role.findUnique({ where: { name: dto.name } });
  if (existing) {
    throw ApiError.conflict(`Vai trò '${dto.name}' đã tồn tại`);
  }

  // Use provided code or generate random UUID
  const code = dto.code || crypto.randomUUID().replace(/-/g, "_");

  // Check if code already exists
  const existingCode = await prisma.role.findUnique({ where: { code } });
  if (existingCode) {
    throw ApiError.conflict(`Mã vai trò '${code}' đã tồn tại`);
  }

  if (dto.permissionCodes.length > 0) {
    validatePermissionCodes(dto.permissionCodes);
  }

  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        name: dto.name,
        code,
      },
    });

    if (dto.permissionCodes.length > 0) {
      const permissions = await tx.permission.findMany({
        where: { code: { in: dto.permissionCodes } },
      });

      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
      });
    }

    return tx.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  });
}

export async function updateRole(roleId: number, dto: UpdateRoleDto) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.notFound("Role");

  if (role.isSystem) {
    // Không cho phép đổi tên hoặc mã của vai trò hệ thống
    if (dto.name && dto.name !== role.name) {
      throw ApiError.forbidden("Không thể đổi tên vai trò hệ thống");
    }
    if (dto.code && dto.code !== role.code) {
      throw ApiError.forbidden("Không thể đổi mã vai trò hệ thống");
    }
  }

  if (dto.permissionCodes) {
    validatePermissionCodes(dto.permissionCodes);
  }


  // Check if new code is already taken (if provided and different from current)
  if (dto.code && dto.code !== role.code) {
    const existingCode = await prisma.role.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw ApiError.conflict(`Mã vai trò '${dto.code}' đã tồn tại`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const updateData: Prisma.RoleUpdateInput = {};

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.code) {
      updateData.code = dto.code;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.role.update({
        where: { id: roleId },
        data: updateData,
      });
    }

    if (dto.permissionCodes) {
      await tx.rolePermission.deleteMany({ where: { roleId } });

      if (dto.permissionCodes.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { code: { in: dto.permissionCodes } },
        });

        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId,
            permissionId: p.id,
          })),
        });
      }
    }

    return tx.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  });
}

export async function deleteRole(roleId: number) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.notFound("Role");

  if (role.isSystem) {
    throw ApiError.forbidden(
      `Không thể xóa vai trò hệ thống '${role.name}'. Vai trò này được tạo bởi hệ thống để đảm bảo hoạt động ứng dụng.`,
    );
  }

  await prisma.role.delete({ where: { id: roleId } });
}
