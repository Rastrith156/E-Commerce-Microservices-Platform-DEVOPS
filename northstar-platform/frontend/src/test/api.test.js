import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';

const jsonResponse = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn(),
});

describe('service API client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it('uses the expected routes, methods, and JSON request bodies', async () => {
    const values = Array.from({ length: 9 }, (_, index) => ({ index }));
    values.forEach(value => fetch.mockResolvedValueOnce(jsonResponse(value)));

    expect(await api.products()).toEqual(values[0]);
    expect(await api.cart('demo-user')).toEqual(values[1]);
    expect(await api.add('demo-user', { productId: 'lamp', quantity: 2 })).toEqual(values[2]);
    expect(await api.update('demo-user', 'lamp', 3)).toEqual(values[3]);
    expect(await api.remove('demo-user', 'lamp')).toEqual(values[4]);
    expect(await api.clear('demo-user')).toEqual(values[5]);
    expect(await api.paymentStatus()).toEqual(values[6]);
    expect(await api.createOrder([{ productId: 'lamp', quantity: 2 }])).toEqual(values[7]);
    expect(await api.capture('order-1')).toEqual(values[8]);

    expect(fetch.mock.calls.map(([url, options]) => [url, options?.method || 'GET'])).toEqual([
      ['/api/products', 'GET'],
      ['/api/carts/demo-user', 'GET'],
      ['/api/carts/demo-user/items', 'POST'],
      ['/api/carts/demo-user/items/lamp', 'PUT'],
      ['/api/carts/demo-user/items/lamp', 'DELETE'],
      ['/api/carts/demo-user', 'DELETE'],
      ['/api/payments/paypal/status', 'GET'],
      ['/api/payments/paypal/orders', 'POST'],
      ['/api/payments/paypal/orders/order-1/capture', 'POST'],
    ]);
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ productId: 'lamp', quantity: 2 });
    expect(JSON.parse(fetch.mock.calls[3][1].body)).toEqual({ quantity: 3 });
    expect(JSON.parse(fetch.mock.calls[7][1].body)).toEqual({ items: [{ productId: 'lamp', quantity: 2 }] });
  });

  it('returns null for no-content responses', async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await expect(api.clear('demo-user')).resolves.toBeNull();
  });

  it('prefers a JSON error message and falls back to response text', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Cart is unavailable' }, 503));
    await expect(api.cart('demo-user')).rejects.toThrow('Cart is unavailable');

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new Error('not JSON')),
      text: vi.fn().mockResolvedValue('upstream unavailable'),
    });
    await expect(api.products()).rejects.toThrow('upstream unavailable');
  });

  it('uses the status message when an error body cannot be read', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('bad JSON')),
      text: vi.fn().mockRejectedValue(new Error('body consumed')),
    });
    await expect(api.products()).rejects.toThrow('Request failed (500)');
  });

  it('normalizes aborts, network errors, and unexpected rejection values', async () => {
    const abort = new Error('cancelled');
    abort.name = 'AbortError';
    fetch.mockRejectedValueOnce(abort);
    await expect(api.products()).rejects.toThrow('The service did not respond in time.');

    fetch.mockRejectedValueOnce(new Error('network down'));
    await expect(api.products()).rejects.toThrow('network down');

    fetch.mockRejectedValueOnce('unknown failure');
    await expect(api.products()).rejects.toThrow('The request failed unexpectedly.');
  });
});
