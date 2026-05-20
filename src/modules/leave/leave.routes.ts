import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/leave/leave.controller';
import { PERMS } from '@/config/rbac/rbac-defs';
import {
  storeParamsSchema,
  leaveQuerySchema,
  createLeaveSchema,
  leaveIdParamsSchema,
} from '@/modules/leave/leave.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get(
  '/me',
  validate(storeParamsSchema, 'params'),
  validate(leaveQuerySchema, 'query'),
  controller.myList,
);

router.get(
  '/',
  requirePermission(PERMS.leave.list),
  validate(storeParamsSchema, 'params'),
  validate(leaveQuerySchema, 'query'),
  controller.list,
);

router.post(
  '/',
  requirePermission(PERMS.leave.create),
  validate(storeParamsSchema, 'params'),
  validate(createLeaveSchema),
  controller.create,
);

router.patch(
  '/:leaveId/approve',
  requirePermission(PERMS.leave.approve),
  validate(leaveIdParamsSchema, 'params'),
  controller.approve,
);

router.patch(
  '/:leaveId/reject',
  requirePermission(PERMS.leave.reject),
  validate(leaveIdParamsSchema, 'params'),
  controller.reject,
);

export default router;
