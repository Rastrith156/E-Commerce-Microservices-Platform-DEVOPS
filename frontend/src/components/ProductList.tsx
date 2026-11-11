import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onAddToCart: (product: Product) => void;
  onRefresh: () => void;
}

export function ProductList({
  products,
  loading,
  error,
  onAddToCart,
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
    return (
      <div className="error">
        <p>{error}</p>
        <button type="button" onClick={onRefresh}>Try again</button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <section className="product-list" aria-label="Product catalog">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </section>
  );
}
