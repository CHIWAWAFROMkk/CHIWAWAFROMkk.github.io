import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadQuotaDeck, QD_DIR, HISTORY_FILE, type Clock } from '../../src/scripts/qd-load';

const H = 3_600_000, M = 60_000;
const T0 = new Date(2026, 9, 5, 9, 0, 0).getTime();
const load = (clock: Clock) => loadQuotaDeck(async p => readFileSync(`public${QD_DIR}${p}`, 'utf8'), clock);
const iso = (ms: number) => new Date(ms).toISOString();
/** An Antigravity snapshot in the shape QuotaDeck's connector normalises to (one shared pool, one 5-hour bucket). */
const agy = (now: number, fraction: number, reset: number, extra: object = {}) => ({
  id: 'antigravity', name: 'Antigravity', status: 'healthy', source: 'Antigravity 本机官方接口', precision: 'provider-reported', updatedAt: iso(now),
  remainingPercent: fraction * 100, groups: [{ displayName: 'Gemini Models', buckets: [{ bucketId: '5h', window: '5h', remainingFraction: fraction, resetTime: iso(reset) }] }],
  models: [], quotaNote: '0 个模型 · 1 个共享额度池', note: '', ...extra,
});

describe('QuotaDeck main-process code, run in the page', () => {
  it('runs its own providerToUi, with relative resets measured on the simulated clock', async () => {
    const clock = { now: T0 }, m = await load(clock);
    const ui = m.providerToUi({ id: 'codex', name: 'Codex', status: 'healthy', precision: 'provider-reported', updatedAt: iso(T0), remainingPercent: 62,
      windows: [{ label: '5 小时', windowDurationMins: 300, remainingPercent: 62, resetsAt: iso(T0 + 2 * H) }],
      models: [{ id: 'a', name: '演示模型 A', pool: 'shared', poolLabel: 'Codex 共享额度' }] });
    expect(ui.quotaHero).toBe('62.0%');
    expect(ui.gauge).toMatchObject({ kind: 'window', provenance: 'live', remainingPercent: 62 });
    expect(ui.models[0].reset).toBe('2h 后重置');
    clock.now = T0 + 90 * M;
    expect(m.relativeReset(iso(T0 + 2 * H))).toBe('30m 后重置');
  });
  it('every account reader refuses; nothing reads the visitor\'s machine', async () => {
    const m = await load({ now: T0 });
    for (const id of ['codex', 'claude', 'antigravity', 'deepseek', 'workbuddy']) expect((await m.readProvider(id)).status, id).toBe('error');
  });
  it('samples Antigravity with its own history and estimates the burn under the simulated clock', async () => {
    const clock = { now: T0 }, m = await load(clock), reset = T0 + 6 * H;
    m.configureHistory(HISTORY_FILE);
    let value = 0.6, p: any;
    const read = m.createProviderReader({ antigravity: async () => agy(clock.now, value, reset) });
    for (let k = 0; k < 7; k++) { clock.now = T0 + k * M; value = 0.6 - k * 0.002; p = await read('antigravity'); }
    const b = p.groups[0].buckets[0];
    expect(b.burnPerHour).toBeCloseTo((0.6 - 0.588) * 100 / 0.1, 9);
    expect(b.estimatedHoursLeft).toBeCloseTo(58.8 / b.burnPerHour, 9);
    expect(JSON.parse(m.fs.files.get(HISTORY_FILE)!)).toHaveLength(7);
  });
  it('an account scope is refused loudly instead of being hashed', async () => {
    const clock = { now: T0 }, m = await load(clock);
    m.configureHistory(HISTORY_FILE);
    const read = m.createProviderReader({ antigravity: async () => agy(T0, 0.5, T0 + H, { historyScope: 'someone@example.com' }) });
    expect((await read('antigravity')).historyWarning).toBe('历史记录保存失败，消耗趋势暂不可用');
  });
  it('toUiSnapshot stamps the simulated time', async () => {
    const m = await load({ now: T0 });
    expect(m.toUiSnapshot({ updatedAt: iso(T0), providers: [] }).lastUpdated).toBe('09:00');
  });
});
