import { Router } from 'express';
import * as ingredientController from '../controllers/ingredient.controller.js';

const router = Router();

router.get('/', ingredientController.getAllIngredients);

export default router;
