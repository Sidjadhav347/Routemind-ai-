import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', AnalyticsController.getAnalytics);

export default router;
