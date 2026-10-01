import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPyRuntime, BOOT_TIMEOUT } from '../../src/scripts/py-runtime';

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  sent: any[] = [];
  terminated = false;
  postMessage(m: unknown) { this.sent.push(m); }
  emit(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
  terminate() { this.terminated = true; }
}
const OPTS = { bundles: ['/assets/py/job-agent/4397ded/'], files: ['/assets/py/career_bridge.py'], imports: ['career_bridge'] };
function setup() {
  const w = new FakeWorker();
  const rt = createPyRuntime({ ...OPTS, makeWorker: () => w as unknown as Worker });
  return { w, rt };
}
afterEach(() => { vi.useRealTimers(); });

describe('py runtime client', () => {
  it('sends the boot request, forwards measured progress and resolves on ready', async () => {
    const { w, rt } = setup();
    const seen: string[] = [];
    const ready = rt.boot(p => seen.push(`${p.step}:${p.bytes}`));
    expect(w.sent[0]).toEqual({ type: 'boot', ...OPTS });
    w.emit({ type: 'progress', step: 'runtime', ms: 900, bytes: 11_000_000, detail: '3.13.2' });
    w.emit({ type: 'progress', step: 'packages', ms: 400, bytes: 2_500_000, detail: 'pydantic · sqlite3' });
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1500 });
    await expect(ready).resolves.toEqual({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1500 });
    expect(seen).toEqual(['runtime:11000000', 'packages:2500000']);
  });
  it('boot times out after the limit and terminates the worker', async () => {
    vi.useFakeTimers();
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    vi.advanceTimersByTime(BOOT_TIMEOUT + 1);
    await expect(ready).rejects.toThrow('timeout');
    expect(w.terminated).toBe(true);
  });
  it('a worker error during boot rejects it', async () => {
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    w.emit({ type: 'error', id: null, message: 'HTTP 404' });
    await expect(ready).rejects.toThrow('HTTP 404');
  });
  it('a worker that cannot be created rejects boot', async () => {
    const rt = createPyRuntime({ ...OPTS, makeWorker: () => { throw new Error('blocked'); } });
    await expect(rt.boot(() => {})).rejects.toThrow('blocked');
  });
  it('calls resolve by id even when answers arrive out of order; an error rejects only its call', async () => {
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1 });
    await ready;
    const a = rt.call('career_bridge', 'run', ['jd', { days: 4 }]);
    const b = rt.call('career_bridge', 'run', ['jd', { days: 3 }]);
    const [ida, idb] = w.sent.slice(1).map(m => m.id);
    w.emit({ type: 'result', id: idb, value: { score: 59 }, ms: 2 });
    w.emit({ type: 'error', id: ida, message: 'ValueError: boom' });
    await expect(b).resolves.toEqual({ value: { score: 59 }, ms: 2 });
    await expect(a).rejects.toThrow('ValueError: boom');
  });
  it('names the packages a page needs in the boot request', async () => {
    const w = new FakeWorker();
    const rt = createPyRuntime({ ...OPTS, packages: [], makeWorker: () => w as unknown as Worker });
    const ready = rt.boot(() => {});
    expect(w.sent[0]).toEqual({ type: 'boot', ...OPTS, packages: [] });
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1 });
    await ready;
  });
  it('streams each pushed event to the call that asked for it, before its result', async () => {
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1 });
    await ready;
    const seen: unknown[] = [];
    const a = rt.call('campus_bridge', 'run_tests', ['test_analysis'], e => seen.push(e));
    const b = rt.call('campus_bridge', 'constructed', ['sample']);
    const [ma, mb] = w.sent.slice(1);
    expect([ma.stream, mb.stream]).toEqual([true, false]);
    w.emit({ type: 'event', id: ma.id, data: { kind: 'start', name: 'test_a' } });
    w.emit({ type: 'event', id: mb.id, data: { kind: 'stray' } });
    w.emit({ type: 'event', id: ma.id, data: { kind: 'ok', name: 'test_a' } });
    w.emit({ type: 'result', id: ma.id, value: { run: 1 }, ms: 1 });
    await expect(a).resolves.toEqual({ value: { run: 1 }, ms: 1 });
    expect(seen).toEqual([{ kind: 'start', name: 'test_a' }, { kind: 'ok', name: 'test_a' }]);
    w.emit({ type: 'result', id: mb.id, value: [], ms: 1 });
    await expect(b).resolves.toEqual({ value: [], ms: 1 });
  });
});
