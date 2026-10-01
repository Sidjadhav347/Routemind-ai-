import { Router } from 'express';
import { RouteController } from '../controllers/routeController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/geocode', RouteController.geocode);
router.get('/:id', RouteController.getRouteById);

export default router;
