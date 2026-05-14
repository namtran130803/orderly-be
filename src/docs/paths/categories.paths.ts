import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};
const catIdParam = {
  name: 'catId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const categoryPaths: PathsObject = {
  '/api/stores/{storeId}/categories': {
    get: {
      tags: ['Categories'],
      summary: 'Danh sách danh mục thực đơn',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách danh mục',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                  message: { type: 'string', example: 'Danh sách danh mục' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Categories'],
      summary: 'Tạo danh mục mới',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCategoryRequest' },
            examples: {
              default: {
                summary: 'Ví dụ tạo danh mục',
                value: { name: 'Cà phê máy', sortOrder: 1 },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('Category', 'Tạo danh mục thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },

  '/api/stores/{storeId}/categories/reorder': {
    post: {
      tags: ['Categories'],
      summary: 'Sắp xếp thứ tự danh mục',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReorderCategoriesRequest' },
            examples: {
              default: {
                summary: 'Ví dụ sắp xếp danh mục',
                value: { ids: [2, 1, 3] },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Đã cập nhật thứ tự danh mục',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Đã cập nhật thứ tự danh mục' },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403),
      },
    },
  },

  '/api/stores/{storeId}/categories/{catId}': {
    put: {
      tags: ['Categories'],
      summary: 'Cập nhật danh mục',
      parameters: [storeIdParam, catIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCategoryRequest' },
            examples: {
              default: {
                summary: 'Ví dụ cập nhật',
                value: { name: 'Cà phê pha máy', sortOrder: 2 },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Category', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Categories'],
      summary: 'Xóa danh mục',
      parameters: [storeIdParam, catIdParam],
      responses: {
        200: successResponse('Category', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
