import OrderService from '../services/order.service.js';
import RazorpayService from '../services/razorpay.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createCheckoutOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return sendError(res, 401, 'Please sign in to place an order.');
    }

    const { deliveryAddress } = req.body;
    const clientCartToken = req.headers['x-cart-token'] || req.cookies?.cartToken || null;

    const result = await OrderService.createCheckoutOrder({
      userId,
      deliveryAddress,
      clientCartToken,
    });

    return sendSuccess(res, 201, 'Checkout order initialized successfully', result);
  } catch (error) {
    if (error.message.includes('out of stock') || error.message.includes('unavailable') || error.message.includes('empty')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return sendError(res, 401, 'Authentication required to verify payment.');
    }

    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return sendError(res, 400, 'Missing Razorpay payment verification parameters.');
    }

    const result = await OrderService.verifyPayment({
      userId,
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return sendSuccess(res, 200, 'Payment verified successfully. Order confirmed!', result);
  } catch (error) {
    if (error.message.includes('signature') || error.message.includes('Mismatched') || error.message.includes('Unauthorized')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return sendError(res, 401, 'Authentication required.');
    }

    const orders = await OrderService.getMyOrders(userId);
    return sendSuccess(res, 200, 'User orders retrieved successfully', {
      orders,
      count: orders.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === 'admin';
    const { id } = req.params;

    const order = await OrderService.getOrderById(id, userId, isAdmin);
    return sendSuccess(res, 200, 'Order details retrieved', { order });
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    if (error.message.includes('denied') || error.message.includes('Unauthorized')) {
      return sendError(res, 403, error.message);
    }
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === 'admin';
    const { id } = req.params;
    const { reason } = req.body;

    const result = await OrderService.cancelOrder({
      userId,
      orderId: id,
      reason,
      isAdmin,
    });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    if (error.message.includes('Cannot cancel')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('Unauthorized')) {
      return sendError(res, 403, error.message);
    }
    next(error);
  }
};

export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValid = RazorpayService.verifyWebhookSignature({
      rawBody,
      signature: webhookSignature,
    });

    if (!isValid) {
      return sendError(res, 400, 'Invalid webhook signature');
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
      const razorpayPaymentId = payload?.payment?.entity?.id;

      if (razorpayOrderId) {
        // Find order and mark paid idempotently
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.paymentStatus !== 'paid') {
          order.transitionPaymentStatus('paid');
          order.transitionOrderStatus('received', `Payment captured via webhook event ${event}`, 'webhook');
          order.razorpayPaymentId = razorpayPaymentId;
          await order.save();
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[RazorpayWebhook] Error handling webhook:', error.message);
    return res.status(200).json({ status: 'ignored', error: error.message });
  }
};
