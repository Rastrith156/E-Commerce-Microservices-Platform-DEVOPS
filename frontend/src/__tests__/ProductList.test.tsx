import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductList } from '../components/ProductList';

const products = [
  { id: '1', name: 'Widget', description: 'A widget', price: 100, currency: 'INR', stock: 5, imageUrl: '', createdAt: '', updatedAt: '' },
  { id: '2', name: 'Gadget', description: 'A gadget', price: 200, currency: 'INR', stock: 0, imageUrl: '', createdAt: '', updatedAt: '' },
];

describe('ProductList', () => {
  it('renders loading state', () => {
    render(<ProductList products={[]} loading={true} error={null} onAddToCart={vi.fn()} onRefresh={vi.fn()} />);
    const status = screen.getByRole('status');
    expect(status.textContent?.toLowerCase()).toContain('loading products');
  });

  it('renders error state with retry button', () => {
    const onRefresh = vi.fn();
    render(<ProductList products={[]} loading={false} error="Failed to load" onAddToCart={vi.fn()} onRefresh={onRefresh} />);
    expect(screen.getByText(/failed to load/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders product cards and marks out-of-stock items', () => {
    const onAddToCart = vi.fn();
    render(<ProductList products={products} loading={false} error={null} onAddToCart={onAddToCart} onRefresh={vi.fn()} />);
    expect(screen.getByText('Widget')).toBeTruthy();
    expect(screen.getByText('Gadget')).toBeTruthy();
    const buttons = screen.getAllByRole('button');
    const outOfStockButton = buttons.find((b) => b.textContent?.trim() === 'Out of stock') as HTMLButtonElement;
    expect(outOfStockButton).toBeTruthy();
    expect(outOfStockButton.disabled).toBe(true);
  });
});
