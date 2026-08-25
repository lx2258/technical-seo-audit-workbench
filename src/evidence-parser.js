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

function attribute(markup, name) {
  return new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(markup)?.[2] ?? '';
}

function textContent(markup) {
  return clean(markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function firstTagText(html, tag) {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(html);
  return match ? textContent(match[1]) : '';
}

function metaContent(html, name) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (attribute(tag, 'name').toLowerCase() === name) return attribute(tag, 'content');
  }
  return '';
}

function canonicalHref(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (/\bcanonical\b/i.test(attribute(tag, 'rel'))) return attribute(tag, 'href');
  }
  return '';
}

export function enrichPageWithEvidence(page) {
  const html = clean(page.html ?? page.htmlSnapshot ?? page.rawHtml);
  if (!html) return page;
  const product = jsonLdNodes(html).find(isProduct);
  const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers ?? {};
  const extracted = {
    ...(firstTagText(html, 'title') ? { title: firstTagText(html, 'title') } : {}),
    ...(metaContent(html, 'description') ? { description: metaContent(html, 'description') } : {}),
    ...(metaContent(html, 'robots') ? { robots: metaContent(html, 'robots') } : {}),
    ...(canonicalHref(html) ? { canonical: canonicalHref(html) } : {}),
    ...(firstTagText(html, 'h1') ? { h1: firstTagText(html, 'h1') } : {})
  };
  return {
    ...page,
    html,
    ...extracted,
    productSchema: Boolean(product),
    sku: clean(product?.sku ?? page.sku),
    price: clean(offer.price ?? page.price),
    currency: clean(offer.priceCurrency ?? page.currency),
    availability: terminal(offer.availability ?? page.availability),
    hreflangCount: countHreflang(html)
  };
}
