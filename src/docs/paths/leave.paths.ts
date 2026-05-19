import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
};

const leaveIdParam = {
  name: 'leaveId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
};

const statusFilter = {
  name: 'status',
  in: 'query' as const,
  required: false,
  schema: { type: 'string' as const, enum: ['PENDING', 'APPROVED', 'REJECTED'] },
};

export const leavePaths: PathsObject = {
  '/api/stores/{storeId}/leave': {
    get: {
      tags: ['Leave'],
      summary: 'Danh sách đơn nghỉ',
      parameters: [storeIdParam, statusFilter],
      responses: {
        200: {
          description: 'Danh sách',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/LeaveRequestModel' } },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Leave'],
      summary: 'Gửi đơn nghỉ',
      description: 'Không cho phép nếu có tháng trong khoảng nghỉ đã khóa lương.',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateLeaveBody' },
          },
        },
      },
      responses: {
        201: successResponse('LeaveRequestModel', 'Đã gửi đơn nghỉ'),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  '/api/stores/{storeId}/leave/{leaveId}/approve': {
    patch: {
      tags: ['Leave'],
      summary: 'Duyệt đơn nghỉ',
      description: 'Đồng bộ Attendance (PAID_LEAVE / UNPAID_LEAVE) trên các ngày làm việc trong khoảng.',
      parameters: [storeIdParam, leaveIdParam],
      responses: {
        200: successResponse('LeaveRequestModel', 'Đã duyệt'),
        ...errorResponses(401, 403, 404, 409),
      },
    },
  },
  '/api/stores/{storeId}/leave/{leaveId}/reject': {
    patch: {
      tags: ['Leave'],
      summary: 'Từ chối đơn nghỉ',
      parameters: [storeIdParam, leaveIdParam],
      responses: {
        200: successResponse('LeaveRequestModel', 'Đã từ chối'),
        ...errorResponses(401, 403, 404, 409),
      },
    },
  },
};
