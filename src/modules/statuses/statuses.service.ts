import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { CreateStatusDto, UpdateStatusDto, ReorderStatusesDto } from '@/modules/statuses/statuses.schema';
import { StatusType } from '@prisma/client';

async function assertNoActiveOrders(storeId: number) {
  const activeOrder = await prisma.order.findFirst({
    where: {
      storeId,
      items: {
        some: {
          status: {
            type: { in: ['start', 'mid'] },
          },
        },
      },
    },
  });
  if (activeOrder) {
    throw ApiError.badRequest('Không thể thay đổi quy trình khi đang có đơn hàng đang xử lý');
  }
}

async function assertStatusOwnership(statusId: number, storeId: number) {
  const status = await prisma.status.findUnique({ where: { id: statusId } });
  if (!status) throw ApiError.notFound('Status');
  if (status.storeId !== storeId) throw ApiError.forbidden();
  return status;
}

export async function listStatuses(storeId: number) {
  return prisma.status.findMany({
    where: { storeId },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createStatus(storeId: number, dto: CreateStatusDto) {
  await assertNoActiveOrders(storeId);

  return prisma.$transaction(async (tx) => {
    // Lấy tất cả trạng thái hiện tại
    const currentStatuses = await tx.status.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });

    const midCount = currentStatuses.filter((s) => s.type === StatusType.mid).length;
    if (midCount >= 18) {
      throw ApiError.badRequest('Chỉ được tạo tối đa 18 trạng thái xử lý trung gian');
    }

    // Tìm trạng thái end (luôn ở cuối)
    const endIndex = currentStatuses.findIndex((s) => s.type === StatusType.end);
    if (endIndex === -1) throw ApiError.internal('Hệ thống lỗi: Không tìm thấy trạng thái kết thúc');

    // Tạo đối tượng status mới dạng mid
    const newStatusPlaceholder = {
      id: 'NEW_TEMP_ID',
      storeId,
      name: dto.name,
      type: StatusType.mid,
      sortOrder: 0, // Sẽ được tính lại ngay sau đây
    };

    // Chèn vào trước trạng thái end
    const updatedList = [
      ...currentStatuses.slice(0, endIndex),
      newStatusPlaceholder as any,
      ...currentStatuses.slice(endIndex),
    ];

    // Để tránh xung đột unique constraint trên [storeId, sortOrder],
    // ta dời các bản ghi hiện tại sang dải giá trị an toàn (+1000)
    for (const s of currentStatuses) {
      await tx.status.update({
        where: { id: s.id },
        data: { sortOrder: s.sortOrder + 1000 },
      });
    }

    let createdStatusHolder: any = null;

    // Gán lại sortOrder chuẩn: start là 1, end là 20, các mid ở giữa lần lượt là 2, 3, 4... (tối đa 19)
    for (let i = 0; i < updatedList.length; i++) {
      const item = updatedList[i];
      let newOrder = 0;
      if (i === 0) {
        newOrder = 1; // start
      } else if (i === updatedList.length - 1) {
        newOrder = 20; // end
      } else {
        newOrder = i + 1; // mid (2 đến 19)
      }

      if (item.id === 'NEW_TEMP_ID') {
        createdStatusHolder = await tx.status.create({
          data: {
            storeId,
            name: item.name,
            type: StatusType.mid,
            sortOrder: newOrder,
          },
        });
      } else {
        await tx.status.update({
          where: { id: item.id },
          data: { sortOrder: newOrder },
        });
      }
    }

    return createdStatusHolder;
  });
}

export async function updateStatus(storeId: number, statusId: number, dto: UpdateStatusDto) {
  await assertStatusOwnership(statusId, storeId);
  // Chỉ cho phép sửa tên
  return prisma.status.update({
    where: { id: statusId },
    data: { name: dto.name },
  });
}

export async function reorderStatuses(storeId: number, dto: ReorderStatusesDto) {
  await assertNoActiveOrders(storeId);

  return prisma.$transaction(async (tx) => {
    const currentStatuses = await tx.status.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });

    const startStatus = currentStatuses.find((s) => s.type === StatusType.start);
    const endStatus = currentStatuses.find((s) => s.type === StatusType.end);
    const midStatuses = currentStatuses.filter((s) => s.type === StatusType.mid);

    if (!startStatus || !endStatus) {
      throw ApiError.internal('Cấu trúc quy trình không hợp lệ');
    }

    // Kiểm tra danh sách ID truyền vào có khớp chính xác với các trạng thái mid hiện tại không
    const midIds = new Set(midStatuses.map((s) => s.id));
    const inputIds = dto.ids;

    if (inputIds.length !== midIds.size || !inputIds.every((id) => midIds.has(id))) {
      throw ApiError.badRequest('Danh sách ID sắp xếp không khớp với các trạng thái trung gian hiện tại');
    }

    // Tạo mảng mid theo thứ tự mới
    const midMap = new Map(midStatuses.map((s) => [s.id, s]));
    const reorderedMids = inputIds.map((id) => midMap.get(id)!);

    const finalOrderList = [startStatus, ...reorderedMids, endStatus];

    // Dời dải giá trị sang an toàn tránh xung đột unique
    for (const s of currentStatuses) {
      await tx.status.update({
        where: { id: s.id },
        data: { sortOrder: s.sortOrder + 1000 },
      });
    }

    // Cập nhật lại tuần tự: start là 1, end là 20, mid là 2, 3, 4...
    for (let i = 0; i < finalOrderList.length; i++) {
      let newOrder = 0;
      if (i === 0) {
        newOrder = 1;
      } else if (i === finalOrderList.length - 1) {
        newOrder = 20;
      } else {
        newOrder = i + 1;
      }
      await tx.status.update({
        where: { id: finalOrderList[i].id },
        data: { sortOrder: newOrder },
      });
    }

    return tx.status.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });
  });
}

export async function deleteStatus(storeId: number, statusId: number) {
  await assertNoActiveOrders(storeId);
  const target = await assertStatusOwnership(statusId, storeId);

  if (target.type !== StatusType.mid) {
    throw ApiError.badRequest('Chỉ có thể xóa các trạng thái xử lý trung gian');
  }

  return prisma.$transaction(async (tx) => {
    await tx.status.delete({ where: { id: statusId } });

    // Sắp xếp lại dải số sortOrder cho mượt mà
    const remaining = await tx.status.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });

    for (const s of remaining) {
      await tx.status.update({
        where: { id: s.id },
        data: { sortOrder: s.sortOrder + 1000 },
      });
    }

    for (let i = 0; i < remaining.length; i++) {
      let newOrder = 0;
      if (i === 0) {
        newOrder = 1;
      } else if (i === remaining.length - 1) {
        newOrder = 20;
      } else {
        newOrder = i + 1;
      }
      await tx.status.update({
        where: { id: remaining[i].id },
        data: { sortOrder: newOrder },
      });
    }
  });
}
