import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';

const html = readFileSync('tools/resume-en.html', 'utf8');

describe('English résumé source', () => {
  it('uses the confirmed availability and ledger wording', () => {
    expect(html).toContain('5 days a week');
    expect(html).not.toContain('4–5');
    expect(html).toContain('3+ months');
    expect(html).toContain('about 2,000 employees');
    expect(html).toContain('6,000+');
    expect(html).toContain('Mar 2026 – Aug 2026');
  });
  it('drops the unsupported 70% claim and the ranking the user removed', () => {
    expect(html).not.toContain('70%');
    expect(html).not.toContain('Top 5%');
    expect(html).not.toContain('scholarship');
  });
  it('does not bring back claims the ledger does not support', () => {
    expect(html).not.toContain('Fortune 500');
    expect(html).not.toMatch(/independent(ly)?\b/i);
    expect(html).not.toMatch(/100% /);
    expect(html).not.toContain('Mar 2026 – Jun 2026');
    expect(html).not.toContain('expert in');
  });
  it('credits AI for the parts AI built', () => {
    expect(html).toContain('development done by AI');
  });
  it('has been printed to PDF', () => {
    expect(statSync('public/downloads/resume/heyanjun-resume-en.pdf').size).toBeGreaterThan(10_000);
    expect(statSync('public/downloads/resume/heyanjun-resume-zh.pdf').size).toBeGreaterThan(10_000);
  });
});
