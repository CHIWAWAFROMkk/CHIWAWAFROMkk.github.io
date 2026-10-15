import { describe, it, expect, vi } from 'vitest';
import { introMode, introLetterDelay, INTRO_MS, INTRO_GENTLE_MS, readSeen, markSeen, withTimeout, SEEN_KEY } from '../../src/scripts/intro';
import { scatter, HRIS_SEEN_KEY, HRIS_INTRO_MS } from '../../src/scripts/intro';

describe('introMode', () => {
  const base = { seen: false, tier: 'full' as const, fontsReady: true };
  it('plays the full intro on a first visit', () => expect(introMode(base)).toBe('full'));
  it('lite devices still get the full intro (it is CSS only)', () => expect(introMode({ ...base, tier: 'lite' })).toBe('full'));
  it('reduced motion gets the short fade', () => expect(introMode({ ...base, tier: 'gentle' })).toBe('gentle'));
  it('never when seen, off, or the display font is late', () => {
    expect(introMode({ ...base, seen: true })).toBeNull();
    expect(introMode({ ...base, tier: 'off' })).toBeNull();
    expect(introMode({ ...base, fontsReady: false })).toBeNull();
  });
});

describe('streamed letters', () => {
  it('each line starts after the previous one and letters stream in order', () => {
    expect(introLetterDelay(0, 0)).toBeLessThan(introLetterDelay(0, 1));
    expect(introLetterDelay(0, 7)).toBeLessThan(introLetterDelay(1, 0));
  });
  it('the last letter of FILM lands before the trace starts drawing', () => {
    expect(introLetterDelay(2, 3)).toBeLessThan(1.45);
  });
  it('gentle is a third of the full intro', () => expect(INTRO_GENTLE_MS * 3).toBe(INTRO_MS));
});

describe('storage helpers', () => {
  const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

  it('reads the seen flag', () => {
    expect(readSeen({ getItem: k => (k === SEEN_KEY ? '1' : null) })).toBe(true);
    expect(readSeen({ getItem: () => null })).toBe(false);
    expect(readSeen(null)).toBe(false);
  });

  it('treats blocked storage as a first visit and never throws', () => {
    expect(readSeen(throwing)).toBe(false);
    expect(() => markSeen(throwing)).not.toThrow();
    expect(() => markSeen(null)).not.toThrow();
  });
});

describe('withTimeout', () => {
  it('resolves true when the promise settles in time, false otherwise', async () => {
    vi.useFakeTimers();
    const fast = withTimeout(Promise.resolve(), 800);
    const slow = withTimeout(new Promise(() => {}), 800);
    const failing = withTimeout(Promise.reject(new Error('x')), 800);
    await vi.advanceTimersByTimeAsync(800);
    expect(await fast).toBe(true);
    expect(await slow).toBe(false);
    expect(await failing).toBe(false);
    vi.useRealTimers();
  });
});


describe('HRIS intro', () => {
  it('uses its own seen key, so the main intro and the HRIS intro are independent', () => {
    const store = new Map<string, string>();
    const s = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    markSeen(s, HRIS_SEEN_KEY);
    expect(readSeen(s, HRIS_SEEN_KEY)).toBe(true);
    expect(readSeen(s)).toBe(false);
  });
  it('letters scatter within a screen-sized range and the same way on every visit', () => {
    expect(scatter(3)).toEqual(scatter(3));
    for (let i = 0; i < 20; i++) { const s = scatter(i); expect(Math.abs(s.x)).toBeLessThanOrEqual(60); expect(Math.abs(s.y)).toBeLessThanOrEqual(40); expect(Math.abs(s.r)).toBeLessThanOrEqual(25); }
  });
  it('the HRIS intro is a little shorter than the main one', () => expect(HRIS_INTRO_MS).toBeLessThan(INTRO_MS));
});
