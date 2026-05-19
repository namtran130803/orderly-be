import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const employeeIdParam = { name: 'employeeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const roleIdParam = { name: 'roleId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const employeePaths: PathsObject = {
  '/api/stores/{storeId}/employees': {
    get: {
      tags: ['Nhân viên'],
      summary: 'Danh sách',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Employee' } },
                  message: { type: 'string', example: 'Danh sách' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Nhân viên'],
      summary: 'Tạo',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateEmployeeRequest' },
            examples: {
              monthly: {
                value: {
                  phone: '0901234567',
                  roleIds: [1, 2],
                  salaryType: 'MONTHLY',
                  baseSalary: 5_000_000,
                  workDays: [],
                },
              },
              hourly: {
                value: {
                  phone: '0902345678',
                  roleIds: [1],
                  salaryType: 'HOURLY',
                  baseSalary: 0,
                  hourlyRate: 30_000,
                  workDays: [1, 2, 3, 4, 5, 6],
                },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse('Employee', 'Tạo thành công'),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  '/api/stores/{storeId}/employees/{employeeId}/roles': {
    get: {
      tags: ['Nhân viên'],
      summary: 'Vai trò và quyền',
      parameters: [storeIdParam, employeeIdParam],
      responses: {
        200: {
          description: 'Vai trò và quyền của nhân viên',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/EmployeeRole' } },
                  message: { type: 'string', example: 'Danh sách vai trò và quyền' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      tags: ['Nhân viên'],
      summary: 'Gán vai trò',
      parameters: [storeIdParam, employeeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AssignRolesRequest' },
            examples: { default: { value: { roleIds: [1, 2] } } },
          },
        },
      },
      responses: {
        200: successResponse('Employee', 'Gán thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },

  '/api/stores/{storeId}/employees/{employeeId}/salary': {
    patch: {
      tags: ['Nhân viên'],
      summary: 'Cập nhật lương & lịch làm',
      description:
        'Chỉ ảnh hưởng kỳ lương chưa chốt. Không sửa PayrollSnapshot đã khóa.',
      parameters: [storeIdParam, employeeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateSalaryRequest' },
            examples: {
              monthly: {
                value: {
                  salaryType: 'MONTHLY',
                  baseSalary: 5_000_000,
                  hourlyRate: null,
                  workDays: [],
                },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse('Employee', 'Đã cập nhật lương'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
};
