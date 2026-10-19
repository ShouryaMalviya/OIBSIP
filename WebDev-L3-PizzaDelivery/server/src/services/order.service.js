import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Pizza } from '../models/Pizza.js';
import { Ingredient } from '../models/Ingredient.js';
import {
  calculateCustomPizzaUnitPrice,
  calculateCartTotals,
  formatINR,
  PRICING_CONFIG,
} from '../utils/pricing.js';
import RazorpayService from './razorpay.service.js';
import InventoryService from './inventory.service.js';
import { emitOrderStatusUpdate, emitNewOrder } from '../socket/index.js';

export const OrderService = {
  /**
   * Create pending checkout order with authoritative price recalculation & Razorpay order creation
   */
  async createCheckoutOrder({ userId, deliveryAddress, clientCartToken = null }) {
    if (!userId) {
      throw new Error('Authentication required to place an order.');
    }

    // Validate delivery address fields
    const { fullName, phone, street, city, state, postalCode } = deliveryAddress || {};
    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      throw new Error('All delivery address fields are required (fullName, phone, street, city, state, postalCode).');
    }

    // Fetch user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart && clientCartToken) {
      cart = await Cart.findOne({ cartToken: clientCartToken });
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Your cart is empty. Please add items to checkout.');
    }

    // Server-side authoritative validation and item snapshot generation
    const orderItems = [];

    for (const item of cart.items) {
      const qty = Math.max(1, Math.min(20, parseInt(item.quantity, 10) || 1));

      if (item.itemType === 'catalog') {
        const pizza = await Pizza.findById(item.pizzaId);
        if (!pizza) {
          throw new Error('One of the pizzas in your cart is no longer available in our menu.');
        }
        if (!pizza.isAvailable) {
          throw new Error(`"${pizza.name}" is currently out of stock. Please remove it from your cart.`);
        }

        // Check stock availability
        if (!InventoryService.hasStock(pizza.id, qty)) {
          throw new Error(`Insufficient inventory for "${pizza.name}".`);
        }

        const unitPricePaise = pizza.basePricePaise;
        const totalPricePaise = unitPricePaise * qty;

        orderItems.push({
          itemType: 'catalog',
          pizzaId: pizza.id,
          name: pizza.name,
          description: pizza.description,
          imageUrl: pizza.imageUrl,
          quantity: qty,
          unitPricePaise,
          totalPricePaise,
        });
      } else if (item.itemType === 'custom') {
        const { baseId, sauceId, cheeseId, veggieIds = [], name } = item.customPizza || {};

        const base = await Ingredient.findById(baseId);
        const sauce = await Ingredient.findById(sauceId);
        const cheese = await Ingredient.findById(cheeseId);

        if (!base || !base.isAvailable) throw new Error('Selected pizza crust is currently unavailable.');
        if (!sauce || !sauce.isAvailable) throw new Error('Selected sauce is currently unavailable.');
        if (!cheese || !cheese.isAvailable) throw new Error('Selected cheese is currently unavailable.');

        const veggies = [];
        for (const vid of veggieIds) {
          const v = await Ingredient.findById(vid);
          if (!v || !v.isAvailable) {
            throw new Error(`Selected ingredient "${v?.name || vid}" is currently unavailable.`);
          }
          veggies.push(v);
        }

        // Authoritative unit price recalculation
        const unitPricePaise = calculateCustomPizzaUnitPrice({
          baseAdjustmentPaise: base.priceAdjustmentPaise,
          sauceAdjustmentPaise: sauce.priceAdjustmentPaise,
          cheeseAdjustmentPaise: cheese.priceAdjustmentPaise,
          veggieAdjustmentsPaise: veggies.map((v) => v.priceAdjustmentPaise),
        });
        const totalPricePaise = unitPricePaise * qty;

        orderItems.push({
          itemType: 'custom',
          name: name || 'Custom Artisanal Pizza',
          description: `${base.name} crust with ${sauce.name}, ${cheese.name}, and toppings`,
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
          customPizza: {
            name: name || 'Custom Artisanal Pizza',
            base: { id: base.id, name: base.name, priceAdjustmentPaise: base.priceAdjustmentPaise },
            sauce: { id: sauce.id, name: sauce.name, priceAdjustmentPaise: sauce.priceAdjustmentPaise },
            cheese: { id: cheese.id, name: cheese.name, priceAdjustmentPaise: cheese.priceAdjustmentPaise },
            veggies: veggies.map((v) => ({
              id: v.id,
              name: v.name,
              priceAdjustmentPaise: v.priceAdjustmentPaise,
            })),
          },
          quantity: qty,
          unitPricePaise,
          totalPricePaise,
        });
      }
    }

    if (orderItems.length === 0) {
      throw new Error('No valid items found in cart.');
    }

    // Authoritative totals calculation in integer paise
    const totals = calculateCartTotals(orderItems);
    const orderNumber = Order.generateOrderNumber();

    // Create Razorpay test-mode order
    const razorpayOrder = await RazorpayService.createOrder({
      amountPaise: totals.grandTotalPaise,
      receipt: orderNumber,
      notes: {
        userId: userId.toString(),
        itemCount: String(orderItems.length),
      },
    });

    // Create Order document
    const order = new Order({
      orderNumber,
      userId,
      items: orderItems,
      deliveryAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        instructions: (deliveryAddress.instructions || '').trim(),
      },
      subtotalPaise: totals.subtotalPaise,
      deliveryFeePaise: totals.deliveryFeePaise,
      taxPaise: totals.taxPaise,
      grandTotalPaise: totals.grandTotalPaise,
      currency: 'INR',
      paymentStatus: 'pending',
      orderStatus: 'awaiting_payment',
      inventoryStatus: 'none',
      razorpayOrderId: razorpayOrder.id,
      statusHistory: [
        {
          fromStatus: null,
          toStatus: 'awaiting_payment',
          changedAt: new Date(),
          reason: 'Order created, awaiting Razorpay checkout completion',
          updatedBy: 'customer',
        },
      ],
    });

    // Reserve inventory atomically
    await InventoryService.reserveStockForOrder(order);

    await order.save();

    return {
      order: order.toJSON ? order.toJSON() : order,
      razorpay: {
        orderId: razorpayOrder.id,
        keyId: RazorpayService.getPublishableKey(),
        amount: totals.grandTotalPaise,
        currency: 'INR',
        name: 'PizzaVerse Artisanal Pizzeria',
        description: `Order ${orderNumber}`,
      },
      pricing: totals,
    };
  },

  /**
   * Verify Razorpay payment and commit order
   */
  async verifyPayment({
    userId,
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) {
    if (!orderId && !razorpayOrderId) {
      throw new Error('Order identifier is required for payment verification.');
    }

    // Locate the order
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        order = await Order.findOne({ orderNumber: orderId });
      }
    }
    if (!order && razorpayOrderId) {
      order = await Order.findOne({ razorpayOrderId });
    }

    if (!order) {
      throw new Error('Order not found.');
    }

    // Verify ownership
    if (order.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized. You do not own this order.');
    }

    // IDEMPOTENCY CHECK: If already marked as paid, return safely without double-processing
    if (order.paymentStatus === 'paid') {
      return {
        success: true,
        alreadyProcessed: true,
        order: order.toJSON ? order.toJSON() : order,
      };
    }

    // Verify razorpay order ID matches
    if (order.razorpayOrderId !== razorpayOrderId) {
      throw new Error('Mismatched Razorpay Order ID.');
    }

    // Verify HMAC-SHA256 signature using constant-time comparison
    const isValidSignature = RazorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      // Record payment failure attempt
      try {
        order.transitionPaymentStatus('failed');
        order.statusHistory.push({
          fromStatus: 'awaiting_payment',
          toStatus: 'awaiting_payment',
          changedAt: new Date(),
          reason: 'Payment signature verification failed. Possible tampering.',
          updatedBy: 'system',
        });
        await order.save();
      } catch (e) {
        // Ignore transition error if state already failed
      }
      throw new Error('Invalid Razorpay payment signature. Payment could not be verified.');
    }

    // Transition state
    order.transitionPaymentStatus('paid');
    order.transitionOrderStatus('received', 'Payment verified via Razorpay test mode', 'system');
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    // Commit inventory
    await InventoryService.commitStockForOrder(order);

    await order.save();

    // Clear cart upon verified payment
    try {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    } catch (err) {
      console.warn('[OrderService] Could not clear cart after order payment:', err.message);
    }

    // Emit real-time notifications
    emitOrderStatusUpdate(order, { reason: 'Payment verified via Razorpay test mode' });
    emitNewOrder(order);

    return {
      success: true,
      alreadyProcessed: false,
      order: order.toJSON ? order.toJSON() : order,
    };
  },

  /**
   * Cancel an order and release reserved or committed inventory
   */
  async cancelOrder({ userId, orderId, reason = 'Cancelled by user', isAdmin = false }) {
    let order = await Order.findById(orderId);
    if (!order) {
      order = await Order.findOne({ orderNumber: orderId });
    }
    if (!order) {
      throw new Error('Order not found.');
    }

    if (!isAdmin && order.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized. You do not have permission to cancel this order.');
    }

    // Check cancellation eligibility
    if (order.orderStatus === 'cancelled') {
      return { success: true, message: 'Order was already cancelled', order: order.toJSON ? order.toJSON() : order };
    }

    if (order.orderStatus === 'sent_to_delivery' || order.orderStatus === 'delivered') {
      throw new Error(`Cannot cancel order once it is in "${order.orderStatus}" stage.`);
    }

    order.transitionOrderStatus('cancelled', reason, isAdmin ? 'admin' : 'customer');

    // If paid, transition payment to refunded
    if (order.paymentStatus === 'paid') {
      try {
        order.transitionPaymentStatus('refunded');
      } catch (err) {
        console.warn('[OrderService] Refund state transition note:', err.message);
      }
    }

    // Release inventory
    await InventoryService.releaseStockForOrder(order, reason);

    await order.save();

    // Emit real-time status update for customer & admin
    emitOrderStatusUpdate(order, { reason });

    return {
      success: true,
      message: 'Order cancelled and inventory restored.',
      order: order.toJSON ? order.toJSON() : order,
    };
  },

  /**
   * Get all orders for the authenticated user
   */
  async getMyOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return orders.map((o) => (o.toJSON ? o.toJSON() : o));
  },

  /**
   * Get single order by ID or orderNumber
   */
  async getOrderById(orderId, userId, isAdmin = false) {
    let order = await Order.findById(orderId);
    if (!order) {
      order = await Order.findOne({ orderNumber: orderId });
    }
    if (!order) {
      throw new Error('Order not found.');
    }

    if (!isAdmin && order.userId.toString() !== userId.toString()) {
      throw new Error('Access denied. You do not own this order.');
    }

    return order.toJSON ? order.toJSON() : order;
  },
};

export default OrderService;
