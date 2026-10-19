import { User } from '../models/User.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { LowStockAlert } from '../models/LowStockAlert.js';
import { Order } from '../models/Order.js';
import { authService } from '../services/auth.service.js';
import { InventoryService } from '../services/inventory.service.js';
import { runInventoryLowStockCheck } from '../services/scheduler.service.js';
import { getAuthCookieOptions } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  emitOrderStatusUpdate,
  emitStockChange,
  emitInventoryAlert,
} from '../socket/index.js';

// ==========================================
// 1. ADMIN AUTHENTICATION
// ==========================================

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required.');
    }

    // Call standard login service
    const { token, user } = await authService.login({ email, password });

    // STRICT SERVER-SIDE ROLE CHECK
    if (user.role !== 'admin') {
      return sendError(res, 403, 'Access denied. You do not possess administrator credentials.');
    }

    res.cookie('token', token, getAuthCookieOptions());

    return sendSuccess(res, 200, 'Administrator authenticated successfully.', {
      token,
      user,
    });
  } catch (error) {
    if (error.statusCode === 401 || error.message.includes('Invalid')) {
      return sendError(res, 401, 'Invalid administrator credentials.');
    }
    next(error);
  }
};

export const getAdminMe = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return sendError(res, 403, 'Forbidden. Administrator authorization required.');
    }
    return sendSuccess(res, 200, 'Admin session valid', { user: req.user });
  } catch (error) {
    next(error);
  }
};

export const adminLogout = async (req, res, next) => {
  try {
    res.clearCookie('token', getAuthCookieOptions());
    return sendSuccess(res, 200, 'Admin session terminated.');
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. DASHBOARD METRICS
// ==========================================

export const getDashboardOverview = async (req, res, next) => {
  try {
    const metrics = await InventoryService.getDashboardMetrics();
    return sendSuccess(res, 200, 'Operational metrics retrieved', metrics);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. INVENTORY MANAGEMENT
// ==========================================

export const getInventoryList = async (req, res, next) => {
  try {
    const { category, search, stockStatus, page, limit } = req.query;
    const result = await InventoryService.getInventoryItems({
      category,
      search,
      stockStatus,
      page,
      limit,
    });
    return sendSuccess(res, 200, 'Inventory items retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let item = await InventoryItem.findById(id);
    if (!item) {
      item = await InventoryItem.findOne({ sku: id.toUpperCase() });
    }
    if (!item) {
      return sendError(res, 404, 'Inventory item not found.');
    }
    return sendSuccess(res, 200, 'Inventory item details retrieved', { item });
  } catch (error) {
    next(error);
  }
};

export const createInventoryItem = async (req, res, next) => {
  try {
    const {
      name,
      category,
      sku,
      currentStock = 0,
      lowStockThreshold = 10,
      unit = 'portions',
      description = '',
      isActive = true,
    } = req.body;

    if (!name || !category || !sku) {
      return sendError(res, 400, 'Name, category, and unique SKU are required.');
    }

    const cleanSku = sku.toUpperCase().trim();

    // Check unique SKU
    const existingSku = await InventoryItem.findOne({ sku: cleanSku });
    if (existingSku) {
      return sendError(res, 409, `An inventory item with SKU "${cleanSku}" already exists.`);
    }

    const existingName = await InventoryItem.findOne({ name: name.trim() });
    if (existingName) {
      return sendError(res, 409, `An inventory item with name "${name.trim()}" already exists.`);
    }

    const stockNum = Math.max(0, parseInt(currentStock, 10) || 0);
    const thresholdNum = Math.max(0, parseInt(lowStockThreshold, 10) || 10);

    const newItem = new InventoryItem({
      name: name.trim(),
      category,
      sku: cleanSku,
      currentStock: stockNum,
      lowStockThreshold: thresholdNum,
      unit: unit.trim(),
      description: description.trim(),
      isActive: isActive !== false,
      isSampleData: false,
    });

    await newItem.save();

    // Create initial audit log
    const audit = new StockAdjustment({
      inventoryItemId: newItem.id,
      itemSku: newItem.sku,
      itemName: newItem.name,
      previousQuantity: 0,
      adjustmentAmount: stockNum,
      newQuantity: stockNum,
      reason: 'Created new inventory item',
      adminUserId: req.user?._id || req.user?.id,
      adminName: req.user?.name || 'Administrator',
      type: 'initial_seed',
    });
    await audit.save();

    return sendSuccess(res, 201, 'Inventory item created successfully.', { item: newItem });
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, lowStockThreshold, unit, description, isActive } = req.body;

    let item = await InventoryItem.findById(id);
    if (!item) {
      item = await InventoryItem.findOne({ sku: id.toUpperCase() });
    }
    if (!item) {
      return sendError(res, 404, 'Inventory item not found.');
    }

    if (name) item.name = name.trim();
    if (unit) item.unit = unit.trim();
    if (description !== undefined) item.description = description.trim();
    if (isActive !== undefined) item.isActive = !!isActive;

    if (lowStockThreshold !== undefined) {
      const thresholdNum = parseInt(lowStockThreshold, 10);
      if (isNaN(thresholdNum) || thresholdNum < 0) {
        return sendError(res, 400, 'Low stock threshold must be a non-negative integer.');
      }
      item.lowStockThreshold = thresholdNum;

      // If new threshold is below current stock, reset alertSentForLowStock
      if (item.currentStock > thresholdNum) {
        item.alertSentForLowStock = false;
      }
    }

    await item.save();

    emitStockChange(item);

    return sendSuccess(res, 200, 'Inventory item updated successfully.', { item });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adjustmentAmount, reason } = req.body;

    if (!reason || !reason.trim()) {
      return sendError(res, 400, 'An explicit audit reason is required for stock adjustments.');
    }

    const result = await InventoryService.manualAdjustStock({
      itemId: id,
      adjustmentAmount,
      reason,
      adminUser: req.user,
    });

    if (result?.item) {
      emitStockChange(result.item);
    }

    return sendSuccess(res, 200, 'Stock adjusted successfully.', result);
  } catch (error) {
    if (error.message.includes('rejected') || error.message.includes('negative')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};

export const getAdjustmentLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await InventoryService.getAdjustmentHistory({ limit });
    return sendSuccess(res, 200, 'Stock adjustment audit logs retrieved', { logs });
  } catch (error) {
    next(error);
  }
};

export const getLowStockAlerts = async (req, res, next) => {
  try {
    const alerts = await LowStockAlert.find().sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Low stock alert history retrieved', { alerts });
  } catch (error) {
    next(error);
  }
};

export const triggerManualScan = async (req, res, next) => {
  try {
    const result = await runInventoryLowStockCheck();
    return sendSuccess(res, 200, 'Manual low-stock scan completed', result);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ADMIN ORDER MANAGEMENT
// ==========================================

export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, search, limit = 50 } = req.query;
    let orders = await Order.find().sort({ createdAt: -1 });

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.orderStatus === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.deliveryAddress?.fullName?.toLowerCase().includes(q) ||
          o.deliveryAddress?.phone?.includes(q)
      );
    }

    const paginated = orders.slice(0, Number(limit));

    return sendSuccess(res, 200, 'Admin orders retrieved', {
      orders: paginated.map((o) => (o.toJSON ? o.toJSON() : o)),
      totalCount: orders.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }
    return sendSuccess(res, 200, 'Order details retrieved', { order: order.toJSON ? order.toJSON() : order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return sendError(res, 400, 'Target status is required.');
    }

    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }
    if (!order) {
      return sendError(res, 404, 'Order not found.');
    }

    // SECURITY CHECK: Cannot transition an unpaid order to cooking/delivery/delivered
    if (
      order.paymentStatus !== 'paid' &&
      (status === 'in_kitchen' || status === 'sent_to_delivery' || status === 'delivered')
    ) {
      return sendError(
        res,
        400,
        `Cannot progress order to "${status}" because payment is currently "${order.paymentStatus}". Only verified paid orders can enter the kitchen.`
      );
    }

    // Handle cancellation: restore stock if previously committed
    if (status === 'cancelled') {
      order.transitionOrderStatus(status, reason || 'Cancelled by administrator', 'admin');
      await InventoryService.releaseStockForOrder(order, reason || 'Cancelled by administrator');
      await order.save();

      emitOrderStatusUpdate(order, { reason: reason || 'Cancelled by administrator' });

      return sendSuccess(res, 200, 'Order cancelled and stock restored to inventory.', {
        order: order.toJSON ? order.toJSON() : order,
      });
    }

    // Standard order status transition
    order.transitionOrderStatus(status, reason || `Status updated to ${status} by admin`, 'admin');
    await order.save();

    emitOrderStatusUpdate(order, { reason: reason || `Status updated to ${status} by admin` });

    return sendSuccess(res, 200, `Order status updated to "${status}".`, {
      order: order.toJSON ? order.toJSON() : order,
    });
  } catch (error) {
    if (error.message.includes('Invalid order status transition')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};
