import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';

let ioInstance = null;

/**
 * Socket.IO Authentication Middleware
 * Validates JWT token from handshake auth, headers, or cookies.
 * Attaches verified user details to socket.
 * Rejects untrusted or expired connections.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    // Check authorization header
    if (!token && socket.handshake.headers?.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    // Check cookie if header not provided
    if (!token && socket.handshake.headers?.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [k, v] = cookie.trim().split('=');
        if (k === 'token') {
          token = decodeURIComponent(v);
          break;
        }
      }
    }

    if (!token) {
      return next(new Error('Authentication required for real-time tracking'));
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId = decoded?.userId || decoded?.id;
    if (!decoded || !userId) {
      return next(new Error('Invalid authentication token signature'));
    }

    // Fetch user from DB or in-memory
    const user = await User.findById(userId);
    if (!user || user.isActive === false) {
      return next(new Error('User account not found or deactivated'));
    }

    // Attach verified user to socket (never trust client payload IDs)
    socket.user = {
      id: user.id || user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    };

    return next();
  } catch (error) {
    return next(new Error(`Authentication failed: ${error.message}`));
  }
};

/**
 * Initialize Socket.IO with HTTP server
 */
export const initSocketIO = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          env.CLIENT_URL,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3000',
        ];
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Dev-permissive with credentials
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Attach JWT authentication middleware
  ioInstance.use(socketAuthMiddleware);

  ioInstance.on('connection', (socket) => {
    const { id: userId, email, role } = socket.user;
    console.log(`[Socket.IO] Client connected: socket=${socket.id} user=${email} (${role})`);

    // If user is admin, auto-join admin operational rooms
    if (role === 'admin') {
      socket.join('admin:orders');
      socket.join('admin:inventory');
      console.log(`[Socket.IO] Admin ${email} joined channels [admin:orders, admin:inventory]`);
    }

    // Explicit admin subscription event
    socket.on('admin:subscribe', (data, ack) => {
      if (socket.user.role !== 'admin') {
        const err = { success: false, message: 'Forbidden. Administrator authorization required.' };
        if (typeof ack === 'function') ack(err);
        socket.emit('admin:error', err);
        return;
      }
      socket.join('admin:orders');
      socket.join('admin:inventory');
      const res = { success: true, message: 'Subscribed to administrative real-time channels' };
      if (typeof ack === 'function') ack(res);
      socket.emit('admin:subscribed', res);
    });

    /**
     * Customer Order Subscription Event
     * Enforces strict server-side ownership authorization
     */
    socket.on('order:subscribe', async (data, ack) => {
      try {
        const orderId = typeof data === 'string' ? data : data?.orderId;
        if (!orderId) {
          const err = { success: false, message: 'Order ID is required to subscribe.' };
          if (typeof ack === 'function') ack(err);
          socket.emit('order:error', err);
          return;
        }

        // Lookup order in persistence layer
        let order = await Order.findById(orderId);
        if (!order) {
          order = await Order.findOne({ orderNumber: orderId });
        }

        if (!order) {
          const err = { success: false, message: 'Order not found.' };
          if (typeof ack === 'function') ack(err);
          socket.emit('order:error', err);
          return;
        }

        // STRICT AUTHORIZATION: Only the order owner or an admin can subscribe
        const isOwner = order.userId.toString() === socket.user.id.toString();
        const isAdmin = socket.user.role === 'admin';

        if (!isOwner && !isAdmin) {
          console.warn(
            `[Socket.IO Security Alert] Unauthorized subscription attempt by user=${socket.user.id} on order=${order.id} owned by=${order.userId}`
          );
          const err = {
            success: false,
            message: 'Unauthorized. You do not have permission to track this order.',
          };
          if (typeof ack === 'function') ack(err);
          socket.emit('order:error', err);
          return;
        }

        // Join server-controlled rooms
        const roomById = `order:${order.id}`;
        const roomByNumber = `order:${order.orderNumber}`;
        socket.join(roomById);
        socket.join(roomByNumber);

        console.log(`[Socket.IO] Authorized subscription: user=${socket.user.email} -> ${roomById}`);

        const response = {
          success: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          estimatedDeliveryMinutes: order.estimatedDeliveryMinutes || 35,
          room: roomById,
          message: 'Real-time order subscription authorized.',
        };

        if (typeof ack === 'function') ack(response);
        socket.emit('order:subscribed', response);
      } catch (err) {
        console.error('[Socket.IO] Error in order:subscribe:', err);
        const errResp = { success: false, message: err.message || 'Subscription failed.' };
        if (typeof ack === 'function') ack(errResp);
        socket.emit('order:error', errResp);
      }
    });

    /**
     * Unsubscribe from order room
     */
    socket.on('order:unsubscribe', (data, ack) => {
      const orderId = typeof data === 'string' ? data : data?.orderId;
      if (orderId) {
        socket.leave(`order:${orderId}`);
      }
      if (typeof ack === 'function') ack({ success: true });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: socket=${socket.id} reason=${reason}`);
    });
  });

  return ioInstance;
};

/**
 * Access the active Socket.IO server instance
 */
export const getIO = () => ioInstance;

/**
 * Broadcast order status change to authorized customer room and admin channel
 */
export const emitOrderStatusUpdate = (order, extra = {}) => {
  if (!ioInstance) return;
  try {
    const orderData = order.toJSON ? order.toJSON() : order;
    const payload = {
      orderId: order.id || order._id?.toString(),
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes || 35,
      updatedAt: order.updatedAt || new Date(),
      statusHistory: order.statusHistory || [],
      order: orderData,
      ...extra,
    };

    // 1. Emit to customer's authorized order room
    ioInstance.to(`order:${order.id}`).to(`order:${order.orderNumber}`).emit('order:statusUpdated', payload);

    // 2. Emit to admin orders channel
    ioInstance.to('admin:orders').emit('admin:orderUpdated', payload);

    console.log(`[Socket.IO] Emitted order:statusUpdated for ${order.orderNumber} -> "${order.orderStatus}"`);
  } catch (err) {
    console.error('[Socket.IO] Failed to emit order status update:', err);
  }
};

/**
 * Broadcast newly confirmed order to admin orders channel
 */
export const emitNewOrder = (order) => {
  if (!ioInstance) return;
  try {
    const orderData = order.toJSON ? order.toJSON() : order;
    const payload = {
      orderId: order.id || order._id?.toString(),
      orderNumber: order.orderNumber,
      grandTotalPaise: order.grandTotalPaise,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt || new Date(),
      customerName: order.deliveryAddress?.fullName || 'Guest Customer',
      order: orderData,
    };

    ioInstance.to('admin:orders').emit('admin:newOrder', payload);
    console.log(`[Socket.IO] Emitted admin:newOrder for ${order.orderNumber}`);
  } catch (err) {
    console.error('[Socket.IO] Failed to emit new order:', err);
  }
};

/**
 * Broadcast low-stock alert to admin inventory channel
 */
export const emitInventoryAlert = (alert) => {
  if (!ioInstance) return;
  try {
    const alertData = alert.toJSON ? alert.toJSON() : alert;
    ioInstance.to('admin:inventory').emit('admin:inventoryAlert', alertData);
    console.log(`[Socket.IO] Emitted admin:inventoryAlert for SKU "${alert.sku}"`);
  } catch (err) {
    console.error('[Socket.IO] Failed to emit inventory alert:', err);
  }
};

/**
 * Broadcast stock quantity change to admin inventory channel
 */
export const emitStockChange = (item) => {
  if (!ioInstance) return;
  try {
    const itemData = item.toJSON ? item.toJSON() : item;
    ioInstance.to('admin:inventory').emit('admin:stockChanged', itemData);
    console.log(`[Socket.IO] Emitted admin:stockChanged for SKU "${item.sku}"`);
  } catch (err) {
    console.error('[Socket.IO] Failed to emit stock change:', err);
  }
};

export default {
  initSocketIO,
  getIO,
  emitOrderStatusUpdate,
  emitNewOrder,
  emitInventoryAlert,
  emitStockChange,
};
