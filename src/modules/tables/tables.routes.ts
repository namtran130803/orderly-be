import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import * as controller from '@/modules/tables/tables.controller';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', controller.list);
router.put('/:tableId', controller.updateTable);
router.delete('/:tableId', controller.deleteTable);

export default router;
