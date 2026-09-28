import { describe, it, expect } from 'vitest';
import { shouldAnimateClick } from '../../src/scripts/door-transition';

const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };

describe('shouldAnimateClick', () => {
  it('animates a plain left click', () => {
    expect(shouldAnimateClick(plain, false)).toBe(true);
  });

  it('leaves new-tab and new-window clicks to the browser', () => {
    for (const k of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) expect(shouldAnimateClick({ ...plain, [k]: true }, false), k).toBe(false);
    expect(shouldAnimateClick({ ...plain, button: 1 }, false)).toBe(false);
  });

  it('does not animate with reduced motion or when another handler already cancelled the click', () => {
    expect(shouldAnimateClick(plain, true)).toBe(false);
    expect(shouldAnimateClick({ ...plain, defaultPrevented: true }, false)).toBe(false);
  });
});
