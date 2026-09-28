import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DELIVERY_QUERIES } from '../../src/scripts/delivery-queries';
// @ts-expect-error plain JS module shipped as a static asset
import { queries as coreQueries } from '../../public/assets/delivery-core.mjs';

const require = createRequire(import.meta.url);

describe('delivery queries', () => {
  it('Chinese queries are exactly the ones in the shipped core', () => {
    expect(DELIVERY_QUERIES.zh).toEqual(coreQueries);
  });

  it('English and Chinese lists line up one to one', () => {
    expect(DELIVERY_QUERIES.en).toHaveLength(DELIVERY_QUERIES.zh.length);
    for (const q of DELIVERY_QUERIES.en) {
      expect(q.name.trim()).not.toBe('');
      expect(q.note.trim()).not.toBe('');
      expect(q.sql).not.toMatch(/[一-鿿]/); // no Chinese identifiers in English SQL
    }
  });

  it('every English query runs on the demo database and returns the same shape as its Chinese twin', async () => {
    // package.json is "type": "module", so require() would load this UMD file as ESM with no exports; run it as CommonJS instead.
    const mod: { exports: any } = { exports: {} };
    new Function('module', 'exports', 'require', '__dirname', readFileSync('public/assets/vendor/sql-wasm.js', 'utf8'))(mod, mod.exports, require, resolve('public/assets/vendor'));
    const initSqlJs = mod.exports;
    const SQL = await initSqlJs({ locateFile: (f: string) => resolve('public/assets/vendor', f) });
    const db = new SQL.Database(readFileSync('public/downloads/delivery/campus.sqlite'));
    DELIVERY_QUERIES.zh.forEach((zh, i) => {
      const [a] = db.exec(zh.sql);
      const [b] = db.exec(DELIVERY_QUERIES.en[i].sql);
      expect(b?.values.length ?? 0, DELIVERY_QUERIES.en[i].name).toBe(a?.values.length ?? 0);
      expect(b?.columns.length ?? 0, DELIVERY_QUERIES.en[i].name).toBe(a?.columns.length ?? 0);
    });
    db.close();
  });
});
