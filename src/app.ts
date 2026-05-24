import express, { Router } from 'express';
import helmet  from 'helmet';
import cors    from 'cors';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';

import authRoutes           from '@/modules/auth/auth.routes';
import userRoutes           from '@/modules/users/users.routes';
import storeRoutes          from '@/modules/stores/stores.routes';
import categoryRoutes       from '@/modules/categories/categories.routes';
import menuItemRoutes       from '@/modules/menu-items/menu-items.routes';
import areaRoutes           from '@/modules/areas/areas.routes';
import tableRoutes          from '@/modules/tables/tables.routes';
import statusRoutes         from '@/modules/statuses/statuses.routes';
import orderRoutes          from '@/modules/orders/orders.routes';
import realtimeRoutes       from '@/modules/realtime/realtime.routes';
import expenseRoutes        from '@/modules/expenses/expenses.routes';
import dashboardRoutes      from '@/modules/dashboard/dashboard.routes';
import scheduleRoutes       from '@/modules/schedule/schedule.routes';
import attendanceRoutes     from '@/modules/attendance/attendance.routes';
import leaveRoutes          from '@/modules/leave/leave.routes';
import payrollRoutes        from '@/modules/payroll/payroll.routes';

import systemRoutes         from '@/modules/system/system.routes';
import roleRoutes           from '@/modules/roles/roles.routes';
import employeeRoutes       from '@/modules/employees/employees.routes';
import storeRoleRoutes      from '@/modules/store-roles/store-roles.routes';
import aiRoutes             from '@/modules/ai/ai.routes';

import { apiReference } from '@scalar/express-api-reference';
import { openApiSpec }  from '@/docs/openapi';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

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

// Global routes
app.use('/api/auth',                        authRoutes);
app.use('/api/users',                       userRoutes);
app.use('/api/system',                      systemRoutes);
app.use('/api/roles',                       roleRoutes);

// Store root routes
app.use('/api/stores',                      storeRoutes);

// Store group routes
const storeRouter = Router({ mergeParams: true });
storeRouter.use('/categories',              categoryRoutes);
storeRouter.use('/menu-items',              menuItemRoutes);
storeRouter.use('/areas',                   areaRoutes);
storeRouter.use('/tables',                  tableRoutes);
storeRouter.use('/statuses',                statusRoutes);
storeRouter.use('/orders',                  orderRoutes);
storeRouter.use('/realtime',                realtimeRoutes);
storeRouter.use('/expenses',                expenseRoutes);
storeRouter.use('/dashboard',               dashboardRoutes);
storeRouter.use('/schedule',                scheduleRoutes);
storeRouter.use('/attendance',              attendanceRoutes);
storeRouter.use('/leave',                   leaveRoutes);
storeRouter.use('/payroll',                 payrollRoutes);
storeRouter.use('/roles',                   storeRoleRoutes);
storeRouter.use('/employees',               employeeRoutes);
storeRouter.use('/ai',                      aiRoutes);

// Mount group
app.use('/api/stores/:storeId',             storeRouter);

app.use(errorHandler);

export default app;
