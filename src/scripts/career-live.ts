import { createPyRuntime, type PyRuntime } from './py-runtime';
import { bootView } from './py-boot-view';
import { wire, capInfo, observation, MAX_DRAWN, type EngineResult } from './career-wire';
import { createCircuit } from './career-circuit';
import { codeLive } from './code-live';
import { spinOdometer, setOdometerText } from './odometer-dom';
import { LIVE_TEXT, DEMO_JD, DEMO_FACTS } from './career-live-text';

type Status = 'user_confirmed' | 'needs_confirmation';
/** Each added experience keeps a stable key, so edits never depend on list positions that change while the engine runs. */
interface Added { key: number; statement: string; skills: string[]; status: Status }
interface Candidate { days: number | null; statuses: Record<string, Status>; removed: string[]; added: Added[] }
type Answer = EngineResult | { error: string; params: Record<string, number> };
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const MANIFESTS = ['/assets/vendor/pyodide/0.29.5/manifest.json', '/assets/py/job-agent/4397ded/manifest.json'];

export function initCareerLive(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh', T = LIVE_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const light = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData || matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const stage = $('cl-stage'), code = codeLive($('cl-code')), circuit = createCircuit($('cl-circuit'), lang);
  const cand: Candidate = { days: 4, statuses: {}, removed: [], added: [] };
  // reqSeq drops answers a newer edit has superseded; showSeq stops an animation only when a newer result will be shown,
  // so an input error never leaves the previous result half drawn.
  let jd = DEMO_JD, runtime: PyRuntime | null = null, ready = false, reqSeq = 0, showSeq = 0, debounce = 0, charge: string | null = null, nextKey = 1;

  const say = (text: string, bad = false) => { const s = $('cl-status'); s.textContent = text; s.classList.toggle('bad', bad); };
  const lock = (on: boolean) => {
    $<HTMLFieldSetElement>('cl-cand').disabled = on;
    $<HTMLButtonElement>('cl-rerun').disabled = on;
    $<HTMLButtonElement>('cl-jd-toggle').disabled = on;
  };

  /* ---------- replay fallback ---------- */
  function showReplay(failed: boolean) {
    stage.hidden = true; $('cl-replay').hidden = false; $('cl-fallback-note').hidden = !failed;
    $('cl-toggle-replay').textContent = T.toLive;
  }
  function showLive() {
    stage.hidden = false; $('cl-replay').hidden = true; $('cl-toggle-replay').textContent = T.toReplay;
    if (ready) void compute(false);                // draw at the width the stage has now
    else if (!runtime) { if (light) $('cl-start').hidden = false; else void start(); }
  }
  $('cl-toggle-replay').onclick = () => (stage.hidden ? showLive() : showReplay(false));
  $('cl-retry').onclick = () => { runtime?.dispose(); runtime = null; ready = false; showLive(); };

  async function start() {
    $('cl-start').hidden = true; lock(true); say(T.booting);
    runtime = createPyRuntime({ bundles: ['/assets/py/job-agent/4397ded/'], files: ['/assets/py/career_bridge.py'], imports: ['career_bridge'], packages: ['pydantic', 'sqlite3'] });
    const view = bootView({
      root, prefix: 'cl', text: T, chip: $('cl-chip'), reduced, shown: () => !stage.hidden,
      files: () => Promise.all(MANIFESTS.map(u => fetch(u).then(r => r.json()))).then(ms =>
        ms.flatMap(m => m.files.map((f: { name?: string; path?: string; sha256: string }) => ({ name: f.name ?? f.path ?? '', sha256: f.sha256 })))),
    });
    try {
      const r = await runtime.boot(p => view.step(p));
      await view.done(r);
      ready = true; lock(false); say('');
      const chip = $('cl-chip'); chip.textContent = T.chip(r.python); chip.classList.add('live');
      await compute(true);
    } catch (e) {
      console.error(e); view.hide(); runtime?.dispose(); runtime = null; ready = false; say('');
      showReplay(true);
    }
  }

  /* ---------- one engine call ---------- */
  const payload = () => ({ ...cand, added: cand.added.map(({ statement, skills, status }) => ({ statement, skills, status })) });
  async function compute(parse: boolean) {
    if (!ready || !runtime) return;
    const req = ++reqSeq;
    say(T.computing);
    let answer: Answer;
    try { answer = (await runtime.call<Answer>('career_bridge', 'run', [jd, payload()])).value; }
    catch (e) { if (req === reqSeq) say(T.engineError((e as Error).message), true); return; }
    if (req !== reqSeq) return;                  // a newer edit has already asked again
    if ('error' in answer) { say(T.errors[answer.error]?.(answer.params) ?? answer.error, true); return; }
    say('');
    if (stage.hidden) return;                    // the replay is showing; showLive() recomputes at the right width
    await show(answer, parse, ++showSeq);
  }
  const schedule = () => { clearTimeout(debounce); debounce = window.setTimeout(() => void compute(false), 600); };

  function markJD(r: EngineResult) {
    let html = '', pos = 0, from = 0;
    r.requirements.forEach((q, i) => {
      const at = jd.indexOf(q.text, from);
      if (at < 0) return;
      html += esc(jd.slice(pos, at)) + `<mark data-i="${i}">${esc(q.text)}</mark>`;
      pos = from = at + q.text.length;
    });
    $('cl-jd-view').innerHTML = html + esc(jd.slice(pos));
  }

  async function flyReqs(r: EngineResult, id: number) {
    const drawn = r.requirements.slice(0, MAX_DRAWN);
    if (stage.hidden) { drawn.forEach((_, i) => circuit.reveal(i)); return; }
    const view = $('cl-jd-view'), scan = $('cl-scan'), panel = view.getBoundingClientRect();
    const step = Math.min(150, 1200 / Math.max(1, drawn.length));   // the whole fly-in stays under about two seconds
    scan.hidden = false;
    void scan.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${view.clientHeight}px)` }], { duration: 1000, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
      .finished.then(() => { scan.hidden = true; });
    await Promise.all(drawn.map(async (q, i) => {
      await wait(180 + i * step);
      if (id !== showSeq) return;
      const mark = view.querySelector<HTMLElement>(`mark[data-i="${i}"]`);
      mark?.classList.add('hit');
      const from = mark?.getBoundingClientRect() ?? panel, to = circuit.reqRect(i);
      if (!to) { circuit.reveal(i); return; }
      const f = document.createElement('div'); f.className = 'cl-fly'; f.textContent = q.text;
      f.style.left = `${from.left}px`; f.style.top = `${from.top}px`; root.append(f);
      const dx = to.left + 12 - from.left, dy = to.top + 10 - from.top;
      await f.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px)`, opacity: .95, offset: .85 }, { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }],
        { duration: 620, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
      f.remove(); circuit.reveal(i);
    }));
  }

  function ceiling(tone: 'fail' | 'unknown', cap: number) {
    const c = $('cl-ceil');
    $('cl-ceil-t').textContent = tone === 'fail' ? T.ceilFail(cap) : T.ceilUnknown(cap);
    c.className = `cl-ceil ${tone === 'fail' ? 'fail' : 'soft'}`; void c.offsetWidth; c.classList.add('down');
  }
  function slamFx(tone: 'fail' | 'unknown') {
    stage.animate([{ transform: 'none' }, { transform: 'translate(-7px,2px)' }, { transform: 'translate(6px,-2px)' }, { transform: 'translate(-4px,1px)' }, { transform: 'translate(2px,0)' }, { transform: 'none' }], { duration: 380 });
    const v = $('cl-vig'); v.className = `cl-vig ${tone === 'fail' ? 'fail' : 'soft'}`;
    v.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 0 }], { duration: 700 });
    const s = $('cl-score'); s.classList.remove('squash'); void s.offsetWidth; s.classList.add('squash');
    if (tone === 'fail') circuit.burst();
  }

  async function score(r: EngineResult, id: number) {
    const cap = capInfo(r), el = $('cl-score'), before = el.textContent || '0';
    const last = cap.steps[cap.steps.length - 1], branch = cap.steps.slice(0, -1);
    const apply = (s: (typeof cap.steps)[number]) => (s.mode === 'on' ? code.on(s.line, s.tone) : code.flash(s.line, s.tone));
    $('cl-raw').textContent = T.raw(r.raw);
    if (reduced) {
      setOdometerText(el, String(r.score));
      if (cap.slam && cap.tone) ceiling(cap.tone, r.cap!);
      branch.forEach(apply); code.on(last.line); code.count(last.line, `score = ${r.score}`);
      return;
    }
    code.flash(697);
    if (cap.slam && cap.tone) {
      spinOdometer(el, String(r.raw), 0, before);
      await wait(1100); if (id !== showSeq) return;
      ceiling(cap.tone, r.cap!); slamFx(cap.tone);
      branch.forEach(apply);
      code.count(cap.tone === 'fail' ? 698 : 700, `→ ${r.cap}`);
      spinOdometer(el, String(r.score), 0, String(r.raw), 260);
      await wait(420);
    } else {
      branch.forEach(apply);
      spinOdometer(el, String(r.score), 0, before);
      await wait(1100);
    }
    if (id !== showSeq) return;
    code.on(last.line); code.count(last.line, `score = ${r.score}`);
  }

  async function show(r: EngineResult, parse: boolean, id: number) {
    const model = wire(r, lang);
    $('cl-lat').textContent = T.latency(r.ms);
    markJD(r);
    code.reset(); $('cl-ceil').className = 'cl-ceil'; $('cl-obs').textContent = '';
    const fly = parse && !reduced;
    const drawn = circuit.render(model, { draw: !reduced, hideReqs: fly });
    if (fly) await flyReqs(r, id);
    await drawn; if (id !== showSeq) return;
    if (charge && model.materials.includes(charge)) await circuit.charge(charge);
    charge = null;
    await circuit.flowMaterials(); if (id !== showSeq) return;
    const n = $('cl-facts-n');
    if (reduced) setOdometerText(n, String(model.materials.length)); else spinOdometer(n, String(model.materials.length), 0, n.textContent || '0');
    await score(r, id); if (id !== showSeq) return;
    $('cl-obs').textContent = observation(r, lang);
  }

  /* ---------- the candidate editor: drawn from the page's own state, immediately on every edit ---------- */
  function renderCand() {
    const base = DEMO_FACTS.filter(f => !cand.removed.includes(f.id)).map(f => ({ id: f.id, statement: f.statement, status: cand.statuses[f.id] ?? f.status, key: 0 }));
    const added = cand.added.map((a, i) => ({ id: `fact-visitor-${i + 1}`, statement: a.statement, status: a.status as string, key: a.key }));
    $('cl-facts').replaceChildren(...[...base, ...added].map(f => {
      const li = document.createElement('li');
      const text = document.createElement('span'); text.className = 'cl-fact'; text.textContent = f.statement;
      const idEl = document.createElement('small'); idEl.textContent = f.id;
      li.append(text, idEl);
      if (f.status === 'documented') {
        const b = document.createElement('span'); b.className = 'cl-doc'; b.textContent = T.documented; li.append(b);
      } else {
        const s = document.createElement('select'); s.setAttribute('aria-label', `${T.statusLabel}：${f.statement}`);
        if (!f.key) s.dataset.id = f.id;
        for (const [v, t] of T.statusOptions) s.add(new Option(t, v, false, v === f.status));
        s.onchange = () => {
          const v = s.value as Status;
          if (f.key) { const a = cand.added.find(x => x.key === f.key); if (a) a.status = v; } else cand.statuses[f.id] = v;
          if (v === 'user_confirmed') charge = f.id;
          schedule();
        };
        li.append(s);
      }
      const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'cl-link'; rm.textContent = T.remove;
      rm.setAttribute('aria-label', `${T.remove}：${f.statement}`);
      rm.onclick = () => {
        if (f.key) cand.added = cand.added.filter(x => x.key !== f.key); else cand.removed.push(f.id);
        renderCand(); schedule();
      };
      li.append(rm);
      return li;
    }));
  }
  $<HTMLSelectElement>('cl-days').onchange = e => { const v = (e.target as HTMLSelectElement).value; cand.days = v ? Number(v) : null; schedule(); };
  $('cl-add-btn').onclick = () => {
    const text = $<HTMLInputElement>('cl-add-text'), skills = $<HTMLInputElement>('cl-add-skills');
    const statement = text.value.trim();
    if (!statement) { say(T.addEmpty, true); return; }
    cand.added.push({ key: nextKey++, statement, skills: skills.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean), status: $<HTMLSelectElement>('cl-add-status').value as Status });
    text.value = ''; skills.value = ''; renderCand(); schedule();
  };
  $('cl-jd-toggle').onclick = () => {
    const input = $<HTMLTextAreaElement>('cl-jd-input'), view = $('cl-jd-view'), btn = $('cl-jd-toggle');
    if (input.hidden) { input.value = jd; input.hidden = false; view.hidden = true; btn.textContent = T.jdDone; input.focus(); return; }
    jd = input.value; input.hidden = true; view.hidden = false; view.textContent = jd; btn.textContent = T.jdEdit;
    void compute(true);
  };
  $('cl-rerun').onclick = () => void compute(true);

  /* ---------- when to start ---------- */
  renderCand();
  lock(true);
  $('cl-start-btn').onclick = () => void start();          // bound before any early return: the replay entry can switch to live later
  if (new URLSearchParams(location.search).get('engine') === 'replay') { showReplay(false); return; }
  if (light) { $('cl-start').hidden = false; return; }
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); void start(); } }, { threshold: 0.2 });
  io.observe(stage);
}
