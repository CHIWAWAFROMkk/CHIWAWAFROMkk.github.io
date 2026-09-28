import { describe, it, expect } from 'vitest';
import { SITE } from '../../src/data/site';
import { factCorpus } from '../../src/data/facts';
import { digitTokens } from './digits';

const SKIP_KEYS = new Set(['email', 'resume', 'href', 'slug', 'src']);

function strings(node: unknown, key = ''): string[] {
  if (SKIP_KEYS.has(key)) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(n => strings(n));
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => strings(v, k));
  return [];
}

describe('SITE copy', () => {
  it('uses no number that is missing from the fact ledger', () => {
    const corpus = factCorpus();
    for (const s of strings(SITE)) for (const t of digitTokens(s)) expect(corpus, `"${t}" in "${s}"`).toContain(t);
  });

  it('every project is bilingual and links to /projects/<slug>/', () => {
    for (const p of SITE.projects) {
      expect(p.href).toBe(`/projects/${p.slug}/`);
      for (const k of ['title', 'did', 'status'] as const) {
        expect(p[k].zh.trim(), `${p.slug}.${k}.zh`).not.toBe('');
        expect(p[k].en.trim(), `${p.slug}.${k}.en`).not.toBe('');
      }
    }
  });

  it('brief lists five data projects and one film', () => {
    const inBrief = SITE.projects.filter(p => p.inBrief);
    expect(inBrief.filter(p => p.line === 'data')).toHaveLength(5);
    expect(inBrief.filter(p => p.line === 'film')).toHaveLength(1);
  });

  it('never claims the unsupported 70% metric', () => {
    expect(strings(SITE).join('\n')).not.toContain('70%');
  });
});
