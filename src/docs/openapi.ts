import type { OpenAPIObject } from 'openapi3-ts/oas31';

import { commonSchemas }    from '@/docs/schemas/common';
import { authSchemas }      from '@/docs/schemas/auth.schemas';
import { storeSchemas }     from '@/docs/schemas/stores.schemas';
import { categorySchemas }  from '@/docs/schemas/categories.schemas';
import { menuItemSchemas }  from '@/docs/schemas/menu-items.schemas';
import { areaSchemas }      from '@/docs/schemas/areas.schemas';
import { tableSchemas }     from '@/docs/schemas/tables.schemas';
import { statusSchemas }    from '@/docs/schemas/statuses.schemas';
import { orderSchemas }     from '@/docs/schemas/orders.schemas';
import { expenseSchemas }   from '@/docs/schemas/expenses.schemas';
import { dashboardSchemas } from '@/docs/schemas/dashboard.schemas';

import { authPaths }      from '@/docs/paths/auth.paths';
import { storePaths }     from '@/docs/paths/stores.paths';
import { categoryPaths }  from '@/docs/paths/categories.paths';
import { menuItemPaths }  from '@/docs/paths/menu-items.paths';
import { areaPaths }      from '@/docs/paths/areas.paths';
import { tablePaths }     from '@/docs/paths/tables.paths';
import { statusPaths }    from '@/docs/paths/statuses.paths';
import { orderPaths }     from '@/docs/paths/orders.paths';
import { expensePaths }   from '@/docs/paths/expenses.paths';
import { dashboardPaths } from '@/docs/paths/dashboard.paths';

const tagTranslation: Record<string, string> = {
  'Auth':       '🔐 Tài khoản & Xác thực',
  'Stores':     '🏪 Cửa hàng',
  'Categories': '📁 Danh mục thực đơn',
  'Menu Items': '☕ Món ăn & Đồ uống',
  'Areas':      '📍 Khu vực bàn',
  'Tables':     '🪑 Quản lý bàn',
  'Statuses':   '🔄 Quy trình xử lý đơn',
  'Orders':     '🛒 Đơn hàng',
  'Expenses':   '🧾 Phiếu chi',
  'Dashboard':  '📊 Thống kê tổng hợp',
};

const rawPaths = {
  ...authPaths,
  ...storePaths,
  ...categoryPaths,
  ...menuItemPaths,
  ...areaPaths,
  ...tablePaths,
  ...statusPaths,
  ...orderPaths,
  ...expensePaths,
  ...dashboardPaths,
};

// Tự động ánh xạ tên các tag sang tiếng Việt cho toàn bộ danh sách endpoints
for (const pathObj of Object.values(rawPaths)) {
  for (const methodObj of Object.values(pathObj as Record<string, any>)) {
    if (methodObj?.tags && Array.isArray(methodObj.tags)) {
      methodObj.tags = methodObj.tags.map((t: string) => tagTranslation[t] || t);
    }
  }
}

export const openApiSpec: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Orderly API',
    version: '1.0.0',
    description: `
## Giới thiệu
REST API cho ứng dụng POS quán cà phê **Orderly**.

## Xác thực
Hầu hết các endpoint yêu cầu JWT Bearer token.
1. Gọi \`POST /api/auth/login\` để lấy token
2. Nhấn **Authorize** (🔒) ở góc phải → nhập token
3. Tất cả request tiếp theo sẽ tự động đính kèm header \`Authorization: Bearer <token>\`

## Chuẩn response
Mọi response đều theo format:
- **Thành công**: \`{ success: true, data: ..., message: "..." }\`
- **Lỗi**: \`{ success: false, error: { code: "...", message: "...", details?: [...] } }\`
    `.trim(),
    contact: {
      name: 'Orderly Team',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: 'http://api:3000',       description: 'Docker internal' },
  ],
  tags: [
    { name: tagTranslation['Auth'],       description: 'Đăng ký, đăng nhập, thông tin người dùng' },
    { name: tagTranslation['Stores'],     description: 'Quản lý cửa hàng' },
    { name: tagTranslation['Categories'], description: 'Danh mục thực đơn' },
    { name: tagTranslation['Menu Items'], description: 'Món ăn / đồ uống' },
    { name: tagTranslation['Areas'],      description: 'Khu vực bàn' },
    { name: tagTranslation['Tables'],     description: 'Trạng thái hoạt động của bàn' },
    { name: tagTranslation['Statuses'],   description: 'Quy trình xử lý đơn hàng' },
    { name: tagTranslation['Orders'],     description: 'Đơn hàng' },
    { name: tagTranslation['Expenses'],   description: 'Phiếu chi' },
    { name: tagTranslation['Dashboard'],  description: 'Thống kê & báo cáo' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token lấy từ POST /api/auth/login',
      },
    },
    schemas: {
      ...commonSchemas,
      ...authSchemas,
      ...storeSchemas,
      ...categorySchemas,
      ...menuItemSchemas,
      ...areaSchemas,
      ...tableSchemas,
      ...statusSchemas,
      ...orderSchemas,
      ...expenseSchemas,
      ...dashboardSchemas,
    },
  },
  security: [{ BearerAuth: [] }],
  paths: rawPaths,
};
