export const scheduleSchemas = {
  ScheduleOverrideItem: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      date: { type: 'string', format: 'date', example: '2026-05-18' },
      type: { type: 'string', enum: ['OFF', 'WORKING_DAY'], example: 'OFF' },
    },
  },
  ScheduleResponse: {
    type: 'object',
    properties: {
      defaultWorkDays: {
        type: 'array',
        items: { type: 'integer', minimum: 1, maximum: 7 },
        description: '1=CN … 7=Thứ 7 (theo Prisma Store.defaultWorkDays)',
        example: [1, 2, 3, 4, 5, 6],
      },
      overrides: {
        type: 'array',
        items: { $ref: '#/components/schemas/ScheduleOverrideItem' },
      },
    },
  },
  UpdateDefaultWorkDaysBody: {
    type: 'object',
    required: ['defaultWorkDays'],
    properties: {
      defaultWorkDays: {
        type: 'array',
        items: { type: 'integer', minimum: 1, maximum: 7 },
        minItems: 1,
        example: [1, 2, 3, 4, 5],
      },
    },
  },
  DefaultWorkDaysResult: {
    type: 'object',
    properties: {
      defaultWorkDays: {
        type: 'array',
        items: { type: 'integer' },
        example: [1, 2, 3, 4, 5, 6],
      },
    },
  },
  CreateScheduleOverrideBody: {
    type: 'object',
    required: ['date', 'type'],
    properties: {
      date: { type: 'string', format: 'date', example: '2026-05-21' },
      type: { type: 'string', enum: ['OFF', 'WORKING_DAY'], example: 'OFF' },
    },
  },
  ScheduleOverrideRow: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      storeId: { type: 'integer', example: 1 },
      date: { type: 'string', format: 'date-time', description: 'Ngày (server lưu 00:00 UTC theo VN)' },
      type: { type: 'string', enum: ['OFF', 'WORKING_DAY'] },
    },
  },
};
