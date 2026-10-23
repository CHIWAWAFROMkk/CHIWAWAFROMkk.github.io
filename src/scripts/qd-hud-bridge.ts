import type { HudSessions } from './qd-hud-load';

/** QuotaDeck's HUD talks to its desktop program only through window.hud (src/main/preload-hud.cjs). This is the web
 *  version: the page pushes state in, and every call that would reach the desktop answers here instead. Approving or
 *  denying only changes the demo; nothing is ever run. */
export interface HudInitial { items: unknown; tokens: unknown; sessions: unknown; gaming: false; layout: unknown; settings: Record<string, unknown> }
export interface BridgeOptions {
  initial(): HudInitial;
  normalizeSettings(s: Record<string, unknown>): Record<string, unknown>;
  onSettings(next: Record<string, unknown>): void;
  onApprove(id: string, decision: 'allow' | 'deny'): void;
  onDismiss(ids: string[]): void;
  onReturn(id: string): void;
  onOpenStats(): void;
  onAction(name: string): void;
  /** The strip sizes the HUD measured; the page places the strip with them, as the desktop does. */
  onStrips?(value: unknown): void;
}
type Channel = 'state' | 'tokens' | 'layout' | 'settings' | 'sessions' | 'gaming';
type Listener = (value: unknown) => void;

export function createHudBridge(o: BridgeOptions) {
  const listeners = new Map<Channel, Set<Listener>>();
  const subscribe = (channel: Channel) => (cb: Listener) => {
    if (!listeners.has(channel)) listeners.set(channel, new Set());
    listeners.get(channel)!.add(cb);
    return () => { listeners.get(channel)!.delete(cb); };
  };
  const emit = (channel: Channel, value: unknown) => { for (const cb of listeners.get(channel) ?? []) cb(value); };
  let settings: Record<string, unknown> = {};
  let sessions: HudSessions | null = null;
  const pushSessions = (s: unknown) => { sessions = s as HudSessions; emit('sessions', s); };
  const pushSettings = (s: Record<string, unknown>) => { settings = s; emit('settings', s); };

  return {
    async initial() {
      const state = o.initial();
      settings = state.settings;
      sessions = state.sessions as HudSessions;
      return state;
    },
    async refresh() { return true; },
    async action(name: string) { o.onAction(String(name)); return { status: 'unavailable' as const }; },
    async setSettings(patch: Record<string, unknown>) {
      const merged: Record<string, unknown> = { ...settings, ...patch };
      // The HUD sends one metric at a time ({ metrics: { claude: 'burn' } }); keep the others.
      if (settings.metrics || patch?.metrics) merged.metrics = { ...(settings.metrics as object), ...(patch?.metrics as object) };
      const next = o.normalizeSettings(merged);
      pushSettings(next);
      o.onSettings(next);
      return next;
    },
    async openStats() { o.onOpenStats(); return true; },
    hits(_rects: unknown) { /* click-through belongs to the desktop window */ },
    drag(_phase: unknown) { /* the strip stays on the right edge in the demo */ },
    card(_open: unknown) {},
    strips(value: unknown) { o.onStrips?.(value); },
    onState: subscribe('state'),
    onTokens: subscribe('tokens'),
    onLayout: subscribe('layout'),
    onSettings: subscribe('settings'),
    onSessions: subscribe('sessions'),
    onGaming: subscribe('gaming'),
    dismiss(ids: string[]) { o.onDismiss(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []); },
    async returnTo(id: string) { o.onReturn(String(id)); return false; },
    async approve(id: string, decision: 'allow' | 'deny') {
      // A request that is no longer on screen (the afternoon restarted) is ignored.
      if (!sessions?.alerts?.some(a => a.id === id && a.kind === 'approval')) return false;
      o.onApprove(String(id).replace(/^approval:/, ''), decision === 'allow' ? 'allow' : 'deny');
      return true;
    },
    push: {
      state: (items: unknown) => emit('state', items),
      tokens: (tokens: unknown) => emit('tokens', tokens),
      sessions: pushSessions,
      settings: pushSettings,
      layout: (layout: unknown) => emit('layout', layout),
    },
  };
}
export type HudBridge = ReturnType<typeof createHudBridge>;
