import { enrichPageWithEvidence } from './evidence-parser.js';

export const SEVERITY = { critical: 4, high: 3, medium: 2, low: 1 };

const clean = value => String(value ?? '').trim();
const normalizedUrl = value => clean(value).replace(/\/$/, '');

function finding(page, rule, severity, message, recommendation) {
  return { id: `${page.url}|${rule}`, url: page.url, rule, severity, message, recommendation };
}

export function auditPage(page) {
  page = enrichPageWithEvidence(page);
  const findings = [];
  const url = clean(page.url);
  const robots = clean(page.robots).toLowerCase();
  const canonical = normalizedUrl(page.canonical);
  if (!url) return findings;
  if (Number(page.status) !== 200) findings.push(finding(page, 'http-status', 'critical', `Returns HTTP ${page.status || 'unknown'} but is in the crawl export.`, 'Redirect, repair, or remove this URL from internal links and sitemap.'));
  if (page.indexable === false || robots.includes('noindex')) findings.push(finding(page, 'indexability', 'critical', 'Page is marked non-indexable or contains a noindex directive.', 'Confirm intent; remove noindex only from pages that should appear in search.'));
  if (!canonical) findings.push(finding(page, 'canonical', 'high', 'Canonical URL is missing.', 'Add one absolute canonical URL for the preferred indexable version.'));
  else if (canonical !== normalizedUrl(url)) {
    const isPaginatedCollection = page.pageType === 'collection' && Number(page.pageNumber) > 1;
    findings.push(isPaginatedCollection
      ? finding(page, 'collection-pagination-canonical', 'high', `Collection page ${page.pageNumber} canonical points to ${page.canonical}.`, 'Use a self-referencing canonical for this paginated collection page and keep it crawlable when it has unique products.')
      : finding(page, 'canonical', 'high', `Canonical points to ${page.canonical}.`, 'Verify this consolidation is intentional and align internal links to the chosen canonical.'));
  }
  if (!clean(page.title)) findings.push(finding(page, 'title', 'medium', 'Title tag is missing.', 'Write a unique, descriptive title matching the page intent.'));
  if (!clean(page.description)) findings.push(finding(page, 'meta-description', 'medium', 'Meta description is missing.', 'Add a concise, page-specific description for snippet control.'));
  if (!clean(page.h1)) findings.push(finding(page, 'h1', 'medium', 'Primary H1 is missing.', 'Add one clear H1 that describes the page topic.'));
  if (page.pageType === 'product') {
    if (page.productSchema !== true) findings.push(finding(page, 'product-schema', 'high', 'Product structured data is missing from this product URL.', 'Add Product JSON-LD with name, image, SKU, offer price, currency and availability.'));
    if (!clean(page.sku)) findings.push(finding(page, 'product-sku', 'medium', 'Product SKU is missing from the supplied product record.', 'Map the sellable SKU into the product feed and Product structured data.'));
    if (!clean(page.availability)) findings.push(finding(page, 'product-availability', 'high', 'Product availability is missing from the supplied product record.', 'Expose a current availability value in the product feed and Product structured data.'));
    if (clean(page.price) && !clean(page.currency)) findings.push(finding(page, 'offer-currency', 'high', 'Product price has no ISO currency code.', 'Supply an ISO 4217 currency in the product feed and Offer JSON-LD for this market.'));
    if (Number(page.variantCount) > 1 && Number(page.variantSkuCoverage) < Number(page.variantCount)) findings.push(finding(page, 'variant-sku-coverage', 'high', `Only ${page.variantSkuCoverage || 0} of ${page.variantCount} variants have mapped SKUs.`, 'Map every sellable variant SKU to the feed and Product structured data before publishing.'));
    if (page.outOfStock === true && page.indexable !== false && !clean(page.stockAction)) findings.push(finding(page, 'out-of-stock-policy', 'low', 'Out-of-stock product has no supplied retention or replacement action.', 'Review whether to retain the URL with alternatives, redirect a discontinued product, or apply noindex based on replacement value.'));
  }
  if (clean(page.market) && Number(page.hreflangCount) === 0) findings.push(finding(page, 'hreflang-coverage', 'high', `No hreflang alternates were supplied for the ${page.market} market URL.`, 'Add reciprocal hreflang annotations for each supported market and one x-default fallback.'));
  if (!page.inSitemap) findings.push(finding(page, 'sitemap', 'low', 'URL is not present in the supplied XML sitemap inventory.', 'Include the canonical, indexable URL in the sitemap if it is a search landing page.'));
  return findings;
}

function duplicateFindings(pages, field, label) {
  const groups = new Map();
  for (const page of pages) {
    const value = clean(page[field]).toLowerCase();
    if (value) groups.set(value, [...(groups.get(value) ?? []), page]);
  }
  return [...groups.values()].filter(group => group.length > 1).flatMap(group => group.map(page =>
    finding(page, `duplicate-${field}`, 'medium', `${label} duplicates ${group.length - 1} other page(s).`, `Differentiate the ${label.toLowerCase()} so each URL has a distinct search intent.`)
  ));
}

export function auditSite(pages) {
  const cleanPages = Array.isArray(pages) ? pages.filter(page => page && typeof page === 'object') : [];
  const findings = cleanPages.flatMap(auditPage)
    .concat(duplicateFindings(cleanPages, 'title', 'Title'))
    .concat(duplicateFindings(cleanPages, 'description', 'Meta description'));
  return findings.sort((a, b) => SEVERITY[b.severity] - SEVERITY[a.severity] || a.url.localeCompare(b.url));
}

export function summary(findings) {
  return Object.fromEntries(Object.keys(SEVERITY).map(level => [level, findings.filter(item => item.severity === level).length]));
}

export function toCsv(findings) {
  const escape = value => `"${String(value).replaceAll('"', '""')}"`;
  return ['severity,rule,url,message,recommendation', ...findings.map(row => [row.severity, row.rule, row.url, row.message, row.recommendation].map(escape).join(','))].join('\n');
}
