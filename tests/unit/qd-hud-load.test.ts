import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadHudMain, QD_HUD_DIR, QD_HUD_MAIN, QD_HUD_COMMIT } from '../../src/scripts/qd-hud-load';
import fixture from '../../src/data/qd-hud-fixture.json';

const fromPublic = (path: string) => readFile(`public${QD_HUD_DIR}${path}`, 'utf8');

describe('QuotaDeck HUD loader', () => {
  it('points at the vendored commit and its four pure modules', () => {
    expect(QD_HUD_COMMIT).toBe(fixture.commit);
    expect(QD_HUD_DIR).toBe('/assets/quotadeck/974c61d/');
    expect(QD_HUD_MAIN).toEqual(['src/main/model-names.cjs', 'src/main/hud-view.cjs', 'src/main/session-tracker.cjs', 'src/main/hud-geometry.cjs']);
  });

  it("runs QuotaDeck's own view code on the fixture: five vendors in order, Claude's weekly 79% is a warning", async () => {
    const { view } = await loadHudMain(fromPublic);
    const items = view.buildHudItems(fixture.keyframes[0].ui, fixture.base);
    expect(items.map(i => i.id)).toEqual(['codex', 'claude', 'antigravity', 'workbuddy', 'deepseek']);
    expect(items.find(i => i.id === 'claude')!.ring.level).toBe('warn');
  });

  it("runs QuotaDeck's own session tracker: a finished turn becomes a reply alert", async () => {
    const { tracker } = await loadHudMain(fromPublic);
    const t = tracker.createSessionTracker({ startedAt: fixture.base });
    const at = fixture.base + 1000;
    t.ingest('claude', { kind: 'meta', sessionId: 'A', at, source: 'claude-vscode' });
    t.ingest('claude', { kind: 'prompt', sessionId: 'A', at, text: 'Build it' });
    t.ingest('claude', { kind: 'turn-end', sessionId: 'A', at: at + 5000, text: 'Done.', error: false, durationMs: 5000 });
    expect(t.snapshot(at + 6000).alerts[0].kind).toBe('reply');
  });

  it('refuses any module outside the four, so nothing can reach the visitor’s machine', async () => {
    const tampered = (path: string) => (path.endsWith('hud-view.cjs') ? Promise.resolve("require('node:fs');") : fromPublic(path));
    await expect(loadHudMain(tampered)).rejects.toThrow('网页演示没有提供模块');
  });
});
