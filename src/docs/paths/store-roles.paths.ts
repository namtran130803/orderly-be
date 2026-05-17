import type { PathsObject } from "openapi3-ts/oas31";
import { successResponse, errorResponses } from "@/docs/schemas/common";

const storeIdParam = {
  name: "storeId",
  in: "path" as const,
  required: true,
  schema: { type: "integer" as const },
};
const roleIdParam = {
  name: "roleId",
  in: "path" as const,
  required: true,
  schema: { type: "integer" as const },
};

export const storeRolePaths: PathsObject = {
  "/api/stores/{storeId}/roles": {
    get: {
      tags: ["Vai trò"],
      summary: "Danh sách",
      parameters: [storeIdParam],
      responses: {
        200: {
          description: "Danh sách",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/StoreRole" },
                  },
                  message: { type: "string", example: "Danh sách" },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ["Vai trò"],
      summary: "Tạo",
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateStoreRoleRequest" },
            examples: {
              default: {
                value: {
                  name: "Phục vụ",
                  permissionCodes: [
                    "category.list",
                    "category.create",
                    "order.list",
                    "order.create",
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        201: successResponse("StoreRole", "Tạo thành công"),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/stores/{storeId}/roles/{roleId}": {
    put: {
      tags: ["Vai trò"],
      summary: "Cập nhật",
      parameters: [storeIdParam, roleIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateStoreRoleRequest" },
            examples: {
              default: {
                value: {
                  name: "Phục vụ senior",
                  permissionCodes: [
                    "category.list",
                    "category.create",
                    "category.update",
                    "order.list",
                    "order.create",
                    "order.update",
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        200: successResponse("StoreRole", "Cập nhật thành công"),
        ...errorResponses(400, 401, 403, 404, 409),
      },
    },
    delete: {
      tags: ["Vai trò"],
      summary: "Xóa",
      parameters: [storeIdParam, roleIdParam],
      responses: {
        204: { description: "Đã xóa" },
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
