import type { SchemaObject } from 'openapi3-ts/oas31';

export const TableListItem: SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    areaId: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Bàn 101' },
    orderId: { type: ['integer', 'null'], example: 126 },
    sortOrder: { type: 'integer', example: 1 },
    area: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Tầng 1' },
      },
      required: ['id', 'name'],
    },
  },
  required: ['id', 'areaId', 'name', 'orderId', 'sortOrder', 'area'],
};

export const tableSchemas: Record<string, SchemaObject> = {
  TableListItem,
  UpdateTableRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Bàn 1A' },
    },
  },
};
