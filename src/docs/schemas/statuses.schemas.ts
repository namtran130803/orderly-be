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
      ids: { type: 'array', items: { type: 'integer' }, example: [2, 3, 4] },
    },
  },
};
