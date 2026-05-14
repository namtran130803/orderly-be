import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireStoreAccess } from '@/middleware/requireStoreAccess';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/dashboard/dashboard.controller';
import { dashboardQuerySchema } from '@/modules/dashboard/dashboard.schema';

const router = Router({ mergeParams: true });

router.use(authenticate, requireStoreAccess);

router.get('/', validate(dashboardQuerySchema, 'query'), controller.getStats);

export default router;
