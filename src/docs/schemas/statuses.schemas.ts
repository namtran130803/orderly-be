import type { SchemaObject } from 'openapi3-ts/oas31';

export const statusSchemas: Record<string, SchemaObject> = {
  CreateStatusRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Đang nướng' },
    },
  },
  ReorderStatusesRequest: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        example: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
      },
    },
  },
};
