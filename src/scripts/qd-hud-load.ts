/** QuotaDeck's four pure main-process modules (vendored unmodified at 175d31c, QuotaDeck 0.7.0), evaluated in the page. They turn quota
 *  snapshots into what the HUD draws (hud-view), follow agent sessions (session-tracker) and place the strip or the
 *  notch (hud-geometry). They require nothing but each other; require() resolves only these four files, so no code
 *  path here can read the visitor's machine. */
export const QD_HUD_COMMIT = '175d31c2c8f579eebbf8f1928025e877d108904f';
export const QD_HUD_DIR = `/assets/quotadeck/${QD_HUD_COMMIT.slice(0, 7)}/`;
export const QD_HUD_MAIN = ['src/main/model-names.cjs', 'src/main/hud-view.cjs', 'src/main/session-tracker.cjs', 'src/main/hud-geometry.cjs'];

/* The shapes are QuotaDeck's; only what the page reads is typed. */
export interface HudItem { id: string; name: string; ring: { usedPct: number | null; level: 'ok' | 'warn' | 'high' | 'none' }; [k: string]: unknown }
export interface HudAlert { id: string; vendor: 'claude' | 'codex'; kind: 'reply' | 'error' | 'waiting' | 'approval'; sessionId: string; title?: string; text?: string; tool?: string; at: number }
export interface HudSessions { vendors: Record<'claude' | 'codex', { phase: 'idle' | 'working' | 'asking' | 'done'; running: number }>; alerts: HudAlert[] }
export interface ApprovalRequest { id: string; vendor: 'claude' | 'codex'; sessionId: string; tool: string; summary: string; at: number; cwd?: string }
export interface Tracker {
  ingest(vendor: 'claude' | 'codex', event: Record<string, unknown>): void;
  setApprovals(list: ApprovalRequest[]): void;
  snapshot(now: number): HudSessions;
  dismiss(ids: string[]): void;
}
export interface Rect { x: number; y: number; width: number; height: number }
export interface HudLayout { mode?: 'strip' | 'notch'; edge: string; strip?: Rect; notch?: Rect; size?: { width: number; height: number }; dragging?: boolean; [k: string]: unknown }
export interface HudMain {
  view: { buildHudItems(ui: unknown, now: number): HudItem[]; buildHudTokens(raw: unknown): unknown };
  tracker: { createSessionTracker(o: { startedAt: number; waitingAfterMs?: number }): Tracker };
  geometry: { layoutHud(o: Record<string, unknown>): HudLayout; layoutNotch(o: { workArea: Rect }): HudLayout; normalizeHudSettings(s: unknown): Record<string, unknown> };
}

export async function loadHudMain(fetchText: (path: string) => Promise<string>): Promise<HudMain> {
  const sources = new Map<string, string>(await Promise.all(QD_HUD_MAIN.map(async p => [`./${p.slice(p.lastIndexOf('/') + 1)}`, await fetchText(p)] as [string, string])));
  const loaded = new Map<string, { exports: any }>();
  const require = (spec: string): any => {
    const source = sources.get(spec);
    if (source === undefined) throw new Error(`网页演示没有提供模块 ${spec}`);
    if (!loaded.has(spec)) {
      const module = { exports: {} as any };
      loaded.set(spec, module);
      new Function('require', 'module', 'exports', `${source}\n//# sourceURL=quotadeck/${spec.slice(2)}`)(require, module, module.exports);
    }
    return loaded.get(spec)!.exports;
  };
  return { view: require('./hud-view.cjs'), tracker: require('./session-tracker.cjs'), geometry: require('./hud-geometry.cjs') };
}
