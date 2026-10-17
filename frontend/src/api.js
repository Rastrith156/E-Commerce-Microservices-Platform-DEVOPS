const c = '';
const a = '';
const o = '';
const REQUEST_TIMEOUT_MS = 15000;

const request = async (url, options) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The service did not respond in time. Check your connection and retry.', {
        cause: error,
      });
    }
    if (error instanceof Error) {
      throw new Error(error.message, { cause: error });
    }
    throw new Error('The request failed unexpectedly.', { cause: error });
  } finally {
    clearTimeout(timeout);
  }
};

const parse = async r => {
  if (!r.ok) {
    let msg = `Request failed (${r.status})`;
    try {
      const data = await r.json();
      if (data && data.message) msg = data.message;
    } catch {
      try {
        const text = await r.text();
        if (text) msg = text;
      } catch {
        // The response body may already have been consumed by the JSON parser.
      }
    }
    throw new Error(msg, { cause: { status: r.status } });
  }
  return r.status === 204 ? null : r.json();
};

export const api = {
  products: () => request(`${c}/api/products`).then(parse),
  cart: u => request(`${a}/api/carts/${u}`).then(parse),
  add: (u, item) => request(`${a}/api/carts/${u}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }).then(parse),
  update: (u, id, quantity) => request(`${a}/api/carts/${u}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  }).then(parse),
  remove: (u, id) => request(`${a}/api/carts/${u}/items/${id}`, { method: 'DELETE' }).then(parse),
  clear: u => request(`${a}/api/carts/${u}`, { method: 'DELETE' }).then(parse),
  paymentStatus: () => request(`${o}/api/payments/paypal/status`).then(parse),
  createOrder: items => request(`${o}/api/payments/paypal/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  }).then(parse),
  capture: id => request(`${o}/api/payments/paypal/orders/${id}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).then(parse)
};
