// The insights page's SQL: the build-time story numbers, the tests and the in-browser dashboard all run exactly these.
// Every query starts from the filtered order set `f`; filters are bound parameters, never spliced into the SQL.

const MINUTES = 'CAST(ROUND((julianday(d.delivered_at) - julianday(f.created_at)) * 1440) AS INTEGER)';
const WEEK = "CAST((julianday(date(o.created_at)) - julianday('2025-09-01')) / 7 AS INTEGER) + 1";
const BASE = `WITH f AS (
  SELECT o.*, substr(s.dorm, 1, 2) AS area, ${WEEK} AS week
  FROM orders o JOIN students s ON s.id = o.student_id
  WHERE ${WEEK} BETWEEN :from AND :to
    AND (:merchants = '' OR instr(',' || :merchants || ',', ',' || o.merchant_id || ',') > 0)
    AND (:areas = '' OR instr(',' || :areas || ',', ',' || substr(s.dorm, 1, 2) || ',') > 0)
)`;

export const QUERIES = {
  kpi: `${BASE}
SELECT COUNT(*) AS orders,
       COALESCE(SUM(p.amount_cents), 0) - COALESCE(SUM(r.amount_cents), 0) AS net_cents,
       CAST(ROUND(AVG(CASE WHEN f.status != 'refunded' THEN f.total_cents END)) AS INTEGER) AS aov_cents,
       ROUND(100.0 * SUM(f.status = 'refunded') / MAX(COUNT(*), 1), 1) AS refund_pct,
       ROUND(AVG(CASE WHEN f.status = 'delivered' THEN ${MINUTES} END), 1) AS avg_minutes
FROM f
LEFT JOIN payments p ON p.order_id = f.id
LEFT JOIN refunds r ON r.order_id = f.id
LEFT JOIN deliveries d ON d.order_id = f.id`,
  heatmap: `${BASE}
SELECT (CAST(strftime('%w', f.created_at) AS INTEGER) + 6) % 7 AS dow,
       CAST(strftime('%H', f.created_at) AS INTEGER) AS hour,
       COUNT(*) AS orders
FROM f GROUP BY dow, hour ORDER BY dow, hour`,
  merchants: `${BASE}
SELECT m.id AS merchant_id, m.name AS merchant, COUNT(f.id) AS orders,
       COALESCE(SUM(p.amount_cents), 0) - COALESCE(SUM(r.amount_cents), 0) AS net_cents
FROM merchants m
LEFT JOIN f ON f.merchant_id = m.id
LEFT JOIN payments p ON p.order_id = f.id
LEFT JOIN refunds r ON r.order_id = f.id
GROUP BY m.id ORDER BY net_cents DESC, m.id`,
  retention: `${BASE},
cohorts AS (SELECT student_id, MIN(week) AS cohort FROM f GROUP BY student_id),
sizes AS (SELECT cohort, COUNT(*) AS size FROM cohorts GROUP BY cohort),
active AS (SELECT DISTINCT student_id, week FROM f WHERE status != 'refunded')
SELECT c.cohort, a.week - c.cohort AS weeks_after, s.size, COUNT(*) AS students
FROM cohorts c JOIN active a USING (student_id) JOIN sizes s USING (cohort)
WHERE a.week >= c.cohort
GROUP BY c.cohort, weeks_after ORDER BY c.cohort, weeks_after`,
  delivery: `${BASE}
SELECT f.area, MIN(${MINUTES} / 5 * 5, 60) AS bin, COUNT(*) AS orders
FROM f JOIN deliveries d ON d.order_id = f.id
WHERE f.status = 'delivered'
GROUP BY f.area, bin ORDER BY f.area, bin`,
  slow: `${BASE}
SELECT f.area, COUNT(*) AS delivered, SUM(${MINUTES} > 45) AS over_45,
       ROUND(AVG(${MINUTES}), 1) AS avg_minutes
FROM f JOIN deliveries d ON d.order_id = f.id
WHERE f.status = 'delivered'
GROUP BY f.area ORDER BY avg_minutes, f.area`,
  reasons: `${BASE}
SELECT r.reason, COUNT(*) AS refunds
FROM f JOIN refunds r ON r.order_id = f.id
GROUP BY r.reason ORDER BY refunds DESC, r.reason`,
  cancelByHour: `${BASE}
SELECT CAST(strftime('%H', f.created_at) AS INTEGER) AS hour, COUNT(*) AS orders,
       SUM(f.status = 'refunded') AS refunded
FROM f GROUP BY hour ORDER BY hour`,
};

/** @typedef {{ from: number, to: number, merchants: number[], areas: string[] }} Filter */

/** @type {Filter} */
export const ALL_FILTER = { from: 1, to: 16, merchants: [], areas: [] };

/** @param {Filter} f */
export function params(f) {
  return {
    ':from': f.from,
    ':to': f.to,
    ':merchants': [...f.merchants].sort((a, b) => a - b).join(','),
    ':areas': [...f.areas].sort().join(','),
  };
}

export const ALL = params(ALL_FILTER);

/** Runs the named queries on a sql.js database: { id: { columns, values } }. */
export function runQueries(db, ids, p) {
  const out = {};
  for (const id of ids) {
    const s = db.prepare(QUERIES[id]);
    try {
      s.bind(p);
      const values = [];
      while (s.step()) values.push(s.get());
      out[id] = { columns: s.getColumnNames(), values };
    } finally {
      s.free();
    }
  }
  return out;
}
