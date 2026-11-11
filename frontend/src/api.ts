import type {
  Product,
  Cart,
  CartItem,
  Order,
  CreateOrderRequest,
  ApiError,
  PaginatedResponse,
} from './types';
import { getStoredCorrelationId } from './utils/correlationId';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const correlationId = getStoredCorrelationId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error: ApiError = {
        code: 'HTTP_ERROR',
        message: `Request failed with status ${response.status}`,
        correlationId,
        timestamp: new Date().toISOString(),
      };
      try {
        error = (await response.json()) as ApiError;
        error.correlationId = error.correlationId ?? correlationId;
      } catch {
        // Use default error if body is not JSON
      }
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async getProducts(params?: { page?: number; size?: number }): Promise<PaginatedResponse<Product>> {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.size) search.set('size', String(params.size));
    const query = search.toString() ? `?${search}` : '';
    return this.request<PaginatedResponse<Product>>(`/catalog/products${query}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/catalog/products/${encodeURIComponent(id)}`);
  }

  async getCart(userId: string): Promise<Cart> {
    return this.request<Cart>(`/cart/${encodeURIComponent(userId)}`);
  }

  async addToCart(userId: string, item: CartItem): Promise<Cart> {
    return this.request<Cart>(`/cart/${encodeURIComponent(userId)}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    return this.request<Cart>(
      `/cart/${encodeURIComponent(userId)}/items/${encodeURIComponent(productId)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }
    );
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    return this.request<Cart>(
      `/cart/${encodeURIComponent(userId)}/items/${encodeURIComponent(productId)}`,
      { method: 'DELETE' }
    );
  }

  async clearCart(userId: string): Promise<void> {
    await this.request<void>(`/cart/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  }

  async createOrder(order: CreateOrderRequest): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${encodeURIComponent(orderId)}`);
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);

export type { ApiError };
