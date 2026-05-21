import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const storePaths: PathsObject = {
  '/api/stores': {
    get: {
      tags: ['Cửa hàng'],
      summary: 'Danh sách',
      parameters: [
        { name: 'userId', in: 'query', schema: { type: 'integer' }, description: 'Lọc theo user (yêu cầu bypass_owner)' },
      ],
      responses: {
        200: {
          description: 'Danh sách',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Store' } },
                  message: { type: 'string', example: 'Danh sách' },
                },
              },
            },
          },
        },
        ...errorResponses(401),
      },
    },
    post: {
      tags: ['Cửa hàng'],
      summary: 'Tạo',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Chi nhánh Quận 1' },
                address: { type: 'string', example: '123 Lê Lợi' },
                userId: { type: 'integer', description: 'ID user sở hữu (yêu cầu bypass_owner)' },
              },
            },
            examples: { default: { value: { name: 'Chi nhánh Quận 1', address: '123 Lê Lợi' } } },
          },
        },
      },
      responses: {
        201: {
          description: 'Tạo thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Store' },
                  message: { type: 'string', example: 'Tạo thành công' },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401),
      },
    },
  },
  '/api/stores/{storeId}/modules': {
    get: {
      tags: ['Cửa hàng'],
      summary: 'Mô-đun',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách mô-đun',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'stores' },
                        name: { type: 'string', example: 'Cửa hàng' },
                        apis: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              code: { type: 'string', example: 'stores.list' },
                              name: { type: 'string', example: 'Xem danh sách' },
                            },
                          },
                        },
                      },
                    },
                  },
                  message: { type: 'string', example: 'Danh sách mô-đun' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  '/api/stores/{storeId}': {
    put: {
      tags: ['Cửa hàng'],
      summary: 'Cập nhật',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateStoreRequest' },
            examples: { default: { value: { name: 'Chi nhánh Quận 1 (Sửa)' } } },
          },
        },
      },
      responses: {
        200: {
          description: 'Cập nhật thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Store' },
                  message: { type: 'string', example: 'Cập nhật thành công' },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Cửa hàng'],
      summary: 'Xóa',
      parameters: [storeIdParam],
      responses: {
        200: successResponse('Store', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
