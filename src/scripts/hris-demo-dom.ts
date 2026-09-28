import { CASES, DEMO_TEXT, OUTCOME_LABEL, STATE_LABEL, STEPS, stepFromPointer, trace, type DemoCase } from './hris-demo';

export function bindDemo(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-case]')];
  const bar = root.querySelector<HTMLElement>('[data-steps]');
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const lines = [...root.querySelectorAll<HTMLElement>('[data-line]')];
  const skipped = root.querySelector<HTMLElement>('[data-skipped]');
  let current: DemoCase = CASES[0];
  /** Step being inspected, or null for "show everything the record reached". */
  let inspect: number | null = null;

  const set = (sel: string, text: string) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  };

  const renderCard = () => {
    const reached = current.trail.length;
    const upto = inspect ?? reached - 1;
    lines.forEach((li, i) => {
      li.hidden = i > upto || i >= reached;
      li.classList.toggle('is-stop', current.outcome !== 'done' && i === reached - 1);
      const text = li.querySelector('[data-line-text]');
      if (text) text.textContent = current.trail[i]?.[lang] ?? '';
    });
    if (skipped) skipped.hidden = upto < reached;
    steps.forEach((s, i) => s.classList.toggle('is-current', i === upto));
    bar?.setAttribute('aria-valuenow', String(upto + 1));
    bar?.setAttribute('aria-valuetext', STEPS[upto].label[lang]);
  };

  const show = (id: string) => {
    const c = CASES.find(x => x.id === id);
    if (!c) return;
    current = c;
    inspect = null;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.case === id));
    set('[data-situation]', c.situation[lang]);
    trace(c).forEach((s, i) => {
      const el = steps[i];
      if (!el) return;
      el.dataset.state = s.state;
      const sr = el.querySelector('.sr');
      if (sr) sr.textContent = STATE_LABEL[s.state][lang];
    });
    set('[data-outcome]', OUTCOME_LABEL[c.outcome][lang]);
    set('[data-result]', c.result[lang]);
    set('[data-next]', DEMO_TEXT.nextLabel[lang] + c.next[lang]);
    renderCard();
  };

  const inspectAt = (i: number | null) => {
    if (i === inspect) return;
    inspect = i;
    renderCard();
  };

  for (const b of buttons) b.addEventListener('click', () => show(b.dataset.case ?? ''));

  if (bar) {
    const fromEvent = (e: PointerEvent) => {
      const r = bar.getBoundingClientRect();
      return stepFromPointer(e.clientX, r.left, r.width, STEPS.length);
    };
    bar.addEventListener('pointermove', e => inspectAt(fromEvent(e)));
    bar.addEventListener('pointerdown', e => inspectAt(fromEvent(e)));
    bar.addEventListener('pointerleave', () => inspectAt(null));
    bar.addEventListener('keydown', e => {
      const at = inspect ?? current.trail.length - 1;
      const next = { ArrowRight: at + 1, ArrowUp: at + 1, ArrowLeft: at - 1, ArrowDown: at - 1, Home: 0, End: STEPS.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      inspectAt(Math.min(STEPS.length - 1, Math.max(0, next)));
    });
    bar.addEventListener('blur', () => inspectAt(null));
  }
}
