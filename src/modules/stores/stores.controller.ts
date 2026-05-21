import { Request, Response, NextFunction } from "express";
import * as service from "@/modules/stores/stores.service";
import { sendSuccess, ApiError } from "@/lib/response";
import { CreateStoreDto, UpdateStoreDto } from "@/modules/stores/stores.schema";
import { PERMS } from "@/config/rbac/rbac-defs";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    let targetUserId = req.user!.id;
    if (req.query.userId) {
      if (!req.user!.permissions.includes(PERMS.stores.bypass_owner)) {
        throw ApiError.forbidden("Không có quyền");
      }
      targetUserId = Number(req.query.userId);
    }
    const stores = await service.listStores(targetUserId);
    sendSuccess(res, stores, "Danh sách");
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, ...dto } = req.body as CreateStoreDto & { userId?: number };
    let ownerId = req.user!.id;
    if (userId) {
      if (!req.user!.permissions.includes(PERMS.stores.bypass_owner)) {
        throw ApiError.forbidden("Không có quyền");
      }
      ownerId = userId;
    }
    const store = await service.createStore(ownerId, dto);
    sendSuccess(res, store, "Tạo thành công", 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateStoreDto;
    const store = await service.updateStore(req.store!.id, req.user!.id, dto);
    sendSuccess(res, store, "Cập nhật thành công");
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteStore(req.store!.id);
    sendSuccess(res, null, "Xóa thành công");
  } catch (err) {
    next(err);
  }
}
