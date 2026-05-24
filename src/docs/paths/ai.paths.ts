import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

const descriptionResponse = (example: string) => ({
  'application/json': {
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: { description: { type: 'string', example } },
        },
        message: { type: 'string' },
      },
    },
  },
});

export const aiPaths: PathsObject = {
  '/api/stores/{storeId}/ai/menu/analyze': {
    post: {
      tags: ['AI'],
      summary: 'Phân tích ảnh menu',
      description: 'Gửi ảnh menu (base64) → AI trả về text mô tả để chủ quán xem trước và chỉnh sửa.',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AnalyzeMenuRequest' },
            examples: {
              default: {
                value: {
                  image: 'data:image/jpeg;base64,/9j/4AAQ...',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Phân tích thành công',
          content: descriptionResponse(
            '## Cà Phê\n1. Cà Phê Đen: 25.000đ\n2. Cà Phê Sữa: 35.000đ\n\n## Sinh Tố\n1. Sinh Tố Bơ: 45.000đ',
          ),
        },
        ...errorResponses(400, 401, 403, 500),
      },
    },
  },
  '/api/stores/{storeId}/ai/menu/generate': {
    post: {
      tags: ['AI'],
      summary: 'Tạo menu từ AI',
      description:
        'Gửi text mô tả menu → AI phân tích thành JSON → Tạo categories + menu items trong DB. ' +
        'Hỗ trợ 2 chế độ: replace (xóa menu cũ) hoặc append (thêm vào menu hiện tại).',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GenerateMenuRequest' },
            examples: {
              replace: {
                summary: 'Thay thế menu',
                value: {
                  description:
                    '## Cà Phê\n1. Cà Phê Đen: 25.000đ\n2. Cà Phê Sữa: 35.000đ\n\n## Sinh Tố\n1. Sinh Tố Bơ: 45.000đ',
                  mode: 'replace',
                },
              },
              append: {
                summary: 'Thêm vào menu',
                value: {
                  description: '## Bánh Ngọt\n1. Bánh Tiramisu: 55.000đ\n2. Bánh Crepe: 45.000đ',
                  mode: 'append',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Tạo menu thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      categories: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Category' },
                      },
                      menuItems: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MenuItem' },
                      },
                    },
                  },
                  message: { type: 'string', example: 'Tạo menu thành công' },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403, 500),
      },
    },
  },
  '/api/stores/{storeId}/ai/expenses/analyze': {
    post: {
      tags: ['AI'],
      summary: 'Phân tích ảnh chi tiêu',
      description: 'Gửi ảnh hóa đơn/biên lai (base64) → AI trả về text mô tả các khoản chi tiêu.',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AnalyzeExpenseRequest' },
            examples: {
              default: {
                value: { image: 'data:image/jpeg;base64,/9j/4AAQ...' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Phân tích thành công',
          content: descriptionResponse(
            '1. Nhập nguyên liệu: 500k (2024-01-15)\n2. Hóa đơn điện: 1.200k (2024-01-10)\n3. Phí vận chuyển: 150k',
          ),
        },
        ...errorResponses(400, 401, 403, 500),
      },
    },
  },
  '/api/stores/{storeId}/ai/expenses/generate': {
    post: {
      tags: ['AI'],
      summary: 'Tạo chi tiêu từ AI',
      description:
        'Gửi text mô tả chi tiêu → AI phân tích thành JSON → Tạo các expense records trong DB.',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GenerateExpenseRequest' },
            examples: {
              default: {
                value: {
                  description: '1. Nhập nguyên liệu: 500k (2024-01-15)\n2. Hóa đơn điện: 1.200k',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Tạo chi tiêu thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      expenses: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Expense' },
                      },
                    },
                  },
                  message: { type: 'string', example: 'Tạo chi tiêu thành công' },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403, 500),
      },
    },
  },
};
