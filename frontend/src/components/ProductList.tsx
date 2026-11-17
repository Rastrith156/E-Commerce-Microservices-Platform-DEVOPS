import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ErrorDisplay } from './ErrorDisplay';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onAddToCart: (product: Product) => void;
  addingProductId?: string | null;
  cartLoading?: boolean;
  onRefresh: () => void;
}

export function ProductList({
  products,
  loading,
  error,
  onAddToCart,
  addingProductId = null,
  cartLoading = false,
  onRefresh,
}: ProductListProps) {
  if (loading) {
    return (
      <div className="loading">
        <p role="status" aria-live="polite">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={onRefresh} />;
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <h2>No products available</h2>
        <p>No products were found in the catalog.</p>
      </div>
    );
  }

  return (
    <section className="product-grid" aria-label="Product catalog">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          isAdding={addingProductId === product.id}
          cartLoading={cartLoading}
        />
      ))}
    </section>
  );
}
