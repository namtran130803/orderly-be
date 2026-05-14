import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

const tableIdParam = {
  name: 'tableId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const tablePaths: PathsObject = {
  '/api/stores/{storeId}/tables/{tableId}': {
    put: {
      tags: ['Tables'],
      summary: 'Cập nhật tên bàn',
      parameters: [storeIdParam, tableIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateTableRequest' },
            examples: {
              default: {
                summary: 'Ví dụ đổi tên bàn',
                value: { name: 'Bàn 1 VIP' },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Table', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Tables'],
      summary: 'Xóa bàn',
      parameters: [storeIdParam, tableIdParam],
      responses: {
        200: successResponse('null', 'Xóa bàn thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
