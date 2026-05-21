import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/orders/orders.service';
import {
  notifyOrderDeleted,
  notifyOrderUpsert,
} from '@/modules/orders/orders.broadcast';
import { sendSuccess, sendCursorPaginated } from '@/lib/response';
import { OrderQueryDto, CreateOrderDto, UpdateOrderDto, ChangeOrderStatusDto } from '@/modules/orders/orders.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as OrderQueryDto;
    const { items, nextCursor } = await service.listOrders(req.store!.id, query);
    sendCursorPaginated(res, items, nextCursor);
  } catch (err) {
    next(err);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await service.getOrder(req.store!.id, Number(req.params.orderId));
    sendSuccess(res, order, 'Chi tiết đơn hàng');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateOrderDto;
    const storeId = req.store!.id;
    const order = await service.createOrder(storeId, dto);
    await notifyOrderUpsert(storeId, 'created', order);
    sendSuccess(res, order, 'Tạo đơn hàng thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateOrderDto;
    const storeId = req.store!.id;
    const orderId = Number(req.params.orderId);
    const order = await service.updateOrder(storeId, orderId, dto);
    await notifyOrderUpsert(storeId, 'updated', order);
    sendSuccess(res, order, 'Cập nhật đơn hàng thành công');
  } catch (err) {
    next(err);
  }
}

export async function advance(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as ChangeOrderStatusDto;
    const storeId = req.store!.id;
    const orderId = Number(req.params.orderId);
    const order = await service.advanceOrderStatus(storeId, orderId, dto);
    await notifyOrderUpsert(storeId, 'status_changed', order);
    sendSuccess(res, order, 'Chuyển trạng thái xử lý thành công');
  } catch (err) {
    next(err);
  }
}

export async function revert(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as ChangeOrderStatusDto;
    const storeId = req.store!.id;
    const orderId = Number(req.params.orderId);
    const order = await service.revertOrderStatus(storeId, orderId, dto);
    await notifyOrderUpsert(storeId, 'status_changed', order);
    sendSuccess(res, order, 'Quay lại trạng thái xử lý trước thành công');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = req.store!.id;
    const orderId = Number(req.params.orderId);
    await service.deleteOrder(storeId, orderId);
    await notifyOrderDeleted(storeId, orderId);
    sendSuccess(res, null, 'Đã xóa đơn hàng');
  } catch (err) {
    next(err);
  }
}
