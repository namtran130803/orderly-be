import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/orders/orders.controller';
import {
  orderQuerySchema,
  createOrderSchema,
  updateOrderSchema,
  changeOrderStatusSchema,
  orderParamsSchema,
} from '@/modules/orders/orders.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.orders.list), validate(orderQuerySchema, 'query'), controller.list);
router.post('/', requirePermission(PERMS.orders.create), validate(createOrderSchema), controller.create);

router.get('/:orderId', requirePermission(PERMS.orders.detail), validate(orderParamsSchema, 'params'), controller.detail);
router.put('/:orderId', requirePermission(PERMS.orders.update), validate(orderParamsSchema, 'params'), validate(updateOrderSchema), controller.update);
router.delete('/:orderId', requirePermission(PERMS.orders.delete), validate(orderParamsSchema, 'params'), controller.remove);

router.patch(
  '/:orderId/advance',
  requirePermission(PERMS.orders.advance),
  validate(orderParamsSchema, 'params'),
  validate(changeOrderStatusSchema),
  controller.advance,
);

router.patch(
  '/:orderId/revert',
  requirePermission(PERMS.orders.revert),
  validate(orderParamsSchema, 'params'),
  validate(changeOrderStatusSchema),
  controller.revert,
);

export default router;
