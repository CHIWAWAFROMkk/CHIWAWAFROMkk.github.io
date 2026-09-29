import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const VENDOR = resolve('public/assets/vendor');

/** sql.js in Node. package.json is "type": "module", so require() would load this UMD file as ESM with no exports; run it as CommonJS instead. */
export async function loadSqlJs() {
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', '__dirname', readFileSync(resolve(VENDOR, 'sql-wasm.js'), 'utf8'))(mod, mod.exports, createRequire(import.meta.url), VENDOR);
  return mod.exports({ locateFile: f => resolve(VENDOR, f) });
}
