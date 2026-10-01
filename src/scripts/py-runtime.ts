/** Page-side client of public/assets/py-worker.js: one worker per page, a boot timeout, and calls matched by id. */
export interface PyProgress { step: 'runtime' | 'packages' | 'sources'; ms: number; bytes: number; detail: string; modules?: string[] }
export interface PyReady { python: string; pyodide: string; ms: number }
export interface PyRuntimeOptions {
  bundles: string[]; files: string[]; imports: string[];
  /** Pyodide packages to install; left out, the worker installs its default (pydantic, sqlite3). */
  packages?: string[];
  workerUrl?: string; timeoutMs?: number; callTimeoutMs?: number;
  makeWorker?: (url: string) => Worker;
}
export interface PyRuntime {
  boot(onProgress: (p: PyProgress) => void): Promise<PyReady>;
  /** With onEvent the bridge function streams: onEvent gets each event it pushes, in order, before the call resolves. */
  call<T>(module: string, fn: string, args: unknown[], onEvent?: (data: unknown) => void): Promise<{ value: T; ms: number }>;
  dispose(): void;
}

export const BOOT_TIMEOUT = 60_000;

interface Pending { resolve: (v: { value: any; ms: number }) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout>; onEvent?: (data: unknown) => void }

export function createPyRuntime(o: PyRuntimeOptions): PyRuntime {
  let worker: Worker | null = null, seq = 0;
  let booting: { resolve: (r: PyReady) => void; reject: (e: Error) => void; progress: (p: PyProgress) => void } | null = null;
  const pending = new Map<number, Pending>();
  const fail = (e: Error) => {
    booting?.reject(e); booting = null;
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(e); }
    pending.clear();
  };
  const onMessage = ({ data: m }: MessageEvent) => {
    if (m.type === 'progress') booting?.progress(m);
    else if (m.type === 'ready') { booting?.resolve(m); booting = null; }
    else if (m.type === 'event') pending.get(m.id)?.onEvent?.(m.data);
    else if ((m.type === 'result' || m.type === 'error') && m.id != null) {
      const p = pending.get(m.id);
      if (!p) return;
      pending.delete(m.id); clearTimeout(p.timer);
      if (m.type === 'result') p.resolve({ value: m.value, ms: m.ms }); else p.reject(new Error(m.message));
    } else if (m.type === 'error') fail(new Error(m.message));
  };
  return {
    boot(progress) {
      return new Promise<PyReady>((resolve, reject) => {
        const timer = setTimeout(() => { fail(new Error('timeout')); worker?.terminate(); worker = null; }, o.timeoutMs ?? BOOT_TIMEOUT);
        booting = { progress, resolve: r => { clearTimeout(timer); resolve(r); }, reject: e => { clearTimeout(timer); reject(e); } };
        try {
          if (typeof WebAssembly !== 'object') throw new Error('no-webassembly');
          worker = (o.makeWorker ?? (u => new Worker(u)))(o.workerUrl ?? '/assets/py-worker.js');
          worker.onmessage = onMessage;
          worker.onerror = e => { e.preventDefault(); fail(new Error(e.message || 'worker-error')); };
          worker.postMessage({ type: 'boot', bundles: o.bundles, files: o.files, imports: o.imports, packages: o.packages });
        } catch (e) { fail(e instanceof Error ? e : new Error(String(e))); }
      });
    },
    call<T>(module: string, fn: string, args: unknown[], onEvent?: (data: unknown) => void) {
      return new Promise<{ value: T; ms: number }>((resolve, reject) => {
        if (!worker) { reject(new Error('not-ready')); return; }
        const id = ++seq;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout')); }, o.callTimeoutMs ?? 15_000);
        pending.set(id, { resolve, reject, timer, onEvent });
        worker.postMessage({ type: 'call', id, module, fn, args, stream: !!onEvent });
      });
    },
    dispose() { fail(new Error('disposed')); worker?.terminate(); worker = null; },
  };
}
