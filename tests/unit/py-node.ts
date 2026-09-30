// Boots the self-hosted Pyodide in Node with the vendored engine and the site's bridges mounted — the same
// files, loaded by the same py-core.mjs, as the browser worker.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as core from '../../public/assets/py-core.mjs';

const VENDOR = resolve('public/assets/vendor/pyodide/0.29.5').replace(/\\/g, '/') + '/';
const ENGINE = 'public/assets/py/job-agent/4397ded';
let booted: Promise<any> | null = null;

export function bootNode(): Promise<any> {
  booted ??= (async () => {
    const { loadPyodide } = await import(pathToFileURL(VENDOR + 'pyodide.mjs').href);
    const py = await core.boot(loadPyodide, VENDOR);
    const manifest = JSON.parse(readFileSync(`${ENGINE}/manifest.json`, 'utf8'));
    core.mount(py, manifest.files.filter((f: { path: string }) => f.path.endsWith('.py'))
      .map((f: { path: string }) => ({ path: f.path, bytes: readFileSync(`${ENGINE}/${f.path}`) })));
    core.mount(py, [{ path: 'career_bridge.py', bytes: readFileSync('public/assets/py/career_bridge.py') }]);
    return py;
  })();
  return booted;
}
