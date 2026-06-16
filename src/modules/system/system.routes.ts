import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireSystemAccess } from '@/middleware/requireSystemAccess';
import { requirePermission } from '@/middleware/requirePermission';
import * as controller from '@/modules/system/system.controller';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router();

router.use(authenticate, requireSystemAccess);

router.get('/modules', requirePermission(PERMS.system.modules), controller.listModules);
router.get('/overview', requirePermission(PERMS.system.overview), controller.getOverview);

export default router;
