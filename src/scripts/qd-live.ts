import { loadQuotaDeck, historyFor, QD_DIR, HISTORY_FILE, type QuotaDeckMain } from './qd-load';
import { createSim, H, M, REFRESH, PROVIDER_IDS, AGENT_FLOW, agentPhase, collabEnd, type AgentId, type LaneId } from './qd-sim';
import { createBridge } from './qd-bridge';
import { createTimeMachine, hhmm, countdown, type TmState } from './qd-timeline';
import { codeLive } from './code-live';
import { frameCap } from './frame-cap';
import { QUOTA_TEXT } from './qd-live-text';

declare global { interface Window { __quotaDeckBridge?: unknown; __quotaDeckFailed?: (message: string) => void } }
/** compact.js rebuilds these with innerHTML on every snapshot; a focused control in them is found again by its key. */
function focusKey(el: Element | null | undefined): string | null {
  if (!el) return null;
  if (el.matches('.provider-summary')) return `[data-provider="${el.closest('[data-provider]')?.getAttribute('data-provider')}"] .provider-summary`;
  if (el.matches('#agentChoices input')) return `#agentChoices input[value="${(el as HTMLInputElement).value}"]`;
  if (el.matches('#modelFilters [data-filter]')) return `#modelFilters [data-filter="${el.getAttribute('data-filter')}"]`;
  return null;
}
const VERSION = '0.5.0-rc.5';
const ALL_AGENTS = AGENT_FLOW.map(a => a.id) as AgentId[];
const AGENTS_AVAILABLE = { codex: true, claude: true, antigravity: true, workbuddy: true };

/** Digits on reels (the prototype's clock): rebuilt when the length changes, otherwise each reel slides. */
function reels(el: HTMLElement, s: string) {
  if (el.dataset.len !== String(s.length)) {
    el.replaceChildren(...[...s].map(ch => {
      const span = document.createElement('span');
      if (/\d/.test(ch)) { span.className = 'reel'; const strip = document.createElement('span'); strip.className = 'strip'; strip.textContent = '0123456789'; span.append(strip); }
      else { span.className = 'gl'; span.textContent = ch; }
      return span;
    }));
    el.dataset.len = String(s.length);
  }
  [...el.children].forEach((c, i) => { const strip = c.firstElementChild as HTMLElement | null; if (strip) strip.style.transform = `translateY(${-Number(s[i])}em)`; else c.textContent = s[i]; });
}

export function initQuotaLive(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh', T = QUOTA_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const light = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData || matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const stage = $('qd-stage'), frame = $<HTMLIFrameElement>('qd-frame'), code = codeLive($('qd-code'));
  const clampY = (v: number, a: number, b: number) => Math.max(a + 8, Math.min(b - 8, v));
  const sim = createSim(), clock = { now: sim.t };
  let main: QuotaDeckMain | null = null, read: ((id: string) => Promise<any>) | null = null, ui: any = null;
  let speed = 600, refreshing = false, nextRefresh = sim.t, raf = 0, lastReal = 0, visible = false, failed = false;
  let collab: { at: number; agents: AgentId[] } | null = null, collabDone = 0, resets = 0;
  let estimate: TmState['estimate'] = null, samples: TmState['samples'] = [], sampleKey = '';
  let lastAt = NaN, lastProviders: any[] = [], wasDraining = false;
  // quota-history.cjs line 50's series at QuotaDeck's last refresh: its length and its first sample's time.
  let series = 0, seriesFrom = 0;
  // Pushes to the hosted UI wait while the visitor presses or edits something in it (compact.js rebuilds its lists with
  // innerHTML on every snapshot, which would swallow the click), and come at most twice a second.
  let pendingUi: any = null, pointerDown = false, aimedAt = 0, lastPush = 0, flushTimer = 0;

  /* ---------- QuotaDeck's refresh, on the simulated clock ---------- */
  async function refresh() {
    if (!main || !read || refreshing) return ui;
    refreshing = true;
    try {
      clock.now = sim.t;
      // Paused (or QuotaDeck's own refresh button at the same instant): Antigravity must not be sampled twice at one
      // moment — quota-history.cjs lines 37-38 and 53 would drop its estimate — so its last reading is reused.
      const same = sim.t === lastAt && lastProviders.length > 0;
      const providers = await Promise.all(PROVIDER_IDS.map((id, i) => (same && id === 'antigravity' ? lastProviders[i] : read!(id))));
      lastAt = sim.t; lastProviders = providers;
      ui = { ...main.toUiSnapshot({ updatedAt: new Date(sim.t).toISOString(), providers }), agents: AGENTS_AVAILABLE };
      pushUi(ui);
      if (!same) readEstimate(providers.find(p => p.id === 'antigravity'));
      const c = ui.providers.find((p: any) => p.id === 'codex');
      stage.dataset.codex = String(c?.gauge?.remainingPercent ?? '');
      return ui;
    } finally { refreshing = false; }
  }
  /** QuotaDeck's samples for the current Antigravity window, read back from its own history file, and its output. */
  function readEstimate(agy: any) {
    const bucket = agy?.groups?.[0]?.buckets?.[0];
    if (!bucket) return;
    // QuotaDeck's own instant: it records Date.parse(updatedAt), whole milliseconds, while frame times are fractional.
    const now = Date.parse(agy.updatedAt), h = historyFor(main!.fs.files.get(HISTORY_FILE), 'antigravity', bucket, now);
    const broke = sampleKey !== '' && sampleKey !== bucket.resetTime;
    sampleKey = bucket.resetTime;
    samples = h.all.map(r => ({ at: r.at, value: r.value * 100 }));
    series = h.series.length;
    seriesFrom = h.series[0]?.at ?? now;
    const burn = Number.isFinite(bucket.burnPerHour) ? bucket.burnPerHour : null;
    const hoursLeft = Number.isFinite(bucket.estimatedHoursLeft) ? bucket.estimatedHoursLeft : null;
    estimate = { at: now, value: bucket.remainingFraction * 100, burn, hoursLeft, resetAt: Date.parse(bucket.resetTime) };
    paintEstimate(broke);
  }
  function pushUi(next: any) {
    pendingUi = next;
    if (pointerDown) return;                                              // sent when the press ends
    // The pointer over a control compact.js rebuilds: hold the push a moment so the target stays put while the visitor
    // aims, but never more than 1.5 s, so a resting mouse cannot freeze the window.
    const held = aimedAt ? 1500 - (performance.now() - aimedAt) : 0;
    if (held > 0) { if (!flushTimer) flushTimer = window.setTimeout(() => { flushTimer = 0; if (pendingUi) pushUi(pendingUi); }, held); return; }
    const wait = 1000 - (performance.now() - lastPush);                  // the window updates once a second
    if (wait > 0) { if (!flushTimer) flushTimer = window.setTimeout(() => { flushTimer = 0; if (pendingUi) pushUi(pendingUi); }, wait); return; }
    lastPush = performance.now(); const snapshot = pendingUi; pendingUi = null;
    const doc = frame.contentDocument, key = doc?.hasFocus() ? focusKey(doc.activeElement) : null;
    bridge.push(snapshot);
    if (key) (doc!.querySelector(key) as HTMLElement | null)?.focus({ preventScroll: true });   // keep the keyboard where it was
  }
  // After pointerup the click is still to come; a synchronous re-render would remove its target first.
  const flushSoon = () => setTimeout(() => { if (pendingUi) pushUi(pendingUi); }, 0);
  function paintEstimate(broke: boolean) {
    // quota-history.cjs line 50: this key's rows within the last hour, before the current sample is pushed (line 63)
    const e = estimate!, n = series, untilReset = (e.resetAt - e.at) / H;
    const eta = $('qd-eta');
    if (sim.lanes[2].rem <= 0) eta.textContent = T.eta.exhausted;
    else if (e.burn === null) eta.textContent = T.eta.sampling(n);
    else if (e.burn <= 0) eta.textContent = T.eta.stable;
    else if (e.hoursLeft !== null) eta.textContent = `${T.eta.left(e.burn.toFixed(1), e.hoursLeft.toFixed(1))} ${T.eta.source}`;
    else eta.textContent = `${T.eta.noExhaust(e.burn.toFixed(1))} ${T.eta.source}`;
    code.reset();
    code.flash(50); code.count(50, T.code.samples(n));
    if (broke) { code.flash(54, 'red'); code.count(54, T.code.broke); }
    if (e.burn !== null && n >= 2) {
      code.count(56, T.code.span(n, Math.round((e.at - seriesFrom) / M)));
      code.on(57); code.count(57, T.code.burn(e.burn.toFixed(1)));
      code.on(58); code.count(58, e.burn > 0 ? T.code.hours((e.value / e.burn).toFixed(1)) : '→ null');
      code.on(59); code.count(59, T.code.untilReset(untilReset.toFixed(1)));
      code.heat(57, Math.min(1, e.burn / 45));
      if (e.hoursLeft !== null) { code.on(60, 'red'); code.count(60, T.code.shown(e.hoursLeft.toFixed(1))); } else code.count(60, T.code.notShown);
    } else if (!broke) code.count(56, T.code.short);
  }

  /* ---------- the bridge the hosted UI talks to ---------- */
  const bridge = createBridge({
    refresh: () => refresh(),
    startCollab: agents => {
      collab = { at: performance.now(), agents }; collabDone = 0; stage.dataset.collab = 'running';
      const btn = $<HTMLButtonElement>('qd-collab');
      keepFocus = document.activeElement === btn;                          // disabling drops focus to <body>; it comes back after
      btn.disabled = true; strip();
    },
    simNow: () => sim.t,
  }, VERSION);
  let keepFocus = false;
  bridge.api.onCollaborationState(s => {
    if (!s.running && collab) {
      const finished = collab, btn = $<HTMLButtonElement>('qd-collab');
      stage.dataset.collab = 'done'; btn.disabled = false; strip(true); stir();
      if (keepFocus && document.activeElement === document.body) btn.focus();
      keepFocus = false;
      setTimeout(() => { if (collab === finished) collab = null; }, 1500);   // only this run: a new one may have started
    }
  });
  function strip(done = false) {
    const all = collab?.agents.length ?? 4, box = $('qd-strip');
    box.classList.toggle('run', !done); box.classList.toggle('done', done);
    $('qd-strip-k').textContent = done ? T.stripDone(all) : T.stripRun(collabDone, all);
    $('qd-strip-v').textContent = T.disclaimer;
  }

  /* ---------- the time machine ---------- */
  const tm = createTimeMachine($('qd-body'), $<HTMLCanvasElement>('qd-tl'), $<HTMLCanvasElement>('qd-fx'), T.tl, {
    reduced, light,
    anchor: () => {
      const doc = frame.contentDocument, body = $('qd-body').getBoundingClientRect(), fr = frame.getBoundingClientRect();
      if (!doc) return null;
      const k = fr.width / 520, rows: Partial<Record<AgentId, number>> = {};
      for (const id of ALL_AGENTS) {
        // The row the visitor can see: the provider on the quota tab, the agent's checkbox on the 协作 tab.
        const el = [...doc.querySelectorAll(`[data-provider="${id}"] .provider-summary, #agentChoices input[value="${id}"]`)]
          .map(e => e.closest('.agent-choice') ?? e).find(e => e.getBoundingClientRect().height > 0);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        rows[id] = clampY(fr.top - body.top + (r.top + r.height / 2) * k, fr.top - body.top, fr.bottom - body.top);
      }
      return { right: fr.right - body.left, rows };
    },
    onHit: () => { const w = $('qd-window'); w.classList.remove('hit'); void w.offsetWidth; w.classList.add('hit'); },
  });

  function paintClock() {
    const s = hhmm(sim.t);
    if ($('qd-clock-text').textContent !== s) { $('qd-clock-text').textContent = s; reels($('qd-clock'), s); }
    const day = T.day(Math.floor((sim.t - new Date(2026, 9, 5).getTime()) / (24 * H)) + 1);
    if ($('qd-day').textContent !== day) $('qd-day').textContent = day;
  }
  function state(): TmState { return { t: sim.t, lanes: sim.lanes, marks: sim.marks, samples, estimate, collab }; }
  function advance(dtReal: number) {
    const simDt = dtReal * speed, n = Math.max(1, Math.ceil(simDt / 20_000));
    for (let k = 0; k < n; k++) {
      for (const lane of sim.lanes) lane.agent = !!collab && collab.agents.includes(lane.id as AgentId) && agentPhase(lane.id as AgentId, (performance.now() - collab.at) / 1000) === 'run';
      for (const id of sim.step(simDt / n, dtReal / n)) onReset(id);
    }
    if (collab) {
      const el = (performance.now() - collab.at) / 1000, d = collab.agents.filter(id => agentPhase(id, el) === 'done').length;
      stage.dataset.agents = collab.agents.map(id => `${id}:${agentPhase(id, el)}`).join(' ');
      if (d !== collabDone && el < collabEnd(collab.agents)) { collabDone = d; strip(); }
    }
    if (sim.t >= nextRefresh) { nextRefresh = (Math.floor(sim.t / REFRESH) + 1) * REFRESH; void refresh(); }
    // Paused: once a big task or an agent's load has drained, QuotaDeck reads again so its window shows it too.
    const draining = sim.lanes.some(l => l.drop > 0 || l.agent);
    if (speed === 0 && wasDraining && !draining) void refresh();
    wasDraining = draining;
  }
  function onReset(id: LaneId) { resets++; stage.dataset.resets = String(resets); tm.sweep(sim.lanes.find(l => l.id === id)!, sim.t); }
  let lastDraw = 0, stirredAt = 0;
  const cap = frameCap();
  const stir = () => { stirredAt = performance.now(); };
  function frameLoop(now: number) {
    raf = requestAnimationFrame(frameLoop);
    if (!visible || failed) { cancelAnimationFrame(raf); raf = 0; return; }
    if (!cap(now)) return;                                                // at most about 60 frames a second
    const dtReal = lastReal ? Math.min(100, now - lastReal) : 16; lastReal = now;   // a hidden tab never jumps hours ahead
    advance(dtReal);
    paintClock();
    // Paused with nothing moving: the picture cannot change, so it is redrawn only twice a second.
    const idle = speed === 0 && !collab && !sim.lanes.some(l => l.drop > 0 || l.agent) && now - stirredAt > 2000;
    if (!idle || now - lastDraw > 500) { tm.draw(state(), now); lastDraw = now; }
  }
  const run = () => { if (!raf && visible && !failed) { lastReal = 0; raf = requestAnimationFrame(frameLoop); } };

  function setSpeed(v: number) {
    speed = v; stir();
    root.querySelectorAll<HTMLButtonElement>('#qd-speeds [data-sp]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.sp) === v)));
    $('qd-clock').classList.toggle('fast', v === 600);
  }
  root.querySelectorAll<HTMLButtonElement>('#qd-speeds [data-sp]').forEach(b => { b.onclick = () => setSpeed(Number(b.dataset.sp)); });
  $('qd-task').onclick = () => { sim.bigTask(); stir(); tm.shock(sim.lanes[0], performance.now()); };
  $('qd-collab').onclick = () => { void bridge.api.runCollaboration({ task: T.collabTask, agents: ALL_AGENTS }).catch(() => {}); };

  /* ---------- start: load QuotaDeck's code, host its UI, run ---------- */
  function fail(why: string) {
    if (failed) return;
    failed = true; console.error('QuotaDeck demo:', why);
    // Only the screenshots remain: the heading and intro describe a window that is no longer there.
    root.querySelector<HTMLElement>('.qd-head')!.hidden = true;
    stage.hidden = true; $('qd-fallback').hidden = false; stage.dataset.state = 'failed';
  }
  window.__quotaDeckFailed = fail;
  async function start() {
    try {
      main = await loadQuotaDeck(async p => { const r = await fetch(QD_DIR + p); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.text(); }, clock);
      main.configureHistory(HISTORY_FILE);
      read = main.createProviderReader(Object.fromEntries(PROVIDER_IDS.map(id => [id, async () => sim.raw(id)])));
      if (reduced) {                                                       // a still frame with QuotaDeck's estimate already there
        setSpeed(0);
        for (let k = 0; k < 90; k++) { sim.step(REFRESH, 0); clock.now = sim.t; await refresh(); }
        nextRefresh = sim.t + REFRESH;
      } else { setSpeed(600); await refresh(); }
      window.__quotaDeckBridge = bridge.api;
      frame.src = frame.dataset.src!;
      stage.dataset.state = 'running';
      visible = true; run();
      new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible) run(); }).observe(stage);
    } catch (e) { fail((e as Error).message); }
  }
  frame.addEventListener('load', () => {
    // host.js sets window.quotaDeck before its first await; a missing host page or script leaves it unset.
    if (frame.getAttribute('src') && !(frame.contentWindow as (Window & { quotaDeck?: unknown }) | null)?.quotaDeck) { fail('host.html / host.js did not load'); return; }
    tm.layout();
    const w = frame.contentWindow!, d = frame.contentDocument!;
    w.addEventListener('pointerdown', () => { pointerDown = true; }, true);
    for (const t of ['pointerup', 'pointercancel']) w.addEventListener(t, () => { pointerDown = false; flushSoon(); }, true);
    w.addEventListener('pointerover', e => {
      const hot = !!(e.target as Element).closest?.('#providerList button, #agentChoices label, #modelFilters button');
      if (!hot) aimedAt = 0; else if (!aimedAt) aimedAt = performance.now();   // the hold counts from when aiming began
    }, true);
    d.documentElement.addEventListener('pointerleave', () => { aimedAt = 0; });   // the pointer left the window
    d.addEventListener('focusout', flushSoon, true);
  });
  new ResizeObserver(() => { const k = Math.min(0.8, $('qd-window').clientWidth / 520); frame.style.transform = `scale(${k})`; $('qd-window').style.height = `${840 * k}px`; tm.layout(); stir(); }).observe($('qd-window'));
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); void start(); } }, { rootMargin: '200px' });
  io.observe(stage);
}
