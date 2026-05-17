import type { PathsObject } from "openapi3-ts/oas31";
import { successResponse, errorResponses } from "@/docs/schemas/common";

const userIdParam = {
  name: "userId",
  in: "path" as const,
  required: true,
  schema: { type: "integer" as const },
};

export const usersPaths: PathsObject = {
  "/api/users": {
    get: {
      tags: ["Người dùng"],
      summary: "Danh sách",
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
                    items: { $ref: "#/components/schemas/UserProfile" },
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
  "/api/users/{userId}/roles": {
    get: {
      tags: ["Người dùng"],
      summary: "Vai trò và quyền",
      parameters: [userIdParam],
      responses: {
        200: {
          description: "Vai trò và quyền",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/UserRole' } },
                  message: { type: "string", example: "Danh sách vai trò của người dùng" },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      tags: ["Người dùng"],
      summary: "Gán vai trò",
      parameters: [userIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AssignRoleRequest" },
            examples: { default: { value: { roleId: 1 } } },
          },
        },
      },
      responses: {
        201: successResponse("UserWithRoles", "Gán thành công"),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/users/{userId}/roles/{roleId}": {
    delete: {
      tags: ["Người dùng"],
      summary: "Gỡ vai trò",
      parameters: [
        userIdParam,
        {
          name: "roleId",
          in: "path" as const,
          required: true,
          schema: { type: "integer" as const },
        },
      ],
      responses: {
        200: {
          description: "Đã gỡ",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Đã gỡ" },
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
