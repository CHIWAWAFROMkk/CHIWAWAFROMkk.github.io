// Python runtime worker for the live demos: boots the self-hosted Pyodide, mounts the Python sources the page names,
// and answers calls. Progress numbers are measured (Resource Timing, performance.now), never estimated.
let py, core, seen = 0, booted = false;
const transferred = () => {
  const total = performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0), 0);
  const delta = total - seen; seen = total; return delta;
};
const lastLine = e => String((e && e.message) || e).trim().split('\n').filter(Boolean).pop();
// Pyodide 0.29.5 only warns when the runtime cannot be fetched or instantiated, and loadPyodide never settles. Before
// the engine is ready, treat that warning (and any stray rejection) as a boot failure so the page can fall back now
// instead of waiting for its timeout.
const bootFailed = message => { if (!booted) postMessage({ type: 'error', id: null, message }); };
const warn = console.warn.bind(console);
console.warn = (...args) => { warn(...args); if (/wasm instantiation failed/i.test(args.join(' '))) bootFailed('wasm instantiation failed'); };
addEventListener('unhandledrejection', e => { e.preventDefault(); bootFailed(lastLine(e.reason)); });
const CORE = ['pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip'];
async function bytesOf(url) {
  const r = await fetch(url);
  if (!r.ok) throw Error(`${url}: HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
onmessage = async ({ data: m }) => {
  try {
    if (m.type === 'boot') {
      const t0 = performance.now();
      core = await import('./py-core.mjs');
      // A cheap existence check first: a blocked or missing core file fails here at once.
      for (const f of CORE) {
        const r = await fetch(core.PYODIDE + f, { method: 'HEAD' });
        if (!r.ok) throw Error(`${f}: HTTP ${r.status}`);
      }
      const { loadPyodide } = await import(core.PYODIDE + 'pyodide.mjs');
      transferred();
      py = await core.boot(loadPyodide, core.PYODIDE, (step, info) =>
        postMessage({ type: 'progress', step, ms: info.ms, bytes: transferred(), detail: info.python || core.PACKAGES.join(' · ') }));
      const t = performance.now(), modules = [];
      for (const bundle of m.bundles) {
        const manifest = await (await fetch(bundle + 'manifest.json')).json();
        const files = manifest.files.filter(f => f.path.endsWith('.py'));
        core.mount(py, await Promise.all(files.map(async f => ({ path: f.path, bytes: await bytesOf(bundle + f.path) }))));
        modules.push(...files.map(f => f.path.replace(/\.py$/, '').replace(/\//g, '.').replace(/\.__init__$/, '')));
      }
      for (const url of m.files) core.mount(py, [{ path: url.slice(url.lastIndexOf('/') + 1), bytes: await bytesOf(url) }]);
      for (const name of m.imports) py.pyimport(name);
      postMessage({ type: 'progress', step: 'sources', ms: performance.now() - t, bytes: transferred(), detail: String(modules.length), modules });
      booted = true;
      postMessage({ type: 'ready', python: py.runPython('import sys; sys.version.split()[0]'), pyodide: py.version, ms: performance.now() - t0 });
    } else if (m.type === 'call') {
      if (!py) throw Error('运行时尚未就绪');
      const t = performance.now();
      const value = core.call(py, m.module, m.fn, m.args);
      postMessage({ type: 'result', id: m.id, value, ms: performance.now() - t });
    }
  } catch (e) {
    postMessage({ type: 'error', id: m.id ?? null, message: lastLine(e) });
  }
};
