import type { SchemaObject } from 'openapi3-ts/oas31';

export const commonSchemas: Record<string, any> = {
  ApiError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code:    { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Dữ liệu không hợp lệ' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field:   { type: 'string', example: 'price' },
                message: { type: 'string', example: 'Giá phải là số dương' },
              },
            },
          },
        },
      },
    },
  },

  PaginationMeta: {
    type: 'object',
    properties: {
      page:       { type: 'integer', example: 1 },
      limit:      { type: 'integer', example: 20 },
      total:      { type: 'integer', example: 87 },
      totalPages: { type: 'integer', example: 5 },
    },
  },

  IntegerId: {
    type: 'integer',
    example: 1,
  },

  UserProfile: {
    type: 'object',
    properties: {
      id:        { type: 'integer', example: 1 },
      name:      { type: 'string', example: 'Nguyễn Văn A' },
      phone:     { type: 'string', example: '0389999999' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  AuthResponse: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'JWT Bearer token', example: 'eyJhbGciOiJIUzI1NiIs...' },
      user:  { $ref: '#/components/schemas/UserProfile' },
    },
  },

  Store: {
    type: 'object',
    properties: {
      id:        { type: 'integer', example: 1 },
      name:      { type: 'string', example: 'Chi nhánh Quận 1' },
      address:   { type: 'string', nullable: true, example: '123 Lê Lợi' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  Category: {
    type: 'object',
    properties: {
      id:        { type: 'integer', example: 1 },
      name:      { type: 'string', example: 'Cà phê máy' },
      sortOrder: { type: 'integer', example: 1 },
    },
  },

  MenuItem: {
    type: 'object',
    properties: {
      id:         { type: 'integer', example: 1 },
      name:       { type: 'string', example: 'Cà phê Sữa đá' },
      price:      { type: 'integer', example: 29000 },
      categoryId: { type: 'integer', example: 1 },
    },
  },

  Table: {
    type: 'object',
    properties: {
      id:        { type: 'integer', example: 1 },
      name:      { type: 'string', example: 'Bàn 1' },
      sortOrder: { type: 'integer', example: 1 },
      areaId:    { type: 'integer', example: 1 },
    },
  },

  Area: {
    type: 'object',
    properties: {
      id:        { type: 'integer', example: 1 },
      name:      { type: 'string', example: 'Tầng 1' },
      sortOrder: { type: 'integer', example: 1 },
    },
  },

  Status: {
    type: 'object',
    properties: {
      id:        { type: 'integer', example: 1 },
      name:      { type: 'string', example: 'Chờ xử lý' },
      type:      { type: 'string', enum: ['start', 'mid', 'end'], example: 'start' },
      sortOrder: { type: 'integer', example: 10 },
    },
  },

  Order: {
    type: 'object',
    properties: {
      id:             { type: 'integer', example: 1 },
      tableId:        { type: 'integer', nullable: true, example: 1 },
      tableSnapshot:  { type: 'string', nullable: true, example: 'Bàn 101' },
      statusId:       { type: 'integer', nullable: true, example: 1 },
      statusSnapshot: { type: 'string', nullable: true, example: 'Chờ xử lý' },
      createdAt:      { type: 'string', format: 'date-time' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/OrderItem' },
      },
    },
  },

  OrderItem: {
    type: 'object',
    properties: {
      id:             { type: 'integer', example: 1 },
      menuItemId:     { type: 'integer', nullable: true, example: 1 },
      statusId:       { type: 'integer', nullable: true, example: 1 },
      statusSnapshot: { type: 'string', nullable: true, example: 'Đang pha chế' },
      nameSnapshot:   { type: 'string', example: 'Cà phê Sữa đá' },
      priceSnapshot:  { type: 'integer', example: 29000 },
      qty:            { type: 'integer', example: 2 },
    },
  },

  Expense: {
    type: 'object',
    properties: {
      id:          { type: 'integer', example: 1 },
      title:       { type: 'string', example: 'Nhập nguyên liệu sữa' },
      description: { type: 'string', nullable: true, example: 'Thanh toán cho đơn hàng tháng 4' },
      amount:      { type: 'integer', example: 500000 },
      rawDate:     { type: 'string', format: 'date' },
    },
  },

  DashboardStats: {
    type: 'object',
    properties: {
      revenue:    { type: 'integer', example: 15200000 },
      expense:    { type: 'integer', example: 2300000 },
      orderCount: { type: 'integer', example: 125 },
      topItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Cà phê Sữa đá' },
            qty:  { type: 'integer', example: 45 },
          },
        },
      },
    },
  },
};

export function successResponse(schemaRef: string, description = 'Thành công') {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { $ref: `#/components/schemas/${schemaRef}` },
            message: { type: 'string', example: 'Success' },
          },
        },
      },
    },
  };
}

export function paginatedResponse(schemaRef: string, description = 'Danh sách') {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success:    { type: 'boolean', example: true },
            data:       { type: 'array', items: { $ref: `#/components/schemas/${schemaRef}` } },
            pagination: { $ref: '#/components/schemas/PaginationMeta' },
          },
        },
      },
    },
  };
}

export function errorResponses(...codes: number[]) {
  const map: Record<number, string> = {
    400: 'Dữ liệu không hợp lệ',
    401: 'Chưa xác thực',
    403: 'Không có quyền',
    404: 'Không tìm thấy',
    409: 'Xung đột dữ liệu',
    500: 'Lỗi server',
  };
  return Object.fromEntries(
    codes.map((code) => [
      code,
      {
        description: map[code] ?? String(code),
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ApiError' } },
        },
      },
    ]),
  );
}
