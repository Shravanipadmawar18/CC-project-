/**
 * ===========================================
 * CART CONTEXT
 * ===========================================
 * 
 * Manages shopping cart state globally.
 * Syncs with backend cart for logged-in users.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Create context
const CartContext = createContext(null);

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    totalItems: 0,
    total: 0,
    couponCode: null,
    couponDiscount: 0
  });
  const [loading, setLoading] = useState(false);

  // Fetch cart from server
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({
        items: [],
        subtotal: 0,
        totalItems: 0,
        total: 0,
        couponCode: null,
        couponDiscount: 0
      });
      return;
    }

    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.data.data.cart);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch cart when auth state changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = useCallback(async (productId, quantity = 1, attributes = {}) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return { success: false };
    }

    try {
      setLoading(true);
      // Pass productId and quantity as separate arguments
      const response = await cartService.addToCart(productId, quantity);
      setCart(response.data.data.cart);
      toast.success('Added to cart');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to add to cart';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      setLoading(true);
      const response = await cartService.updateCartItem(productId, quantity);
      setCart(response.data.data.cart);
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to update cart';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      setLoading(true);
      const response = await cartService.removeFromCart(productId);
      setCart(response.data.data.cart);
      toast.success('Item removed from cart');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to remove item';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartService.clearCart();
      setCart(response.data.data.cart);
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to clear cart';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply coupon
  const applyCoupon = useCallback(async (code) => {
    try {
      setLoading(true);
      const response = await cartService.applyCoupon(code);
      setCart(prev => ({
        ...prev,
        couponCode: response.data.data.couponCode,
        couponDiscount: response.data.data.discount,
        total: prev.subtotal - response.data.data.discount
      }));
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.message || 'Invalid coupon code';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove coupon
  const removeCoupon = useCallback(async () => {
    try {
      setLoading(true);
      await cartService.removeCoupon();
      setCart(prev => ({
        ...prev,
        couponCode: null,
        couponDiscount: 0,
        total: prev.subtotal
      }));
      toast.success('Coupon removed');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to remove coupon';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if product is in cart
  const isInCart = useCallback((productId) => {
    return cart.items.some(item => item.product?._id === productId);
  }, [cart.items]);

  // Get item quantity in cart
  const getItemQuantity = useCallback((productId) => {
    const item = cart.items.find(item => item.product?._id === productId);
    return item ? item.quantity : 0;
  }, [cart.items]);

  // Context value
  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    isInCart,
    getItemQuantity,
    fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
