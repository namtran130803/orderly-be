import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/expenses/expenses.controller';
import { expenseQuerySchema, createExpenseSchema, updateExpenseSchema, expenseParamsSchema } from '@/modules/expenses/expenses.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', validate(expenseQuerySchema, 'query'), controller.list);
router.post('/', validate(createExpenseSchema), controller.create);

router.put(
  '/:expenseId',
  validate(expenseParamsSchema, 'params'),
  validate(updateExpenseSchema),
  controller.update,
);

router.delete(
  '/:expenseId',
  validate(expenseParamsSchema, 'params'),
  controller.remove,
);

export default router;
