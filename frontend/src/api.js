const c = import.meta.env.VITE_CATALOG_API_URL || 'http://localhost:8081';
const a = import.meta.env.VITE_CART_API_URL || 'http://localhost:8082';
const o = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:8083';

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
      } catch {}
    }
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json();
};

export const api = {
  products: () => fetch(`${c}/api/products`).then(parse),
  cart: u => fetch(`${a}/api/carts/${u}`).then(parse),
  add: (u, item) => fetch(`${a}/api/carts/${u}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }).then(parse),
  update: (u, id, quantity) => fetch(`${a}/api/carts/${u}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  }).then(parse),
  remove: (u, id) => fetch(`${a}/api/carts/${u}/items/${id}`, { method: 'DELETE' }).then(parse),
  clear: u => fetch(`${a}/api/carts/${u}`, { method: 'DELETE' }).then(parse),
  paymentStatus: () => fetch(`${o}/api/payments/paypal/status`).then(parse),
  createOrder: items => fetch(`${o}/api/payments/paypal/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  }).then(parse),
  capture: id => fetch(`${o}/api/payments/paypal/orders/${id}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).then(parse)
};
