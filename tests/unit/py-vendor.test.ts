import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = 'public/assets/vendor/pyodide/0.29.5';
const manifest = () => JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));

describe('self-hosted Pyodide', () => {
  it('is 0.29.5 on Python 3.13', () => {
    expect(manifest().version).toBe('0.29.5');
    expect(manifest().python).toMatch(/^3\.13\./);
  });
  it('every listed file is present with the recorded SHA-256', () => {
    for (const f of manifest().files) {
      expect(createHash('sha256').update(readFileSync(`${DIR}/${f.name}`)).digest('hex'), f.name).toBe(f.sha256);
    }
  });
  it('ships exactly the wheels the engine imports', () => {
    const wheels = manifest().files.map((f: { package?: string }) => f.package).filter(Boolean).sort();
    expect(wheels).toEqual(['annotated-types', 'pydantic', 'pydantic-core', 'sqlite3', 'typing-extensions', 'typing-inspection']);
  });
  it('ships the licence notices of Pyodide (MPL-2.0) and of the Python standard library (PSF)', () => {
    const names = manifest().files.map((f: { name: string }) => f.name);
    expect(names).toContain('LICENSE-pyodide.txt');
    expect(names).toContain('LICENSE-python.txt');
    expect(readFileSync(`${DIR}/LICENSE-pyodide.txt`, 'utf8')).toContain('Mozilla Public License');
    expect(readFileSync(`${DIR}/LICENSE-python.txt`, 'utf8')).toContain('PYTHON SOFTWARE FOUNDATION LICENSE');
  });
});

