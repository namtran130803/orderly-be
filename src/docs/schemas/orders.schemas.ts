import type { SchemaObject } from 'openapi3-ts/oas31';

export const orderSchemas: Record<string, any> = {
  OrderItemInput: {
    type: 'object',
    required: ['menuItemId', 'qty'],
    properties: {
      menuItemId: { type: 'integer', example: 1 },
      qty:        { type: 'integer', example: 2 },
    },
  },
  CreateOrderRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      tableId: { type: 'integer', nullable: true, example: 3 },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/OrderItemInput' },
      },
    },
  },
  UpdateOrderRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      tableId: { type: 'integer', nullable: true, example: 3 },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/OrderItemInput' },
      },
    },
  },
};
