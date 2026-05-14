import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/statuses/statuses.controller';
import { createStatusSchema, updateStatusSchema, reorderStatusesSchema, statusParamsSchema } from '@/modules/statuses/statuses.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', controller.list);
router.post('/', validate(createStatusSchema), controller.create);

// Route tĩnh phải đặt trước các route dùng tham số động (:statusId)
router.patch('/reorder', validate(reorderStatusesSchema), controller.reorder);

router.put(
  '/:statusId',
  validate(statusParamsSchema, 'params'),
  validate(updateStatusSchema),
  controller.update,
);

router.delete(
  '/:statusId',
  validate(statusParamsSchema, 'params'),
  controller.remove,
);

export default router;
