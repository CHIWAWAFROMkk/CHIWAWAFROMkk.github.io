import { describe, it, expect } from 'vitest';
import { shotAt, segmentProgress, HOLD, TRANS, PERIOD, KINDS } from '../../src/scripts/jung-prologue-timeline';
import { PROLOGUE_FRAMES } from '../../src/data/jung-prologue';

const N = PROLOGUE_FRAMES.length;

describe('the opening plays the film’s keyframes in order, joined like the film', () => {
  it('has one transition kind per keyframe (the last one loops back to the first)', () => {
    expect(N).toBe(6);
    expect(KINDS).toHaveLength(N);
    for (const k of KINDS) expect(['dissolve', 'push']).toContain(k);
  });

  it('starts on the first picture, fully shown, with its line not yet visible', () => {
    const s = shotAt(0, N);
    expect(s.a).toBe(0);
    expect(s.mix).toBe(0);
    expect(s.quote).toBe(0);
    expect(s.zoomA).toBeGreaterThanOrEqual(1);
  });

  it('holds a picture, then blends into the next one', () => {
    expect(shotAt(HOLD - 0.01, N).mix).toBe(0);
    const mid = shotAt(HOLD + TRANS / 2, N);
    expect(mid.a).toBe(0);
    expect(mid.b).toBe(1);
    expect(mid.mix).toBeGreaterThan(0.3);
    expect(mid.mix).toBeLessThan(0.7);
  });

  it('hands over without a jump: the incoming picture keeps its zoom when it becomes the main one', () => {
    for (let i = 0; i < N; i++) {
      const before = shotAt((i + 1) * PERIOD - 1e-4, N);
      const after = shotAt((i + 1) * PERIOD, N);
      expect(before.b).toBe((i + 1) % N);
      expect(after.a).toBe((i + 1) % N);
      expect(before.mix).toBeGreaterThan(0.999);
      expect(after.mix).toBe(0);
      expect(Math.abs(before.zoomB - after.zoomA)).toBeLessThan(1e-3);
    }
  });

  it('loops, and tolerates any time value', () => {
    expect(shotAt(N * PERIOD + 1.3, N)).toEqual(shotAt(1.3, N));
    expect(shotAt(-1.3, N)).toEqual(shotAt(N * PERIOD - 1.3, N));
  });

  it('keeps every value in range over a whole loop', () => {
    for (let t = 0; t < N * PERIOD; t += 0.05) {
      const s = shotAt(t, N);
      expect(s.mix).toBeGreaterThanOrEqual(0);
      expect(s.mix).toBeLessThanOrEqual(1);
      expect(s.zoomA).toBeGreaterThanOrEqual(1);
      expect(s.zoomB).toBeGreaterThanOrEqual(1);
      expect(s.zoomA).toBeLessThan(1.5);
      expect(s.quote).toBeGreaterThanOrEqual(0);
      expect(s.quote).toBeLessThanOrEqual(1);
    }
  });

  it('shows each line only while its picture is held, never during a transition', () => {
    for (let i = 0; i < N; i++) {
      expect(shotAt(i * PERIOD + HOLD / 2, N).quote).toBe(1);
      expect(shotAt(i * PERIOD + HOLD + TRANS / 2, N).quote).toBe(0);
    }
  });

  it('a push-through enlarges the outgoing picture; a dissolve does not', () => {
    const i = KINDS.indexOf('push'), j = KINDS.indexOf('dissolve');
    const pushMid = shotAt(i * PERIOD + HOLD + TRANS / 2, N);
    const dissolveMid = shotAt(j * PERIOD + HOLD + TRANS / 2, N);
    expect(pushMid.kind).toBe('push');
    expect(pushMid.zoomA - pushMid.zoomB).toBeGreaterThan(0.05);
    expect(dissolveMid.kind).toBe('dissolve');
    expect(Math.abs(dissolveMid.zoomA - dissolveMid.zoomB)).toBeLessThan(0.1);
  });
});

describe('the opening’s frames and lines', () => {
  it('uses the film’s keyframes, served with the map', () => {
    for (const f of PROLOGUE_FRAMES) expect(f.src).toMatch(/^\/assets\/jung-map\/assets\/K\d\.webp$/);
  });

  it('carries the film’s five quotations, word for word, on the pictures that have them', () => {
    const lines = PROLOGUE_FRAMES.filter(f => f.quote).map(f => f.quote!.en);
    expect(lines).toEqual([
      'A kind of mask … to conceal the true nature of the individual.',
      'Who looks outside, dreams; who looks inside, awakes.',
      '… complexes can have us.',
      "The meeting with oneself is, at first, the meeting with one's own shadow.",
      'Whoever looks into the mirror of the water will see first of all his own face.',
    ]);
    for (const f of PROLOGUE_FRAMES) if (f.quote) expect(f.quote.zh.length).toBeGreaterThan(4);
  });
});

describe('the opening’s progress bar', () => {
  it('fills the pictures already shown, part of the current one, none of the rest', () => {
    const p = segmentProgress(2 * PERIOD + PERIOD / 2, N);
    expect(p).toHaveLength(N);
    expect(p.slice(0, 2)).toEqual([1, 1]);
    expect(p[2]).toBeCloseTo(0.5, 5);
    expect(p.slice(3)).toEqual([0, 0, 0]);
  });

  it('starts empty and starts over with each loop', () => {
    expect(segmentProgress(0, N)).toEqual([0, 0, 0, 0, 0, 0]);
    const a = segmentProgress(N * PERIOD + 1, N), b = segmentProgress(1, N);
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 9));
  });
});
