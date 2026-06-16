import type { PathsObject } from "openapi3-ts/oas31";
import { errorResponses } from "@/docs/schemas/common";

export const webhooksPaths: PathsObject = {
  "/api/webhooks/sepay": {
    post: {
      tags: ["Webhooks"],
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
