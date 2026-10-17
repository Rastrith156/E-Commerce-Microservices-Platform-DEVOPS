import { describe, expect, it } from 'vitest';
import { seoBuildPlugin } from '../../build-seo-plugin';

const template = `<!doctype html>
<html><head><meta name="description" content="Home description"><title>Home</title>
<!-- GENERATED_SEO_METADATA --></head><body><div id="root"></div></body></html>`;

function buildAssets(plugin) {
  const emitted = [];
  const bundle = {
    'index.html': { type: 'asset', source: template },
  };
  plugin.generateBundle.call({
    emitFile: asset => emitted.push(asset),
  }, {}, bundle);
  return { bundle, emitted };
}

describe('static SEO document generation', () => {
  it('emits unique crawlable route metadata and a sitemap for a configured HTTPS domain', () => {
    const { bundle, emitted } = buildAssets(seoBuildPlugin({ VITE_SITE_URL: 'https://store.example.invalid' }));
    const shop = emitted.find(asset => asset.fileName === 'shop/index.html').source;
    const privacy = emitted.find(asset => asset.fileName === 'privacy/index.html').source;
    const sitemap = emitted.find(asset => asset.fileName === 'sitemap.xml').source;

    expect(bundle['index.html'].source).toContain('<link rel="canonical" href="https://store.example.invalid/">');
    expect(shop).toContain('<title>Shop Considered Everyday Essentials | Northstar</title>');
    expect(shop).toContain('href="https://store.example.invalid/shop/"');
    expect(privacy).toContain('<title>Privacy Policy &amp; Store Data Practices | Northstar</title>');
    expect(privacy).toContain('href="https://store.example.invalid/privacy/"');
    expect(sitemap).toContain('<loc>https://store.example.invalid/</loc>');
    expect(sitemap).toContain('<loc>https://store.example.invalid/shop/</loc>');
    expect(sitemap).toContain('<loc>https://store.example.invalid/privacy/</loc>');
    expect(sitemap).not.toContain('404');
  });

  it('does not invent canonical hosts or emit an unusable sitemap without a site URL', () => {
    const { bundle, emitted } = buildAssets(seoBuildPlugin({}));
    const robots = emitted.find(asset => asset.fileName === 'robots.txt').source;

    expect(bundle['index.html'].source).not.toContain('rel="canonical"');
    expect(emitted.some(asset => asset.fileName === 'sitemap.xml')).toBe(false);
    expect(robots).not.toContain('Sitemap:');
  });

  it('rejects a non-HTTPS production site URL', () => {
    expect(() => seoBuildPlugin({ VITE_SITE_URL: 'http://store.example.invalid' }))
      .toThrow('VITE_SITE_URL must be a root HTTPS URL');
  });
});
