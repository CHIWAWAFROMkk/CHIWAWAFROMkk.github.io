import { describe, it, expect } from 'vitest';
import demo from '../../public/assets/job-agent-demo.json';
import { careerPlate, quotaPlate, CAMPUS_PLATE } from '../../src/data/plates';

const CJK = /[一-鿿]/;

describe('plate 01 · the job agent marks up the real replay', () => {
  const P = careerPlate();

  it('takes every requirement of the replayed role, in order', () => {
    const scenario = demo.scenarios.find(s => s.days === 4 && !s.tableauConfirmed)!;
    expect(P.rows.map(r => r.jd.zh)).toEqual(scenario.match.job.requirements.map(r => r.text));
  });

  it('passes the three gates the engine passed, ties SQL to its confirmed fact, and rings Tableau', () => {
    expect(P.rows.map(r => r.verdict)).toEqual(['pass', 'pass', 'pass', 'evidence', 'unconfirmed']);
    expect(P.rows[3].fact?.id).toBe('fact-sql-analysis');
    expect(P.rows[3].fact?.text.zh).toBe('使用 SQL 清洗业务数据并输出周度分析。');
    expect(P.rows[3].note.zh).toContain('留给本人确认');   // the engine left the SQL gate itself as unknown
  });

  it('is right that the unconfirmed skill stays out of the materials', () => {
    const scenario = demo.scenarios.find(s => s.days === 4 && !s.tableauConfirmed)!;
    expect(JSON.stringify(scenario.pack.materials)).not.toContain('Tableau');
  });

  it('carries the engine score and has English for every line', () => {
    expect(P.score).toBe(84);
    for (const r of P.rows) { expect(r.jd.en).not.toMatch(CJK); expect(r.note.en).not.toMatch(CJK); }
    expect(P.rows[3].fact!.text.en).not.toMatch(CJK);
  });
});

describe('plate 02 · QuotaDeck pools, from the simulator the live page runs', () => {
  const P = quotaPlate();

  it('has five pools holding eleven models', () => {
    expect(P.pools.map(p => p.provider)).toEqual(['Codex', 'Claude Code', 'Antigravity', 'DeepSeek', 'WorkBuddy']);
    expect(P.pools.flatMap(p => p.models)).toHaveLength(11);
  });

  it('shows each pool once with its own reading', () => {
    expect(P.pools.map(p => p.value)).toEqual(['74%', '61%', '52%', '¥42.60', '1260 / 2000']);
    expect(P.pools.map(p => p.fill)).toEqual([0.74, 0.61, 0.52, null, 0.63]);
  });

  it('the misleading per-model list repeats the pool reading under every model', () => {
    expect(P.perModel).toHaveLength(11);
    expect(P.perModel.filter(m => m.value === '¥42.60')).toHaveLength(2);
  });

  it('has English names for every pool and model', () => {
    for (const p of P.pools) { expect(p.label.en).not.toMatch(CJK); for (const m of p.models) expect(m.en).not.toMatch(CJK); }
  });
});

describe('plate 03 · four parts of a task', () => {
  it('counts four stages, verification marked, and says it is a schematic', () => {
    expect(CAMPUS_PLATE.stages.map(s => s.key)).toEqual(['prep', 'wait', 'revise', 'verify']);
    expect(CAMPUS_PLATE.stages.filter(s => s.key === 'verify')).toHaveLength(1);
    expect(CAMPUS_PLATE.note.zh).toContain('示意');
  });
});
