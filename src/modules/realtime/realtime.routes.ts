import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { PERMS } from '@/config/rbac/rbac-defs';
import * as controller from '@/modules/realtime/realtime.controller';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);
router.post(
  '/auth',
  requirePermission(PERMS.orders.list),
  controller.authChannel,
);

export default router;
