import { describe, it, expect } from 'vitest';
import { layoutWide, layoutStack } from '../../src/scripts/career-circuit';
import type { CircuitModel, Tone } from '../../src/scripts/career-wire';

const node = (id: string, tone: Tone = 'ok') => ({ id, label: id, sub: '', tone });
function model(reqs: number, wires: [number, string | null, Tone][], targets = ['field-education', 'field-days', 'field-months', 'fact-a', 'fact-b'], materials = ['fact-a']): CircuitModel {
  return { reqs: Array.from({ length: reqs }, (_, i) => node(`req-${i + 1}`)), targets: targets.map(t => node(t)), wires: wires.map(([req, target, tone]) => ({ req, target, tone })), materials, packError: null, hiddenReqs: 0 };
}
const DEMO = model(5, [[0, 'field-education', 'ok'], [1, 'field-days', 'fail'], [2, 'field-months', 'ok'], [3, 'fact-a', 'unknown'], [4, null, 'gap']]);
const nums = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);
const overlaps = (a: { y: number; h: number }, b: { y: number; h: number }) => a.y < b.y + b.h && b.y < a.y + a.h;

describe('wide circuit layout', () => {
  const p = layoutWide(DEMO);
  it('each trace leaves its requirement at the centre of the right edge and enters its target at the left edge', () => {
    for (const t of p.traces) {
      const r = p.reqBoxes[t.req], n = nums(t.d);
      expect(n.slice(0, 2)).toEqual([282, r.y + r.h / 2]);
      if (t.target) {
        const b = p.targetBoxes.find(x => x.id === t.target)!.box;
        expect(t.d.endsWith('H 718')).toBe(true);
        expect(nums(t.d).at(-2)).toBe(b.y + b.h / 2);
      }
    }
  });
  it('gives every trace its own vertical lane', () => {
    const lanes = p.traces.map(t => nums(t.d)[2]);
    expect(new Set(lanes).size).toBe(lanes.length);
    for (const x of lanes) { expect(x).toBeGreaterThanOrEqual(320); expect(x).toBeLessThanOrEqual(680); }
  });
  it('a missing target becomes a marked stub; failures and gaps carry a mark, ok does not', () => {
    const stub = p.traces[4];
    expect(stub).toMatchObject({ target: null, stub: true, tone: 'gap' });
    expect(stub.mark).not.toBeNull();
    expect(p.traces[0].mark).toBeNull();
    expect(p.traces[1].mark).not.toBeNull();
  });
  it('boxes in a column never overlap and targets sit half a row lower', () => {
    for (let i = 1; i < p.reqBoxes.length; i++) expect(overlaps(p.reqBoxes[i - 1], p.reqBoxes[i])).toBe(false);
    for (let i = 1; i < p.targetBoxes.length; i++) expect(overlaps(p.targetBoxes[i - 1].box, p.targetBoxes[i].box)).toBe(false);
    expect(p.targetBoxes[0].box.y - p.reqBoxes[0].y).toBe(48);
  });
  it('materials traces run from each fact into the materials box, which fits inside the height', () => {
    expect(p.materialTraces).toHaveLength(1);
    expect(nums(p.materialTraces[0].d).at(-2)).toBe(p.material.y + p.material.h / 2);
    expect(p.material.y + p.material.h).toBeLessThanOrEqual(p.height);
  });
  it('compresses rows when there are more than eight', () => {
    const big = layoutWide(model(10, Array.from({ length: 10 }, (_, i) => [i, null, 'none'] as [number, null, Tone])));
    expect(big.reqBoxes[1].y - big.reqBoxes[0].y).toBe(70);
  });
});

describe('stacked circuit layout for narrow screens', () => {
  const p = layoutStack(DEMO, 358);
  it('keeps every box inside the width', () => {
    for (const b of [...p.reqBoxes, ...p.targetBoxes.map(t => t.box), p.material]) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(358);
    }
  });
  it('places each target under its requirement and never overlaps', () => {
    const all = [...p.reqBoxes, ...p.targetBoxes.map(t => t.box), p.material].sort((a, b) => a.y - b.y);
    for (let i = 1; i < all.length; i++) expect(overlaps(all[i - 1], all[i])).toBe(false);
    for (const t of p.targetBoxes) expect(t.box.y).toBeGreaterThan(p.reqBoxes[t.group!].y);
  });
  it('draws a stub for a requirement without a target', () => {
    expect(p.traces.find(t => t.req === 4)).toMatchObject({ target: null, stub: true });
    expect(p.height).toBeGreaterThan(p.material.y);
  });
});

describe('requirements beyond the drawn ones', () => {
  it('reserve a note line under the requirements in both layouts', () => {
    const m = { ...DEMO, hiddenReqs: 3 };
    for (const p of [layoutWide(m), layoutStack(m, 358)]) {
      expect(p.note).not.toBeNull();
      const last = p.reqBoxes[p.reqBoxes.length - 1];
      expect(p.note![1]).toBeGreaterThan(last.y);
      expect(p.note![1]).toBeLessThan(p.height);
    }
    expect(layoutWide(DEMO).note).toBeNull();
  });
});

