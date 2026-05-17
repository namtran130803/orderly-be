import { prisma } from '@/config/prisma';
import { StoreUserRoleType } from '@prisma/client';
import { ApiError } from '@/lib/response';
import type { CreateEmployeeDto, AssignRolesDto } from '@/modules/employees/employees.schema';

export async function listEmployees(storeId: number) {
  return prisma.storeUser.findMany({
    where: { storeId, role: StoreUserRoleType.employee },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createEmployee(storeId: number, userPermissions: string[], dto: CreateEmployeeDto) {
  const user = await prisma.user.findUnique({
    where: { phone: dto.phone },
  });

  if (!user) {
    throw ApiError.notFound('Tài khoản với số điện thoại này chưa được đăng ký hệ thống');
  }

  const existingStoreUser = await prisma.storeUser.findFirst({
    where: { userId: user.id, storeId },
  });

  if (existingStoreUser) {
    throw ApiError.conflict('Người dùng này đã là nhân viên của cửa hàng');
  }

  return prisma.$transaction(async (tx) => {
    const storeUser = await tx.storeUser.create({
      data: {
        userId: user.id,
        storeId,
        role: StoreUserRoleType.employee,
      },
    });

    const validRoles = await tx.storeRole.findMany({
      where: { id: { in: dto.roleIds }, storeId },
    });

    if (validRoles.length !== dto.roleIds.length) {
      throw ApiError.badRequest('Một hoặc nhiều vai trò không tồn tại trong cửa hàng này');
    }

    const rolePerms = await tx.storeRolePermission.findMany({
      where: { storeRoleId: { in: dto.roleIds } },
      include: { permission: true },
    });
    const rolePermCodes = [...new Set(rolePerms.map((rp) => rp.permission.code))];
    const invalidPerms = rolePermCodes.filter((p) => !userPermissions.includes(p));
    if (invalidPerms.length > 0) {
      throw ApiError.forbidden(`Bạn không có quyền: ${invalidPerms.join(', ')}`);
    }

    await tx.storeUserRole.createMany({
      data: dto.roleIds.map((roleId) => ({
        storeUserId: storeUser.id,
        storeRoleId: roleId,
      })),
    });

    const result = await tx.storeUser.findUnique({
      where: { id: storeUser.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
        roles: {
          include: {
            storeRole: {
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

    return result!;
  });
}

export async function assignRoles(
  storeId: number,
  employeeId: number,
  userPermissions: string[],
  dto: AssignRolesDto,
) {
  const storeUser = await prisma.storeUser.findFirst({
    where: { id: employeeId, storeId, role: StoreUserRoleType.employee },
  });
  if (!storeUser) throw ApiError.notFound('Nhân viên');

  if (dto.roleIds.length > 0) {
    const validRoles = await prisma.storeRole.findMany({
      where: { id: { in: dto.roleIds }, storeId },
    });
    const validRoleIds = validRoles.map((r) => r.id);

    const rolePerms = await prisma.storeRolePermission.findMany({
      where: { storeRoleId: { in: validRoleIds } },
      include: { permission: true },
    });
    const rolePermCodes = [...new Set(rolePerms.map((rp) => rp.permission.code))];
    const invalidPerms = rolePermCodes.filter((p) => !userPermissions.includes(p));
    if (invalidPerms.length > 0) {
      throw ApiError.forbidden(`Bạn không có quyền: ${invalidPerms.join(', ')}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.storeUserRole.deleteMany({ where: { storeUserId: employeeId } });

    if (dto.roleIds.length > 0) {
      const validRoles = await tx.storeRole.findMany({
        where: { id: { in: dto.roleIds }, storeId },
      });

      await tx.storeUserRole.createMany({
        data: validRoles.map((role) => ({
          storeUserId: employeeId,
          storeRoleId: role.id,
        })),
      });
    }

    const result = await tx.storeUser.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
        roles: {
          include: {
            storeRole: {
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

    return result!;
  });
}

export async function removeRole(storeId: number, employeeId: number, roleId: number) {
  const storeUser = await prisma.storeUser.findFirst({
    where: { id: employeeId, storeId, role: StoreUserRoleType.employee },
  });
  if (!storeUser) throw ApiError.notFound('Nhân viên');

  await prisma.storeUserRole.deleteMany({
    where: {
      storeUserId: employeeId,
      storeRoleId: roleId,
    },
  });
}

export async function getEmployeeRoles(storeId: number, employeeId: number) {
  const storeUser = await prisma.storeUser.findFirst({
    where: { id: employeeId, storeId, role: StoreUserRoleType.employee },
    select: { id: true },
  });
  if (!storeUser) throw ApiError.notFound('Nhân viên');

  const roles = await prisma.storeUserRole.findMany({
    where: { storeUserId: employeeId },
    select: {
      storeRole: {
        select: {
          id: true,
          name: true,
          permissions: {
            select: {
              permission: {
                select: { code: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  return roles.map((er) => ({
    id: er.storeRole.id,
    name: er.storeRole.name,
    permissions: er.storeRole.permissions.map((p) => ({
      code: p.permission.code,
      name: p.permission.name,
    })),
  }));
}