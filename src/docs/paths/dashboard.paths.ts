import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const dashboardPaths: PathsObject = {
  '/api/stores/{storeId}/dashboard': {
    get: {
      tags: ['Dashboard'],
      summary: 'Báo cáo doanh thu, chi phí và các món bán chạy',
      parameters: [
        storeIdParam,
        { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'Ngày bắt đầu (YYYY-MM-DD)' },
        { name: 'to',   in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'Ngày kết thúc (YYYY-MM-DD)' },
      ],
      responses: {
        200: successResponse('DashboardStats', 'Báo cáo thống kê'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
};
