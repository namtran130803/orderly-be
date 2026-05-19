import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requirePermission } from '@/middleware/requirePermission';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/schedule/schedule.controller';
import { PERMS } from '@/config/rbac/rbac-defs';
import {
  storeParamsSchema,
  updateDefaultWorkDaysSchema,
  createOverrideSchema,
  overrideParamsSchema,
} from '@/modules/schedule/schedule.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', requirePermission(PERMS.schedule.view), validate(storeParamsSchema, 'params'), controller.get);

router.put(
  '/default',
  requirePermission(PERMS.schedule.manage),
  validate(storeParamsSchema, 'params'),
  validate(updateDefaultWorkDaysSchema),
  controller.putDefault,
);

router.post(
  '/overrides',
  requirePermission(PERMS.schedule.manage),
  validate(storeParamsSchema, 'params'),
  validate(createOverrideSchema),
  controller.postOverride,
);

router.delete(
  '/overrides/:overrideId',
  requirePermission(PERMS.schedule.manage),
  validate(overrideParamsSchema, 'params'),
  controller.removeOverride,
);

export default router;
