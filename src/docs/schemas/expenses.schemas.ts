export const expenseSchemas: Record<string, any> = {
  CreateExpenseRequest: {
    type: 'object',
    required: ['title', 'amount'],
    properties: {
      title: { type: 'string', example: 'Nhập nguyên liệu cà phê' },
      description: { type: 'string', nullable: true, example: 'Thanh toán tháng 4' },
      amount: { type: 'integer', example: 1500000 },
      rawDate: { type: 'string', format: 'date', example: '2026-05-12' },
    },
  },
  UpdateExpenseRequest: {
    type: 'object',
    properties: {
      title: { type: 'string', example: 'Nhập nguyên liệu sữa (Bổ sung)' },
      description: { type: 'string', nullable: true, example: 'Thanh toán bổ sung' },
      amount: { type: 'integer', example: 1800000 },
      rawDate: { type: 'string', format: 'date' },
    },
  },
  ExpenseListResponse: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
      nextCursor: { type: 'integer', nullable: true, example: 12 },
    },
  },
};
