/**
 * PizzaVerse Authoritative Pricing Engine
 * Strictly uses integer paise (1 INR = 100 paise) to prevent floating-point rounding errors.
 */

// Centralized configuration
export const PRICING_CONFIG = {
  BASE_CUSTOM_PIZZA_PAISE: 19900, // ₹199.00
  DELIVERY_FEE_PAISE: 4900,        // ₹49.00
  FREE_DELIVERY_THRESHOLD_PAISE: 50000, // ₹500.00
  TAX_RATE: 0.05,                  // 5% GST
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
};

/**
 * Format paise into a readable INR currency string
 * @param {number} paise 
 * @param {boolean} showDecimals 
 * @returns {string} e.g. "₹299" or "₹299.50"
 */
export const formatINR = (paise = 0, showDecimals = false) => {
  const rupees = paise / 100;
  if (showDecimals || rupees % 1 !== 0) {
    return `₹${rupees.toFixed(2)}`;
  }
  return `₹${rupees.toFixed(0)}`;
};

/**
 * Calculate authoritative unit price in paise for a custom pizza
 * Formula:
 * Unit Price = basePricePaise + crustAdjustmentPaise + sauceAdjustmentPaise + cheeseAdjustmentPaise + sum(veggieAdjustmentsPaise)
 */
export const calculateCustomPizzaUnitPrice = ({
  baseAdjustmentPaise = 0,
  sauceAdjustmentPaise = 0,
  cheeseAdjustmentPaise = 0,
  veggieAdjustmentsPaise = [],
}) => {
  const veggiesSum = (veggieAdjustmentsPaise || []).reduce((acc, p) => acc + (Number(p) || 0), 0);
  
  const unitPrice =
    PRICING_CONFIG.BASE_CUSTOM_PIZZA_PAISE +
    (Number(baseAdjustmentPaise) || 0) +
    (Number(sauceAdjustmentPaise) || 0) +
    (Number(cheeseAdjustmentPaise) || 0) +
    veggiesSum;

  return Math.round(unitPrice);
};

/**
 * Calculate authoritative cart totals in paise
 * @param {Array} items Array of cart items with unitPricePaise and quantity
 */
export const calculateCartTotals = (items = []) => {
  // 1. Calculate subtotal
  const subtotalPaise = items.reduce((sum, item) => {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const unitPrice = Math.max(0, parseInt(item.unitPricePaise, 10) || 0);
    return sum + (unitPrice * qty);
  }, 0);

  // 2. Calculate delivery fee
  let deliveryFeePaise = 0;
  if (subtotalPaise > 0) {
    deliveryFeePaise =
      subtotalPaise >= PRICING_CONFIG.FREE_DELIVERY_THRESHOLD_PAISE
        ? 0
        : PRICING_CONFIG.DELIVERY_FEE_PAISE;
  }

  // 3. Calculate taxes (5% GST)
  const taxPaise = Math.round(subtotalPaise * PRICING_CONFIG.TAX_RATE);

  // 4. Calculate grand total
  const grandTotalPaise = subtotalPaise + deliveryFeePaise + taxPaise;

  // 5. Amount to free delivery
  const amountToFreeDeliveryPaise = Math.max(
    0,
    PRICING_CONFIG.FREE_DELIVERY_THRESHOLD_PAISE - subtotalPaise
  );

  return {
    subtotalPaise,
    deliveryFeePaise,
    taxPaise,
    grandTotalPaise,
    amountToFreeDeliveryPaise,
    isFreeDelivery: deliveryFeePaise === 0 && subtotalPaise > 0,
    formatted: {
      subtotal: formatINR(subtotalPaise),
      deliveryFee: deliveryFeePaise === 0 ? 'FREE' : formatINR(deliveryFeePaise),
      tax: formatINR(taxPaise),
      grandTotal: formatINR(grandTotalPaise),
      amountToFreeDelivery: formatINR(amountToFreeDeliveryPaise),
    },
  };
};
