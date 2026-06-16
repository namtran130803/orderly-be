import type { SchemaObject } from "openapi3-ts/oas31";

export const paymentsSchemas: Record<string, SchemaObject> = {
  DetailedPayment: {
    type: "object",
    properties: {
      id: { type: "integer", example: 123 },
      storeId: { type: "integer", example: 1 },
      userId: { type: "integer", example: 1 },
      planId: { type: "integer", example: 1 },
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
      updatedAt: { type: "string", format: "date-time" },
      store: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Cà phê Aha" },
        },
      },
      user: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Nguyen Van A" },
          email: { type: "string", example: "a@example.com" },
          phone: { type: "string", example: "0987654321" },
        },
      },
      plan: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          code: { type: "string", example: "D30" },
          name: { type: "string", example: "Gói 30 ngày" },
          days: { type: "integer", example: 30 },
          price: { type: "integer", example: 2000 },
        },
      },
    },
  },
};
