import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import App from '../App';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    products: vi.fn(),
    cart: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    paymentStatus: vi.fn(),
    createOrder: vi.fn(),
    capture: vi.fn(),
  },
}));

vi.mock('../api', () => ({ api: mockApi }));

const products = [
  {
    id: 'chair-form',
    name: 'Form Lounge Chair',
    category: 'Furniture',
    description: 'Soft curves, solid oak, and a generous woven seat.',
    price: 289,
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85',
    badge: 'BESTSELLER',
    rating: 4.9,
    reviewCount: 128,
  },
];

describe('storefront routes and states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.products.mockResolvedValue(products);
    api.cart.mockResolvedValue({ items: [] });
    api.add.mockResolvedValue({ items: [{ productId: 'chair-form', quantity: 1 }] });
    api.update.mockResolvedValue({ items: [] });
    api.remove.mockResolvedValue({ items: [] });
    api.clear.mockResolvedValue({ items: [] });
    api.paymentStatus.mockResolvedValue({ mode: 'simulated-sandbox' });
    api.createOrder.mockResolvedValue({ orderId: 'SANDBOX-TEST', status: 'CREATED' });
    api.capture.mockResolvedValue({ orderId: 'SANDBOX-TEST', status: 'COMPLETED' });
  });

  it('renders a responsive home headline, working collection CTA, and home metadata', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /objects that make life feel better/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /explore the collection/i }).getAttribute('href')).toBe('/shop/');
    await screen.findByRole('heading', { name: 'Everyday icons' });
    expect(document.title).toBe('Northstar | Considered Home & Everyday Essentials');
    expect(document.head.querySelector('meta[name="description"]').content).toContain('thoughtfully chosen home');
  });

  it('renders a navigable not-found page for unknown client routes', () => {
    window.history.replaceState({}, '', '/route-that-does-not-exist');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'This page took a wrong turn.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /back to home/i }).getAttribute('href')).toBe('/');
    expect(api.products).not.toHaveBeenCalled();
  });

  it('renders the privacy policy without loading account or cart-specific data', () => {
    window.history.replaceState({}, '', '/privacy/');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Privacy, in plain language.' })).toBeTruthy();
    expect(screen.getByText('[BUSINESS LEGAL NAME REQUIRED]')).toBeTruthy();
    expect(document.title).toBe('Privacy Policy & Store Data Practices | Northstar');
    expect(api.cart).not.toHaveBeenCalled();
  });

  it('shows a product loading error and supports retry', async () => {
    const user = userEvent.setup();
    api.products.mockRejectedValueOnce(new Error('Catalog offline'));
    render(<App />);

    expect(await screen.findByText('Catalog offline')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retry loading products' }));
    expect(await screen.findByRole('heading', { name: 'Form Lounge Chair' })).toBeTruthy();
    expect(api.products).toHaveBeenCalledTimes(2);
  });

  it('shows a useful empty search result with a clear action', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Form Lounge Chair' });

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'nonexistent');
    expect(screen.getByRole('heading', { name: 'No products match that search.' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }));
    expect(screen.getByRole('heading', { name: 'Form Lounge Chair' })).toBeTruthy();
  });

  it('announces add-to-bag only after the cart service succeeds', async () => {
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByRole('article');
    const addButton = within(card).getByRole('button', { name: 'Add to bag' });
    await waitFor(() => expect(addButton.disabled).toBe(false));
    await user.click(addButton);

    expect(await screen.findByRole('status', { name: /form lounge chair added/i })).toBeTruthy();
    expect(api.add).toHaveBeenCalledWith('demo-user', { productId: 'chair-form', quantity: 1 });
    expect(screen.getByRole('button', { name: 'Open shopping bag, 1 items' })).toBeTruthy();
  });

  it('does not announce checkout success when capture is not completed', async () => {
    const user = userEvent.setup();
    api.cart.mockResolvedValue({ items: [{ productId: 'chair-form', quantity: 1 }] });
    api.capture.mockResolvedValue({ orderId: 'SANDBOX-TEST', status: 'PENDING' });
    render(<App />);
    await screen.findByRole('heading', { name: 'Everyday icons' });
    await user.click(screen.getByRole('button', { name: 'Open shopping bag, 1 items' }));

    await user.click(await screen.findByRole('button', { name: /complete sandbox simulation/i }));

    expect(await screen.findByText(/payment has not been confirmed/i)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Sandbox checkout completed' })).toBeNull();
    expect(api.clear).not.toHaveBeenCalled();
  });

  it('announces success only after a completed sandbox capture', async () => {
    const user = userEvent.setup();
    api.cart.mockResolvedValue({ items: [{ productId: 'chair-form', quantity: 1 }] });
    render(<App />);
    await screen.findByRole('heading', { name: 'Everyday icons' });
    await user.click(screen.getByRole('button', { name: 'Open shopping bag, 1 items' }));

    await user.click(await screen.findByRole('button', { name: /complete sandbox simulation/i }));

    expect(await screen.findByRole('heading', { name: 'Sandbox checkout completed' })).toBeTruthy();
    expect(api.capture).toHaveBeenCalledWith('SANDBOX-TEST');
    expect(api.clear).toHaveBeenCalledWith('demo-user');
  });
});
