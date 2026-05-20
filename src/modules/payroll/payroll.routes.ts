import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/payroll/payroll.controller';
import { PERMS } from '@/config/rbac/rbac-defs';
import {
  storeParamsSchema,
  payrollMonthQuerySchema,
  payrollEmployeeParamsSchema,
} from '@/modules/payroll/payroll.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get(
  '/me',
  validate(storeParamsSchema, 'params'),
  validate(payrollMonthQuerySchema, 'query'),
  controller.myDetail,
);

router.get(
  '/',
  requirePermission(PERMS.payroll.preview),
  validate(storeParamsSchema, 'params'),
  validate(payrollMonthQuerySchema, 'query'),
  controller.preview,
);

router.get(
  '/employees/:employeeId',
  requirePermission(PERMS.payroll.detail),
  validate(payrollEmployeeParamsSchema, 'params'),
  validate(payrollMonthQuerySchema, 'query'),
  controller.employeeDetail,
);

router.post(
  '/lock',
  requirePermission(PERMS.payroll.lock),
  validate(storeParamsSchema, 'params'),
  validate(payrollMonthQuerySchema, 'query'),
  controller.lock,
);

router.delete(
  '/lock',
  requirePermission(PERMS.payroll.unlock),
  validate(storeParamsSchema, 'params'),
  validate(payrollMonthQuerySchema, 'query'),
  controller.unlock,
);

export default router;
