import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import pizzaService from '../services/pizza.service';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartToken, setCartToken] = useState(() => localStorage.getItem('pizzaverse_cart_token') || null);

  // Refresh cart from backend
  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pizzaService.getCart(cartToken);
      if (res?.data) {
        setCart(res.data);
        if (res.data.cartToken && res.data.cartToken !== cartToken) {
          setCartToken(res.data.cartToken);
          localStorage.setItem('pizzaverse_cart_token', res.data.cartToken);
        }
      }
    } catch (error) {
      console.warn('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  }, [cartToken]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add catalog or custom pizza to cart
  const addToCart = async (itemData) => {
    try {
      const res = await pizzaService.addToCart(itemData, cartToken);
      if (res?.data) {
        setCart(res.data);
        if (res.data.cartToken) {
          setCartToken(res.data.cartToken);
          localStorage.setItem('pizzaverse_cart_token', res.data.cartToken);
        }
      }
      toast.success('Added to your order! 🍕');
      setIsDrawerOpen(true); // Open drawer for instant feedback
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add item to cart';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }
    try {
      const res = await pizzaService.updateQuantity(itemId, quantity, cartToken);
      if (res?.data) {
        setCart(res.data);
      }
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
      return { success: false };
    }
  };

  // Edit custom pizza
  const editCustomPizza = async (itemId, customPizza) => {
    try {
      const res = await pizzaService.updateCustomPizza(itemId, customPizza, cartToken);
      if (res?.data) {
        setCart(res.data);
      }
      toast.success('Custom pizza updated!');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update custom pizza';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Remove item
  const removeFromCart = async (itemId) => {
    try {
      const res = await pizzaService.removeFromCart(itemId, cartToken);
      if (res?.data) {
        setCart(res.data);
      }
      toast.success('Item removed from order');
      return { success: true };
    } catch (error) {
      toast.error('Failed to remove item');
      return { success: false };
    }
  };

  // Clear all items
  const clearCart = async () => {
    try {
      const res = await pizzaService.clearCart(cartToken);
      if (res?.data) {
        setCart(res.data);
      }
      toast.success('Cart cleared');
      return { success: true };
    } catch (error) {
      toast.error('Failed to clear cart');
      return { success: false };
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const value = {
    cart,
    loading,
    itemsCount: cart?.itemsCount || 0,
    items: cart?.items || [],
    pricing: cart?.pricing || null,
    hasUnavailableItems: cart?.hasUnavailableItems || false,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    addToCart,
    updateQuantity,
    editCustomPizza,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
