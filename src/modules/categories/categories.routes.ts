import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/categories/categories.controller';
import { createCategorySchema, updateCategorySchema, categoryParamsSchema, reorderCategoriesSchema } from '@/modules/categories/categories.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', controller.list);
router.post('/', validate(createCategorySchema), controller.create);

router.put(
  '/:catId',
  validate(categoryParamsSchema, 'params'),
  validate(updateCategorySchema),
  controller.update,
);

router.delete(
  '/:catId',
  validate(categoryParamsSchema, 'params'),
  controller.remove,
);

router.post('/reorder', validate(reorderCategoriesSchema), controller.reorder);

export default router;
