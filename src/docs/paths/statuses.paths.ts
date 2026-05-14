import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};
const statusIdParam = {
  name: 'statusId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const statusPaths: PathsObject = {
  '/api/stores/{storeId}/statuses': {
    get: {
      tags: ['Statuses'],
      summary: 'Danh sách quy trình xử lý đơn',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách trạng thái',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Status' } },
                  message: { type: 'string', example: 'Quy trình xử lý đơn hàng' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Statuses'],
      summary: 'Thêm bước xử lý trung gian',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateStatusRequest' },
            examples: {
              default: {
                summary: 'Ví dụ thêm bước',
                value: { name: 'Đang chuẩn bị' },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('Status', 'Thêm bước thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },

  '/api/stores/{storeId}/statuses/reorder': {
    patch: {
      tags: ['Statuses'],
      summary: 'Sắp xếp lại các bước xử lý trung gian',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReorderStatusesRequest' },
            examples: {
              default: {
                summary: 'Ví dụ sắp xếp',
                value: { ids: [3, 4, 5] },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Danh sách sau khi sắp xếp',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Status' } },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403),
      },
    },
  },

  '/api/stores/{storeId}/statuses/{statusId}': {
    put: {
      tags: ['Statuses'],
      summary: 'Sửa tên bước xử lý',
      parameters: [storeIdParam, statusIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateStatusRequest' },
            examples: {
              default: {
                summary: 'Ví dụ đổi tên',
                value: { name: 'Đang chuẩn bị (Sửa)' },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Status', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Statuses'],
      summary: 'Xóa bước xử lý trung gian',
      parameters: [storeIdParam, statusIdParam],
      responses: {
        200: successResponse('Status', 'Xóa thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
};
