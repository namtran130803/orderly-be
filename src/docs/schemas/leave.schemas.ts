export const leaveSchemas = {
  LeaveRequestStatusEnum: {
    type: 'string',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  },

  LeaveRequestUserStub: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      phone: { type: 'string' },
    },
  },

  LeaveRequestEmployee: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      user: { $ref: '#/components/schemas/LeaveRequestUserStub' },
    },
  },

  LeaveRequestModel: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      storeId: { type: 'integer' },
      employeeId: { type: 'integer' },
      fromDate: { type: 'string', format: 'date-time' },
      toDate: { type: 'string', format: 'date-time' },
      isPaid: { type: 'boolean' },
      reason: { type: 'string', nullable: true },
      status: { $ref: '#/components/schemas/LeaveRequestStatusEnum' },
      reviewedBy: { type: 'integer', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      employee: { $ref: '#/components/schemas/LeaveRequestEmployee' },
      reviewer: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
      },
    },
  },

  CreateLeaveBody: {
    type: 'object',
    required: ['fromDate', 'toDate', 'isPaid'],
    properties: {
      fromDate: { type: 'string', format: 'date', example: '2026-05-20' },
      toDate: { type: 'string', format: 'date', example: '2026-05-22' },
      isPaid: { type: 'boolean', example: true },
      reason: { type: 'string', maxLength: 2000, nullable: true },
    },
  },
};
