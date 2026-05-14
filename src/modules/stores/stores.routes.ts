import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/stores/stores.controller';
import { createStoreSchema, updateStoreSchema, storeParamsSchema } from '@/modules/stores/stores.schema';

const router = Router();

// Yêu cầu đăng nhập cho tất cả API cửa hàng
router.use(authenticate);

router.get('/', controller.list);
router.post('/', validate(createStoreSchema), controller.create);

// Các thao tác cụ thể trên một cửa hàng yêu cầu kiểm tra quyền sở hữu
router.put(
  '/:storeId',
  validate(storeParamsSchema, 'params'),
  requireStoreAccess,
  validate(updateStoreSchema),
  controller.update,
);

router.delete(
  '/:storeId',
  validate(storeParamsSchema, 'params'),
  requireStoreAccess,
  controller.remove,
);

export default router;
