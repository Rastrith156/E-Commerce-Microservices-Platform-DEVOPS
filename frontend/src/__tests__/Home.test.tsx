import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../pages/Home';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';

vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn(),
}));
vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

const mockUseCart = useCart as ReturnType<typeof vi.fn>;
const mockUseProducts = useProducts as ReturnType<typeof vi.fn>;
const refreshCart = vi.fn().mockResolvedValue(undefined);
const addItem = vi.fn().mockResolvedValue(true);

const product = {
  id: '1',
  name: 'Widget',
  description: 'A widget',
  price: 100,
  currency: 'INR',
  stock: 5,
  imageUrl: '',
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  vi.clearAllMocks();
  refreshCart.mockResolvedValue(undefined);
  addItem.mockResolvedValue(true);
  mockUseProducts.mockReturnValue({
    products: [product],
    loading: false,
    error: null,
    totalPages: 1,
    totalElements: 1,
    page: 1,
    size: 12,
    refresh: vi.fn(),
    setPage: vi.fn(),
    setSize: vi.fn(),
  });
  mockUseCart.mockReturnValue({
    cart: null,
    loading: false,
    error: null,
    itemCount: 2,
    refresh: refreshCart,
    addItem,
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  });
});

describe('Home page', () => {
  it('loads the cart count and adds products to the cart', async () => {
    render(<Home />, { wrapper: MemoryRouter });

    expect(screen.getByRole('link', { name: 'Cart (2 items)' })).toBeTruthy();
    await waitFor(() => expect(refreshCart).toHaveBeenCalledWith('demo-user'));

    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith('demo-user', {
        productId: '1',
        quantity: 1,
      });
    });
  });
});
