import { auditSite, summary, toCsv } from './audit-engine.js';
import { sampleCrawl } from './sample-data.js';

const input = document.querySelector('#crawl-input');
const message = document.querySelector('#message');
const tbody = document.querySelector('#findings');
const summaryNode = document.querySelector('#summary');
const filter = document.querySelector('#severity-filter');
const exportButton = document.querySelector('#export-csv');
const resultCount = document.querySelector('#result-count');
let findings = [];

function render() {
  const selected = filter.value;
  const visible = selected === 'all' ? findings : findings.filter(item => item.severity === selected);
  const counts = summary(findings);
  summaryNode.innerHTML = ['critical', 'high', 'medium', 'low'].map(level => `<div class="metric ${level}"><strong>${counts[level]}</strong><span>${level}</span></div>`).join('');
  resultCount.textContent = `${visible.length} finding${visible.length === 1 ? '' : 's'}`;
  tbody.innerHTML = visible.length ? visible.map(item => `<tr><td><span class="badge ${item.severity}">${item.severity}</span></td><td class="url">${item.url}</td><td><strong>${item.rule}</strong><br><span class="detail">${item.message}</span></td><td class="detail">${item.recommendation}</td></tr>`).join('') : '<tr><td colspan="4" class="empty">No findings for this severity.</td></tr>';
  exportButton.disabled = findings.length === 0;
}

function runAudit() {
  try {
    const rows = JSON.parse(input.value);
    if (!Array.isArray(rows)) throw new Error('The input must be a JSON array of page rows.');
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
filter.addEventListener('change', render);
exportButton.addEventListener('click', () => {
  const blob = new Blob([toCsv(findings)], { type: 'text/csv;charset=utf-8' });
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'technical-seo-audit-findings.csv' });
  link.click(); URL.revokeObjectURL(link.href);
});
