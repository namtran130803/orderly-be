import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/areas/areas.controller';
import { createAreaSchema, updateAreaSchema, reorderAreasSchema, areaParamsSchema } from '@/modules/areas/areas.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', controller.list);
router.post('/', validate(createAreaSchema), controller.create);
router.patch('/reorder', validate(reorderAreasSchema), controller.reorder);

router.put(
  '/:areaId',
  validate(areaParamsSchema, 'params'),
  validate(updateAreaSchema),
  controller.update,
);

router.delete(
  '/:areaId',
  validate(areaParamsSchema, 'params'),
  controller.remove,
);

export default router;
