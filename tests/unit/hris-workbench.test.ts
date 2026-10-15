import { describe, it, expect } from 'vitest';
import { VERSIONS, WB_CASES, ROUTING } from '../../src/data/hris-workbench';
import { CASES, STEPS, trace } from '../../src/scripts/hris-demo';
import { factCorpus } from '../../src/data/facts';
import { strayTokens } from './digits';

describe('workbench data', () => {
  it('three versions in order, the final one delivered', () => {
    expect(VERSIONS.map(v => v.id)).toEqual(['v1', 'v2', 'final']);
    expect(VERSIONS[2].chain.map(c => c.zh).join(' ')).toMatch(/Copilot/);
    expect(VERSIONS[2].chain.map(c => c.zh).join(' ')).toMatch(/Power Automate/);
    expect(VERSIONS[0].nature.zh).toContain('个人实践');
  });
  it('tools are named only for steps the ledger documents', () => {
    const steps = new Set(STEPS.map(s => s.id));
    for (const v of VERSIONS) for (const s of Object.keys(v.tools)) expect(steps.has(s as never), `${v.id}.${s}`).toBe(true);
    expect(Object.keys(VERSIONS[0].tools).sort()).toEqual(['extract', 'review']);
  });
  it('the fictional cases are the demo\'s five plus a handwritten form that goes to manual review', () => {
    expect(WB_CASES.slice(0, CASES.length)).toEqual(CASES);
    const hand = WB_CASES[CASES.length];
    expect(hand.id).toBe('DEMO-006');
    expect(hand.outcome).toBe('manual-review');
    expect(trace(hand).find(s => s.state === 'stopped')!.id).toBe('review');
  });
  it('the routing rules include the every-hundred full re-check', () => {
    expect(ROUTING.some(r => r.zh.includes('100'))).toBe(true);
  });
  it('no number outside the ledger, no ruled-out claim', () => {
    const all = JSON.stringify({ VERSIONS, ROUTING, extra: WB_CASES[CASES.length] });
    // Record ids, roster row numbers and version ids ("v1") are identifiers (the e2e number check skips [data-demo] too).
    expect(strayTokens(all.replace(/DEMO-\d+|第 \d+ 行|Roster row \d+|"v\d"/g, ''), factCorpus())).toEqual([]);
    expect(all).not.toMatch(/Pydantic|field_diff|工单|ticket|持续运行|100\s*%/i);
  });
});
