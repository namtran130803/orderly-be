import { Router } from 'express';
import { authenticate }        from '@/middleware/authenticate';
import { requireStoreAccess }  from '@/middleware/requireStoreAccess';
import { validate }            from '@/middleware/validate';
import * as controller         from '@/modules/menu-items/menu-items.controller';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuItemParamsSchema,
} from '@/modules/menu-items/menu-items.schema';

const router = Router({ mergeParams: true }); // mergeParams để lấy storeId từ parent

// Tất cả routes đều yêu cầu đăng nhập và quyền sở hữu store
router.use(authenticate, requireStoreAccess);

router.get('/',    controller.list);
router.post('/',   validate(createMenuItemSchema), controller.create);
router.put(
  '/:itemId',
  validate(menuItemParamsSchema, 'params'),
  validate(updateMenuItemSchema),
  controller.update,
);
router.delete(
  '/:itemId',
  validate(menuItemParamsSchema, 'params'),
  controller.remove,
);

export default router;
