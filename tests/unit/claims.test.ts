import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { SITE } from '../../src/data/site';
import { FACTS, fact } from '../../src/data/facts';
import { EDITIONS } from '../../src/data/editions';

/** Claims the experience ledger rules out (档案 0.2 红线；2026-10-13/14 简历审查; spec §8): 「独立」 in any form. */
const AUTHOR_CLAIMS = [/独立/, /\bsolo\b/i, /\bindependent(ly)?\b/i, /500\s*强/, /Fortune\s*500/i, /100\s*%/, /闭环/];
/** Existing uses that are not claims about the author, one by one with the reason (spec §8: no blanket relaxation). */
const ALLOWED: { file: string; phrase: string; why: string }[] = [
  { file: 'projects/ai-campus.zh.md', phrase: '独立判断', why: '研究变量：学习者的独立判断' },
  { file: 'projects/ai-campus.zh.md', phrase: '独立尝试', why: '研究中描述的学习流程' },
  { file: 'projects/ai-campus.zh.md', phrase: '学习者能独立完成', why: '指学习者' },
  { file: 'projects/ai-campus.zh.md', phrase: '独立作答', why: '研究变量' },
  { file: 'projects/ai-campus.en.md', phrase: 'independent judgement', why: 'study variable about learners' },
  { file: 'projects/ai-campus.en.md', phrase: 'answering independently', why: 'study variable' },
  { file: 'projects/campus-delivery.zh.md', phrase: '业务对象独立建表', why: '数据库设计：每类对象单独成表' },
  { file: 'projects/hris-workflow.zh.md', phrase: '不能独立决定', why: '说的是模型不能自行决定写入' },
  { file: 'projects/quota-deck.zh.md', phrase: '独立份额', why: '演示中的虚构模型份额' },
  { file: 'projects/stark-desk.zh.md', phrase: '独立图层', why: '图像图层' },
  { file: 'projects/stock-data-method.zh.md', phrase: '通用部分独立成', why: '代码模块拆分' },
  { file: 'src/data/site.ts', phrase: '独立额度', why: 'QuotaDeck 页的产品概念' },
];

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
    const allowed = ALLOWED.filter(a => a.file === 'src/data/site.ts');
    for (const raw of strings([SITE, FACTS, EDITIONS])) {
      const s = allowed.reduce((t, a) => t.replaceAll(a.phrase, ''), raw);
      for (const re of AUTHOR_CLAIMS) expect(re.test(s), `${re} in: ${raw}`).toBe(false);
    }
  });

  it('markdown copy, except the listed uses', () => {
    for (const file of markdown('src/copy')) {
      let text = readFileSync(file, 'utf8');
      for (const a of ALLOWED.filter(x => file.split(sep).join('/').endsWith(x.file))) {
        expect(text.includes(a.phrase), `allow-listed phrase gone from ${a.file}: ${a.phrase}`).toBe(true);
        text = text.replaceAll(a.phrase, '');
      }
      for (const re of AUTHOR_CLAIMS) expect(re.test(text), `${re} in ${file}`).toBe(false);
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
