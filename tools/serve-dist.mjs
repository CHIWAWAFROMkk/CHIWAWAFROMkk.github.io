// Minimal static server for dist/ that behaves like GitHub Pages: directory index,
// trailing-slash redirect, 404.html with status 404, and byte ranges for video.
// Used by Playwright so a hand-started `astro preview` can stay open. Usage: node tools/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.argv[2] ?? 4399);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.sql': 'text/plain; charset=utf-8',
  '.zip': 'application/zip', '.sqlite': 'application/octet-stream', '.py': 'text/plain; charset=utf-8',
};

const isFile = p => existsSync(p) && statSync(p).isFile();

function send(res, file, status = 200, range) {
  const size = statSync(file).size;
  const headers = { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes' };
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (m && status === 200) {
    const start = m[1] ? Number(m[1]) : size - Number(m[2]);
    const end = m[1] && m[2] ? Number(m[2]) : size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(status, { ...headers, 'Content-Length': size });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  const target = join(root, path);
  if (!target.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (isFile(target)) return send(res, target, 200, req.headers.range);
  if (isFile(join(target, 'index.html'))) {
    if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: `${url.pathname}/${url.search}` }); return res.end(); }
    return send(res, join(target, 'index.html'));
  }
  send(res, join(root, '404.html'), 404);
}).listen(port, () => console.log(`serving dist on http://localhost:${port}/`));
