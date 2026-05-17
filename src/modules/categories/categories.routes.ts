import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/categories/categories.controller';
import { createCategorySchema, updateCategorySchema, categoryParamsSchema, reorderCategoriesSchema } from '@/modules/categories/categories.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.categories.list), controller.list);
router.post('/', requirePermission(PERMS.categories.create), validate(createCategorySchema), controller.create);

router.put(
  '/:catId',
  requirePermission(PERMS.categories.update),
  validate(categoryParamsSchema, 'params'),
  validate(updateCategorySchema),
  controller.update,
);

router.delete(
  '/:catId',
  requirePermission(PERMS.categories.delete),
  validate(categoryParamsSchema, 'params'),
  controller.remove,
);

router.post('/reorder', requirePermission(PERMS.categories.reorder), validate(reorderCategoriesSchema), controller.reorder);

export default router;
