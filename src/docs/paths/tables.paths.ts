import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const tableIdParam = { name: 'tableId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const tablePaths: PathsObject = {
  '/api/stores/{storeId}/tables': {
    get: {
      tags: ['Bàn'],
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
                  data: { type: 'array', items: { $ref: '#/components/schemas/Table' } },
                  message: { type: 'string', example: 'Danh sách' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  '/api/stores/{storeId}/tables/{tableId}': {
    put: {
      tags: ['Bàn'],
      summary: 'Cập nhật',
      parameters: [storeIdParam, tableIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateTableRequest' },
            examples: { default: { value: { name: 'Bàn 1 VIP' } } },
          },
        },
      },
      responses: {
        200: successResponse('Table', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Bàn'],
      summary: 'Xóa',
      parameters: [storeIdParam, tableIdParam],
      responses: {
        200: successResponse('null', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
