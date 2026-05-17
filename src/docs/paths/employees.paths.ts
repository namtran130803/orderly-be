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
            examples: { default: { value: { phone: '0901234567', roleIds: [1, 2] } } },
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
  '/api/stores/{storeId}/employees/{employeeId}/roles/{roleId}': {
    delete: {
      tags: ['Nhân viên'],
      summary: 'Gỡ vai trò',
      parameters: [storeIdParam, employeeIdParam, roleIdParam],
      responses: { 204: { description: 'Đã gỡ' }, ...errorResponses(401, 403, 404) },
    },
  },
};
