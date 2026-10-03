// Shared by the browser worker (py-worker.js) and the Node unit tests: boots Pyodide, installs the packages a page asks
// for, mounts Python sources, and calls bridge functions that take and return JSON strings.
export const PYODIDE = '/assets/vendor/pyodide/0.29.5/';
export const PACKAGES = ['pydantic', 'sqlite3'];
const HOME = '/home/pyodide/';

export async function boot(loadPyodide, indexURL, onStep = () => {}, packages = PACKAGES) {
  let t = performance.now();
  const py = await loadPyodide({ indexURL });
  onStep('runtime', { ms: performance.now() - t, python: py.runPython('import sys; sys.version.split()[0]') });
  if (packages.length) {
    t = performance.now();
    await py.loadPackage(packages, { messageCallback: () => {}, errorCallback: () => {} });
    onStep('packages', { ms: performance.now() - t });
  }
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

/** Calls module.fn with every argument as a JSON string and parses the JSON it returns. With emit, a streaming bridge
 *  function also gets a callback, which it calls with one JSON string per event; emit receives each event parsed. */
export function call(py, module, fn, args, emit) {
  const f = py.pyimport(module)[fn];
  const json = args.map(a => JSON.stringify(a));
  try { return JSON.parse(emit ? f(...json, s => emit(JSON.parse(s))) : f(...json)); }
  finally { f.destroy?.(); }
}
