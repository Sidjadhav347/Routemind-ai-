import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { updatePreferencesSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.get('/preferences', UserController.getPreferences);
router.put('/preferences', validateBody(updatePreferencesSchema), UserController.updatePreferences);

export default router;
