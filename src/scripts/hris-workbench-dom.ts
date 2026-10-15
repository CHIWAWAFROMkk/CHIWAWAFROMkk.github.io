import type { DemoCase, StepId, Outcome, StepState } from './hris-demo';
import { trace } from './hris-demo';
import type { Version } from '../data/hris-workbench';
import type { Bi, Lang } from '../i18n';

interface Data { lang: Lang; cases: DemoCase[]; versions: Version[]; steps: { id: StepId; label: Bi }[]; outcome: Record<Outcome, Bi>; state: Record<StepState, Bi>; notRecorded: Bi }

/** Switches the terminal between records and versions. The server already rendered record 1 and the final version, so
 *  without the script the page is complete; with it, each switch re-renders the right pane and replays its motion. */
export function initWorkbench(root: HTMLElement): void {
  const data = JSON.parse(root.querySelector('[data-wb-data]')!.textContent!) as Data;
  const L = data.lang;
  let record = data.cases[0], version = data.versions[2];
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const replay = (el: Element) => { el.classList.remove('is-on'); void (el as HTMLElement).offsetWidth; el.classList.add('is-on'); };

  const render = () => {
    $('.wb-nature').textContent = version.nature[L];
    $('.wb-chain').replaceChildren(...version.chain.map(c => Object.assign(document.createElement('li'), { textContent: c[L] })));
    const states = trace(record);
    root.querySelectorAll<HTMLElement>('.wb-steps li').forEach((li, i) => {
      const step = data.steps[i];
      li.dataset.state = states[i].state;
      li.querySelector('.wb-tool')!.textContent = version.tools[step.id]?.[L] ?? data.notRecorded[L];
      li.querySelector('.wb-state')!.textContent = data.state[states[i].state][L];
    });
    $('.wb-situation').textContent = record.situation[L];
    $('.wb-trail').replaceChildren(...record.trail.map((t, i) => { const li = document.createElement('li'); li.textContent = t[L]; li.style.setProperty('--i', String(i)); return li; }));
    const out = $<HTMLElement>('.wb-outcome');
    out.dataset.outcome = record.outcome;
    out.textContent = data.outcome[record.outcome][L];
    $('.wb-result').textContent = record.result[L];
    const next = $('.wb-next');
    next.textContent = next.textContent!.split(/[:：]/)[0] + (L === 'zh' ? '：' : ': ') + record.next[L];
    for (const el of [$('.wb-steps'), $('.wb-trail'), out, $('.wb-chain')]) replay(el);
  };

  root.querySelectorAll<HTMLButtonElement>('[data-wb-record]').forEach(b => b.addEventListener('click', () => {
    record = data.cases.find(c => c.id === b.dataset.wbRecord)!;
    root.querySelectorAll('[data-wb-record]').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    render();
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-wb-version]').forEach(b => b.addEventListener('click', () => {
    version = data.versions.find(v => v.id === b.dataset.wbVersion)!;
    root.querySelectorAll('[data-wb-version]').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    render();
  }));
}
