import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requirePermission } from "@/middleware/requirePermission";
import { validate } from "@/middleware/validate";
import * as controller from "@/modules/employees/employees.controller";
import {
  createEmployeeSchema,
  assignRolesSchema,
} from "@/modules/employees/employees.schema";
import { PERMS } from "@/config/rbac/rbac-defs";
import { requireStoreAccess } from "@/middleware/requireStoreAccess";

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get("/", requirePermission(PERMS.employees.list), controller.list);
router.post(
  "/",
  requirePermission(PERMS.employees.create),
  validate(createEmployeeSchema),
  controller.create,
);
router.post(
  "/:employeeId/roles",
  requirePermission(PERMS.employees.assign_role),
  validate(assignRolesSchema),
  controller.assignRoles,
);
router.get(
  "/:employeeId/roles",
  requirePermission(PERMS.employees.list),
  controller.getRoles,
);

export default router;
