import type { SchemaObject } from 'openapi3-ts/oas31';

export const tableSchemas: Record<string, SchemaObject> = {
  UpdateTableRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Bàn 1A' },
    },
  },
};
