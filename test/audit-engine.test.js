import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSite, summary, toCsv } from '../src/audit-engine.js';
import { sampleCrawl } from '../src/sample-data.js';

test('prioritizes indexability and status blockers above content gaps', () => {
  const findings = auditSite(sampleCrawl);
  assert.equal(findings[0].severity, 'critical');
  assert.ok(findings.some(item => item.rule === 'http-status' && item.url.endsWith('/sale')));
  assert.ok(findings.some(item => item.rule === 'indexability' && item.url.endsWith('/packing-list')));
});

test('detects canonical, missing metadata and duplicate intent signals', () => {
  const findings = auditSite(sampleCrawl);
  assert.ok(findings.some(item => item.rule === 'canonical' && item.url.endsWith('/trail-packs/45l')));
  assert.ok(findings.some(item => item.rule === 'title' && item.url.endsWith('/packing-list')));
  assert.ok(findings.some(item => item.rule === 'duplicate-title'));
  assert.ok(findings.some(item => item.rule === 'duplicate-description'));
});

test('returns a stable severity summary and CSV safe enough for spreadsheet import', () => {
  const findings = auditSite(sampleCrawl);
  const counts = summary(findings);
  assert.ok(counts.critical >= 2);
  const csv = toCsv(findings);
  assert.match(csv, /^severity,rule,url,message,recommendation/);
  assert.match(csv, /"https:\/\/northstar\.example\/sale"/);
});
