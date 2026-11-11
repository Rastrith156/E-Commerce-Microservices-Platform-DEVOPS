import { useState, useCallback } from 'react';
import type { Order, CreateOrderRequest } from '../types';
import { api } from '../api';

interface UseOrdersResult {
  order: Order | null;
  loading: boolean;
  error: string | null;
  createOrder: (order: CreateOrderRequest) => Promise<Order | null>;
  fetchOrder: (orderId: string) => Promise<void>;
}

export function useOrders(): UseOrdersResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (orderData: CreateOrderRequest): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const created: Order = await api.createOrder(orderData);
      setOrder(created);
      return created;
    } catch (err) {
      const apiError = err as { message?: string; code?: string };
      setError(apiError.message ?? 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetched: Order = await api.getOrder(orderId);
      setOrder(fetched);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message ?? 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    order,
    loading,
    error,
    createOrder,
    fetchOrder,
  };
}
