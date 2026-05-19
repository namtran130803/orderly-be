const attendanceStatus = { type: 'string', enum: ['WORK', 'PAID_LEAVE', 'UNPAID_LEAVE'] } as const;

export const attendanceSchemas = {
  AttendanceStatusEnum: attendanceStatus,

  RuntimeCell: {
    type: 'string',
    enum: ['OFF', 'ABSENT', 'WORK', 'PAID_LEAVE', 'UNPAID_LEAVE'],
    description: 'Ô lưới theo lịch hiệu lực (working day + override + bản ghi)',
  },

  AttendanceRecordStub: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      status: attendanceStatus,
      checkIn: { type: 'string', format: 'date-time', nullable: true },
      checkOut: { type: 'string', format: 'date-time', nullable: true },
      workMinutes: { type: 'integer', nullable: true },
      note: { type: 'string', nullable: true },
    },
  },

  AttendanceDayCell: {
    type: 'object',
    properties: {
      date: { type: 'string', format: 'date', example: '2026-05-01' },
      runtime: { $ref: '#/components/schemas/RuntimeCell' },
      record: { anyOf: [{ $ref: '#/components/schemas/AttendanceRecordStub' }, { type: 'null' }] },
    },
  },

  AttendanceEmployeeRow: {
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
      workDays: { type: 'array', items: { type: 'integer' }, nullable: true },
      hourlyRate: { type: 'integer', nullable: true },
      cells: { type: 'array', items: { $ref: '#/components/schemas/AttendanceDayCell' } },
    },
  },

  AttendanceMonthReport: {
    type: 'object',
    properties: {
      month: { type: 'integer', minimum: 1, maximum: 12 },
      year: { type: 'integer', example: 2026 },
      defaultWorkDays: { type: 'array', items: { type: 'integer' } },
      employees: { type: 'array', items: { $ref: '#/components/schemas/AttendanceEmployeeRow' } },
    },
  },

  AttendanceQrTokenPayload: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'JWT dùng cho kiosk / chấm bằng điện thoại' },
      expiresInSec: { type: 'integer', example: 300 },
    },
  },

  AttendanceScanBody: {
    type: 'object',
    required: ['qrToken'],
    properties: {
      qrToken: { type: 'string', minLength: 1 },
    },
  },

  AttendanceModel: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      employeeId: { type: 'integer' },
      date: { type: 'string', format: 'date-time' },
      checkIn: { type: 'string', format: 'date-time', nullable: true },
      checkOut: { type: 'string', format: 'date-time', nullable: true },
      workMinutes: { type: 'integer', nullable: true },
      status: attendanceStatus,
      note: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  CreateManualAttendanceBody: {
    type: 'object',
    required: ['employeeId', 'date', 'status'],
    properties: {
      employeeId: { type: 'integer' },
      date: { type: 'string', format: 'date' },
      status: attendanceStatus,
      checkIn: { type: 'string', format: 'date-time', nullable: true },
      checkOut: { type: 'string', format: 'date-time', nullable: true },
      note: { type: 'string', maxLength: 500, nullable: true },
    },
  },

  PatchAttendanceBody: {
    type: 'object',
    properties: {
      status: attendanceStatus,
      checkIn: { type: 'string', format: 'date-time', nullable: true },
      checkOut: { type: 'string', format: 'date-time', nullable: true },
      note: { type: 'string', maxLength: 500, nullable: true },
      workMinutes: { type: 'integer', minimum: 0, nullable: true },
    },
  },
};
