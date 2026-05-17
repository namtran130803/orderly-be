import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/areas/areas.controller';
import { createAreaSchema, updateAreaSchema, reorderAreasSchema, areaParamsSchema } from '@/modules/areas/areas.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.areas.list), controller.list);
router.post('/', requirePermission(PERMS.areas.create), validate(createAreaSchema), controller.create);
router.patch('/reorder', requirePermission(PERMS.areas.reorder), validate(reorderAreasSchema), controller.reorder);

router.put(
  '/:areaId',
  requirePermission(PERMS.areas.update),
  validate(areaParamsSchema, 'params'),
  validate(updateAreaSchema),
  controller.update,
);

router.delete(
  '/:areaId',
  requirePermission(PERMS.areas.delete),
  validate(areaParamsSchema, 'params'),
  controller.remove,
);

export default router;
