import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requirePermission } from "@/middleware/requirePermission";
import { validate } from "@/middleware/validate";
import * as controller from "@/modules/store-roles/store-roles.controller";
import {
  createStoreRoleSchema,
  updateStoreRoleSchema,
} from "@/modules/store-roles/store-roles.schema";
import { PERMS } from "@/config/rbac/rbac-defs";
import { requireStoreAccess } from "@/middleware/requireStoreAccess";

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get("/", requirePermission(PERMS.store_roles.list), controller.list);
router.post(
  "/",
  requirePermission(PERMS.store_roles.create),
  validate(createStoreRoleSchema),
  controller.create,
);
router.put(
  "/:roleId",
  requirePermission(PERMS.store_roles.update),
  validate(updateStoreRoleSchema),
  controller.update,
);
router.delete(
  "/:roleId",
  requirePermission(PERMS.store_roles.delete),
  controller.remove,
);

export default router;
