import type { SchemaObject } from 'openapi3-ts/oas31';

export const menuItemSchemas: Record<string, SchemaObject> = {
  CreateMenuItemRequest: {
    type: 'object',
    required: ['name', 'price', 'categoryId'],
    properties: {
      name:       { type: 'string', example: 'Cà phê Sữa đá' },
      price:      { type: 'integer', example: 29000 },
      categoryId: { type: 'integer', example: 1 },
    },
  },
  UpdateMenuItemRequest: {
    type: 'object',
    properties: {
      name:       { type: 'string', example: 'Cà phê Sữa đá (Size L)' },
      price:      { type: 'integer', example: 35000 },
      categoryId: { type: 'integer', example: 1 },
    },
  },
};
