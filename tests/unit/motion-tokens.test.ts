import { describe, it, expect } from 'vitest';
import { magnetOffset, splitUnits } from '../../src/scripts/motion/tokens';

describe('bounded pointer movement', () => {
  it('scales local movement and preserves direction at the radial cap', () => {
    expect(magnetOffset(8, -4, 4, 6)).toEqual({ x: 2, y: -1 });
    const result = magnetOffset(300, 400, 2, 6);
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(6);
    expect(result.x / result.y).toBeCloseTo(0.75);
  });
  it('stays finite for invalid strengths and stationary pointers', () => {
    expect(magnetOffset(0, 0, 4, 6)).toEqual({ x: 0, y: 0 });
    expect(magnetOffset(5, 5, 0, 6)).toEqual({ x: 0, y: 0 });
    expect(magnetOffset(Infinity, 5, 4, 6)).toEqual({ x: 0, y: 0 });
  });
});
describe('language-aware split units', () => {
  it('keeps English words intact and reveals CJK by character', () => {
    expect(splitUnits('何彦钧')).toBe('chars');
    expect(splitUnits('项目与演示')).toBe('chars');
    expect(splitUnits('Projects & demos')).toBe('words');
    expect(splitUnits('Yanjun He')).toBe('words');
  });
});
