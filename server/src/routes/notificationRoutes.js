import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);

export default router;
