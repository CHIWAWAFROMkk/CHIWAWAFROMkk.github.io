import { describe, it, expect } from 'vitest';
import { EDIT, END, TRANSITIONS, BEATS, S16_START, slots } from '../../src/data/film-edit';

const S = slots();
const byId = new Map(S.map(s => [s.id, s]));

describe('the edit list', () => {
  it('has the opening black, 22 shots and the title, S02 not among them', () => {
    expect(S).toHaveLength(24);
    expect(S[0].id).toBe('S00');
    expect(S.at(-1)!.id).toBe('S21');
    expect(S.filter(s => s.src !== null)).toHaveLength(22);
    expect(byId.has('S02')).toBe(false);
  });

  it('runs from 0 to 60 s with every slot ending where the next begins', () => {
    expect(S[0].start).toBe(0);
    expect(S.at(-1)!.stop).toBe(END);
    expect(END).toBe(60);
    S.slice(1).forEach((s, i) => { expect(s.start).toBeGreaterThan(S[i].start); expect(S[i].stop).toBe(s.start); });
  });

  it('puts every transition on a cut', () => {
    for (const t of TRANSITIONS) expect(S.some(s => Math.abs(s.start - t.at) < 0.02), String(t.at)).toBe(true);
  });

  it('desaturates exactly the flashback S05a–S13', () => {
    expect(S.filter(s => s.gray).map(s => s.id)).toEqual(['S05a', 'S05b', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11', 'S12', 'S13']);
  });

  it('computes speed the way edit_60s.py does (whole frames at 24 fps)', () => {
    expect(byId.get('S01')!.speed).toBeCloseTo(0.98, 3);     // 4.9 s of source in 120 frames
    expect(byId.get('S03')!.speed).toBeCloseTo(1.008, 3);    // 5.04 s in 120 frames
    expect(byId.get('S14c')!.speed).toBeCloseTo(1.263, 3);   // 1.0 s in 19 frames
    expect(byId.get('S00')!.speed).toBeNull();
    for (const s of S) if (s.speed !== null) { expect(s.speed).toBeGreaterThan(0.8); expect(s.speed).toBeLessThan(2.6); }
  });

  it('places S16 so its white frame lands on the 44.17 s gunshot', () => {
    expect(S16_START).toBeCloseTo(43.880, 3);
    expect(byId.get('S16')!.start).toBe(S16_START);
  });

  it('marks the three beats inside the film', () => {
    expect(BEATS.map(b => b.label)).toEqual(['0:12', '0:44', '0:52']);
    for (const b of BEATS) expect(b.at).toBeLessThan(END);
  });

  it('keeps the raw rows unchanged', () => {
    expect(EDIT.find(r => r.id === 'S19')).toEqual({ id: 'S19', src: 'S19_即梦_01', inPt: 1.0, outPt: 4.4, start: 54.17, gray: false });
  });
});
