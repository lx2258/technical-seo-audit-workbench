# Technical SEO Audit Workbench

A local-first portfolio project for reviewing crawl exports. It translates page-level crawl data into an explicit technical SEO backlog rather than making ranking promises.

## What it demonstrates

- Auditing indexability, canonical consistency, HTTP status, robots directives, title, meta description, H1, sitemap presence and duplicate metadata.
- Severity scoring with a transparent explanation and a concrete next action.
- Local JSON import and client-side CSV export. Crawl data stays in the browser.
- A deliberately bounded data contract: this is an audit workbench, not a crawler or a Google Search Console substitute.

## Run it

```bash
npm test
npm run build
npm start
```

Open `http://localhost:4173`. Use **Load sample crawl** or import a JSON array matching the sample schema.

## Example input

```json
[{"url":"https://example.com/products/widget","status":200,"indexable":true,"canonical":"https://example.com/products/widget","robots":"index,follow","title":"Widget","description":"A useful widget.","h1":"Widget","inSitemap":true}]
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

Rule framing follows Google Search Central guidance for [robots directives](https://developers.google.com/search/docs/crawling-indexing/robots/intro) and [canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization). These are implementation references, not a ranking guarantee.

## Source inspiration

Problem scope was validated against [folini/Page-Auditor](https://github.com/folini/Page-Auditor) and [ems-project/web-auditor-playwright](https://github.com/ems-project/web-auditor-playwright). This repository is an original dependency-free implementation, not a fork or code copy.

## Portfolio framing

Built a local technical SEO audit workbench that converts crawl exports into prioritized indexing, canonical, robots and metadata remediation tasks; added deterministic tests and browser-verifiable CSV reporting.
