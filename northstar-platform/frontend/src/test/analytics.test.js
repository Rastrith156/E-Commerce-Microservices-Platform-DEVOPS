import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadAnalytics = async measurementId => {
  vi.resetModules();
  vi.stubEnv('VITE_GA4_MEASUREMENT_ID', measurementId);
  return import('../analytics');
};

describe('consent-based analytics', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.gtag;
    delete window.dataLayer;
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('requires an accepted consent choice and valid measurement ID', async () => {
    const analytics = await loadAnalytics('invalid-id');
    expect(analytics.analyticsConfigured()).toBe(false);
    analytics.trackPageView('/shop/');
    analytics.trackEvent('view_item_list');
    expect(window.gtag).toBeUndefined();

    expect(analytics.getAnalyticsConsent()).toBeNull();
    expect(analytics.saveAnalyticsConsent(false)).toBe(true);
    expect(analytics.getAnalyticsConsent()).toBe('rejected');
  });

  it('initializes once after consent and tracks unique paths and allowed events', async () => {
    const analytics = await loadAnalytics('G-STORE123');
    expect(analytics.analyticsConfigured()).toBe(true);
    window.localStorage.setItem('northstar-analytics-consent', 'accepted');

    analytics.trackPageView('/shop/?campaign=spring');
    analytics.trackPageView('/shop/');
    analytics.trackEvent('add_to_cart', { item_id: 'chair-form' });
    analytics.trackEvent('not_allowed', { ignored: true });

    expect(document.querySelectorAll('#northstar-google-analytics')).toHaveLength(1);
    expect(document.querySelector('#northstar-google-analytics').src).toContain('id=G-STORE123');
    const events = window.dataLayer.map(args => [...args]);
    expect(events.filter(args => args[0] === 'event' && args[1] === 'page_view')).toHaveLength(1);
    expect(events.find(args => args[1] === 'page_view')[2].page_path).toBe('/shop/');
    expect(events.some(args => args[1] === 'add_to_cart')).toBe(true);
    expect(events.some(args => args[1] === 'not_allowed')).toBe(false);
  });

  it('updates an existing analytics client when consent is saved', async () => {
    const analytics = await loadAnalytics('G-STORE123');
    window.gtag = vi.fn();
    expect(analytics.saveAnalyticsConsent(true)).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted' });
    expect(analytics.getAnalyticsConsent()).toBe('accepted');
  });

  it('handles browser storage errors without breaking the storefront', async () => {
    const analytics = await loadAnalytics('G-STORE123');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage blocked'); });

    expect(analytics.getAnalyticsConsent()).toBeNull();
    expect(analytics.saveAnalyticsConsent(true)).toBe(false);
  });
});
