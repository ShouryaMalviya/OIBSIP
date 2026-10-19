import api from './api';

export const adminService = {
  // Authentication
  async login(credentials) {
    const response = await api.post('/admin/auth/login', credentials);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/admin/auth/me');
    return response.data;
  },

  async logout() {
    const response = await api.post('/admin/auth/logout');
    return response.data;
  },

  // Dashboard Overview
  async getDashboardMetrics() {
    const response = await api.get('/admin/dashboard/metrics');
    return response.data;
  },

  // Inventory Management
  async getInventory(params = {}) {
    const response = await api.get('/admin/inventory', { params });
    return response.data;
  },

  async getInventoryItem(id) {
    const response = await api.get(`/admin/inventory/${id}`);
    return response.data;
  },

  async createInventoryItem(data) {
    const response = await api.post('/admin/inventory', data);
    return response.data;
  },

  async updateInventoryItem(id, data) {
    const response = await api.patch(`/admin/inventory/${id}`, data);
    return response.data;
  },

  async adjustStock(id, { adjustmentAmount, reason }) {
    const response = await api.post(`/admin/inventory/${id}/adjust`, {
      adjustmentAmount,
      reason,
    });
    return response.data;
  },

  async getAdjustmentLogs(limit = 50) {
    const response = await api.get('/admin/inventory/adjustments', { params: { limit } });
    return response.data;
  },

  async getLowStockAlerts() {
    const response = await api.get('/admin/inventory/alerts');
    return response.data;
  },

  async triggerLowStockScan() {
    const response = await api.post('/admin/inventory/trigger-scan');
    return response.data;
  },

  // Order Management
  async getAdminOrders(params = {}) {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  async getAdminOrder(id) {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  async updateOrderStatus(id, { status, reason }) {
    const response = await api.patch(`/admin/orders/${id}/status`, { status, reason });
    return response.data;
  },
};

export default adminService;
