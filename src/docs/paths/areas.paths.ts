import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};
const areaIdParam = {
  name: 'areaId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const areaPaths: PathsObject = {
  '/api/stores/{storeId}/areas': {
    get: {
      tags: ['Areas'],
      summary: 'Danh sách khu vực của cửa hàng',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách khu vực',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Area' } },
                  message: { type: 'string', example: 'Danh sách khu vực' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Areas'],
      summary: 'Tạo khu vực và tự động tạo số lượng bàn',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateAreaRequest' },
            examples: {
              default: {
                summary: 'Ví dụ tạo khu vực',
                value: { name: 'Tầng 1', tableCount: 10 },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('Area', 'Tạo khu vực thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },

  '/api/stores/{storeId}/areas/reorder': {
    post: {
      tags: ['Areas'],
      summary: 'Sắp xếp lại thứ tự khu vực',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReorderAreasRequest' },
            examples: {
              default: {
                summary: 'Ví dụ sắp xếp khu vực',
                value: { ids: [2, 1, 3] },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Đã cập nhật thứ tự khu vực',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Đã cập nhật thứ tự khu vực' },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403),
      },
    },
  },

  '/api/stores/{storeId}/areas/{areaId}': {
    put: {
      tags: ['Areas'],
      summary: 'Cập nhật khu vực và đồng bộ bàn',
      parameters: [storeIdParam, areaIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateAreaRequest' },
            examples: {
              default: {
                summary: 'Ví dụ cập nhật',
                value: { tableCount: 15 },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Area', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Areas'],
      summary: 'Xóa khu vực',
      parameters: [storeIdParam, areaIdParam],
      responses: {
        200: successResponse('Area', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
