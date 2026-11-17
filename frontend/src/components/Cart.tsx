import type { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  itemCount: number;
  total: number;
  onUpdateItem: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
  onClearCart: () => Promise<void>;
}

export function Cart({
  items,
  loading,
  error,
  itemCount,
  total,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
}: CartProps) {
  const handleUpdate = async (productId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Math.max(0, parseInt(event.target.value, 10) || 0);
    await onUpdateItem(productId, quantity);
  };

  const handleRemove = async (productId: string) => {
    await onRemoveItem(productId);
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await onClearCart();
    }
  };

  return (
    <section className="cart" aria-label="Shopping cart">
      <h2>Shopping Cart</h2>

      {error && (
        <div className="error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loading">
          <p role="status" aria-live="polite">Loading cart...</p>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="empty">
          <p>Your cart is empty.</p>
          <button type="button" onClick={handleClear} disabled>
            Clear cart
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <ul className="cart-items">
            {items.map((item) => (
              <li key={item.productId} className="cart-item">
                <span className="cart-item-product">Product {item.productId}</span>
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => handleUpdate(item.productId, e)}
                  aria-label={`Quantity for product ${item.productId}`}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(item.productId)}
                  aria-label={`Remove product ${item.productId}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-summary">
            <p>Items: {itemCount}</p>
            <p>Total: {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(total)}</p>
          </div>

          <div className="cart-actions">
            <button type="button" onClick={handleClear} disabled={items.length === 0}>
              Clear cart
            </button>
            <button type="button">Proceed to checkout</button>
          </div>
        </>
      )}
    </section>
  );
}
