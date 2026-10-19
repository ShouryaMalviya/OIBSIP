import { Router } from 'express';
import authRoutes from './auth.routes.js';
import pizzaRoutes from './pizza.routes.js';
import ingredientRoutes from './ingredient.routes.js';
import pricingRoutes from './pricing.routes.js';
import cartRoutes from './cart.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'PizzaVerse API',
    version: '2.0.0 (Part 2: Catalog, Builder, Pricing & Cart)',
    timestamp: new Date().toISOString(),
  });
});

// Mounted modules
router.use('/auth', authRoutes);
router.use('/pizzas', pizzaRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/pricing', pricingRoutes);
router.use('/cart', cartRoutes);

// Continuation hook for Parts 3–5:
// router.use('/orders', orderRoutes);       // Part 3
// router.use('/inventory', inventoryRoutes); // Part 4
// router.use('/tracking', trackingRoutes);   // Part 5

export default router;
