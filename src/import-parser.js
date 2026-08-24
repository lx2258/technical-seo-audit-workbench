const clean = value => String(value ?? '').trim();

function csvRows(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') { if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; }
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && text[index + 1] === '\n') index += 1; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(row => row.some(value => clean(value)));
}

const aliases = { url:['url','address'], status:['status','status code'], indexable:['indexable','indexability'], canonical:['canonical','canonical link element 1'], title:['title','title 1'], description:['description','meta description 1'], h1:['h1','h1-1'], robots:['robots','meta robots 1'], html:['html','html snapshot','raw html'] };
const field = (row, headers, names) => { const index = headers.findIndex(header => names.includes(header)); return index < 0 ? '' : clean(row[index]); };

export function parseCrawlInput(value) {
  const text = clean(value);
  if (!text) throw new Error('Paste JSON or CSV crawl data first.');
  if (text.startsWith('[')) { const rows = JSON.parse(text); if (!Array.isArray(rows)) throw new Error('The JSON input must be an array of page rows.'); return rows; }
  const [headerRow, ...dataRows] = csvRows(text);
  if (!headerRow) throw new Error('The CSV file has no header row.');
  const headers = headerRow.map(value => clean(value).toLowerCase());
  if (!headers.some(header => aliases.url.includes(header))) throw new Error('CSV requires an Address or URL column.');
  return dataRows.map(row => {
    const values = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, field(row, headers, names)]));
    const parsed = { url: values.url, status: values.status ? Number(values.status) : undefined, indexable: values.indexable ? !/non-indexable|noindex/i.test(values.indexable) : undefined, canonical: values.canonical, title: values.title, description: values.description, h1: values.h1, robots: values.robots, pageType: /\/products?\//i.test(values.url) ? 'product' : /\/collections?\//i.test(values.url) ? 'collection' : 'page' };
    return values.html ? { ...parsed, html: values.html } : parsed;
  }).filter(row => row.url);
}
