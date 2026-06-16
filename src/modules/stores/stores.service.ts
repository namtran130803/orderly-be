import { prisma } from "@/config/prisma";
import { ROLE_DEFS } from "@/config/rbac/rbac-defs";
import { DEFAULT_STATUSES } from "@/lib/constants";
import { CreateStoreDto, UpdateStoreDto } from "@/modules/stores/stores.schema";
import {
  ensureStoreSubscriptionForNewStore,
  resolveSubscriptionSnapshot,
} from "@/modules/subscriptions/subscriptions.service";
import { StatusType, StoreUserRoleType } from "@prisma/client";

export async function listStores(userId: number) {
  const storeUsers = await prisma.storeUser.findMany({
    where: { userId },
    orderBy: {
      store: {
        createdAt: "desc",
      },
    },
    include: {
      store: { include: { subscription: true } },
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
    userId: su.store.userId,
    createdAt: su.store.createdAt,
    roleName: su.roles.map((r) => r.storeRole.name),
    subscription: resolveSubscriptionSnapshot(su.store.subscription),
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
        {
          storeId: store.id,
          name: DEFAULT_STATUSES.START,
          type: StatusType.start,
          sortOrder: 1,
        },
        {
          storeId: store.id,
          name: DEFAULT_STATUSES.END,
          type: StatusType.end,
          sortOrder: 20,
        },
      ],
    });

    await tx.storeUser.create({
      data: {
        userId,
        storeId: store.id,
        role: StoreUserRoleType.owner,
      },
    });

    await ensureStoreSubscriptionForNewStore(tx, userId, store.id);

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

    const subscription = await tx.storeSubscription.findUnique({
      where: { storeId: store.id },
    });

    return {
      id: store.id,
      name: store.name,
      address: store.address,
      userId: store.userId,
      createdAt: store.createdAt,
      roleName: [],
      subscription: resolveSubscriptionSnapshot(subscription),
    };
  });
}

export async function updateStore(
  storeId: number,
  userId: number,
  dto: UpdateStoreDto,
) {
  const store = await prisma.store.update({
    where: { id: storeId },
    data: dto,
  });

  const [storeUser, subscription] = await Promise.all([
    prisma.storeUser.findFirst({
      where: { storeId, userId },
      include: {
        roles: {
          include: {
            storeRole: true,
          },
        },
      },
    }),
    prisma.storeSubscription.findUnique({ where: { storeId } }),
  ]);

  return {
    id: store.id,
    name: store.name,
    address: store.address,
    userId: store.userId,
    createdAt: store.createdAt,
    roleName: storeUser?.roles.map((r) => r.storeRole.name) ?? [],
    subscription: resolveSubscriptionSnapshot(subscription),
  };
}

export async function deleteStore(storeId: number) {
  await prisma.store.delete({
    where: { id: storeId },
  });
}

