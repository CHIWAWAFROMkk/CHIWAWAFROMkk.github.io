import { describe, it, expect } from 'vitest';
import { hhmm, countdown, midnight } from '../../src/scripts/qd-timeline';

const H = 3_600_000;
describe('time machine helpers', () => {
  it('formats the simulated clock in local time', () => {
    expect(hhmm(new Date(2026, 9, 5, 9, 0).getTime())).toBe('09:00');
    expect(hhmm(new Date(2026, 9, 5, 23, 59).getTime())).toBe('23:59');
  });
  it('counts down from QuotaDeck\'s estimate: equal to it at the sample, never below zero', () => {
    const at = new Date(2026, 9, 5, 10, 0).getTime();
    expect(countdown(3.25, at, at)).toBe(3.25);
    expect(countdown(3.25, at, at + H)).toBeCloseTo(2.25, 9);
    expect(countdown(0.5, at, at + H)).toBe(0);
  });
  it('finds local midnight for the day/night bands', () => {
    expect(midnight(new Date(2026, 9, 5, 15, 30).getTime())).toBe(new Date(2026, 9, 5).getTime());
  });
});
