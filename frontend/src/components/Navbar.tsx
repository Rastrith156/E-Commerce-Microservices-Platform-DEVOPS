import { Link } from 'react-router-dom';

export function Navbar({ cartCount }: { cartCount: number }) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-brand">
        <Link to="/">E-Commerce Platform</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Catalog</Link>
        <Link to="/cart" aria-label={`Cart (${cartCount} items)`}>
          Cart <span className="cart-badge">{cartCount}</span>
        </Link>
      </div>
    </nav>
  );
}
