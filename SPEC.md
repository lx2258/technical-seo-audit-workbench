# Technical SEO Audit Workbench

## Objective
Provide a portfolio-ready, local-first technical SEO audit tool. A user can paste a crawl export, identify high-impact indexing and metadata problems, inspect why each finding exists, and download a CSV report. It intentionally does not crawl third-party sites or claim Google Search Console access.

## Stack and Commands
- Node.js 24 native ES modules and `node:test`; no runtime dependencies.
- `npm test` validates deterministic audit rules.
- `npm run build` produces a static `dist/` site.
- `npm start` serves `dist/` at `http://localhost:4173`.

## Structure
- `src/audit-engine.js`: pure validation and report generation.
- `src/sample-data.js`: realistic crawl-export fixture.
- `src/app.js`, `src/styles.css`, `src/index.html`: accessible client interface.
- `test/`: behavior tests.

## Testing Strategy
Unit tests cover required indexing blockers, canonical validation, metadata gaps and duplicate detection. Browser verification covers sample loading, filtering and CSV download affordance.

## Boundaries
- Always: keep input in the browser and expose rule explanations.
- Ask first: add a server, external crawler, analytics or third-party API.
- Never: imply ranking guarantees, access credentials, or upload crawl data.

## Success Criteria
1. Sample and pasted JSON data produce severity-ranked findings.
2. Each finding maps to an observable page field and recommended remediation.
3. CSV export is generated locally.
4. Tests, production build, local browser check and GitHub push are evidenced.
