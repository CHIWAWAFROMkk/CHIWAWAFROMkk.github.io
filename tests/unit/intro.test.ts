import { describe, it, expect, vi } from 'vitest';
import { shouldPlayIntro, readSeen, markSeen, withTimeout, SEEN_KEY } from '../../src/scripts/intro';

describe('shouldPlayIntro', () => {
  it('plays only on a first visit with motion allowed and fonts ready', () => {
    expect(shouldPlayIntro({ seen: false, reducedMotion: false, fontsReady: true })).toBe(true);
    expect(shouldPlayIntro({ seen: true, reducedMotion: false, fontsReady: true })).toBe(false);
    expect(shouldPlayIntro({ seen: false, reducedMotion: true, fontsReady: true })).toBe(false);
    expect(shouldPlayIntro({ seen: false, reducedMotion: false, fontsReady: false })).toBe(false);
  });
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
