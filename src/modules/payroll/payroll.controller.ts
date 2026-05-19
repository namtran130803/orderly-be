import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/payroll/payroll.service';
import { sendSuccess } from '@/lib/response';

export async function preview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getPayrollPreview(req.store!.id, req.query as any);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function lock(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await service.lockPayroll(req.store!.id, req.query as any);
    sendSuccess(res, rows, 'Đã khóa kỳ lương', 201);
  } catch (err) {
    next(err);
  }
}

export async function employeeDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = req.store!.id;
    const employeeId = Number(req.params.employeeId);
    const data = await service.getPayrollEmployeeDetail(
      storeId,
      employeeId,
      req.query as any,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function unlock(req: Request, res: Response, next: NextFunction) {
  try {
    await service.unlockPayroll(req.store!.id, req.query as any);
    sendSuccess(res, null, 'Đã mở khóa kỳ lương');
  } catch (err) {
    next(err);
  }
}
