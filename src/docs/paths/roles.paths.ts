import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

export const rolesPaths: PathsObject = {
  '/api/roles/me': {
    get: {
      tags: ['Vai trò hệ thống'],
      summary: 'Vai trò của tôi',
      description: 'Lấy thông tin vai trò hệ thống của tài khoản đang đăng nhập.',
      responses: {
        200: {
          description: 'Vai trò của tôi',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/MyRoleResponse' } },
                  message: { type: 'string', example: 'Vai trò của bạn' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  '/api/roles': {
    get: {
      tags: ['Vai trò hệ thống'],
      summary: 'Danh sách',
      responses: {
        200: {
          description: 'Danh sách',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Role' } },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Vai trò hệ thống'],
      summary: 'Tạo',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateRoleRequest' },
            examples: {
              default: { value: { name: 'Nhân viên', code: 'nhan_vien', permissionCodes: ['order.list', 'order.create'] } },
              autoCode: { value: { name: 'Quản lý', permissionCodes: ['order.list', 'order.create', 'order.update'] } },
            },
          },
        },
      },
      responses: {
        201: successResponse('Role', 'Tạo thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/roles/{roleId}': {
    put: {
      tags: ['Vai trò hệ thống'],
      summary: 'Cập nhật',
      parameters: [{ name: 'roleId', in: 'path' as const, required: true, schema: { type: 'integer' as const } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateRoleRequest' },
            examples: { default: { value: { name: 'Nhân viên Bán hàng', code: 'nv_ban_hang', permissionCodes: ['order.list', 'order.create', 'order.detail'] } } },
          },
        },
      },
      responses: {
        200: successResponse('Role', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Vai trò hệ thống'],
      summary: 'Xóa',
      parameters: [{ name: 'roleId', in: 'path' as const, required: true, schema: { type: 'integer' as const } }],
      responses: {
        200: {
          description: 'Đã xóa',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Đã xóa' } } },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
