import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/expenses/expenses.controller';
import { expenseQuerySchema, createExpenseSchema, updateExpenseSchema, expenseParamsSchema } from '@/modules/expenses/expenses.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.expenses.list), validate(expenseQuerySchema, 'query'), controller.list);
router.post('/', requirePermission(PERMS.expenses.create), validate(createExpenseSchema), controller.create);

router.put(
  '/:expenseId',
  requirePermission(PERMS.expenses.update),
  validate(expenseParamsSchema, 'params'),
  validate(updateExpenseSchema),
  controller.update,
);

router.delete(
  '/:expenseId',
  requirePermission(PERMS.expenses.delete),
  validate(expenseParamsSchema, 'params'),
  controller.remove,
);

export default router;
