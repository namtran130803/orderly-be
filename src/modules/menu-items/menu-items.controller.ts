import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/menu-items/menu-items.service';
import { sendSuccess } from '@/lib/response';
import { CreateMenuItemDto, UpdateMenuItemDto } from '@/modules/menu-items/menu-items.schema';

// Controller chỉ làm 3 việc: lấy input đã validate → gọi service → trả response
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await service.listMenuItems(req.store!.id);
    sendSuccess(res, items);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateMenuItemDto;
    const item = await service.createMenuItem(req.store!.id, dto);
    sendSuccess(res, item, 'Thêm món thành công', 201);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateMenuItemDto;
    const item = await service.updateMenuItem(req.store!.id, Number(req.params.itemId), dto);
    sendSuccess(res, item, 'Cập nhật thành công');
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteMenuItem(req.store!.id, Number(req.params.itemId));
    sendSuccess(res, null, 'Đã xóa món');
  } catch (err) { next(err); }
}
