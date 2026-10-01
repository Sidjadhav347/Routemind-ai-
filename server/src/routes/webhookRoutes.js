import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController.js';

const router = Router();

// n8n Webhook entrypoints (secured via API secret if provided)
router.post('/traffic-sync', WebhookController.handleTrafficSync);
router.post('/active-trips-check', WebhookController.handleActiveTripCheck);

export default router;
