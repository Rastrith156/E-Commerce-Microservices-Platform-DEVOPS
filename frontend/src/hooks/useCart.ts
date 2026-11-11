import { useState, useCallback } from 'react';
import type { Cart, CartItem } from '../types';
import { api } from '../api';

interface UseCartResult {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  total: number;
  refresh: (userId: string) => Promise<void>;
  addItem: (userId: string, item: CartItem) => Promise<void>;
  updateItem: (userId: string, productId: string, quantity: number) => Promise<void>;
  removeItem: (userId: string, productId: string) => Promise<void>;
  clearCart: (userId: string) => Promise<void>;
}

export function useCart(): UseCartResult {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const total = cart?.items.reduce((sum, item) => sum + item.quantity * 0, 0) ?? 0;

  const refresh = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data: Cart = await api.getCart(userId);
      setCart(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (userId: string, item: CartItem) => {
    setError(null);
    try {
      const data: Cart = await api.addToCart(userId, item);
      setCart(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? 'Failed to add item to cart');
      throw apiError;
    }
  }, []);

  const updateItem = useCallback(async (userId: string, productId: string, quantity: number) => {
    setError(null);
    try {
      const data: Cart = await api.updateCartItem(userId, productId, quantity);
      setCart(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? 'Failed to update cart item');
      throw apiError;
    }
  }, []);

  const removeItem = useCallback(async (userId: string, productId: string) => {
    setError(null);
    try {
      const data: Cart = await api.removeFromCart(userId, productId);
      setCart(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? 'Failed to remove item from cart');
      throw apiError;
    }
  }, []);

  const clearCart = useCallback(async (userId: string) => {
    setError(null);
    try {
      await api.clearCart(userId);
      setCart(null);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? 'Failed to clear cart');
      throw apiError;
    }
  }, []);

  return {
    cart,
    loading,
    error,
    itemCount,
    total,
    refresh,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
}
