import type { PathsObject } from 'openapi3-ts/oas31';
import { errorResponses } from '@/docs/schemas/common';

export const systemPaths: PathsObject = {
  '/api/system/modules': {
    get: {
      tags: ['Hệ thống'],
      summary: 'Mô-đun hệ thống',
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
                        code: { type: 'string', example: 'store' },
                        name: { type: 'string', example: 'Cửa hàng' },
                        apis: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              code: { type: 'string', example: 'store.list' },
                              name: { type: 'string', example: 'Xem danh sách cửa hàng' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
};
