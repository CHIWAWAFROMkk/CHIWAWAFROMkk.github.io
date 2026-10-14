import { describe, it, expect } from 'vitest';
import { HRIS } from '../../src/data/hris';
import { factCorpus, fact } from '../../src/data/facts';
import { strayTokens } from './digits';

const AUTHOR_CLAIMS = [/独立/, /\bsolo\b/i, /\bindependent(ly)?\b/i, /500\s*强/, /Fortune\s*500/i, /100\s*%/, /闭环/, /Pydantic/, /field_diff/, /OpenClaw\s*自动/, /COMPLIANCE\s*VERIFIED/i, /持续运行/, /3000/];
const SKIP = new Set(['href', 'file', 'route']);
function strings(node: unknown, key = ''): string[] {
  if (SKIP.has(key)) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(n => strings(n));
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => strings(v, k));
  return [];
}

describe('HRIS copy', () => {
  it('uses no number missing from the fact ledger', () => {
    const corpus = factCorpus();
    for (const s of strings(HRIS)) expect(strayTokens(s, corpus), s).toEqual([]);
  });
  it('makes no claim the ledger rules out', () => {
    for (const s of strings(HRIS)) for (const re of AUTHOR_CLAIMS) expect(re.test(s), `${re} in: ${s}`).toBe(false);
  });
  it('every text is bilingual', () => {
    const walk = (node: unknown, path: string): void => {
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        const o = node as Record<string, unknown>;
        if ('zh' in o || 'en' in o) {
          expect(typeof o.zh === 'string' && (o.zh as string).trim() !== '', `${path}.zh`).toBe(true);
          expect(typeof o.en === 'string' && (o.en as string).trim() !== '', `${path}.en`).toBe(true);
          return;
        }
        for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    };
    walk(HRIS, 'HRIS');
  });
  it('the system scale keeps the system as its subject; the personal scale is "about 2000"', () => {
    const six = HRIS.ledger.find(l => l.figure === '6,000+')!;
    expect(six.caption.zh).toMatch(/系统/);
    expect(HRIS.ledger.find(l => l.figure === '2000')!.caption.zh).toContain('约');
  });
  it('F15 records the every-hundred full re-check', () => {
    expect(fact('F15').figure).toBe('100');
  });
});
