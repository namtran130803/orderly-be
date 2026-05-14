import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { OrderQueryDto, CreateOrderDto, UpdateOrderDto, ChangeOrderStatusDto } from '@/modules/orders/orders.schema';
import { StatusType } from '@prisma/client';

async function assertOrderOwnership(orderId: number, storeId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Order');
  if (order.storeId !== storeId) throw ApiError.forbidden();
  return order;
}

async function recomputeOrderStatusSnapshot(tx: any, orderId: number) {
  const remainingItems = await tx.orderItem.findMany({
    where: { orderId },
    include: { status: true },
  });

  if (remainingItems.length === 0) {
    const order = await tx.order.update({
      where: { id: orderId },
      data: { statusSnapshot: null },
    });
    if (order.tableId) {
      await tx.table.updateMany({
        where: { id: order.tableId, orderId },
        data: { orderId: null },
      });
    }
    return null;
  }

  let lowestStatus = remainingItems[0].status;
  for (const item of remainingItems) {
    if (item.status.sortOrder < lowestStatus.sortOrder) {
      lowestStatus = item.status;
    }
  }

  const order = await tx.order.update({
    where: { id: orderId },
    data: { statusSnapshot: lowestStatus.name },
  });

  if (order.tableId) {
    if (lowestStatus.type === 'end') {
      await tx.table.updateMany({
        where: { id: order.tableId, orderId },
        data: { orderId: null },
      });
    } else {
      await tx.table.update({
        where: { id: order.tableId },
        data: { orderId },
      });
    }
  }

  return lowestStatus.name;
}

export async function listOrders(storeId: number, query: OrderQueryDto) {
  const limit = query.limit || 20;
  const whereClause: any = { storeId };

  if (query.statusId) {
    whereClause.items = {
      some: { statusId: query.statusId },
    };
  }

  if (query.date) {
    const startOfDay = new Date(`${query.date}T00:00:00.000Z`);
    const endOfDay = new Date(`${query.date}T23:59:59.999Z`);
    whereClause.createdAt = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  if (query.cursor) {
    whereClause.id = { lt: query.cursor };
  }

  const data = await prisma.order.findMany({
    where: whereClause,
    include: {
      table: { select: { id: true, name: true } },
      items: {
        include: {
          status: { select: { id: true, name: true, type: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
    take: limit + 1,
  });

  let nextCursor: number | null = null;
  if (data.length > limit) {
    const lastItem = data.pop();
    nextCursor = lastItem?.id || null;
  }

  return {
    items: data,
    nextCursor,
  };
}

export async function getOrder(storeId: number, orderId: number) {
  await assertOrderOwnership(orderId, storeId);
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      items: {
        include: {
          status: true,
          menuItem: true,
        },
        orderBy: { status: { sortOrder: 'asc' } },
      },
    },
  });
}

export async function createOrder(storeId: number, dto: CreateOrderDto) {
  return prisma.$transaction(async (tx) => {
    // 1. Tìm trạng thái bắt đầu (start)
    const startStatus = await tx.status.findFirst({
      where: { storeId, type: StatusType.start },
      orderBy: { sortOrder: 'asc' },
    });
    if (!startStatus) throw ApiError.internal('Cửa hàng chưa cấu hình trạng thái bắt đầu đơn hàng');

    // 2. Tìm orderNumber tiếp theo
    const lastOrder = await tx.order.findFirst({
      where: { storeId },
      orderBy: { orderNumber: 'desc' },
    });
    const nextOrderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    // 3. Xử lý thông tin bàn và snapshot tên bàn
    let tableSnapshot: string | null = null;
    if (dto.tableId) {
      const table = await tx.table.findUnique({
        where: { id: dto.tableId },
        include: { area: true },
      });
      if (!table || table.area.storeId !== storeId) {
        throw ApiError.badRequest('Bàn không hợp lệ hoặc không thuộc cửa hàng này');
      }
      tableSnapshot = `${table.area.name} - ${table.name}`;
    }

    // 4. Tạo bản ghi Order chính
    const order = await tx.order.create({
      data: {
        storeId,
        tableId: dto.tableId,
        tableSnapshot,
        statusSnapshot: startStatus.name,
        orderNumber: nextOrderNumber,
      },
    });

    // 5. Chuẩn bị dữ liệu OrderItems kèm snapshot giá/tên
    for (const itemInput of dto.items) {
      const menuItem = await tx.menuItem.findUnique({
        where: { id: itemInput.menuItemId },
        include: { category: true },
      });

      if (!menuItem || menuItem.category.storeId !== storeId) {
        throw ApiError.badRequest(`Món ăn với ID ${itemInput.menuItemId} không tồn tại trong thực đơn cửa hàng`);
      }

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: menuItem.id,
          statusId: startStatus.id,
          nameSnapshot: menuItem.name,
          priceSnapshot: menuItem.price,
          qty: itemInput.qty,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        items: { include: { status: true, menuItem: true } },
      },
    });
  });
}

export async function updateOrder(storeId: number, orderId: number, dto: UpdateOrderDto) {
  await assertOrderOwnership(orderId, storeId);

  return prisma.$transaction(async (tx) => {
    // 1. Cập nhật bàn nếu có thay đổi
    let tableSnapshot: string | null | undefined = undefined;
    if (dto.tableId !== undefined) {
      const oldOrder = await tx.order.findUnique({ where: { id: orderId } });
      if (oldOrder?.tableId && oldOrder.tableId !== dto.tableId) {
        await tx.table.updateMany({
          where: { id: oldOrder.tableId, orderId },
          data: { orderId: null },
        });
      }

      if (dto.tableId) {
        const table = await tx.table.findUnique({
          where: { id: dto.tableId },
          include: { area: true },
        });
        if (!table || table.area.storeId !== storeId) {
          throw ApiError.badRequest('Bàn không hợp lệ');
        }
        tableSnapshot = `${table.area.name} - ${table.name}`;

        await tx.table.update({
          where: { id: dto.tableId },
          data: { orderId },
        });
      } else {
        tableSnapshot = null;
      }

      await tx.order.update({
        where: { id: orderId },
        data: { tableId: dto.tableId, tableSnapshot },
      });
    }

    // 2. Tìm trạng thái start để chèn dòng mới nếu tăng số lượng
    const startStatus = await tx.status.findFirst({
      where: { storeId, type: StatusType.start },
      orderBy: { sortOrder: 'asc' },
    });
    if (!startStatus) throw ApiError.internal('Lỗi cấu hình trạng thái bắt đầu');

    // 3. Xử lý logic merge từng món theo đúng quy chuẩn tài liệu thiết kế
    for (const requestedItem of dto.items) {
      const { menuItemId, qty: targetQty } = requestedItem;

      // Lấy các dòng orderItem hiện tại của món này, sắp xếp theo sortOrder giảm dần (trạng thái cao nhất đứng trước)
      const currentRows = await tx.orderItem.findMany({
        where: { orderId, menuItemId },
        include: { status: true },
        orderBy: { status: { sortOrder: 'desc' } },
      });

      const currentTotalQty = currentRows.reduce((sum, r) => sum + r.qty, 0);

      if (targetQty === 0) {
        // Xóa tất cả dòng của món này
        await tx.orderItem.deleteMany({
          where: { orderId, menuItemId },
        });
      } else if (targetQty > currentTotalQty) {
        // Thêm dòng mới với trạng thái start cho phần chênh lệch tăng
        const menuItem = await tx.menuItem.findUnique({ where: { id: menuItemId } });
        if (!menuItem) throw ApiError.badRequest('Món ăn không tồn tại');

        await tx.orderItem.create({
          data: {
            orderId,
            menuItemId,
            statusId: startStatus.id,
            nameSnapshot: menuItem.name,
            priceSnapshot: menuItem.price,
            qty: targetQty - currentTotalQty,
          },
        });
      } else if (targetQty < currentTotalQty) {
        // Giảm số lượng ở các dòng có trạng thái cao nhất trước
        let delta = currentTotalQty - targetQty;

        for (const row of currentRows) {
          if (delta <= 0) break;

          if (row.qty <= delta) {
            // Xóa hoàn toàn dòng này
            await tx.orderItem.delete({ where: { id: row.id } });
            delta -= row.qty;
          } else {
            // Giảm bớt số lượng dòng này
            await tx.orderItem.update({
              where: { id: row.id },
              data: { qty: row.qty - delta },
            });
            delta = 0;
            break;
          }
        }
      }
    }

    // 4. Tính lại statusSnapshot của đơn hàng
    await recomputeOrderStatusSnapshot(tx, orderId);

    return tx.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: { include: { status: true, menuItem: true } },
      },
    });
  });
}

export async function advanceOrderStatus(storeId: number, orderId: number, dto: ChangeOrderStatusDto) {
  await assertOrderOwnership(orderId, storeId);

  return prisma.$transaction(async (tx) => {
    const currentStatus = await tx.status.findUnique({ where: { id: dto.fromStatusId } });
    if (!currentStatus || currentStatus.storeId !== storeId) {
      throw ApiError.badRequest('Trạng thái nguồn không hợp lệ');
    }

    // Tìm trạng thái kế tiếp theo sortOrder
    const nextStatus = await tx.status.findFirst({
      where: {
        storeId,
        sortOrder: { gt: currentStatus.sortOrder },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (!nextStatus) {
      throw ApiError.badRequest('Món ăn đã ở bước xử lý cuối cùng, không thể chuyển tiếp');
    }

    // Chuyển tất cả order_items đang ở fromStatusId sang nextStatus.id
    await tx.orderItem.updateMany({
      where: { orderId, statusId: dto.fromStatusId },
      data: { statusId: nextStatus.id },
    });

    // Cập nhật statusSnapshot
    await recomputeOrderStatusSnapshot(tx, orderId);

    return tx.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: { include: { status: true, menuItem: true } },
      },
    });
  });
}

export async function revertOrderStatus(storeId: number, orderId: number, dto: ChangeOrderStatusDto) {
  await assertOrderOwnership(orderId, storeId);

  return prisma.$transaction(async (tx) => {
    const currentStatus = await tx.status.findUnique({ where: { id: dto.fromStatusId } });
    if (!currentStatus || currentStatus.storeId !== storeId) {
      throw ApiError.badRequest('Trạng thái nguồn không hợp lệ');
    }

    // Tìm trạng thái liền trước theo sortOrder
    const prevStatus = await tx.status.findFirst({
      where: {
        storeId,
        sortOrder: { lt: currentStatus.sortOrder },
      },
      orderBy: { sortOrder: 'desc' },
    });

    if (!prevStatus) {
      throw ApiError.badRequest('Món ăn đang ở bước xử lý đầu tiên, không thể quay lại');
    }

    await tx.orderItem.updateMany({
      where: { orderId, statusId: dto.fromStatusId },
      data: { statusId: prevStatus.id },
    });

    await recomputeOrderStatusSnapshot(tx, orderId);

    return tx.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: { include: { status: true, menuItem: true } },
      },
    });
  });
}

export async function deleteOrder(storeId: number, orderId: number) {
  await assertOrderOwnership(orderId, storeId);
  await prisma.order.delete({
    where: { id: orderId },
  });
}
