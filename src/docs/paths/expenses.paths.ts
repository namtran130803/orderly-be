import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, paginatedResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};
const expenseIdParam = {
  name: 'expenseId', in: 'path' as const, required: true,
  schema: { type: 'integer' as const },
};

export const expensePaths: PathsObject = {
  '/api/stores/{storeId}/expenses': {
    get: {
      tags: ['Expenses'],
      summary: 'Danh sách phiếu chi',
      parameters: [
        storeIdParam,
        { name: 'cursor', in: 'query', schema: { type: 'integer' }, description: 'Con trỏ ID để phân trang' },
        { name: 'from',   in: 'query', schema: { type: 'string', format: 'date' }, description: 'Từ ngày' },
        { name: 'to',     in: 'query', schema: { type: 'string', format: 'date' }, description: 'Đến ngày' },
        { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: {
        200: successResponse('ExpenseListResponse', 'Danh sách phiếu chi theo cursor'),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      tags: ['Expenses'],
      summary: 'Tạo phiếu chi mới',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateExpenseRequest' },
            examples: {
              default: {
                summary: 'Ví dụ tạo phiếu chi',
                value: { title: 'Nhập nguyên liệu cà phê', description: 'Thanh toán cho đơn hàng tháng 4', amount: 1500000, rawDate: '2026-05-12' },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('Expense', 'Tạo thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },

  '/api/stores/{storeId}/expenses/{expenseId}': {
    put: {
      tags: ['Expenses'],
      summary: 'Cập nhật phiếu chi',
      parameters: [storeIdParam, expenseIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateExpenseRequest' },
            examples: {
              default: {
                summary: 'Ví dụ cập nhật',
                value: { amount: 1800000 },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Expense', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Expenses'],
      summary: 'Xóa phiếu chi',
      parameters: [storeIdParam, expenseIdParam],
      responses: {
        200: successResponse('Expense', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
