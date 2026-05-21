import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { requireSystemAccess } from '@/middleware/requireSystemAccess';
import { requirePermission } from '@/middleware/requirePermission';
import { validate } from '@/middleware/validate';
import * as controller from '@/modules/roles/roles.controller';
import { createRoleSchema, updateRoleSchema, roleParamsSchema } from '@/modules/roles/roles.schema';
import { PERMS } from '@/config/rbac/rbac-defs';

const router = Router();

router.use(authenticate, requireSystemAccess);

router.get('/me', controller.myRoles);

router.get('/', requirePermission(PERMS.roles.list), controller.list);
router.post('/', requirePermission(PERMS.roles.create), validate(createRoleSchema), controller.create);
router.put('/:roleId', requirePermission(PERMS.roles.update), validate(roleParamsSchema, 'params'), validate(updateRoleSchema), controller.update);
router.delete('/:roleId', requirePermission(PERMS.roles.delete), validate(roleParamsSchema, 'params'), controller.remove);

export default router;
