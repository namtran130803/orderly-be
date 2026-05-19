export const employeeSchemas = {
  SalaryTypeEnum: {
    type: 'string',
    enum: ['MONTHLY', 'HOURLY'],
  },

  Employee: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      userId: { type: 'integer', example: 1 },
      storeId: { type: 'integer', example: 1 },
      role: { type: 'string', example: 'employee' },
      salaryType: { $ref: '#/components/schemas/SalaryTypeEnum' },
      baseSalary: { type: 'integer', example: 5_000_000 },
      hourlyRate: { type: 'integer', nullable: true, example: 30_000 },
      workDays: {
        type: 'array',
        items: { type: 'integer', minimum: 1, maximum: 7 },
        description: 'Rỗng = theo lịch cửa hàng; 1=T2 … 7=CN',
      },
      createdAt: { type: 'string', format: 'date-time' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Nguyễn Văn A' },
          phone: { type: 'string', example: '0901234567' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      roles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            storeRole: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'Phục vụ' },
              },
            },
          },
        },
      },
    },
  },

  CreateEmployeeRequest: {
    type: 'object',
    required: ['phone', 'roleIds'],
    properties: {
      phone: { type: 'string', pattern: '^(0|\\+84)[3-9]\\d{8}$', example: '0901234567' },
      roleIds: { type: 'array', items: { type: 'integer' }, minItems: 1, example: [1, 2] },
      salaryType: { $ref: '#/components/schemas/SalaryTypeEnum' },
      baseSalary: { type: 'integer', minimum: 0, example: 5_000_000 },
      hourlyRate: { type: 'integer', minimum: 0, nullable: true, example: 30_000 },
      workDays: {
        type: 'array',
        items: { type: 'integer', minimum: 1, maximum: 7 },
        nullable: true,
        description: 'null hoặc [] = lịch cửa hàng',
      },
    },
  },

  UpdateSalaryRequest: {
    type: 'object',
    required: ['salaryType', 'baseSalary'],
    properties: {
      salaryType: { $ref: '#/components/schemas/SalaryTypeEnum' },
      baseSalary: { type: 'integer', minimum: 0 },
      hourlyRate: { type: 'integer', minimum: 0, nullable: true },
      workDays: {
        type: 'array',
        items: { type: 'integer', minimum: 1, maximum: 7 },
        nullable: true,
      },
    },
  },

  AssignRolesRequest: {
    type: 'object',
    required: ['roleIds'],
    properties: {
      roleIds: { type: 'array', items: { type: 'integer' }, minItems: 1, example: [1, 2] },
    },
  },

  EmployeeRole: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Phục vụ' },
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'categories.list' },
            name: { type: 'string', example: 'Xem danh sách' },
          },
        },
      },
    },
  },
};
