import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/statuses/statuses.controller';
import { createStatusSchema, updateStatusSchema, reorderStatusesSchema, statusParamsSchema } from '@/modules/statuses/statuses.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.statuses.list), controller.list);
router.post('/', requirePermission(PERMS.statuses.create), validate(createStatusSchema), controller.create);

router.patch('/reorder', requirePermission(PERMS.statuses.reorder), validate(reorderStatusesSchema), controller.reorder);

router.put(
  '/:statusId',
  requirePermission(PERMS.statuses.update),
  validate(statusParamsSchema, 'params'),
  validate(updateStatusSchema),
  controller.update,
);

router.delete(
  '/:statusId',
  requirePermission(PERMS.statuses.delete),
  validate(statusParamsSchema, 'params'),
  controller.remove,
);

export default router;
