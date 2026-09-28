import { describe, it, expect } from 'vitest';
import { CASES, STEPS, OUTCOME_LABEL, trace } from '../../src/scripts/hris-demo';

describe('HRIS demo data', () => {
  it('has five fictional cases covering all five outcomes', () => {
    expect(CASES).toHaveLength(5);
    expect(new Set(CASES.map(c => c.outcome)).size).toBe(5);
    expect(new Set(CASES.map(c => c.id)).size).toBe(5);
    for (const c of CASES) expect(c.id).toMatch(/^DEMO-00\d$/);
  });

  it('is fully bilingual', () => {
    for (const c of CASES) for (const k of ['name', 'situation', 'result', 'next'] as const) {
      expect(c[k].zh.trim(), `${c.id}.${k}`).not.toBe('');
      expect(c[k].en.trim(), `${c.id}.${k}`).not.toBe('');
    }
    for (const o of Object.values(OUTCOME_LABEL)) expect(o.zh && o.en).toBeTruthy();
  });
});

describe('trace', () => {
  const byOutcome = (o: string) => CASES.find(c => c.outcome === o)!;

  it('a completed record passes every step', () => {
    expect(trace(byOutcome('done')).every(s => s.state === 'passed')).toBe(true);
  });

  it('a missing file stops at matching; later steps never run', () => {
    expect(trace(byOutcome('missing-file')).map(s => s.state)).toEqual(['passed', 'stopped', 'skipped', 'skipped', 'skipped', 'skipped']);
  });

  it('an ownership conflict stops at identity', () => {
    const t = trace(byOutcome('manual-review'));
    expect(t.find(s => s.state === 'stopped')?.id).toBe('identity');
  });

  it('every non-done case stops exactly once, at its stopsAt step', () => {
    for (const c of CASES.filter(x => x.outcome !== 'done')) {
      const stopped = trace(c).filter(s => s.state === 'stopped');
      expect(stopped.map(s => s.id), c.id).toEqual([c.stopsAt]);
    }
  });

  it('returns one entry per step in order', () => {
    for (const c of CASES) expect(trace(c).map(s => s.id)).toEqual(STEPS.map(s => s.id));
  });
});
