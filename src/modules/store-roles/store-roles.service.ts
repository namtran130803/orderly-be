import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { MODULE_DEFS, ROLE_DEFS, type ModuleDef } from '@/config/rbac/rbac-defs';
import type { CreateStoreRoleDto, UpdateStoreRoleDto } from '@/modules/store-roles/store-roles.schema';

export async function getStoreOwnerModules(): Promise<ModuleDef[]> {
  const role = await prisma.role.findUnique({
    where: { code: ROLE_DEFS.STORE_OWNER.code },
    include: {
      permissions: { include: { permission: true } },
    },
  });
  if (!role) return [];

  const ownerPermCodes = new Set(
    role.permissions.map((rp) => rp.permission.code),
  );

  return MODULE_DEFS.filter((m) =>
    m.apis.some((a) => ownerPermCodes.has(a.code)),
  ).map((m) => ({
    ...m,
    apis: m.apis.filter((a) => ownerPermCodes.has(a.code)),
  }));
}

export async function listStoreRoles(storeId: number) {
  return prisma.storeRole.findMany({
    where: { storeId },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
    orderBy: { id: 'asc' },
  });
}

export async function createStoreRole(storeId: number, userPermissions: string[], dto: CreateStoreRoleDto) {
  const existing = await prisma.storeRole.findFirst({
    where: { storeId, name: dto.name },
  });
  if (existing) {
    throw ApiError.conflict(`Vai trò '${dto.name}' đã tồn tại trong cửa hàng`);
  }

  if (dto.permissionCodes.length > 0) {
    const invalidPerms = dto.permissionCodes.filter((p) => !userPermissions.includes(p));
    if (invalidPerms.length > 0) {
      throw ApiError.forbidden(`Bạn không có quyền: ${invalidPerms.join(', ')}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const role = await tx.storeRole.create({
      data: {
        storeId,
        name: dto.name,
      },
    });

    if (dto.permissionCodes.length > 0) {
      const permissions = await tx.permission.findMany({
        where: { code: { in: dto.permissionCodes } },
      });

      await tx.storeRolePermission.createMany({
        data: permissions.map((p) => ({
          storeRoleId: role.id,
          permissionId: p.id,
        })),
      });
    }

    return tx.storeRole.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  });
}

export async function updateStoreRole(
  storeId: number,
  roleId: number,
  userPermissions: string[],
  dto: UpdateStoreRoleDto,
) {
  const role = await prisma.storeRole.findFirst({
    where: { id: roleId, storeId },
  });
  if (!role) throw ApiError.notFound('Vai trò');

  if (dto.name && dto.name !== role.name) {
    const existing = await prisma.storeRole.findFirst({
      where: { storeId, name: dto.name },
    });
    if (existing) {
      throw ApiError.conflict(`Vai trò '${dto.name}' đã tồn tại trong cửa hàng`);
    }
  }

  if (dto.permissionCodes) {
    const invalidPerms = dto.permissionCodes.filter((p) => !userPermissions.includes(p));
    if (invalidPerms.length > 0) {
      throw ApiError.forbidden(`Bạn không có quyền: ${invalidPerms.join(', ')}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    if (dto.name) {
      await tx.storeRole.update({
        where: { id: roleId },
        data: { name: dto.name },
      });
    }

    if (dto.permissionCodes !== undefined) {
      await tx.storeRolePermission.deleteMany({ where: { storeRoleId: roleId } });

      if (dto.permissionCodes.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { code: { in: dto.permissionCodes } },
        });

        await tx.storeRolePermission.createMany({
          data: permissions.map((p) => ({
            storeRoleId: roleId,
            permissionId: p.id,
          })),
        });
      }
    }

    return tx.storeRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  });
}

export async function deleteStoreRole(storeId: number, roleId: number) {
  const role = await prisma.storeRole.findFirst({
    where: { id: roleId, storeId },
  });
  if (!role) throw ApiError.notFound('Vai trò');

  await prisma.storeRole.delete({ where: { id: roleId } });
}