import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const orderIdParam = { name: 'orderId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const orderPaths: PathsObject = {
  '/api/stores/{storeId}/orders': {
    get: {
      tags: ['Đơn hàng'],
      summary: 'Danh sách',
      parameters: [
        storeIdParam,
        { name: 'statusId', in: 'query', schema: { type: 'integer' }, description: 'Lọc theo trạng thái' },
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Lọc theo ngày (YYYY-MM-DD)' },
        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'asc: cũ→mới, desc: mới→cũ' },
        { name: 'cursor', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: {
        200: {
          description: 'Danh sách',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                  nextCursor: { type: 'integer', nullable: true },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      tags: ['Đơn hàng'],
      summary: 'Tạo',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateOrderRequest' },
            examples: {
              withTable: { value: { tableName: 'Bàn 3', items: [{ menuItemId: 1, qty: 2 }] } },
              takeaway: { value: { tableName: null, items: [{ menuItemId: 1, qty: 1 }] } },
            },
          },
        },
      },
      responses: {
        201: successResponse('Order', 'Tạo thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  '/api/stores/{storeId}/orders/{orderId}': {
    get: {
      tags: ['Đơn hàng'],
      summary: 'Chi tiết',
      parameters: [storeIdParam, orderIdParam],
      responses: {
        200: successResponse('Order', 'Chi tiết'),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      tags: ['Đơn hàng'],
      summary: 'Cập nhật',
      parameters: [storeIdParam, orderIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateOrderRequest' },
            examples: { default: { value: { tableName: null, items: [{ menuItemId: 1, qty: 3 }] } } },
          },
        },
      },
      responses: {
        200: successResponse('Order', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Đơn hàng'],
      summary: 'Xóa',
      parameters: [storeIdParam, orderIdParam],
      responses: {
        200: successResponse('Order', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  '/api/stores/{storeId}/orders/{orderId}/advance': {
    patch: {
      tags: ['Đơn hàng'],
      summary: 'Chuyển trạng thái',
      parameters: [storeIdParam, orderIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', required: ['fromStatusId'], properties: { fromStatusId: { type: 'integer' } } },
            examples: { default: { value: { fromStatusId: 2 } } },
          },
        },
      },
      responses: {
        200: successResponse('Order', 'Đã chuyển trạng thái'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  '/api/stores/{storeId}/orders/{orderId}/revert': {
    patch: {
      tags: ['Đơn hàng'],
      summary: 'Lùi trạng thái',
      parameters: [storeIdParam, orderIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', required: ['fromStatusId'], properties: { fromStatusId: { type: 'integer' } } },
            examples: { default: { value: { fromStatusId: 3 } } },
          },
        },
      },
      responses: {
        200: successResponse('Order', 'Đã lùi trạng thái'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
};
