import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'PizzaVerse API',
    version: '1.0.0 (Part 1)',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// Continuation hook: In Parts 2–5, mount additional modules here:
// router.use('/pizzas', pizzaRoutes);       // Part 2
// router.use('/orders', orderRoutes);       // Part 3
// router.use('/inventory', inventoryRoutes); // Part 4
// router.use('/tracking', trackingRoutes);   // Part 5

export default router;
