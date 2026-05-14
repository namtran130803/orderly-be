import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError, sendError } from '@/lib/response';
import { env } from '@/config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 1. Lỗi do chính code throw (ApiError)
  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // 2. Lỗi validation Zod (bắt được từ middleware validate)
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', details);
    return;
  }

  // 3. Lỗi Prisma — map sang HTTP code phù hợp
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 409, 'CONFLICT', 'Dữ liệu đã tồn tại (trùng unique key)');
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Bản ghi không tồn tại');
      return;
    }
  }

  // 4. Lỗi không xác định — log đầy đủ ở server, trả về thông tin tối thiểu
  console.error('[UnhandledError]', err);
  const message =
    env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'Lỗi server nội bộ';
  sendError(res, 500, 'INTERNAL_ERROR', message);
}
