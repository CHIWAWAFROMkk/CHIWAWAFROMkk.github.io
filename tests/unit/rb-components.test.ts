import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SplitText from '../../src/components/rb/SplitText';
import ScrollReveal from '../../src/components/rb/ScrollReveal';
import Magnet from '../../src/components/rb/Magnet';
import SpotlightCard from '../../src/components/rb/SpotlightCard';

describe('progressive enhancement before hydration', () => {
  it('renders complete escaped heading text without animation units or inline hiding', () => {
    for (const Component of [SplitText, ScrollReveal]) {
      const html = renderToStaticMarkup(createElement(Component, { text: 'Projects & 演示' }));
      expect(html).toContain('Projects &amp; 演示');
      expect(html).not.toMatch(/split-char|split-word|sr-unit|opacity:0|visibility:hidden|<h[12]|<p[ >]/);
    }
  });
  it('keeps a deferred title readable before its near-viewport activation', () => {
    const html = renderToStaticMarkup(createElement(SplitText, { text: 'After a long prologue', deferUntilVisible: true }));
    expect(html).toContain('data-split-deferred=""');
    expect(html).toContain('After a long prologue');
    expect(html).not.toMatch(/opacity:0|visibility:hidden/);
    expect(renderToStaticMarkup(createElement(SplitText, { text: 'First screen' }))).not.toContain('data-split-deferred');
  });
  it('keeps its child link and static target available without a browser', () => {
    for (const Component of [Magnet, SpotlightCard]) {
      const html = renderToStaticMarkup(createElement(Component, { children: createElement('a', { href: '/brief/' }, 'Read overview') }));
      expect(html).toContain('<a href="/brief/">Read overview</a>');
      expect(html).not.toContain('translate3d');
    }
  });
});
