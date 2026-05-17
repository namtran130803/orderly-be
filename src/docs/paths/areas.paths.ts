import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const areaIdParam = { name: 'areaId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const areaPaths: PathsObject = {
  '/api/stores/{storeId}/areas': {
    get: {
      tags: ['Khu vực'],
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
                  data: { type: 'array', items: { $ref: '#/components/schemas/Area' } },
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
      tags: ['Khu vực'],
      summary: 'Tạo',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateAreaRequest' },
            examples: { default: { value: { name: 'Tầng 1', tableCount: 10 } } },
          },
        },
      },
      responses: {
        201: successResponse('Area', 'Tạo thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/areas/reorder': {
    post: {
      tags: ['Khu vực'],
      summary: 'Sắp xếp',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReorderAreasRequest' },
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
  '/api/stores/{storeId}/areas/{areaId}': {
    put: {
      tags: ['Khu vực'],
      summary: 'Cập nhật',
      parameters: [storeIdParam, areaIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateAreaRequest' },
            examples: { default: { value: { tableCount: 15 } } },
          },
        },
      },
      responses: {
        200: successResponse('Area', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Khu vực'],
      summary: 'Xóa',
      parameters: [storeIdParam, areaIdParam],
      responses: {
        200: successResponse('Area', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
