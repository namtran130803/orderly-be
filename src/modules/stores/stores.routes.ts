import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requirePermission } from "@/middleware/requirePermission";
import { requireStoreAccess } from "@/middleware/requireStoreAccess";
import { validate } from "@/middleware/validate";
import * as controller from "@/modules/stores/stores.controller";
import { getStoreOwnerModules } from "@/modules/store-roles/store-roles.service";
import {
  createStoreSchema,
  updateStoreSchema,
  storeParamsSchema,
} from "@/modules/stores/stores.schema";
import { sendSuccess } from "@/lib/response";
import { PERMS } from "@/config/rbac/rbac-defs";
import { requireSystemAccess } from "@/middleware/requireSystemAccess";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requireSystemAccess, controller.list);
router.post(
  "/",
  requireSystemAccess,
  validate(createStoreSchema),
  controller.create,
);

router.use("/:storeId", requireStoreAccess);

router.get(
  "/:storeId/modules",
  requirePermission(PERMS.stores.role_modules),
  async (_req, res) => {
    const modules = await getStoreOwnerModules();
    sendSuccess(res, modules, "Danh sách mô-đun");
  },
);

router.put(
  "/:storeId",
  requirePermission(PERMS.stores.update),
  validate(storeParamsSchema, "params"),
  validate(updateStoreSchema),
  controller.update,
);

router.delete(
  "/:storeId",
  requirePermission(PERMS.stores.delete),
  validate(storeParamsSchema, "params"),
  controller.remove,
);

export default router;
