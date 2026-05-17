import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const statusIdParam = { name: 'statusId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const statusPaths: PathsObject = {
  '/api/stores/{storeId}/statuses': {
    get: {
      tags: ['Quy trình'],
      summary: 'Danh sách',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Status' } },
                  message: { type: 'string', example: 'Danh sách' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Quy trình'],
      summary: 'Tạo',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateStatusRequest' },
            examples: { default: { value: { name: 'Đang chuẩn bị' } } },
          },
        },
      },
      responses: {
        201: successResponse('Status', 'Tạo thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/statuses/reorder': {
    patch: {
      tags: ['Quy trình'],
      summary: 'Sắp xếp',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReorderStatusesRequest' },
            examples: { default: { value: { ids: [3, 4, 5] } } },
          },
        },
      },
      responses: {
        200: {
          description: 'Đã sắp xếp',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: { $ref: '#/components/schemas/Status' } } },
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
      tags: ['Quy trình'],
      summary: 'Cập nhật',
      parameters: [storeIdParam, statusIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateStatusRequest' },
            examples: { default: { value: { name: 'Đang chuẩn bị (Sửa)' } } },
          },
        },
      },
      responses: {
        200: successResponse('Status', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Quy trình'],
      summary: 'Xóa',
      parameters: [storeIdParam, statusIdParam],
      responses: {
        200: successResponse('Status', 'Xóa thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
};
