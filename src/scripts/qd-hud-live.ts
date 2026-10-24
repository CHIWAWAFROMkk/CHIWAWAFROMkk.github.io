import fixture from '../data/qd-hud-fixture.json';
import { loadHudMain, QD_HUD_DIR, type HudMain, type Tracker, type HudLayout } from './qd-hud-load';
import { createHudBridge, type HudBridge } from './qd-hud-bridge';
import { LOOP_MS, BEATS, eventsBetween, approvalsAt, keyframeAt, tokensAt, noteAt, hintAt, type RawSeriesPair } from './qd-hud-scenario';
import { QD_HUD_TEXT } from './qd-hud-text';
import { currentTier } from './motion/tier';
import type { Lang } from '../i18n';

declare global { interface Window { __qdHud?: HudBridge; __qdTier?: string; __qdFailed?: (reason: string) => void } }

type Decision = 'allow' | 'deny' | null;
/** The simulated desktop: wide screens keep the strip on the right edge (the author's choice) and scale the desktop to
 *  fill the stage. A phone gets a desktop exactly as wide as the stage, at full size, with the strip on the top edge;
 *  the host's sheet narrows the card to that width, so its text stays readable instead of shrinking with the desktop. */
const PHONE_BELOW = 700;
// The notch's wings are a fixed 456 px, so on a phone the notch gets a desktop wide enough for them, scaled to fit.
const NOTCH_MIN_WIDTH = 480;
const desktopFor = (width: number, style?: unknown) => (width >= 1100 ? { width: 1280, height: 720, edge: 'right' }
  : width >= PHONE_BELOW ? { width: 960, height: 600, edge: 'right' }
  : { width: Math.max(Math.floor(width), style === 'notch' ? NOTCH_MIN_WIDTH : 0), height: 560, edge: 'top' });
const MAX_STEP_MS = 250;   // a longer gap (hidden tab, slow frame) is not replayed

export function initQuotaHudLive(root: HTMLElement): void {
  const lang = (root.dataset.lang === 'en' ? 'en' : 'zh') as Lang;
  const T = QD_HUD_TEXT[lang];
  const $ = <E extends HTMLElement>(sel: string) => root.querySelector<E>(sel)!;
  const stage = $('#qd-stage'), desk = $('[data-qd-desk]'), screen = $('[data-qd-screen]'), frame = $<HTMLIFrameElement>('#qd-frame');
  const noteEl = $('[data-qd-note]'), hintEl = $('[data-qd-hint]'), logEl = $('[data-qd-log]'), stats = $('[data-qd-stats]');
  const playBtn = $<HTMLButtonElement>('[data-qd-play]'), stepBtn = $<HTMLButtonElement>('[data-qd-step]');
  const fallback = $('#qd-fallback');
  // Quota keyframes keep the fixture's date (their resets are relative to it); session events are stamped from the
  // start of this afternoon on the visitor's own clock, which is what the HUD measures waits and reply times against.
  const base = fixture.base;
  let sessionBase = Date.now();
  const stepping = currentTier() === 'off';

  let main: HudMain, hud: HudBridge, tracker: Tracker;
  let t = 0, prevT = -1, decided: Decision = null, keyframe = -1, tokensGrown = false, lastSessions = '';
  let running = false, onScreen = false, raf = 0, last = 0, started = false, failed = false;
  let settings: Record<string, unknown> = {};
  let strips: unknown = null;
  let desktop = desktopFor(desk.clientWidth);

  const fail = (reason: string) => {
    if (failed) return;
    failed = true;
    console.warn('QuotaDeck demo:', reason);
    cancelAnimationFrame(raf);
    stage.hidden = true;
    fallback.hidden = false;
    fallback.textContent = T.failed;
  };

  function layout(): HudLayout {
    const workArea = { x: 0, y: 0, width: desktop.width, height: desktop.height };
    const g = main.geometry;
    const raw = settings.style === 'notch'
      ? g.layoutNotch({ workArea })
      : g.layoutHud({ workArea, edge: desktop.edge, offset: 0.5, ...(strips ? { strips } : {}) });
    const win = raw.window as { x: number; y: number; width: number; height: number };
    Object.assign(frame.style, { left: `${win.x}px`, top: `${win.y}px`, width: `${win.width}px`, height: `${win.height}px` });
    return { mode: raw.mode === 'notch' ? 'notch' : 'strip', edge: raw.edge, strip: raw.strip, ...(raw.notch ? { notch: raw.notch } : {}), size: { width: win.width, height: win.height }, dragging: false };
  }
  function fit() {
    const next = desktopFor(desk.clientWidth, settings.style);
    const changed = next.width !== desktop.width;
    desktop = next;
    const scale = desk.clientWidth / desktop.width;
    Object.assign(screen.style, { width: `${desktop.width}px`, height: `${desktop.height}px`, transform: `scale(${scale})` });
    desk.style.height = `${desktop.height * scale}px`;
    if (changed && started) hud.push.layout(layout());
  }

  const items = () => main.view.buildHudItems(fixture.keyframes[keyframeAt(t)].ui, base + t);
  const tokens = () => main.view.buildHudTokens(tokensAt(t, fixture.tokens as unknown as RawSeriesPair));
  /** Feeds the scenario up to t into QuotaDeck's tracker and pushes whatever changed. */
  function advance() {
    for (const { vendor, event } of eventsBetween(prevT, t, sessionBase)) tracker.ingest(vendor, event);
    prevT = t;
    tracker.setApprovals(approvalsAt(t, sessionBase, decided));
    const snapshot = tracker.snapshot(sessionBase + t);
    const key = JSON.stringify(snapshot);
    if (key !== lastSessions) { lastSessions = key; hud.push.sessions(snapshot); }
    if (keyframeAt(t) !== keyframe) { keyframe = keyframeAt(t); hud.push.state(items()); }
    const grown = tokensAt(t, fixture.tokens as unknown as RawSeriesPair) !== (fixture.tokens as unknown);
    if (grown !== tokensGrown) { tokensGrown = grown; hud.push.tokens(tokens()); }
    const text = noteAt(t)[lang];
    if (noteEl.textContent !== text) noteEl.textContent = text;
    hintEl.hidden = !hintAt(t, decided);
  }
  function restart() {
    t = 0; prevT = -1; decided = null; keyframe = -1; tokensGrown = false; lastSessions = '';
    sessionBase = Date.now();
    tracker = main.tracker.createSessionTracker({ startedAt: sessionBase });
    logEl.textContent = '';
    stats.hidden = true;
    advance();
  }

  const tick = (now: number) => {
    raf = 0;
    if (!running || !onScreen || document.hidden) return;
    t += Math.min(MAX_STEP_MS, now - last);
    last = now;
    if (t >= LOOP_MS) restart(); else advance();
    raf = requestAnimationFrame(tick);
  };
  const resume = () => {
    if (raf || !running || !onScreen || document.hidden || failed) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const setRunning = (on: boolean) => {
    running = on;
    stage.dataset.state = stepping ? 'stepping' : on ? 'running' : 'paused';
    playBtn.textContent = on ? T.pause : T.resume;
    playBtn.setAttribute('aria-pressed', String(!on));
    if (on) resume();
  };

  async function start() {
    started = true;
    try {
      main = await loadHudMain(async path => {
        const r = await fetch(QD_HUD_DIR + path);
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.text();
      });
    } catch (error) { fail((error as Error).message); return; }
    // On a phone the strip starts without numbers so it fits across the screen; the settings page can turn them back on.
    settings = main.geometry.normalizeHudSettings({ style: 'strip', ...(desk.clientWidth < PHONE_BELOW ? { showsNumbers: false } : {}) });
    sessionBase = Date.now();
    tracker = main.tracker.createSessionTracker({ startedAt: sessionBase });
    hud = createHudBridge({
      initial: () => ({ items: items(), tokens: tokens(), sessions: tracker.snapshot(sessionBase + t), gaming: false, layout: layout(), settings }),
      normalizeSettings: s => main.geometry.normalizeHudSettings(s),
      onSettings: next => {
        const styleChanged = next.style !== settings.style;
        settings = next;
        syncStyleButtons();
        if (styleChanged) { fit(); hud.push.layout(layout()); }
      },
      onApprove: (_id, decision) => { decided = decision; logEl.textContent = decision === 'allow' ? T.allowed : T.denied; advance(); },
      onDismiss: ids => { tracker.dismiss(ids); advance(); },
      onReturn: () => { logEl.textContent = T.returnNote; },
      onOpenStats: () => { stats.hidden = false; },
      onAction: () => { logEl.textContent = T.unavailable; },
      onStrips: value => { strips = value; if (settings.style !== 'notch') hud.push.layout(layout()); },
    });
    window.__qdHud = hud;
    window.__qdTier = currentTier();
    window.__qdFailed = fail;
    frame.addEventListener('error', () => fail('host page failed to load'));
    frame.src = frame.dataset.src!;
    stage.hidden = false;
    fallback.hidden = true;
    fit();
    advance();
    setRunning(!stepping);
  }

  function syncStyleButtons() {
    root.querySelectorAll<HTMLButtonElement>('[data-qd-style]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.qdStyle === (settings.style ?? 'strip'))));
  }
  root.querySelectorAll<HTMLButtonElement>('[data-qd-style]').forEach(b => b.addEventListener('click', () => { void hud?.setSettings({ style: b.dataset.qdStyle }); }));
  playBtn.addEventListener('click', () => setRunning(!running));
  $('[data-qd-restart]').addEventListener('click', () => { if (main) { restart(); if (!stepping) setRunning(true); } });
  stepBtn.hidden = !stepping;
  stepBtn.addEventListener('click', () => {
    if (!main) return;
    const next = BEATS.find(b => b.at > t);
    if (!next || next.at >= LOOP_MS) { if (t >= LOOP_MS) { restart(); return; } t = LOOP_MS; advance(); return; }
    t = next.at;
    advance();
  });
  new ResizeObserver(() => fit()).observe(desk);
  document.addEventListener('visibilitychange', resume);
  // The stage starts when it comes near the screen, and the afternoon only runs while it is in view.
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen && !started) void start();
    else resume();
  }, { rootMargin: '200px 0px' }).observe(root);
}
