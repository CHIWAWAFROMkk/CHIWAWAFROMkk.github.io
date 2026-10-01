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
