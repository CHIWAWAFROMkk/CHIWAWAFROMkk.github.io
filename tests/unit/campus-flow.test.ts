import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { call } from '../../public/assets/py-core.mjs';
import { bootCampus } from './py-node';
import {
  CAMPUS_RUNTIME, CORE_FILES, WINDOW, gateOf, linesOf, tally, baseline, rowFromForm, nextId, flowOf, toAnimate, statsView, testNames,
  type Gate, type Row, type Traced, type Invalid, type FormState,
} from '../../src/scripts/campus-flow';

let py: any;
beforeAll(async () => { py = await bootCampus(); }, 120_000);
const traced = (rows: unknown[]): Traced | Invalid => call(py, 'campus_bridge', 'analyze_traced', [rows, WINDOW.start, WINDOW.end]);
const ok = (rows: unknown[]): Traced => { const t = traced(rows); if ('error' in t) throw new Error(t.message); return t; };
const made = (kind: 'sample' | 'stress'): Row[] => call(py, 'campus_bridge', 'constructed', [kind]);
const numeric = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [Number(k), v]));
const FORM: FormState = { id: 'V001', date: '2026-09-15', consent: true, eligible: true, used: 'yes', frequency: '4_15', scenarios: ['study', 'daily'], helpfulness: 4, verification: 3 };

describe('the replay model', () => {
  it('names the lines one row runs through for each branch', () => {
    expect(([0, 1, 2, 3, -1] as Gate[]).map(linesOf)).toEqual([[88, 89], [88, 90, 91], [88, 90, 92, 93], [88, 90, 92, 94, 95], [88, 90, 92, 94, 97]]);
    expect([89, 91, 93, 95, 97].map(gateOf)).toEqual([0, 1, 2, 3, -1]);
    expect(() => gateOf(96)).toThrow();
  });
  it('reproduces the real trace of the stress set from its branches alone', () => {
    const rows = made('stress'), t = ok(rows);
    expect(tally(flowOf(rows, t.branches).gates)).toEqual(numeric(t.lines));
  });
  it('the baseline plus the replayed rows is the trace', () => {
    const rows = made('sample'), t = ok(rows), gates = flowOf(rows, t.branches).gates, animate = [0, 5, 17, 35];
    const b = baseline(t.lines, gates, animate);
    b[87] += animate.length;
    for (const i of animate) for (const n of linesOf(gates[i])) b[n] += 1;
    expect(b).toEqual(numeric(t.lines));
  });
  it('animates new rows and rows whose branch changed', () => {
    expect(toAnimate([0, -1], [0, 0, -1])).toEqual([1, 2]);
    expect(toAnimate([], [-1, 2])).toEqual([0, 1]);
    expect(toAnimate([-1, 3], [-1, 3])).toEqual([]);
  });
  it('lays included rows into cells in row order and counts each gate', () => {
    const rows = made('sample'), t = ok(rows), f = flowOf(rows, t.branches);
    expect(f.cells).toHaveLength(26);
    expect(f.excluded).toEqual([6, 2, 1, 1]);
    expect(f.cells.every((row, k) => f.gates[row] === -1 && (k === 0 || row > f.cells[k - 1]))).toBe(true);
    expect(() => flowOf(rows, t.branches.slice(1))).toThrow();
  });
});

describe('the questionnaire form', () => {
  it('Q1 or Q2 "no" ends the survey; Q4–Q7 apply only to Q3 "yes"; no scenario ticked is null', () => {
    expect(rowFromForm(FORM)).toEqual({ respondent_id: 'V001', collected_on: '2026-09-15', consent: true, eligible: true, used_ai: 'yes', frequency: '4_15', scenarios: ['study', 'daily'], helpfulness: 4, verification: 3 });
    expect(rowFromForm({ ...FORM, consent: false })).toMatchObject({ consent: false, used_ai: null, frequency: null, scenarios: null, helpfulness: null, verification: null });
    expect(rowFromForm({ ...FORM, used: 'unsure' })).toMatchObject({ used_ai: 'unsure', frequency: null, scenarios: null, helpfulness: null, verification: null });
    expect(rowFromForm({ ...FORM, scenarios: [], helpfulness: null })).toMatchObject({ scenarios: null, helpfulness: null });
  });
  it('every answer the form can build is one analysis.py accepts; the ID goes in untouched', () => {
    const forms: FormState[] = [FORM, { ...FORM, id: 'V002', consent: false }, { ...FORM, id: 'V003', eligible: false }, { ...FORM, id: 'V004', used: 'no' },
      { ...FORM, id: 'V005', used: 'unsure' }, { ...FORM, id: 'V006', scenarios: [], helpfulness: null, verification: null }, { ...FORM, id: 'V007', date: '2026-10-01' }];
    const t = ok(forms.map(rowFromForm));
    expect(t.result.input_n).toBe(7);
    expect(t.result.excluded).toEqual({ duplicate_id: 0, no_consent: 1, ineligible: 1, outside_period: 1 });
    expect(traced([rowFromForm({ ...FORM, id: ' V001' })])).toEqual({ error: 'invalid', message: '第 1 条记录：匿名 ID 不应有首尾空格' });
  });
  it('suggests the first unused visitor ID', () => {
    const r = (id: string) => rowFromForm({ ...FORM, id });
    expect(nextId([])).toBe('V001');
    expect(nextId([r('V001'), r('V002')])).toBe('V003');
    expect(nextId([r('V002')])).toBe('V001');
  });
});

describe('the statistics panel', () => {
  it('reads every figure from analyze()\'s output', () => {
    const v = statsView(ok([rowFromForm(FORM), rowFromForm({ ...FORM, id: 'V002', scenarios: [], helpfulness: null }), rowFromForm({ ...FORM, id: 'V003', used: 'no' })]).result);
    expect([v.included, v.input, v.yes]).toEqual(['3', '3', '66.7%']);
    expect(v.counts).toEqual({ yes: '2', no: '1', unsure: '0' });
    expect([v.sceneDen, v.sceneMissing]).toEqual(['1', '1']);
    expect(v.scenes.find(s => s.key === 'daily')).toEqual({ key: 'daily', share: 1, text: '100%' });
    expect(v.scenes.find(s => s.key === 'club')).toEqual({ key: 'club', share: 0, text: '0%' });
    expect(v.help).toEqual({ dist: [0, 0, 0, 1, 0], median: 4, medianText: '4', answered: '1', missing: '1' });
  });
  it('no data: shares and the median are missing, not zero', () => {
    const v = statsView(ok([]).result);
    expect([v.included, v.input, v.yes, v.help.medianText]).toEqual(['0', '0', '—', '—']);
    expect(v.scenes.every(s => s.text === '—' && s.share === 0)).toBe(true);
  });
  it('an even count gives the mean of the middle two, to one decimal', () => {
    const v = statsView(ok([rowFromForm({ ...FORM, helpfulness: 2 }), rowFromForm({ ...FORM, id: 'V002', helpfulness: 5 })]).result);
    expect([v.help.median, v.help.medianText]).toEqual([3.5, '3.5']);
  });
  it('large counts are grouped with commas', () => {
    const v = statsView(ok(made('stress')).result);
    expect([v.included, v.input]).toEqual(['1,720', '2,000']);
  });
});

describe('what the page loads and shows', () => {
  it('the runtime loads the study\'s downloads themselves, not copies, and no packages', () => {
    expect(CAMPUS_RUNTIME.files.slice(0, 2)).toEqual(['/downloads/campus/analysis.py', '/downloads/campus/test_analysis.py']);
    for (const u of CAMPUS_RUNTIME.files) expect(existsSync(`public${u}`), u).toBe(true);
    const body = readFileSync('src/copy/projects/ai-campus.zh.md', 'utf8');
    expect(body).toContain('(/downloads/campus/analysis.py)');
    expect(body).toContain('(/downloads/campus/test_analysis.py)');
    expect(CAMPUS_RUNTIME.packages).toEqual([]);
  });
  it('the core files the page counts are in the vendored manifest', () => {
    const names = JSON.parse(readFileSync('public/assets/vendor/pyodide/0.29.5/manifest.json', 'utf8')).files.map((f: { name: string }) => f.name);
    for (const f of CORE_FILES) expect(names).toContain(f);
  });
  it('the live source window is still the exclusion loop (lines 87–97)', () => {
    const lines = readFileSync('public/downloads/campus/analysis.py', 'utf8').split('\n');
    expect(lines[86].trim()).toBe('for row in rows:');
    expect(lines[88].trim()).toBe("excluded['duplicate_id'] += 1");
    expect(lines[96].trim()).toBe('included.append(row)');
  });
  it('lists the tests in the order unittest runs them', () => {
    const names = testNames(readFileSync('public/downloads/campus/test_analysis.py', 'utf8'));
    expect(names).toHaveLength(10);
    expect(names[0]).toBe('test_distinct_denominators_and_missing');
    expect([...names].sort()).toEqual(names);
  });
});
