import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/system/system.service';
import { sendSuccess } from '@/lib/response';

export async function listModules(req: Request, res: Response, next: NextFunction) {
  try {
    const modules = service.getSystemModules();
    sendSuccess(res, modules, 'Danh sách modules và quyền');
  } catch (err) {
    next(err);
  }
}

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getSystemOverview();
    sendSuccess(res, data, 'Tổng quan hệ thống');
  } catch (err) {
    next(err);
  }
}
