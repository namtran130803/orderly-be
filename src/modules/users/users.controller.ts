import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/users/users.service';
import { sendSuccess } from '@/lib/response';
import type { AssignRoleDto } from '@/modules/users/users.schema';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await service.listUsers();
    sendSuccess(res, users, 'Danh sách người dùng');
  } catch (err) {
    next(err);
  }
}

export async function listUserRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.userId);
    const result = await service.getUserRoles(userId);
    sendSuccess(res, result, 'Danh sách vai trò của người dùng');
  } catch (err) {
    next(err);
  }
}

export async function assignRole(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.userId);
    const dto = req.body as AssignRoleDto;
    const result = await service.assignRole(userId, dto.roleId);
    sendSuccess(res, result, 'Gán vai trò thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function removeRole(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.params.userId);
    const roleId = Number(req.params.roleId);
    await service.removeRole(userId, roleId);
    sendSuccess(res, null, 'Đã xóa vai trò khỏi người dùng');
  } catch (err) {
    next(err);
  }
}
