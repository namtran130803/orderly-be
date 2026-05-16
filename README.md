# ☕ Orderly POS — Backend REST API

![Node.js](https://img.shields.io/badge/Node.js-24%20LTS-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Exclusive-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Hệ thống Backend REST API Quản lý bán hàng (POS) chuỗi quán cà phê **Orderly**.

## 📋 Yêu Cầu

- **Docker Desktop** (hoặc Docker Engine + Compose v2)
- **Node.js 24 LTS** (chỉ cần nếu chạy seed local)

---

## 🚀 Lần Đầu Chạy (Dev)

```bash
# 1. Khởi động database
docker compose up -d db

# 2. Đồng bộ Prisma schema với database
npx prisma db push

# 3. Nạp dữ liệu mẫu
npx tsx prisma/seed.ts

# 4. Khởi động API server với hot-reload
docker compose watch api-dev
```

> **Lưu ý:** Các bước 2-3 chạy trực tiếp trên máy host (cần Node.js). Đảm bảo file `.env` có `DATABASE_URL=postgresql://user:pass@localhost:5432/orderly_db`.

## 🚀 Lần Đầu Chạy (Production)

```bash
# Build image và khởi động tất cả dịch vụ
docker compose up -d --build

# Đồng bộ Prisma schema
docker compose run --rm api npx prisma db push

# Nạp dữ liệu mẫu
docker compose run --rm api npx tsx prisma/seed.ts
```

## 🔄 Các Lần Tiếp Theo

### Khi code thay đổi (Dev)
- Docker Watch tự động đồng bộ file `src/` và restart. Không cần làm gì thêm.

### Khi code thay đổi (Production)
```bash
docker compose up -d --build
```

### Khi sửa `prisma/schema.prisma`
```bash
# Đồng bộ schema (dev – chạy host)
npx prisma db push

# Đồng bộ schema (prod – chạy container)
docker compose run --rm api npx prisma db push

# Muốn seed lại dữ liệu
npx tsx prisma/seed.ts          # dev
docker compose run --rm api npx tsx prisma/seed.ts  # prod
```

---

## 📖 Tài liệu API

Khi server đang chạy:

- **Scalar UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/openapi.json`

## 🛠 Các Lệnh Khác

```bash
# Xem log
docker compose logs -f api-dev   # dev
docker compose logs -f api       # prod

# Dừng hệ thống
docker compose down

# Xoá toàn bộ dữ liệu DB (volume)
docker compose down -v
```
