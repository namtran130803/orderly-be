import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/lib/response";
import { PERMS } from "@/config/rbac/rbac-defs";

const READ_ONLY_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const READ_ONLY_POST_ALLOWED_PERMISSIONS = new Set<string>([
  PERMS.orders.list,
  PERMS.subscriptions.checkout,
]);

export function requirePermission(permissionCode: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userPermissions = req.user?.permissions || [];

    if (!userPermissions.includes(permissionCode)) {
      throw ApiError.forbidden("Bạn không có quyền thực hiện thao tác này");
    }

    if (
      req.storeSubscription?.isReadOnly &&
      !READ_ONLY_SAFE_METHODS.has(req.method) &&
      !READ_ONLY_POST_ALLOWED_PERMISSIONS.has(permissionCode)
    ) {
      throw new ApiError(
        403,
        "STORE_READ_ONLY",
        "Cửa hàng đã hết hạn. Vui lòng gia hạn để tiếp tục thao tác.",
      );
    }

    next();
  };
}
