// npm run py:vendor — copies the pinned Pyodide core from node_modules and downloads the wheels the live demos use,
// checking each wheel against the SHA-256 in Pyodide's own lock file. Writes manifest.json next to them.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = '0.29.5';
const CORE = ['pyodide.mjs', 'pyodide.mjs.map', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
const WHEELS = ['pydantic', 'pydantic-core', 'typing-extensions', 'annotated-types', 'typing-inspection', 'sqlite3'];
const src = 'node_modules/pyodide', out = `public/assets/vendor/pyodide/${VERSION}`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const installed = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8')).version;
if (installed !== VERSION) throw Error(`node_modules/pyodide is ${installed}, expected ${VERSION}`);
mkdirSync(out, { recursive: true });
const files = [];
for (const name of CORE) {
  copyFileSync(join(src, name), join(out, name));
  const bytes = readFileSync(join(out, name));
  files.push({ name, bytes: bytes.length, sha256: sha(bytes), source: `npm:pyodide@${VERSION}/${name}` });
}
const lock = JSON.parse(readFileSync(join(out, 'pyodide-lock.json'), 'utf8'));
for (const pkg of WHEELS) {
  const entry = lock.packages[pkg];
  const url = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/${entry.file_name}`;
  const res = await fetch(url);
  if (!res.ok) throw Error(`${url}: ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (sha(bytes) !== entry.sha256) throw Error(`${entry.file_name}: SHA-256 differs from pyodide-lock.json`);
  writeFileSync(join(out, entry.file_name), bytes);
  files.push({ name: entry.file_name, bytes: bytes.length, sha256: entry.sha256, source: url, package: pkg });
}
// Licence notices travel with the files: Pyodide is MPL-2.0, the bundled standard library is under the PSF licence.
for (const [name, url] of [
  // jsDelivr's GitHub mirror serves the tagged files; unlike raw.githubusercontent.com it is reachable without a proxy.
  ['LICENSE-pyodide.txt', `https://cdn.jsdelivr.net/gh/pyodide/pyodide@${VERSION}/LICENSE`],
  ['LICENSE-python.txt', `https://cdn.jsdelivr.net/gh/python/cpython@v${lock.info.python}/LICENSE`],
]) {
  const res = await fetch(url);
  if (!res.ok) throw Error(`${url}: ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(out, name), bytes);
  files.push({ name, bytes: bytes.length, sha256: sha(bytes), source: url });
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ version: VERSION, python: lock.info.python, packages: ['pydantic', 'sqlite3'], files }, null, 2) + '\n');
console.log(`${files.length} files, ${(files.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1)} MB`);
