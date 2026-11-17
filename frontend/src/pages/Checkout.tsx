import { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { Navbar } from '../components/Navbar';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { generateCorrelationId } from '../utils/correlationId';
import { DEMO_USER_ID } from '../constants';
import { formatCurrency } from '../utils/formatCurrency';
import type { CartItem, CreateOrderRequest, OrderItem, Product } from '../types';

function buildOrderItems(
  items: CartItem[],
  productsById: Map<string, Product>
): OrderItem[] | null {
  const orderItems: OrderItem[] = [];
  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) return null;
    orderItems.push({ ...item, unitPrice: product.price });
  }
  return orderItems;
}

export function CheckoutPage() {
  const { createOrder, loading, error: ordersError, order } = useOrders();
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    refresh: refreshCart,
    clearCart,
  } = useCart();
  const {
    products,
    loading: productsLoading,
    error: productsError,
    refresh: refreshProducts,
  } = useProducts(1, 100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const orderItems = cart ? buildOrderItems(cart.items, productsById) : null;
  const subtotal = orderItems?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) ?? 0;

  useEffect(() => {
    void refreshCart(DEMO_USER_ID);
  }, [refreshCart]);

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!cart || cart.items.length === 0) {
      setError('Your cart is empty. Add items before checking out.');
      setSubmitting(false);
      return;
    }

    if (!orderItems) {
      setError('Product details are unavailable. Refresh the catalog before placing your order.');
      setSubmitting(false);
      return;
    }

    const request: CreateOrderRequest = {
      userId: DEMO_USER_ID,
      idempotencyKey: generateCorrelationId(),
      items: orderItems,
    };

    const result = await createOrder(request);
    if (result) {
      const cartCleared = await clearCart(DEMO_USER_ID);
      if (!cartCleared) {
        setError('Your order was placed, but the cart could not be cleared. Please refresh it.');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="page">
      <Navbar cartCount={cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0} />
      <main className="container">
        <h1>Checkout</h1>
        <ErrorDisplay error={error ?? ordersError ?? cartError} />
        <ErrorDisplay error={productsError} onRetry={() => { void refreshProducts(); }} />
        {cartLoading && <p className="loading" role="status">Loading cart...</p>}
        {!cartLoading && (!cart || cart.items.length === 0) && !order && (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add products before checking out.</p>
            <Link className="btn-primary" to="/">Browse products</Link>
          </div>
        )}
        {!cartLoading && cart && cart.items.length > 0 && (
          <>
            <section className="order-summary" aria-label="Order summary">
              <h2>Order Summary</h2>
              {productsLoading && <p className="loading" role="status">Loading product prices...</p>}
              <ul>
                {cart.items.map((item) => {
                  const product = productsById.get(item.productId);
                  return (
                    <li className="order-item" key={item.productId}>
                      <span>{product?.name ?? `Product ${item.productId}`} × {item.quantity}</span>
                      <span>
                        {product
                          ? formatCurrency(product.price * item.quantity, product.currency)
                          : 'Price unavailable'}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="order-total">
                <span>Total</span>
                <span>{orderItems ? formatCurrency(subtotal) : 'Unavailable'}</span>
              </div>
            </section>
            <form onSubmit={handleCheckout}>
              <button
                className="btn-primary"
                type="submit"
                disabled={submitting || loading || productsLoading || !orderItems}
              >
                {submitting ? 'Placing order...' : 'Place order'}
              </button>
            </form>
          </>
        )}
        {order && (
          <div className="order-confirmed">
            <h2>Order confirmed</h2>
            <p>Order ID: {order.orderNumber ?? order.id}</p>
            <p>Status: {order.status}</p>
            <p>Total: {formatCurrency(order.total, order.currency ?? 'INR')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
