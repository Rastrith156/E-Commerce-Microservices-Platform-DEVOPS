import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { Navbar } from '../components/Navbar';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { DEMO_USER_ID } from '../constants';
import { formatCurrency } from '../utils/formatCurrency';

export function CartPage() {
  const { cart, loading, error, itemCount, refresh, updateItem, removeItem, clearCart } = useCart();
  const {
    products,
    loading: productsLoading,
    error: productsError,
    refresh: refreshProducts,
  } = useProducts(1, 100);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const subtotal = cart?.items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0) ?? 0;
  const hasMissingProduct = cart?.items.some((item) => !productsById.has(item.productId)) ?? false;

  const handleUpdate = async (productId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Number(event.target.value);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    await updateItem(DEMO_USER_ID, productId, quantity);
  };

  const handleRemove = async (productId: string) => {
    await removeItem(DEMO_USER_ID, productId);
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart(DEMO_USER_ID);
    }
  };

  useEffect(() => {
    refresh(DEMO_USER_ID);
  }, [refresh]);

  return (
    <div className="page">
      <Navbar cartCount={itemCount} />
      <main className="container">
        <h1>Shopping Cart</h1>
        <ErrorDisplay error={error} onRetry={() => { void refresh(DEMO_USER_ID); }} />
        <ErrorDisplay error={productsError} onRetry={() => { void refreshProducts(); }} />
        {loading && <p className="loading" role="status">Loading cart...</p>}
        {!loading && (!cart || cart.items.length === 0) && (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Browse the catalog and add something you like.</p>
            <Link className="btn-primary" to="/">Browse products</Link>
          </div>
        )}
        {!loading && cart && cart.items.length > 0 && (
          <>
            <ul className="cart-items">
              {cart.items.map((item) => {
                const product = productsById.get(item.productId);
                return (
                  <li key={item.productId} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-name">
                        {product?.name ?? `Product ${item.productId}`}
                      </span>
                      {product && (
                        <span className="text-muted">
                          {formatCurrency(product.price, product.currency)} each
                        </span>
                      )}
                    </div>
                    <input
                      className="cart-item-qty"
                      type="number"
                      min="0"
                      value={item.quantity}
                      aria-label={`Quantity for ${product?.name ?? `product ${item.productId}`}`}
                      onChange={(e) => handleUpdate(item.productId, e)}
                    />
                    <span className="cart-item-line-total">
                      {product
                        ? formatCurrency(product.price * item.quantity, product.currency)
                        : 'Price unavailable'}
                    </span>
                    <button
                      className="btn-remove"
                      type="button"
                      onClick={() => handleRemove(item.productId)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="cart-summary">
              <span>Items ({itemCount})</span>
              <strong>
                {productsLoading || hasMissingProduct
                  ? 'Subtotal unavailable'
                  : formatCurrency(subtotal)}
              </strong>
            </div>
            <div className="cart-actions">
              <button className="btn-clear" type="button" onClick={handleClear}>Clear cart</button>
              <Link
                className="btn-checkout"
                to="/checkout"
                aria-disabled={productsLoading || hasMissingProduct}
                onClick={(event) => {
                  if (productsLoading || hasMissingProduct) event.preventDefault();
                }}
              >
                Proceed to checkout
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
