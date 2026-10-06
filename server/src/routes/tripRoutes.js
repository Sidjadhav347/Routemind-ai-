import { Router } from 'express';
import { TripController } from '../controllers/tripController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { createTripSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/optimize', validateBody(createTripSchema), TripController.optimizeTrip);
router.post('/', validateBody(createTripSchema), TripController.createTrip);
router.get('/', TripController.getTrips);
router.get('/:id', TripController.getTripById);
router.post('/:id/start', TripController.startTrip);
router.post('/:id/complete', TripController.completeTrip);
router.post('/:tripId/reroute/evaluate', TripController.evaluateReroute);
router.post('/:tripId/reroute/apply', TripController.applyReroute);
router.post('/:tripId/simulate-incident', TripController.simulateIncident);

export default router;
