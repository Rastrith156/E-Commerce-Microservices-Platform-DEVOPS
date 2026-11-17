import { Link } from 'react-router-dom';

export function Navbar({ cartCount }: { cartCount: number }) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Link to="/">E-Commerce <span>Platform</span></Link>
        </div>
        <div className="navbar-links">
          <Link className="navbar-link" to="/">Catalog</Link>
          <Link to="/cart" className="navbar-cart" aria-label={`Cart (${cartCount} items)`}>
            Cart <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
