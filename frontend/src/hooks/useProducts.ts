import { useState, useEffect, useCallback } from 'react';
import type { Product, PaginatedResponse } from '../types';
import { api } from '../api';

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
}

export function useProducts(initialPage = 1, initialSize = 12): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(initialPage);
  const [size, setSizeState] = useState(initialSize);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Product> = await api.getProducts({
        page: page - 1,
        size,
      });
      setProducts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      const apiError = err as { message?: string; code?: string };
      setError(apiError.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setPage = (newPage: number) => {
    setPageState(Math.max(1, Math.min(newPage, totalPages || 1)));
  };

  const setSize = (newSize: number) => {
    setSizeState(Math.max(1, Math.min(newSize, 100)));
    setPageState(1);
  };

  return {
    products,
    loading,
    error,
    totalPages,
    totalElements,
    page,
    size,
    refresh: fetchProducts,
    setPage,
    setSize,
  };
}
