import { useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { Navbar } from '../components/Navbar';
import { ErrorDisplay } from '../components/ErrorDisplay';

const DEMO_USER_ID = 'demo-user';

export function CartPage() {
  const { cart, loading, error, itemCount, refresh, updateItem, removeItem, clearCart } = useCart();

  const handleUpdate = async (productId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Math.max(0, parseInt(event.target.value, 10) || 0);
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
        <ErrorDisplay error={error} />
        {loading && <p>Loading cart...</p>}
        {!loading && !cart && (
          <button type="button" onClick={() => refresh(DEMO_USER_ID)}>Load cart</button>
        )}
        {!loading && cart && cart.items.length === 0 && (
          <p>Your cart is empty.</p>
        )}
        {!loading && cart && cart.items.length > 0 && (
          <>
            <ul className="cart-items">
              {cart.items.map((item) => (
                <li key={item.productId} className="cart-item">
                  <span>Product {item.productId}</span>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleUpdate(item.productId, e)}
                  />
                  <button type="button" onClick={() => handleRemove(item.productId)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="cart-actions">
              <button type="button" onClick={handleClear}>Clear cart</button>
              <button type="button">Proceed to checkout</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
