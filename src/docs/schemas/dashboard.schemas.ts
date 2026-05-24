import type { SchemaObject } from 'openapi3-ts/oas31';

export const DashboardFinanceCompare: SchemaObject = {
  type: 'object',
  properties: {
    revenue: { type: 'integer', example: 12_000_000 },
    expense: { type: 'integer', example: 2_000_000 },
    profit: { type: 'integer', example: 10_000_000 },
    revenuePct: { type: ['number', 'null'], example: 12.5 },
    expensePct: { type: ['number', 'null'] },
    profitPct: { type: ['number', 'null'] },
  },
  required: [
    'revenue',
    'expense',
    'profit',
    'revenuePct',
    'expensePct',
    'profitPct',
  ],
};

export const DashboardFinance: SchemaObject = {
  type: 'object',
  properties: {
    revenue: { type: 'integer', example: 15_200_000 },
    expense: { type: 'integer', example: 2_300_000 },
    profit: { type: 'integer', example: 12_900_000 },
    comparePrevious: {
      anyOf: [
        { $ref: '#/components/schemas/DashboardFinanceCompare' },
        { type: 'null' },
      ],
    },
  },
  required: ['revenue', 'expense', 'profit', 'comparePrevious'],
};

export const DashboardOrderStatusCount: SchemaObject = {
  type: 'object',
  properties: {
    statusId: { type: ['integer', 'null'] },
    name: { type: 'string', example: 'Đang làm' },
    count: { type: 'integer', example: 12 },
  },
  required: ['statusId', 'name', 'count'],
};

export const DashboardTopItem: SchemaObject = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'Phin đá' },
    qty: { type: 'integer', example: 42 },
    revenue: { type: 'integer', example: 580_000 },
  },
  required: ['name', 'qty', 'revenue'],
};

export const DashboardOrdersByHour: SchemaObject = {
  type: 'object',
  properties: {
    hour: { type: 'integer', minimum: 0, maximum: 23, example: 8 },
    count: { type: 'integer', example: 5 },
  },
  required: ['hour', 'count'],
};

export const DashboardOrdersCompare: SchemaObject = {
  type: 'object',
  properties: {
    orderCount: { type: 'integer', example: 110 },
    completedOrderCount: { type: 'integer', example: 95 },
    orderCountPct: { type: ['number', 'null'] },
    completedOrderCountPct: { type: ['number', 'null'] },
  },
  required: [
    'orderCount',
    'completedOrderCount',
    'orderCountPct',
    'completedOrderCountPct',
  ],
};

export const DashboardOrders: SchemaObject = {
  type: 'object',
  properties: {
    orderCount: { type: 'integer', example: 120 },
    completedOrderCount: { type: 'integer', example: 94 },
    avgOrderValue: { type: 'integer', example: 162_000 },
    dineInCount: { type: 'integer', example: 70 },
    takeawayCount: { type: 'integer', example: 50 },
    byStatus: {
      type: 'array',
      items: { $ref: '#/components/schemas/DashboardOrderStatusCount' },
    },
    topItems: {
      type: 'array',
      items: { $ref: '#/components/schemas/DashboardTopItem' },
    },
    ordersByHour: {
      type: 'array',
      items: { $ref: '#/components/schemas/DashboardOrdersByHour' },
    },
    comparePrevious: {
      anyOf: [
        { $ref: '#/components/schemas/DashboardOrdersCompare' },
        { type: 'null' },
      ],
    },
  },
  required: [
    'orderCount',
    'completedOrderCount',
    'avgOrderValue',
    'dineInCount',
    'takeawayCount',
    'byStatus',
    'topItems',
    'ordersByHour',
    'comparePrevious',
  ],
};

export const DashboardOperations: SchemaObject = {
  type: 'object',
  properties: {
    date: { type: 'string', format: 'date', example: '2026-05-21' },
    storeOpenToday: { type: 'boolean' },
    openOrderCount: { type: 'integer', example: 3 },
    busyTables: { type: 'integer', example: 2 },
    totalTables: { type: 'integer', example: 14 },
    unavailableMenuCount: { type: 'integer', example: 1 },
    leavePendingCount: { type: 'integer', example: 0 },
  },
  required: [
    'date',
    'storeOpenToday',
    'openOrderCount',
    'busyTables',
    'totalTables',
    'unavailableMenuCount',
    'leavePendingCount',
  ],
};

export const DashboardStaffOnShift: SchemaObject = {
  type: 'object',
  properties: {
    employeeId: { type: 'integer', example: 12 },
    name: { type: 'string', example: 'Lan' },
  },
  required: ['employeeId', 'name'],
};

export const DashboardStaffToday: SchemaObject = {
  type: 'object',
  properties: {
    scheduledCount: { type: 'integer', example: 5 },
    workingCount: { type: 'integer', example: 4 },
    onShiftNow: {
      type: 'array',
      items: { $ref: '#/components/schemas/DashboardStaffOnShift' },
    },
    absentCount: { type: 'integer', example: 1 },
    paidLeaveToday: { type: 'integer', example: 0 },
    unpaidLeaveToday: { type: 'integer', example: 0 },
  },
  required: [
    'scheduledCount',
    'workingCount',
    'onShiftNow',
    'absentCount',
    'paidLeaveToday',
    'unpaidLeaveToday',
  ],
};

export const DashboardStaffPeriod: SchemaObject = {
  type: 'object',
  properties: {
    workDays: { type: 'integer', example: 112 },
    absentDays: { type: 'integer', example: 3 },
    paidLeaveDays: { type: 'integer', example: 2 },
    unpaidLeaveDays: { type: 'integer', example: 1 },
    totalWorkMinutes: { type: 'integer', example: 43_200 },
    estimatedPayrollTotal: { type: 'integer', example: 45_000_000 },
    payrollLocked: { type: 'boolean' },
  },
  required: ['workDays', 'absentDays', 'paidLeaveDays', 'unpaidLeaveDays', 'totalWorkMinutes'],
};

export const DashboardStaff: SchemaObject = {
  type: 'object',
  properties: {
    today: { $ref: '#/components/schemas/DashboardStaffToday' },
    period: { $ref: '#/components/schemas/DashboardStaffPeriod' },
  },
  required: ['today', 'period'],
};

export const DashboardStats: SchemaObject = {
  type: 'object',
  properties: {
    revenue: { type: 'integer', example: 15_200_000 },
    expense: { type: 'integer', example: 2_300_000 },
    orderCount: { type: 'integer', example: 125 },
    topItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Cà phê Sữa đá' },
          qty: { type: 'integer', example: 45 },
        },
        required: ['name', 'qty'],
      },
    },
  },
  required: ['revenue', 'expense', 'orderCount', 'topItems'],
};

export const dashboardSchemas: Record<string, SchemaObject> = {
  DashboardFinanceCompare,
  DashboardFinance,
  DashboardOrdersCompare,
  DashboardOrderStatusCount,
  DashboardTopItem,
  DashboardOrdersByHour,
  DashboardOrders,
  DashboardOperations,
  DashboardStaffOnShift,
  DashboardStaffToday,
  DashboardStaffPeriod,
  DashboardStaff,
  DashboardStats,
};
