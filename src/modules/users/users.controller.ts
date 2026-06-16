import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/users/users.service';
import { sendPaginated, sendSuccess } from '@/lib/response';
import type {
  AssignRolesDto,
  UserListQueryDto,
} from '@/modules/users/users.schema';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as UserListQueryDto;
    const result = await service.listUsers(query);
    sendPaginated(res, result.items, result.pagination);
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
    const dto = req.body as AssignRolesDto;
    const result = await service.assignRoles(userId, dto.roleIds);
    sendSuccess(res, result, 'Gán vai trò thành công', 201);
  } catch (err) {
    next(err);
  }
}
