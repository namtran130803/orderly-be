import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
};

const dashboardRangeQueryParams = [
  storeIdParam,
  {
    name: 'from',
    in: 'query' as const,
    required: true,
    schema: { type: 'string' as const, format: 'date' as const },
    description: 'YYYY-MM-DD (VN)',
  },
  {
    name: 'to',
    in: 'query' as const,
    required: true,
    schema: { type: 'string' as const, format: 'date' as const },
    description: 'YYYY-MM-DD (VN), inclusive',
  },
];

export const dashboardPaths: PathsObject = {
  '/api/stores/{storeId}/dashboard': {
    get: {
      tags: ['Thống kê'],
      summary: 'Thống kê (legacy)',
      parameters: dashboardRangeQueryParams,
      responses: {
        200: successResponse('DashboardStats', 'OK'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/dashboard/finance': {
    get: {
      tags: ['Thống kê'],
      summary: 'Tài chính theo kỳ',
      parameters: dashboardRangeQueryParams,
      responses: {
        200: successResponse('DashboardFinance', 'OK'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/dashboard/orders': {
    get: {
      tags: ['Thống kê'],
      summary: 'Đơn hàng theo kỳ',
      parameters: dashboardRangeQueryParams,
      responses: {
        200: successResponse('DashboardOrders', 'OK'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/dashboard/operations': {
    get: {
      tags: ['Thống kê'],
      summary: 'Vận hành hôm nay',
      parameters: [storeIdParam],
      responses: {
        200: successResponse('DashboardOperations', 'OK'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/dashboard/staff': {
    get: {
      tags: ['Thống kê'],
      summary: 'Nhân sự (today + kỳ)',
      parameters: dashboardRangeQueryParams,
      responses: {
        200: successResponse('DashboardStaff', 'OK'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
};
