import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The cross-page crossfade is switched off by the system's reduced-motion setting; a visitor who picks "off" on the site
// must lose it too. Browsers draw it with ::view-transition-* pseudo-elements, which the `*` rules do not reach.
it('choosing off also stops the cross-page transition', () => {
  const css = readFileSync('src/styles/base.css', 'utf8').replace(/\s+/g, ' ');
  const rule = css.split('}').find(r => r.includes("html[data-motion='off']::view-transition-group(*)"));
  expect(rule).toBeTruthy();
  for (const part of ['group', 'old', 'new']) expect(rule, part).toContain(`html[data-motion='off']::view-transition-${part}(*)`);
  expect(rule).toContain('animation: none !important');
});
