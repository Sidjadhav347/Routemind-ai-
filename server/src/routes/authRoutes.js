import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema } from '../schemas/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.me);

export default router;
