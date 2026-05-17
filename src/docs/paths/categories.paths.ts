import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const catIdParam = { name: 'catId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const categoryPaths: PathsObject = {
  '/api/stores/{storeId}/categories': {
    get: {
      tags: ['Danh mục'],
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
                  data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
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
      tags: ['Danh mục'],
      summary: 'Tạo',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCategoryRequest' },
            examples: { default: { value: { name: 'Cà phê máy', sortOrder: 1 } } },
          },
        },
      },
      responses: {
        201: successResponse('Category', 'Tạo thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/categories/reorder': {
    post: {
      tags: ['Danh mục'],
      summary: 'Sắp xếp',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReorderCategoriesRequest' },
            examples: { default: { value: { ids: [2, 1, 3] } } },
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
                properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Đã sắp xếp' } },
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
      tags: ['Danh mục'],
      summary: 'Cập nhật',
      parameters: [storeIdParam, catIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCategoryRequest' },
            examples: { default: { value: { name: 'Cà phê pha máy', sortOrder: 2 } } },
          },
        },
      },
      responses: {
        200: successResponse('Category', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Danh mục'],
      summary: 'Xóa',
      parameters: [storeIdParam, catIdParam],
      responses: {
        200: successResponse('Category', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
