import type { PathsObject } from 'openapi3-ts/oas31';
import { errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
};

const monthQuery = { name: 'month', in: 'query' as const, required: true, schema: { type: 'integer' as const, minimum: 1, maximum: 12 } };
const yearQuery = { name: 'year', in: 'query' as const, required: true, schema: { type: 'integer' as const, minimum: 2000, maximum: 2100 } };
const employeeIdParam = {
  name: 'employeeId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
};

export const payrollPaths: PathsObject = {
  '/api/stores/{storeId}/payroll': {
    get: {
      tags: ['Payroll'],
      summary: 'Xem bảng lương (preview)',
      description: 'Tính tạm: MONTHLY theo paidDays/standardDays; HOURLY theo tổng phút WORK × hourlyRate. `locked` = đã có snapshot.',
      parameters: [storeIdParam, monthQuery, yearQuery],
      responses: {
        200: {
          description: 'Preview / trạng thái khóa',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/PayrollPreviewResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
  '/api/stores/{storeId}/payroll/employees/{employeeId}': {
    get: {
      tags: ['Payroll'],
      summary: 'Chi tiết tính lương một nhân viên',
      description:
        'Trả về công thức, số ngày/giờ và breakdown từng ngày để hiển thị màn giải thích lương.',
      parameters: [storeIdParam, employeeIdParam, monthQuery, yearQuery],
      responses: {
        200: {
          description: 'Chi tiết lương',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/PayrollEmployeeDetailResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
  '/api/stores/{storeId}/payroll/lock': {
    post: {
      tags: ['Payroll'],
      summary: 'Khóa kỳ lương',
      description: 'Tạo PayrollSnapshot cho mọi nhân viên. 409 nếu đã khóa.',
      parameters: [storeIdParam, monthQuery, yearQuery],
      responses: {
        201: {
          description: 'Đã khóa — trả về các snapshot',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PayrollSnapshotRow' },
                  },
                  message: { type: 'string', example: 'Đã khóa kỳ lương' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404, 409),
      },
    },
    delete: {
      tags: ['Payroll'],
      summary: 'Mở khóa kỳ lương',
      description: 'Xóa snapshot của tháng (cho phép chỉnh chấm công / đơn nghỉ liên quan).',
      parameters: [storeIdParam, monthQuery, yearQuery],
      responses: {
        200: {
          description: 'Đã mở khóa',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'null' },
                  message: { type: 'string', example: 'Đã mở khóa kỳ lương' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
