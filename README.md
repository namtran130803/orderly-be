# Orderly POS — Backend API

REST API cho ứng dụng POS (đơn hàng, menu, chấm công, lương, …). Chạy local bằng **Node.js**; **PostgreSQL** và **Soketi** (WebSocket realtime đơn hàng) chạy qua Docker Compose.

## Yêu cầu

| Công cụ | Phiên bản gợi ý |
| -------- | ----------------- |
| [Node.js](https://nodejs.org/) | 20+ |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Compose v2 |
| npm | đi kèm Node |

Frontend (`orderly-fe`) chạy riêng — xem [orderly-fe/README.md](../orderly-fe/README.md).

---

## Lần đầu chạy (dev)

### 1. Clone và cài dependency

```bash
cd orderly-be
npm install
```

### 2. Biến môi trường

```bash
cp .env.example .env
```

Chỉnh `.env` nếu cần. Tối thiểu:

- `DATABASE_URL` — trùng user/password/db với Docker Postgres
- `JWT_SECRET` — chuỗi ngẫu nhiên **≥ 32 ký tự**
- `PUSHER_*` — khớp với service Soketi (mặc định trong `.env.example` là đủ cho dev)

### 3. Khởi động Postgres + Soketi

```bash
docker compose up -d
```

Chỉ cần DB:

```bash
docker compose up -d db
```

Kiểm tra:

```bash
docker compose ps
```

### 4. Database: migrate + seed

```bash
npm run prm:mgr
npm run prm:seed
```

- `prm:mgr` — áp dụng migration Prisma (lần đầu có thể hỏi tên migration)
- `prm:seed` — dữ liệu mẫu (cửa hàng, menu, nhân viên, đơn mẫu, …)

### 5. Chạy API

```bash
npm run dev
```

- API: `http://localhost:3000` (lắng `0.0.0.0` — máy khác trong LAN gọi được)
- Tài liệu API (Scalar): `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

### 6. Frontend (cùng máy hoặc điện thoại)

Trong thư mục `orderly-fe`:

```bash
cd ../orderly-fe
cp .env.example .env
npm install
npm run dev
```

Mở URL Vite in ra (thường `https://localhost:5173` hoặc `https://<IP-LAN>:5173`).

Cấu hình quan trọng:

| File | Ghi chú |
| ------ | -------- |
| `orderly-fe/vite.config.ts` | `server.proxy['/api'].target` → IP:port backend (vd. `http://192.168.1.9:3000`) |
| `orderly-fe/.env` | `VITE_PUSHER_HOST` = IP máy chạy Soketi (không dùng `127.0.0.1` khi mở FE từ điện thoại) |

**Đăng nhập sau seed** (SĐT = username):

| Vai trò | SĐT | Mật khẩu |
| -------- | ----- | --------- |
| Admin / chủ CH1 | `0901234567` | `password123` |
| Chủ CH2 | `0903456789` | `password123` |
| Chủ CH3 | `0905678901` | `password123` |

Chi tiết nhân viên mẫu in ra cuối lệnh `npm run prm:seed`.

---

## Các lần chạy sau (dev)

Thứ tự gọn:

```bash
# 1. Docker (nếu chưa chạy)
cd orderly-be
docker compose up -d

# 2. API
npm run dev
```

Terminal khác — frontend:

```bash
cd orderly-fe
npm run dev
```

**Không cần** `npm install` / `prm:seed` lại trừ khi đổi dependency hoặc muốn reset DB.

Khi có migration mới từ git:

```bash
npm run prm:mgr
```

Reset DB + seed lại (xóa dữ liệu local):

```bash
docker compose down -v   # xóa volume Postgres
docker compose up -d
npm run prm:mgr
npm run prm:seed
```

---

## Docker Compose

| Service | Cổng | Mô tả |
| -------- | ------ | ------ |
| `db` | `5432` | PostgreSQL 16 |
| `soketi` | `6001` | WebSocket (Pusher protocol) — realtime đơn hàng |
| `soketi` | `9601` | Metrics (tùy chọn) |

Backend **không** chạy trong Docker (dev); chỉ DB + Soketi.

```bash
docker compose up -d      # bật
docker compose down       # tắt, giữ data
docker compose down -v    # tắt + xóa volume DB
docker compose logs -f db # xem log
```

---

## Scripts npm

| Lệnh | Mô tả |
| ------ | ------ |
| `npm run dev` | `prisma generate` + API hot-reload (`tsx watch`) |
| `npm run build` | Build production → `dist/` |
| `npm run start` | Chạy `dist/index.js` |
| `npm run prm:gen` | Generate Prisma Client |
| `npm run prm:mgr` | Migration dev (`prisma migrate dev`) |
| `npm run prm:mgr:deploy` | Migration production |
| `npm run prm:push` | Đồng bộ schema không tạo file migration |
| `npm run prm:seed` | Seed dữ liệu mẫu |

---

## Biến môi trường (`.env`)

| Biến | Bắt buộc | Mô tả |
| ------ | ---------- | ------ |
| `DATABASE_URL` | Có | URL Postgres |
| `JWT_SECRET` | Có (≥32 ký tự) | Ký JWT đăng nhập + QR chấm công |
| `JWT_EXPIRES_IN` | Không | Mặc định `7d` |
| `PORT` | Không | Mặc định `3000` |
| `NODE_ENV` | Không | `development` / `production` |
| `PUSHER_APP_ID` | Realtime | Khớp Soketi |
| `PUSHER_APP_KEY` | Realtime | Khớp FE `VITE_PUSHER_KEY` |
| `PUSHER_APP_SECRET` | Realtime | Khớp Soketi |
| `PUSHER_HOST` | Realtime | Host BE gọi trigger (dev: `127.0.0.1`) |
| `PUSHER_PORT` | Realtime | Mặc định `6001` |
| `PUSHER_USE_TLS` | Realtime | `false` trong dev |

Thiếu `PUSHER_*` → API vẫn chạy; realtime đơn hàng tắt.

Postgres trong Docker dùng thêm (cho `docker compose`):

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

---

## Realtime đơn hàng (Soketi)

Khi nhân viên/chủ cửa hàng tạo, sửa, chuyển trạng thái hoặc xóa đơn, BE phát event qua Soketi; FE (`OrdersPage`) tự làm mới danh sách.

Điều kiện hoạt động:

1. `docker compose` có service `soketi` đang chạy
2. BE `.env` và FE `VITE_PUSHER_*` dùng **cùng** `APP_KEY` / secret
3. `VITE_PUSHER_HOST` trỏ tới máy chạy Soketi, truy cập được từ trình duyệt

---

## Cấu trúc thư mục (gợi ý)

```
src/
  config/          # env, prisma, RBAC
  modules/         # route theo domain (orders, attendance, …)
  realtime/        # Soketi / Pusher broadcast
  middleware/
  lib/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

---

## Xử lý sự cố

**API không start — lỗi env / Prisma**

- Kiểm tra `.env` và `JWT_SECRET` đủ dài
- Chạy `npm run prm:gen`

**Không kết nối DB**

- `docker compose ps` — `db` phải `healthy`
- `DATABASE_URL` host `localhost`, port `5432`

**FE báo lỗi mạng / 401**

- Backend `npm run dev` đang chạy
- Proxy Vite trỏ đúng IP backend

**Realtime đơn không cập nhật**

- Soketi: `docker compose logs soketi`
- `PUSHER_APP_KEY` (BE) = `VITE_PUSHER_KEY` (FE)
- Từ điện thoại: `VITE_PUSHER_HOST=<IP-LAN>`, mở port `6001` firewall nếu cần

**Đổi schema DB**

```bash
npm run prm:mgr
```

---

## Production (tóm tắt)

```bash
npm run build
npm run prm:mgr:deploy
npm run start
```

Set `NODE_ENV=production`, secret mạnh, HTTPS phía reverse proxy; cấu hình Soketi/Pusher cho môi trường thật.
