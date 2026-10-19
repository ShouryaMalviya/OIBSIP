import { io } from 'socket.io-client';
import api from './api';

const getSocketServerUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return envUrl.replace(/\/api\/?$/, '');
};

class SocketService {
  constructor() {
    this.socket = null;
    this.connectionState = 'disconnected'; // 'connected' | 'connecting' | 'disconnected' | 'error'
    this.statusListeners = new Set();
    this.activeOrderSubscriptions = new Map(); // orderId -> { onStatusUpdated, pollTimer, isActive }
    this.adminListeners = new Set();
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback) {
    this.statusListeners.add(callback);
    callback(this.connectionState);
    return () => this.statusListeners.delete(callback);
  }

  _notifyStatusChange(newState) {
    this.connectionState = newState;
    this.statusListeners.forEach((cb) => {
      try {
        cb(newState);
      } catch (err) {
        console.error('[SocketService] Status callback error:', err);
      }
    });
  }

  /**
   * Connect to Socket.IO server with JWT token
   */
  connect() {
    const token = localStorage.getItem('pizzaverse_token');

    // If socket already connected, reuse
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // If socket exists but disconnected, reconnect
    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
      return this.socket;
    }

    const serverUrl = getSocketServerUrl();
    this._notifyStatusChange('connecting');

    this.socket = io(serverUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket.IO] Connected to real-time server with id:', this.socket.id);
      this._notifyStatusChange('connected');

      // Re-subscribe any active order tracking rooms
      for (const [orderId, sub] of this.activeOrderSubscriptions.entries()) {
        if (sub.isActive) {
          this.socket.emit('order:subscribe', { orderId });
          // Stop polling if socket connection is established
          this._stopOrderPolling(orderId);
        }
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket.IO] Disconnected from real-time server:', reason);
      this._notifyStatusChange('disconnected');

      // Fallback: start controlled polling for active tracked orders
      for (const [orderId, sub] of this.activeOrderSubscriptions.entries()) {
        if (sub.isActive) {
          this._startOrderPolling(orderId);
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
      this._notifyStatusChange('error');

      // Fallback: start controlled polling
      for (const [orderId, sub] of this.activeOrderSubscriptions.entries()) {
        if (sub.isActive) {
          this._startOrderPolling(orderId);
        }
      }
    });

    // Listen for customer order status updates
    this.socket.on('order:statusUpdated', (data) => {
      console.log('[Socket.IO] Real-time event received [order:statusUpdated]:', data);
      const sub = this.activeOrderSubscriptions.get(data.orderId) ||
                  this.activeOrderSubscriptions.get(data.orderNumber);
      if (sub && typeof sub.onStatusUpdated === 'function') {
        sub.onStatusUpdated(data);
      }
    });

    // Listen for admin events
    this.socket.on('admin:orderUpdated', (data) => {
      this.adminListeners.forEach((l) => l.onOrderUpdated && l.onOrderUpdated(data));
    });

    this.socket.on('admin:newOrder', (data) => {
      this.adminListeners.forEach((l) => l.onNewOrder && l.onNewOrder(data));
    });

    this.socket.on('admin:inventoryAlert', (data) => {
      this.adminListeners.forEach((l) => l.onInventoryAlert && l.onInventoryAlert(data));
    });

    this.socket.on('admin:stockChanged', (data) => {
      this.adminListeners.forEach((l) => l.onStockChange && l.onStockChange(data));
    });

    return this.socket;
  }

  /**
   * Disconnect socket (e.g. on user logout)
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._notifyStatusChange('disconnected');
    }
    // Clear all polling timers
    for (const [orderId] of this.activeOrderSubscriptions.entries()) {
      this._stopOrderPolling(orderId);
    }
    this.activeOrderSubscriptions.clear();
  }

  /**
   * Controlled Polling Fallback Implementation
   */
  _startOrderPolling(orderId) {
    const sub = this.activeOrderSubscriptions.get(orderId);
    if (!sub || sub.pollTimer) return; // already polling

    console.log(`[SocketService] Starting controlled polling fallback for order: ${orderId} (every 5s)`);

    const poll = async () => {
      // Don't poll if page is inactive/hidden in background
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      try {
        const response = await api.get(`/tracking/${orderId}`);
        const data = response.data?.data || response.data;
        if (sub && sub.isActive && typeof sub.onStatusUpdated === 'function') {
          sub.onStatusUpdated({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            orderStatus: data.orderStatus,
            paymentStatus: data.paymentStatus,
            estimatedDeliveryMinutes: data.estimatedDeliveryMinutes,
            updatedAt: data.updatedAt,
            statusHistory: data.statusHistory,
            isPollingFallback: true,
          });
        }

        // If order reaches a terminal state (delivered or cancelled), stop polling
        if (data.orderStatus === 'delivered' || data.orderStatus === 'cancelled') {
          this._stopOrderPolling(orderId);
        }
      } catch (err) {
        console.warn(`[SocketService] Polling check for ${orderId} encountered error:`, err.message);
      }
    };

    // Immediate initial poll
    poll();
    sub.pollTimer = setInterval(poll, 5000);
  }

  _stopOrderPolling(orderId) {
    const sub = this.activeOrderSubscriptions.get(orderId);
    if (sub && sub.pollTimer) {
      clearInterval(sub.pollTimer);
      sub.pollTimer = null;
      console.log(`[SocketService] Stopped polling fallback for order: ${orderId}`);
    }
  }

  /**
   * Subscribe to real-time order updates with automatic fallback
   * @param {string} orderId - Order ID or orderNumber
   * @param {Object} handlers - { onStatusUpdated, onSubscribed, onError }
   * @returns {Function} unsubscribe function
   */
  subscribeToOrder(orderId, { onStatusUpdated, onSubscribed, onError } = {}) {
    if (!orderId) return () => {};

    this.connect();

    // Register active subscription
    const subscriptionRecord = {
      orderId,
      onStatusUpdated,
      isActive: true,
      pollTimer: null,
    };
    this.activeOrderSubscriptions.set(orderId, subscriptionRecord);

    // If socket is connected, emit subscription request
    if (this.socket && this.socket.connected) {
      this.socket.emit('order:subscribe', { orderId }, (ack) => {
        if (ack?.success) {
          if (typeof onSubscribed === 'function') onSubscribed(ack);
        } else {
          console.warn('[SocketService] Subscription ack error:', ack?.message);
          if (typeof onError === 'function') onError(ack);
          // If unauthorized or rejected, fall back to check authoritative REST
          this._startOrderPolling(orderId);
        }
      });
    } else {
      // Socket not connected yet: start polling fallback immediately
      this._startOrderPolling(orderId);
    }

    // Return cleanup unsubscribe function
    return () => {
      subscriptionRecord.isActive = false;
      this._stopOrderPolling(orderId);
      this.activeOrderSubscriptions.delete(orderId);
      if (this.socket && this.socket.connected) {
        this.socket.emit('order:unsubscribe', { orderId });
      }
    };
  }

  /**
   * Subscribe to Administrative Live Channels
   * @param {Object} listeners - { onOrderUpdated, onNewOrder, onInventoryAlert, onStockChange }
   * @returns {Function} unsubscribe function
   */
  subscribeToAdmin(listeners = {}) {
    this.connect();
    this.adminListeners.add(listeners);

    if (this.socket && this.socket.connected) {
      this.socket.emit('admin:subscribe');
    }

    return () => {
      this.adminListeners.delete(listeners);
    };
  }
}

export const socketService = new SocketService();
export default socketService;
