import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Thành công — đơn lẻ
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): void {
  res.status(statusCode).json({ success: true, data, message });
}

// Thành công — có phân trang
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
): void {
  res.status(200).json({ success: true, data, pagination });
}

// Thành công — có phân trang (cursor)
export function sendCursorPaginated<T>(
  res: Response,
  data: T[],
  nextCursor: string | number | null,
): void {
  res.status(200).json({ success: true, data, nextCursor });
}

// Lỗi — dùng qua ApiError, không gọi trực tiếp từ controller
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

// ── ApiError class ──────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Factory methods — dùng những cái này thay vì new ApiError(...)
  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }
  static notFound(resource: string) {
    return new ApiError(404, 'NOT_FOUND', `${resource} không tồn tại`);
  }
  static conflict(message: string) {
    return new ApiError(409, 'CONFLICT', message);
  }
  static internal(message = 'Lỗi server') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
