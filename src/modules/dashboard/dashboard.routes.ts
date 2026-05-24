import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/dashboard/dashboard.controller';
import { dashboardQuerySchema } from '@/modules/dashboard/dashboard.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/finance', requirePermission(PERMS.dashboard.stats), validate(dashboardQuerySchema, 'query'), controller.getFinance);

router.get('/orders', requirePermission(PERMS.dashboard.stats), validate(dashboardQuerySchema, 'query'), controller.getOrders);

router.get('/operations', requirePermission(PERMS.dashboard.stats), controller.getOperations);

router.get('/staff', requirePermission(PERMS.dashboard.stats), validate(dashboardQuerySchema, 'query'), controller.getStaff);

router.get('/', requirePermission(PERMS.dashboard.stats), validate(dashboardQuerySchema, 'query'), controller.getStats);

export default router;
