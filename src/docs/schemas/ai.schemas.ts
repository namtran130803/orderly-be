import type { SchemaObject } from 'openapi3-ts/oas31';

export const aiSchemas: Record<string, SchemaObject> = {
  AnalyzeMenuRequest: {
    type: 'object',
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        description: 'Base64 data URL của ảnh menu (VD: data:image/jpeg;base64,...)',
        example: 'data:image/jpeg;base64,/9j/4AAQ...',
      },
    },
  },
  GenerateMenuRequest: {
    type: 'object',
    required: ['description'],
    properties: {
      description: {
        type: 'string',
        description: 'Mô tả menu dạng text (có thể copy từ kết quả analyze sau khi chỉnh sửa)',
        example: '## Cà Phê\n1. Cà Phê Đen: 25.000đ\n2. Cà Phê Sữa: 35.000đ',
      },
      mode: {
        type: 'string',
        enum: ['replace', 'append'],
        default: 'replace',
        description: 'replace: xóa menu cũ, tạo mới. append: thêm vào menu hiện tại.',
      },
    },
  },
  AnalyzeExpenseRequest: {
    type: 'object',
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        description: 'Base64 data URL của ảnh hóa đơn/biên lai (VD: data:image/jpeg;base64,...)',
        example: 'data:image/jpeg;base64,/9j/4AAQ...',
      },
    },
  },
  GenerateExpenseRequest: {
    type: 'object',
    required: ['description'],
    properties: {
      description: {
        type: 'string',
        description: 'Mô tả chi tiêu dạng text (có thể copy từ kết quả analyze sau khi chỉnh sửa)',
        example: '1. Nhập nguyên liệu: 500k\n2. Hóa đơn điện: 1.200k',
      },
    },
  },
};
