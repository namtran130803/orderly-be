import { z } from 'zod';
import { PaginationMeta } from '@/lib/response';

export const paginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export function getPaginationParams(query: PaginationQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
  };
}
