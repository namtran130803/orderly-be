import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requireStoreAccess } from "@/middleware/requireStoreAccess";
import { requirePermission } from "@/middleware/requirePermission";
import { validate } from "@/middleware/validate";
import { PERMS } from "@/config/rbac/rbac-defs";
import * as controller from "@/modules/subscriptions/subscriptions.controller";
import {
  checkoutSchema,
  storePeriodsQuerySchema,
  storeSubscriptionParamsSchema,
} from "@/modules/subscriptions/subscriptions.schema";

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get(
  "/",
  requirePermission(PERMS.subscriptions.current),
  validate(storeSubscriptionParamsSchema, "params"),
  controller.current,
);
router.get(
  "/payments",
  requirePermission(PERMS.subscriptions.payments),
  validate(storeSubscriptionParamsSchema, "params"),
  controller.payments,
);
router.get(
  "/periods",
  requirePermission(PERMS.subscriptions.periods),
  validate(storeSubscriptionParamsSchema, "params"),
  validate(storePeriodsQuerySchema, "query"),
  controller.periods,
);
router.post(
  "/checkout",
  requirePermission(PERMS.subscriptions.checkout),
  validate(storeSubscriptionParamsSchema, "params"),
  validate(checkoutSchema),
  controller.checkout,
);

export default router;
