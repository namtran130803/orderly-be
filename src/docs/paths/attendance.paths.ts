import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = {
  name: 'storeId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
};

const attendanceIdParam = {
  name: 'attendanceId',
  in: 'path' as const,
  required: true,
  schema: { type: 'integer' as const },
};

const monthQuery = { name: 'month', in: 'query' as const, required: true, schema: { type: 'integer' as const, minimum: 1, maximum: 12 } };
const yearQuery = { name: 'year', in: 'query' as const, required: true, schema: { type: 'integer' as const, minimum: 2000, maximum: 2100 } };
const employeeIdQuery = {
  name: 'employeeId',
  in: 'query' as const,
  required: false,
  schema: { type: 'integer' as const },
  description: 'Lọc một nhân viên (store user id)',
};

export const attendancePaths: PathsObject = {
  '/api/stores/{storeId}/attendance/qr-token': {
    get: {
      tags: ['Attendance'],
      summary: 'Tạo JWT cho QR chấm công (kiosk)',
      parameters: [storeIdParam],
      responses: {
        200: successResponse('AttendanceQrTokenPayload', 'Token ngắn hạn cho QR'),
        ...errorResponses(401, 403),
      },
    },
  },
  '/api/stores/{storeId}/attendance/scan': {
    post: {
      tags: ['Attendance'],
      summary: 'Chấm vào / ra bằng QR',
      description:
        'Lần đầu trong ngày: tạo bản ghi check-in. Lần sau: cập nhật check-out và phút làm. 409 nếu quét quá nhanh (cooldown) hoặc đã đủ ca trong ngày.',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AttendanceScanBody' },
          },
        },
      },
      responses: {
        200: successResponse('AttendanceModel', 'Chấm công thành công'),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  '/api/stores/{storeId}/attendance': {
    get: {
      tags: ['Attendance'],
      summary: 'Bảng chấm công theo tháng',
      parameters: [storeIdParam, monthQuery, yearQuery, employeeIdQuery],
      responses: {
        200: {
          description: 'Lưới theo nhân viên + ngày',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/AttendanceMonthReport' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      tags: ['Attendance'],
      summary: 'Tạo / ghi đè chấm công thủ công',
      description: 'Không cho phép nếu kỳ lương tháng đó đã khóa.',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateManualAttendanceBody' },
          },
        },
      },
      responses: {
        201: successResponse('AttendanceModel', 'Đã lưu'),
        ...errorResponses(400, 401, 403, 404, 409),
      },
    },
  },
  '/api/stores/{storeId}/attendance/{attendanceId}': {
    patch: {
      tags: ['Attendance'],
      summary: 'Sửa một bản ghi chấm công',
      description: 'Ghi log chỉnh sửa. Không cho phép nếu kỳ lương tháng đó đã khóa.',
      parameters: [storeIdParam, attendanceIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PatchAttendanceBody' },
          },
        },
      },
      responses: {
        200: successResponse('AttendanceModel', 'Đã cập nhật'),
        ...errorResponses(400, 401, 403, 404, 409),
      },
    },
  },
};
