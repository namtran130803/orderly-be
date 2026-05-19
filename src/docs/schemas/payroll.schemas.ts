export const payrollSchemas = {
  PayrollEmployeeRow: {
    type: 'object',
    properties: {
      employeeId: { type: 'integer' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          phone: { type: 'string' },
        },
      },
      salaryType: { type: 'string', enum: ['MONTHLY', 'HOURLY'] },
      baseSalary: { type: 'integer' },
      hourlyRate: { type: 'integer', nullable: true },
      standardDays: { type: 'integer', description: 'Ngày công chuẩn trong tháng theo lịch' },
      paidDays: { type: 'integer', description: 'Ngày WORK + PAID_LEAVE (ngày làm việc)' },
      salary: { type: 'integer', description: 'Tạm tính (preview) hoặc đã khóa từ snapshot' },
    },
  },

  PayrollPreviewResponse: {
    type: 'object',
    properties: {
      month: { type: 'integer' },
      year: { type: 'integer' },
      locked: { type: 'boolean', description: 'Đã có PayrollSnapshot cho kỳ này' },
      employees: { type: 'array', items: { $ref: '#/components/schemas/PayrollEmployeeRow' } },
    },
  },

  PayrollDayBreakdownRow: {
    type: 'object',
    properties: {
      date: { type: 'string', format: 'date' },
      status: { type: 'string', enum: ['OFF', 'WORK', 'PAID_LEAVE', 'UNPAID_LEAVE', 'ABSENT'] },
      workMinutes: { type: 'integer', nullable: true },
      countsTowardPaid: { type: 'boolean' },
    },
  },

  PayrollEmployeeDetailResponse: {
    type: 'object',
    properties: {
      month: { type: 'integer' },
      year: { type: 'integer' },
      locked: { type: 'boolean' },
      salary: { type: 'integer' },
      employee: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          salaryType: { type: 'string', enum: ['MONTHLY', 'HOURLY'] },
          baseSalary: { type: 'integer' },
          hourlyRate: { type: 'integer', nullable: true },
          usesStoreSchedule: { type: 'boolean' },
          effectiveWorkDays: { type: 'array', items: { type: 'integer' } },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              phone: { type: 'string' },
            },
          },
        },
      },
      counts: {
        type: 'object',
        properties: {
          standardDays: { type: 'integer' },
          paidDays: { type: 'integer' },
          workDays: { type: 'integer' },
          paidLeaveDays: { type: 'integer' },
          unpaidLeaveDays: { type: 'integer' },
          absentDays: { type: 'integer' },
          offDays: { type: 'integer' },
          totalWorkMinutes: { type: 'integer' },
          totalWorkHours: { type: 'number' },
        },
      },
      snapshot: {
        type: 'object',
        nullable: true,
        properties: {
          salary: { type: 'integer' },
          standardDays: { type: 'integer' },
          paidDays: { type: 'integer' },
          lockedAt: { type: 'string', format: 'date-time' },
        },
      },
      dayBreakdown: {
        type: 'array',
        items: { $ref: '#/components/schemas/PayrollDayBreakdownRow' },
      },
    },
  },

  PayrollSnapshotRow: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      storeId: { type: 'integer' },
      employeeId: { type: 'integer' },
      month: { type: 'integer' },
      year: { type: 'integer' },
      standardDays: { type: 'integer' },
      paidDays: { type: 'integer' },
      salary: { type: 'integer' },
      lockedAt: { type: 'string', format: 'date-time' },
      employee: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              phone: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
