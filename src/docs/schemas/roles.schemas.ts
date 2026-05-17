import type { SchemaObject } from 'openapi3-ts/oas31';

export const rolesSchemas: Record<string, SchemaObject> = {
  Role: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Quản trị viên' },
      code: { type: 'string', example: 'ADMIN' },
      isSystem: { type: 'boolean', example: true },
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            permission: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                code: { type: 'string', example: 'order.list' },
                name: { type: 'string', example: 'Xem đơn hàng' },
              },
            },
          },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateRoleRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100, example: 'Nhân viên' },
      code: { type: 'string', minLength: 1, maxLength: 100, example: 'nhan_vien' },
      permissionCodes: { type: 'array', items: { type: 'string' }, example: ['order.list', 'order.create'] },
    },
  },
  UpdateRoleRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Nhân viên Bán hàng' },
      code: { type: 'string', example: 'nv_ban_hang' },
      permissionCodes: { type: 'array', items: { type: 'string' }, example: ['order.list', 'order.create', 'order.detail'] },
    },
  },
};
