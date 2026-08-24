import { auditSite, summary, toCsv } from './audit-engine.js';
import { parseCrawlInput } from './import-parser.js';
import { sampleCrawl } from './sample-data.js';

const input = document.querySelector('#crawl-input');
const message = document.querySelector('#message');
const tbody = document.querySelector('#findings');
const summaryNode = document.querySelector('#summary');
const filter = document.querySelector('#severity-filter');
const exportButton = document.querySelector('#export-csv');
const resultCount = document.querySelector('#result-count');
const fileInput = document.querySelector('#crawl-file');
let findings = [];
let statusById = JSON.parse(localStorage.getItem('voltgear-remediation-status') || '{}');

function cell(value, className = '') {
  const node = document.createElement('td');
  node.className = className;
  node.textContent = value;
  return node;
}

function renderRows(visible) {
  tbody.replaceChildren();
  if (!visible.length) { const row = document.createElement('tr'); const empty = cell('No findings for this severity.', 'empty'); empty.colSpan = 5; row.append(empty); tbody.append(row); return; }
  for (const item of visible) {
    const row = document.createElement('tr'); const severity = document.createElement('td'); const badge = document.createElement('span'); badge.className = `badge ${item.severity}`; badge.textContent = item.severity; severity.append(badge);
    const detail = document.createElement('td'); const rule = document.createElement('strong'); rule.textContent = item.rule; const message = document.createElement('span'); message.className = 'detail'; message.textContent = item.message; detail.append(rule, document.createElement('br'), message);
    const statusCell = document.createElement('td'); const select = document.createElement('select'); select.className = 'status-select'; select.setAttribute('aria-label', `Remediation status for ${item.rule}`);
    for (const name of ['Open', 'In progress', 'Validated']) { const option = document.createElement('option'); option.value = name; option.textContent = name; select.append(option); }
    select.value = statusById[item.id] || 'Open'; select.addEventListener('change', () => { statusById[item.id] = select.value; localStorage.setItem('voltgear-remediation-status', JSON.stringify(statusById)); }); statusCell.append(select);
    row.append(severity, cell(item.url, 'url'), detail, cell(item.recommendation, 'detail'), statusCell); tbody.append(row);
  }
}

function render() {
  const selected = filter.value;
  const visible = selected === 'all' ? findings : findings.filter(item => item.severity === selected);
  const counts = summary(findings);
  summaryNode.replaceChildren(...['critical', 'high', 'medium', 'low'].map(level => { const metric = document.createElement('div'); metric.className = `metric ${level}`; const count = document.createElement('strong'); count.textContent = counts[level]; const label = document.createElement('span'); label.textContent = level; metric.append(count, label); return metric; }));
  resultCount.textContent = `${visible.length} finding${visible.length === 1 ? '' : 's'}`;
  renderRows(visible);
  exportButton.disabled = findings.length === 0;
}

function runAudit() {
  try {
    const rows = parseCrawlInput(input.value);
    findings = auditSite(rows);
    message.textContent = `Audited ${rows.length} URL${rows.length === 1 ? '' : 's'} locally. ${findings.length} findings need review.`;
    message.className = 'message success';
    render();
  } catch (error) {
    message.textContent = `Could not run audit: ${error.message}`;
    message.className = 'message error';
  }
}

document.querySelector('#load-sample').addEventListener('click', () => { input.value = JSON.stringify(sampleCrawl, null, 2); runAudit(); });
document.querySelector('#run-audit').addEventListener('click', runAudit);
fileInput.addEventListener('change', async () => { const file = fileInput.files?.[0]; if (!file) return; input.value = await file.text(); runAudit(); });
filter.addEventListener('change', render);
exportButton.addEventListener('click', () => {
  const blob = new Blob([toCsv(findings, statusById)], { type: 'text/csv;charset=utf-8' });
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'technical-seo-audit-findings.csv' });
  link.click(); URL.revokeObjectURL(link.href);
});
