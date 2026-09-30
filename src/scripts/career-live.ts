import { createPyRuntime, type PyRuntime, type PyProgress, type PyReady } from './py-runtime';
import { wire, capInfo, observation, type EngineResult } from './career-wire';
import { createCircuit } from './career-circuit';
import { codeLive } from './code-live';
import { spinOdometer, setOdometerText } from './odometer-dom';
import { LIVE_TEXT, DEMO_JD, DEMO_FACTS } from './career-live-text';

type Status = 'user_confirmed' | 'needs_confirmation';
interface Candidate { days: number | null; statuses: Record<string, Status>; removed: string[]; added: { statement: string; skills: string[]; status: Status }[] }
type Answer = EngineResult | { error: string };
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));

export function initCareerLive(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh', T = LIVE_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const light = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData || matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const stage = $('cl-stage'), code = codeLive($('cl-code')), circuit = createCircuit($('cl-circuit'), lang);
  const cand: Candidate = { days: 4, statuses: {}, removed: [], added: [] };
  let jd = DEMO_JD, runtime: PyRuntime | null = null, ready = false, seq = 0, debounce = 0, charge: string | null = null, factKey = '';

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
    if (!runtime) { if (light) $('cl-start').hidden = false; else void start(); }
  }
  $('cl-toggle-replay').onclick = () => (stage.hidden ? showLive() : showReplay(false));
  $('cl-retry').onclick = () => { runtime?.dispose(); runtime = null; ready = false; showLive(); };

  /* ---------- boot: every number shown is measured ---------- */
  function bootView() {
    const box = $('cl-boot'), log = $('cl-boot-log'), hex = $('cl-boot-hex'), mods = $('cl-boot-mods');
    box.hidden = reduced; log.replaceChildren(); mods.replaceChildren(); hex.textContent = '';
    const t0 = performance.now(), rows: string[] = [];
    let addr = 0, modules: string[] = [];
    const hx = reduced ? 0 : window.setInterval(() => {
      const bytes = Array.from({ length: 16 }, () => ((Math.random() * 256) | 0).toString(16).padStart(2, '0'));
      rows.push(`${addr.toString(16).padStart(8, '0')}  ${bytes.slice(0, 8).join(' ')}  ${bytes.slice(8).join(' ')}`);
      addr += 0x10000; if (rows.length > 24) rows.shift(); hex.textContent = rows.join('\n');
    }, 35);
    return {
      step(p: PyProgress) {
        const d = document.createElement('div');
        d.textContent = T.bootLine(p.step, (performance.now() - t0) / 1000, p.bytes / 1048576, p.ms, p.detail);
        log.append(d);
        if (p.modules) modules = p.modules;
      },
      async done(r: PyReady) {
        clearInterval(hx);
        if (!reduced) {
          for (const m of modules) { const c = document.createElement('span'); c.className = 'cl-mod'; c.textContent = m; mods.append(c); }
          const chips = [...mods.children] as HTMLElement[];
          for (const c of chips) { c.classList.add('in'); await wait(30); }
          await wait(250);
          const t = $('cl-chip').getBoundingClientRect(), tx = t.left + t.width / 2, ty = t.top + t.height / 2;
          await Promise.all(chips.map((c, i) => {
            const b = c.getBoundingClientRect();
            return c.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${tx - b.left - b.width / 2}px, ${ty - b.top - b.height / 2}px) scale(.15)`, opacity: 0 }],
              { duration: 500, delay: i * 20, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
          }));
        }
        const d = document.createElement('div'); d.className = 'ready'; d.textContent = T.bootReady(r.python, r.ms / 1000); log.append(d);
        if (!reduced) await wait(300);
        box.hidden = true;
      },
      hide() { clearInterval(hx); box.hidden = true; },
    };
  }

  async function start() {
    $('cl-start').hidden = true; lock(true); say(T.booting);
    runtime = createPyRuntime({ bundles: ['/assets/py/job-agent/4397ded/'], files: ['/assets/py/career_bridge.py'], imports: ['career_bridge'] });
    const view = bootView();
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
  async function compute(parse: boolean) {
    if (!ready || !runtime) return;
    const id = ++seq;
    say(T.computing);
    let answer: Answer;
    try { answer = (await runtime.call<Answer>('career_bridge', 'run', [jd, cand])).value; }
    catch (e) { if (id === seq) say(T.engineError((e as Error).message), true); return; }
    if (id !== seq) return;                      // a newer edit has already asked again
    if ('error' in answer) { say(answer.error, true); return; }
    say('');
    await show(answer, parse, id);
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
    const view = $('cl-jd-view'), scan = $('cl-scan'), panel = view.getBoundingClientRect();
    scan.hidden = false;
    void scan.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${view.clientHeight}px)` }], { duration: 1000, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
      .finished.then(() => { scan.hidden = true; });
    await Promise.all(r.requirements.map(async (q, i) => {
      await wait(180 + i * 150);
      if (id !== seq) return;
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
      await wait(1100); if (id !== seq) return;
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
    if (id !== seq) return;
    code.on(last.line); code.count(last.line, `score = ${r.score}`);
  }

  async function show(r: EngineResult, parse: boolean, id: number) {
    const model = wire(r, lang);
    $('cl-lat').textContent = T.latency(r.ms);
    renderFacts(r.profile.facts);
    markJD(r);
    code.reset(); $('cl-ceil').className = 'cl-ceil'; $('cl-obs').textContent = '';
    const fly = parse && !reduced;
    const drawn = circuit.render(model, { draw: !reduced, hideReqs: fly });
    if (fly) await flyReqs(r, id);
    await drawn; if (id !== seq) return;
    if (charge && model.materials.includes(charge)) await circuit.charge(charge);
    charge = null;
    await circuit.flowMaterials(); if (id !== seq) return;
    const n = $('cl-facts-n');
    if (reduced) setOdometerText(n, String(model.materials.length)); else spinOdometer(n, String(model.materials.length), 0, n.textContent || '0');
    await score(r, id); if (id !== seq) return;
    $('cl-obs').textContent = observation(r, lang);
  }

  /* ---------- the candidate editor ---------- */
  function renderFacts(facts: { id: string; statement: string; status: string }[]) {
    const list = $('cl-facts'), key = facts.map(f => f.id).join('|');
    if (key === factKey) {
      for (const f of facts) { const s = list.querySelector<HTMLSelectElement>(`select[data-id="${f.id}"]`); if (s && s.value !== f.status) s.value = f.status; }
      return;
    }
    factKey = key;
    list.replaceChildren(...facts.map(f => {
      const li = document.createElement('li');
      const text = document.createElement('span'); text.className = 'cl-fact'; text.textContent = f.statement;
      const idEl = document.createElement('small'); idEl.textContent = f.id;
      li.append(text, idEl);
      const visitor = f.id.startsWith('fact-visitor-'), index = Number(f.id.split('-').pop()) - 1;
      if (f.status === 'documented') {
        const b = document.createElement('span'); b.className = 'cl-doc'; b.textContent = T.documented; li.append(b);
      } else {
        const s = document.createElement('select'); s.dataset.id = f.id; s.setAttribute('aria-label', `${T.statusLabel}：${f.statement}`);
        for (const [v, t] of T.statusOptions) s.add(new Option(t, v, false, v === f.status));
        s.onchange = () => {
          const v = s.value as Status;
          if (visitor) cand.added[index].status = v; else cand.statuses[f.id] = v;
          if (v === 'user_confirmed') charge = f.id;
          schedule();
        };
        li.append(s);
      }
      const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'cl-link'; rm.textContent = T.remove;
      rm.setAttribute('aria-label', `${T.remove}：${f.statement}`);
      rm.onclick = () => { if (visitor) cand.added.splice(index, 1); else cand.removed.push(f.id); factKey = ''; schedule(); };
      li.append(rm);
      return li;
    }));
  }
  $<HTMLSelectElement>('cl-days').onchange = e => { const v = (e.target as HTMLSelectElement).value; cand.days = v ? Number(v) : null; schedule(); };
  $('cl-add-btn').onclick = () => {
    const text = $<HTMLInputElement>('cl-add-text'), skills = $<HTMLInputElement>('cl-add-skills');
    const statement = text.value.trim();
    if (!statement) { say(T.addEmpty, true); return; }
    cand.added.push({ statement, skills: skills.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean), status: $<HTMLSelectElement>('cl-add-status').value as Status });
    text.value = ''; skills.value = ''; factKey = ''; schedule();
  };
  $('cl-jd-toggle').onclick = () => {
    const input = $<HTMLTextAreaElement>('cl-jd-input'), view = $('cl-jd-view'), btn = $('cl-jd-toggle');
    if (input.hidden) { input.value = jd; input.hidden = false; view.hidden = true; btn.textContent = T.jdDone; input.focus(); return; }
    jd = input.value; input.hidden = true; view.hidden = false; view.textContent = jd; btn.textContent = T.jdEdit;
    void compute(true);
  };
  $('cl-rerun').onclick = () => void compute(true);

  /* ---------- when to start ---------- */
  renderFacts(DEMO_FACTS);
  lock(true);
  if (new URLSearchParams(location.search).get('engine') === 'replay') { showReplay(false); return; }
  if (light) { $('cl-start').hidden = false; $('cl-start-btn').onclick = () => void start(); return; }
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); void start(); } }, { threshold: 0.2 });
  io.observe(stage);
}
