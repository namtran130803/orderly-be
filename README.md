# ☕ Orderly POS — Backend REST API (100% Dockerized)

![Node.js](https://img.shields.io/badge/Node.js-24%20LTS-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Exclusive-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Hệ thống Backend REST API Quản lý bán hàng (POS) chuỗi quán cà phê **Orderly**. 

> **🎯 TRỌNG TÂM VẬN HÀNH (DOCKER-EXCLUSIVE):**
> Mã nguồn được thiết kế tối ưu hóa trọn vẹn để **chạy 100% bên trong container Docker**. Bạn **KHÔNG CẦN** cài đặt Node.js hay PostgreSQL cục bộ trên máy tính cá nhân. Mọi thao tác từ phát triển (hot-reload), nạp dữ liệu DB, đến triển khai sản phẩm đều thực thi nhất quán qua Docker Compose.

---

## 📋 Yêu Cầu Duy Nhất (Prerequisite)
- Cài đặt và bật **Docker Desktop** (hoặc Docker Engine kèm Plugin Compose v2).
- Đảm bảo Docker daemon đang chạy (biểu tượng cá voi màu xanh).

---

## 🚀 Hướng Dẫn Cài Đặt Ban Đầu (Setup Chung)

### Bước 1: Clone mã nguồn
```bash
git clone <repository-url>
cd orderly-be
```

### Bước 2: Thiết lập Biến môi trường
Copy file `.env.example` để tạo file `.env` chính thức:
```bash
cp .env.example .env
```
*(File `.env` mặc định đã được cấu hình các chuỗi kết nối tương thích hoàn hảo giữa các dịch vụ ngầm trong mạng lưới Docker nội bộ).*

---

## 💻 Môi Trường Phát Triển (Development Mode)
Khi code tính năng mới, bạn cần ứng dụng tự động cập nhật (Hot-reload) mỗi khi bạn lưu file trên máy tính.

### 1. Khởi động riêng Database ngầm
```bash
docker compose up -d db
```

### 2. Khởi tạo cấu trúc bảng & Nạp dữ liệu mẫu (Chỉ làm lần đầu)
Thực thi lệnh nạp Prisma migrate và dữ liệu mẫu (`seed`) trực tiếp bên trong một container tạm thời:
```bash
# Đẩy cấu trúc Database và sinh Prisma Client
docker compose run --rm api npx prisma migrate dev --name init

# Nạp dữ liệu ban đầu (Menu, Cửa hàng, Khu vực, Trạng thái...)
docker compose run --rm api npm run seed
```

### 3. Khởi chạy API Server với tính năng Tự động Đồng bộ (Hot-Reload hoàn hảo)
Sử dụng cấu hình dịch vụ chuyên dụng `api-dev` kết hợp tính năng **Watch** của Docker Compose. Hệ thống sẽ tự động lắng nghe, đồng bộ từng thay đổi file trên Windows host vào thẳng Linux kernel và khởi động lại dịch vụ ngay lập tức:
```bash
docker compose watch api-dev
```
> **💡 Trải nghiệm mượt mà**: Giờ đây, bạn có thể tự do mở VSCode trên Windows, chỉnh sửa file logic (ví dụ `auth.controller.ts`), ngay khi bạn ấn Save (`Ctrl + S`), Docker sẽ tự nạp mã mới trong chớp mắt mà không trễ nhịp!

---

## 🌍 Môi Trường Thực Tế (Production Mode)
Khi triển khai lên máy chủ thật hoặc kiểm thử trọn gói hiệu năng sản phẩm với mã nguồn JavaScript đã tối ưu trong thư mục `dist/`:

### 1. Khởi chạy toàn bộ hệ thống ngầm (Detached)
Lệnh này sẽ tự động build image đa giai đoạn (Multi-stage) tinh gọn và chạy song song cả DB lẫn API Server:
```bash
docker compose up -d --build
```

### 2. Xem Log Hoạt Động Thời Gian Thực
```bash
docker compose logs -f api
```

### 3. Dừng và Tắt Hệ Thống
```bash
docker compose down
```

---

## 📖 Tra Cứu Tài Liệu API (Scalar UI & OpenAPI)
Khi API Server đang hoạt động (ở cả chế độ Dev hoặc Prod), bạn có thể truy cập trình duyệt tại:
- **Giao diện Trực quan Scalar UI**: `http://localhost:3000/docs` *(Giao diện tối ưu, hỗ trợ thử nghiệm trực tiếp).*
- **Đặc tả OpenAPI 3.1 JSON**: `http://localhost:3000/api/openapi.json` *(Dùng để import vào Postman hoặc ứng dụng Frontend).*

---

## 🛠️ Các Lệnh Thao Tác DB Nâng Cao Qua Docker
Nếu sau này bạn chỉnh sửa sơ đồ `prisma/schema.prisma`, hãy áp dụng thay đổi bằng các lệnh sau:

```bash
# Tạo file migration mới khi đổi cấu trúc bảng
docker compose run --rm api npx prisma migrate dev --name <tên_chỉnh_sửa>

# Cập nhật lại Prisma Client types
docker compose run --rm api npx prisma generate
```

---
**Orderly POS Backend** — Chuẩn mực Vận hành Tự động hóa qua Container.
