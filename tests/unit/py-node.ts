// Boots the self-hosted Pyodide in Node with the same files, loaded by the same py-core.mjs, as the browser worker:
// bootNode() for the job agent page (vendored engine + career bridge), bootCampus() for the campus page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as core from '../../public/assets/py-core.mjs';
import { CAMPUS_RUNTIME } from '../../src/scripts/campus-flow';

const VENDOR = resolve('public/assets/vendor/pyodide/0.29.5').replace(/\\/g, '/') + '/';
const ENGINE = 'public/assets/py/job-agent/4397ded';
let booted: Promise<any> | null = null, campus: Promise<any> | null = null;

async function load(packages?: string[]): Promise<any> {
  const { loadPyodide } = await import(pathToFileURL(VENDOR + 'pyodide.mjs').href);
  return core.boot(loadPyodide, VENDOR, () => {}, packages);
}

export function bootNode(): Promise<any> {
  booted ??= (async () => {
    const py = await load();
    const manifest = JSON.parse(readFileSync(`${ENGINE}/manifest.json`, 'utf8'));
    core.mount(py, manifest.files.filter((f: { path: string }) => f.path.endsWith('.py'))
      .map((f: { path: string }) => ({ path: f.path, bytes: readFileSync(`${ENGINE}/${f.path}`) })));
    core.mount(py, [{ path: 'career_bridge.py', bytes: readFileSync('public/assets/py/career_bridge.py') }]);
    return py;
  })();
  return booted;
}

/** The campus page's runtime: no packages, and the very files the page names (served from public/). */
export function bootCampus(): Promise<any> {
  campus ??= (async () => {
    const py = await load(CAMPUS_RUNTIME.packages);
    core.mount(py, CAMPUS_RUNTIME.files.map(u => ({ path: u.slice(u.lastIndexOf('/') + 1), bytes: readFileSync(`public${u}`) })));
    for (const name of CAMPUS_RUNTIME.imports) py.pyimport(name);
    return py;
  })();
  return campus;
}
