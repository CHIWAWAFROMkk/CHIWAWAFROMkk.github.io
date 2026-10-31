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

describe('the AI site’s résumés follow the 2026-10-14 final fixes', () => {
  const zh = () => readFileSync('tools/resume-zh.html', 'utf8');
  it('says Project Specialist, as the ledger (F5) does', () => {
    expect(zh()).toContain('项目专员（HR 数字化方向）');
    expect(zh()).not.toContain('项目助理');
    expect(html).toContain('Project Specialist, HR Digitalization');
    expect(html).not.toContain('Project Assistant');
  });
  it('drops the course line', () => {
    expect(zh()).not.toContain('<b>课程</b>');
    expect(html).not.toContain('<b>Courses</b>');
  });
  it('the Chinese source carries no photo', () => {
    expect(zh()).not.toContain('<img');
    expect(zh()).not.toContain('data:image');
  });
});

describe('availability follows the 2026-10-31 confirmation (in a job now, start date negotiable)', () => {
  it('the ledger and all four résumé sources say the start date is negotiable', async () => {
    const { fact } = await import('../../src/data/facts');
    expect(fact('F3').text.zh).toContain('到岗时间可协商');
    expect(fact('F3').text.en).toContain('Start date negotiable');
    for (const f of ['resume-zh', 'resume-en', 'resume-hr-zh', 'resume-hr-en']) {
      const s = readFileSync(`tools/${f}.html`, 'utf8');
      expect(s, f).not.toMatch(/立即到岗|Available now/);
      expect(s, f).toMatch(/到岗时间可协商|Start date negotiable/);
    }
  });
});
