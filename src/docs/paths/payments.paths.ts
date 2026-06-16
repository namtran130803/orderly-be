import type { PathsObject } from "openapi3-ts/oas31";
import { errorResponses } from "@/docs/schemas/common";

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

export const paymentsPaths: PathsObject = {
  "/api/payments": {
    get: {
      tags: ["Payments"],
      summary: "Xem danh sách thanh toán",
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
        {
          name: "storeId",
          in: "query",
          schema: {
            type: "integer" as const,
          },
        },
      ],
      responses: {
        200: {
          description: "Danh sách thanh toán",
          content: {
            "application/json": {
              schema: paginationResponse("#/components/schemas/DetailedPayment"),
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
};
