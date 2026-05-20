---
name: create-openapi-docs
description: |
  Use when creating or updating OpenAPI 3.1 documentation for Orderly POS modules.
  This skill covers both path definitions (docs/paths/) and schema definitions
  (docs/schemas/), plus wiring them into the main openapi.ts file.
  Use ONLY for OpenAPI doc changes.
---

# Create OpenAPI Docs — Orderly POS

Hướng dẫn tạo OpenAPI 3.1 docs cho một module.

## Cấu trúc

```
src/docs/
  openapi.ts                  ← assembly point
  types.ts                    ← helper types
  schemas/
    common.ts                 ← shared schemas + helpers (successResponse, errorResponses)
    <name>.schemas.ts         ← component schemas
  paths/
    <name>.paths.ts           ← path definitions
```

## 1. Schemas (`src/docs/schemas/<name>.schemas.ts`)

```typescript
import type { SchemaObject } from 'openapi3-ts/oas31';

export const xxxSchemas: Record<string, SchemaObject> = {
  Xxx: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Tên mẫu' },
    },
  },
  CreateXxxRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Tên mẫu' },
    },
  },
  UpdateXxxRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Tên mới' },
    },
  },
};
```

## 2. Paths (`src/docs/paths/<name>.paths.ts`)

Dùng `successResponse` và `errorResponses` từ `@/docs/schemas/common`:

```typescript
import type { PathsObject } from 'openapi3-ts/oas31';
import { successResponse, errorResponses } from '@/docs/schemas/common';

const storeIdParam = { name: 'storeId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };
const xxxIdParam = { name: 'xxxId', in: 'path' as const, required: true, schema: { type: 'integer' as const } };

export const xxxPaths: PathsObject = {
  '/api/stores/{storeId}/xxx': {
    get: {
      tags: ['Xxx'],
      summary: 'Danh sách',
      parameters: [storeIdParam],
      responses: {
        200: {
          description: 'Danh sách',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Xxx' } },
                  message: { type: 'string', example: 'Danh sách' },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
    post: {
      tags: ['Xxx'],
      summary: 'Tạo',
      parameters: [storeIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateXxxRequest' },
            examples: { default: { value: { name: 'Mẫu' } } },
          },
        },
      },
      responses: {
        201: successResponse('Xxx', 'Tạo thành công'),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  '/api/stores/{storeId}/xxx/{xxxId}': {
    put: {
      tags: ['Xxx'],
      summary: 'Cập nhật',
      parameters: [storeIdParam, xxxIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateXxxRequest' },
          },
        },
      },
      responses: {
        200: successResponse('Xxx', 'Cập nhật thành công'),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      tags: ['Xxx'],
      summary: 'Xóa',
      parameters: [storeIdParam, xxxIdParam],
      responses: {
        200: successResponse('Xxx', 'Xóa thành công'),
        ...errorResponses(401, 403, 404),
      },
    },
  },
};
```

## 3. Wire vào openapi.ts

1. Import schemas:
```typescript
import { xxxSchemas } from '@/docs/schemas/<name>.schemas';
import { xxxPaths } from '@/docs/paths/<name>.paths';
```

2. Thêm vào `TAGS`:
```typescript
Xxx: "Tên tiếng Việt",
```

3. Thêm `...xxxPaths` vào `rawPaths`.

4. Thêm `...xxxSchemas` vào `components.schemas`.

5. Thêm tag description vào `tags` array:
```typescript
{ name: TAGS["Xxx"], description: "Mô tả" },
```
