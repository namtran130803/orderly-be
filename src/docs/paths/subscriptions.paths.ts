import type { PathsObject } from "openapi3-ts/oas31";
import { errorResponses } from "@/docs/schemas/common";

const storeIdParam = {
  name: "storeId",
  in: "path" as const,
  required: true,
  schema: { type: "integer" as const },
};

const pageParams = [
  { name: "page", in: "query" as const, schema: { type: "integer" as const, default: 1 } },
  { name: "limit", in: "query" as const, schema: { type: "integer" as const, default: 20 } },
];

const historyParams = [
  ...pageParams,
  { name: "q", in: "query" as const, schema: { type: "string" as const } },
  { name: "phone", in: "query" as const, schema: { type: "string" as const } },
  { name: "userName", in: "query" as const, schema: { type: "string" as const } },
  { name: "storeName", in: "query" as const, schema: { type: "string" as const } },
  { name: "from", in: "query" as const, schema: { type: "string" as const, format: "date" } },
  { name: "to", in: "query" as const, schema: { type: "string" as const, format: "date" } },
];

const paginationResponse = (itemRef: string) => ({
  type: "object" as const,
  properties: {
    success: { type: "boolean" as const, example: true },
    data: { type: "array" as const, items: { $ref: itemRef } },
    pagination: { $ref: "#/components/schemas/PaginationMeta" },
  },
});

const listResponse = (itemRef: string) => ({
  type: "object" as const,
  properties: {
    success: { type: "boolean" as const, example: true },
    data: { type: "array" as const, items: { $ref: itemRef } },
    message: { type: "string" as const },
  },
});

export const subscriptionPaths: PathsObject = {
  "/api/subscriptions/plans": {
    get: {
      tags: ["Subscriptions"],
      summary: "Danh sách gói gia hạn public",
      security: [],
      responses: {
        200: {
          description: "Danh sách gói",
          content: {
            "application/json": {
              schema: listResponse("#/components/schemas/SubscriptionPlan"),
            },
          },
        },
      },
    },
  },
  "/api/stores/{storeId}/subscription": {
    get: {
      tags: ["Subscriptions"],
      summary: "Trạng thái subscription và lịch sử gia hạn gần nhất",
      parameters: [storeIdParam],
      responses: {
        200: {
          description: "Thông tin subscription",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      subscription: { $ref: "#/components/schemas/StoreSubscription" },
                      periods: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SubscriptionPeriod" },
                      },
                    },
                  },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/stores/{storeId}/subscription/payments": {
    get: {
      tags: ["Subscriptions"],
      summary: "Lịch sử thanh toán của cửa hàng",
      parameters: [storeIdParam],
      responses: {
        200: {
          description: "Lịch sử thanh toán",
          content: {
            "application/json": {
              schema: listResponse("#/components/schemas/Payment"),
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/stores/{storeId}/subscription/periods": {
    get: {
      tags: ["Subscriptions"],
      summary: "Lịch sử gia hạn của cửa hàng có phân trang",
      parameters: [
        storeIdParam,
        ...pageParams,
        {
          name: "source",
          in: "query",
          schema: {
            type: "string" as const,
            enum: ["TRIAL", "PAYMENT", "ADMIN_ADJUSTMENT", "LEGACY_GRACE"],
          },
        },
      ],
      responses: {
        200: {
          description: "Lịch sử gia hạn",
          content: {
            "application/json": {
              schema: paginationResponse("#/components/schemas/SubscriptionPeriod"),
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/stores/{storeId}/subscription/checkout": {
    post: {
      tags: ["Subscriptions"],
      summary: "Tạo thanh toán gia hạn",
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCheckoutRequest" },
            examples: { default: { value: { planDays: 30 } } },
          },
        },
      },
      responses: {
        201: {
          description: "Tạo thanh toán thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      payment: { $ref: "#/components/schemas/Payment" },
                      bank: {
                        type: "object",
                        properties: {
                          bankName: { type: "string", example: "MBBank" },
                          accountNo: { type: "string", example: "0886138003" },
                          accountName: { type: "string", example: "TRAN TRONG NAM" },
                        },
                      },
                    },
                  },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/subscriptions/payments": {
    get: {
      tags: ["Subscriptions"],
      summary: "Admin xem lịch sử thanh toán toàn hệ thống",
      parameters: [
        ...historyParams,
        {
          name: "status",
          in: "query",
          schema: {
            type: "string" as const,
            enum: ["PENDING", "PAID", "EXPIRED", "CANCELLED", "FAILED"],
          },
        },
      ],
      responses: {
        200: {
          description: "Lịch sử thanh toán toàn hệ thống",
          content: {
            "application/json": {
              schema: paginationResponse("#/components/schemas/Payment"),
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  "/api/subscriptions/periods": {
    get: {
      tags: ["Subscriptions"],
      summary: "Admin xem lịch sử gia hạn toàn hệ thống",
      parameters: [
        ...historyParams,
        {
          name: "source",
          in: "query",
          schema: {
            type: "string" as const,
            enum: ["TRIAL", "PAYMENT", "ADMIN_ADJUSTMENT", "LEGACY_GRACE"],
          },
        },
      ],
      responses: {
        200: {
          description: "Lịch sử gia hạn toàn hệ thống",
          content: {
            "application/json": {
              schema: paginationResponse("#/components/schemas/SubscriptionPeriod"),
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  "/api/subscriptions/admin-renewals": {
    post: {
      tags: ["Subscriptions"],
      summary: "Admin gia hạn thủ công cho cửa hàng",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AdminRenewalRequest" },
            examples: { default: { value: { storeId: 1, days: 30 } } },
          },
        },
      },
      responses: {
        201: {
          description: "Gia hạn thủ công thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/SubscriptionPeriod" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/webhooks/sepay": {
    post: {
      tags: ["Subscriptions"],
      summary: "Sepay webhook thanh toán",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: ["string", "integer"], example: 123456 },
                code: { type: "string", example: "ODLX123ABC" },
                transferType: { type: "string", example: "in" },
                transferAmount: { type: ["integer", "string"], example: 2000 },
                content: { type: "string", example: "ODLX123ABC" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Webhook accepted",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        ...errorResponses(401, 500),
      },
    },
  },
};
