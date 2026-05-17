import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

export const authPaths: PathsObject = {
  '/api/auth/register': {
    post: {
      tags: ['Xác thực'],
      summary: 'Đăng ký',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
            examples: { default: { value: { name: 'Trần Trọng Nam', phone: '0901234567', password: 'password123' } } },
          },
        },
      },
      responses: {
        201: successResponse('AuthResponse', 'Đăng ký thành công'),
        ...errorResponses(400, 409),
      },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Xác thực'],
      summary: 'Đăng nhập',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            examples: { default: { value: { phone: '0901234567', password: 'password123' } } },
          },
        },
      },
      responses: {
        200: successResponse('AuthResponse', 'Đăng nhập thành công'),
        ...errorResponses(400, 401),
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Xác thực'],
      summary: 'Thông tin user',
      responses: {
        200: successResponse('UserProfile'),
        ...errorResponses(401),
      },
    },
  },
};
