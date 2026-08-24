const clean = value => String(value ?? '').trim();

function flatten(value) {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (!value || typeof value !== 'object') return [];
  return [value, ...flatten(value['@graph'])];
}

function jsonLdNodes(html) {
  const nodes = [];
  const scripts = html.matchAll(/<script\b[^>]*\btype\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try { nodes.push(...flatten(JSON.parse(match[2].trim()))); } catch { /* Ignore malformed captured JSON-LD and report absent evidence. */ }
  }
  return nodes;
}

function isProduct(node) {
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  return types.some(type => clean(type).toLowerCase() === 'product');
}

function terminal(value) {
  const parts = clean(value).split('/');
  return parts.at(-1) || '';
}

function countHreflang(html) {
  let count = 0;
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const markup = tag[0];
    const rel = /\brel\s*=\s*(["'])(.*?)\1/i.exec(markup)?.[2] ?? '';
    if (/\balternate\b/i.test(rel) && /\bhreflang\s*=/i.test(markup)) count += 1;
  }
  return count;
}

export function enrichPageWithEvidence(page) {
  const html = clean(page.html ?? page.htmlSnapshot ?? page.rawHtml);
  if (!html) return page;
  const product = jsonLdNodes(html).find(isProduct);
  const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers ?? {};
  return {
    ...page,
    html,
    productSchema: Boolean(product),
    sku: clean(product?.sku ?? page.sku),
    price: clean(offer.price ?? page.price),
    currency: clean(offer.priceCurrency ?? page.currency),
    availability: terminal(offer.availability ?? page.availability),
    hreflangCount: countHreflang(html)
  };
}
