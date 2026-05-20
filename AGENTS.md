# Orderly POS Backend — Project Rules

## Tổng quan

Dự án **Orderly POS** là REST API backend cho hệ thống POS quán cà phê, viết bằng **TypeScript** trên **Express 4.x**, dùng **Prisma 5.x** với **PostgreSQL 16**. Dùng Zod để validate, JWT cho auth, RBAC 2 cấp (system + store).

## Kiến trúc module

Mỗi feature module có **4 file** trong `src/modules/<name>/`:

| File | Vai trò |
|---|---|
| `<name>.routes.ts` | Định nghĩa route + middleware chain |
| `<name>.controller.ts` | Request handler mỏng, gọi service |
| `<name>.service.ts` | Business logic, gọi Prisma |
| `<name>.schema.ts` | Zod schemas + inferred DTO types |

Ngoài ra còn OpenAPI docs ở `src/docs/paths/` và `src/docs/schemas/`.

## Coding conventions

- **Import alias**: `@/*` → `src/*`
- **Module export**: `export default router` cho routes; named exports cho controller/service
- **File naming**: `kebab-case` (`areas.routes.ts`, `requireStoreAccess.ts`)
- **Vietnamese messages**: tất cả message người dùng đều bằng tiếng Việt
- **Response format**: `sendSuccess(res, data, message, statusCode)` hoặc `sendPaginated(res, data, pagination)`
- **Error handling**: throw `ApiError.badRequest()`, `.notFound()`, `.forbidden()`, `.conflict()`, `.unauthorized()`

### Middleware chain order (cho store-scoped routes)

```typescript
router.use(authenticate, requireStoreAccess);
router.get('/', requirePermission(PERMS.areas.list), controller.list);
router.post('/', requirePermission(PERMS.areas.create), validate(createSchema), controller.create);
```

1. `authenticate` — JWT
2. `requireStoreAccess` — nạp permissions
3. `requirePermission(PERMS.xxx.yyy)` — check permission
4. `validate(schema)` — Zod validation (body/params/query)

### Controller pattern

```typescript
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAreas(req.store!.id);
    sendSuccess(res, data, 'Danh sách khu vực');
  } catch (err) { next(err); }
}
```

### Service pattern

- Dùng `prisma` từ `@/config/prisma`
- Throw `ApiError` cho HTTP errors
- Ownership assertion pattern: `assertXxxOwnership(id, storeId)` — check tồn tại + storeId

## Prisma conventions

- Tất cả model/field đều `@@map` hoặc `@map` với snake_case
- Relation: `onDelete: Cascade`, `@@index` khi cần
- Enum dùng uppercase: `StatusType`, `AttendanceStatus`, `LeaveRequestStatus`

## RBAC permissions

Permissons được định nghĩa trong `PERMS` object ở `src/config/rbac/rbac-defs.ts`:
`PERMS.<module>.<action>` (VD: `PERMS.areas.list`, `PERMS.orders.create`)

Khi thêm action mới: thêm vào `PERMS` + `MODULE_DEFS` + `STORE_OWNER_PERMS` (nếu store owner cần).

**Mỗi API endpoint phải có 1 PERMS riêng**, không gộp nhiều endpoint chung 1 permission.
Ví dụ đúng: `GET /qr-token` → `PERMS.attendance.qr`, `POST /scan` → `PERMS.attendance.scan`.
Ví dụ sai: gộp chung 2 endpoint đó vào `PERMS.attendance.scan`.

## Store-scoped routes

Tất cả module CRUD đều mount dưới `/api/stores/:storeId/<module>`:
- Router tạo với `Router({ mergeParams: true })`
- Middleware: `router.use(authenticate, requireStoreAccess);`
- Mount trong `app.ts` ở `storeRouter.use('/<module>', moduleRoutes)`

## Validation

- Dùng Zod schemas trong `<module>.schema.ts`
- Coerce params: `z.coerce.number().int().positive()`
- Validate params riêng: `validate(paramsSchema, 'params')`

## Phát triển

- Chạy qua Docker Compose: `docker compose -f docker-compose.dev.yml up -d`
- Hot reload với nodemon + tsx
- Build: `npm run build`
- Seed: `npm run seed`
