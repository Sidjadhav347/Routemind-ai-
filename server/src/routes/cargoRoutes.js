import { Router } from 'express';
import { CargoController } from '../controllers/cargoController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { cargoSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', CargoController.getAll);
router.post('/', validateBody(cargoSchema), CargoController.create);
router.get('/:id', CargoController.getById);
router.put('/:id', validateBody(cargoSchema.partial()), CargoController.update);
router.delete('/:id', CargoController.delete);

export default router;
