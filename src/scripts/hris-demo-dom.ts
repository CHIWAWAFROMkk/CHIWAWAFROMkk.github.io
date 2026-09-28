import { CASES, DEMO_TEXT, OUTCOME_LABEL, STATE_LABEL, trace } from './hris-demo';

export function bindDemo(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-case]')];
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const set = (sel: string, text: string) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  };

  const show = (id: string) => {
    const c = CASES.find(x => x.id === id);
    if (!c) return;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.case === id));
    set('[data-situation]', c.situation[lang]);
    trace(c).forEach((s, i) => {
      const li = steps[i];
      if (!li) return;
      li.dataset.state = s.state;
      const sr = li.querySelector('.sr');
      if (sr) sr.textContent = STATE_LABEL[s.state][lang];
    });
    set('[data-outcome]', OUTCOME_LABEL[c.outcome][lang]);
    set('[data-result]', c.result[lang]);
    set('[data-next]', DEMO_TEXT.nextLabel[lang] + c.next[lang]);
  };

  for (const b of buttons) b.addEventListener('click', () => show(b.dataset.case ?? ''));
}
