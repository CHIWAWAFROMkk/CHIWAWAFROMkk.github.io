import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadSqlJs } from '../../tools/sqljs-node.mjs';
import { generate } from '../../tools/insights-gen.mjs';
import { QUERIES, ALL, params, runQueries } from '../../src/scripts/insights-queries.mjs';

const DB_FILE = 'public/assets/insights/campus-term.sqlite';
const schema = readFileSync('public/assets/delivery-schema.sql', 'utf8');
let SQL: any;
let db: any;

beforeAll(async () => {
  SQL = await loadSqlJs();
  db = new SQL.Database(readFileSync(DB_FILE));
});
afterAll(() => db?.close());

const one = (sql: string) => db.exec(sql)[0]?.values[0][0];

describe('synthetic term', () => {
  it('is deterministic and is exactly the committed database', () => {
    const a = generate(SQL, schema);
    const b = generate(SQL, schema);
    expect(Buffer.from(a.bytes).equals(Buffer.from(b.bytes))).toBe(true);
    expect(Buffer.from(a.bytes).equals(readFileSync(DB_FILE))).toBe(true);
    a.db.close();
    b.db.close();
  });

  it('stays within the 1.5 MB budget', () => {
    expect(readFileSync(DB_FILE).length).toBeLessThanOrEqual(1_572_864);
  });

  it('keeps every rule of the course-project schema', () => {
    expect(one('SELECT COUNT(*) FROM orders')).toBeGreaterThan(4000);
    expect(one('SELECT COUNT(*) FROM orders o WHERE total_cents != (SELECT SUM(quantity * unit_price_cents) FROM order_items WHERE order_id = o.id)')).toBe(0);
    expect(one('SELECT COUNT(*) FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.amount_cents != o.total_cents')).toBe(0);
    expect(one('SELECT COUNT(*) FROM orders WHERE id NOT IN (SELECT order_id FROM payments)')).toBe(0);
    expect(one("SELECT COUNT(*) FROM orders WHERE status = 'paid'")).toBe(0);
    expect(one("SELECT COUNT(*) FROM orders WHERE status = 'refunded'")).toBe(one('SELECT COUNT(*) FROM refunds'));
    expect(one('SELECT COUNT(*) FROM refunds r JOIN deliveries d USING (order_id) WHERE d.delivered_at IS NOT NULL')).toBe(0);
    expect(db.exec('PRAGMA foreign_key_check')).toEqual([]);
  });
});

describe('insights queries', () => {
  it('the committed results are what the queries return on the committed database', () => {
    const committed = JSON.parse(readFileSync('src/data/insights.json', 'utf8'));
    expect(runQueries(db, Object.keys(QUERIES), ALL)).toEqual(committed.results);
  });

  it('filters are sorted into bound parameters', () => {
    expect(params({ from: 3, to: 9, merchants: [3, 1], areas: ['北区', '东区'] }))
      .toEqual({ ':from': 3, ':to': 9, ':merchants': '1,3', ':areas': '东区,北区' });
  });

  it('a filter narrows the result and merchants always list all twelve', () => {
    const all = runQueries(db, ['kpi'], ALL).kpi.values[0][0];
    const some = runQueries(db, ['kpi', 'merchants'], params({ from: 1, to: 16, merchants: [1], areas: [] }));
    expect(some.kpi.values[0][0]).toBeGreaterThan(0);
    expect(some.kpi.values[0][0]).toBeLessThan(all);
    expect(some.merchants.values).toHaveLength(12);
  });

  it('the downloadable copies are byte-identical to the sources', () => {
    expect(readFileSync('public/downloads/insights/insights-gen.mjs', 'utf8')).toBe(readFileSync('tools/insights-gen.mjs', 'utf8'));
    expect(readFileSync('public/downloads/insights/insights-queries.mjs', 'utf8')).toBe(readFileSync('src/scripts/insights-queries.mjs', 'utf8'));
  });
});
