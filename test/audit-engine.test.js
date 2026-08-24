import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSite, summary, toCsv } from '../src/audit-engine.js';
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
