import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/dashboard/dashboard.service';
import { sendSuccess } from '@/lib/response';
import { DashboardQueryDto } from '@/modules/dashboard/dashboard.schema';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as DashboardQueryDto;
    const stats = await service.getDashboardStats(req.store!.id, query);
    sendSuccess(res, stats, 'Báo cáo thống kê Dashboard');
  } catch (err) {
    next(err);
  }
}
