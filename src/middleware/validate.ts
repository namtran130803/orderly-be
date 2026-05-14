import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '@/lib/response';

type Target = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      sendError(res, 400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', details);
      return;
    }
    // Ghi đè bằng data đã được parse/sanitize — loại bỏ field thừa
    req[target] = result.data as any;
    next();
  };
}
