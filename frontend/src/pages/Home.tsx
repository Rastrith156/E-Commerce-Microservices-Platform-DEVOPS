import { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { ProductList } from '../components/ProductList';
import { Navbar } from '../components/Navbar';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { DEMO_USER_ID } from '../constants';
import type { Product } from '../types';

export function Home() {
  const { products, loading, error, refresh } = useProducts();
  const {
    itemCount,
    loading: cartLoading,
    error: cartError,
    refresh: refreshCart,
    addItem,
  } = useCart();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  useEffect(() => {
    void refreshCart(DEMO_USER_ID);
  }, [refreshCart]);

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id);
    await addItem(DEMO_USER_ID, { productId: product.id, quantity: 1 });
    setAddingProductId(null);
  };

  return (
    <div className="page">
      <Navbar cartCount={itemCount} />
      <main className="container">
        <section className="hero" aria-labelledby="catalog-heading">
          <h2 id="catalog-heading">Find the tech you'll love</h2>
          <p>Explore quality electronics and add your favorites to the cart.</p>
        </section>
        <ErrorDisplay error={cartError} />
        <ProductList
          products={products}
          loading={loading}
          error={error}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
          cartLoading={cartLoading}
          onRefresh={refresh}
        />
      </main>
    </div>
  );
}
