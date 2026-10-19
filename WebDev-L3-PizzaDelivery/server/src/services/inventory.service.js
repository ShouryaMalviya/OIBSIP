import { InventoryItem } from '../models/InventoryItem.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { Order } from '../models/Order.js';

// Standard Recipe mapping for catalog pizzas to constituent inventory items
const CATALOG_RECIPES = {
  'Margherita Classica': [
    { name: 'Hand-Tossed Base', qty: 1 },
    { name: 'Classic Tomato Sauce', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
  ],
  'Farmhouse Rustic Harvest': [
    { name: 'Hand-Tossed Base', qty: 1 },
    { name: 'Classic Tomato Sauce', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
    { name: 'Capsicum', qty: 1 },
    { name: 'Mushroom', qty: 1 },
    { name: 'Sweet Corn', qty: 1 },
    { name: 'Roma Tomatoes', qty: 1 },
  ],
  'Spicy Paneer Tikka Feast': [
    { name: 'Hand-Tossed Base', qty: 1 },
    { name: 'Spicy Marinara', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
    { name: 'Onion', qty: 1 },
    { name: 'Jalapeños', qty: 1 },
  ],
  'Garden Delight Symphony': [
    { name: 'Hand-Tossed Base', qty: 1 },
    { name: 'Classic Tomato Sauce', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
    { name: 'Sweet Corn', qty: 1 },
    { name: 'Capsicum', qty: 1 },
    { name: 'Kalamata Black Olives', qty: 1 },
    { name: 'Roma Tomatoes', qty: 1 },
  ],
  'Four Cheese Al Forno': [
    { name: 'Hand-Tossed Base', qty: 1 },
    { name: 'Classic Tomato Sauce', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
    { name: 'Cheddar', qty: 1 },
    { name: 'Parmigiano Reggiano DOP', qty: 1 },
  ],
  'Mediterranean Veg Sun-Blush': [
    { name: 'Classic Thin Crust', qty: 1 },
    { name: 'Pesto Sauce', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
    { name: 'Kalamata Black Olives', qty: 1 },
    { name: 'Baby Spinach', qty: 1 },
  ],
  'Truffle Mushroom Melt': [
    { name: 'Classic Thin Crust', qty: 1 },
    { name: 'Creamy Alfredo White', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
    { name: 'Mushroom', qty: 1 },
  ],
  'Artisanal Pesto Burrata Rustica': [
    { name: 'Hand-Tossed Base', qty: 1 },
    { name: 'Pesto Sauce', qty: 1 },
    { name: 'Mozzarella', qty: 1 },
    { name: 'Baby Spinach', qty: 1 },
  ],
};

/**
 * Resolve inventory item by name (fuzzy / prefix match)
 */
async function findInventoryItemByName(name) {
  if (!name) return null;
  const cleanName = name.trim();
  let item = await InventoryItem.findOne({ name: cleanName });
  if (item) return item;

  // Fallback match by keyword (e.g. "Mozzarella" matches "Fresh Fior di Latte Mozzarella")
  const all = await InventoryItem.find();
  const firstWord = cleanName.split(' ')[0].toLowerCase();
  return (
    all.find(
      (i) =>
        i.name.toLowerCase().includes(cleanName.toLowerCase()) ||
        cleanName.toLowerCase().includes(i.name.toLowerCase()) ||
        i.name.toLowerCase().includes(firstWord)
    ) || null
  );
}

/**
 * Compute the list of required inventory items & quantities for an order
 */
async function resolveOrderRecipeRequirements(order) {
  const requirements = new Map(); // inventoryItem -> totalQuantity

  const addReq = (invItem, qty) => {
    if (!invItem) return;
    const current = requirements.get(invItem) || 0;
    requirements.set(invItem, current + qty);
  };

  for (const item of order.items) {
    const orderQty = item.quantity || 1;

    if (item.itemType === 'catalog') {
      const recipe = CATALOG_RECIPES[item.name] || [
        { name: 'Hand-Tossed Base', qty: 1 },
        { name: 'Classic Tomato Sauce', qty: 1 },
        { name: 'Mozzarella', qty: 1 },
      ];

      for (const ingredientReq of recipe) {
        const invItem = await findInventoryItemByName(ingredientReq.name);
        if (invItem) {
          addReq(invItem, ingredientReq.qty * orderQty);
        }
      }
    } else if (item.itemType === 'custom') {
      const { base, sauce, cheese, veggies = [] } = item.customPizza || {};

      if (base?.name) {
        const invItem = await findInventoryItemByName(base.name);
        if (invItem) addReq(invItem, 1 * orderQty);
      }
      if (sauce?.name) {
        const invItem = await findInventoryItemByName(sauce.name);
        if (invItem) addReq(invItem, 1 * orderQty);
      }
      if (cheese?.name) {
        const invItem = await findInventoryItemByName(cheese.name);
        if (invItem) addReq(invItem, 1 * orderQty);
      }
      for (const veg of veggies) {
        if (veg?.name) {
          const invItem = await findInventoryItemByName(veg.name);
          if (invItem) addReq(invItem, 1 * orderQty);
        }
      }
    }
  }

  return requirements;
}

export const InventoryService = {
  /**
   * Check if requested item has stock
   */
  async hasStock(itemId, quantity = 1) {
    let item = await InventoryItem.findById(itemId);
    if (!item) {
      item = await InventoryItem.findOne({ sku: itemId });
    }
    if (!item) return true; // If not tracked in inventory, default available
    return item.isActive && item.currentStock >= quantity;
  },

  /**
   * Reserve inventory when order is placed (awaiting_payment)
   */
  async reserveStockForOrder(order) {
    if (order.inventoryStatus === 'reserved' || order.inventoryStatus === 'committed') {
      return { success: true, message: 'Stock already reserved/committed' };
    }

    const requirements = await resolveOrderRecipeRequirements(order);

    // Check pass: ensure all items have enough currentStock
    for (const [invItem, qty] of requirements.entries()) {
      if (invItem.currentStock < qty) {
        throw new Error(
          `[INSUFFICIENT_STOCK] Ingredient "${invItem.name}" has only ${invItem.currentStock} remaining (needs ${qty}).`
        );
      }
    }

    order.inventoryStatus = 'reserved';
    return { success: true, message: 'Stock successfully reserved' };
  },

  /**
   * Commit inventory upon verified payment confirmation
   * Strictly idempotent: will not deduct multiple times for the same order.
   */
  async commitStockForOrder(order) {
    if (order.inventoryStatus === 'committed') {
      return { success: true, message: 'Stock was already committed (idempotent skip)' };
    }

    const requirements = await resolveOrderRecipeRequirements(order);

    for (const [invItem, qty] of requirements.entries()) {
      const prevQty = invItem.currentStock;
      const newQty = Math.max(0, prevQty - qty);
      invItem.currentStock = newQty;
      await invItem.save();

      // Traceable audit adjustment
      const audit = new StockAdjustment({
        inventoryItemId: invItem.id,
        itemSku: invItem.sku,
        itemName: invItem.name,
        previousQuantity: prevQty,
        adjustmentAmount: -qty,
        newQuantity: newQty,
        reason: `Order payment confirmed: ${order.orderNumber}`,
        adminName: 'Automated Checkout Engine',
        type: 'order_deduction',
        relatedOrderId: order.orderNumber,
      });
      await audit.save();
    }

    order.inventoryStatus = 'committed';
    return { success: true, message: 'Stock committed and audit logged' };
  },

  /**
   * Release and restore stock back to available pool
   */
  async releaseStockForOrder(order, reason = 'Order cancelled') {
    if (order.inventoryStatus === 'released' || order.inventoryStatus === 'none') {
      return { success: true, message: 'No stock to release' };
    }

    // Only restore if it was previously committed
    if (order.inventoryStatus === 'committed') {
      const requirements = await resolveOrderRecipeRequirements(order);

      for (const [invItem, qty] of requirements.entries()) {
        const prevQty = invItem.currentStock;
        const newQty = prevQty + qty;
        invItem.currentStock = newQty;
        // If restored above threshold, allow alert to be re-sent next time it falls
        if (newQty > invItem.lowStockThreshold) {
          invItem.alertSentForLowStock = false;
        }
        await invItem.save();

        const audit = new StockAdjustment({
          inventoryItemId: invItem.id,
          itemSku: invItem.sku,
          itemName: invItem.name,
          previousQuantity: prevQty,
          adjustmentAmount: qty,
          newQuantity: newQty,
          reason: `Restoration: ${reason} (${order.orderNumber})`,
          adminName: 'System / Customer Action',
          type: 'cancellation_restock',
          relatedOrderId: order.orderNumber,
        });
        await audit.save();
      }
    }

    order.inventoryStatus = 'released';
    return { success: true, message: `Stock restored to inventory: ${reason}` };
  },

  /**
   * Manual inventory adjustment with audit trail and negative stock prevention
   */
  async manualAdjustStock({ itemId, adjustmentAmount, reason, adminUser }) {
    if (!reason || !reason.trim()) {
      throw new Error('An explicit reason is required for every inventory adjustment.');
    }

    const amount = parseInt(adjustmentAmount, 10);
    if (isNaN(amount) || amount === 0) {
      throw new Error('Adjustment amount must be a non-zero integer.');
    }

    let item = await InventoryItem.findById(itemId);
    if (!item) {
      item = await InventoryItem.findOne({ sku: itemId });
    }
    if (!item) {
      throw new Error('Inventory item not found.');
    }

    const prevQty = item.currentStock;
    const newQty = prevQty + amount;

    if (newQty < 0) {
      throw new Error(
        `Adjustment rejected: Resulting quantity cannot be negative (current: ${prevQty}, requested change: ${amount}).`
      );
    }

    item.currentStock = newQty;
    // If replenished above threshold, reset deduplication trigger
    if (newQty > item.lowStockThreshold) {
      item.alertSentForLowStock = false;
    }
    await item.save();

    // Create traceable audit record
    const audit = new StockAdjustment({
      inventoryItemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      previousQuantity: prevQty,
      adjustmentAmount: amount,
      newQuantity: newQty,
      reason: reason.trim(),
      adminUserId: adminUser?._id || adminUser?.id || null,
      adminName: adminUser?.name || 'Administrator',
      type: 'manual_adjustment',
    });
    await audit.save();

    return { item: item.toJSON ? item.toJSON() : item, audit: audit.toJSON ? audit.toJSON() : audit };
  },

  /**
   * Retrieve inventory items with search, filter, and pagination
   */
  async getInventoryItems({ category, search, stockStatus, page = 1, limit = 50 }) {
    let items = await InventoryItem.find();

    if (category && category !== 'all') {
      items = items.filter((i) => i.category === category);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      );
    }

    if (stockStatus) {
      if (stockStatus === 'low') {
        items = items.filter((i) => i.currentStock <= i.lowStockThreshold && i.currentStock > 0);
      } else if (stockStatus === 'out') {
        items = items.filter((i) => i.currentStock === 0);
      } else if (stockStatus === 'healthy') {
        items = items.filter((i) => i.currentStock > i.lowStockThreshold);
      }
    }

    const totalCount = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return {
      items: paginated.map((i) => (i.toJSON ? i.toJSON() : i)),
      pagination: {
        totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },

  /**
   * Retrieve stock adjustment history
   */
  async getAdjustmentHistory({ limit = 50 }) {
    const list = await StockAdjustment.find().sort({ createdAt: -1 });
    return list.slice(0, limit).map((a) => (a.toJSON ? a.toJSON() : a));
  },

  /**
   * Calculate live operational dashboard metrics directly from real records
   */
  async getDashboardMetrics() {
    const items = await InventoryItem.find();
    const activeItems = items.filter((i) => i.isActive);

    const totalActiveItems = activeItems.length;
    const lowStockCount = activeItems.filter(
      (i) => i.currentStock <= i.lowStockThreshold && i.currentStock > 0
    ).length;
    const outOfStockCount = activeItems.filter((i) => i.currentStock === 0).length;

    const allOrders = await Order.find().sort({ createdAt: -1 });

    const pendingOrdersCount = allOrders.filter(
      (o) => o.orderStatus === 'awaiting_payment'
    ).length;
    const inKitchenCount = allOrders.filter((o) => o.orderStatus === 'in_kitchen').length;
    const sentToDeliveryCount = allOrders.filter(
      (o) => o.orderStatus === 'sent_to_delivery'
    ).length;
    const receivedCount = allOrders.filter((o) => o.orderStatus === 'received').length;

    const totalRevenuePaise = allOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0);

    const recentOrders = allOrders.slice(0, 8).map((o) => (o.toJSON ? o.toJSON() : o));

    return {
      inventory: {
        totalActiveItems,
        lowStockCount,
        outOfStockCount,
      },
      orders: {
        pendingOrdersCount,
        receivedCount,
        inKitchenCount,
        sentToDeliveryCount,
        totalOrdersCount: allOrders.length,
      },
      financial: {
        totalRevenuePaise,
        totalRevenueFormatted: `₹${(totalRevenuePaise / 100).toLocaleString('en-IN')}`,
      },
      recentOrders,
    };
  },
};

export default InventoryService;
