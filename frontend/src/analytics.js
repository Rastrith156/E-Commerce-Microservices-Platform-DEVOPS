const CONSENT_KEY = 'northstar-analytics-consent';
const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || '';
const ALLOWED_EVENTS = new Set([
  'view_item_list',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'purchase',
]);

let analyticsInitialized = false;
let lastPageView = '';

export function analyticsConfigured() {
  return /^G-[A-Z0-9]+$/.test(MEASUREMENT_ID);
}

export function getAnalyticsConsent() {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function saveAnalyticsConsent(allowed) {
  try {
    window.localStorage.setItem(CONSENT_KEY, allowed ? 'accepted' : 'rejected');
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: allowed ? 'granted' : 'denied',
      });
    }
    return true;
  } catch {
    return false;
  }
}

function initializeAnalytics() {
  if (!analyticsConfigured() || getAnalyticsConsent() !== 'accepted') return false;
  if (analyticsInitialized) return true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const scriptId = 'northstar-google-analytics';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.append(script);
  }
  analyticsInitialized = true;
  return true;
}

export function trackPageView(pathname) {
  if (!initializeAnalytics()) return;
  const path = pathname.split('?')[0];
  if (lastPageView === path) return;
  lastPageView = path;
  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
}

export function trackEvent(name, parameters = {}) {
  if (!ALLOWED_EVENTS.has(name) || !initializeAnalytics()) return;
  window.gtag('event', name, parameters);
}
