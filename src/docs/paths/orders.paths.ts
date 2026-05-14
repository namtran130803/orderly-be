import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, paginatedResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
  description: 'ID của cửa hàng',
};
const orderIdParam = {
  name: 'orderId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const orderPaths: PathsObject = {
  '/api/stores/{storeId}/orders': {
    get: {
      tags: ['Orders'],
      summary: 'Danh sách đơn hàng',
      parameters: [
        storeIdParam,
        { name: 'statusId', in: 'query', schema: { type: 'integer' }, description: 'Lọc theo trạng thái' },
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Lọc theo ngày (YYYY-MM-DD)' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: {
        200: paginatedResponse('Order', 'Danh sách đơn hàng'),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      tags: ['Orders'],
      summary: 'Tạo đơn hàng mới',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateOrderRequest' },
            examples: {
              withTable: {
                summary: 'Đơn có bàn',
                value: {
                  tableId: 3,
                  items: [
                    { menuItemId: 1, qty: 2 },
                  ],
                },
              },
              takeaway: {
                summary: 'Đơn mang về',
                value: {
                  tableId: null,
                  items: [{ menuItemId: 1, qty: 1 }],
                },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('Order', 'Tạo đơn thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },

  '/api/stores/{storeId}/orders/{orderId}': {
    get: {
      tags: ['Orders'],
      summary: 'Chi tiết đơn hàng',
      parameters: [storeIdParam, orderIdParam],
      responses: {
        200: successResponse('Order', 'Chi tiết đơn hàng'),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      tags: ['Orders'],
      summary: 'Cập nhật món ăn và bàn của đơn hàng',
      parameters: [storeIdParam, orderIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateOrderRequest' },
            examples: {
              default: {
                summary: 'Ví dụ cập nhật',
                value: {
                  tableId: null,
                  items: [{ menuItemId: 1, qty: 3 }],
                },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Order', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Orders'],
      summary: 'Xóa đơn hàng',
      parameters: [storeIdParam, orderIdParam],
      responses: {
        200: successResponse('Order', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },

  '/api/stores/{storeId}/orders/{orderId}/advance': {
    patch: {
      tags: ['Orders'],
      summary: 'Chuyển đơn sang trạng thái tiếp theo',
      description: 'Tất cả order_items đang ở `fromStatusId` sẽ được chuyển sang status kế tiếp theo thứ tự `sortOrder`.',
      parameters: [storeIdParam, orderIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fromStatusId'],
              properties: {
                fromStatusId: { type: 'integer' },
              },
            },
            examples: {
              default: {
                summary: 'Ví dụ chuyển tiếp',
                value: { fromStatusId: 2 },
              },
            },
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
      tags: ['Orders'],
      summary: 'Quay lại trạng thái xử lý liền trước',
      parameters: [storeIdParam, orderIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fromStatusId'],
              properties: {
                fromStatusId: { type: 'integer' },
              },
            },
            examples: {
              default: {
                summary: 'Ví dụ lùi bước',
                value: { fromStatusId: 3 },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Order', 'Quay lại trạng thái thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
};
