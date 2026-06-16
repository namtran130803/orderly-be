import { prisma } from '@/config/prisma';
import { createPaginationMeta, getPaginationParams } from '@/lib/pagination';
import { ApiError } from '@/lib/response';
import type { UserListQueryDto } from '@/modules/users/users.schema';
import type { Prisma } from '@prisma/client';

export async function listUsers(query: UserListQueryDto) {
  const { page, limit, skip, take } = getPaginationParams(query);
  const q = query.q?.trim();
  const where: Prisma.UserWhereInput = {
    ...(query.name
      ? { name: { contains: query.name, mode: 'insensitive' } }
      : {}),
    ...(query.phone
      ? { phone: { contains: query.phone, mode: 'insensitive' } }
      : {}),
    ...(query.storeName
      ? {
          stores: {
            some: { name: { contains: query.storeName, mode: 'insensitive' } },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { stores: { some: { name: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        stores: {
          select: {
            id: true,
            name: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, pagination: createPaginationMeta(page, limit, total) };
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
