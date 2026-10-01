import { createPyRuntime, type PyRuntime } from './py-runtime';
import { bootView, type BootFile } from './py-boot-view';
import { codeLive, type CodeLive } from './code-live';
import { spinOdometer, setOdometerText } from './odometer-dom';
import { createPipeline } from './campus-pipeline';
import {
  CAMPUS_RUNTIME, WINDOW, GATE_LINES, rowFromForm, nextId, flowOf, toAnimate, baseline, statsView,
  type Row, type Gate, type Traced, type Invalid, type TestEvent, type TestSummary, type FormState, type Analysis,
} from './campus-flow';
import { CAMPUS_TEXT, summaryLine, ranLine } from './campus-live-text';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const fmt = (n: number) => n.toLocaleString('en-US');
const EXCLUSION = new Set<number>(GATE_LINES);

/** The live source as a line profiler: counts rise as the replay passes each line and end on the real trace; the
 *  shading is the share of rows that reached the line. Exclusion lines flash red while rows are stopped there, but are
 *  never switched on with the solid red tone, which would cover the shading (CodeLive's `.on.red`). */
function profiler(code: CodeLive) {
  let counts = new Map<number, number>(), raf = 0;
  const flashed = new Map<number, number>();
  const paint = () => {
    raf = 0;
    const rows = Math.max(1, counts.get(88) ?? 0);
    for (let n = 87; n <= 97; n++) {
      const c = counts.get(n) ?? 0;
      code.count(n, c ? `×${fmt(c)}` : '');
      if (n > 87) code.heat(n, c / rows);
      if (c) code.on(n);
    }
  };
  const later = () => { if (!raf) raf = requestAnimationFrame(paint); };
  const load = (o: Record<string, number>) => new Map(Object.entries(o).map(([n, c]) => [Number(n), c]));
  return {
    start(base: Record<number, number>) { code.reset(); counts = load(base); later(); },
    hit(n: number) {
      counts.set(n, (counts.get(n) ?? 0) + 1); later();
      const t = performance.now();
      if (EXCLUSION.has(n) && t - (flashed.get(n) ?? 0) > 260) { flashed.set(n, t); code.flash(n, 'red'); }
    },
    // reset() clears the red a flash leaves behind; the next paint rewrites counts, shading and "on" in the same frame.
    settle(trace: Record<string, number>) { code.reset(); counts = load(trace); later(); },
  };
}

interface Run { replace?: boolean; special?: number | null; storm?: boolean; constructed?: boolean; sampleIn?: boolean }

export function initCampusLive(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh', T = CAMPUS_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const light = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData || matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const stage = $('cm-stage'), prof = profiler(codeLive($('cm-code')));
  const pipe = createPipeline($('cm-pipe'), T.pipe, { reduced, light, hit: n => prof.hit(n) });
  // rows is the data set analyze() last accepted and gates where each of its rows went; shown counts accepted results,
  // so an older replay never writes its numbers over a newer result.
  let runtime: PyRuntime | null = null, ready = false, busy = false, testing = false, seq = 0, shown = 0;
  let rows: Row[] = [], gates: Gate[] = [], constructed = false, sampleIn = false;

  const say = (text: string, bad = false) => { const s = $('cm-status'); s.textContent = text; s.classList.toggle('bad', bad); };
  // Disabling a focused control drops focus to <body>; remember it, and give it back once the control works again (or,
  // when the sample button stays disabled after loading, pass focus to the stress test next to it).
  let held: HTMLElement | null = null;
  const sync = () => {
    const active = document.activeElement as HTMLElement | null;
    $<HTMLFieldSetElement>('cm-fields').disabled = !ready || busy;
    $<HTMLButtonElement>('cm-sample').disabled = sampleIn;
    $<HTMLButtonElement>('cm-run').disabled = !ready || testing;
    // Only a control this call just disabled is held, so focus is never pulled back to one the visitor has left.
    if (active && root.contains(active)) held = active.matches(':disabled') ? active : null;
    if (held && document.activeElement === document.body && !busy && !testing && ready) {
      const target = held.matches(':disabled') ? $('cm-stress') : held;
      held = null;
      if (!target.matches(':disabled')) target.focus();
    }
  };

  /* ---------- the questionnaire ---------- */
  const num = (v: string) => (v === '' ? null : Number(v));
  const form = (): FormState => ({
    id: $<HTMLInputElement>('cm-id').value, date: $<HTMLInputElement>('cm-date').value,
    consent: $<HTMLInputElement>('cm-q1').checked, eligible: $<HTMLInputElement>('cm-q2').checked,
    used: $<HTMLSelectElement>('cm-q3').value as FormState['used'],
    frequency: $<HTMLSelectElement>('cm-q4').value as FormState['frequency'],
    scenarios: [...root.querySelectorAll<HTMLInputElement>('input[name="cm-q5"]:checked')].map(c => c.value as FormState['scenarios'][number]),
    helpfulness: num($<HTMLSelectElement>('cm-q6').value), verification: num($<HTMLSelectElement>('cm-q7').value),
  });
  function syncForm() {
    const f = form(), answered = f.consent && f.eligible;
    $<HTMLSelectElement>('cm-q3').disabled = !answered;
    $<HTMLFieldSetElement>('cm-yes').disabled = !answered || f.used !== 'yes';
    $('cm-hint').textContent = !answered ? T.hintEnded : f.used === 'yes' ? T.hintYes : T.hintNotYes;
  }
  for (const id of ['cm-q1', 'cm-q2', 'cm-q3']) $(id).addEventListener('change', syncForm);
  syncForm();

  /* ---------- one analyze() run: the numbers shown all come from its output ---------- */
  function invalid(message: string | null) { $('cm-invalid').hidden = message === null; $('cm-invalid-msg').textContent = message ?? ''; }
  function stats(a: Analysis) {
    const v = statsView(a);
    const put = (id: string, text: string) => {
      const el = $(id);
      if (reduced || el.textContent === text) setOdometerText(el, text); else spinOdometer(el, text, 0, el.textContent || '0');
    };
    put('cm-inc', v.included); put('cm-all', v.input); put('cm-yes-share', v.yes);
    $('cm-counts').textContent = T.counts(v.counts);
    $('cm-den').textContent = T.sceneDen(v.sceneDen, v.sceneMissing);
    root.querySelectorAll<HTMLElement>('#cm-scenes li').forEach((li, i) => {
      li.querySelector<HTMLElement>('i')!.style.transform = `scaleX(${v.scenes[i].share.toFixed(4)})`;
      li.querySelector('.cm-sp')!.textContent = v.scenes[i].text;
    });
    const top = Math.max(1, ...v.help.dist);
    root.querySelectorAll<HTMLElement>('#cm-hist .cm-hc').forEach((c, i) => {
      const f = v.help.dist[i] / top, b = c.querySelector<HTMLElement>('b')!;
      c.querySelector<HTMLElement>('i')!.style.transform = `scaleY(${f.toFixed(4)})`;
      b.textContent = v.help.dist[i] ? fmt(v.help.dist[i]) : ''; b.style.bottom = `calc(${(f * 100).toFixed(1)}% + 3px)`;
      c.classList.toggle('med', v.help.median === i + 1);
    });
    $('cm-med').textContent = v.help.medianText;
    const line = $('cm-medl');
    line.style.opacity = v.help.median === null ? '0' : '1';
    if (v.help.median !== null) line.style.left = `${(((v.help.median - 0.5) / 5) * 100).toFixed(2)}%`;
    $('cm-program-status').textContent = a.status; $('cm-pstatus').hidden = false;
  }
  async function analyze(next: Row[], o: Run = {}): Promise<boolean> {
    if (!ready || !runtime) return false;
    const req = ++seq;
    busy = true; sync(); say(T.computing);
    let answer: Traced | Invalid;
    try { answer = (await runtime.call<Traced | Invalid>('campus_bridge', 'analyze_traced', [next, WINDOW.start, WINDOW.end])).value; }
    catch (e) { if (req === seq) { busy = false; sync(); say(T.engineError((e as Error).message), true); } return false; }
    if (req !== seq) return false;
    busy = false; say('');
    if ('error' in answer) { sync(); invalid(answer.message); return false; }
    invalid(null);
    if (o.constructed !== undefined) constructed = o.constructed;
    if (o.sampleIn !== undefined) sampleIn = o.sampleIn;
    sync(); $('cm-tag').hidden = !constructed;
    const id = ++shown, flow = flowOf(next, answer.branches);
    const animate = reduced ? [] : toAnimate(o.replace ? [] : gates, flow.gates);
    rows = next; gates = flow.gates;
    // The ID moves on as soon as the program accepts the answer, in the same task that re-enables the form, so a second
    // submission during the replay can never reuse it.
    if (o.special != null) $<HTMLInputElement>('cm-id').value = nextId(next);
    stage.dataset.state = 'running';
    // Until the replay settles the panel still shows the previous result: dim it and say so, rather than mix two runs.
    $('cm-stats').classList.add('stale'); $('cm-ledger').textContent = T.replaying;
    $('cm-timing').textContent = T.timing(next.length, answer.ms, answer.traced_ms);
    prof.start(baseline(answer.lines, flow.gates, animate));
    const settled = animate.length ? await pipe.play(flow, animate, { storm: !!o.storm, special: o.special ?? null }) : (pipe.show(flow), true);
    if (settled && id === shown) {
      prof.settle(answer.lines); stats(answer.result); $('cm-stats').classList.remove('stale');
      $('cm-ledger').textContent = T.ledger(answer.result);
      stage.dataset.state = 'done';
    }
    return true;
  }
  async function construct(kind: 'sample' | 'stress'): Promise<Row[] | null> {
    if (!runtime) return null;
    busy = true; sync();
    try { return (await runtime.call<Row[]>('campus_bridge', 'constructed', [kind])).value; }
    catch (e) { say(T.engineError((e as Error).message), true); return null; }
    finally { busy = false; sync(); }
  }

  $<HTMLFormElement>('cm-form').addEventListener('submit', e => {
    e.preventDefault();
    const next = [...rows, rowFromForm(form())];
    void analyze(next, { special: next.length - 1 });
  });
  $('cm-sample').onclick = async () => { const made = await construct('sample'); if (made) await analyze([...rows, ...made], { constructed: true, sampleIn: true }); };
  $('cm-stress').onclick = async () => { const made = await construct('stress'); if (made) await analyze(made, { replace: true, storm: true, constructed: true, sampleIn: false }); };
  $('cm-clear').onclick = () => { $<HTMLInputElement>('cm-id').value = 'V001'; void analyze([], { replace: true, constructed: false, sampleIn: false }); };

  /* ---------- the study's tests, pushed one by one ---------- */
  async function runTests() {
    if (!ready || !runtime || testing) return;
    testing = true; sync();
    const cells = new Map([...root.querySelectorAll<HTMLElement>('#cm-grid [data-test]')].map(c => [c.dataset.test!, c]));
    cells.forEach(c => { c.dataset.status = ''; c.querySelector('.cm-ck')!.textContent = ''; });
    const slam = $('cm-slam'), box = $('cm-tests');
    slam.classList.remove('go'); slam.textContent = ''; box.classList.remove('shk', 'bad'); $('cm-cmd').textContent = T.cmd;
    const events: TestEvent[] = [];
    let summary: TestSummary | null = null;
    try { summary = (await runtime.call<TestSummary>('campus_bridge', 'run_tests', ['test_analysis'], e => events.push(e as TestEvent))).value; }
    catch (e) { say(T.engineError((e as Error).message), true); }
    for (const e of events) {                    // the order and outcomes are the runner's; only the pace is slowed to be seen
      const c = cells.get(e.name); if (!c) continue;
      c.dataset.status = e.kind === 'start' ? 'run' : e.kind;
      c.querySelector('.cm-ck')!.textContent = e.kind === 'ok' ? '✓' : e.kind === 'fail' || e.kind === 'error' ? '✗' : '';
      if (!reduced) await wait(e.kind === 'start' ? 60 : 30);
    }
    if (summary) {
      const failed = events.find(e => e.kind === 'fail' || e.kind === 'error');
      $('cm-cmd').textContent = failed ? `${failed.name}: ${failed.message ?? failed.kind}` : ranLine(summary);
      slam.textContent = summaryLine(summary); box.classList.toggle('bad', !summary.ok);
      void slam.offsetWidth; slam.classList.add('go');
      if (!reduced) { await wait(190); void box.offsetWidth; box.classList.add('shk'); }
    }
    testing = false; sync();
  }
  $('cm-run').onclick = () => void runTests();

  /* ---------- boot ---------- */
  async function start() {
    if (runtime) return;
    $('cm-start').hidden = true; stage.dataset.state = 'booting'; say(T.booting);
    runtime = createPyRuntime(CAMPUS_RUNTIME);
    const files = JSON.parse(stage.dataset.files || '[]') as BootFile[];
    const view = bootView({ root, prefix: 'cm', text: T, chip: $('cm-chip'), reduced, shown: () => !stage.hidden, files: () => Promise.resolve(files) });
    try {
      const r = await runtime.boot(p => view.step(p));
      await view.done(r);
      ready = true; say(''); sync();
      const chip = $('cm-chip'); chip.textContent = T.chip(r.python); chip.classList.add('live');
    } catch (e) {
      console.error(e); view.hide(); runtime?.dispose(); runtime = null; ready = false; say(''); sync();
      stage.hidden = true; $('cm-fallback').hidden = false; stage.dataset.state = 'failed';
      return;
    }
    const made = await construct('sample');
    if (made) await analyze(made, { constructed: true, sampleIn: true });
  }
  $('cm-retry').onclick = () => { $('cm-fallback').hidden = true; stage.hidden = false; void start(); };

  /* ---------- when to start ---------- */
  sync();
  $('cm-light').hidden = !light || reduced;
  if (light) { $('cm-start').hidden = false; $('cm-start-btn').onclick = () => void start(); return; }
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); void start(); } }, { threshold: 0.2 });
  io.observe(stage);
}
