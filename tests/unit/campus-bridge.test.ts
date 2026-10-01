import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { call, mount } from '../../public/assets/py-core.mjs';
import { bootCampus } from './py-node';
import { WINDOW, type Row, type Traced, type Invalid, type TestEvent, type TestSummary } from '../../src/scripts/campus-flow';

let py: any;
beforeAll(async () => { py = await bootCampus(); }, 120_000);
const traced = (rows: unknown[]): Traced | Invalid => call(py, 'campus_bridge', 'analyze_traced', [rows, WINDOW.start, WINDOW.end]);
const made = (kind: 'sample' | 'stress'): Row[] => call(py, 'campus_bridge', 'constructed', [kind]);
const ok = (rows: unknown[]): Traced => { const t = traced(rows); if ('error' in t) throw new Error(t.message); return t; };
/** analyze() called directly, without the bridge and without tracing. */
function plain(rows: unknown[]) {
  py.globals.set('rows_json', JSON.stringify(rows));
  return JSON.parse(py.runPython(`import json, analysis\njson.dumps(analysis.analyze(json.loads(rows_json), '${WINDOW.start}', '${WINDOW.end}'), ensure_ascii=False)`));
}
const ROW: Row = { respondent_id: 'TEST_ONLY_A', collected_on: '2026-09-12', consent: true, eligible: true, used_ai: 'yes', frequency: '1_3', scenarios: ['study'], helpfulness: 4, verification: 5 };

describe('campus bridge running analysis.py under Pyodide', () => {
  it('the constructed sample: 36 rows, 26 included, every exclusion present', () => {
    const t = ok(made('sample'));
    expect([t.result.input_n, t.result.included_n]).toEqual([36, 26]);
    expect(t.result.excluded).toEqual({ duplicate_id: 6, no_consent: 2, ineligible: 1, outside_period: 1 });
  });
  it('the stress set: 2,000 rows from a fixed seed, the same every time', () => {
    const a = made('stress');
    expect(a).toHaveLength(2000);
    expect(made('stress')).toEqual(a);
    const t = ok(a);
    expect(t.result.included_n).toBe(1720);
    expect(t.result.excluded).toEqual({ duplicate_id: 80, no_consent: 60, ineligible: 40, outside_period: 100 });
  });
  it('tracing changes nothing: the result equals a plain analyze() call', () => {
    const rows = made('stress');
    expect(ok(rows).result).toEqual(plain(rows));
  });
  it('counts every line of the loop; the header runs once more than there are rows', () => {
    const t = ok(made('stress'));
    expect(t.lines).toEqual({ 87: 2001, 88: 2000, 89: 80, 90: 1920, 91: 60, 92: 1860, 93: 40, 94: 1820, 95: 100, 97: 1720 });
    expect(t.ms).toBeGreaterThan(0);
    expect(t.traced_ms).toBeGreaterThan(0);
  });
  it('records the branch each row takes, in row order', () => {
    const rows = made('sample'), t = ok(rows);
    expect(t.branches).toHaveLength(36);
    const seen = new Map<string, number>();
    for (const r of rows) seen.set(r.respondent_id, (seen.get(r.respondent_id) ?? 0) + 1);
    rows.forEach((r, i) => {
      const expected = seen.get(r.respondent_id)! > 1 ? 89 : !r.consent ? 91 : !r.eligible ? 93
        : r.collected_on < WINDOW.start || r.collected_on > WINDOW.end ? 95 : 97;
      expect(t.branches[i], r.respondent_id).toBe(expected);
    });
  });
  it('invalid input comes back as the program\'s own message', () => {
    expect(traced([{ ...ROW, respondent_id: ' X ' }])).toEqual({ error: 'invalid', message: '第 1 条记录：匿名 ID 不应有首尾空格' });
    expect(traced([ROW, { ...ROW, respondent_id: 'B', collected_on: '' }])).toEqual({ error: 'invalid', message: '第 2 条记录：采集日期格式错误' });
  });
  it('an empty input is analysed, not refused', () => {
    const t = ok([]);
    expect(t.result.status).toBe('没有可分析记录');
    expect(t.result.usage.yes_share).toBeNull();
    expect(t.lines).toEqual({ 87: 1 });
    expect(t.branches).toEqual([]);
  });
  it('runs the study\'s ten tests and pushes each start and outcome as it happens', () => {
    const events: TestEvent[] = [];
    const s: TestSummary = call(py, 'campus_bridge', 'run_tests', ['test_analysis'], (e: TestEvent) => events.push(e));
    expect([s.run, s.failures, s.errors, s.ok]).toEqual([10, 0, 0, true]);
    expect(s.ms).toBeGreaterThan(0);
    expect(events).toHaveLength(20);
    const names = [...readFileSync('public/downloads/campus/test_analysis.py', 'utf8').matchAll(/^\s+def (test_\w+)\(/gm)].map(m => m[1]).sort();
    expect(events.filter(e => e.kind === 'start').map(e => e.name)).toEqual(names);
    events.forEach((e, i) => expect(e.kind).toBe(i % 2 ? 'ok' : 'start'));
  });
  it('a failing run is reported as it happened: failures, errors and failed subtests', () => {
    const src = [
      'import unittest', '', '',
      'class Demo(unittest.TestCase):',
      '    def test_a_passes(self):', '        self.assertTrue(True)', '',
      '    def test_b_fails(self):', '        self.assertEqual(1, 2)', '',
      '    def test_c_errors(self):', "        raise RuntimeError('boom')", '',
      '    def test_d_subtests(self):', '        for n in (1, 2, 3):', '            with self.subTest(n=n):', '                self.assertEqual(n, 1)', '',
    ].join('\n');
    mount(py, [{ path: 'test_demo_fail.py', bytes: new TextEncoder().encode(src) }]);
    const events: TestEvent[] = [];
    const s: TestSummary = call(py, 'campus_bridge', 'run_tests', ['test_demo_fail'], (e: TestEvent) => events.push(e));
    expect(events.filter(e => e.kind !== 'start').map(e => [e.name, e.kind, e.message ?? null])).toEqual([
      ['test_a_passes', 'ok', null], ['test_b_fails', 'fail', 'AssertionError: 1 != 2'],
      ['test_c_errors', 'error', 'RuntimeError: boom'], ['test_d_subtests', 'fail', 'AssertionError: 2 != 1'],
    ]);
    expect([s.run, s.failures, s.errors, s.ok]).toEqual([4, 3, 1, false]);
  });
});
