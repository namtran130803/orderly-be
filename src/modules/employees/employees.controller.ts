import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/employees/employees.service';
import { sendSuccess } from '@/lib/response';
import type { CreateEmployeeDto, AssignRolesDto } from '@/modules/employees/employees.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    const result = await service.listEmployees(storeId);
    sendSuccess(res, result, 'Danh sách');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    const dto = req.body as CreateEmployeeDto;
    const userPermissions = req.user!.permissions;
    const result = await service.createEmployee(storeId, userPermissions, dto);
    sendSuccess(res, result, 'Tạo thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function assignRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    const employeeId = Number(req.params.employeeId);
    const dto = req.body as AssignRolesDto;
    const userPermissions = req.user!.permissions;
    const result = await service.assignRoles(storeId, employeeId, userPermissions, dto);
    sendSuccess(res, result, 'Gán thành công');
  } catch (err) {
    next(err);
  }
}

export async function removeRole(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    const employeeId = Number(req.params.employeeId);
    const roleId = Number(req.params.roleId);
    await service.removeRole(storeId, employeeId, roleId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = Number(req.params.storeId);
    const employeeId = Number(req.params.employeeId);
    const result = await service.getEmployeeRoles(storeId, employeeId);
    sendSuccess(res, result, 'Danh sách vai trò và quyền');
  } catch (err) {
    next(err);
  }
}
