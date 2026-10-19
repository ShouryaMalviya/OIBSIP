import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Apply optional authentication so user carts are automatically associated
router.use(optionalAuthenticate);

// Cart endpoints
router.get('/', cartController.getCart);
router.post('/items', cartController.addItemToCart);
router.patch('/items/:itemId', cartController.updateItemQuantity);
router.put('/items/:itemId/custom', cartController.updateCustomPizzaItem);
router.delete('/items/:itemId', cartController.removeItemFromCart);
router.delete('/', cartController.clearCart);

export default router;
