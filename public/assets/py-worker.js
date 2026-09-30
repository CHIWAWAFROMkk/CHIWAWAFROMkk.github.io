// Python runtime worker for the live demos: boots the self-hosted Pyodide, mounts the Python sources the page names,
// and answers calls. Progress numbers are measured (Resource Timing, performance.now), never estimated.
addEventListener('unhandledrejection', e => e.preventDefault());
let py, core, seen = 0;
const transferred = () => {
  const total = performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0), 0);
  const delta = total - seen; seen = total; return delta;
};
const lastLine = e => String((e && e.message) || e).trim().split('\n').filter(Boolean).pop();
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
