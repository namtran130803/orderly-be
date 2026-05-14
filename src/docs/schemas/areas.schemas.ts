import type { SchemaObject } from 'openapi3-ts/oas31';

export const areaSchemas: Record<string, SchemaObject> = {
  CreateAreaRequest: {
    type: 'object',
    required: ['name', 'tableCount'],
    properties: {
      name:       { type: 'string', example: 'Tầng 1' },
      tableCount: { type: 'integer', example: 12 },
    },
  },
  UpdateAreaRequest: {
    type: 'object',
    properties: {
      name:       { type: 'string', example: 'Khu vực Tầng 1' },
      tableCount: { type: 'integer', example: 15 },
    },
  },
  ReorderAreasRequest: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'integer' },
        example: [2, 1, 3],
      },
    },
  },
};
