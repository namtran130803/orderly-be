import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requireSystemAccess } from "@/middleware/requireSystemAccess";
import { requirePermission } from "@/middleware/requirePermission";
import { validate } from "@/middleware/validate";
import { PERMS } from "@/config/rbac/rbac-defs";
import * as controller from "@/modules/subscriptions/subscriptions.controller";
import {
  adminRenewalSchema,
  createSubscriptionPlanSchema,
  subscriptionPlanParamsSchema,
  subscriptionHistoryQuerySchema,
  updateSubscriptionPlanSchema,
} from "@/modules/subscriptions/subscriptions.schema";

const router = Router();

router.get("/plans", controller.plans);

router.use(authenticate, requireSystemAccess);

router.post(
  "/plans",
  requirePermission(PERMS.subscriptions.admin_plan_create),
  validate(createSubscriptionPlanSchema),
  controller.createPlan,
);

router.put(
  "/plans/:planId",
  requirePermission(PERMS.subscriptions.admin_plan_update),
  validate(subscriptionPlanParamsSchema, "params"),
  validate(updateSubscriptionPlanSchema),
  controller.updatePlan,
);

router.delete(
  "/plans/:planId",
  requirePermission(PERMS.subscriptions.admin_plan_delete),
  validate(subscriptionPlanParamsSchema, "params"),
  controller.deletePlan,
);

router.get(
  "/payments",
  requirePermission(PERMS.subscriptions.admin_payments),
  validate(subscriptionHistoryQuerySchema, "query"),
  controller.allPayments,
);

router.get(
  "/periods",
  requirePermission(PERMS.subscriptions.admin_periods),
  validate(subscriptionHistoryQuerySchema, "query"),
  controller.allPeriods,
);

router.post(
  "/admin-renewals",
  requirePermission(PERMS.subscriptions.admin_renew),
  validate(adminRenewalSchema),
  controller.adminRenew,
);

export default router;
