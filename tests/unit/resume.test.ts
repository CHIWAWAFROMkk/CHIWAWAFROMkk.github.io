import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';

const html = readFileSync('tools/resume-en.html', 'utf8');

describe('English résumé source', () => {
  it('uses the confirmed availability and ledger wording', () => {
    expect(html).toContain('4–5 days a week');
    expect(html).toContain('3+ months');
    expect(html).toContain('about 2000 employees');
    expect(html).toContain('6,000+');
  });
  it('drops the unsupported 70% claim', () => {
    expect(html).not.toContain('70%');
  });
  it('has been printed to PDF', () => {
    expect(statSync('public/downloads/resume/heyanjun-resume-en.pdf').size).toBeGreaterThan(10_000);
  });
});
