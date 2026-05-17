import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const expenseIdParam = { name: 'expenseId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const expensePaths: PathsObject = {
  '/api/stores/{storeId}/expenses': {
    get: {
      tags: ['Chi phí'],
      summary: 'Danh sách',
      parameters: [
        storeIdParam,
        { name: 'cursor', in: 'query', schema: { type: 'integer' } },
        { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: {
        200: successResponse('ExpenseListResponse', 'Danh sách'),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      tags: ['Chi phí'],
      summary: 'Tạo',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateExpenseRequest' },
            examples: { default: { value: { title: 'Nhập nguyên liệu cà phê', amount: 1500000, rawDate: '2026-05-12' } } },
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
      tags: ['Chi phí'],
      summary: 'Cập nhật',
      parameters: [storeIdParam, expenseIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateExpenseRequest' },
            examples: { default: { value: { amount: 1800000 } } },
          },
        },
      },
      responses: {
        200: successResponse('Expense', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Chi phí'],
      summary: 'Xóa',
      parameters: [storeIdParam, expenseIdParam],
      responses: {
        200: successResponse('Expense', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
