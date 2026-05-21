import type { PathsObject } from "openapi3-ts/oas31";
import { successResponse, errorResponses } from "@/docs/schemas/common";

const storeIdParam = {
  name: "storeId",
  in: "path" as const,
  required: true,
  schema: { type: "integer" as const },
};

const overrideIdParam = {
  name: "overrideId",
  in: "path" as const,
  required: true,
  schema: { type: "integer" as const },
};

export const schedulePaths: PathsObject = {
  "/api/stores/{storeId}/schedule": {
    get: {
      tags: ["Schedule"],
      summary: "Xem lịch cửa hàng",
      description: "Ngày làm mặc định + các ngày đặc biệt (nghỉ bù / làm bù).",
      parameters: [storeIdParam],
      responses: {
        200: {
          description: "Lịch làm việc",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/ScheduleResponse" },
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
  "/api/stores/{storeId}/schedule/default": {
    put: {
      tags: ["Schedule"],
      summary: "Cập nhật ngày làm mặc định",
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateDefaultWorkDaysBody" },
          },
        },
      },
      responses: {
        200: successResponse(
          "DefaultWorkDaysResult",
          "Đã cập nhật ngày làm mặc định",
        ),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/stores/{storeId}/schedule/overrides": {
    post: {
      tags: ["Schedule"],
      summary: "Thêm ngày đặc biệt",
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateScheduleOverrideBody" },
          },
        },
      },
      responses: {
        201: successResponse("ScheduleOverrideRow", "Đã thêm ngày đặc biệt"),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/stores/{storeId}/schedule/overrides/{overrideId}": {
    delete: {
      tags: ["Schedule"],
      summary: "Xóa ngày đặc biệt",
      parameters: [storeIdParam, overrideIdParam],
      responses: {
        200: {
          description: "Đã xóa",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { type: "null" },
                  message: { type: "string", example: "Đã xóa" },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
