import { prisma } from '@/config/prisma';
import { DEFAULT_STATUSES } from '@/lib/constants';
import { CreateStoreDto, UpdateStoreDto } from '@/modules/stores/stores.schema';
import { StatusType, StoreUserRoleType } from '@prisma/client';
import { ROLE_DEFS } from '@/config/rbac/rbac-defs';

export async function listStores(userId: number) {
  const storeUsers = await prisma.storeUser.findMany({
    where: { userId },
    orderBy: {
      store: {
        createdAt: 'desc',
      },
    },
    include: {
      store: true,
      roles: {
        include: {
          storeRole: true,
        },
      },
    },
  });

  return storeUsers.map((su) => ({
    id: su.store.id,
    name: su.store.name,
    address: su.store.address,
    roleName: su.roles.map((r) => r.storeRole.name),
  }));
}

export async function createStore(userId: number, dto: CreateStoreDto) {
  return prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        userId,
        name: dto.name,
        address: dto.address,
      },
    });

    await tx.status.createMany({
      data: [
        { storeId: store.id, name: DEFAULT_STATUSES.START, type: StatusType.start, sortOrder: 1 },
        { storeId: store.id, name: DEFAULT_STATUSES.END, type: StatusType.end, sortOrder: 20 },
      ],
    });

    await tx.storeUser.create({
      data: {
        userId,
        storeId: store.id,
        role: StoreUserRoleType.owner,
      },
    });

    // Gán role hệ thống "Chủ cửa hàng" (nếu chưa có)
    const storeOwnerRole = await tx.role.findUnique({
      where: { code: ROLE_DEFS.STORE_OWNER.code },
    });
    if (storeOwnerRole) {
      const hasRole = await tx.userRole.findFirst({
        where: { userId, roleId: storeOwnerRole.id },
      });
      if (!hasRole) {
        await tx.userRole.create({
          data: {
            userId,
            roleId: storeOwnerRole.id,
          },
        });
      }
    }

    // Trả về cùng format như listStores
    return {
      id: store.id,
      name: store.name,
      address: store.address,
      roleName: [], // Owner không có storeRoles
    };
  });
}

export async function updateStore(storeId: number, userId: number, dto: UpdateStoreDto) {
  const store = await prisma.store.update({
    where: { id: storeId },
    data: dto,
  });

  // Lấy roles của user trong store
  const storeUser = await prisma.storeUser.findFirst({
    where: { storeId, userId },
    include: {
      roles: {
        include: {
          storeRole: true,
        },
      },
    },
  });

  // Trả về cùng format như listStores
  return {
    id: store.id,
    name: store.name,
    address: store.address,
    roleName: storeUser?.roles.map((r) => r.storeRole.name) ?? [],
  };
}

export async function deleteStore(storeId: number) {
  await prisma.store.delete({
    where: { id: storeId },
  });
}
