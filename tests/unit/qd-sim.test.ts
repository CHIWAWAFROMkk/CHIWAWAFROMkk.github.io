import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { loadQuotaDeck, QD_DIR, HISTORY_FILE, historyFor } from '../../src/scripts/qd-load';
import {
  H, M, WIN, REFRESH, BIG_TASK, START, PROVIDER_IDS, DEMO_OUTPUT, createSim, claudeRaw, antigravityRaw,
  agentPhase, collabEnd, collabResult,
} from '../../src/scripts/qd-sim';

const ROOT = process.env.QUOTADECK_ROOT ?? 'C:/Users/yoshi/Documents/ChatGPT/额度显示器';
const load = (clock: { now: number }) => loadQuotaDeck(async p => readFileSync(`public${QD_DIR}${p}`, 'utf8'), clock);

describe('the clock and the usage model', () => {
  it('drains, then resets a lane to 100 when its window ends, and marks the reset', () => {
    const sim = createSim();
    const claude = sim.lanes.find(l => l.id === 'claude')!, at = claude.reset;
    const seen: string[] = [];
    while (sim.t < at + M) seen.push(...sim.step(20_000, 0));
    expect(seen).toContain('claude');
    expect(claude.reset).toBe(at + WIN);
    expect(claude.rem).toBeGreaterThan(99);
    expect(sim.marks.some(m => m.id === 'claude' && m.t >= at)).toBe(true);
  });
  it('a big task takes 24 points from Codex over a moment of real time', () => {
    const sim = createSim(), codex = sim.lanes[0], before = codex.rem;
    sim.bigTask();
    for (let k = 0; k < 60; k++) sim.step(10, 16);           // about a second of real time, 0.6 s of simulated time
    expect(before - codex.rem).toBeGreaterThan(BIG_TASK - 0.5);
    expect(before - codex.rem).toBeLessThan(BIG_TASK + 0.5);
  });
  it('seeds ten hours of history so the timeline is never empty', () => {
    const sim = createSim();
    for (const l of sim.lanes) expect(l.hist[0].t).toBeLessThanOrEqual(START - 10 * H);
  });
  it('builds a snapshot for every provider QuotaDeck reads, in its order', () => {
    const sim = createSim();
    expect(PROVIDER_IDS.map(id => (sim.raw(id) as { id: string }).id)).toEqual(['codex', 'claude', 'antigravity', 'deepseek', 'workbuddy']);
  });
});

describe('the collaboration state flow', () => {
  it('each agent queues, runs, then is done; the run ends when the slowest agent does', () => {
    expect([agentPhase('codex', 0.2), agentPhase('codex', 1), agentPhase('codex', 3.2)]).toEqual(['queue', 'run', 'done']);
    expect(collabEnd(['codex', 'claude', 'antigravity', 'workbuddy'])).toBeCloseTo(5.7, 9);
    expect(collabEnd(['codex', 'workbuddy'])).toBeCloseTo(3.9, 9);
  });
  it('the result has the orchestrator\'s shape and no invented answer', () => {
    const r = collabResult(' 任务 ', ['codex', 'claude'], START);
    expect(r).toEqual({ task: '任务', completedAt: new Date(START).toISOString(), results: [
      { id: 'codex', output: DEMO_OUTPUT, status: 'done' }, { id: 'claude', output: DEMO_OUTPUT, status: 'done' }] });
    expect(DEMO_OUTPUT).toContain('没有调用真实 Agent');
  });
});

describe('snapshots in the exact shape of QuotaDeck\'s own connectors', () => {
  const real = existsSync(join(ROOT, 'src/main/claude-client.cjs'));
  it.skipIf(!real)('Claude Code: equals normalizeClaudeSnapshot(sanitizeClaudePayload(statusLine))', () => {
    const require = createRequire(join(ROOT, 'package.json'));
    const { sanitizeClaudePayload, normalizeClaudeSnapshot } = require('./src/main/claude-client.cjs');
    const sim = createSim(), lane = sim.lanes[1], now = sim.t;
    const statusLine = { model: { id: 'demo', display_name: '演示模型（非真实数据）' }, rate_limits: { five_hour: { used_percentage: 100 - lane.rem, resets_at: lane.reset / 1000 } } };
    expect(claudeRaw(lane, now)).toEqual(normalizeClaudeSnapshot(sanitizeClaudePayload(statusLine, now), now));
  });
  it.skipIf(!real)('Antigravity: equals normalizeAntigravitySnapshot for one pool and two Gemini-family models', () => {
    const require = createRequire(join(ROOT, 'package.json'));
    const { normalizeAntigravitySnapshot } = require('./src/main/antigravity-client.cjs');
    const sim = createSim(), lane = sim.lanes[2], now = sim.t;
    const response = { groups: [{ displayName: 'Gemini Models', buckets: [{ bucketId: '5h', window: '5h', remainingFraction: lane.rem / 100, resetTime: new Date(lane.reset).toISOString() }] }] };
    const models = [{ id: 'gemini-demo-1', name: '演示模型 G1' }, { id: 'gemini-demo-2', name: '演示模型 G2' }];
    expect(antigravityRaw(lane, now)).toEqual(normalizeAntigravitySnapshot(response, models, new Date(now).toISOString()));
  });
});

describe('end to end with QuotaDeck\'s own code', () => {
  it('its history turns the simulated samples into the burn rate and estimate of lines 50–61', async () => {
    const sim = createSim(), clock = { now: sim.t }, m = await load(clock);
    m.configureHistory(HISTORY_FILE);
    const read = m.createProviderReader({ antigravity: async () => sim.raw('antigravity') });
    let p: any;
    for (let k = 0; k < 20; k++) { sim.step(REFRESH, 0); clock.now = sim.t; p = await read('antigravity'); }
    const b = p.groups[0].buckets[0], rows = JSON.parse(m.fs.files.get(HISTORY_FILE)!);
    const first = rows[0], last = rows.at(-1);
    expect(rows).toHaveLength(20);
    expect(b.burnPerHour).toBeCloseTo((first.value - last.value) * 100 / ((last.at - first.at) / H), 9);
    expect(b.estimatedHoursLeft).toBeCloseTo(last.value * 100 / b.burnPerHour, 9);
  });
  it("reads back the series quota-history line 50 uses: before the current sample, at QuotaDeck's own now", async () => {
    const sim = createSim(), clock = { now: sim.t }, m = await load(clock);
    m.configureHistory(HISTORY_FILE);
    const read = m.createProviderReader({ antigravity: async () => sim.raw('antigravity') });
    let p: any;
    for (let k = 0; k < 30; k++) { sim.step(REFRESH + 0.4, 0); clock.now = sim.t; p = await read('antigravity'); }   // frame times are fractional
    const now = Date.parse(p.updatedAt), h = historyFor(m.fs.files.get(HISTORY_FILE), 'antigravity', p.groups[0].buckets[0], now);
    expect(h.all).toHaveLength(30);
    expect(h.series).toHaveLength(29);
    expect(h.series.every(r => r.at < now && r.at >= now - H)).toBe(true);
  });
  it('every provider snapshot goes through providerToUi without an unknown or NaN', async () => {
    const sim = createSim(), m = await load({ now: sim.t });
    const ui = m.toUiSnapshot({ updatedAt: new Date(sim.t).toISOString(), providers: PROVIDER_IDS.map(id => sim.raw(id)) });
    expect(JSON.stringify(ui)).not.toMatch(/NaN|undefined|未知数据源/);
    expect(ui.providers.map((p: any) => p.status)).toEqual(['healthy', 'healthy', 'healthy', 'healthy', 'stale']);
  });
});
