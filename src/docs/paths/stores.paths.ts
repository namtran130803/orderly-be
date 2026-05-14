import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, paginatedResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
  description: 'ID của cửa hàng',
};

export const storePaths: PathsObject = {
  '/api/stores': {
    get: {
      tags: ['Stores'],
      summary: 'Danh sách cửa hàng của người dùng',
      responses: {
        200: {
          description: 'Danh sách cửa hàng',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Store' },
                  },
                  message: { type: 'string', example: 'Danh sách cửa hàng' },
                },
              },
            },
          },
        },
        ...errorResponses(401),
      },
    },
    post: {
      tags: ['Stores'],
      summary: 'Tạo cửa hàng mới',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateStoreRequest' },
            examples: {
              default: {
                summary: 'Ví dụ tạo cửa hàng',
                value: { name: 'Chi nhánh Quận 1', address: '123 Lê Lợi' },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('Store', 'Tạo cửa hàng thành công'),
        ...errorResponses(400, 401),
      },
    },
  },

  '/api/stores/{storeId}': {
    put: {
      tags: ['Stores'],
      summary: 'Cập nhật thông tin cửa hàng',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateStoreRequest' },
            examples: {
              default: {
                summary: 'Ví dụ cập nhật',
                value: { name: 'Chi nhánh Quận 1 (Đã sửa)' },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Store', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Stores'],
      summary: 'Xóa cửa hàng',
      parameters: [storeIdParam],
      responses: {
        200: successResponse('Store', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
