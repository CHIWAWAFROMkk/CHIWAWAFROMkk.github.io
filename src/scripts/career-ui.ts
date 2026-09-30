import { CAREER_TEXT, scenarioId, observation } from './career-text';
import { spinOdometer, setOdometerText } from './odometer-dom';

interface Fact { id: string; statement: string; status: string }
interface Scenario {
  id: string; days: number | null; tableauConfirmed: boolean;
  profile: { experiences: { facts: Fact[] }[] };
  match: {
    overall_score: number; recommendation: string; score_breakdown: Record<string, number>; why_fit: string[]; why_not_fit: string[];
    evidence: { requirement: string; status: string; profile_fact_ids: string[]; explanation: string }[];
    hard_gates: { requirement: string; status: string; explanation: string }[];
  };
  pack: { evidence: unknown[]; review_checklist: { item: string; status: string; detail: string; blocks_submission: boolean }[]; materials: Record<string, string | string[]> };
}
interface Demo { disclaimer: string; sourceCommit: string; sourceHashes: Record<string, string>; jd: string; scenarios: Scenario[] }

/** Port of the original career-demo.mjs: replays the six engine outputs; only the interface strings are language-aware. */
export function initCareer(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const T = CAREER_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; return el; };
  const label = (k: string) => T.labels[k] ?? k;
  let demo: Demo | null = null;
  let selected: Scenario | null = null;
  let first = true;

  const setNum = (id: string, text: string) => (first ? setOdometerText($(id), text) : spinOdometer($(id), text, 0, $(id).textContent ?? undefined));
  const rows = (id: string, data: string[][]) => $(id).replaceChildren(...data.map(r => { const tr = node('tr'); r.forEach(v => tr.append(node('td', v))); return tr; }));
  const draft = () => {
    if (!selected) return;
    const v = selected.pack.materials[$<HTMLSelectElement>('agent-material').value];
    $('agent-draft').textContent = Array.isArray(v) ? v.map((x, i) => `${i + 1}. ${x}`).join('\n') : v ?? '';
  };

  function render() {
    if (!demo) return;
    const s = demo.scenarios.find(x => x.id === scenarioId($<HTMLSelectElement>('agent-days').value, $<HTMLSelectElement>('agent-evidence').value));
    if (!s) { $('agent-status').textContent = T.notFound; return; }
    selected = s;
    const { match, pack, profile } = s;
    $('agent-status').textContent = T.status(s.days, s.tableauConfirmed);
    $('agent-jd').textContent = demo.jd;
    $('agent-profile').replaceChildren(...profile.experiences[0].facts.map(f => {
      const p = node('p'); const tag = node('span', label(f.status)); tag.className = 'tag';
      p.append(tag, node('span', f.statement), node('small', f.id)); return p;
    }));
    setNum('agent-score', String(match.overall_score));
    setNum('agent-facts', String(pack.evidence.length));
    setNum('agent-blocks', String(pack.review_checklist.filter(x => x.blocks_submission).length));
    $('agent-recommendation').textContent = label(match.recommendation);
    $('agent-observation').textContent = observation(lang, s.days, s.tableauConfirmed);
    $('agent-breakdown').replaceChildren(...Object.entries(match.score_breakdown).map(([k, v]) => { const d = node('div'); d.append(node('dt', T.names[k] ?? k), node('dd', String(v))); return d; }));
    $('agent-reasons').replaceChildren(...[...match.why_fit, ...match.why_not_fit].map(x => node('li', x)));
    rows('agent-matches', match.evidence.map(x => [x.requirement, label(x.status), x.profile_fact_ids.join(', ') || T.noEvidence, x.explanation]));
    rows('agent-gates', match.hard_gates.map(x => [x.requirement, label(x.status), x.explanation]));
    rows('agent-review', pack.review_checklist.map(x => [x.item, label(x.status), x.detail, x.blocks_submission ? T.yes : T.no]));
    draft();
    first = false;
  }

  async function load() {
    $('agent-retry').hidden = true;
    $('agent-status').textContent = T.loading;
    try {
      const response = await fetch('/assets/job-agent-demo.json');
      if (!response.ok) throw Error(String(response.status));
      const data = await response.json() as Demo;
      if (!Array.isArray(data.scenarios) || data.scenarios.length !== 6) throw Error('scenarios');
      demo = data;
      render();
      $('agent-results').hidden = false;
      $<HTMLSelectElement>('agent-days').disabled = false;
      $<HTMLSelectElement>('agent-evidence').disabled = false;
    } catch (e) {
      console.error(e);
      $('agent-status').textContent = T.loadFailed;
      $('agent-retry').hidden = false;
    }
  }

  $<HTMLSelectElement>('agent-days').onchange = render;
  $<HTMLSelectElement>('agent-evidence').onchange = render;
  $<HTMLSelectElement>('agent-material').onchange = draft;
  $('agent-retry').onclick = load;
  $('agent-export').onclick = () => {
    if (!demo || !selected) return;
    const content = { disclaimer: demo.disclaimer, sourceCommit: demo.sourceCommit, sourceHashes: demo.sourceHashes, ...selected };
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
    const a = node('a'); a.href = url; a.download = `job-agent-example-${selected.id}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  load();
}
