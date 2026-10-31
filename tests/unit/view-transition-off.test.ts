import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The cross-page crossfade is switched off by the system's reduced-motion setting; a visitor who picks "off" on the site
// must lose it too. Browsers draw it with ::view-transition-* pseudo-elements, which the `*` rules do not reach.
it('choosing off also stops the cross-page transition', () => {
  const css = readFileSync('src/styles/base.css', 'utf8').replace(/\s+/g, ' ');
  for (const part of ['group', 'old', 'new']) {
    expect(css, part).toMatch(new RegExp(`html\[data-motion='off'\]::view-transition-${part}\(\*\)[^{]*\{[^}]*animation: none !important`));
  }
});
