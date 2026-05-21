import type { SchemaObject } from 'openapi3-ts/oas31';

export const storeSchemas: Record<string, SchemaObject> = {
  Store: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Chi nhánh Quận 1' },
      address: { type: 'string', example: '123 Lê Lợi' },
      roleName: { type: 'array', items: { type: 'string' }, example: ['Quản lý'] },
    },
  },
  CreateStoreRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Chi nhánh Quận 1' },
      address: { type: 'string', example: '123 Lê Lợi' },
    },
  },
  UpdateStoreRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Chi nhánh Quận 1 (Sửa)' },
      address: { type: 'string', example: '456 Nguyễn Huệ' },
    },
  },
};
