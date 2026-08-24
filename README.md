# Cross-Border 3C SEO Audit Workbench

A local-first portfolio project for reviewing crawl exports. It translates page-level crawl data into an explicit technical SEO backlog rather than making ranking promises.

## What it demonstrates

- Auditing indexability, canonical consistency, HTTP status, robots directives, title, meta description, H1, sitemap presence and duplicate metadata.
- 3C catalog checks for Product structured data, sellable SKU, availability and paginated collection canonicals.
- Severity scoring with a transparent explanation and a concrete next action.
- Local JSON import and client-side CSV export. Crawl data stays in the browser.
- A deliberately bounded data contract: this is an audit workbench, not a crawler or a Google Search Console substitute.

## Run it

```bash
npm test
npm run build
npm start
```

Open `http://localhost:4173`. Use **Load 3C sample** or import a JSON array matching the sample schema.

## Example input

```json
[{"url":"https://shop.example/products/65w-gan-charger","status":200,"indexable":true,"canonical":"https://shop.example/products/65w-gan-charger","robots":"index,follow","title":"65W GaN USB-C Charger","description":"Compact travel charger.","h1":"65W GaN USB-C Charger","inSitemap":true,"pageType":"product","productSchema":true,"sku":"CHG-65W-BLK","availability":"InStock"}]
```

## Audit rules

| Signal | Why it matters | Severity |
| --- | --- | --- |
| Non-200 indexable URL | Can waste crawl budget or expose error pages | Critical |
| `noindex` / not indexable | Prevents intended organic landing pages from indexing | Critical |
| Canonical points elsewhere | Consolidation target needs an explicit decision | High |
| Missing title / description / H1 | Weakens page relevance and snippet control | Medium |
| Duplicate title / description | Makes page intent harder to distinguish | Medium |
| Missing sitemap URL | Reduces discoverability signal | Low |
| Missing Product schema or availability | Weakens machine-readable product offer signals | High |
| Missing sellable SKU | Prevents consistent product/feed mapping | Medium |
| Paginated collection canonicalised to page one | Can hide unique collection inventory from indexing | High |

Rule framing follows Google Search Central guidance for [robots directives](https://developers.google.com/search/docs/crawling-indexing/robots/intro) and [canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization). These are implementation references, not a ranking guarantee.

## Source inspiration

Problem scope was reviewed against [tanujrajputdev/shopify-theme-audit-skill](https://github.com/tanujrajputdev/shopify-theme-audit-skill), which documents product schema and Shopify theme checks, and [puneetindersingh/open-seo-crawler](https://github.com/puneetindersingh/open-seo-crawler), a CMS-aware crawler with exportable findings. This repository is an original dependency-free implementation: it audits supplied JSON exports locally and does not connect to a live Shopify store.

## Media attribution

The catalog visual uses [Multi-USB and charger](https://commons.wikimedia.org/wiki/File:Multi-USB_and_charger.jpg) by SD hehua, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Portfolio framing

Built a local-first cross-border 3C SEO audit workbench that converts catalog exports into prioritized product, collection, indexability and metadata remediation tasks; added deterministic tests and browser-verifiable CSV reporting.
