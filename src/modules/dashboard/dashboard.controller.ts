import { Request, Response, NextFunction } from 'express';
import * as aggregate from '@/modules/dashboard/dashboard.service';
import { getDashboardFinance } from '@/modules/dashboard/dashboard-finance.service';
import { getDashboardOrders } from '@/modules/dashboard/dashboard-orders.service';
import { getDashboardOperations } from '@/modules/dashboard/dashboard-operations.service';
import { getDashboardStaff } from '@/modules/dashboard/dashboard-staff.service';
import { sendSuccess } from '@/lib/response';
import { DashboardQueryDto } from '@/modules/dashboard/dashboard.schema';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as DashboardQueryDto;
    const stats = await aggregate.getDashboardStats(req.store!.id, query);
    sendSuccess(res, stats, 'Báo cáo thống kê Dashboard');
  } catch (err) {
    next(err);
  }
}

export async function getFinance(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as DashboardQueryDto;
    const data = await getDashboardFinance(req.store!.id, query.from, query.to);
    sendSuccess(res, data, 'Tài chính dashboard');
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as DashboardQueryDto;
    const data = await getDashboardOrders(req.store!.id, query.from, query.to);
    sendSuccess(res, data, 'Đơn hàng dashboard');
  } catch (err) {
    next(err);
  }
}

export async function getOperations(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getDashboardOperations(req.store!.id);
    sendSuccess(res, data, 'Vận hành dashboard');
  } catch (err) {
    next(err);
  }
}

export async function getStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as DashboardQueryDto;
    const data = await getDashboardStaff(req.store!.id, query.from, query.to);
    sendSuccess(res, data, 'Nhân sự dashboard');
  } catch (err) {
    next(err);
  }
}
