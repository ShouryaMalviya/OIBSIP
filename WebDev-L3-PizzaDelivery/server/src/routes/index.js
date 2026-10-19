import { Router } from 'express';
import authRoutes from './auth.routes.js';
import pizzaRoutes from './pizza.routes.js';
import ingredientRoutes from './ingredient.routes.js';
import pricingRoutes from './pricing.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import adminRoutes from './admin.routes.js';
import trackingRoutes from './tracking.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'PizzaVerse API',
    version: '5.0.0 (Part 5: Real-Time Order Tracking, Socket.IO & Full Integration)',
    features: {
      socketIO: true,
      realTimeTracking: true,
      adminChannels: true,
      pollingFallback: true,
      inventoryScheduler: true,
    },
    timestamp: new Date().toISOString(),
  });
});

// Mounted modules
router.use('/auth', authRoutes);
router.use('/pizzas', pizzaRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/pricing', pricingRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);   // Part 3: Orders & Razorpay Checkout
router.use('/admin', adminRoutes);    // Part 4: Admin Dashboard, Inventory & Orders
router.use('/tracking', trackingRoutes); // Part 5: Real-Time Tracking & Polling Fallback

export default router;
