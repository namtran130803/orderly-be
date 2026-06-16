import type { PathsObject } from 'openapi3-ts/oas31';
import { errorResponses } from '@/docs/schemas/common';

export const systemPaths: PathsObject = {
  '/api/system/modules': {
    get: {
      tags: ['Hệ thống'],
      summary: 'Mô-đun hệ thống',
      responses: {
        200: {
          description: 'Danh sách mô-đun',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'store' },
                        name: { type: 'string', example: 'Cửa hàng' },
                        apis: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              code: { type: 'string', example: 'store.list' },
                              name: { type: 'string', example: 'Xem danh sách cửa hàng' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  '/api/system/overview': {
    get: {
      tags: ['Hệ thống'],
      summary: 'Thống kê tổng quan toàn hệ thống',
      description: 'Lấy các chỉ số tích lũy, tăng trưởng cửa hàng và doanh thu theo tháng, phần bố gói dịch vụ, cùng danh sách đăng ký và giao dịch gần đây.',
      responses: {
        200: {
          description: 'Thông tin tổng quan hệ thống',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      summary: {
                        type: 'object',
                        properties: {
                          totalStores: { type: 'integer', example: 12 },
                          totalUsers: { type: 'integer', example: 45 },
                          totalPlans: { type: 'integer', example: 4 },
                          totalRevenue: { type: 'integer', example: 124700000 },
                          activeStores: { type: 'integer', example: 8 },
                        },
                      },
                      growth: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string', example: '2026-06' },
                            newStores: { type: 'integer', example: 2 },
                            revenue: { type: 'integer', example: 15000000 },
                          },
                        },
                      },
                      recentStores: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Bon Bon Tea' },
                            createdAt: { type: 'string', example: '2026-06-16T12:00:00.000Z' },
                            ownerName: { type: 'string', example: 'Nguyễn Văn A' },
                            ownerPhone: { type: 'string', example: '0901234567' },
                          },
                        },
                      },
                      recentPayments: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 15 },
                            paymentCode: { type: 'string', example: 'PAY12345' },
                            amount: { type: 'integer', example: 500000 },
                            status: { type: 'string', example: 'PAID' },
                            createdAt: { type: 'string', example: '2026-06-16T12:00:00.000Z' },
                            storeName: { type: 'string', example: 'Bon Bon Tea' },
                            userName: { type: 'string', example: 'Nguyễn Văn A' },
                            planName: { type: 'string', example: 'Gói năm' },
                          },
                        },
                      },
                      planDistribution: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            planName: { type: 'string', example: 'Gói năm' },
                            count: { type: 'integer', example: 8 },
                          },
                        },
                      },
                    },
                  },
                  message: { type: 'string', example: 'Tổng quan hệ thống' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
};
