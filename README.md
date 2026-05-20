# Orderly POS — Backend

REST API for coffee shop POS. Express 4 + TypeScript + Prisma + PostgreSQL 16.

## Yêu cầu

- Docker & Docker Compose
- File `.env` (xem `.env.example`)

```bash
cp .env.example .env
# Sửa JWT_SECRET thành chuỗi ngẫu nhiên ≥32 ký tự
```

## Development

### Lần đầu

```bash
# Build image + khởi động DB + API
docker compose -f docker-compose.dev.yml up -d --build

# Tạo database tables + seed dữ liệu
docker compose -f docker-compose.dev.yml run --rm api npx prisma db push
docker compose -f docker-compose.dev.yml run --rm api npx tsx prisma/seed.ts

# Mở http://localhost:3000/docs — Scalar UI
# Mở http://localhost:3000/api/openapi.json — OpenAPI spec
```

### Hàng ngày

```bash
# Khởi động (đã có image)
docker compose -f docker-compose.dev.yml up -d

# Xem log
docker compose -f docker-compose.dev.yml logs -f api

# Dừng
docker compose -f docker-compose.dev.yml down
```

Code tự động reload — sửa file → server restart trong ~1-2 giây.

> Docker for Windows không forward inotify events vào container, nên dùng `nodemon --legacy-watch` (polling) thay vì `tsx watch`. Không cần restart container khi sửa code.

### Khi sửa `prisma/schema.prisma`

> `./prisma:/app/prisma` được mount trong `docker-compose.dev.yml` — mọi thay đổi schema ở host được container thấy ngay.

```bash
# 1. Đồng bộ schema xuống DB (tự động chạy prisma generate)
docker compose -f docker-compose.dev.yml run --rm api npx prisma db push

# 2. Restart API để load Prisma client mới
docker compose -f docker-compose.dev.yml restart api

# Hoặc dùng migration:
docker compose -f docker-compose.dev.yml run --rm api npx prisma migrate dev --name mo_ta_thay_doi
```

> `npm run dev` tự động chạy `npx prisma generate` trước `tsx watch`, nên nếu container restart thì client luôn fresh.

### Khi cần seed lại dữ liệu

```bash
docker compose -f docker-compose.dev.yml run --rm api npx tsx prisma/seed.ts
```

### Khi rebuild image (thay đổi dependencies, Dockerfile...)

```bash
# Volume /app/node_modules là anonymous volume — không tự cập nhật khi rebuild image.
# Cần xoá volume cũ trước khi rebuild:
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build

# Sau đó chạy lại db push + seed nếu cần
```

## Production

### Build image

```bash
docker compose build
```

> **Lưu ý**: Production build chạy `tsc` để kiểm tra kiểu. Nếu có lỗi TypeScript (đặc biệt là lỗi liên quan Prisma), cần sửa code cho pass typecheck trước.

### Lần đầu deploy

```bash
# Tạo volume & network
docker compose up -d

# Tạo database tables
docker compose run --rm api npx prisma db push

# Seed dữ liệu
docker compose run --rm api npx tsx prisma/seed.ts
```

### Khi deploy bản mới

```bash
docker compose up -d --build
```

### Khi DB schema thay đổi

```bash
docker compose run --rm api npx prisma db push
# hoặc migration:
docker compose run --rm api npx prisma migrate deploy
```

## Kiến trúc Docker

| File | Mục đích |
|---|---|
| `Dockerfile` | Build production — multi-stage, compile `tsc` → chạy `node dist/index.js` |
| `Dockerfile.dev` | Build dev — cài dependencies + copy code, chạy `tsx watch` |
| `docker-compose.yml` | Production stack (DB + API) |
| `docker-compose.dev.yml` | Dev stack — mount `./src:/app/src` để hot reload |

### Anonymous volume `/app/node_modules`

Trong `docker-compose.dev.yml`, `/app/node_modules` được khai báo là anonymous volume để tránh xung đột giữa `node_modules` của Windows host và Linux container. Tuy nhiên, volume này không tự động cập nhật khi rebuild image. Nếu cập nhật `package.json` hoặc `prisma/schema.prisma`, cần chạy:

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build
```

## Cấu hình

| Biến | Mặc định | Mô tả |
|---|---|---|
| `PORT` | `3000` | Cổng API |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Khóa JWT (≥32 ký tự) |
| `JWT_EXPIRES_IN` | `7d` | Thời hạn token |

## Tài liệu API

- **Scalar UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/openapi.json`

## Deploy FE + BE trên cùng VPS

Cả hai project dùng chung network `orderly-network`. FE nginx proxy `/api` → `http://backend:3000`.

```bash
# 1. Chạy BE
cd orderly-be && docker compose up -d --build

# 2. Chạy FE (tự động join cùng network)
cd orderly-fe && docker compose up -d --build
```

## Troubleshooting

### OpenAPI spec thiếu module

Nếu `/api/openapi.json` chỉ hiển thị 10 tags (thiếu employees, payroll, attendance...):

```bash
# Kiểm tra container đang chạy dev (tsx watch) hay production (node dist/)
docker exec backend ps aux | head -2

# Nếu thấy "node dist/index.js" → container đang dùng image production.
# Cần build lại từ Dockerfile.dev:
docker compose -f docker-compose.dev.yml build api
docker compose -f docker-compose.dev.yml up -d api
```

### Lỗi "Cannot read properties of undefined (reading 'MONTHLY')"

Prisma client thiếu enum mới. Chạy regenerate:

```bash
docker exec backend npx prisma generate
docker compose -f docker-compose.dev.yml restart api
```
