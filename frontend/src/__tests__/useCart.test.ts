import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { api } from '../api';
import { useCart } from '../hooks/useCart';

vi.mock('../api', () => ({
  api: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCart', () => {
  it('treats a missing server cart as empty', async () => {
    mockApi.getCart.mockRejectedValueOnce({ status: 404, message: 'Cart not found' });
    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.refresh('demo-user');
    });

    expect(result.current.cart).toMatchObject({
      userId: 'demo-user',
      items: [],
    });
    expect(result.current.error).toBeNull();
  });
});
