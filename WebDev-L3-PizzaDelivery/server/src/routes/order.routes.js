import { Router } from 'express';
import {
  createCheckoutOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
  handleRazorpayWebhook,
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Order creation & payment routes (authenticated)
router.post('/', authenticate, createCheckoutOrder);
router.post('/create-checkout', authenticate, createCheckoutOrder);
router.post('/verify-payment', authenticate, verifyPayment);

// Order history & detail (authenticated)
router.get('/my-orders', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/cancel', authenticate, cancelOrder);

// Webhook for Razorpay asynchronous server-to-server notifications
router.post('/webhook', handleRazorpayWebhook);

export default router;
