/** The AI-on-campus live demo: the study's own program running in the browser. Constants and types shared by the page,
 *  the pipeline and the tests; the functions further down are pure. */

/** What the page's Python runtime loads: no packages (analysis.py uses only the standard library), the study's program
 *  and tests from the very URLs the page offers for download, and the site's bridge. */
export const CAMPUS_RUNTIME = {
  bundles: [] as string[],
  files: ['/downloads/campus/analysis.py', '/downloads/campus/test_analysis.py', '/assets/py/campus_bridge.py'],
  imports: ['campus_bridge'],
  packages: [] as string[],
};
/** The Pyodide core files a runtime without packages downloads (their sizes and hashes are in the vendored manifest). */
export const CORE_FILES = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
/** The collection window of every analyze() call; the constructed rows and the form's default date fall inside it. */
export const WINDOW = { start: '2026-09-01', end: '2026-09-30' } as const;
export const SCENARIOS = ['study', 'campus', 'club', 'daily', 'career', 'other'] as const;
export const FREQUENCIES = ['1_3', '4_15', '16_30'] as const;
export const GATE_KEYS = ['duplicate_id', 'no_consent', 'ineligible', 'outside_period'] as const;
export type Scenario = (typeof SCENARIOS)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type GateKey = (typeof GATE_KEYS)[number];

/** One questionnaire answer in analysis.py's input format (public/downloads/campus/questionnaire.md). */
export interface Row {
  respondent_id: string; collected_on: string; consent: boolean; eligible: boolean;
  used_ai: 'yes' | 'no' | 'unsure' | null; frequency: Frequency | null; scenarios: Scenario[] | null;
  helpfulness: number | null; verification: number | null;
}
export interface Rating { answered_n: number; missing_n: number; distribution: Record<'1' | '2' | '3' | '4' | '5', number>; median: number | null }
/** analyze()'s output, exactly as the program returns it. */
export interface Analysis {
  status: string; scope: string; period_start: string; period_end: string;
  input_n: number; included_n: number; excluded: Record<GateKey, number>; duplicate_id_groups: number;
  usage: { counts: { yes: number; no: number; unsure: number }; denominator_n: number; yes_share: number | null };
  scenarios: { answered_n: number; missing_n: number; items: Record<Scenario, { n: number; share: number | null }> };
  helpfulness: Rating; verification: Rating;
  frequency_groups: Record<Frequency, { n: number; helpfulness: Rating }>;
  limitations: string[];
}
/** campus_bridge.analyze_traced: the result, how often each of lines 87–97 ran, the branch line each row took, times. */
export interface Traced { result: Analysis; lines: Record<string, number>; branches: number[]; ms: number; traced_ms: number }
/** analyze() refused the input: its ValueError message, verbatim. */
export interface Invalid { error: 'invalid'; message: string }
export interface TestEvent { kind: 'start' | 'ok' | 'fail' | 'error' | 'skip'; name: string; message?: string | null }
export interface TestSummary { run: number; failures: number; errors: number; ok: boolean; ms: number }

/* ---------- pure functions ---------- */

/** The exclusion gate a row stops at (0 duplicate ID · 1 no consent · 2 not eligible · 3 outside the window), or -1
 *  when it is included. */
export type Gate = 0 | 1 | 2 | 3 | -1;
export const GATE_LINES = [89, 91, 93, 95] as const;
export const INCLUDED_LINE = 97;

export function gateOf(line: number): Gate {
  const g = (GATE_LINES as readonly number[]).indexOf(line);
  if (g >= 0) return g as Gate;
  if (line === INCLUDED_LINE) return -1;
  throw new Error(`not a branch line: ${line}`);
}
/** Lines 88–97 one row runs through: each test up to the branch it takes, then that branch (the loop header, line 87,
 *  is counted apart; Python reports no line event for the bare `else:` on line 96). */
export function linesOf(g: Gate): number[] {
  const tests = g < 0 ? 4 : g + 1;
  const out = Array.from({ length: tests }, (_, k) => 88 + 2 * k);
  out.push(g === -1 ? INCLUDED_LINE : GATE_LINES[g]);          // === narrows the union; < 0 would not
  return out;
}
/** The line counts a complete run of the loop over these rows gives; the header runs once more than there are rows. */
export function tally(gates: Gate[]): Record<number, number> {
  const out: Record<number, number> = { 87: gates.length + 1 };
  for (const g of gates) for (const n of linesOf(g)) out[n] = (out[n] ?? 0) + 1;
  return out;
}
/** The counts to show before the replay starts: the real trace minus what the replayed rows will add as they pass. */
export function baseline(trace: Record<string, number>, gates: Gate[], animate: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [n, c] of Object.entries(trace)) out[Number(n)] = c;
  out[87] -= animate.length;
  for (const i of animate) for (const n of linesOf(gates[i])) out[n] -= 1;
  return out;
}

export interface FormState {
  id: string; date: string; consent: boolean; eligible: boolean;
  used: 'yes' | 'no' | 'unsure'; frequency: Frequency; scenarios: Scenario[];
  helpfulness: number | null; verification: number | null;
}
/** One answer as analysis.py expects it: Q1 or Q2 "no" ends the questionnaire, Q4–Q7 apply only to Q3 "yes", and no
 *  scenario ticked means Q5 was skipped. Nothing is corrected here — the program itself decides what is valid. */
export function rowFromForm(f: FormState): Row {
  const answered = f.consent && f.eligible, yes = answered && f.used === 'yes';
  return {
    respondent_id: f.id, collected_on: f.date, consent: f.consent, eligible: f.eligible,
    used_ai: answered ? f.used : null,
    frequency: yes ? f.frequency : null,
    scenarios: yes && f.scenarios.length ? [...f.scenarios] : null,
    helpfulness: yes ? f.helpfulness : null,
    verification: yes ? f.verification : null,
  };
}
/** The first visitor ID (V001, V002, …) not yet in the data. */
export function nextId(rows: Row[]): string {
  const used = new Set(rows.map(r => r.respondent_id));
  for (let n = 1; ; n++) { const id = `V${String(n).padStart(3, '0')}`; if (!used.has(id)) return id; }
}

/** Where every row of a data set went, as the pipeline draws it. */
export interface Flow {
  gates: Gate[];
  /** Q3 of each row: 0 yes · 1 no · 2 unsure (rows that never answered Q3 count as 0; they are never drawn as cells). */
  used: (0 | 1 | 2)[];
  /** The row index behind each lit cell of the included matrix, in row order. */
  cells: number[];
  excluded: [number, number, number, number];
}
export function flowOf(rows: Row[], branches: number[]): Flow {
  if (branches.length !== rows.length) throw new Error(`${branches.length} branches for ${rows.length} rows`);
  const gates = branches.map(gateOf), cells: number[] = [], excluded: Flow['excluded'] = [0, 0, 0, 0];
  gates.forEach((g, i) => { if (g === -1) cells.push(i); else excluded[g]++; });
  const used = rows.map(r => (r.used_ai === 'no' ? 1 : r.used_ai === 'unsure' ? 2 : 0) as 0 | 1 | 2);
  return { gates, used, cells, excluded };
}
/** Rows to replay: the new ones, and those whose branch changed (the program re-checks every row on every run). */
export function toAnimate(prev: Gate[], next: Gate[]): number[] {
  const out: number[] = [];
  next.forEach((g, i) => { if (i >= prev.length || prev[i] !== g) out.push(i); });
  return out;
}

export interface StatsView {
  included: string; input: string; yes: string; counts: { yes: string; no: string; unsure: string };
  sceneDen: string; sceneMissing: string; scenes: { key: Scenario; share: number; text: string }[];
  help: { dist: number[]; median: number | null; medianText: string; answered: string; missing: string };
}
const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (v: number | null, digits: number) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
/** Every figure of the statistics panel, read from analyze()'s output; a share with no denominator stays "—". */
export function statsView(a: Analysis): StatsView {
  const m = a.helpfulness.median;
  return {
    included: fmt(a.included_n), input: fmt(a.input_n), yes: pct(a.usage.yes_share, 1),
    counts: { yes: fmt(a.usage.counts.yes), no: fmt(a.usage.counts.no), unsure: fmt(a.usage.counts.unsure) },
    sceneDen: fmt(a.scenarios.answered_n), sceneMissing: fmt(a.scenarios.missing_n),
    scenes: SCENARIOS.map(key => ({ key, share: a.scenarios.items[key].share ?? 0, text: pct(a.scenarios.items[key].share, 0) })),
    help: {
      dist: (['1', '2', '3', '4', '5'] as const).map(v => a.helpfulness.distribution[v]),
      median: m, medianText: m === null ? '—' : Number.isInteger(m) ? String(m) : m.toFixed(1),
      answered: fmt(a.helpfulness.answered_n), missing: fmt(a.helpfulness.missing_n),
    },
  };
}
/** The test methods of a unittest file in the order unittest runs them (sorted by name). */
export function testNames(src: string): string[] {
  return [...src.matchAll(/^\s+def (test_\w+)\(/gm)].map(m => m[1]).sort();
}
