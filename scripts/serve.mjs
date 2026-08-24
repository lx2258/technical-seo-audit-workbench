import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
const root = 'dist'; const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json' };
createServer((req, res) => { const path = normalize(join(root, req.url === '/' ? 'index.html' : req.url)).replace(/^\.\.(\\|\/|$)/, ''); if (!existsSync(path)) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, {'Content-Type': `${types[extname(path)] ?? 'application/octet-stream'}; charset=utf-8`}); createReadStream(path).pipe(res); }).listen(4173, () => console.log('http://localhost:4173'));
