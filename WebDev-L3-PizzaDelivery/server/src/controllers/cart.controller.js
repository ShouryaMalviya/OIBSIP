import crypto from 'crypto';
import { Cart } from '../models/Cart.js';
import { Pizza } from '../models/Pizza.js';
import { Ingredient } from '../models/Ingredient.js';
import {
  calculateCustomPizzaUnitPrice,
  calculateCartTotals,
  formatINR,
  PRICING_CONFIG,
} from '../utils/pricing.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Retrieve or initialize a cart associated with the authenticated user or guest token
 */
const getOrCreateCart = async (req, res) => {
  const userId = req.user?.id || null;
  let cartToken = req.headers['x-cart-token'] || req.cookies?.cartToken || null;

  let cart = null;

  if (userId) {
    cart = await Cart.findOne({ userId });
    // If user has a guest cartToken, optionally merge guest cart
    if (!cart && cartToken) {
      cart = await Cart.findOne({ cartToken });
      if (cart) {
        cart.userId = userId;
        await cart.save();
      }
    }
  } else if (cartToken) {
    cart = await Cart.findOne({ cartToken });
  }

  if (!cart) {
    if (!cartToken) {
      cartToken = `guest_${crypto.randomUUID()}`;
      res.cookie('cartToken', cartToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Accessible to client for localStorage sync
        sameSite: 'lax',
      });
    }
    cart = new Cart({
      userId,
      cartToken,
      items: [],
    });
    await cart.save();
  }

  return { cart, cartToken };
};

/**
 * Hydrate cart items with current database information and compute authoritative totals
 */
const hydrateAndPriceCart = async (cart) => {
  const hydratedItems = [];
  let hasStaleOrUnavailable = false;

  for (const item of cart.items) {
    if (item.itemType === 'catalog') {
      const pizza = await Pizza.findById(item.pizzaId);
      if (!pizza) {
        hasStaleOrUnavailable = true;
        continue; // Skip or remove deleted pizzas
      }

      const isItemAvailable = pizza.isAvailable;
      if (!isItemAvailable) hasStaleOrUnavailable = true;

      // Ensure authoritative price
      item.unitPricePaise = pizza.basePricePaise;
      item.totalPricePaise = item.unitPricePaise * item.quantity;

      hydratedItems.push({
        id: item._id?.toString() || item.id,
        itemType: 'catalog',
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
        totalPricePaise: item.totalPricePaise,
        unitPriceFormatted: formatINR(item.unitPricePaise),
        totalPriceFormatted: formatINR(item.totalPricePaise),
        isAvailable: isItemAvailable,
        pizza: {
          id: pizza.id,
          name: pizza.name,
          description: pizza.description,
          imageUrl: pizza.imageUrl,
          category: pizza.category,
          isVegetarian: pizza.isVegetarian,
          isSpicy: pizza.isSpicy,
          isAvailable: pizza.isAvailable,
        },
      });
    } else if (item.itemType === 'custom') {
      const { baseId, sauceId, cheeseId, veggieIds = [], name } = item.customPizza || {};

      const base = baseId ? await Ingredient.findById(baseId) : null;
      const sauce = sauceId ? await Ingredient.findById(sauceId) : null;
      const cheese = cheeseId ? await Ingredient.findById(cheeseId) : null;

      const veggies = [];
      for (const vid of veggieIds) {
        const v = await Ingredient.findById(vid);
        if (v) veggies.push(v);
      }

      const allFound = base && sauce && cheese && veggies.length === (veggieIds?.length || 0);
      const isItemAvailable =
        allFound &&
        base.isAvailable &&
        sauce.isAvailable &&
        cheese.isAvailable &&
        veggies.every((v) => v.isAvailable);

      if (!isItemAvailable) hasStaleOrUnavailable = true;

      // Calculate authoritative custom price
      item.unitPricePaise = calculateCustomPizzaUnitPrice({
        baseAdjustmentPaise: base?.priceAdjustmentPaise || 0,
        sauceAdjustmentPaise: sauce?.priceAdjustmentPaise || 0,
        cheeseAdjustmentPaise: cheese?.priceAdjustmentPaise || 0,
        veggieAdjustmentsPaise: veggies.map((v) => v.priceAdjustmentPaise),
      });
      item.totalPricePaise = item.unitPricePaise * item.quantity;

      hydratedItems.push({
        id: item._id?.toString() || item.id,
        itemType: 'custom',
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
        totalPricePaise: item.totalPricePaise,
        unitPriceFormatted: formatINR(item.unitPricePaise),
        totalPriceFormatted: formatINR(item.totalPricePaise),
        isAvailable: isItemAvailable,
        customPizza: {
          name: name || 'Custom Artisanal Pizza',
          base: base ? { id: base.id, name: base.name, priceAdjustmentPaise: base.priceAdjustmentPaise } : null,
          sauce: sauce ? { id: sauce.id, name: sauce.name, priceAdjustmentPaise: sauce.priceAdjustmentPaise } : null,
          cheese: cheese ? { id: cheese.id, name: cheese.name, priceAdjustmentPaise: cheese.priceAdjustmentPaise } : null,
          veggies: veggies.map((v) => ({ id: v.id, name: v.name, priceAdjustmentPaise: v.priceAdjustmentPaise })),
        },
      });
    }
  }

  // Calculate authoritative totals
  const pricing = calculateCartTotals(hydratedItems.filter((i) => i.isAvailable));

  return {
    cartId: cart.id,
    items: hydratedItems,
    itemsCount: hydratedItems.reduce((acc, i) => acc + i.quantity, 0),
    hasUnavailableItems: hydratedItems.some((i) => !i.isAvailable),
    pricing,
  };
};

/**
 * Get current cart
 */
export const getCart = async (req, res, next) => {
  try {
    const { cart, cartToken } = await getOrCreateCart(req, res);
    const hydrated = await hydrateAndPriceCart(cart);

    return sendSuccess(res, 200, 'Cart retrieved', {
      ...hydrated,
      cartToken: cart.cartToken || cartToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an item (catalog pizza or custom pizza) to cart
 */
export const addItemToCart = async (req, res, next) => {
  try {
    const { itemType, pizzaId, customPizza, quantity = 1 } = req.body;
    const qty = Math.max(1, Math.min(20, parseInt(quantity, 10) || 1));

    const { cart } = await getOrCreateCart(req, res);

    if (itemType === 'catalog') {
      if (!pizzaId) {
        return sendError(res, 400, 'pizzaId is required for catalog items');
      }

      const pizza = await Pizza.findById(pizzaId);
      if (!pizza) {
        return sendError(res, 404, 'Pizza not found in catalog');
      }
      if (!pizza.isAvailable) {
        return sendError(res, 400, `"${pizza.name}" is currently out of stock`);
      }

      // Check if identical pizza is already in cart
      const existing = cart.items.find(
        (i) => i.itemType === 'catalog' && (i.pizzaId?.toString() === pizzaId || i.pizzaId === pizzaId)
      );

      if (existing) {
        existing.quantity = Math.min(20, existing.quantity + qty);
        existing.unitPricePaise = pizza.basePricePaise;
        existing.totalPricePaise = existing.unitPricePaise * existing.quantity;
      } else {
        const newItemId = `item_${crypto.randomUUID().slice(0, 8)}`;
        cart.items.push({
          _id: newItemId,
          id: newItemId,
          itemType: 'catalog',
          pizzaId,
          quantity: qty,
          unitPricePaise: pizza.basePricePaise,
          totalPricePaise: pizza.basePricePaise * qty,
        });
      }
    } else if (itemType === 'custom') {
      const { baseId, sauceId, cheeseId, veggieIds = [], name } = customPizza || {};

      if (!baseId || !sauceId || !cheeseId) {
        return sendError(res, 400, 'Custom pizza requires a base, a sauce, and a cheese selection');
      }

      const base = await Ingredient.findById(baseId);
      const sauce = await Ingredient.findById(sauceId);
      const cheese = await Ingredient.findById(cheeseId);

      if (!base || !base.isAvailable) return sendError(res, 400, 'Selected crust is unavailable');
      if (!sauce || !sauce.isAvailable) return sendError(res, 400, 'Selected sauce is unavailable');
      if (!cheese || !cheese.isAvailable) return sendError(res, 400, 'Selected cheese is unavailable');

      const veggies = [];
      for (const vid of veggieIds) {
        const v = await Ingredient.findById(vid);
        if (!v || !v.isAvailable) {
          return sendError(res, 400, `Selected vegetable is unavailable: ${v?.name || vid}`);
        }
        veggies.push(v);
      }

      // Calculate authoritative unit price
      const unitPricePaise = calculateCustomPizzaUnitPrice({
        baseAdjustmentPaise: base.priceAdjustmentPaise,
        sauceAdjustmentPaise: sauce.priceAdjustmentPaise,
        cheeseAdjustmentPaise: cheese.priceAdjustmentPaise,
        veggieAdjustmentsPaise: veggies.map((v) => v.priceAdjustmentPaise),
      });

      const newItemId = `item_${crypto.randomUUID().slice(0, 8)}`;
      cart.items.push({
        _id: newItemId,
        id: newItemId,
        itemType: 'custom',
        customPizza: {
          name: name || 'Custom Artisanal Pizza',
          baseId,
          sauceId,
          cheeseId,
          veggieIds,
        },
        quantity: qty,
        unitPricePaise,
        totalPricePaise: unitPricePaise * qty,
      });
    } else {
      return sendError(res, 400, 'Invalid itemType. Must be "catalog" or "custom"');
    }

    await cart.save();
    const hydrated = await hydrateAndPriceCart(cart);

    return sendSuccess(res, 201, 'Item added to cart', hydrated);
  } catch (error) {
    next(error);
  }
};

/**
 * Update quantity of a cart item
 */
export const updateItemQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const newQty = parseInt(quantity, 10);
    if (isNaN(newQty) || newQty < 1 || newQty > 20) {
      return sendError(res, 400, 'Quantity must be an integer between 1 and 20');
    }

    const { cart } = await getOrCreateCart(req, res);
    const item = cart.items.find(
      (i) => i._id?.toString() === itemId || i.id === itemId
    );

    if (!item) {
      return sendError(res, 404, 'Cart item not found');
    }

    item.quantity = newQty;
    item.totalPricePaise = item.unitPricePaise * newQty;
    await cart.save();

    const hydrated = await hydrateAndPriceCart(cart);
    return sendSuccess(res, 200, 'Cart item quantity updated', hydrated);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from cart
 */
export const removeItemFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { cart } = await getOrCreateCart(req, res);

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (i) => (i._id?.toString() !== itemId && i.id !== itemId)
    );

    if (cart.items.length === initialLength) {
      return sendError(res, 404, 'Cart item not found');
    }

    await cart.save();
    const hydrated = await hydrateAndPriceCart(cart);
    return sendSuccess(res, 200, 'Item removed from cart', hydrated);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit an existing custom pizza in the cart
 */
export const updateCustomPizzaItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { customPizza } = req.body;
    const { baseId, sauceId, cheeseId, veggieIds = [], name } = customPizza || {};

    const { cart } = await getOrCreateCart(req, res);
    const item = cart.items.find(
      (i) => i._id?.toString() === itemId || i.id === itemId
    );

    if (!item || item.itemType !== 'custom') {
      return sendError(res, 404, 'Custom cart item not found');
    }

    const base = await Ingredient.findById(baseId);
    const sauce = await Ingredient.findById(sauceId);
    const cheese = await Ingredient.findById(cheeseId);

    if (!base || !base.isAvailable) return sendError(res, 400, 'Selected crust is unavailable');
    if (!sauce || !sauce.isAvailable) return sendError(res, 400, 'Selected sauce is unavailable');
    if (!cheese || !cheese.isAvailable) return sendError(res, 400, 'Selected cheese is unavailable');

    const veggies = [];
    for (const vid of veggieIds) {
      const v = await Ingredient.findById(vid);
      if (!v || !v.isAvailable) {
        return sendError(res, 400, `Selected vegetable is unavailable: ${v?.name || vid}`);
      }
      veggies.push(v);
    }

    // Authoritative recalculated unit price
    const unitPricePaise = calculateCustomPizzaUnitPrice({
      baseAdjustmentPaise: base.priceAdjustmentPaise,
      sauceAdjustmentPaise: sauce.priceAdjustmentPaise,
      cheeseAdjustmentPaise: cheese.priceAdjustmentPaise,
      veggieAdjustmentsPaise: veggies.map((v) => v.priceAdjustmentPaise),
    });

    item.customPizza = {
      name: name || item.customPizza?.name || 'Custom Artisanal Pizza',
      baseId,
      sauceId,
      cheeseId,
      veggieIds,
    };
    item.unitPricePaise = unitPricePaise;
    item.totalPricePaise = unitPricePaise * item.quantity;

    await cart.save();
    const hydrated = await hydrateAndPriceCart(cart);

    return sendSuccess(res, 200, 'Custom pizza updated successfully', hydrated);
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all items from cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const { cart } = await getOrCreateCart(req, res);
    cart.items = [];
    await cart.save();

    const hydrated = await hydrateAndPriceCart(cart);
    return sendSuccess(res, 200, 'Cart emptied', hydrated);
  } catch (error) {
    next(error);
  }
};
