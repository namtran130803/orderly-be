import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/statuses/statuses.service';
import { sendSuccess } from '@/lib/response';
import { CreateStatusDto, UpdateStatusDto, ReorderStatusesDto } from '@/modules/statuses/statuses.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const statuses = await service.listStatuses(req.store!.id);
    sendSuccess(res, statuses, 'Quy trình xử lý đơn hàng');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateStatusDto;
    const status = await service.createStatus(req.store!.id, dto);
    sendSuccess(res, status, 'Thêm bước xử lý thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateStatusDto;
    const status = await service.updateStatus(req.store!.id, Number(req.params.statusId), dto);
    sendSuccess(res, status, 'Cập nhật tên bước xử lý thành công');
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as ReorderStatusesDto;
    const statuses = await service.reorderStatuses(req.store!.id, dto);
    sendSuccess(res, statuses, 'Đã sắp xếp lại quy trình xử lý');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteStatus(req.store!.id, Number(req.params.statusId));
    sendSuccess(res, null, 'Đã xóa bước xử lý');
  } catch (err) {
    next(err);
  }
}
