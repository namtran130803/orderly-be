import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/prisma";
import { ApiError } from "@/lib/response";
import { PERMS } from "@/config/rbac/rbac-defs";
import { requireSystemAccess } from "@/middleware/requireSystemAccess";

export async function requireStoreAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { storeId } = req.params;
    if (!storeId) throw ApiError.badRequest("Thiếu storeId");

    const storeNumId = Number(storeId);
    if (isNaN(storeNumId)) throw ApiError.badRequest("storeId không hợp lệ");

    // 1. Kiểm tra sự tồn tại của cửa hàng
    const store = await prisma.store.findUnique({ where: { id: storeNumId } });
    if (!store) throw ApiError.notFound("Store");

    // 2. Truy vấn thông tin vai trò của User trong cửa hàng này
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId: req.user!.id, storeId: storeNumId },
      include: {
        roles: {
          include: {
            storeRole: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    // 3. Nạp danh sách quyền hạn cụ thể của người dùng tại cửa hàng này
    let storePermissions: string[] = [];
    let storeRoles: string[] = [];

    if (storeUser) {
      if (storeUser.role === "owner") {
        // Chủ cửa hàng có đầy đủ mọi quyền trong hệ thống
        const allPerms = await prisma.permission.findMany({
          select: { code: true },
        });
        storePermissions = allPerms.map((p) => p.code);
        storeRoles = ["owner"];
      } else {
        // Nhân viên: Lấy các quyền từ các vai trò được gán tại cửa hàng này
        storePermissions = storeUser.roles.flatMap((suRole) =>
          suRole.storeRole.permissions.map((rp) => rp.permission.code),
        );
        storeRoles = storeUser.roles.map((r) => r.storeRole.name);
      }
    }

    // 4. Xác định quyền truy cập và kiểm tra System Admin Bypass (quyền hệ thống)
    const isOwner = store.userId === req.user!.id;
    const isMember = storeUser !== null;
    let hasBypass = false;

    // Nếu không phải chủ và không phải nhân viên cửa hàng -> kiểm tra xem có quyền vượt cấp Admin hệ thống không
    if (!isOwner && !isMember) {
      // Tận dụng requireSystemAccess để nạp các quyền hệ thống
      await requireSystemAccess(req, _res, () => { });

      if (req.user!.permissions.includes(PERMS.stores.bypass_owner)) {
        hasBypass = true;
      } else {
        // Nếu không có quyền bypass, reset lại permissions rỗng
        req.user!.permissions = [];
        req.user!.roles = [];
      }
    } else {
      req.user!.permissions = [...new Set(storePermissions)];
      req.user!.roles = storeRoles;
    }

    // 5. Phán quyết quyền truy cập cửa hàng
    if (!hasBypass && !isOwner && !isMember) {
      throw ApiError.forbidden("Chỉ chủ cửa hàng hoặc nhân viên mới có quyền");
    }

    req.store = store;
    next();
  } catch (err) {
    next(err);
  }
}
