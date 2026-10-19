import { Router } from 'express';
import {
  adminLogin,
  getAdminMe,
  adminLogout,
  getDashboardOverview,
  getInventoryList,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  getAdjustmentLogs,
  getLowStockAlerts,
  triggerManualScan,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ==========================================
// 1. ADMIN AUTHENTICATION
// ==========================================
router.post('/auth/login', adminLogin);
router.get('/auth/me', authenticate, authorize('admin'), getAdminMe);
router.post('/auth/logout', authenticate, authorize('admin'), adminLogout);

// All subsequent routes require both valid JWT and 'admin' role
router.use(authenticate, authorize('admin'));

// ==========================================
// 2. DASHBOARD
// ==========================================
router.get('/dashboard/metrics', getDashboardOverview);

// ==========================================
// 3. INVENTORY MANAGEMENT
// ==========================================
router.get('/inventory', getInventoryList);
router.get('/inventory/adjustments', getAdjustmentLogs);
router.get('/inventory/alerts', getLowStockAlerts);
router.post('/inventory/trigger-scan', triggerManualScan);
router.get('/inventory/:id', getInventoryItemById);
router.post('/inventory', createInventoryItem);
router.patch('/inventory/:id', updateInventoryItem);
router.post('/inventory/:id/adjust', adjustStock);

// ==========================================
// 4. ORDER MANAGEMENT
// ==========================================
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
