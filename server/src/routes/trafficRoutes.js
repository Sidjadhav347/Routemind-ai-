import { Router } from 'express';
import { TrafficController } from '../controllers/trafficController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/events', TrafficController.getEvents);
router.get('/scenarios', TrafficController.getScenarios);
router.post('/scenarios/trigger', TrafficController.triggerScenario);

export default router;
