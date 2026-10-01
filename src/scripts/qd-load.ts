/** QuotaDeck's own main-process code (vendored unmodified at e9557c6), run in the page. snapshot.cjs turns provider
 *  snapshots into what the tray UI draws; quota-history.cjs samples Antigravity and estimates its burn rate. The files
 *  are CommonJS written for Node: this loader evaluates them with the few Node modules they use replaced by browser
 *  stand-ins and with a Date whose now() is the simulated clock. Every account reader is replaced by one that refuses,
 *  and the local-agent check (orchestrator.cjs) is never loaded, so no code path here can read the visitor's machine. */
export const QD_COMMIT = 'e9557c62f00a085299e5d3d06e9259ed19688ef8';
export const QD_DIR = `/assets/quotadeck/${QD_COMMIT.slice(0, 7)}/`;
export const QD_MAIN = ['src/main/snapshot.cjs', 'src/main/quota-history.cjs', 'src/main/model-guidance.cjs'];
/** Where quota-history.cjs keeps its samples (in memory; nothing is stored in the browser). */
export const HISTORY_FILE = '/quotadeck/quota-history.json';

export interface Clock { now: number }

/** The part of node:fs/promises quota-history.cjs uses, kept in a Map. */
export function memoryFs() {
  const files = new Map<string, string>();
  const missing = (p: string) => Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' });
  return {
    files,
    async stat(p: string) { if (!files.has(p)) throw missing(p); return { size: files.get(p)!.length }; },
    async readFile(p: string) { if (!files.has(p)) throw missing(p); return files.get(p)!; },
    async writeFile(p: string, data: string) { files.set(p, String(data)); },
    async mkdir() { /* directories are implicit */ },
    async rename(from: string, to: string) { if (!files.has(from)) throw missing(from); files.set(to, files.get(from)!); files.delete(from); },
  };
}
const pathShim = {
  resolve: (p: string) => (p.startsWith('/') ? p : `/${p}`),
  dirname: (p: string) => p.slice(0, p.lastIndexOf('/')) || '/',
};
const cryptoShim = {
  randomUUID: () => globalThis.crypto.randomUUID(),
  // Only an explicit account scope is hashed; the demo never passes one, so reaching this is a bug worth hearing about.
  createHash() { throw new Error('网页演示从不传入账号范围，不计算账号哈希'); },
};
const refuse = (who: string) => async () => { throw new Error(`${who}：网页演示不读取本机账号`); };
const STUBS: Record<string, unknown> = {
  './codex-client.cjs': { readCodexSnapshot: refuse('Codex') },
  './deepseek-client.cjs': { readDeepSeekSnapshot: refuse('DeepSeek') },
  './workbuddy-client.cjs': { readWorkBuddySnapshot: refuse('WorkBuddy') },
  './antigravity-client.cjs': { readAntigravitySnapshot: refuse('Antigravity') },
  './claude-client.cjs': { readClaudeSnapshot: refuse('Claude Code') },
  './orchestrator.cjs': { localAgentAvailability: () => ({ codex: false, claude: false, antigravity: false, workbuddy: false }) },
};

export interface QuotaDeckMain {
  providerToUi: (provider: object) => any;
  toUiSnapshot: (snapshot: { updatedAt: string; providers: object[] }) => any;
  createProviderReader: (readers: Record<string, () => Promise<object>>) => (id: string) => Promise<any>;
  configureHistory: (file: string) => void;
  readProvider: (id: string) => Promise<any>;
  relativeReset: (value: string | null) => string;
  fs: ReturnType<typeof memoryFs>;
}

export async function loadQuotaDeck(fetchText: (path: string) => Promise<string>, clock: Clock): Promise<QuotaDeckMain> {
  const sources = new Map<string, string>(await Promise.all(QD_MAIN.map(async p => [`./${p.slice(p.lastIndexOf('/') + 1)}`, await fetchText(p)] as [string, string])));
  const fs = memoryFs();
  const SimDate = class extends Date { static now() { return clock.now; } } as DateConstructor;
  const proc = { platform: 'browser', pid: 1, env: {} };
  const node: Record<string, unknown> = { 'node:fs/promises': fs, 'node:path': pathShim, 'node:crypto': cryptoShim };
  const loaded = new Map<string, { exports: any }>();
  const require = (spec: string): any => {
    if (spec in node) return node[spec];
    if (spec in STUBS) return STUBS[spec];
    const source = sources.get(spec);
    if (source === undefined) throw new Error(`网页演示没有提供模块 ${spec}`);
    if (!loaded.has(spec)) {
      const module = { exports: {} as any };
      loaded.set(spec, module);
      new Function('require', 'module', 'exports', 'process', 'Date', `${source}\n//# sourceURL=quotadeck/${spec.slice(2)}`)(require, module, module.exports, proc, SimDate);
    }
    return loaded.get(spec)!.exports;
  };
  const { providerToUi, toUiSnapshot, createProviderReader, configureHistory, readProvider, relativeReset } = require('./snapshot.cjs');
  return { providerToUi, toUiSnapshot, createProviderReader, configureHistory, readProvider, relativeReset, fs };
}

export interface HistoryRow { key: string; at: number; value: number }
/** QuotaDeck's samples for one provider bucket, read back from its own history file: all rows of the bucket's key (for
 *  the timeline) and the series quota-history.cjs line 50 uses at `now` — the rows within the hour before the current
 *  sample, which line 63 pushes only afterwards. `now` must be QuotaDeck's own instant, Date.parse(updatedAt). */
export function historyFor(text: string | undefined, providerId: string, bucket: { bucketId: string; resetTime: string }, now: number) {
  const rows: HistoryRow[] = JSON.parse(text ?? '[]');
  const all = rows.filter(r => { const k = JSON.parse(r.key); return k[1] === providerId && k[3] === bucket.bucketId && k[4] === bucket.resetTime; });
  return { all, series: all.filter(r => r.at >= now - 3_600_000 && r.at < now) };
}
