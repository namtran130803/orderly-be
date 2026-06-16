import { Request, Response, NextFunction } from "express";
import { sendPaginated, sendSuccess } from "@/lib/response";
import * as service from "@/modules/subscriptions/subscriptions.service";
import {
  AdminRenewalDto,
  CheckoutDto,
  CreateSubscriptionPlanDto,
  StorePeriodsQueryDto,
  SubscriptionHistoryQueryDto,
  UpdateSubscriptionPlanDto,
} from "@/modules/subscriptions/subscriptions.schema";

export async function plans(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await service.listPlans();
    sendSuccess(res, plans, "Danh sách gói gia hạn");
  } catch (err) {
    next(err);
  }
}

export async function status(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await service.getStoreSubscriptionStatus(req.store!.id);
    sendSuccess(res, subscription, "Trạng thái subscription");
  } catch (err) {
    next(err);
  }
}

export async function periods(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as StorePeriodsQueryDto;
    const result = await service.listStorePeriodsPaginated(req.store!.id, query);
    sendPaginated(res, result.items, result.pagination);
  } catch (err) {
    next(err);
  }
}

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CheckoutDto;
    const result = await service.createCheckout(
      req.store!.id,
      req.user!.id,
      dto.planDays,
    );
    sendSuccess(res, result, "Tạo thanh toán thành công", 201);
  } catch (err) {
    next(err);
  }
}

export async function allPeriods(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as SubscriptionHistoryQueryDto;
    const result = await service.listAllPeriods(query);
    sendPaginated(res, result.items, result.pagination);
  } catch (err) {
    next(err);
  }
}

export async function adminRenew(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as AdminRenewalDto;
    const result = await service.createAdminRenewal(dto);
    sendSuccess(res, result, "Gia hạn thủ công thành công", 201);
  } catch (err) {
    next(err);
  }
}

export async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateSubscriptionPlanDto;
    const result = await service.createPlan(dto);
    sendSuccess(res, result, "Tạo gói gia hạn thành công", 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const planId = Number(req.params.planId);
    const dto = req.body as UpdateSubscriptionPlanDto;
    const result = await service.updatePlan(planId, dto);
    sendSuccess(res, result, "Cập nhật gói gia hạn thành công");
  } catch (err) {
    next(err);
  }
}

export async function deletePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const planId = Number(req.params.planId);
    const result = await service.deletePlan(planId);
    sendSuccess(res, result, "Xóa gói gia hạn thành công");
  } catch (err) {
    next(err);
  }
}
