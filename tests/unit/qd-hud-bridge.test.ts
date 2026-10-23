import { describe, it, expect, vi } from 'vitest';
import { createHudBridge, type BridgeOptions } from '../../src/scripts/qd-hud-bridge';

const sessions = (ids: string[]) => ({ vendors: { claude: { phase: 'asking', running: 1 }, codex: { phase: 'idle', running: 0 } }, alerts: ids.map(id => ({ id, vendor: 'claude', kind: 'approval', sessionId: 'C', at: 0 })) });
function make(over: Partial<BridgeOptions> = {}) {
  const o: BridgeOptions = {
    initial: () => ({ items: [], tokens: null, sessions: sessions([]), gaming: false, layout: { edge: 'right' }, settings: { size: 22 } }),
    normalizeSettings: s => ({ size: 22, ...(s as object) }),
    onSettings: vi.fn(), onApprove: vi.fn(), onDismiss: vi.fn(), onReturn: vi.fn(), onOpenStats: vi.fn(), onAction: vi.fn(),
    ...over,
  };
  return { o, hud: createHudBridge(o) };
}

describe('window.hud for the browser', () => {
  it('delivers pushes to subscribers until they unsubscribe', () => {
    const { hud } = make();
    const seen: unknown[] = [];
    const off = hud.onState(v => seen.push(v));
    hud.push.state([1]);
    off();
    hud.push.state([2]);
    expect(seen).toEqual([[1]]);
  });
  it('initial() resolves to what the page gives it', async () => {
    const { hud } = make();
    expect((await hud.initial()).gaming).toBe(false);
  });
  it('setSettings merges through QuotaDeck’s own normalizer, tells the page and pushes the result', async () => {
    const { hud, o } = make();
    const pushed: unknown[] = [];
    hud.onSettings(v => pushed.push(v));
    const result = await hud.setSettings({ size: 30 });
    expect(result).toEqual({ size: 30 });
    expect(o.onSettings).toHaveBeenCalledWith({ size: 30 });
    expect(pushed).toEqual([{ size: 30 }]);
  });
  it('approve answers a request that is still on screen, without the approval: prefix', async () => {
    const { hud, o } = make();
    hud.push.sessions(sessions(['approval:req-demo-1']));
    expect(await hud.approve('approval:req-demo-1', 'allow')).toBe(true);
    expect(o.onApprove).toHaveBeenCalledWith('req-demo-1', 'allow');
  });
  it('approve ignores a request that is gone (the afternoon restarted)', async () => {
    const { hud, o } = make();
    hud.push.sessions(sessions([]));
    expect(await hud.approve('approval:req-demo-1', 'deny')).toBe(false);
    expect(o.onApprove).not.toHaveBeenCalled();
  });
  it('desktop-only calls answer without effect', async () => {
    const { hud, o } = make();
    expect(await hud.action('connect-claude')).toEqual({ status: 'unavailable' });
    expect(o.onAction).toHaveBeenCalledWith('connect-claude');
    expect(await hud.returnTo('claude:A:1')).toBe(false);
    expect(o.onReturn).toHaveBeenCalledWith('claude:A:1');
    expect(() => { hud.hits([]); hud.drag('start'); hud.card(true); hud.strips({}); }).not.toThrow();
    hud.dismiss(['x']);
    expect(o.onDismiss).toHaveBeenCalledWith(['x']);
  });
});

describe('strip sizes', () => {
  it('the measured strip sizes reach the page, which places the strip with them', () => {
    const onStrips = vi.fn();
    const { hud } = make({ onStrips });
    hud.strips({ vertical: { width: 120, height: 200 }, horizontal: { width: 420, height: 34 } });
    expect(onStrips).toHaveBeenCalledWith({ vertical: { width: 120, height: 200 }, horizontal: { width: 420, height: 34 } });
  });
});
