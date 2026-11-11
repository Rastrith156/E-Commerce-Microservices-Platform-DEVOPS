import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartPage } from '../pages/Cart';

vi.mock('../hooks/useCart', () => ({
  useCart: vi.fn(),
}));

import { useCart } from '../hooks/useCart';

const mockUseCart = useCart as ReturnType<typeof vi.fn>;

function renderCart() {
  return render(<CartPage />, { wrapper: MemoryRouter });
}

describe('CartPage', () => {
  it('renders empty cart message when no items', () => {
    mockUseCart.mockReturnValue({
      cart: { items: [] },
      loading: false,
      error: null,
      itemCount: 0,
      total: 0,
      refresh: vi.fn(),
      addItem: vi.fn(),
      updateItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    renderCart();
    expect(screen.getByText(/your cart is empty/i)).toBeTruthy();
  });

  it('renders cart items and allows removal', () => {
    const removeItem = vi.fn();
    mockUseCart.mockReturnValue({
      cart: { items: [{ productId: 'p1', quantity: 2 }] },
      loading: false,
      error: null,
      itemCount: 2,
      total: 200,
      refresh: vi.fn(),
      addItem: vi.fn(),
      updateItem: vi.fn(),
      removeItem,
      clearCart: vi.fn(),
    });

    renderCart();
    expect(screen.getByText(/product p1/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(removeItem).toHaveBeenCalledWith('demo-user', 'p1');
  });

  it('shows error when present', () => {
    mockUseCart.mockReturnValue({
      cart: null,
      loading: false,
      error: 'Failed to load cart',
      itemCount: 0,
      total: 0,
      refresh: vi.fn(),
      addItem: vi.fn(),
      updateItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    renderCart();
    expect(screen.getByText(/failed to load cart/i)).toBeTruthy();
  });
});
