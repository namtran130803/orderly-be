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
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, name: true, phone: true },
    });
    if (!user) throw ApiError.unauthorized();

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
