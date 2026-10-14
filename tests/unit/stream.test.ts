import { describe, it, expect } from 'vitest';
import { chunkText, streamStep } from '../../src/scripts/motion/stream';
import { fact } from '../../src/data/facts';

const han = (s: string) => [...s].filter(c => /\p{Script=Han}/u.test(c)).length;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

describe('chunkText', () => {
  for (const lang of ['zh', 'en'] as const) {
    it(`keeps every character of F1 (${lang})`, () => {
      const t = fact('F1').text[lang];
      expect(chunkText(t).join('')).toBe(t);
    });
  }
  it('Chinese chunks hold at most three characters plus punctuation', () => {
    for (const c of chunkText(fact('F1').text.zh)) expect(han(c), c).toBeLessThanOrEqual(3);
  });
  it('English chunks hold at most two words', () => {
    for (const c of chunkText(fact('F1').text.en)) expect(words(c), c).toBeLessThanOrEqual(2);
  });
  it('a Latin name inside Chinese stays whole', () => {
    expect(chunkText('基于 Copilot 与 Power Automate')).toContain('Copilot ');
  });
  it('gentle streams slower than full', () => expect(streamStep('gentle')).toBeGreaterThan(streamStep('full')));
});
