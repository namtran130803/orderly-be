import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
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

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', validate(orderQuerySchema, 'query'), controller.list);
router.post('/', validate(createOrderSchema), controller.create);

router.get('/:orderId', validate(orderParamsSchema, 'params'), controller.detail);
router.put('/:orderId', validate(orderParamsSchema, 'params'), validate(updateOrderSchema), controller.update);
router.delete('/:orderId', validate(orderParamsSchema, 'params'), controller.remove);

router.patch(
  '/:orderId/advance',
  validate(orderParamsSchema, 'params'),
  validate(changeOrderStatusSchema),
  controller.advance,
);

router.patch(
  '/:orderId/revert',
  validate(orderParamsSchema, 'params'),
  validate(changeOrderStatusSchema),
  controller.revert,
);

export default router;
