import type { SchemaObject } from 'openapi3-ts/oas31';

export const authSchemas: Record<string, SchemaObject> = {
  RegisterRequest: {
    type: 'object',
    required: ['name', 'phone', 'password'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100, example: 'Trần Trọng Nam' },
      phone: { type: 'string', pattern: '^(0|\\+84)[3-9]\\d{8}$', example: '0901234567' },
      password: { type: 'string', minLength: 8, example: 'password123' },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['phone', 'password'],
    properties: {
      phone: { type: 'string', example: '0901234567' },
      password: { type: 'string', example: 'password123' },
    },
  },
};
