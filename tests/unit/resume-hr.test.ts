import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { HRIS } from '../../src/data/hris';

const src = (lang: 'zh' | 'en') => readFileSync(`tools/resume-hr-${lang}.html`, 'utf8');
const pdf = (lang: 'zh' | 'en') => `public${HRIS.resumeFile[lang]}`;

describe('the HRIS site has its own HR résumé', () => {
  it('links its own files, not the AI site’s', () => {
    expect(HRIS.resumeFile).toEqual({ zh: '/downloads/resume/heyanjun-resume-hr-zh.pdf', en: '/downloads/resume/heyanjun-resume-hr-en.pdf' });
  });
  it('opens with the IntelliPro internship, the full recruiting cycle and interview scheduling', () => {
    expect(src('zh')).toContain('因特利普（IntelliPro）');
    expect(src('zh')).toContain('招聘顾问实习生');
    expect(src('zh')).toContain('招聘全流程');
    expect(src('zh')).toContain('约面试');
    expect(src('en')).toContain('Recruitment Consultant Intern');
    expect(src('en')).toMatch(/full recruiting cycle/i);
    expect(src('en')).toContain('scheduled interviews');
    for (const lang of ['zh', 'en'] as const) {
      const s = src(lang);
      // Entry headings, not the summary: the newest internship is listed first.
      const ip = s.indexOf(lang === 'zh' ? '<span>因特利普（IntelliPro）</span>' : '<span>IntelliPro</span>');
      expect(ip, lang).toBeGreaterThan(0);
      expect(ip, lang).toBeLessThan(s.indexOf('<span>' + (lang === 'zh' ? '丹纳赫' : 'Danaher')));
    }
  });
  it('carries the 2026-10-14 fixes: Project Specialist, no course line', () => {
    expect(src('zh')).toContain('项目专员（HR 数字化方向）');
    expect(src('zh')).not.toContain('项目助理');
    expect(src('zh')).not.toContain('<b>课程</b>');
    expect(src('en')).toContain('Project Specialist, HR Digitalization');
    expect(src('en')).not.toContain('Project Assistant');
    expect(src('en')).not.toContain('<b>Courses</b>');
  });
  it('publishes no photo and names no client', () => {
    for (const lang of ['zh', 'en'] as const) {
      expect(src(lang), lang).not.toContain('data:image');
      expect(src(lang), lang).not.toContain('<img');
      expect(src(lang), lang).not.toMatch(/森松|同飞|阿尔西|华为|Morimatsu|Tongfei|Huawei|猎聘|Liepin/);
    }
  });
  it('is printed to one-page PDFs', () => {
    for (const lang of ['zh', 'en'] as const) {
      expect(existsSync(pdf(lang)), lang).toBe(true);
      expect(statSync(pdf(lang)).size, lang).toBeGreaterThan(10_000);
      expect(readFileSync(pdf(lang)).toString('latin1'), lang).toMatch(/\/Type\s*\/Pages[^>]*\/Count 1\b/);
    }
  });
});
