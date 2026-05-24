import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as menuController from '@/modules/ai/menu/controller';
import { analyzeMenuSchema, generateMenuSchema } from '@/modules/ai/menu/schema';
import * as expenseController from '@/modules/ai/expense/controller';
import { analyzeExpenseSchema, generateExpenseSchema } from '@/modules/ai/expense/schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.post(
  '/menu/analyze',
  requirePermission(PERMS.ai.menu_analyze),
  validate(analyzeMenuSchema),
  menuController.analyzeMenu,
);

router.post(
  '/menu/generate',
  requirePermission(PERMS.ai.menu_generate),
  validate(generateMenuSchema),
  menuController.generateMenu,
);

router.post(
  '/expenses/analyze',
  requirePermission(PERMS.ai.expense_analyze),
  validate(analyzeExpenseSchema),
  expenseController.analyzeExpense,
);

router.post(
  '/expenses/generate',
  requirePermission(PERMS.ai.expense_generate),
  validate(generateExpenseSchema),
  expenseController.generateExpense,
);

export default router;
