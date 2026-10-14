import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = (dir: string): string[] => readdirSync(dir).flatMap(n => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? files(p) : /\.(astro|css|ts)$/.test(n) ? [p] : [];
});

describe('viewport heights', () => {
  it('use svh/dvh, never vh for full-screen heights (100vh jumps with the phone address bar)', () => {
    const hits = files('src').filter(f => /\b100vh\b/.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});
