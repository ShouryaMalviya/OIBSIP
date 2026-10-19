import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

const STAGES = ['received', 'in_kitchen', 'sent_to_delivery', 'delivered'];

/**
 * GET /api/tracking/:id
 * Authoritative polling fallback endpoint for real-time order tracking
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === 'admin';
    const { id } = req.params;

    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    // Authorization check
    if (!isAdmin && order.userId.toString() !== userId.toString()) {
      return sendError(res, 403, 'Unauthorized. You do not have permission to track this order.');
    }

    const currentStageIndex = STAGES.indexOf(order.orderStatus);

    return sendSuccess(res, 200, 'Order tracking state retrieved', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      currentStageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
      isDelivered: order.orderStatus === 'delivered',
      isCancelled: order.orderStatus === 'cancelled',
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes || 35,
      statusHistory: order.statusHistory || [],
      deliveryAddress: {
        city: order.deliveryAddress?.city,
        state: order.deliveryAddress?.state,
        postalCode: order.deliveryAddress?.postalCode,
      },
      itemsSummary: (order.items || []).map((it) => `${it.quantity}× ${it.name}`),
      grandTotalPaise: order.grandTotalPaise,
      updatedAt: order.updatedAt,
      createdAt: order.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
