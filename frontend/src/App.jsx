import { useEffect, useMemo, useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { ArrowRight, Check, CheckCircle2, Lock, Minus, Plus, Search, ShieldCheck, ShoppingBag, Star, X } from 'lucide-react';
import { api } from './api';

const USER = 'demo-user', usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function App() {
  const [p, setP] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    Promise.all([api.products(), api.cart(USER)])
      .then(([x, y]) => {
        setP(x);
        setCart(y);
      })
      .catch(e => setErr(e.message));
  }, []);

  const cats = ['All', ...new Set(p.map(x => x.category))];
  const shown = useMemo(
    () =>
      p.filter(
        x =>
          (cat === 'All' || x.category === cat) &&
          `${x.name} ${x.description}`.toLowerCase().includes(q.toLowerCase())
      ),
    [p, cat, q]
  );

  const items = cart.items
    .map(i => ({ ...i, product: p.find(x => x.id === i.productId) }))
    .filter(i => i.product);

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);

  const change = async (fn, msg) => {
    try {
      setCart(await fn());
      setNote(msg);
      setTimeout(() => setNote(''), 2200);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleInstantCheckout = async () => {
    if (!items.length) return;
    try {
      setCheckingOut(true);
      const res = await api.createOrder(cart.items);
      const cap = await api.capture(res.orderId);
      await api.clear(USER);
      setCart({ items: [] });
      setOpen(false);
      setOrderSuccess({
        orderId: cap.orderId,
        email: cap.payerEmail || 'demo-buyer@northstar.internal',
        total
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <div className="announce">Complimentary shipping on orders over $75</div>
      <header>
        <a className="brand">NORTHSTAR<span>.</span></a>
        <nav>
          <a href="#shop">New arrivals</a>
          <a href="#shop">Collections</a>
          <a href="#story">Our story</a>
        </nav>
        <label className="search">
          <Search size={18} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" />
        </label>
        <button className="bag" onClick={() => setOpen(true)}>
          <ShoppingBag />
          <b>{count}</b>
        </button>
      </header>

      <main>
        <section className="hero">
          <div>
            <small>CONSIDERED DESIGN · EVERYDAY EASE</small>
            <h1>Objects that make<br />life feel <em>better.</em></h1>
            <p>Thoughtfully sourced essentials for home, work, and everywhere between. Built to last. Designed to belong.</p>
            <a className="cta" href="#shop">Explore the collection <ArrowRight size={18} /></a>
            <div className="proof">
              <span><Star size={15} /> 4.9 average rating</span>
              <span><ShieldCheck size={16} /> 30-day returns</span>
            </div>
          </div>
          <div className="heroImage">
            <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85" alt="Modern living room" />
            <aside>
              <small>EDITOR'S PICK</small>
              <strong>Form Lounge Chair</strong>
              <span>Quiet comfort, sculpted.</span>
            </aside>
          </div>
        </section>

        <section className="trust">
          <div>Free shipping<small>On orders over $75</small></div>
          <div>Secure checkout<small>Protected by PayPal</small></div>
          <div>Quality guaranteed<small>Designed for the long run</small></div>
        </section>

        <section id="shop" className="shop">
          <small>THE EDIT</small>
          <div className="heading">
            <h2>Everyday icons</h2>
            <p>A refined selection chosen for material, function, and timeless form.</p>
          </div>
          <div className="filters">
            {cats.map(x => (
              <button key={x} className={x === cat ? 'active' : ''} onClick={() => setCat(x)}>
                {x}
              </button>
            ))}
          </div>
          <div className="grid">
            {shown.map(x => (
              <article key={x.id}>
                <div className="pic">
                  <img src={x.imageUrl} alt={x.name} />
                  {x.badge && <b>{x.badge}</b>}
                  <button onClick={() => change(() => api.add(USER, { productId: x.id, quantity: 1 }), `${x.name} added`)}>
                    <Plus size={17} /> Add to bag
                  </button>
                </div>
                <div className="meta">
                  <span><small>{x.category}</small><h3>{x.name}</h3></span>
                  <strong>{usd.format(x.price)}</strong>
                </div>
                <p>{x.description}</p>
                <div className="rating">
                  <Star size={14} fill="currentColor" /> {x.rating} ({x.reviewCount})
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="story" className="story">
          <div>
            <small>OUR PHILOSOPHY</small>
            <h2>Less, but <em>better.</em></h2>
            <p>Honest materials, thoughtful utility, and enduring design from responsible makers.</p>
          </div>
          <img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85" alt="Responsible craft" />
        </section>
      </main>

      <footer>
        <a className="brand">NORTHSTAR<span>.</span></a>
        <p>Modern essentials, thoughtfully chosen.</p>
      </footer>

      {open && (
        <>
          <button className="shade" onClick={() => setOpen(false)} />
          <aside className="drawer">
            <div className="drawerHead">
              <div>
                <small>YOUR BAG</small>
                <h2>{count} items</h2>
              </div>
              <button onClick={() => setOpen(false)}><X /></button>
            </div>
            <div className="cartItems">
              {items.length ? (
                items.map(i => (
                  <div key={i.productId} className="cartItem">
                    <img src={i.product.imageUrl} alt={i.product.name} />
                    <div>
                      <h3>{i.product.name}</h3>
                      <span>{usd.format(i.product.price)}</span>
                      <div className="qty">
                        <button onClick={() => change(() => i.quantity === 1 ? api.remove(USER, i.productId) : api.update(USER, i.productId, i.quantity - 1), 'Bag updated')}>
                          <Minus size={14} />
                        </button>
                        <b>{i.quantity}</b>
                        <button onClick={() => change(() => api.update(USER, i.productId, i.quantity + 1), 'Bag updated')}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <ShoppingBag />
                  <h3>Your bag is empty</h3>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="checkout">
                <div><span>Subtotal</span><strong>{usd.format(total)}</strong></div>
                <p>Shipping and taxes calculated at checkout.</p>
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'gold' }}
                  forceReRender={[cart.items]}
                  createOrder={() => api.createOrder(cart.items).then(r => r.orderId)}
                  onApprove={({ orderID }) =>
                    api.capture(orderID).then(cap => {
                      api.clear(USER);
                      setCart({ items: [] });
                      setOpen(false);
                      setOrderSuccess({
                        orderId: cap.orderId,
                        email: cap.payerEmail || 'demo-buyer@northstar.internal',
                        total
                      });
                    }).catch(e => setErr(e.message))
                  }
                  onError={e => setErr(e.message || 'PayPal error. You can also use Instant Sandbox Checkout below.')}
                />
                <div className="payDivider">OR TEST DIRECTLY</div>
                <button
                  className="instantPay"
                  disabled={checkingOut}
                  onClick={handleInstantCheckout}
                >
                  <Lock size={15} />
                  {checkingOut ? 'Processing Payment...' : `Complete Sandbox Payment (${usd.format(total)})`}
                </button>
                <small style={{ marginTop: '12px' }}><ShieldCheck size={14} /> Secure PayPal sandbox payment gateway</small>
              </div>
            )}
          </aside>
        </>
      )}

      {orderSuccess && (
        <div className="orderModal">
          <div className="orderModalCard">
            <div className="checkIcon">
              <CheckCircle2 size={32} />
            </div>
            <h2>Payment Successful!</h2>
            <p>Thank you for your order. Your transaction has been processed securely via the sandbox gateway.</p>
            <div className="orderSummary">
              <div><span>Order ID:</span><strong>{orderSuccess.orderId}</strong></div>
              <div><span>Amount Paid:</span><strong>{usd.format(orderSuccess.total)}</strong></div>
              <div><span>Payer Email:</span><span>{orderSuccess.email}</span></div>
              <div><span>Status:</span><strong style={{ color: '#1f4d3c' }}>COMPLETED</strong></div>
            </div>
            <button onClick={() => setOrderSuccess(null)}>Continue Shopping</button>
          </div>
        </div>
      )}

      {note && <div className="toast"><Check />{note}</div>}
      {err && <div className="toast error"><X />{err}</div>}
    </>
  );
}
