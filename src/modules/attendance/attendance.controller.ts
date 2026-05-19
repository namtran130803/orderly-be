import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/attendance/attendance.service';
import { sendSuccess } from '@/lib/response';
import { signAttendanceQrToken } from '@/lib/jwt';
import { ATTENDANCE_QR_EXPIRES_SEC } from '@/lib/attendance-constants';

export function qrToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = signAttendanceQrToken(req.store!.id);
    sendSuccess(res, { token, expiresInSec: ATTENDANCE_QR_EXPIRES_SEC });
  } catch (err) {
    next(err);
  }
}

export async function scan(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await service.scanAttendance(
      req.store!.id,
      req.user!.id,
      req.body.qrToken,
    );
    sendSuccess(res, row, 'Chấm công thành công');
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAttendance(req.store!.id, req.query as any);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await service.createManualAttendance(req.store!.id, req.body);
    sendSuccess(res, row, 'Đã lưu', 201);
  } catch (err) {
    next(err);
  }
}

export async function patch(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await service.patchAttendance(
      req.store!.id,
      Number(req.params.attendanceId),
      req.user!.id,
      req.body,
    );
    sendSuccess(res, row, 'Đã cập nhật');
  } catch (err) {
    next(err);
  }
}
