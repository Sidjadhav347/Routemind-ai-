import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { aiChatSchema, simulatorSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/status', AIController.getStatus);
router.post('/chat', validateBody(aiChatSchema), AIController.chat);
router.post('/explain', AIController.explainRoute);
router.post('/simulate', validateBody(simulatorSchema), AIController.runSimulation);

export default router;
