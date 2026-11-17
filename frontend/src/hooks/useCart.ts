import { useState, useCallback } from 'react';
import type { Cart, CartItem } from '../types';
import { api } from '../api';

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return fallback;
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 404
  );
}

interface UseCartResult {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  refresh: (userId: string) => Promise<void>;
  addItem: (userId: string, item: CartItem) => Promise<boolean>;
  updateItem: (userId: string, productId: string, quantity: number) => Promise<boolean>;
  removeItem: (userId: string, productId: string) => Promise<boolean>;
  clearCart: (userId: string) => Promise<boolean>;
}

export function useCart(): UseCartResult {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const refresh = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data: Cart = await api.getCart(userId);
      setCart(data);
    } catch (err) {
      if (isNotFound(err)) {
        setCart({ userId, items: [], updatedAt: new Date().toISOString() });
        return;
      }
      setError(getErrorMessage(err, 'Failed to load cart'));
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (userId: string, item: CartItem): Promise<boolean> => {
    setError(null);
    try {
      const data: Cart = await api.addToCart(userId, item);
      setCart(data);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add item to cart'));
      return false;
    }
  }, []);

  const updateItem = useCallback(async (
    userId: string,
    productId: string,
    quantity: number
  ): Promise<boolean> => {
    setError(null);
    try {
      const data: Cart = await api.updateCartItem(userId, productId, quantity);
      setCart(data);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update cart item'));
      return false;
    }
  }, []);

  const removeItem = useCallback(async (
    userId: string,
    productId: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const data: Cart = await api.removeFromCart(userId, productId);
      setCart(data);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove item from cart'));
      return false;
    }
  }, []);

  const clearCart = useCallback(async (userId: string): Promise<boolean> => {
    setError(null);
    try {
      await api.clearCart(userId);
      setCart({ userId, items: [], updatedAt: new Date().toISOString() });
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to clear cart'));
      return false;
    }
  }, []);

  return {
    cart,
    loading,
    error,
    itemCount,
    refresh,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
}
