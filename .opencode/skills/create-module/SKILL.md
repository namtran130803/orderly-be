---
name: create-module
description: |
  Use when creating a new feature module for Orderly POS backend.
  This skill automates creating the 4-file module pattern:
  routes, controller, service, schema.
  Also covers: adding routes to app.ts, adding RBAC permissions,
  and creating OpenAPI doc files.
  Use ONLY when a new CRUD feature module is being added.
---

# Create Module — Orderly POS

Hướng dẫn tạo một feature module mới cho Orderly POS backend.

## Cấu trúc 4 file

Mỗi module gồm 4 file trong `src/modules/<name>/`:

```
src/modules/<name>/
  <name>.routes.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.schema.ts
```

## 1. Schema (`<name>.schema.ts`)

Dùng Zod. Infer DTO types.

```typescript
import { z } from 'zod';

export const createXxxSchema = z.object({
  name: z.string().trim().min(1, 'Tên không được để trống').max(100),
});

export const updateXxxSchema = createXxxSchema.partial();

export const xxxParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  xxxId:   z.coerce.number().int().positive(),
});

export type CreateXxxDto = z.infer<typeof createXxxSchema>;
export type UpdateXxxDto = z.infer<typeof updateXxxSchema>;
```

## 2. Service (`<name>.service.ts`)

Business logic. Dùng `prisma` + `ApiError`.

```typescript
import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { CreateXxxDto, UpdateXxxDto } from './<name>.schema';

async function assertXxxOwnership(xxxId: number, storeId: number) {
  const item = await prisma.xxx.findUnique({ where: { id: xxxId } });
  if (!item) throw ApiError.notFound('Xxx');
  if (item.storeId !== storeId) throw ApiError.forbidden();
  return item;
}

export async function listXxx(storeId: number) { ... }
export async function createXxx(storeId: number, dto: CreateXxxDto) { ... }
export async function updateXxx(storeId: number, xxxId: number, dto: UpdateXxxDto) { ... }
export async function deleteXxx(storeId: number, xxxId: number) { ... }
```

## 3. Controller (`<name>.controller.ts`)

Mỏng — chỉ extract params, gọi service, gửi response.

```typescript
import { Request, Response, NextFunction } from 'express';
import * as service from './<name>.service';
import { sendSuccess } from '@/lib/response';
import { CreateXxxDto, UpdateXxxDto } from './<name>.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listXxx(req.store!.id);
    sendSuccess(res, data, 'Danh sách');
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateXxxDto;
    const data = await service.createXxx(req.store!.id, dto);
    sendSuccess(res, data, 'Tạo thành công', 201);
  } catch (err) { next(err); }
}
```

## 4. Routes (`<name>.routes.ts`)

```typescript
import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from './<name>.controller';
import { createXxxSchema, updateXxxSchema, xxxParamsSchema } from './<name>.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });
router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.xxx.list), controller.list);
router.post('/', requirePermission(PERMS.xxx.create), validate(createXxxSchema), controller.create);
router.put('/:xxxId', requirePermission(PERMS.xxx.update), validate(xxxParamsSchema, 'params'), validate(updateXxxSchema), controller.update);
router.delete('/:xxxId', requirePermission(PERMS.xxx.delete), validate(xxxParamsSchema, 'params'), controller.remove);

export default router;
```

## 5. Mount route trong app.ts

Thêm vào `src/app.ts`:

```typescript
import xxxRoutes from '@/modules/<name>/<name>.routes';
// ...
storeRouter.use('/<plural>', xxxRoutes);
```

## 6. Thêm RBAC permissions

Trong `src/config/rbac/rbac-defs.ts`:

1. Thêm vào `PERMS` object:
```typescript
xxx: { list: "xxx.list", create: "xxx.create", update: "xxx.update", delete: "xxx.delete" },
```

2. Thêm vào `MODULE_DEFS`:
```typescript
{ code: "xxx", name: "Tên module", apis: [
  { code: PERMS.xxx.list, name: "Xem danh sách" },
  { code: PERMS.xxx.create, name: "Tạo" },
  { code: PERMS.xxx.update, name: "Cập nhật" },
  { code: PERMS.xxx.delete, name: "Xóa" },
]},
```

3. Thêm vào `STORE_OWNER_PERMS` nếu store owner cần quyền.

## 7. OpenAPI docs

Xem skill `create-openapi-docs` để tạo path + schema docs.
