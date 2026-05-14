import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/tables/tables.service';
import { sendSuccess, ApiError } from '@/lib/response';

export async function updateTable(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      throw ApiError.badRequest('Tên bàn không hợp lệ');
    }
    const updated = await service.updateTable(req.store!.id, Number(req.params.tableId), name.trim());
    sendSuccess(res, updated, 'Cập nhật tên bàn thành công');
  } catch (err) {
    next(err);
  }
}

export async function deleteTable(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteTable(req.store!.id, Number(req.params.tableId));
    sendSuccess(res, null, 'Xóa bàn thành công');
  } catch (err) {
    next(err);
  }
}
