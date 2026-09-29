import { describe, it, expect } from 'vitest';
import { slots, reelRows } from '../../src/scripts/odometer';

describe('odometer', () => {
  it('splits text into digit reels and fixed glyphs', () => {
    expect(slots('¥2,851')).toEqual([
      { digit: null, char: '¥' }, { digit: 2, char: '2' }, { digit: null, char: ',' },
      { digit: 8, char: '8' }, { digit: 5, char: '5' }, { digit: 1, char: '1' },
    ]);
    expect(slots('4.6%').map(s => s.digit)).toEqual([4, null, 6, null]);
    expect(slots('—')).toEqual([{ digit: null, char: '—' }]);
  });
  it('always spins forward at least one full turn', () => {
    expect(reelRows(null, 7)).toEqual({ from: 0, to: 27 });
    expect(reelRows(3, 3)).toEqual({ from: 13, to: 23 });
    expect(reelRows(9, 0)).toEqual({ from: 19, to: 20 });
  });
});
