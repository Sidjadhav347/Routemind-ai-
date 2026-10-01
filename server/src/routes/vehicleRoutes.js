import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { vehicleSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', VehicleController.getAll);
router.post('/', validateBody(vehicleSchema), VehicleController.create);
router.get('/:id', VehicleController.getById);
router.put('/:id', validateBody(vehicleSchema.partial()), VehicleController.update);
router.delete('/:id', VehicleController.delete);

export default router;
