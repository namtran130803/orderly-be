import type { SchemaObject } from 'openapi3-ts/oas31';

export const orderSchemas: Record<string, any> = {
  OrderItemInput: {
    type: 'object',
    required: ['menuItemId', 'qty'],
    properties: {
      menuItemId: { type: 'integer', example: 1 },
      qty: { type: 'integer', example: 2 },
    },
  },
  CreateOrderRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      tableName: { type: 'string', nullable: true, example: 'Bàn 101' },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItemInput' } },
    },
  },
  UpdateOrderRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      tableName: { type: 'string', nullable: true, example: 'Bàn 101' },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItemInput' } },
    },
  },
};
