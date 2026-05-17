import type { SchemaObject } from 'openapi3-ts/oas31';

export const categorySchemas: Record<string, SchemaObject> = {
  CreateCategoryRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Cà phê máy' },
      sortOrder: { type: 'integer', example: 10 },
    },
  },
  UpdateCategoryRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Cà phê truyền thống' },
      sortOrder: { type: 'integer', example: 20 },
    },
  },
  ReorderCategoriesRequest: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: { type: 'array', items: { type: 'integer' }, example: [2, 1, 3] },
    },
  },
};
