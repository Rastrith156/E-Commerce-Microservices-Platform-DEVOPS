import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PAGE_METADATA, normalizeSiteUrl } from './src/page-metadata.js';

const escapeHtml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeXml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

function renderRouteHtml(source, metadata, siteUrl, socialImageUrl) {
  const canonicalUrl = siteUrl ? new URL(metadata.path, `${siteUrl}/`).href : '';
  const imageUrl = socialImageUrl || (siteUrl ? `${siteUrl}/social-card.svg` : '');
  const canonical = canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`
    : '';
  const socialTags = [
    `<meta name="robots" content="index,follow">`,
    canonical,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}">`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Northstar">`,
    `<meta property="og:locale" content="en_US">`,
    canonicalUrl ? `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">` : '',
    imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : '',
    `<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}">`,
    imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : '',
  ].filter(Boolean).join('\n    ');
  return source
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(metadata.description)}">`,
    )
    .replace('<!-- GENERATED_SEO_METADATA -->', socialTags);
}

function renderRobots(siteUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /404.html',
    'Disallow: /*?*',
    ...(siteUrl ? [`Sitemap: ${siteUrl}/sitemap.xml`] : []),
    '',
  ].join('\n');
}

function renderSitemap(siteUrl) {
  const locations = ['home', 'shop', 'privacy']
    .map(route => new URL(PAGE_METADATA[route].path, `${siteUrl}/`).href);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locations.map(location => `  <url><loc>${escapeXml(location)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

function renderSocialImageUrl(raw) {
  if (!raw) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('VITE_SOCIAL_IMAGE_URL must be an absolute HTTPS URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('VITE_SOCIAL_IMAGE_URL must be an absolute HTTPS URL.');
  }
  return parsed.href;
}

export function seoBuildPlugin(environment = {}) {
  const siteUrl = normalizeSiteUrl(environment.VITE_SITE_URL?.trim() || '');
  const socialImageUrl = renderSocialImageUrl(environment.VITE_SOCIAL_IMAGE_URL?.trim() || '');
  const robots = renderRobots(siteUrl);

  return {
    name: 'northstar-static-seo',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname;
        if (pathname === '/robots.txt') {
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          response.end(robots);
          return;
        }
        if (pathname === '/sitemap.xml') {
          if (!siteUrl) {
            response.statusCode = 404;
            response.end();
            return;
          }
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/xml; charset=utf-8');
          response.end(renderSitemap(siteUrl));
          return;
        }
        next();
      });
    },
    generateBundle(_, bundle = {}) {
      const index = bundle['index.html'];
      const template = index ? String(index.source) : readFileSync(fileURLToPath(new URL('./index.html', import.meta.url)), 'utf8');
      const routes = index
        ? [['index.html', PAGE_METADATA.home], ['shop/index.html', PAGE_METADATA.shop], ['privacy/index.html', PAGE_METADATA.privacy]]
        : [['shop/index.html', PAGE_METADATA.shop], ['privacy/index.html', PAGE_METADATA.privacy]];
      for (const [fileName, metadata] of routes) {
        const html = renderRouteHtml(template, metadata, siteUrl, socialImageUrl);
        if (fileName === 'index.html' && index) {
          index.source = html;
          continue;
        }
        this.emitFile({ type: 'asset', fileName, source: html });
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
      if (siteUrl) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap(siteUrl) });
      }
    },
  };
}
