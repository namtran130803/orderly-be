import { Router } from 'express';
import { authenticate }        from '@/middleware/authenticate';
import { requirePermission }   from '@/middleware/requirePermission';
import { requireStoreAccess }  from '@/middleware/requireStoreAccess';
import { validate }            from '@/middleware/validate';
import * as controller         from '@/modules/menu-items/menu-items.controller';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuItemParamsSchema,
} from '@/modules/menu-items/menu-items.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/',    requirePermission(PERMS.menu_items.list), controller.list);
router.post('/',   requirePermission(PERMS.menu_items.create), validate(createMenuItemSchema), controller.create);
router.put(
  '/:itemId',
  requirePermission(PERMS.menu_items.update),
  validate(menuItemParamsSchema, 'params'),
  validate(updateMenuItemSchema),
  controller.update,
);
router.delete(
  '/:itemId',
  requirePermission(PERMS.menu_items.delete),
  validate(menuItemParamsSchema, 'params'),
  controller.remove,
);

export default router;
