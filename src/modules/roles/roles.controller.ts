import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/roles/roles.service';
import { sendSuccess, ApiError } from '@/lib/response';
import type { CreateRoleDto, UpdateRoleDto } from '@/modules/roles/roles.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await service.listRoles();
    sendSuccess(res, roles, 'Danh sách vai trò');
  } catch (err) {
    next(err);
  }
}

export async function myRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getMyRoles(req.user!.id);
    sendSuccess(res, result, 'Vai trò của bạn');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateRoleDto;
    const role = await service.createRole(dto);
    sendSuccess(res, role, 'Tạo vai trò thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const roleId = Number(req.params.roleId);
    const dto = req.body as UpdateRoleDto;
    const role = await service.updateRole(roleId, dto);
    sendSuccess(res, role, 'Cập nhật vai trò thành công');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const roleId = Number(req.params.roleId);
    await service.deleteRole(roleId);
    sendSuccess(res, null, 'Đã xóa vai trò');
  } catch (err) {
    next(err);
  }
}
