import app from '@/app';
import { env } from '@/config/env';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server Orderly POS đang chạy tại: http://localhost:${env.PORT}`);
  if (env.NODE_ENV !== 'production') {
    console.log(`📖 Tài liệu API (Scalar): http://localhost:${env.PORT}/docs`);
    console.log(`📦 OpenAPI JSON spec: http://localhost:${env.PORT}/api/openapi.json`);
  }
});

// Xử lý graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Nhận tín hiệu SIGTERM. Đang đóng server an toàn...');
  server.close(() => {
    console.log('Đã đóng toàn bộ kết nối.');
    process.exit(0);
  });
});
