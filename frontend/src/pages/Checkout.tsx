import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useCart } from '../hooks/useCart';
import { Navbar } from '../components/Navbar';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { generateCorrelationId } from '../utils/correlationId';
import type { CreateOrderRequest } from '../types';

const DEMO_USER_ID = 'demo-user';

export function CheckoutPage() {
  const { createOrder, loading, error: ordersError, order } = useOrders();
  const { cart, loading: cartLoading, refresh: refreshCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!cart || cart.items.length === 0) {
      setError('Your cart is empty. Add items before checking out.');
      setSubmitting(false);
      return;
    }

    const request: CreateOrderRequest = {
      userId: DEMO_USER_ID,
      idempotencyKey: generateCorrelationId(),
      items: cart.items,
    };

    const result = await createOrder(request);
    setSubmitting(false);

    if (result) {
      // Order created successfully; cart will be cleared by the backend or frontend
    }
  };

  return (
    <div className="page">
      <Navbar cartCount={cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0} />
      <main className="container">
        <h1>Checkout</h1>
        <ErrorDisplay error={error ?? ordersError} />
        {cartLoading && <p>Loading cart...</p>}
        {!cartLoading && !cart && (
          <button type="button" onClick={() => refreshCart(DEMO_USER_ID)}>Load cart</button>
        )}
        {!cartLoading && cart && cart.items.length === 0 && (
          <p>Your cart is empty. Add items before checking out.</p>
        )}
        {!cartLoading && cart && cart.items.length > 0 && (
          <>
            <h2>Order Summary</h2>
            <ul>
              {cart.items.map((item) => (
                <li key={item.productId}>
                  Product {item.productId} × {item.quantity}
                </li>
              ))}
            </ul>
            <form onSubmit={handleCheckout}>
              <button type="submit" disabled={submitting || loading}>
                {submitting ? 'Placing order...' : 'Place order'}
              </button>
            </form>
          </>
        )}
        {order && (
          <div className="order-confirmed">
            <h2>Order confirmed</h2>
            <p>Order ID: {order.id}</p>
            <p>Status: {order.status}</p>
            <p>Total: {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: order.currency ?? 'INR',
            }).format(order.total)}</p>
          </div>
        )}
      </main>
    </div>
  );
}
