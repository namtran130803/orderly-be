import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/authenticate';
import * as controller from '@/modules/auth/auth.controller';
import { registerSchema, loginSchema } from '@/modules/auth/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.get('/me', authenticate, controller.me);

export default router;
