import { Router } from 'express';
import * as pizzaController from '../controllers/pizza.controller.js';

const router = Router();

router.get('/', pizzaController.getAllPizzas);
router.get('/:id', pizzaController.getPizzaById);

export default router;
