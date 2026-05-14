import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/stores/stores.service';
import { sendSuccess } from '@/lib/response';
import { CreateStoreDto, UpdateStoreDto } from '@/modules/stores/stores.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const stores = await service.listStores(req.user!.id);
    sendSuccess(res, stores, 'Danh sách cửa hàng');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateStoreDto;
    const store = await service.createStore(req.user!.id, dto);
    sendSuccess(res, store, 'Tạo cửa hàng thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateStoreDto;
    // req.store đã được kiểm tra quyền truy cập ở middleware requireStoreAccess
    const store = await service.updateStore(req.store!.id, dto);
    sendSuccess(res, store, 'Cập nhật thông tin cửa hàng thành công');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteStore(req.store!.id);
    sendSuccess(res, null, 'Đã xóa cửa hàng');
  } catch (err) {
    next(err);
  }
}
