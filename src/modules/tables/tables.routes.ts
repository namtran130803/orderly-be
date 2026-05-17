import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import * as controller from '@/modules/tables/tables.controller';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.tables.list), controller.list);
router.put('/:tableId', requirePermission(PERMS.tables.update), controller.updateTable);
router.delete('/:tableId', requirePermission(PERMS.tables.delete), controller.deleteTable);

export default router;
