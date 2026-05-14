import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';

// Gắn vào mọi route dạng /stores/:storeId/...
export async function requireStoreAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { storeId } = req.params;
    if (!storeId) throw ApiError.badRequest('Thiếu storeId');

    const storeNumId = Number(storeId);
    if (isNaN(storeNumId)) throw ApiError.badRequest('storeId không hợp lệ');

    const store = await prisma.store.findUnique({ where: { id: storeNumId } });
    if (!store) throw ApiError.notFound('Store');
    if (store.userId !== req.user!.id) throw ApiError.forbidden();

    req.store = store; // gắn store vào request để controller dùng lại
    next();
  } catch (err) {
    next(err);
  }
}
