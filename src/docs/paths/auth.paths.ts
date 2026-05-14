import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

export const authPaths: PathsObject = {
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Đăng ký tài khoản',
      security: [],                         // Override: không cần JWT
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
            examples: {
              default: {
                summary: 'Ví dụ đăng ký',
                value: { name: 'Trần Trọng Nam', phone: '0901234567', password: 'password123' },
              },
            },
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
      tags: ['Auth'],
      summary: 'Đăng nhập',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            examples: {
              default: {
                summary: 'Ví dụ đăng nhập',
                value: { phone: '0901234567', password: 'password123' },
              },
            },
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
      tags: ['Auth'],
      summary: 'Thông tin người dùng hiện tại',
      responses: {
        200: successResponse('UserProfile'),
        ...errorResponses(401),
      },
    },
  },
};
