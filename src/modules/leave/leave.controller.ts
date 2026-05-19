import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/leave/leave.service';
import { sendSuccess } from '@/lib/response';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await service.listLeaves(req.store!.id, req.query as any);
    sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await service.createLeave(req.store!.id, req.user!.id, req.body);
    sendSuccess(res, row, 'Đã gửi đơn nghỉ', 201);
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await service.approveLeave(
      req.store!.id,
      Number(req.params.leaveId),
      req.user!.id,
    );
    sendSuccess(res, row, 'Đã duyệt');
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await service.rejectLeave(
      req.store!.id,
      Number(req.params.leaveId),
      req.user!.id,
    );
    sendSuccess(res, row, 'Đã từ chối');
  } catch (err) {
    next(err);
  }
}
