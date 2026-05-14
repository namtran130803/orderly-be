import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};
const itemIdParam = {
  name: 'itemId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const menuItemPaths: PathsObject = {
  '/api/stores/{storeId}/menu-items': {
    get: {
      tags: ['Menu Items'],
      summary: 'Danh sách món ăn của cửa hàng',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách món ăn',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/MenuItem' } },
                  message: { type: 'string', example: 'Danh sách món ăn' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Menu Items'],
      summary: 'Thêm món ăn mới',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateMenuItemRequest' },
            examples: {
              default: {
                summary: 'Ví dụ thêm món',
                value: { name: 'Cà phê Sữa đá', price: 29000, categoryId: 1 },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('MenuItem', 'Thêm món thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },

  '/api/stores/{storeId}/menu-items/{itemId}': {
    put: {
      tags: ['Menu Items'],
      summary: 'Cập nhật món ăn',
      parameters: [storeIdParam, itemIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateMenuItemRequest' },
            examples: {
              default: {
                summary: 'Ví dụ cập nhật',
                value: { price: 35000 },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('MenuItem', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Menu Items'],
      summary: 'Xóa món ăn',
      parameters: [storeIdParam, itemIdParam],
      responses: {
        200: successResponse('MenuItem', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
