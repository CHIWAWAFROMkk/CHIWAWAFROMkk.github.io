import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SEEN_KEY } from '../../src/scripts/intro';
import { SITE } from '../../src/data/site';

const zh = readFileSync('src/copy/privacy.zh.md', 'utf8');
const en = readFileSync('src/copy/privacy.en.md', 'utf8');

describe('privacy copy', () => {
  it.each([['zh', zh], ['en', en]])('%s names the one storage key the site really uses, and the contact address', (_l, md) => {
    expect(md).toContain(SEEN_KEY);
    expect(md).toContain(`mailto:${SITE.email}`);
  });

  it('both languages have the same sections', () => {
    expect(zh.match(/^## /gm)).toHaveLength(5);
    expect(en.match(/^## /gm)).toHaveLength(5);
  });
});
