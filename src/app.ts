import express from 'express';
import helmet  from 'helmet';
import cors    from 'cors';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';

import authRoutes       from '@/modules/auth/auth.routes';
import storeRoutes      from '@/modules/stores/stores.routes';
import categoryRoutes   from '@/modules/categories/categories.routes';
import menuItemRoutes   from '@/modules/menu-items/menu-items.routes';
import areaRoutes       from '@/modules/areas/areas.routes';
import tableRoutes      from '@/modules/tables/tables.routes';
import statusRoutes     from '@/modules/statuses/statuses.routes';
import orderRoutes      from '@/modules/orders/orders.routes';
import expenseRoutes    from '@/modules/expenses/expenses.routes';
import dashboardRoutes  from '@/modules/dashboard/dashboard.routes';

import { apiReference } from '@scalar/express-api-reference';
import { openApiSpec }  from '@/docs/openapi';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để cho phép trình duyệt tải JS/CSS CDN của Scalar UI
}));
app.use(cors());
app.use(express.json());

// Tích hợp OpenAPI JSON spec cho client/Scalar/Postman
app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

// Tích hợp giao diện tài liệu trực quan Scalar UI ở môi trường phát triển
if (env.NODE_ENV !== 'production') {
  app.use(
    '/docs',
    apiReference({
      spec:          { content: openApiSpec },
      theme:         'default',
      layout:        'modern',
      defaultHttpClient: {
        targetKey:   'javascript',
        clientKey:   'fetch',
      },
      authentication: {
        preferredSecurityScheme: 'BearerAuth',
      },
    }),
  );
}

// Gắn kết toàn bộ hệ thống API router
app.use('/api/auth',                       authRoutes);
app.use('/api/stores',                     storeRoutes);
app.use('/api/stores/:storeId/categories', categoryRoutes);
app.use('/api/stores/:storeId/menu-items', menuItemRoutes);
app.use('/api/stores/:storeId/areas',      areaRoutes);
app.use('/api/stores/:storeId/tables',     tableRoutes);
app.use('/api/stores/:storeId/statuses',   statusRoutes);
app.use('/api/stores/:storeId/orders',     orderRoutes);
app.use('/api/stores/:storeId/expenses',   expenseRoutes);
app.use('/api/stores/:storeId/dashboard',  dashboardRoutes);

// LUÔN PHẢI Ở CUỐI CÙNG: Xử lý lỗi tập trung toàn bộ hệ thống
app.use(errorHandler);

export default app;
