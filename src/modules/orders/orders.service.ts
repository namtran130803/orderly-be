import { prisma } from "@/config/prisma";
import { StatusType, Prisma } from "@prisma/client";
import { ApiError } from "@/lib/response";
import {
  OrderQueryDto,
  CreateOrderDto,
  UpdateOrderDto,
  ChangeOrderStatusDto,
} from "@/modules/orders/orders.schema";
import type { OrderRealtimeOrder } from "@/realtime/constants";

interface OrderItemWithId {
  id: number;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
  statusId: number | null;
  statusSnapshot: string | null;
  orderId: number;
}

export interface OrderWithItems {
  id: number;
  storeId: number;
  tableId: number | null;
  tableSnapshot: string | null;
  statusId: number | null;
  statusSnapshot: string | null;
  createdAt: Date;
  items: OrderItemWithId[];
}

interface EnrichedOrderItem extends OrderItemWithId {
  menuItemId: number | null;
}

interface EnrichedOrder extends Omit<OrderWithItems, 'items'> {
  items: EnrichedOrderItem[];
}

async function assertOrderOwnership(orderId: number, storeId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound("Order");
  if (order.storeId !== storeId) throw ApiError.forbidden();
  return order;
}

async function enrichItems(orders: OrderWithItems[]): Promise<EnrichedOrder[]> {
  const allNames = [
    ...new Set(orders.flatMap((o) => o.items.map((i) => i.nameSnapshot))),
  ];
  const menuItems = await prisma.menuItem.findMany({
    where: { name: { in: allNames } },
  });
  const nameToId = new Map(menuItems.map((m) => [m.name, m.id]));

  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      menuItemId: nameToId.get(item.nameSnapshot) ?? null,
    })),
  }));
}

type TransactionClient = Prisma.TransactionClient;

async function recomputeOrderStatusSnapshot(tx: TransactionClient, orderId: number) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;

  if (order.items.length === 0) {
    return null;
  }

  const allStatuses = await tx.status.findMany({
    where: { storeId: order.storeId },
  });
  const statusSortMap = new Map(
    allStatuses.map((s) => [s.id, s.sortOrder]),
  );

  let lowestItem = order.items[0];
  for (const item of order.items) {
    const currentOrder = item.statusId !== null ? (statusSortMap.get(item.statusId) ?? 99) : 99;
    const lowestOrder = lowestItem.statusId !== null ? (statusSortMap.get(lowestItem.statusId) ?? 99) : 99;
    if (currentOrder < lowestOrder) {
      lowestItem = item;
    }
  }

  const endStatus = allStatuses.find((s) => s.type === StatusType.end);
  const isEnd = endStatus && lowestItem.statusId === endStatus.id;

  await tx.order.update({
    where: { id: orderId },
    data: {
      statusId: lowestItem.statusId ?? undefined,
      statusSnapshot: lowestItem.statusSnapshot,
    },
  });

  if (order.tableSnapshot) {
    const table = await tx.table.findFirst({
      where: { name: order.tableSnapshot, area: { storeId: order.storeId } },
    });
    if (table) {
      await tx.table.update({
        where: { id: table.id },
        data: { orderId: isEnd ? null : orderId },
      });
    }
  }

  return lowestItem.statusSnapshot;
}

export async function listOrders(storeId: number, query: OrderQueryDto) {
  const limit = query.limit || 20;
  const sortOrder = query.sortOrder || 'desc';
  const whereClause: Prisma.OrderWhereInput = { storeId };

  if (query.statusId) {
    (whereClause as any).items = { some: { statusId: query.statusId } };
  }

  if (query.date) {
    const startOfDay = new Date(`${query.date}T00:00:00.000Z`);
    const endOfDay = new Date(`${query.date}T23:59:59.999Z`);
    (whereClause as any).createdAt = { gte: startOfDay, lte: endOfDay };
  }

  if (query.cursor) {
    const cursorItem = await prisma.order.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true, id: true },
    });
    if (cursorItem) {
      if (sortOrder === 'asc') {
        (whereClause as any).OR = [
          { createdAt: { gt: cursorItem.createdAt } },
          { createdAt: cursorItem.createdAt, id: { gt: cursorItem.id } },
        ];
      } else {
        (whereClause as any).OR = [
          { createdAt: { lt: cursorItem.createdAt } },
          { createdAt: cursorItem.createdAt, id: { lt: cursorItem.id } },
        ];
      }
    }
  }

  const data = await prisma.order.findMany({
    where: whereClause,
    include: { items: true },
    orderBy: { createdAt: sortOrder },
    take: limit + 1,
  });

  let nextCursor: number | null = null;
  if (data.length > limit) {
    const lastItem = data.pop();
    nextCursor = lastItem?.id || null;
  }

  return { items: data, nextCursor };
}

export async function getOrder(storeId: number, orderId: number) {
  await assertOrderOwnership(orderId, storeId);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order) return null;
  const enriched = await enrichItems([order]);
  return enriched[0];
}

export async function createOrder(storeId: number, dto: CreateOrderDto) {
  return prisma.$transaction(async (tx) => {
    // 1. Lấy trạng thái bắt đầu (start) — dùng để gán cho tất cả items mới
    const startStatus = await tx.status.findFirst({
      where: { storeId, type: StatusType.start },
      orderBy: { sortOrder: "asc" },
    });
    if (!startStatus)
      throw ApiError.internal(
        "Cửa hàng chưa cấu hình trạng thái bắt đầu đơn hàng",
      );

    // 3. Tra cứu bàn theo tên (tableName) → lấy id để gán vào order
    let tableId: number | null = null;
    if (dto.tableName) {
      const table = await tx.table.findFirst({
        where: { name: dto.tableName, area: { storeId } },
      });
      if (table) tableId = table.id;
    }

    // 4. Tạo bản ghi Order (chưa có items)
    const order = await tx.order.create({
      data: {
        storeId,
        tableId, // FK → Table (để biết order thuộc bàn nào)
        tableSnapshot: dto.tableName || null, // snapshot tên bàn (hiển thị, không phụ thuộc FK)
        statusId: startStatus.id, // FK → Status (trạng thái hiện tại của order)
        statusSnapshot: startStatus.name, // snapshot tên trạng thái (hiển thị)
      },
    });

    // 5. Đánh dấu bàn đang có người: Table.orderId = order.id
    if (tableId) {
      await tx.table.update({
        where: { id: tableId },
        data: { orderId: order.id },
      });
    }

    // 6. Tạo từng OrderItem (món ăn) cho đơn hàng
    for (const itemInput of dto.items) {
      const menuItem = await tx.menuItem.findUnique({
        where: { id: itemInput.menuItemId },
        include: { category: true },
      });
      if (!menuItem || menuItem.category.storeId !== storeId) {
        throw ApiError.badRequest(
          `Món ăn với ID ${itemInput.menuItemId} không tồn tại trong thực đơn cửa hàng`,
        );
      }

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          statusId: startStatus.id,
          statusSnapshot: startStatus.name,
          nameSnapshot: menuItem.name,
          priceSnapshot: menuItem.price,
          qty: itemInput.qty,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
  });
}

export async function updateOrder(
  storeId: number,
  orderId: number,
  dto: UpdateOrderDto,
) {
  await assertOrderOwnership(orderId, storeId);

  return prisma.$transaction(async (tx) => {
    // Kiểm tra nếu đơn hàng ở trạng thái end thì không cho chỉnh sửa
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { status: true },
    });
    if (order?.status?.type === StatusType.end) {
      throw ApiError.forbidden("Không thể chỉnh sửa đơn hàng đã hoàn thành");
    }
    if (dto.tableName !== undefined) {
      await tx.order.update({
        where: { id: orderId },
        data: { tableSnapshot: dto.tableName || null },
      });
    }

    const startStatus = await tx.status.findFirst({
      where: { storeId, type: StatusType.start },
      orderBy: { sortOrder: "asc" },
    });
    if (!startStatus)
      throw ApiError.internal("Lỗi cấu hình trạng thái bắt đầu");

    for (const requestedItem of dto.items) {
      const { menuItemId, qty: targetQty } = requestedItem;

      const currentRows = await tx.orderItem.findMany({
        where: {
          orderId,
          nameSnapshot: (
            await tx.menuItem.findUnique({ where: { id: menuItemId } })
          )?.name,
        },
        orderBy: { id: "desc" },
      });
      const currentTotalQty = currentRows.reduce((sum, r) => sum + r.qty, 0);

      if (targetQty === 0) {
        for (const row of currentRows) {
          await tx.orderItem.delete({ where: { id: row.id } });
        }
      } else if (targetQty > currentTotalQty) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: menuItemId },
        });
        if (!menuItem) throw ApiError.badRequest("Món ăn không tồn tại");
        await tx.orderItem.create({
          data: {
            orderId,
            statusId: startStatus.id,
            statusSnapshot: startStatus.name,
            nameSnapshot: menuItem.name,
            priceSnapshot: menuItem.price,
            qty: targetQty - currentTotalQty,
          },
        });
      } else if (targetQty < currentTotalQty) {
        let delta = currentTotalQty - targetQty;
        for (const row of currentRows) {
          if (delta <= 0) break;
          if (row.qty <= delta) {
            await tx.orderItem.delete({ where: { id: row.id } });
            delta -= row.qty;
          } else {
            await tx.orderItem.update({
              where: { id: row.id },
              data: { qty: row.qty - delta },
            });
            delta = 0;
          }
        }
      }
    }

    await recomputeOrderStatusSnapshot(tx, orderId);
    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  });
}

export async function advanceOrderStatus(
  storeId: number,
  orderId: number,
  dto: ChangeOrderStatusDto,
) {
  await assertOrderOwnership(orderId, storeId);

  return prisma.$transaction(async (tx) => {
    const currentStatus = await tx.status.findUnique({
      where: { id: dto.fromStatusId },
    });
    if (!currentStatus || currentStatus.storeId !== storeId) {
      throw ApiError.badRequest("Trạng thái nguồn không hợp lệ");
    }

    const nextStatus = await tx.status.findFirst({
      where: { storeId, sortOrder: { gt: currentStatus.sortOrder } },
      orderBy: { sortOrder: "asc" },
    });
    if (!nextStatus) {
      throw ApiError.badRequest(
        "Món ăn đã ở bước xử lý cuối cùng, không thể chuyển tiếp",
      );
    }

    const nextSnapshot = nextStatus.name;

    await tx.orderItem.updateMany({
      where: { orderId, statusId: dto.fromStatusId },
      data: { statusId: nextStatus.id, statusSnapshot: nextSnapshot },
    });

    await recomputeOrderStatusSnapshot(tx, orderId);
    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  });
}

export async function revertOrderStatus(
  storeId: number,
  orderId: number,
  dto: ChangeOrderStatusDto,
) {
  await assertOrderOwnership(orderId, storeId);

  return prisma.$transaction(async (tx) => {
    const currentStatus = await tx.status.findUnique({
      where: { id: dto.fromStatusId },
    });
    if (!currentStatus || currentStatus.storeId !== storeId) {
      throw ApiError.badRequest("Trạng thái nguồn không hợp lệ");
    }

    const prevStatus = await tx.status.findFirst({
      where: { storeId, sortOrder: { lt: currentStatus.sortOrder } },
      orderBy: { sortOrder: "desc" },
    });
    if (!prevStatus) {
      throw ApiError.badRequest(
        "Món ăn đang ở bước xử lý đầu tiên, không thể quay lại",
      );
    }

    await tx.orderItem.updateMany({
      where: { orderId, statusId: dto.fromStatusId },
      data: { statusId: prevStatus.id, statusSnapshot: prevStatus.name },
    });

    await recomputeOrderStatusSnapshot(tx, orderId);
    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  });
}

/** Chuẩn hoá đơn để broadcast realtime (có menuItemId, ISO date). */
export async function formatOrderForBroadcast(
  order: OrderWithItems,
): Promise<OrderRealtimeOrder> {
  const [enriched] = await enrichItems([order]);
  return {
    id: enriched.id,
    tableId: enriched.tableId,
    tableSnapshot: enriched.tableSnapshot,
    statusId: enriched.statusId,
    statusSnapshot: enriched.statusSnapshot,
    createdAt: enriched.createdAt.toISOString(),
    items: enriched.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      statusId: item.statusId,
      statusSnapshot: item.statusSnapshot,
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: item.priceSnapshot,
      qty: item.qty,
    })),
  };
}

export async function deleteOrder(storeId: number, orderId: number) {
  const order = await assertOrderOwnership(orderId, storeId);

  // Kiểm tra nếu đơn hàng ở trạng thái end thì không cho xóa
  const orderWithStatus = await prisma.order.findUnique({
    where: { id: orderId },
    include: { status: true },
  });
  if (orderWithStatus?.status?.type === StatusType.end) {
    throw ApiError.forbidden("Không thể xóa đơn hàng đã hoàn thành");
  }

  await prisma.order.delete({ where: { id: orderId } });
}
