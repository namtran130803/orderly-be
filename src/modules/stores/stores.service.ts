import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { DEFAULT_STATUSES } from '@/lib/constants';
import { CreateStoreDto, UpdateStoreDto } from '@/modules/stores/stores.schema';
import { StatusType } from '@prisma/client';

export async function listStores(userId: number) {
  return prisma.store.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createStore(userId: number, dto: CreateStoreDto) {
  // Tạo store và tự động sinh trạng thái quy trình mặc định chuẩn
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

    return store;
  });
}

export async function updateStore(storeId: number, dto: UpdateStoreDto) {
  return prisma.store.update({
    where: { id: storeId },
    data: dto,
  });
}

export async function deleteStore(storeId: number) {
  await prisma.store.delete({
    where: { id: storeId },
  });
}
