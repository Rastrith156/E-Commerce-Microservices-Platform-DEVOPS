import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from '../pages/Checkout';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';

vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn(),
}));
vi.mock('../hooks/useOrders', () => ({
  useOrders: vi.fn(),
}));
vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

const mockUseCart = useCart as ReturnType<typeof vi.fn>;
const mockUseOrders = useOrders as ReturnType<typeof vi.fn>;
const mockUseProducts = useProducts as ReturnType<typeof vi.fn>;
const refreshCart = vi.fn().mockResolvedValue(undefined);
const clearCart = vi.fn().mockResolvedValue(true);
const createOrder = vi.fn().mockResolvedValue({
  id: 1,
  orderNumber: 'ORD-1',
  userId: 'demo-user',
  items: [{ productId: '1', quantity: 2, unitPrice: 100 }],
  total: 200,
  currency: 'INR',
  status: 'PENDING',
});

beforeEach(() => {
  vi.clearAllMocks();
  refreshCart.mockResolvedValue(undefined);
  clearCart.mockResolvedValue(true);
  createOrder.mockResolvedValue({
    id: 1,
    orderNumber: 'ORD-1',
    userId: 'demo-user',
    items: [{ productId: '1', quantity: 2, unitPrice: 100 }],
    total: 200,
    currency: 'INR',
    status: 'PENDING',
  });
  mockUseCart.mockReturnValue({
    cart: { userId: 'demo-user', items: [{ productId: '1', quantity: 2 }] },
    loading: false,
    error: null,
    itemCount: 2,
    refresh: refreshCart,
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart,
  });
  mockUseOrders.mockReturnValue({
    order: null,
    loading: false,
    error: null,
    createOrder,
    fetchOrder: vi.fn(),
  });
  mockUseProducts.mockReturnValue({
    products: [{
      id: '1',
      name: 'Widget',
      description: 'A widget',
      price: 100,
      currency: 'INR',
      stock: 5,
      imageUrl: '',
      createdAt: '',
      updatedAt: '',
    }],
    loading: false,
    error: null,
    totalPages: 1,
    totalElements: 1,
    page: 1,
    size: 100,
    refresh: vi.fn(),
    setPage: vi.fn(),
    setSize: vi.fn(),
  });
});

describe('Checkout page', () => {
  it('loads the cart, sends product prices, and clears the cart after ordering', async () => {
    render(<CheckoutPage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(refreshCart).toHaveBeenCalledWith('demo-user'));
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'demo-user',
        items: [{ productId: '1', quantity: 2, unitPrice: 100 }],
      }));
      expect(clearCart).toHaveBeenCalledWith('demo-user');
    });
  });
});
