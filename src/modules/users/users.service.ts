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

export async function assignRole(userId: number, roleId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User');

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.notFound('Role');

  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });
  if (existing) throw ApiError.conflict('Người dùng đã có vai trò này');

  await prisma.userRole.create({
    data: { userId, roleId },
  });

  return { userId, roleId, role };
}

export async function removeRole(userId: number, roleId: number) {
  const ur = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });
  if (!ur) throw ApiError.notFound('UserRole');

  await prisma.userRole.delete({
    where: { userId_roleId: { userId, roleId } },
  });
}
