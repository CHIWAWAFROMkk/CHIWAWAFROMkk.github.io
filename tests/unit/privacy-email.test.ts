import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SITE } from '../../src/data/site';

describe('the contact address has one source', () => {
  it('the privacy pages use SITE.email', () => {
    for (const lang of ['zh', 'en']) {
      const md = readFileSync(`src/copy/privacy.${lang}.md`, 'utf8');
      const mails = [...md.matchAll(/mailto:([^)\s]+)/g)].map(m => m[1]);
      expect(mails.length, lang).toBeGreaterThan(0);
      for (const m of mails) expect(m, lang).toBe(SITE.email);
    }
  });
});
