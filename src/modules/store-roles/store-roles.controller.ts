import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/store-roles/store-roles.service';
import { sendSuccess, ApiError } from '@/lib/response';
import type { CreateStoreRoleDto, UpdateStoreRoleDto } from '@/modules/store-roles/store-roles.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) throw ApiError.badRequest('storeId không hợp lệ');
    const result = await service.listStoreRoles(storeId);
    sendSuccess(res, result, 'Danh sách vai trò');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) throw ApiError.badRequest('storeId không hợp lệ');
    const dto = req.body as CreateStoreRoleDto;
    const userPermissions = req.user!.permissions;
    const result = await service.createStoreRole(storeId, userPermissions, dto);
    sendSuccess(res, result, 'Tạo thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    const roleId = Number(req.params.roleId);
    if (isNaN(storeId) || isNaN(roleId)) throw ApiError.badRequest('ID không hợp lệ');
    const dto = req.body as UpdateStoreRoleDto;
    const userPermissions = req.user!.permissions;
    const result = await service.updateStoreRole(storeId, roleId, userPermissions, dto);
    sendSuccess(res, result, 'Cập nhật thành công');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    const roleId = Number(req.params.roleId);
    if (isNaN(storeId) || isNaN(roleId)) throw ApiError.badRequest('ID không hợp lệ');
    await service.deleteStoreRole(storeId, roleId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
