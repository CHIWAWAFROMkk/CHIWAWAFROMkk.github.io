import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../../src/data/site';
import { FACTS, fact } from '../../src/data/facts';
import { EDITIONS } from '../../src/data/editions';

/** Claims about the author that the experience ledger rules out (档案 0.2 红线；2026-10-13/14 简历审查). */
const AUTHOR_CLAIMS = [/独立(开发|完成|设计|交付|编写)/, /\bsolo\b/i, /\bindependently (built|developed|designed|delivered)\b/i, /500\s*强/, /Fortune\s*500/i, /100\s*%/, /闭环/];
/** Long-form copy also talks about other people's independence (learners, reviewers) and UI states such as "reset to 100%". */
const PROSE_CLAIMS = [/独立(开发|编写|交付)/, /\bsolo\b/i, /500\s*强/, /Fortune\s*500/i, /闭环/];

function strings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(strings);
  if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
  return [];
}

function markdown(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return markdown(p);
    return p.endsWith('.md') ? [p] : [];
  });
}

describe('copy makes no claims the ledger rules out', () => {
  it('site data, facts and editions', () => {
    for (const s of strings([SITE, FACTS, EDITIONS])) {
      for (const re of AUTHOR_CLAIMS) expect(re.test(s), `${re} in: ${s}`).toBe(false);
    }
  });

  it('markdown copy', () => {
    for (const file of markdown('src/copy')) {
      const text = readFileSync(file, 'utf8');
      for (const re of PROSE_CLAIMS) expect(re.test(text), `${re} in ${file}`).toBe(false);
    }
  });

  it('the internship carries the confirmed title and dates', () => {
    expect(fact('F5').text.zh).toContain('项目专员（HR数字化方向）');
    expect(fact('F5').text.zh).toContain('2026.03—2026.08');
    expect(fact('F5').text.en).toContain('Project Specialist (HR Digitalization)');
  });

  it('the one-line introduction speaks to AI products', () => {
    expect(fact('F1').text.zh).toContain('AI 工作流');
    expect(fact('F1').text.zh).not.toContain('HR 数据整理');
  });
});
