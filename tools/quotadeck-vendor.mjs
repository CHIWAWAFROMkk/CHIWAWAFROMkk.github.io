// npm run quotadeck:vendor — copies QuotaDeck's tray interface and its quota logic, unmodified, at one public commit.
// Files are read from the git object store (not the working tree), so a local edit can never slip in.
// Usage: QUOTADECK_ROOT=<quota-deck checkout at the commit below> npm run quotadeck:vendor
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const COMMIT = 'e9557c62f00a085299e5d3d06e9259ed19688ef8';
const FILES = ['src/renderer/compact.html', 'src/renderer/compact.css', 'src/renderer/compact.js',
  'src/main/snapshot.cjs', 'src/main/quota-history.cjs', 'src/main/model-guidance.cjs', 'LICENSE'];

const root = process.env.QUOTADECK_ROOT;
if (!root) { console.error('Set QUOTADECK_ROOT to a checkout of https://github.com/CHIWAWAFROMkk/quota-deck'); process.exit(1); }
const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== COMMIT) { console.error(`The checkout is at ${head}; run: git -C "${root}" checkout ${COMMIT}`); process.exit(1); }
const version = JSON.parse(execFileSync('git', ['-C', root, 'show', `${COMMIT}:package.json`], { encoding: 'utf8' })).version;
const out = `public/assets/quotadeck/${COMMIT.slice(0, 7)}`;
const files = FILES.map(path => {
  const bytes = execFileSync('git', ['-C', root, 'show', `${COMMIT}:${path}`], { maxBuffer: 1 << 24 });
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), bytes);
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ repository: 'https://github.com/CHIWAWAFROMkk/quota-deck', commit: COMMIT, version, files }, null, 2) + '\n');
console.log(`${files.length} files → ${out}`);
