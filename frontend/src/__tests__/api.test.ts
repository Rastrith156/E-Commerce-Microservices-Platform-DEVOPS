import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';

const mockFetch = vi.fn() as ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockClear();
  sessionStorage.clear();
});

describe('api client', () => {
  it('sends correlation ID header on every request', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 12 })
    );

    await api.getProducts();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/catalog/products');
    expect(init?.headers).toMatchObject({
      'X-Correlation-ID': expect.any(String),
      'Content-Type': 'application/json',
    });
  });

  it('throws error with correlation ID on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ code: 'NOT_FOUND', message: 'Product not found' }, 404)
    );

    await expect(api.getProduct('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Product not found',
    });
  });

  it('generates a stable correlation ID within a session', async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 12 })
    );

    await api.getProducts();
    await api.getProducts();

    const [, init1] = mockFetch.mock.calls[0];
    const [, init2] = mockFetch.mock.calls[1];
    expect(init1?.headers['X-Correlation-ID']).toBe(init2?.headers['X-Correlation-ID']);
  });
});
