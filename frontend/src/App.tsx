import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { CartPage } from './pages/Cart';
import { CheckoutPage } from './pages/Checkout';

function NotFound() {
  return (
    <main className="page container empty-state">
      <h1>Page not found</h1>
      <p>The page you requested doesn't exist.</p>
      <Link className="btn-primary" to="/">Return to catalog</Link>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
