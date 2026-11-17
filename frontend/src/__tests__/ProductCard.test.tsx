import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';

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

describe('ProductCard', () => {
  it('renders product details', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={product} onAddToCart={onAddToCart} />);
    expect(screen.getByText('Widget')).toBeTruthy();
    expect(screen.getByText('A widget')).toBeTruthy();
    expect(screen.getByText(/₹100\.00/)).toBeTruthy();
    expect(screen.getByText(/In stock/)).toBeTruthy();
  });

  it('disables add-to-cart button when out of stock', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={{ ...product, stock: 0 }} onAddToCart={onAddToCart} />);
    const button = screen.getByRole('button', { name: 'Out of stock' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('calls onAddToCart when add button is clicked', () => {
    const onAddToCart = vi.fn();
    const { container } = render(<ProductCard product={product} onAddToCart={onAddToCart} />);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    fireEvent.click(button as HTMLButtonElement);
    expect(onAddToCart).toHaveBeenCalledWith(product);
  });
});
