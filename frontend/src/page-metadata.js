export const PAGE_METADATA = {
  home: {
    path: '/',
    title: 'Northstar | Considered Home & Everyday Essentials',
    description: 'Explore thoughtfully chosen home, work, and everyday essentials with clear product details and sandbox-only checkout.',
  },
  shop: {
    path: '/shop/',
    title: 'Shop Considered Everyday Essentials | Northstar',
    description: 'Browse Northstar home, lighting, decor, and tech essentials. Compare product details and prices before adding items to your bag.',
  },
  privacy: {
    path: '/privacy/',
    title: 'Privacy Policy & Store Data Practices | Northstar',
    description: 'Read how the Northstar storefront demonstration uses cart data, optional consent-based analytics, browser storage, and sandbox checkout.',
  },
  notFound: {
    path: '/404.html',
    title: 'Page Not Found | Northstar',
    description: 'The Northstar page you requested could not be found. Return home or browse the collection.',
  },
};

export function normalizeSiteUrl(value) {
  if (!value) return '';
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('VITE_SITE_URL must be a root HTTPS URL, such as https://shop.your-business-domain.');
  }
  if (
    parsed.protocol !== 'https:' ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('VITE_SITE_URL must be a root HTTPS URL with no path, query, or credentials.');
  }
  return parsed.origin;
}
