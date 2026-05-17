import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';

export async function requireSystemAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    // 1. Truy vấn thông tin vai trò và quyền hạn cấp hệ thống của người dùng
    const systemUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userRoles: {
          include: {
            role: {
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

    if (!systemUser) throw ApiError.unauthorized();

    // 2. Trích xuất danh sách mã quyền và tên vai trò hệ thống
    const systemPerms = systemUser.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.code)
    );
    const systemRoles = systemUser.userRoles.map((ur) => ur.role.name);

    req.user.permissions = [...new Set(systemPerms)];
    req.user.roles = systemRoles;

    next();
  } catch (err) {
    next(err);
  }
}
