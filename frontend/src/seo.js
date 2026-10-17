import { PAGE_METADATA, normalizeSiteUrl } from './page-metadata';

const configuredSiteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL?.trim() || '');
const socialImageUrl = import.meta.env.VITE_SOCIAL_IMAGE_URL?.trim() || '';

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.append(element);
  }
  element.setAttribute('content', content);
}

function getSocialImage() {
  if (socialImageUrl) {
    const parsed = new URL(socialImageUrl);
    if (parsed.protocol !== 'https:') return '';
    return parsed.href;
  }
  return configuredSiteUrl ? `${configuredSiteUrl}/social-card.png` : '';
}

export function getPageMetadata(route) {
  return PAGE_METADATA[route] || PAGE_METADATA.notFound;
}

export function updatePageMetadata(metadata, { indexable = true } = {}) {
  document.title = metadata.title;
  setMeta('name', 'description', metadata.description);
  setMeta('name', 'robots', indexable ? 'index,follow' : 'noindex,follow');

  const canonicalUrl = configuredSiteUrl && indexable
    ? new URL(metadata.path, `${configuredSiteUrl}/`).href
    : '';
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (canonicalUrl) {
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;
  } else {
    canonical?.remove();
  }

  setMeta('property', 'og:title', metadata.title);
  setMeta('property', 'og:description', metadata.description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:site_name', 'Northstar');
  setMeta('property', 'og:locale', 'en_US');
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:image', getSocialImage());
  setMeta('name', 'twitter:card', getSocialImage() ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', metadata.title);
  setMeta('name', 'twitter:description', metadata.description);
  setMeta('name', 'twitter:image', getSocialImage());
}
