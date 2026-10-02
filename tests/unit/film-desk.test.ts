import { describe, it, expect } from 'vitest';
import { pct, timeAt, clock, speedLabel, stepIndex } from '../../src/scripts/film-desk';

describe('film desk helpers', () => {
  it('maps film time to a percentage of the track, clamped', () => {
    expect(pct(0)).toBe(0);
    expect(pct(30)).toBe(50);
    expect(pct(60)).toBe(100);
    expect(pct(-3)).toBe(0);
    expect(pct(75)).toBe(100);
  });

  it('maps a click on the track back to film time, clamped', () => {
    expect(timeAt(50, 100)).toBe(30);
    expect(timeAt(-5, 100)).toBe(0);
    expect(timeAt(500, 100)).toBe(60);
    expect(timeAt(10, 0)).toBe(0);
  });

  it('prints m:ss.s and rolls over at the minute', () => {
    expect(clock(0)).toBe('0:00.0');
    expect(clock(7.17)).toBe('0:07.2');
    expect(clock(43.880229)).toBe('0:43.9');
    expect(clock(59.99)).toBe('1:00.0');
  });

  it('prints speeds with two decimals', () => {
    expect(speedLabel(0.98)).toBe('0.98×');
    expect(speedLabel(1.2632)).toBe('1.26×');
  });

  it('steps within bounds', () => {
    expect(stepIndex(22, 0, -1)).toBe(0);
    expect(stepIndex(22, 21, 1)).toBe(21);
    expect(stepIndex(22, 4, 1)).toBe(5);
    expect(stepIndex(22, -1, 1)).toBe(0);
  });
});
