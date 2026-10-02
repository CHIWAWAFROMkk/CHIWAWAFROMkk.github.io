import { describe, it, expect } from 'vitest';
import { COLORS as C, contrast, cssVars } from '../../src/data/tokens';

describe('colour tokens', () => {
  it.each([
    ['ink on paper', C.ink, C.paper, 4.5],
    ['mute on paper', C.mute, C.paper, 4.5],
    ['white on redText', '#ffffff', C.redText, 4.5],
    ['paper on ink', C.paper, C.ink, 4.5],
    ['nightMute on ink', C.nightMute, C.ink, 4.5],
    ['nightFg on night', C.nightFg, C.night, 4.5],
    ['nightMute on night', C.nightMute, C.night, 4.5],
    ['red display type on paper', C.red, C.paper, 3],
    ['red display type on night', C.red, C.night, 3],
    ['redText focus ring on ink', C.redText, C.ink, 3],
    ['red as small text on night (red-text on dark pages)', C.red, C.night, 4.5],
  ])('%s ≥ %s', (_name, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('emits kebab-case custom properties', () => {
    expect(cssVars()).toContain('--red-text:#c4300a');
    expect(cssVars()).toContain('--night-fg:#ece4d6');
  });
});
