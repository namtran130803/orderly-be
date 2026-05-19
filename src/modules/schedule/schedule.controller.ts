import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/schedule/schedule.service';
import { sendSuccess } from '@/lib/response';

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getSchedule(req.store!.id);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function putDefault(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.updateDefaultWorkDays(req.store!.id, req.body);
    sendSuccess(res, data, 'Đã cập nhật ngày làm mặc định');
  } catch (err) {
    next(err);
  }
}

export async function postOverride(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await service.createOverride(req.store!.id, req.body);
    sendSuccess(res, row, 'Đã thêm ngày đặc biệt', 201);
  } catch (err) {
    next(err);
  }
}

export async function removeOverride(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteOverride(req.store!.id, Number(req.params.overrideId));
    sendSuccess(res, null, 'Đã xóa');
  } catch (err) {
    next(err);
  }
}
