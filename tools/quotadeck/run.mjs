// npm run quotadeck:shots — needs QUOTADECK_ROOT pointing at a QuotaDeck checkout with node_modules installed.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.env.QUOTADECK_ROOT;
if (!root) { console.error('Set QUOTADECK_ROOT to the QuotaDeck repository (e.g. C:\\Users\\yoshi\\Documents\\ChatGPT\\额度显示器).'); process.exit(1); }
const out = resolve('public/media/quota-deck');
mkdirSync(out, { recursive: true });
const env = { ...process.env, QUOTADECK_ROOT: root, QUOTADECK_SHOTS_OUT: out };
delete env.ELECTRON_RUN_AS_NODE; // editors such as VS Code set it, which would run Electron as plain Node
const bin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
const r = spawnSync(`"${bin}" "${resolve('tools/quotadeck/shots.cjs')}"`, { env, stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
