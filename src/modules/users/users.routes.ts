import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requireSystemAccess } from "@/middleware/requireSystemAccess";
import { requirePermission } from "@/middleware/requirePermission";
import { validate } from "@/middleware/validate";
import * as controller from "@/modules/users/users.controller";
import {
  assignRoleSchema,
  userRoleDeleteParamsSchema,
} from "@/modules/users/users.schema";
import { PERMS } from "@/config/rbac/rbac-defs";

const router = Router({ mergeParams: true });

router.use(authenticate, requireSystemAccess);

router.get("/", requirePermission(PERMS.users.list), controller.listUsers);
router.get(
  "/:userId/roles",
  requirePermission(PERMS.users.role_list),
  controller.listUserRoles,
);
router.post(
  "/:userId/roles",
  requirePermission(PERMS.users.role_assign),
  validate(assignRoleSchema),
  controller.assignRole,
);
router.delete(
  "/:userId/roles/:roleId",
  requirePermission(PERMS.users.role_remove),
  validate(userRoleDeleteParamsSchema, "params"),
  controller.removeRole,
);

export default router;
