import api from './api';

export const orderService = {
  /**
   * Initialize a checkout order with authoritative price recalculation & Razorpay order
   */
  async createCheckoutOrder(deliveryAddress) {
    const response = await api.post('/orders/create-checkout', { deliveryAddress });
    return response.data;
  },

  /**
   * Verify Razorpay payment signature and confirm order
   */
  async verifyPayment(verificationPayload) {
    const response = await api.post('/orders/verify-payment', verificationPayload);
    return response.data;
  },

  /**
   * Retrieve order history for the authenticated customer
   */
  async getMyOrders() {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  /**
   * Retrieve single order receipt by ID or order number
   */
  async getOrderById(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Cancel an eligible order
   */
  async cancelOrder(orderId, reason = 'Cancelled by customer') {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  /**
   * Authoritative tracking status for polling fallback
   */
  async getTrackingStatus(orderId) {
    const response = await api.get(`/tracking/${orderId}`);
    return response.data;
  },
};

/**
 * Dynamically loads the official Razorpay Checkout SDK script
 */
export const loadRazorpayCheckoutScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Razorpay] External checkout script failed to load or was blocked.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default orderService;
