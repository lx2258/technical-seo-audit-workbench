import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSite, summary, toCsv } from '../src/audit-engine.js';
import { parseCrawlInput } from '../src/import-parser.js';
import { enrichPageWithEvidence } from '../src/evidence-parser.js';
import { sampleCrawl } from '../src/sample-data.js';

test('prioritizes HTTP blockers above product data gaps', () => {
  const findings = auditSite(sampleCrawl);
  assert.equal(findings[0].severity, 'critical');
  assert.ok(findings.some(item => item.rule === 'http-status' && item.url.endsWith('/30w-car-charger')));
  assert.ok(findings.some(item => item.rule === 'product-schema' && item.url.endsWith('/100w-usb-c-cable')));
});

test('detects 3C catalog canonical, product data and duplicate intent signals', () => {
  const findings = auditSite(sampleCrawl);
  assert.ok(findings.some(item => item.rule === 'collection-pagination-canonical' && item.url.includes('page=2')));
  assert.ok(findings.some(item => item.rule === 'product-sku' && item.url.endsWith('/100w-usb-c-cable')));
  assert.ok(findings.some(item => item.rule === 'duplicate-title'));
  assert.ok(findings.some(item => item.rule === 'duplicate-description'));
});

test('returns a stable severity summary and CSV safe enough for spreadsheet import', () => {
  const findings = auditSite(sampleCrawl);
  const counts = summary(findings);
  assert.ok(counts.critical >= 1);
  const csv = toCsv(findings);
  assert.match(csv, /^severity,rule,url,message,recommendation/);
  assert.match(csv, /"https:\/\/voltgear\.example\/products\/30w-car-charger"/);
});

test('flags 3C product data gaps and a paginated collection canonicalised to page one', () => {
  const findings = auditSite([
    { url: 'https://voltgear.example/products/65w-gan-charger', status: 200, indexable: true, canonical: 'https://voltgear.example/products/65w-gan-charger', robots: 'index,follow', title: '65W GaN Charger', description: 'Compact USB-C charger.', h1: '65W GaN Charger', inSitemap: true, pageType: 'product', productSchema: false, sku: '', availability: '' },
    { url: 'https://voltgear.example/collections/usb-c-chargers?page=2', status: 200, indexable: true, canonical: 'https://voltgear.example/collections/usb-c-chargers', robots: 'index,follow', title: 'USB-C Chargers - Page 2', description: 'More USB-C chargers.', h1: 'USB-C Chargers', inSitemap: true, pageType: 'collection', pageNumber: 2 }
  ]);
  assert.ok(findings.some(item => item.rule === 'product-schema'));
  assert.ok(findings.some(item => item.rule === 'product-sku'));
  assert.ok(findings.some(item => item.rule === 'product-availability'));
  assert.ok(findings.some(item => item.rule === 'collection-pagination-canonical'));
});

test('imports a Screaming Frog style CSV and normalizes SEO fields', () => {
  const rows = parseCrawlInput('Address,Status Code,Indexability,Canonical Link Element 1,Title 1,Meta Description 1,H1-1\nhttps://voltgear.example/products/charger,200,Indexable,https://voltgear.example/products/charger,65W Charger,Travel charger,65W Charger');
  assert.deepEqual(rows, [{
    url: 'https://voltgear.example/products/charger', status: 200, indexable: true,
    canonical: 'https://voltgear.example/products/charger', title: '65W Charger',
    description: 'Travel charger', h1: '65W Charger', robots: '', pageType: 'product'
  }]);
});

test('flags international market and product variant gaps from supplied catalog fields', () => {
  const findings = auditSite([{
    url: 'https://voltgear.example/de-de/products/65w-gan-charger', status: 200, indexable: true,
    canonical: 'https://voltgear.example/de-de/products/65w-gan-charger', robots: 'index,follow',
    title: '65W GaN Charger', description: 'Travel charger.', h1: '65W GaN Charger', inSitemap: true,
    pageType: 'product', productSchema: true, sku: 'VG-65-DE', availability: 'InStock', market: 'DE', locale: 'de-DE',
    hreflangCount: 0, price: '49.99', currency: '', variantCount: 3, variantSkuCoverage: 1
  }]);
  assert.ok(findings.some(item => item.rule === 'hreflang-coverage'));
  assert.ok(findings.some(item => item.rule === 'offer-currency'));
  assert.ok(findings.some(item => item.rule === 'variant-sku-coverage'));
});

test('derives Product offer data and hreflang coverage from captured page HTML', () => {
  const page = enrichPageWithEvidence({
    url: 'https://voltgear.example/de-de/products/65w-gan-charger',
    html: '<link rel="alternate" hreflang="en-US" href="https://voltgear.example/products/65w-gan-charger"><link rel="alternate" hreflang="de-DE" href="https://voltgear.example/de-de/products/65w-gan-charger"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","sku":"VG-65-DE","offers":{"@type":"Offer","price":"49.99","priceCurrency":"EUR","availability":"https://schema.org/InStock"}}</script>'
  });
  assert.deepEqual(page, {
    url: 'https://voltgear.example/de-de/products/65w-gan-charger', html: page.html,
    productSchema: true, sku: 'VG-65-DE', price: '49.99', currency: 'EUR', availability: 'InStock', hreflangCount: 2
  });
});

test('uses HTML evidence instead of a supplied schema flag when the captured page has no Product JSON-LD', () => {
  const findings = auditSite([{
    url: 'https://voltgear.example/products/charger', status: 200, indexable: true,
    canonical: 'https://voltgear.example/products/charger', title: 'Charger', description: 'Charger', h1: 'Charger',
    inSitemap: true, pageType: 'product', productSchema: true, html: '<html><head></head><body>Charger</body></html>'
  }]);
  assert.ok(findings.some(item => item.rule === 'product-schema'));
});
