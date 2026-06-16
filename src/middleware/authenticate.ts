import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/lib/jwt';
import { ApiError } from '@/lib/response';
import { prisma } from '@/config/prisma';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized();

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (!user) throw ApiError.unauthorized();

    req.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      permissions: [],
      roles: [],
    };
    next();
  } catch (err) {
    next(err);
  }
}