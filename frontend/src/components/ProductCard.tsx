import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="placeholder">No image</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-meta">
          <span className="product-price">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: product.currency ?? 'INR',
            }).format(product.price)}
          </span>
          <span className="product-stock">
            {product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'}
          </span>
        </div>
        <button
          className="add-to-cart"
          data-testid={`add-to-cart-${product.id}`}
          onClick={() => onAddToCart(product)}
          disabled={product.stock <= 0}
        >
          {product.stock <= 0 ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
