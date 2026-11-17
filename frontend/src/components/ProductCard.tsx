import { useState } from 'react';
import type { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isAdding?: boolean;
  cartLoading?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  isAdding = false,
  cartLoading = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="product-card">
      <div className="product-image">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="placeholder">Image unavailable</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-meta">
          <span className="product-price">
            {formatCurrency(product.price, product.currency ?? 'INR')}
          </span>
          <span className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'}
          </span>
        </div>
        <button
          className="btn-add-to-cart"
          data-testid={`add-to-cart-${product.id}`}
          onClick={() => onAddToCart(product)}
          disabled={product.stock <= 0 || isAdding || cartLoading}
          aria-busy={isAdding}
        >
          {product.stock <= 0
            ? 'Out of stock'
            : isAdding
              ? 'Adding...'
              : cartLoading
                ? 'Loading cart...'
                : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
