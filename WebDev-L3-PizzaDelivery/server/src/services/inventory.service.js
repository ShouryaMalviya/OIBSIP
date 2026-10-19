/**
 * PizzaVerse Inventory Preparation Service (Part 3 Foundation for Part 4)
 * 
 * Rules:
 * 1. Reserve on Order Creation: When an order is placed in awaiting_payment, items are reserved.
 * 2. Commit on Verified Payment: Once payment signature is verified, stock is committed permanently.
 * 3. Release on Cancellation/Expiry: If an order fails payment or is cancelled, stock is restored.
 * 4. Idempotency: Protects against double-decrementing or double-restoring via order.inventoryStatus.
 */

// In-memory inventory tracking registry for active pizzas and ingredients
// Initialized with realistic artisanal pizzeria batch quantities (units)
const stockLedger = new Map();

// Helper to get or initialize default stock
const getStockEntry = (itemId, defaultStock = 100) => {
  const key = itemId.toString();
  if (!stockLedger.has(key)) {
    stockLedger.set(key, {
      available: defaultStock,
      reserved: 0,
      committed: 0,
      total: defaultStock,
    });
  }
  return stockLedger.get(key);
};

export const InventoryService = {
  /**
   * Check if requested quantity is available
   */
  hasStock(itemId, quantity = 1, defaultStock = 100) {
    const entry = getStockEntry(itemId, defaultStock);
    return entry.available >= quantity;
  },

  /**
   * Get current stock metrics for an item
   */
  getStock(itemId) {
    const entry = getStockEntry(itemId);
    return { ...entry };
  },

  /**
   * Set explicit stock for an item (Admin / Seeder)
   */
  setStock(itemId, total) {
    const key = itemId.toString();
    stockLedger.set(key, {
      available: total,
      reserved: 0,
      committed: 0,
      total,
    });
  },

  /**
   * Reserve inventory when order is created (awaiting_payment)
   * Atomic check-and-reserve prevents overselling.
   */
  async reserveStockForOrder(order) {
    if (order.inventoryStatus === 'reserved' || order.inventoryStatus === 'committed') {
      return { success: true, message: 'Stock already reserved/committed' };
    }

    // Step 1: Verification pass to ensure ALL items have enough stock
    for (const item of order.items) {
      const targetId = item.pizzaId || item.id || item._id;
      const qty = item.quantity;
      const entry = getStockEntry(targetId);

      if (entry.available < qty) {
        throw new Error(
          `[INSUFFICIENT_STOCK] Item "${item.name}" has only ${entry.available} remaining (requested ${qty})`
        );
      }
    }

    // Step 2: Atomic reservation decrement
    for (const item of order.items) {
      const targetId = item.pizzaId || item.id || item._id;
      const qty = item.quantity;
      const entry = getStockEntry(targetId);
      entry.available -= qty;
      entry.reserved += qty;
    }

    order.inventoryStatus = 'reserved';
    return { success: true, message: 'Stock reserved successfully' };
  },

  /**
   * Commit inventory upon verified payment confirmation
   * Strictly idempotent: will not decrement multiple times for the same order.
   */
  async commitStockForOrder(order) {
    if (order.inventoryStatus === 'committed') {
      return { success: true, message: 'Stock was already committed' };
    }

    for (const item of order.items) {
      const targetId = item.pizzaId || item.id || item._id;
      const qty = item.quantity;
      const entry = getStockEntry(targetId);

      if (order.inventoryStatus === 'reserved') {
        // Move from reserved to committed
        entry.reserved = Math.max(0, entry.reserved - qty);
        entry.committed += qty;
      } else {
        // Direct commit if reservation was bypassed
        entry.available = Math.max(0, entry.available - qty);
        entry.committed += qty;
      }
    }

    order.inventoryStatus = 'committed';
    return { success: true, message: 'Stock committed successfully' };
  },

  /**
   * Release reserved or committed stock back to available pool
   * Triggers when payment fails, expires, or order is cancelled.
   */
  async releaseStockForOrder(order, reason = 'Order cancelled') {
    if (order.inventoryStatus === 'released' || order.inventoryStatus === 'none') {
      return { success: true, message: 'No stock to release' };
    }

    for (const item of order.items) {
      const targetId = item.pizzaId || item.id || item._id;
      const qty = item.quantity;
      const entry = getStockEntry(targetId);

      if (order.inventoryStatus === 'reserved') {
        entry.reserved = Math.max(0, entry.reserved - qty);
        entry.available += qty;
      } else if (order.inventoryStatus === 'committed') {
        entry.committed = Math.max(0, entry.committed - qty);
        entry.available += qty;
      }
    }

    order.inventoryStatus = 'released';
    return { success: true, message: `Stock restored to inventory: ${reason}` };
  },
};

export default InventoryService;
