import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { api } from './api';
import {
  analyticsConfigured,
  getAnalyticsConsent,
  saveAnalyticsConsent,
  trackEvent,
  trackPageView,
} from './analytics';
import { getPageMetadata, updatePageMetadata } from './seo';

const USER = 'demo-user';
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const payPalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim();
const payPalConfigured = Boolean(payPalClientId && payPalClientId !== 'test');

function routeFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return 'home';
  if (path === '/shop') return 'shop';
  if (path === '/privacy') return 'privacy';
  return 'notFound';
}

function usePublicPageMetadata(pathname, consent) {
  useEffect(() => {
    const route = routeFor(pathname);
    const indexable = route !== 'notFound' && window.location.search === '';
    updatePageMetadata(getPageMetadata(route), { indexable });
    trackPageView(pathname);
  }, [pathname, consent]);
}

function Header({ count, onOpenCart, search, onSearchChange, showCart = true }) {
  return (
    <>
      <a className="skipLink" href="#main-content">Skip to content</a>
      <div className="announce">Thoughtful essentials, made for everyday living</div>
      <header className="siteHeader">
        <a className="brand" href="/" aria-label="Northstar home">
          NORTHSTAR<span>.</span>
        </a>
        <nav className="primaryNav" aria-label="Main navigation">
          <a href="/shop/">Shop all</a>
          <a href="/#story">Our approach</a>
          <a href="/privacy/">Privacy</a>
        </nav>
        {showCart && (
          <>
            <label className="search">
              <Search size={18} aria-hidden="true" />
              <span className="visuallyHidden">Search products</span>
              <input
                type="search"
                value={search}
                onChange={event => onSearchChange(event.target.value)}
                placeholder="Search products"
              />
            </label>
            <button className="bag" type="button" onClick={onOpenCart} aria-label={`Open shopping bag, ${count} items`}>
              <ShoppingBag aria-hidden="true" />
              <span className="bagCount" aria-hidden="true">{count}</span>
            </button>
          </>
        )}
      </header>
    </>
  );
}

function Footer({ onOpenPreferences }) {
  return (
    <footer className="siteFooter">
      <div>
        <a className="brand" href="/" aria-label="Northstar home">
          NORTHSTAR<span>.</span>
        </a>
        <p>Modern essentials, thoughtfully chosen.</p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/shop/">Shop the collection</a>
        <a href="/privacy/">Privacy policy</a>
        <button type="button" className="textButton" onClick={onOpenPreferences}>
          Privacy preferences
        </button>
      </nav>
    </footer>
  );
}

function PrivacyPage({ onOpenPreferences }) {
  return (
    <main id="main-content" className="policyPage">
      <div className="policyEyebrow">NORTHSTAR · PRIVACY</div>
      <h1>Privacy, in plain language.</h1>
      <p className="policyLead">
        This storefront is a demonstration. It does not have customer accounts,
        and its current checkout is a sandbox simulation—not live payment
        processing.
      </p>
      <p className="policyReview">
        Draft for business review. Review date: <strong>[DATE TO BE CONFIRMED]</strong>.
        This notice is not legal advice and does not establish legal compliance.
      </p>

      <section>
        <h2>Who operates this site</h2>
        <p>
          Store operator and legal business name: <strong>[BUSINESS LEGAL NAME REQUIRED]</strong>.
          Privacy contact: <strong>[PRIVACY CONTACT EMAIL REQUIRED]</strong>.
          These details must be supplied by the business and reviewed before a
          public launch.
        </p>
      </section>
      <section>
        <h2>Information used by the demonstration</h2>
        <p>
          Product browsing requests the catalog. Adding or changing a bag sends
          product identifiers and quantities to the cart service under the
          shared demo cart identifier. Checkout sends item identifiers and
          quantities to the order service, which asks the catalog for current
          prices. There is no customer account or address form in this
          storefront.
        </p>
        <p>
          In the configured demonstration mode, the order service simulates
          payment and returns a demo receipt. Do not enter real payment
          information. If an operator later configures PayPal sandbox
          credentials, PayPal receives the requests needed to operate its
          sandbox; review PayPal&apos;s own privacy terms before enabling that
          integration.
        </p>
      </section>
      <section>
        <h2>Purpose, retention, and sharing</h2>
        <p>
          Product and cart data are used to demonstrate browsing, bag
          management, and sandbox checkout. The sample catalog, cart, and order
          services keep their state in application memory; that state is lost
          when the service restarts. Infrastructure operators may have separate
          operational logs. No retention period for production logs has been
          established; an operator must define and document one before launch.
        </p>
        <p>
          The application shares checkout requests with its own order and
          catalog services. Optional Google Analytics 4 is disabled unless a
          measurement ID is configured and a visitor explicitly consents. When
          enabled, it receives page views and limited commerce events described
          below. Event payloads exclude email addresses, order IDs, payment
          credentials, and other direct personal identifiers. Google&apos;s
          processing is subject to its own terms and the operator&apos;s
          configuration.
        </p>
      </section>
      <section>
        <h2>Cookies and your choices</h2>
        <p>
          The storefront itself does not set first-party cookies. If analytics
          is configured, the consent choice is stored in this browser&apos;s
          local storage and analytics is not initialized before opt-in. The
          optional PayPal checkout SDK loads only after it is configured and
          selected; third-party services may use their own browser storage.
          Clearing this browser&apos;s site data removes the saved preference.
        </p>
        <button type="button" className="secondaryButton" onClick={onOpenPreferences}>
          Change privacy preferences
        </button>
      </section>
      <section>
        <h2>Before this becomes a business storefront</h2>
        <p>
          The business must provide its legal identity, privacy contact, actual
          data retention practices, production analytics/payment configuration,
          and any applicable jurisdiction-specific disclosures. Obtain qualified
          legal review; this demonstration policy is not a compliance
          certification.
        </p>
      </section>
      <a className="inlineLink" href="/shop/">Return to the collection <ArrowRight size={16} aria-hidden="true" /></a>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main id="main-content" className="notFoundPage">
      <p className="notFoundCode">404 · PAGE NOT FOUND</p>
      <h1>This page took a wrong turn.</h1>
      <p>The address may be out of date, or the page may have moved.</p>
      <a className="cta" href="/">Back to Home <ArrowRight size={18} aria-hidden="true" /></a>
      <a className="inlineLink" href="/shop/">Browse the collection</a>
    </main>
  );
}

function ConsentNotice({ consent, onChoose }) {
  if (!analyticsConfigured() || consent !== null) return null;

  return (
    <section className="consentNotice" aria-label="Optional analytics choice">
      <div>
        <strong>Your choice, your data.</strong>
        <p>Optional analytics is off unless you choose to allow it.</p>
      </div>
      <div className="consentActions">
        <button type="button" className="secondaryButton" onClick={() => onChoose(false)}>
          Essential only
        </button>
        <button type="button" className="consentAccept" onClick={() => onChoose(true)}>
          Allow analytics
        </button>
      </div>
    </section>
  );
}

function PrivacyPreferences({ consent, onChoose, onClose }) {
  const configured = analyticsConfigured();
  return (
    <div className="preferencesBackdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="preferencesDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
      >
        <button className="dialogClose" type="button" onClick={onClose} aria-label="Close privacy preferences">
          <X aria-hidden="true" />
        </button>
        <p className="policyEyebrow">PRIVACY CONTROLS</p>
        <h2 id="preferences-title">Your privacy preferences</h2>
        {configured ? (
          <>
            <p>Optional Google Analytics is {consent === 'accepted' ? 'currently allowed' : 'off'}.</p>
            <div className="preferencesActions">
              <button type="button" className="secondaryButton" onClick={() => onChoose(false)}>
                Use essential only
              </button>
              <button type="button" className="consentAccept" onClick={() => onChoose(true)}>
                Allow analytics
              </button>
            </div>
          </>
        ) : (
          <p>Analytics is not configured for this build. No analytics data is being sent.</p>
        )}
        <button type="button" className="textButton" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}

function responsiveImageProps(source) {
  try {
    const image = new URL(source);
    if (image.protocol === 'https:' && image.hostname === 'images.unsplash.com') {
      const urlFor = width => {
        const sized = new URL(image);
        sized.searchParams.set('w', String(width));
        sized.searchParams.set('auto', 'format');
        return sized.toString();
      };
      return {
        srcSet: `${urlFor(480)} 480w, ${urlFor(900)} 900w, ${urlFor(1200)} 1200w`,
        sizes: '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 24vw',
      };
    }
  } catch {
    // Keep an existing image URL usable even when it is relative or malformed.
  }
  return {};
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const route = routeFor(pathname);
  const storefront = route === 'home' || route === 'shop';
  const [products, setProducts] = useState([]);
  const [productsState, setProductsState] = useState('loading');
  const [productsError, setProductsError] = useState('');
  const [cart, setCart] = useState({ items: [] });
  const [cartState, setCartState] = useState('idle');
  const [cartError, setCartError] = useState('');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentStatusState, setPaymentStatusState] = useState('idle');
  const paymentStatusStateRef = useRef(paymentStatusState);
  const [busyActions, setBusyActions] = useState(() => new Set());
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [payPalReady, setPayPalReady] = useState(false);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [consent, setConsent] = useState(() => getAnalyticsConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const drawerCloseRef = useRef(null);
  const viewedLists = useRef(new Set());
  const paymentMode = paymentStatus?.mode ?? 'simulated-sandbox';

  const loadProducts = useCallback(async () => {
    setProductsState('loading');
    setProductsError('');
    try {
      const result = await api.products();
      if (!Array.isArray(result)) throw new Error('The product service returned an invalid catalog.');
      setProducts(result);
      setProductsState('ready');
    } catch (error) {
      setProductsState('error');
      setProductsError(error.message || 'Products could not be loaded.');
    }
  }, []);

  const loadCart = useCallback(async () => {
    setCartState('loading');
    setCartError('');
    try {
      const result = await api.cart(USER);
      if (!result || !Array.isArray(result.items)) throw new Error('The cart service returned an invalid response.');
      setCart(result);
      setCartState('ready');
    } catch (error) {
      setCartState('error');
      setCartError(error.message || 'Your bag could not be loaded.');
    }
  }, []);

  useEffect(() => {
    if (!storefront) return undefined;

    let cancelled = false;
    const hydrateStorefront = async () => {
      if (cancelled) return;
      await loadProducts();
      if (cancelled) return;
      await loadCart();
    };

    void hydrateStorefront();
    return () => {
      cancelled = true;
    };
  }, [loadCart, loadProducts, storefront]);

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  usePublicPageMetadata(pathname, consent);

  useEffect(() => {
    paymentStatusStateRef.current = paymentStatusState;
  }, [paymentStatusState]);

  useEffect(() => {
    if (!open || paymentStatusStateRef.current !== 'idle') return undefined;

    let active = true;
    const loadPaymentStatus = async () => {
      setPaymentStatusState('loading');
      try {
        const status = await api.paymentStatus();
        if (!active) return;
        setPaymentStatus(status);
        setPaymentStatusState('ready');
      } catch (error) {
        if (!active) return;
        setPaymentStatusState('error');
        setFeedback({ message: error.message || 'Payment status could not be checked.' });
      }
    };

    void loadPaymentStatus();
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    document.body.classList.add('drawerOpen');
    drawerCloseRef.current?.focus();
    const closeOnEscape = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('drawerOpen');
      window.removeEventListener('keydown', closeOnEscape);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  const categories = useMemo(
    () => ['All', ...new Set(products.map(product => product.category))],
    [products]
  );
  const shownProducts = useMemo(
    () => products.filter(product =>
      (category === 'All' || product.category === category) &&
      `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search.trim().toLowerCase())
    ),
    [products, category, search]
  );
  const items = useMemo(
    () => cart.items.map(item => ({ ...item, product: products.find(product => product.id === item.productId) }))
      .filter(item => item.product),
    [cart.items, products]
  );
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (productsState !== 'ready' || !storefront || shownProducts.length === 0) return;
    const visible = shownProducts.map(product => product.id).join(',');
    if (viewedLists.current.has(visible)) return;
    viewedLists.current.add(visible);
    trackEvent('view_item_list', {
      item_list_name: route === 'shop' ? 'Shop' : 'Home collection',
      items: shownProducts.map(product => ({
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
      })),
    });
  }, [productsState, route, shownProducts, storefront]);

  const runCartAction = async (key, action) => {
    if (busyActions.has(key)) return;
    setBusyActions(previous => new Set(previous).add(key));
    setFeedback(null);
    try {
      await action();
    } catch (error) {
      setFeedback({
        message: error.message || 'That change could not be saved.',
        retry: () => runCartAction(key, action),
      });
    } finally {
      setBusyActions(previous => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    }
  };

  const addToCart = product => runCartAction(`add:${product.id}`, async () => {
    const next = await api.add(USER, { productId: product.id, quantity: 1 });
    setCart(next);
    setCartState('ready');
    trackEvent('add_to_cart', {
      currency: 'USD',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, item_category: product.category, quantity: 1 }],
    });
    setNote(`${product.name} added to your bag.`);
  });

  const changeQuantity = (item, quantity) => runCartAction(`quantity:${item.productId}`, async () => {
    const next = quantity < 1
      ? await api.remove(USER, item.productId)
      : await api.update(USER, item.productId, quantity);
    setCart(next);
    const delta = item.quantity - quantity;
    if (delta > 0) {
      trackEvent('remove_from_cart', {
        currency: 'USD',
        value: item.product.price * Math.min(delta, item.quantity),
        items: [{
          item_id: item.product.id,
          item_name: item.product.name,
          item_category: item.product.category,
          quantity: Math.min(delta, item.quantity),
        }],
      });
    }
    setNote(quantity < 1 ? `${item.product.name} removed from your bag.` : 'Your bag was updated.');
  });

  const completeOrder = async orderId => {
    setCheckoutBusy(true);
    setFeedback(null);
    try {
      const captured = await api.capture(orderId);
      if (captured?.status?.toUpperCase() !== 'COMPLETED') {
        throw new Error('Payment has not been confirmed. Your bag has not been cleared.');
      }
      setOrderSuccess({ orderId: captured.orderId, total });
      trackEvent('purchase', { currency: 'USD', value: total });
      setOpen(false);
      try {
        const emptyCart = await api.clear(USER);
        setCart(emptyCart || { items: [] });
        setCartState('ready');
      } catch (error) {
        setFeedback({
          message: `Payment completed, but your bag could not be cleared: ${error.message}`,
          retry: loadCart,
        });
      }
    } catch (error) {
      const message = error.message || 'Checkout could not be completed.';
      setFeedback({ message, retry: () => completeOrder(orderId) });
    } finally {
      setCheckoutBusy(false);
    }
  };

  const createPayPalOrder = async () => {
    setCheckoutBusy(true);
    try {
      const created = await api.createOrder(cart.items);
      trackEvent('begin_checkout', { currency: 'USD', value: total });
      return created.orderId;
    } catch (error) {
      setFeedback({
        message: error.message || 'Checkout could not be started.',
        retry: createPayPalOrder,
      });
      throw error;
    } finally {
      setCheckoutBusy(false);
    }
  };

  const completeSandboxCheckout = async () => {
    if (checkoutBusy || !items.length) return;
    setCheckoutBusy(true);
    setFeedback(null);
    try {
      const created = await api.createOrder(cart.items);
      trackEvent('begin_checkout', { currency: 'USD', value: total });
      const captured = await api.capture(created.orderId);
      if (captured?.status?.toUpperCase() !== 'COMPLETED') {
        throw new Error('Payment has not been confirmed. Your bag has not been cleared.');
      }
      setOrderSuccess({ orderId: captured.orderId, total });
      trackEvent('purchase', { currency: 'USD', value: total });
      setOpen(false);
      try {
        const emptyCart = await api.clear(USER);
        setCart(emptyCart || { items: [] });
        setCartState('ready');
      } catch (error) {
        setFeedback({
          message: `Payment completed, but your bag could not be cleared: ${error.message}`,
          retry: loadCart,
        });
      }
    } catch (error) {
      const message = error.message || 'Checkout could not be completed.';
      setFeedback({ message, retry: completeSandboxCheckout });
    } finally {
      setCheckoutBusy(false);
    }
  };

  const chooseConsent = allowed => {
    if (!saveAnalyticsConsent(allowed)) {
      setFeedback({ message: 'Your privacy preference could not be saved in this browser. Analytics remains off.' });
      return;
    }
    setConsent(allowed ? 'accepted' : 'rejected');
    setPreferencesOpen(false);
  };

  if (route === 'notFound') {
    return (
      <>
        <NotFoundPage />
        <Footer onOpenPreferences={() => setPreferencesOpen(true)} />
        <ConsentNotice consent={consent} onChoose={chooseConsent} />
        {preferencesOpen && (
          <PrivacyPreferences consent={consent} onChoose={chooseConsent} onClose={() => setPreferencesOpen(false)} />
        )}
      </>
    );
  }

  if (route === 'privacy') {
    return (
      <>
        <Header count={count} onOpenCart={() => setOpen(true)} search={search} onSearchChange={setSearch} showCart={false} />
        <PrivacyPage onOpenPreferences={() => setPreferencesOpen(true)} />
        <Footer onOpenPreferences={() => setPreferencesOpen(true)} />
        <ConsentNotice consent={consent} onChoose={chooseConsent} />
        {preferencesOpen && (
          <PrivacyPreferences consent={consent} onChoose={chooseConsent} onClose={() => setPreferencesOpen(false)} />
        )}
        {feedback && <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />}
      </>
    );
  }

  return (
    <>
      <Header count={count} onOpenCart={() => setOpen(true)} search={search} onSearchChange={setSearch} />
      <main id="main-content">
        {route === 'home' && (
          <>
            <section className="hero" aria-labelledby="hero-title">
              <div className="heroCopy">
                <small>CONSIDERED DESIGN · EVERYDAY EASE</small>
                <h1 id="hero-title">Objects that make life feel <em>better.</em></h1>
                <p>Thoughtfully chosen essentials for home, work, and everywhere between. Useful by design, made to feel at home.</p>
                <div className="heroActions">
                  <a className="cta" href="/shop/">Explore the collection <ArrowRight size={18} aria-hidden="true" /></a>
                  <a className="secondaryLink" href="#story">Our approach <ChevronDown size={16} aria-hidden="true" /></a>
                </div>
                <div className="proof" aria-label="Store information">
                  <span><Star size={15} aria-hidden="true" /> Product details shown up front</span>
                  <span><ShieldCheck size={16} aria-hidden="true" /> Sandbox checkout only</span>
                </div>
              </div>
              <div className="heroImage">
                <img
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85"
                  alt="Warm, light-filled living room with a low sofa and natural wood furniture"
                  width="1400"
                  height="1000"
                  fetchpriority="high"
                  loading="eager"
                  decoding="async"
                />
                <aside>
                  <small>THE HOME EDIT</small>
                  <strong>Make room for considered pieces</strong>
                  <a href="/shop/">See the collection <ArrowRight size={14} aria-hidden="true" /></a>
                </aside>
              </div>
            </section>
            <section className="trust" aria-label="Shopping information">
              <div>Clear product details<small>Price and description before you add</small></div>
              <div>Simple bag controls<small>Update or remove items any time</small></div>
              <div>Sandbox checkout<small>No live payment processing</small></div>
            </section>
          </>
        )}

        <section id="shop" className={`shop ${route === 'shop' ? 'shopPage' : ''}`} aria-labelledby="shop-title">
          <small>{route === 'shop' ? 'SHOP THE COLLECTION' : 'THE EDIT'}</small>
          <div className="heading">
            <div>
              {route === 'shop' && <h1 className="shopPageTitle">Considered essentials for everyday living</h1>}
              <h2 id="shop-title">{route === 'shop' ? 'Shop all products' : 'Everyday icons'}</h2>
            </div>
            <p>Useful forms, thoughtful details, and pieces selected for everyday life.</p>
          </div>
          {productsState === 'loading' && (
            <div className="statePanel" role="status" aria-live="polite" aria-busy="true">
              <span className="spinner" aria-hidden="true" />
              <p>Loading products…</p>
            </div>
          )}
          {productsState === 'error' && (
            <div className="statePanel errorPanel" role="alert">
              <h3>Products are unavailable right now.</h3>
              <p>{productsError}</p>
              <button type="button" className="secondaryButton" onClick={loadProducts}>Retry loading products</button>
            </div>
          )}
          {productsState === 'ready' && (
            <>
              <div className="shopTools">
                <div className="filters" aria-label="Filter products by category">
                  {categories.map(value => (
                    <button
                      key={value}
                      type="button"
                      className={value === category ? 'active' : ''}
                      aria-pressed={value === category}
                      onClick={() => setCategory(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="resultCount" aria-live="polite">
                  {shownProducts.length} {shownProducts.length === 1 ? 'product' : 'products'}
                </p>
              </div>
              {shownProducts.length > 0 ? (
                <div className="grid">
                  {shownProducts.map(product => {
                    const addKey = `add:${product.id}`;
                    return (
                      <article key={product.id} className="productCard">
                        <div className="pic">
                          <img
                            src={product.imageUrl}
                            {...responsiveImageProps(product.imageUrl)}
                            alt={`${product.name}, ${product.category.toLowerCase()} product`}
                            width="900"
                            height="1125"
                            loading="lazy"
                            decoding="async"
                          />
                          {product.badge && <b className="productBadge">{product.badge}</b>}
                          <button
                            type="button"
                            disabled={busyActions.has(addKey) || cartState !== 'ready'}
                            onClick={() => addToCart(product)}
                          >
                            {busyActions.has(addKey) ? <span className="spinnerSmall" aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
                            {busyActions.has(addKey) ? 'Adding…' : 'Add to bag'}
                          </button>
                        </div>
                        <div className="meta">
                          <span><small>{product.category}</small><h3>{product.name}</h3></span>
                          <strong>{usd.format(product.price)}</strong>
                        </div>
                        <p>{product.description}</p>
                        <div className="rating">
                          <Star size={14} fill="currentColor" aria-hidden="true" />
                          <span>{product.rating} out of 5 from {product.reviewCount} reviews</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="statePanel emptyResults">
                  <h3>No products match that search.</h3>
                  <p>Try a different search or clear the category filter.</p>
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={() => { setSearch(''); setCategory('All'); }}
                  >
                    Clear search and filters
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {route === 'home' && (
          <section id="story" className="story" aria-labelledby="story-title">
            <div>
              <small>OUR APPROACH</small>
              <h2 id="story-title">Less, but <em>better.</em></h2>
              <p>Honest materials, thoughtful utility, and enduring forms guide the collection.</p>
              <a className="inlineLink" href="/shop/">Find your everyday essential <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <img
              src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85"
              alt="Sunlight falling across a calm home interior with plants and natural materials"
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
            />
          </section>
        )}
      </main>
      <Footer onOpenPreferences={() => setPreferencesOpen(true)} />

      {open && (
        <>
          <button className="shade" type="button" aria-label="Close shopping bag" onClick={() => setOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div className="drawerHead">
              <div>
                <small>YOUR BAG</small>
                <h2 id="drawer-title">{count} {count === 1 ? 'item' : 'items'}</h2>
              </div>
              <button ref={drawerCloseRef} type="button" onClick={() => setOpen(false)} aria-label="Close shopping bag">
                <X aria-hidden="true" />
              </button>
            </div>
            {cartState === 'loading' && (
              <div className="statePanel cartLoading" role="status" aria-live="polite" aria-busy="true">
                <span className="spinner" aria-hidden="true" />
                <p>Loading your bag…</p>
              </div>
            )}
            {cartState === 'error' && (
              <div className="statePanel errorPanel" role="alert">
                <h3>Your bag could not be loaded.</h3>
                <p>{cartError}</p>
                <button type="button" className="secondaryButton" onClick={loadCart}>Retry loading bag</button>
              </div>
            )}
            {cartState === 'ready' && (
              <>
                <div className="cartItems" aria-busy={busyActions.size > 0}>
                  {items.length ? items.map(item => {
                    const actionKey = `quantity:${item.productId}`;
                    return (
                      <div key={item.productId} className="cartItem">
                        <img
                          src={item.product.imageUrl}
                          alt={`${item.product.name}, ${item.product.category.toLowerCase()} product`}
                          width="90"
                          height="110"
                          loading="lazy"
                          decoding="async"
                        />
                        <div>
                          <h3>{item.product.name}</h3>
                          <span>{usd.format(item.product.price)}</span>
                          <div className="qty" aria-label={`Quantity for ${item.product.name}`}>
                            <button
                              type="button"
                              aria-label={`Remove one ${item.product.name}`}
                              disabled={busyActions.has(actionKey) || checkoutBusy}
                              onClick={() => changeQuantity(item, item.quantity - 1)}
                            >
                              <Minus size={14} aria-hidden="true" />
                            </button>
                            <span aria-live="polite">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Add one ${item.product.name}`}
                              disabled={busyActions.has(actionKey) || checkoutBusy}
                              onClick={() => changeQuantity(item, item.quantity + 1)}
                            >
                              <Plus size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="empty">
                      <ShoppingBag size={32} aria-hidden="true" />
                      <h3>Your bag is empty</h3>
                      <p>Explore the collection to find something useful.</p>
                      <a className="secondaryButton" href="/shop/" onClick={() => setOpen(false)}>Browse products</a>
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="checkout">
                    <div className="subtotal"><span>Subtotal</span><strong>{usd.format(total)}</strong></div>
                    <p>Shipping and taxes are not calculated in this demo.</p>
                    <p className="paymentMode" role="status" aria-live="polite">
                      {paymentStatusState === 'loading' && 'Checking payment mode…'}
                      {paymentStatusState === 'ready' && (paymentMode === 'simulated-sandbox'
                        ? 'Sandbox simulation only — no live payment is processed.'
                        : `Payment mode: ${paymentMode}. Review configuration before continuing.`)}
                      {paymentStatusState === 'error' && 'Payment status is unavailable. Retry before checkout.'}
                    </p>
                    {paymentStatusState === 'error' && (
                      <button type="button" className="textButton retryStatus" onClick={() => setPaymentStatusState('idle')}>
                        Retry payment status
                      </button>
                    )}
                    {paymentStatusState === 'ready' && (
                      <>
                        {payPalConfigured && (
                          !payPalReady ? (
                            <button type="button" className="secondaryButton paypalLoad" onClick={() => setPayPalReady(true)}>
                              Continue with PayPal sandbox
                            </button>
                          ) : (
                            <PayPalScriptProvider options={{ clientId: payPalClientId, currency: 'USD', intent: 'capture' }}>
                              <PayPalButtons
                                style={{ layout: 'vertical', color: 'gold' }}
                                forceReRender={[cart.items]}
                                disabled={checkoutBusy}
                                createOrder={createPayPalOrder}
                                onApprove={({ orderID }) => completeOrder(orderID)}
                                onCancel={() => setNote('Checkout cancelled. Your bag has not changed.')}
                                onError={error => setFeedback({ message: error.message || 'PayPal checkout failed. Your bag has not changed.' })}
                              />
                            </PayPalScriptProvider>
                          )
                        )}
                        <button
                          className="instantPay"
                          type="button"
                          disabled={checkoutBusy}
                          onClick={completeSandboxCheckout}
                        >
                          <Lock size={15} aria-hidden="true" />
                          {checkoutBusy
                            ? 'Processing sandbox checkout…'
                            : `${paymentMode === 'simulated-sandbox' ? 'Complete sandbox simulation' : 'Continue sandbox checkout'} (${usd.format(total)})`}
                        </button>
                      </>
                    )}
                    <small className="paymentDisclaimer">
                      <ShieldCheck size={14} aria-hidden="true" /> Demonstration only. No live payment is processed.
                    </small>
                  </div>
                )}
              </>
            )}
          </aside>
        </>
      )}

      {orderSuccess && (
        <div className="orderModal">
          <section className="orderModalCard" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
            <div className="checkIcon"><CheckCircle2 size={32} aria-hidden="true" /></div>
            <h2 id="order-success-title">Sandbox checkout completed</h2>
            <p>The payment service confirmed this demonstration transaction. No live payment was processed.</p>
            <div className="orderSummary">
              <div><span>Demo order reference</span><strong>{orderSuccess.orderId}</strong></div>
              <div><span>Demo total</span><strong>{usd.format(orderSuccess.total)}</strong></div>
              <div><span>Mode</span><strong>Sandbox simulation</strong></div>
            </div>
            <button type="button" onClick={() => setOrderSuccess(null)}>Continue shopping</button>
          </section>
        </div>
      )}

      {preferencesOpen && (
        <PrivacyPreferences consent={consent} onChoose={chooseConsent} onClose={() => setPreferencesOpen(false)} />
      )}
      <ConsentNotice consent={consent} onChoose={chooseConsent} />
      {note && (
        <div className="toast" role="status" aria-live="polite" aria-label={note}>
          <Check aria-hidden="true" />{note}
          <button type="button" onClick={() => setNote('')} aria-label="Dismiss notification"><X size={16} aria-hidden="true" /></button>
        </div>
      )}
      {feedback && <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />}
    </>
  );
}

function FeedbackToast({ feedback, onClose }) {
  return (
    <div className="toast error" role="alert" aria-live="assertive">
      <X aria-hidden="true" />
      <span>{feedback.message}</span>
      {feedback.retry && <button type="button" onClick={feedback.retry}>Retry</button>}
      <button type="button" onClick={onClose} aria-label="Dismiss error"><X size={16} aria-hidden="true" /></button>
    </div>
  );
}
