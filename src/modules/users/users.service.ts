import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserRoles(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw ApiError.notFound('User');

  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          id: true,
          name: true,
          code: true,
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

  return roles.map((ur) => ({
    id: ur.role.id,
    name: ur.role.name,
    code: ur.role.code,
    permissions: ur.role.permissions.map((rp) => ({
      code: rp.permission.code,
      name: rp.permission.name,
    })),
  }));
}

export async function assignRoles(userId: number, roleIds: number[]) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User');

  if (roleIds.length > 0) {
    const validRoles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });
    if (validRoles.length !== roleIds.length) {
      throw ApiError.badRequest('Một hoặc nhiều vai trò hệ thống không tồn tại');
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });

    if (roleIds.length > 0) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      });
    }

    const assignedRoles = await tx.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return assignedRoles.map((ur) => ur.role);
  });
}
