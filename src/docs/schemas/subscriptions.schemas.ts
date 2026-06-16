import type { SchemaObject } from "openapi3-ts/oas31";

export const subscriptionSchemas: Record<string, SchemaObject> = {
  PaginationMeta: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      total: { type: "integer", example: 100 },
      totalPages: { type: "integer", example: 5 },
    },
  },
  SubscriptionPlan: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      code: { type: "string", example: "D30" },
      name: { type: "string", example: "Gói 30 ngày" },
      days: { type: "integer", example: 30 },
      price: { type: "integer", example: 2000 },
      isActive: { type: "boolean", example: true },
    },
  },
  StoreSubscription: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["TRIALING", "ACTIVE", "EXPIRED"] },
      isReadOnly: { type: "boolean", example: false },
      currentPeriodStart: { type: ["string", "null"], format: "date-time" },
      currentPeriodEnd: { type: ["string", "null"], format: "date-time" },
      daysRemaining: { type: "integer", example: 7 },
      trialUsed: { type: "boolean", example: true },
    },
  },
  SubscriptionPeriod: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      storeId: { type: "integer", example: 1 },
      source: {
        type: "string",
        enum: ["TRIAL", "PAYMENT", "ADMIN_ADJUSTMENT", "LEGACY_GRACE"],
      },
      days: { type: "integer", example: 30 },
      startsAt: { type: "string", format: "date-time" },
      endsAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      payment: {
        anyOf: [
          { $ref: "#/components/schemas/Payment" },
          { type: "null" },
        ],
      },
    },
  },
  Payment: {
    type: "object",
    properties: {
      id: { type: "integer", example: 123 },
      storeId: { type: "integer", example: 1 },
      userId: { type: "integer", example: 1 },
      amount: { type: "integer", example: 2000 },
      paymentCode: { type: "string", example: "ODLX123ABC" },
      transferContent: { type: "string", example: "ODLX123ABC" },
      provider: { type: "string", example: "SEPAY" },
      status: {
        type: "string",
        enum: ["PENDING", "PAID", "EXPIRED", "CANCELLED", "FAILED"],
      },
      paidAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      plan: { $ref: "#/components/schemas/SubscriptionPlan" },
    },
  },
  CreateCheckoutRequest: {
    type: "object",
    required: ["planDays"],
    properties: {
      planDays: { type: "integer", enum: [30, 90, 180, 360], example: 30 },
    },
  },
  AdminRenewalRequest: {
    type: "object",
    required: ["storeId", "days"],
    properties: {
      storeId: { type: "integer", example: 1 },
      days: { type: "integer", enum: [30, 90, 180, 360], example: 30 },
    },
  },
};
