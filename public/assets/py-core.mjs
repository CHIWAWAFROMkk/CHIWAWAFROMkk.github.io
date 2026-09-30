// Shared by the browser worker (py-worker.js) and the Node unit tests: boots Pyodide, loads the packages the engine
// imports, mounts Python sources, and calls bridge functions that take and return JSON strings.
export const PYODIDE = '/assets/vendor/pyodide/0.29.5/';
export const PACKAGES = ['pydantic', 'sqlite3'];
const HOME = '/home/pyodide/';

export async function boot(loadPyodide, indexURL, onStep = () => {}) {
  let t = performance.now();
  const py = await loadPyodide({ indexURL });
  onStep('runtime', { ms: performance.now() - t, python: py.runPython('import sys; sys.version.split()[0]') });
  t = performance.now();
  await py.loadPackage(PACKAGES, { messageCallback: () => {}, errorCallback: () => {} });
  onStep('packages', { ms: performance.now() - t });
  return py;
}

/** Writes files under the Python working directory, which is on sys.path. */
export function mount(py, files) {
  for (const { path, bytes } of files) {
    const full = HOME + path;
    py.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
    py.FS.writeFile(full, bytes);
  }
}

export function call(py, module, fn, args) {
  const f = py.pyimport(module)[fn];
  try { return JSON.parse(f(...args.map(a => JSON.stringify(a)))); }
  finally { f.destroy?.(); }
}
