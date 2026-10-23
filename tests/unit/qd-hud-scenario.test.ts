import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadHudMain, QD_HUD_DIR, type HudMain } from '../../src/scripts/qd-hud-load';
import { LOOP_MS, BEATS, APPROVAL_ID, eventsBetween, approvalsAt, keyframeAt, tokensAt, noteAt, hintAt } from '../../src/scripts/qd-hud-scenario';
import fixture from '../../src/data/qd-hud-fixture.json';

const base = fixture.base;
let main: HudMain;
beforeAll(async () => { main = await loadHudMain(p => readFile(`public${QD_HUD_DIR}${p}`, 'utf8')); });

/** Plays the scenario into the real tracker in 1 s steps up to `until`, deciding the approval at `decideAt`. */
function play(until: number, decision: 'allow' | 'deny' | null = null, decideAt = Infinity) {
  const tracker = main.tracker.createSessionTracker({ startedAt: base });
  let prev = -1;
  for (let t = 0; t <= until; t = Math.min(until, t + 1000)) {
    for (const { vendor, event } of eventsBetween(prev, t, base)) tracker.ingest(vendor, event);
    tracker.setApprovals(approvalsAt(t, base, t >= decideAt ? decision : null));
    prev = t;
    if (t === until) break;
  }
  return tracker.snapshot(base + until);
}
const kinds = (s: ReturnType<typeof play>, vendor: string) => s.alerts.filter(a => a.vendor === vendor).map(a => a.kind);

describe('QuotaDeck demo scenario', () => {
  it('beats run 0–90 s in order', () => {
    expect(LOOP_MS).toBe(90_000);
    expect(BEATS.map(b => [b.id, b.at])).toEqual([['start', 0], ['claude-done', 12000], ['codex-start', 20000], ['approval', 32000], ['codex-done', 50000], ['tokens', 70000], ['loop', 90000]]);
  });
  it('12.5 s: Claude has finished a turn — done, with a reply alert', () => {
    const s = play(12500);
    expect(s.vendors.claude.phase).toBe('done');
    expect(kinds(s, 'claude')).toContain('reply');
  });
  it('32.5 s: an approval request is waiting', () => {
    expect(play(32500).alerts.some(a => a.kind === 'approval' && a.id === `approval:${APPROVAL_ID}`)).toBe(true);
  });
  it('once allowed, the approval request is gone', () => {
    expect(play(32500, 'allow', 32500).alerts.some(a => a.kind === 'approval')).toBe(false);
  });
  it('50.5 s: Claude waits on a 30 s command, Codex has replied', () => {
    const s = play(50500, 'deny', 33000);
    expect(kinds(s, 'claude')).toContain('waiting');
    expect(kinds(s, 'codex')).toContain('reply');
  });
  it('keyframes switch at 20, 45 and 70 s', () => {
    expect([0, 19999, 20000, 44999, 45000, 70000, 89999].map(keyframeAt)).toEqual([0, 0, 1, 1, 2, 3, 3]);
  });
  it('a new token bar grows at 70 s', () => {
    const before = tokensAt(69999, fixture.tokens), after = tokensAt(70000, fixture.tokens);
    expect(after.claude.buckets.at(-1)! - before.claude.buckets.at(-1)!).toBe(240000);
    expect(after.claude.total - before.claude.total).toBe(240000);
    expect(before.claude.buckets).toEqual(fixture.tokens.claude.buckets);
  });
  it('the hint appears 20 s after the request if nobody has answered', () => {
    expect([hintAt(51999, null), hintAt(52000, null), hintAt(52000, 'deny')]).toEqual([false, true, false]);
  });
  it('the note follows the latest beat', () => {
    expect(noteAt(11999).en).toMatch(/^0 s/);
    expect(noteAt(12000).en).toMatch(/^12 s/);
  });
  it('every event falls inside the loop', () => {
    const all = eventsBetween(-1, LOOP_MS, base);
    expect(all.length).toBeGreaterThan(8);
    for (const { event } of all) expect((event.at as number) - base).toBeGreaterThanOrEqual(0);
    for (const { event } of all) expect((event.at as number) - base).toBeLessThanOrEqual(LOOP_MS);
  });
});
