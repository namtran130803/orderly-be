import type { SchemaObject } from 'openapi3-ts/oas31';

export const userRolesSchemas: Record<string, SchemaObject> = {
  UserRole: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Quản lý' },
      code: { type: 'string', example: 'quan_ly' },
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'categories.list' },
            name: { type: 'string', example: 'Xem danh sách' },
          },
        },
      },
    },
  },
  AssignRoleRequest: {
    type: 'object',
    required: ['roleIds'],
    properties: {
      roleIds: { type: 'array', items: { type: 'integer' }, minItems: 1, example: [1, 2] },
    },
  },
};
