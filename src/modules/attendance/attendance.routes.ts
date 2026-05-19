import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/attendance/attendance.controller';
import { PERMS } from '@/config/rbac/rbac-defs';
import {
  storeParamsSchema,
  attendanceQuerySchema,
  scanBodySchema,
  attendanceParamsSchema,
  createManualAttendanceSchema,
  patchAttendanceSchema,
} from '@/modules/attendance/attendance.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get(
  '/qr-token',
  requirePermission(PERMS.attendance.scan),
  validate(storeParamsSchema, 'params'),
  controller.qrToken,
);

router.post(
  '/scan',
  requirePermission(PERMS.attendance.scan),
  validate(storeParamsSchema, 'params'),
  validate(scanBodySchema),
  controller.scan,
);

router.get(
  '/',
  requirePermission(PERMS.attendance.view),
  validate(storeParamsSchema, 'params'),
  validate(attendanceQuerySchema, 'query'),
  controller.list,
);

router.post(
  '/',
  requirePermission(PERMS.attendance.manage),
  validate(storeParamsSchema, 'params'),
  validate(createManualAttendanceSchema),
  controller.create,
);

router.patch(
  '/:attendanceId',
  requirePermission(PERMS.attendance.manage),
  validate(attendanceParamsSchema, 'params'),
  validate(patchAttendanceSchema),
  controller.patch,
);

export default router;
