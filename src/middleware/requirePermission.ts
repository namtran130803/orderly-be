import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/lib/response";

export function requirePermission(permissionCode: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userPermissions = req.user?.permissions || [];

    if (!userPermissions.includes(permissionCode)) {
      throw ApiError.forbidden(`Bạn không có quyền thực hiện thao tác này`);
    }
    next();
  };
}
