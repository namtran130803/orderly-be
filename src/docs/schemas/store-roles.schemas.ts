export const storeRoleSchemas = {
  StoreRole: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      storeId: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Phục vụ' },
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            permission: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                code: { type: 'string', example: 'category.list' },
                name: { type: 'string', example: 'Xem danh mục' },
              },
            },
          },
        },
      },
    },
  },
  MyStoreRoleResponse: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Thu ngân' },
        permissions: { type: 'array', items: { type: 'string' }, example: ['orders.list', 'orders.create'] },
      },
    },
  },
  CreateStoreRoleRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Phục vụ' },
      permissionCodes: {
        type: 'array',
        items: { type: 'string' },
        example: ['category.list', 'category.create', 'order.list', 'order.create'],
      },
    },
  },
  UpdateStoreRoleRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Phục vụ senior' },
      permissionCodes: {
        type: 'array',
        items: { type: 'string' },
        example: ['category.list', 'category.create', 'category.update', 'order.list', 'order.create'],
      },
    },
  },
};
