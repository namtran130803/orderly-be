import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requireSystemAccess } from "@/middleware/requireSystemAccess";
import { requirePermission } from "@/middleware/requirePermission";
import { validate } from "@/middleware/validate";
import { PERMS } from "@/config/rbac/rbac-defs";
import * as controller from "./payments.controller";
import { listPaymentsQuerySchema } from "./payments.schema";

const router = Router();

router.use(authenticate, requireSystemAccess);

router.get(
  "/",
  requirePermission(PERMS.payments.list),
  validate(listPaymentsQuerySchema, "query"),
  controller.list,
);

export default router;
