# 校园外卖经营分析（进阶版）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `redesign` 分支上做出 `/projects/campus-delivery/insights/`（中英双语）：开场点雨、六章滚动叙事（同一池图形随滚动变形）、可筛选的实时 SQL 驾驶舱、方法与下载；并接入项目总目录和 SQL 页。

**Architecture:** 固定种子的生成脚本 `tools/insights-gen.mjs` 通过课程设计原有的表结构与触发器写出一个学期的 SQLite 文件，再用 `src/scripts/insights-queries.mjs` 里的同一批 SQL 算出 `src/data/insights.json`。两个文件都提交进仓库。页面在构建时从 JSON 渲染叙事与驾驶舱的初始状态，因此 SQL 引擎拉不到时页面依然完整；驾驶舱在浏览器 Web Worker 里对同一个数据库执行同一批 SQL 做筛选。图形由纯函数 `morph.ts` 计算，DOM 脚本只负责写属性。

**Tech Stack:** Astro 7、TypeScript、Vitest、Playwright（Edge，测试服务器 `tools/serve-dist.mjs`，端口 4399）、sql.js 1.14.2（`public/assets/vendor`，已有）。

**Spec:** `docs/superpowers/specs/2026-09-28-campus-insights-and-motion-design.md`（第 1–7、9 节；第 8 节旧页面动效属于计划二，不在本计划内）。上位设计：`docs/superpowers/specs/2026-09-28-portfolio-redesign-design.md`。

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；**不推送、不合并、不部署**。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。不要用裸 `git stash`。
- 视觉规则沿用：颜色只用 `src/data/tokens.ts` 的 CSS 变量（`--paper --ink --mute --red --red-text --night --night-fg --night-mute`）；直角、无阴影；悬停不改变尺寸；`prefers-reduced-motion: reduce` 下无动画（`base.css` 已全局关闭 transition/animation，JS 动效需自行判断）。
- 关于作者本人的数字只来自 `src/data/facts.ts`。进阶版页面上**关于数据的数字**只能出现在两类元素里：`[data-insight-num]`（由 `insights.json` 推导并格式化）和 `[data-insight-data]`（图表、表格、驾驶舱、序号）。文案模板里不许手写数字（单元测试强制）。
- 诚实性（spec 第 4 节）：摘要"我的工作"与"状态"逐字使用本计划 Task 4 的文案；页面两处写明规律由生成脚本预设。
- 合成数据规模以体积上限为准：`campus-term.sqlite` ≤ 1,572,864 字节（1.5 MB）。本计划参数实测：5,142 笔订单、1,302,528 字节。
- 待用户审阅（交付时列出）：第 6 章三条建议的措辞；`PARAMS` 里的生成参数；全部英文文案。

## Review Focus

1. **SQL 引擎或学期数据库下载失败**（国内网络）：叙事六章与全部数字照常显示；驾驶舱保留构建时的全学期结果，显示可读的失败提示，控件禁用，无页面错误 → Task 7 `engine fails to load`。
2. **筛选组合下没有订单**（例如只看第 16 周 + 冷门商家 + 北区）：指标显示 `—`/`0`，图形不出现 NaN，状态行说明"没有订单" → Task 3 `empty results`，Task 7 `a filter with no orders`。
3. **快速拖动滑块**：只有最后一次筛选的结果留在屏幕上，不会被较早返回的结果覆盖 → Task 7 `rapid changes settle on the last filter`。
4. **手机窄屏**：图表舞台固定在上半屏、页面不横向溢出、驾驶舱单列 → Task 5 `mobile: the stage stays pinned`，Task 7 布局断言，外加全站 `layout.spec`。
5. **减少动态效果**：没有点雨、没有变形过渡，舞台按章节直接切换到该章的静态图 → Task 5 `reduced motion snaps`，Task 6 `reduced motion skips the rain`。

---

## 文件结构

```
tools/sqljs-node.mjs                   Node 里加载 sql.js（CommonJS 垫片），供生成脚本与测试使用
tools/insights-gen.mjs                 PARAMS + generate(SQL, schema)：合成一个学期（也作为下载提供）
tools/gen-insights.mjs                 命令行：写出数据库、insights.json 与下载副本（npm run insights:gen）
src/scripts/insights-queries.mjs       QUERIES（8 条只读 SQL）、ALL_FILTER、params()、runQueries()（也作为下载提供）
public/assets/insights/campus-term.sqlite   生成物（提交）
src/data/insights.json                 生成物：{ results: { <queryId>: { columns, values } } }（提交）
public/downloads/insights/insights-gen.mjs, insights-queries.mjs   下载副本（与源文件逐字节一致）
src/scripts/insights-names.ts          商家 / 宿舍区 / 退款原因的英文名与图例文字
src/scripts/insights-facts.ts          Results 类型、deriveFacts()、formatFact()
src/data/insights-copy.ts              开场、六章、建议、表头的中英文案（带 {占位符}）
src/scripts/morph.ts                   168 个矩形的图表布局、插值、滚动进度（纯函数）
src/scripts/morph-dom.ts               paint()、initMorph()
src/scripts/countup.ts / countup-dom.ts  数字滚动计数
src/scripts/rain.ts / rain-dom.ts      开场点雨
src/scripts/cockpit-text.ts            驾驶舱文案与指标格式
src/scripts/cockpit-ui.ts              驾驶舱
public/assets/insights-worker.js       驾驶舱的 SQL 工作线程（只读）
src/components/InsightText.astro       把 {占位符} 渲染成 <span data-insight-num>
src/components/ChartLabels.astro       各图表的坐标 / 图例文字（SVG）
src/components/InsightsHero.astro      开场
src/components/InsightsStory.astro     滚动叙事
src/components/InsightsCockpit.astro   驾驶舱
src/components/InsightsMethod.astro    生成参数表、全部 SQL、下载
src/components/InsightsTeaser.astro    SQL 页正文末尾的进阶版入口
src/copy/projects/campus-insights.{zh,en}.md   方法说明正文
src/views/InsightsView.astro
src/pages/projects/campus-delivery/insights.astro, src/pages/en/projects/campus-delivery/insights.astro
src/layouts/ProjectLayout.astro        新增 <slot name="top" />
src/views/CampusView.astro             正文末尾放 InsightsTeaser
src/data/site.ts                       projects 里插入 campus-delivery/insights；pages.insights
package.json                           新增脚本 insights:gen
tests/unit/{insights-data,insights-facts,morph,countup,rain,cockpit-text}.test.ts
tests/e2e/insights.spec.ts
tests/e2e/helpers.ts                   PAGES 加入进阶版两页
tests/e2e/numbers.spec.ts              EXCLUDE 加入 [data-insight-num], [data-insight-data]
```

---

### Task 1: 数据层——生成脚本、查询、提交的生成物

**Files:**
- Create: `tools/sqljs-node.mjs`, `tools/insights-gen.mjs`, `tools/gen-insights.mjs`, `src/scripts/insights-queries.mjs`
- Create（生成）: `public/assets/insights/campus-term.sqlite`, `src/data/insights.json`, `public/downloads/insights/insights-gen.mjs`, `public/downloads/insights/insights-queries.mjs`
- Modify: `package.json`（scripts）
- Test: `tests/unit/insights-data.test.ts`

**Interfaces:**
- Produces:
  - `loadSqlJs(): Promise<SqlJsStatic>`（`tools/sqljs-node.mjs`；以当前工作目录为仓库根）
  - `PARAMS`、`generate(SQL, schema, P?): { db, bytes: Uint8Array }`（`tools/insights-gen.mjs`）
  - `QUERIES: Record<'kpi'|'heatmap'|'merchants'|'retention'|'delivery'|'slow'|'reasons'|'cancelByHour', string>`、`ALL_FILTER`、`params(filter): Record<string, number|string>`、`ALL`、`runQueries(db, ids, p): Record<id, { columns: string[], values: (number|string)[][] }>`（`src/scripts/insights-queries.mjs`）
  - 列顺序（后续任务按下标读取）：
    - `kpi`: `[orders, net_cents, aov_cents, refund_pct, avg_minutes]`（一行）
    - `heatmap`: `[dow(0=周一), hour, orders]`
    - `merchants`: `[merchant_id, merchant, orders, net_cents]`，按净收款降序，始终 12 行
    - `retention`: `[cohort, weeks_after, size, students]`
    - `delivery`: `[area, bin(0,5,…,60；60 表示 ≥60), orders]`
    - `slow`: `[area, delivered, over_45, avg_minutes]`，按平均时长升序
    - `reasons`: `[reason, refunds]`，降序
    - `cancelByHour`: `[hour, orders, refunded]`

- [ ] **Step 1: 写 Node 加载器与生成脚本**

`tools/sqljs-node.mjs`：

```js
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const VENDOR = resolve('public/assets/vendor');

/** sql.js in Node. package.json is "type": "module", so require() would load this UMD file as ESM with no exports; run it as CommonJS instead. */
export async function loadSqlJs() {
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', '__dirname', readFileSync(resolve(VENDOR, 'sql-wasm.js'), 'utf8'))(mod, mod.exports, createRequire(import.meta.url), VENDOR);
  return mod.exports({ locateFile: f => resolve(VENDOR, f) });
}
```

`tools/insights-gen.mjs`（逐字使用；写计划时已实测：输出 5,142 笔订单、1,302,528 字节、两次运行逐字节相同）：

```js
// Synthetic term for the campus delivery insights page.
// Every pattern the page "finds" is set here on purpose: the page demonstrates the method, not real findings.
// Deterministic: the same seed and script always produce the same database, byte for byte.

export const PARAMS = {
  seed: 20250901,
  termStart: '2025-09-01', // a Monday
  weeks: 16,
  students: 600,
  // [dorm area, base delivery minutes, share of students]
  areas: [['东区', 18, 0.3], ['西区', 20, 0.3], ['南区', 22, 0.25], ['北区', 32, 0.15]],
  // Share of students whose first order falls in the first two weeks, and how weekly ordering decays after joining.
  freshmanShare: 0.6,
  retention: { fresh: [0.55, 0.45, 6], later: [0.3, 0.7, 2.5] }, // floor + span * exp(-weeksSinceJoining / halfLife)
  // [orders per week at full interest, share of students]
  appetite: [[0.6, 0.5], [1.1, 0.35], [2.0, 0.15]],
  dayWeights: [1, 1, 1, 1, 1.1, 1.2, 1.1], // Monday … Sunday
  hourWeights: { 7: 2, 8: 3, 9: 1, 10: 2, 11: 14, 12: 16, 13: 5, 14: 2, 15: 2, 16: 3, 17: 12, 18: 13, 19: 6, 20: 4, 21: 6, 22: 5, 23: 3 },
  lateBoost: 1.8, // Friday and Saturday, 21:00 onwards
  peakHours: [11, 12, 17, 18],
  peakExtraMinutes: 9,
  spreadMinutes: 6,
  cancel: { base: 0.02, peak: 0.035, far: 0.02 }, // far = the 北区 dorms
  reasons: {
    peak: [['等待太久', 0.55], ['点错了', 0.2], ['商家缺货', 0.15], ['临时有事', 0.1]],
    calm: [['等待太久', 0.25], ['点错了', 0.3], ['商家缺货', 0.2], ['临时有事', 0.25]],
  },
  // [name, popularity weight, three set-meal prices in cents]
  merchants: [
    ['南门小厨', 26, [1600, 1800, 2200]], ['二食堂面馆', 20, [1200, 1400, 1600]], ['麻辣香锅', 15, [2400, 2800, 3200]],
    ['黄焖鸡米饭', 11, [1800, 2000, 2200]], ['川味小馆', 8, [1600, 2000, 2400]], ['粤式烧腊', 6, [2000, 2400, 2600]],
    ['韩式拌饭', 4, [1800, 2200, 2600]], ['轻食窗口', 3, [1400, 2000, 2200]], ['西北面食', 2.5, [1400, 1600, 1800]],
    ['煎饼果子', 2, [800, 1000, 1200]], ['校园茶点', 1.5, [600, 800, 1200]], ['夜宵烧烤', 1, [2000, 3000, 4000]],
  ],
  nightMerchant: 11, // 夜宵烧烤, much more popular from 21:00
  nightBoost: 12,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds the term through the course project's schema, constraints and triggers. Returns the open database and its bytes. */
export function generate(SQL, schema, P = PARAMS) {
  const r = mulberry32(P.seed);
  const pick = weights => {
    let s = weights.reduce((a, w) => a + w, 0) * r();
    for (let i = 0; i < weights.length; i++) { s -= weights[i]; if (s < 0) return i; }
    return weights.length - 1;
  };
  const poisson = lambda => { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const start = Date.parse(`${P.termStart}T00:00:00Z`);
  const stamp = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

  const db = new SQL.Database();
  db.run(schema);
  db.run('BEGIN');
  P.merchants.forEach(([name], i) => db.run('INSERT INTO merchants VALUES(?,?)', [i + 1, name]));
  P.merchants.forEach(([name, , prices], i) => prices.forEach((price, j) =>
    db.run('INSERT INTO dishes VALUES(?,?,?,?,?)', [i * 3 + j + 1, i + 1, `${name} 套餐 ${'ABC'[j]}`, price, 1000000])));

  const students = [];
  for (let id = 1; id <= P.students; id++) {
    const area = pick(P.areas.map(a => a[2]));
    const fresh = r() < P.freshmanShare;
    const join = fresh ? 1 + Math.floor(r() * 2) : 3 + Math.floor(r() * 10);
    const appetite = P.appetite[pick(P.appetite.map(a => a[1]))][0];
    students.push({ id, area, fresh, join, appetite });
    db.run('INSERT INTO students VALUES(?,?,?)', [id, `同学 ${String(id).padStart(3, '0')}`, `${P.areas[area][0]}${1 + Math.floor(r() * 6)}栋`]);
  }

  const hours = Object.keys(P.hourWeights).map(Number);
  const orders = [];
  for (const st of students) {
    const [floor, span, halfLife] = st.fresh ? P.retention.fresh : P.retention.later;
    for (let week = st.join; week <= P.weeks; week++) {
      const k = week - st.join;
      let n = poisson(st.appetite * (floor + span * Math.exp(-k / halfLife)));
      if (k === 0 && n === 0) n = 1; // joining means ordering in that week
      for (let i = 0; i < n; i++) {
        const dow = pick(P.dayWeights);
        const late = dow === 4 || dow === 5;
        const hour = hours[pick(hours.map(h => P.hourWeights[h] * (late && h >= 21 ? P.lateBoost : 1)))];
        const at = start + (((week - 1) * 7 + dow) * 24 + hour) * 3600000 + Math.floor(r() * 60) * 60000;
        const m = pick(P.merchants.map((x, j) => x[1] * (hour >= 21 && j === P.nightMerchant ? P.nightBoost : 1)));
        const lines = [];
        const kinds = 1 + (r() < 0.3 ? 1 : 0);
        for (let j = 0; j < kinds; j++) {
          const dish = m * 3 + Math.floor(r() * 3) + 1;
          if (!lines.some(l => l[0] === dish)) lines.push([dish, 1 + (r() < 0.2 ? 1 : 0), P.merchants[m][2][dish - m * 3 - 1]]);
        }
        const peak = P.peakHours.includes(hour);
        const cancel = r() < P.cancel.base + (peak ? P.cancel.peak : 0) + (st.area === 3 ? P.cancel.far : 0);
        const reasons = peak ? P.reasons.peak : P.reasons.calm;
        orders.push({
          at, student: st.id, m, lines, cancel,
          reason: reasons[pick(reasons.map(x => x[1]))][0],
          after: 5 + Math.floor(r() * 21),
          minutes: Math.max(8, Math.round(P.areas[st.area][1] + (peak ? P.peakExtraMinutes : 0) + normal() * P.spreadMinutes)),
          rider: `骑手 ${String(1 + Math.floor(r() * 12)).padStart(2, '0')}`,
        });
      }
    }
  }

  // Ids follow time, like a real system.
  orders.sort((a, b) => a.at - b.at || a.student - b.student);
  orders.forEach((o, i) => {
    const id = i + 1;
    const total = o.lines.reduce((s, [, q, p]) => s + q * p, 0);
    db.run('INSERT INTO orders VALUES(?,?,?,?,?,?)', [id, o.student, o.m + 1, 'paid', stamp(o.at), total]);
    for (const [dish, q, p] of o.lines) db.run('INSERT INTO order_items VALUES(?,?,?,?,?)', [id, dish, o.m + 1, q, p]);
    db.run('INSERT INTO payments(order_id,amount_cents,paid_at) VALUES(?,?,?)', [id, total, stamp(o.at)]);
    db.run('INSERT INTO deliveries(order_id,rider) VALUES(?,?)', [id, o.rider]);
    if (o.cancel) {
      db.run('INSERT INTO refunds(order_id,amount_cents,reason,refunded_at) VALUES(?,?,?,?)', [id, total, o.reason, stamp(o.at + o.after * 60000)]);
    } else {
      db.run("UPDATE orders SET status='delivered' WHERE id=?", [id]);
      db.run('UPDATE deliveries SET delivered_at=? WHERE order_id=?', [stamp(o.at + o.minutes * 60000), id]);
    }
  });
  db.run('COMMIT');
  db.run('VACUUM');
  return { db, bytes: db.export() };
}
```

- [ ] **Step 2: 写查询模块**

`src/scripts/insights-queries.mjs`（写计划时已实测：全部 8 条在全学期参数下共约 60 ms，带筛选的 5 条约 10 ms）：

```js
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
```

- [ ] **Step 3: 写失败的测试**

`tests/unit/insights-data.test.ts`：

```ts
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
```

- [ ] **Step 4: 运行，确认失败**

Run: `npx vitest run tests/unit/insights-data.test.ts`
Expected: FAIL，报 `ENOENT ... public/assets/insights/campus-term.sqlite`（生成物还不存在）。

- [ ] **Step 5: 写命令行并生成**

`tools/gen-insights.mjs`：

```js
// Regenerates the insights data: npm run insights:gen (run from the repository root).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { loadSqlJs } from './sqljs-node.mjs';
import { generate } from './insights-gen.mjs';
import { QUERIES, ALL, runQueries } from '../src/scripts/insights-queries.mjs';

const SQL = await loadSqlJs();
const { db, bytes } = generate(SQL, readFileSync('public/assets/delivery-schema.sql', 'utf8'));
const results = runQueries(db, Object.keys(QUERIES), ALL);
db.close();

mkdirSync('public/assets/insights', { recursive: true });
mkdirSync('public/downloads/insights', { recursive: true });
writeFileSync('public/assets/insights/campus-term.sqlite', bytes);
writeFileSync('src/data/insights.json', JSON.stringify({ results }) + '\n');
copyFileSync('tools/insights-gen.mjs', 'public/downloads/insights/insights-gen.mjs');
copyFileSync('src/scripts/insights-queries.mjs', 'public/downloads/insights/insights-queries.mjs');
console.log(`orders ${results.kpi.values[0][0]} · ${bytes.length} bytes`);
```

`package.json` 的 `scripts` 里加一行（放在 `"resume:en"` 之后）：

```json
    "insights:gen": "node tools/gen-insights.mjs"
```

Run: `npm run insights:gen`
Expected: 输出 `orders 5142 · 1302528 bytes`。若数字不同，说明脚本与计划不一致：先对照 Step 1 的代码逐字检查；确认无误仍不同，记 Ruling 并继续（测试只要求 > 4000 笔、≤ 1.5 MB）。

- [ ] **Step 6: 运行，确认通过**

Run: `npx vitest run tests/unit/insights-data.test.ts`
Expected: PASS（7 个测试）。

- [ ] **Step 7: 提交**

```bash
git add tools/sqljs-node.mjs tools/insights-gen.mjs tools/gen-insights.mjs src/scripts/insights-queries.mjs public/assets/insights/campus-term.sqlite src/data/insights.json public/downloads/insights package.json tests/unit/insights-data.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights data: deterministic synthetic term through the course schema, shared SQL, committed results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 数字推导与文案

**Files:**
- Create: `src/scripts/insights-names.ts`, `src/scripts/insights-facts.ts`, `src/data/insights-copy.ts`
- Test: `tests/unit/insights-facts.test.ts`

**Interfaces:**
- Consumes: `src/data/insights.json`（Task 1）的列顺序。
- Produces:
  - `insights-names.ts`: `MERCHANT_EN`, `AREA_EN`, `AREA_LABEL_EN`, `REASON_EN`（`Record<string,string>`）；`merchantName(zh, lang)`, `areaName(zh, lang, short = false)`, `reasonName(zh, lang)`；`merchantLegend(values, lang): string[]`（前三名）；`reasonLegend(values, lang): string[]`
  - `insights-facts.ts`: `type Rows`, `interface QueryResult`, `type QueryId`, `type Results`, `type Kind`, `interface Fact { value: number | string; kind: Kind }`, `DEF`, `deriveFacts(r: Results): Record<string, Fact>`, `formatFact(f: Fact, lang: Lang): string`
  - `insights-copy.ts`: `INSIGHTS_COPY`，结构 `{ hero: { big: Bi; sub: Bi }, storyTitle: Bi, chapters: Chapter[6], tables: Record<string, Bi> }`，`interface Chapter { q: Bi; a: Bi; note?: Bi; recs?: Bi[] }`；模板中的 `{key}` 必须是 `deriveFacts` 返回的键。

- [ ] **Step 1: 写失败的测试**

`tests/unit/insights-facts.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveFacts, formatFact, type Results } from '../../src/scripts/insights-facts';
import { INSIGHTS_COPY } from '../../src/data/insights-copy';
import { merchantLegend, reasonLegend, areaName } from '../../src/scripts/insights-names';

// A tiny hand-checkable result set.
const FIXTURE: Results = {
  kpi: { columns: [], values: [[200, 500000, 2600, 5, 25.3]] },
  heatmap: { columns: [], values: [[0, 11, 40], [0, 12, 20], [5, 12, 50], [2, 17, 30], [3, 20, 60]] },
  merchants: { columns: [], values: [[1, '南门小厨', 80, 300000], [2, '二食堂面馆', 60, 100000], [3, '麻辣香锅', 40, 60000], [4, '黄焖鸡米饭', 20, 40000]] },
  retention: { columns: [], values: [[1, 0, 10, 10], [1, 4, 10, 6], [2, 4, 10, 4], [3, 0, 5, 5], [3, 4, 5, 1], [5, 4, 5, 2]] },
  delivery: { columns: [], values: [] },
  slow: { columns: [], values: [['东区', 100, 2, 20], ['西区', 50, 1, 24.5], ['北区', 50, 10, 35.5]] },
  reasons: { columns: [], values: [['等待太久', 6], ['点错了', 3], ['临时有事', 1]] },
  cancelByHour: { columns: [], values: [[11, 50, 4], [12, 50, 4], [17, 20, 2], [19, 80, 2]] },
};

describe('deriveFacts + formatFact', () => {
  const f = deriveFacts(FIXTURE);
  const zh = (k: string) => formatFact(f[k], 'zh');
  const en = (k: string) => formatFact(f[k], 'en');

  it('counts and shares', () => {
    expect([zh('orders'), zh('students'), zh('merchants'), zh('weeks')]).toEqual(['200', '30', '4', '9']);
    expect([zh('lunchShare'), zh('dinnerShare'), zh('peakShare')]).toEqual(['55%', '15%', '70%']);
    expect([zh('lunchStart'), zh('lunchEnd'), zh('dinnerStart'), zh('dinnerEnd')]).toEqual(['11:00', '13:00', '17:00', '19:00']);
    expect([zh('busiestDow'), en('busiestDow'), zh('busiestHour'), zh('busiestCount')]).toEqual(['周四', 'Thursday', '20:00', '60']);
    expect([zh('top3Share'), zh('merchantsFor80'), zh('paretoLine')]).toEqual(['92%', '2', '80%']);
  });

  it('retention compares the first two weeks with later cohorts', () => {
    expect([zh('freshRetention'), zh('laterRetention'), zh('retentionGap')]).toEqual(['50%', '30%', '20']);
  });

  it('delivery speed by dorm area', () => {
    expect([zh('farArea'), en('farArea'), zh('nearArea')]).toEqual(['北区', 'North dorms', '东区']);
    expect([zh('farMinutes'), en('farMinutes'), zh('nearMinutes'), zh('gapMinutes'), zh('slowLine')]).toEqual(['35.5 分钟', '35.5 min', '20 分钟', '15.5 分钟', '45 分钟']);
    expect([zh('farOver45'), zh('restOver45')]).toEqual(['20%', '2.0%']);
  });

  it('refunds and cancellations', () => {
    expect([zh('refundPct'), zh('topReason'), en('topReason'), zh('topReasonShare')]).toEqual(['5.0%', '等待太久', 'Waited too long', '60%']);
    expect([zh('peakCancel'), zh('calmCancel'), zh('cancelRatio')]).toEqual(['8.3%', '2.5%', '3.3']);
  });

  it('legends', () => {
    expect(merchantLegend(FIXTURE.merchants.values, 'zh')).toEqual(['南门小厨 ¥3,000', '二食堂面馆 ¥1,000', '麻辣香锅 ¥600']);
    expect(merchantLegend(FIXTURE.merchants.values, 'en')[0]).toBe('South Gate Kitchen ¥3,000');
    expect(reasonLegend(FIXTURE.reasons.values, 'en')).toEqual(['■ Waited too long 6', '■ Ordered by mistake 3', '■ Something came up 1']);
    expect(areaName('北区', 'en', true)).toBe('North');
  });
});

describe('insights copy', () => {
  const real = deriveFacts(JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results);
  const templates: { zh: string; en: string }[] = [
    INSIGHTS_COPY.hero.big, INSIGHTS_COPY.hero.sub,
    ...INSIGHTS_COPY.chapters.flatMap(c => [c.q, c.a, ...(c.note ? [c.note] : []), ...(c.recs ?? [])]),
  ];
  const keys = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]))].sort();

  it('has six chapters, the last with three suggestions', () => {
    expect(INSIGHTS_COPY.chapters).toHaveLength(6);
    expect(INSIGHTS_COPY.chapters[5].recs).toHaveLength(3);
  });

  it('never hand-types a number: every digit comes from a placeholder', () => {
    for (const t of templates) for (const s of [t.zh, t.en]) expect(s.replace(/\{\w+\}/g, ''), s).not.toMatch(/\d/);
  });

  it('every placeholder is a derived fact, and both languages use the same ones', () => {
    for (const t of templates) {
      for (const k of keys(t.zh)) expect(real, k).toHaveProperty(k);
      expect(keys(t.en), t.zh).toEqual(keys(t.zh));
    }
  });

  it('the real data tells the story the copy claims', () => {
    const v = (k: string) => Number(real[k].value);
    expect(v('peakCancel')).toBeGreaterThan(v('calmCancel'));
    expect(v('freshRetention')).toBeGreaterThan(v('laterRetention'));
    expect(v('farMinutes')).toBeGreaterThan(v('nearMinutes'));
    expect(v('top3Share')).toBeGreaterThan(50);
    expect(real.topReason.value).toBe('等待太久'); // chapter 6 suggestion 2 relies on it
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/insights-facts.test.ts`
Expected: FAIL，`Failed to resolve import "../../src/scripts/insights-facts"`。

- [ ] **Step 3: 写名称表**

`src/scripts/insights-names.ts`：

```ts
import type { Lang } from '../i18n';

type Rows = (number | string)[][];

export const MERCHANT_EN: Record<string, string> = {
  南门小厨: 'South Gate Kitchen', 二食堂面馆: 'Canteen Two Noodles', 麻辣香锅: 'Mala Stir-pot', 黄焖鸡米饭: 'Braised Chicken Rice',
  川味小馆: 'Sichuan Corner', 粤式烧腊: 'Cantonese Roast', 韩式拌饭: 'Bibimbap Bar', 轻食窗口: 'Light Bites',
  西北面食: 'Northwest Noodles', 煎饼果子: 'Jianbing Stall', 校园茶点: 'Campus Tea', 夜宵烧烤: 'Late-night BBQ',
};
export const AREA_EN: Record<string, string> = { 东区: 'East dorms', 西区: 'West dorms', 南区: 'South dorms', 北区: 'North dorms' };
export const AREA_LABEL_EN: Record<string, string> = { 东区: 'East', 西区: 'West', 南区: 'South', 北区: 'North' };
export const REASON_EN: Record<string, string> = { 等待太久: 'Waited too long', 点错了: 'Ordered by mistake', 商家缺货: 'Out of stock', 临时有事: 'Something came up' };

export const merchantName = (zh: string, lang: Lang) => (lang === 'zh' ? zh : MERCHANT_EN[zh] ?? zh);
export const areaName = (zh: string, lang: Lang, short = false) => (lang === 'zh' ? zh : (short ? AREA_LABEL_EN : AREA_EN)[zh] ?? zh);
export const reasonName = (zh: string, lang: Lang) => (lang === 'zh' ? zh : REASON_EN[zh] ?? zh);

const yuan = (cents: number) => `¥${Math.round(cents / 100).toLocaleString('en-US')}`;

/** The three merchants with the most net revenue (rows already sorted), for the chart legend. */
export function merchantLegend(values: Rows, lang: Lang): string[] {
  return values.slice(0, 3).map(r => `${merchantName(String(r[1]), lang)} ${yuan(Number(r[3]))}`);
}

/** One legend line per refund reason; the square is coloured by the chart. */
export function reasonLegend(values: Rows, lang: Lang): string[] {
  return values.map(r => `■ ${reasonName(String(r[0]), lang)} ${r[1]}`);
}
```

- [ ] **Step 4: 写数字推导**

`src/scripts/insights-facts.ts`：

```ts
import type { Lang } from '../i18n';
import { areaName, reasonName } from './insights-names';

export type Rows = (number | string)[][];
export interface QueryResult { columns: string[]; values: Rows }
export type QueryId = 'kpi' | 'heatmap' | 'merchants' | 'retention' | 'delivery' | 'slow' | 'reasons' | 'cancelByHour';
export type Results = Record<QueryId, QueryResult>;
export type Kind = 'int' | 'pct' | 'pp' | 'min' | 'hour' | 'dow' | 'times' | 'area' | 'reason';
export interface Fact { value: number | string; kind: Kind }

/** Definitions behind the story's sentences; the copy names them in words ("the first two weeks", "four weeks later"). */
export const DEF = { lunch: [11, 12], dinner: [17, 18], freshWeeks: 2, retainAfter: 4, lastCohort: 12, slowLine: 45, paretoLine: 80 } as const;

const num = (v: unknown) => Number(v);
const sum = (rows: Rows, col: number) => rows.reduce((s, r) => s + num(r[col]), 0);
const share = (a: number, b: number) => (b ? (a / b) * 100 : 0);

/** Every number the story prints, derived from the committed query results. */
export function deriveFacts(r: Results): Record<string, Fact> {
  const f = (value: number | string, kind: Kind): Fact => ({ value, kind });
  const [orders, , , refundPct] = r.kpi.values[0].map(num);
  const inHours = (hs: readonly number[]) => r.heatmap.values.filter(x => hs.includes(num(x[1]))).reduce((s, x) => s + num(x[2]), 0);
  const busiest = r.heatmap.values.reduce((a, b) => (num(b[2]) > num(a[2]) ? b : a), r.heatmap.values[0] ?? [0, 0, 0]);

  const m = r.merchants.values;
  const net = sum(m, 3);
  let acc = 0, for80 = 0;
  for (const x of m) { acc += num(x[3]); for80++; if (share(acc, net) >= DEF.paretoLine) break; }

  const sizes = new Map<number, number>();
  r.retention.values.forEach(x => sizes.set(num(x[0]), num(x[2])));
  const retained = (lo: number, hi: number) => {
    const cohorts = [...sizes.keys()].filter(c => c >= lo && c <= hi);
    const kept = r.retention.values.filter(x => num(x[1]) === DEF.retainAfter && cohorts.includes(num(x[0]))).reduce((s, x) => s + num(x[3]), 0);
    return share(kept, cohorts.reduce((s, c) => s + (sizes.get(c) ?? 0), 0));
  };
  const fresh = retained(1, DEF.freshWeeks);
  const later = retained(DEF.freshWeeks + 1, DEF.lastCohort);

  const slow = [...r.slow.values].sort((a, b) => num(a[3]) - num(b[3]));
  const near = slow[0] ?? ['', 0, 0, 0];
  const far = slow[slow.length - 1] ?? ['', 0, 0, 0];
  const rest = slow.slice(0, -1);

  const peakHours: number[] = [...DEF.lunch, ...DEF.dinner];
  const cb = r.cancelByHour.values;
  const pk = cb.filter(x => peakHours.includes(num(x[0])));
  const peakCancel = share(sum(pk, 2), sum(pk, 1));
  const calmCancel = share(sum(cb, 2) - sum(pk, 2), sum(cb, 1) - sum(pk, 1));

  const reasons = r.reasons.values;
  const lunchShare = share(inHours(DEF.lunch), orders);
  const dinnerShare = share(inHours(DEF.dinner), orders);

  return {
    orders: f(orders, 'int'),
    students: f([...sizes.values()].reduce((a, b) => a + b, 0), 'int'),
    merchants: f(m.length, 'int'),
    weeks: f(Math.max(0, ...r.retention.values.map(x => num(x[0]) + num(x[1]))), 'int'),
    lunchStart: f(DEF.lunch[0], 'hour'),
    lunchEnd: f(DEF.lunch[DEF.lunch.length - 1] + 1, 'hour'),
    dinnerStart: f(DEF.dinner[0], 'hour'),
    dinnerEnd: f(DEF.dinner[DEF.dinner.length - 1] + 1, 'hour'),
    lunchShare: f(lunchShare, 'pct'),
    dinnerShare: f(dinnerShare, 'pct'),
    peakShare: f(lunchShare + dinnerShare, 'pct'),
    busiestDow: f(num(busiest[0]), 'dow'),
    busiestHour: f(num(busiest[1]), 'hour'),
    busiestCount: f(num(busiest[2]), 'int'),
    top3Share: f(share(m.slice(0, 3).reduce((s, x) => s + num(x[3]), 0), net), 'pct'),
    merchantsFor80: f(for80, 'int'),
    paretoLine: f(DEF.paretoLine, 'pct'),
    freshRetention: f(fresh, 'pct'),
    laterRetention: f(later, 'pct'),
    retentionGap: f(fresh - later, 'pp'),
    farArea: f(String(far[0]), 'area'),
    nearArea: f(String(near[0]), 'area'),
    farMinutes: f(num(far[3]), 'min'),
    nearMinutes: f(num(near[3]), 'min'),
    gapMinutes: f(Math.round((num(far[3]) - num(near[3])) * 10) / 10, 'min'),
    slowLine: f(DEF.slowLine, 'min'),
    farOver45: f(share(num(far[2]), num(far[1])), 'pct'),
    restOver45: f(share(sum(rest, 2), sum(rest, 1)), 'pct'),
    refundPct: f(refundPct, 'pct'),
    topReason: f(String(reasons[0]?.[0] ?? ''), 'reason'),
    topReasonShare: f(share(num(reasons[0]?.[1] ?? 0), sum(reasons, 1)), 'pct'),
    peakCancel: f(peakCancel, 'pct'),
    calmCancel: f(calmCancel, 'pct'),
    cancelRatio: f(calmCancel ? peakCancel / calmCancel : 0, 'times'),
  };
}

const DOW = {
  zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

export function formatFact(f: Fact, lang: Lang): string {
  const n = Number(f.value);
  switch (f.kind) {
    case 'int': return Math.round(n).toLocaleString('en-US');
    case 'pct': return `${n >= 10 ? Math.round(n) : n.toFixed(1)}%`;
    case 'pp': return String(Math.round(n));
    case 'min': { const s = Number.isInteger(n) ? String(n) : n.toFixed(1); return lang === 'zh' ? `${s} 分钟` : `${s} min`; }
    case 'hour': return `${String(n).padStart(2, '0')}:00`;
    case 'dow': return DOW[lang][n];
    case 'times': return n.toFixed(1);
    case 'area': return areaName(String(f.value), lang);
    case 'reason': return reasonName(String(f.value), lang);
  }
}
```

- [ ] **Step 5: 写文案**

`src/data/insights-copy.ts`（中文逐字使用；第 6 章建议和全部英文交付时列入"待用户审阅"）：

```ts
import type { Bi } from '../i18n';

export interface Chapter { q: Bi; a: Bi; note?: Bi; recs?: Bi[] }

/** Copy for the insights page. {key} placeholders are filled from deriveFacts(); no number is ever typed here. */
export const INSIGHTS_COPY = {
  hero: {
    big: { zh: '{orders} 笔订单', en: '{orders} orders' },
    sub: {
      zh: '一个学期 · {weeks} 周 · {students} 名同学 · {merchants} 家商家 · 合成数据',
      en: 'One term · {weeks} weeks · {students} students · {merchants} merchants · synthetic data',
    },
  },
  storyTitle: { zh: '五个经营问题', en: 'Five business questions' },
  chapters: [
    {
      q: { zh: '什么时候最忙？', en: 'When is it busiest?' },
      a: {
        zh: '午餐 {lunchStart}–{lunchEnd} 贡献了 {lunchShare} 的订单，晚餐 {dinnerStart}–{dinnerEnd} 再占 {dinnerShare}。最忙的一格是{busiestDow} {busiestHour}，整个学期累计 {busiestCount} 单。',
        en: 'Lunch, {lunchStart}–{lunchEnd}, brings in {lunchShare} of orders; dinner, {dinnerStart}–{dinnerEnd}, another {dinnerShare}. The busiest cell is {busiestDow} at {busiestHour}: {busiestCount} orders over the term.',
      },
      note: { zh: '口径：订单数按下单时间统计，含已退款订单。', en: 'Definition: orders counted by order time, refunded orders included.' },
    },
    {
      q: { zh: '钱从哪里来？', en: 'Where does the money come from?' },
      a: {
        zh: '{merchants} 家商家里，前三家拿走了 {top3Share} 的净收款；累计到 {paretoLine} 只需要 {merchantsFor80} 家。',
        en: 'Of {merchants} merchants, the top three take {top3Share} of net revenue; {merchantsFor80} are enough to reach {paretoLine}.',
      },
      note: {
        zh: '口径：净收款 = 支付 − 退款；按订单粒度连接支付与退款，避免一对多连接让金额翻倍。',
        en: 'Definition: net revenue = payments − refunds, joined per order so a one-to-many join cannot double the amounts.',
      },
    },
    {
      q: { zh: '学生会回来吗？', en: 'Do students come back?' },
      a: {
        zh: '开学头两周第一次下单的同学，四周后仍有 {freshRetention} 在下单；之后才加入的同学只有 {laterRetention}，相差 {retentionGap} 个百分点。',
        en: 'Of students whose first order came in the first two weeks, {freshRetention} are still ordering four weeks later; for later joiners it is {laterRetention} — a gap of {retentionGap} points.',
      },
      note: {
        zh: '口径：首次下单所在周为一组；之后某周有至少一笔未退款订单，即算该周留存。',
        en: "Definition: a cohort is the week of a student's first order; a student counts as retained in any week with at least one order that was not refunded.",
      },
    },
    {
      q: { zh: '送得够快吗？', en: 'Is delivery fast enough?' },
      a: {
        zh: '{farArea}平均 {farMinutes}送达，比{nearArea}慢 {gapMinutes}；{farArea}有 {farOver45} 的订单超过 {slowLine}，其他宿舍区合计只有 {restOver45}。',
        en: '{farArea}: {farMinutes} on average, {gapMinutes} slower than the {nearArea}. {farOver45} of its orders take over {slowLine}; everywhere else, {restOver45}.',
      },
      note: { zh: '口径：时长 = 送达时间 − 下单时间，只计已送达订单。', en: 'Definition: time = delivered − ordered, delivered orders only.' },
    },
    {
      q: { zh: '为什么退款？', en: 'Why do orders get refunded?' },
      a: {
        zh: '整体退款率 {refundPct}，第一大原因是"{topReason}"，占 {topReasonShare}。高峰时段的取消率是 {peakCancel}，是平时（{calmCancel}）的 {cancelRatio} 倍。',
        en: 'The refund rate is {refundPct}; the top reason, "{topReason}", accounts for {topReasonShare}. At peak hours {peakCancel} of orders are cancelled — {cancelRatio} times the off-peak {calmCancel}.',
      },
      note: {
        zh: '口径：退款率 = 退款订单 ÷ 全部订单；按课程设计的规则，只有未送达的订单可以退款。',
        en: "Definition: refund rate = refunded orders ÷ all orders; under the course project's rules only undelivered orders can be refunded.",
      },
    },
    {
      q: { zh: '如果我是运营', en: 'If I ran operations' },
      a: { zh: '以下是根据前五章提出的建议，是判断，不是数据结论。', en: 'Suggestions drawn from the five chapters — judgments, not findings.' },
      recs: [
        {
          zh: '高峰前备货、排班：午餐和晚餐这四个小时贡献了 {peakShare} 的订单，出餐和骑手都应向这四个小时倾斜。',
          en: 'Stock and staff for the peaks: the four lunch and dinner hours bring in {peakShare} of orders, so kitchens and riders should lean into them.',
        },
        {
          zh: '给{farArea}加派骑手或设自提点：平均 {farMinutes}送达，{farOver45} 的订单超过 {slowLine}，而"{topReason}"正是退款的第一原因。',
          en: 'Add riders or a pickup point for the {farArea}: {farMinutes} on average and {farOver45} of orders over {slowLine} — and "{topReason}" is the top refund reason.',
        },
        {
          zh: '把新生券集中在开学头两周：这段时间加入的同学，四周后的留存高出 {retentionGap} 个百分点。',
          en: 'Spend new-student coupons in the first two weeks: students who join then are {retentionGap} points more likely to still be ordering four weeks on.',
        },
      ],
    },
  ] as Chapter[],
  tables: {
    view: { zh: '查看数据', en: 'Show the data' },
    day: { zh: '星期', en: 'Day' },
    merchant: { zh: '商家', en: 'Merchant' },
    orders: { zh: '订单', en: 'Orders' },
    net: { zh: '净收款', en: 'Net revenue' },
    cohort: { zh: '首单周', en: 'First-order week' },
    area: { zh: '宿舍区', en: 'Dorm area' },
    delivered: { zh: '已送达', en: 'Delivered' },
    avg: { zh: '平均分钟', en: 'Avg minutes' },
    over45: { zh: '超过 45 分钟', en: 'Over 45 min' },
    reason: { zh: '原因', en: 'Reason' },
    refunds: { zh: '退款单', en: 'Refunds' },
  },
};
```

- [ ] **Step 6: 运行，确认通过**

Run: `npx vitest run tests/unit/insights-facts.test.ts`
Expected: PASS（9 个测试）。

- [ ] **Step 7: 提交**

```bash
git add src/scripts/insights-names.ts src/scripts/insights-facts.ts src/data/insights-copy.ts tests/unit/insights-facts.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights facts and copy: every printed number derives from query results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 图形几何与数字滚动（纯函数）

**Files:**
- Create: `src/scripts/morph.ts`, `src/scripts/countup.ts`
- Test: `tests/unit/morph.test.ts`, `tests/unit/countup.test.ts`

**Interfaces:**
- Consumes: Task 1 的列顺序。
- Produces:
  - `morph.ts`: `interface Mark { x; y; w; h; a: number; red: 0 | 1 }`, `type Key = number | string | null`, `interface Layout { marks: Mark[]; keys: Key[] }`, `type Rows`, `MARKS = 168`, `VIEW = { w: 480, h: 320 }`, `PLOT = { x: 48, y: 8, w: 424, h: 276 }`, `AREAS`, `heatmap(rows)`, `pareto(rows)`, `retention(rows)`, `delivery(rows)`, `waffle(rows)`, `blocks()`（都返回 `Layout`）, `largestRemainder(counts, total)`, `interpolate(a, b, t)`, `chapterProgress(tops, line)`, `frameAt(layouts: Mark[][], p)`, `storyLayouts(r)`（6 个布局，依次为热力图、帕累托、留存、送达、退款华夫格、三块建议）
  - `countup.ts`: `countText(final: string, k: number): string`

- [ ] **Step 1: 写失败的测试**

`tests/unit/morph.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { storyLayouts, pareto, delivery, heatmap, largestRemainder, interpolate, chapterProgress, frameAt, PLOT, MARKS, type Mark } from '../../src/scripts/morph';

const R = JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results;
const finite = (m: Mark) => [m.x, m.y, m.w, m.h, m.a].every(Number.isFinite);

describe('layouts', () => {
  it('every story layout fills the pool of 168 finite marks', () => {
    const ls = storyLayouts(R);
    expect(ls).toHaveLength(6);
    for (const l of ls) {
      expect(l.marks).toHaveLength(MARKS);
      expect(l.keys).toHaveLength(MARKS);
      expect(l.marks.every(finite)).toBe(true);
    }
  });

  it('empty results still give 168 finite marks', () => {
    const E = { heatmap: { values: [] }, merchants: { values: [] }, retention: { values: [] }, delivery: { values: [] }, reasons: { values: [] } };
    for (const l of storyLayouts(E)) { expect(l.marks).toHaveLength(MARKS); expect(l.marks.every(finite)).toBe(true); }
  });

  it('heatmap: the busiest hour is fully opaque', () => {
    const l = heatmap([[0, 11, 5], [5, 12, 10]]);
    expect(l.marks[5 * 24 + 12].a).toBeCloseTo(1);
    expect(l.marks[0].a).toBeLessThan(0.1);
  });

  it('pareto: the top merchant fills the plot height, the top three are red, bars carry merchant ids', () => {
    const l = pareto(R.merchants.values);
    expect(l.marks.slice(0, 14).reduce((s, m) => s + m.h, 0)).toBeCloseTo(PLOT.h);
    expect(l.marks[0].red).toBe(1);
    expect(l.marks[3 * 14].red).toBe(0);
    expect(l.keys[0]).toBe(R.merchants.values[0][0]);
  });

  it('delivery: bars from 45 minutes are red and carry their dorm area; surplus marks share a real key', () => {
    const l = delivery([['东区', 20, 5], ['北区', 45, 3]]);
    expect(l.marks[0].red).toBe(0);
    expect(l.marks[1].red).toBe(1);
    expect(l.keys.slice(0, 2)).toEqual(['东区', '北区']);
    expect(l.marks[2].a).toBe(0);
    expect(l.keys[2]).toBe('东区');
  });

  it('largestRemainder shares a total in proportion', () => {
    expect(largestRemainder([1, 1, 1], 168)).toEqual([56, 56, 56]);
    expect(largestRemainder([1, 1], 3)).toEqual([2, 1]);
    expect(largestRemainder([0, 0], 168)).toEqual([0, 0]);
    expect(largestRemainder([122, 44, 35, 34], 168).reduce((a, b) => a + b, 0)).toBe(168);
  });
});

describe('motion', () => {
  const a: Mark[] = [{ x: 0, y: 0, w: 10, h: 10, a: 0, red: 0 }];
  const b: Mark[] = [{ x: 100, y: 50, w: 20, h: 30, a: 1, red: 1 }];

  it('interpolate: ends match, midpoint is halfway, colour switches at half', () => {
    expect(interpolate(a, b, 0)).toEqual(a);
    expect(interpolate(a, b, 1)).toEqual(b);
    expect(interpolate(a, b, 0.5)[0]).toEqual({ x: 50, y: 25, w: 15, h: 20, a: 0.5, red: 1 });
    expect(interpolate(a, b, 0.49)[0].red).toBe(0);
  });

  it('chapterProgress holds each chart, then morphs over the last 40% of a chapter', () => {
    const tops = [0, 1000, 2000];
    expect(chapterProgress(tops, -50)).toBe(0);
    expect(chapterProgress(tops, 500)).toBe(0);
    expect(chapterProgress(tops, 800)).toBeCloseTo(0.5);
    expect(chapterProgress(tops, 1000)).toBe(1);
    expect(chapterProgress(tops, 2600)).toBe(2);
    let last = -1;
    for (let line = -100; line <= 2600; line += 10) {
      const p = chapterProgress(tops, line);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });

  it('frameAt: whole numbers are exact layouts, fractions interpolate', () => {
    expect(frameAt([a, b], 0)).toBe(a);
    expect(frameAt([a, b], 1)).toBe(b);
    expect(frameAt([a, b], 0.5)).toEqual(interpolate(a, b, 0.5));
  });
});
```

`tests/unit/countup.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { countText } from '../../src/scripts/countup';

describe('countText', () => {
  it('scales the number and keeps its format', () => {
    expect(countText('5,142', 0.5)).toBe('2,571');
    expect(countText('36.8 分钟', 0.5)).toBe('18.4 分钟');
    expect(countText('4.6%', 0)).toBe('0.0%');
    expect(countText('¥1,234', 0.5)).toBe('¥617');
  });
  it('ends exactly on the final text', () => {
    for (const s of ['5,142', '36.8 分钟', '46%', '北区']) expect(countText(s, 1)).toBe(s);
  });
  it('leaves clock times and words alone', () => {
    expect(countText('20:00', 0.3)).toBe('20:00');
    expect(countText('North dorms', 0.3)).toBe('North dorms');
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/morph.test.ts tests/unit/countup.test.ts`
Expected: FAIL，找不到 `../../src/scripts/morph` 与 `../../src/scripts/countup`。

- [ ] **Step 3: 实现 `morph.ts`**

```ts
/** Geometry for the insights charts: one pool of 168 rectangles is re-laid out per chart, so any chart can morph into the next. Pure; no DOM. */
export interface Mark { x: number; y: number; w: number; h: number; a: number; red: 0 | 1 }
export type Key = number | string | null;
export interface Layout { marks: Mark[]; keys: Key[] }
export type Rows = (number | string)[][];

export const MARKS = 168;
export const VIEW = { w: 480, h: 320 };
export const PLOT = { x: 48, y: 8, w: 424, h: 276 };
export const AREAS = ['东区', '西区', '南区', '北区'];
const INK_STEPS = [0.85, 0.55, 0.3];
const NO_KEYS = (): Key[] => Array(MARKS).fill(null);

/** Fills the pool: surplus rectangles sit invisibly on real ones (same key), so a morph looks like marks merging. */
function pad(marks: Mark[], keys: Key[]): Layout {
  if (!marks.length) {
    const c: Mark = { x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h, w: 0, h: 0, a: 0, red: 0 };
    return { marks: Array.from({ length: MARKS }, () => ({ ...c })), keys: NO_KEYS() };
  }
  const out = marks.slice(0, MARKS);
  const k = keys.slice(0, MARKS);
  for (let i = out.length; i < MARKS; i++) {
    out.push({ ...marks[i % marks.length], a: 0 });
    k.push(keys[i % marks.length]);
  }
  return { marks: out, keys: k };
}

/** Rows [dow, hour, orders] → a 7 × 24 grid; opacity follows the count. */
export function heatmap(rows: Rows): Layout {
  const count = new Map(rows.map(r => [`${r[0]}-${r[1]}`, Number(r[2])]));
  const max = Math.max(1, ...count.values());
  const cw = PLOT.w / 24, ch = PLOT.h / 7;
  const marks: Mark[] = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
    const v = count.get(`${d}-${h}`) ?? 0;
    marks.push({ x: PLOT.x + h * cw + 1, y: PLOT.y + d * ch + 1, w: cw - 2, h: ch - 2, a: v ? 0.12 + 0.88 * (v / max) : 0.04, red: 1 });
  }
  return { marks, keys: NO_KEYS() };
}

/** Rows [merchant_id, merchant, orders, net_cents] sorted by net → 12 bars of 14 stacked segments; the top three red. */
export function pareto(rows: Rows): Layout {
  const max = Math.max(1, ...rows.map(r => Number(r[3])));
  const bw = PLOT.w / 12, seg = 14;
  const marks: Mark[] = [], keys: Key[] = [];
  for (let j = 0; j < 12; j++) {
    const r = rows[j];
    const s = (r ? (PLOT.h * Math.max(0, Number(r[3]))) / max : 0) / seg;
    for (let k = 0; k < seg; k++) {
      marks.push({ x: PLOT.x + j * bw + bw * 0.15, y: PLOT.y + PLOT.h - (k + 1) * s, w: bw * 0.7, h: s, a: 1, red: j < 3 ? 1 : 0 });
      keys.push(r ? Number(r[0]) : null);
    }
  }
  return { marks, keys };
}

/** Rows [cohort, weeks_after, size, students] → a cohort triangle; opacity is the retained share. */
export function retention(rows: Rows): Layout {
  const cw = PLOT.w / 16, ch = PLOT.h / 16;
  const marks: Mark[] = rows.map(([c, k, size, n]) => ({
    x: PLOT.x + Number(k) * cw + 1, y: PLOT.y + (Number(c) - 1) * ch + 1, w: cw - 2, h: ch - 2,
    a: 0.08 + 0.92 * (Number(n) / Math.max(1, Number(size))), red: 1,
  }));
  return pad(marks, marks.map(() => null));
}

/** Rows [area, bin, orders] → one row of bars per dorm area; bins from 45 minutes are red. */
export function delivery(rows: Rows): Layout {
  const rh = PLOT.h / 4, bw = PLOT.w / 13;
  const max = Math.max(1, ...rows.map(r => Number(r[2])));
  const marks: Mark[] = [], keys: Key[] = [];
  for (const [area, bin, n] of rows) {
    const row = AREAS.indexOf(String(area));
    if (row < 0) continue;
    const h = ((rh - 12) * Number(n)) / max;
    marks.push({ x: PLOT.x + (Number(bin) / 5) * bw + bw * 0.15, y: PLOT.y + row * rh + rh - 4 - h, w: bw * 0.7, h, a: 1, red: Number(bin) >= 45 ? 1 : 0 });
    keys.push(String(area));
  }
  return pad(marks, keys);
}

/** Largest-remainder rounding: integer shares of `total` in proportion to `counts`; ties go to the earlier item. */
export function largestRemainder(counts: number[], total: number): number[] {
  const sum = counts.reduce((a, b) => a + b, 0);
  if (!sum) return counts.map(() => 0);
  const raw = counts.map(c => (c / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i] as const)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}

/** Rows [reason, refunds] → a 12 × 14 waffle; the top reason red, the rest in ink steps. */
export function waffle(rows: Rows): Layout {
  const shares = largestRemainder(rows.map(r => Number(r[1])), MARKS);
  const cell = PLOT.h / 14;
  const marks: Mark[] = [];
  let i = 0;
  shares.forEach((n, r) => {
    for (let j = 0; j < n; j++, i++) {
      marks.push({ x: PLOT.x + (i % 12) * cell + 1, y: PLOT.y + Math.floor(i / 12) * cell + 1, w: cell - 2, h: cell - 2, a: r === 0 ? 1 : INK_STEPS[Math.min(r - 1, 2)], red: r === 0 ? 1 : 0 });
    }
  });
  return pad(marks, marks.map(() => null));
}

/** Three blocks of 56 squares, one per suggestion. */
export function blocks(): Layout {
  const bw = PLOT.w / 3, cell = Math.min((bw - 24) / 7, PLOT.h / 8);
  const marks: Mark[] = [];
  for (let b = 0; b < 3; b++) for (let i = 0; i < 56; i++) {
    marks.push({ x: PLOT.x + b * bw + (i % 7) * cell + 1, y: PLOT.y + Math.floor(i / 7) * cell + 1, w: cell - 2, h: cell - 2, a: 0.9, red: 1 });
  }
  return { marks, keys: NO_KEYS() };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function interpolate(a: Mark[], b: Mark[], t: number): Mark[] {
  return a.map((m, i) => {
    const n = b[i];
    return { x: lerp(m.x, n.x, t), y: lerp(m.y, n.y, t), w: lerp(m.w, n.w, t), h: lerp(m.h, n.h, t), a: lerp(m.a, n.a, t), red: t < 0.5 ? m.red : n.red };
  });
}

/** Chapter tops (px, viewport-relative) and a reading line → story position p in [0, n-1].
 *  Each chart holds for the first 60% of its chapter, then morphs into the next over the last 40%. */
export function chapterProgress(tops: number[], line: number): number {
  if (!tops.length) return 0;
  let i = 0;
  tops.forEach((top, j) => { if (top <= line) i = j; });
  if (i === tops.length - 1) return i;
  const frac = (line - tops[i]) / Math.max(1, tops[i + 1] - tops[i]);
  const t = Math.min(1, Math.max(0, (frac - 0.6) / 0.4));
  return i + t * t * (3 - 2 * t);
}

export function frameAt(layouts: Mark[][], p: number): Mark[] {
  const i = Math.min(layouts.length - 1, Math.max(0, Math.floor(p)));
  const t = p - i;
  return t > 0 && i + 1 < layouts.length ? interpolate(layouts[i], layouts[i + 1], t) : layouts[i];
}

type StoryResults = Record<'heatmap' | 'merchants' | 'retention' | 'delivery' | 'reasons', { values: Rows }>;

/** The six story charts, in chapter order. */
export function storyLayouts(r: StoryResults): Layout[] {
  return [heatmap(r.heatmap.values), pareto(r.merchants.values), retention(r.retention.values), delivery(r.delivery.values), waffle(r.reasons.values), blocks()];
}
```

- [ ] **Step 4: 实现 `countup.ts`**

```ts
/** Text at fraction k (0–1) of a count-up to `final`: the first number scales, its format and the surrounding text stay. */
export function countText(final: string, k: number): string {
  if (k >= 1 || final.includes(':')) return final;
  const m = final.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/s);
  if (!m) return final;
  const [, pre, digits, post] = m;
  const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
  const v = Number(digits.replace(/,/g, '')) * Math.max(0, k);
  return pre + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US')) + post;
}
```

- [ ] **Step 5: 运行，确认通过**

Run: `npx vitest run tests/unit/morph.test.ts tests/unit/countup.test.ts`
Expected: PASS（12 个测试）。

- [ ] **Step 6: 提交**

```bash
git add src/scripts/morph.ts src/scripts/countup.ts tests/unit/morph.test.ts tests/unit/countup.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights geometry: 168-mark chart layouts, interpolation and scroll progress; count-up text" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 静态页面——开场、六章、方法、目录与 SQL 页入口

**Files:**
- Modify: `src/data/site.ts`, `src/layouts/ProjectLayout.astro`, `src/views/CampusView.astro`, `tests/e2e/helpers.ts`, `tests/e2e/numbers.spec.ts`
- Create: `src/components/InsightText.astro`, `src/components/ChartLabels.astro`, `src/components/InsightsHero.astro`, `src/components/InsightsStory.astro`, `src/components/InsightsMethod.astro`, `src/components/InsightsTeaser.astro`, `src/copy/projects/campus-insights.zh.md`, `src/copy/projects/campus-insights.en.md`, `src/views/InsightsView.astro`, `src/pages/projects/campus-delivery/insights.astro`, `src/pages/en/projects/campus-delivery/insights.astro`
- Test: `tests/e2e/insights.spec.ts`

**Interfaces:**
- Consumes: Task 1 `insights.json`、`PARAMS`、`QUERIES`；Task 2 `deriveFacts`、`formatFact`、`INSIGHTS_COPY`、名称函数；Task 3 `storyLayouts`、`VIEW`、`PLOT`、`AREAS`。
- Produces（后续任务依赖的 DOM 约定）：
  - 开场：`section.ihero[data-rain]` 内有 `canvas`（`aria-hidden`）和 `[data-rain-target]`（大数字所在的 `<p>`）。
  - 叙事：`section[data-story]`；每章 `article[data-chapter-section]`；舞台 `figure[data-stage][data-chapter="1"]`，内含 168 个 `rect[data-m="0…167"]`（初始为第 1 章布局）与 6 组 `g.lbl[data-for="1…6"]`。
  - 数字：`span[data-insight-num="<key>"]`；图表 / 表格 / 序号容器带 `data-insight-data`。
  - `ProjectLayout` 新增具名插槽 `top`（位于 `<main>` 开头、标题之前）。

- [ ] **Step 1: 写失败的端到端测试**

`tests/e2e/insights.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deriveFacts, formatFact, type Results } from '../../src/scripts/insights-facts';
import { SITE } from '../../src/data/site';

const R: Results = JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results;
const FACTS = deriveFacts(R);
const PATH = '/projects/campus-delivery/insights/';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`insights page (${lang})`, () => {
    test('every insight number is the formatted query result', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${prefix}${PATH}`);
      const nums = await page.locator('[data-insight-num]').evaluateAll(els => els.map(e => [e.getAttribute('data-insight-num')!, e.textContent!.trim()]));
      expect(nums.length).toBeGreaterThan(30);
      for (const [key, text] of nums) expect(text, key).toBe(formatFact(FACTS[key], lang));
    });

    test('six chapters, each of the first five with a data table; the summary states the division of work', async ({ page }) => {
      await page.goto(`${prefix}${PATH}`);
      await expect(page.locator('[data-chapter-section]')).toHaveCount(6);
      await expect(page.locator('[data-chapter-section] details table')).toHaveCount(5);
      await expect(page.locator('[data-stage] rect[data-m]')).toHaveCount(168);
      await expect(page.locator('.p-summary')).toContainText(SITE.pages.insights.summary.mine[lang]);
      await expect(page.locator('.p-summary')).toContainText(SITE.pages.insights.summary.status[lang]);
    });

    test('the method section lists every query and the downloads', async ({ page, request }) => {
      await page.goto(`${prefix}${PATH}`);
      await expect(page.locator('[data-method] pre')).toHaveCount(8);
      for (const href of ['/assets/insights/campus-term.sqlite', '/downloads/insights/insights-gen.mjs', '/downloads/insights/insights-queries.mjs']) {
        await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
        expect((await request.get(href)).status()).toBe(200);
      }
    });

    test('the SQL page leads to the advanced page', async ({ page }) => {
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator(`a[href="${prefix}${PATH}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${prefix}${PATH}$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.pages.insights.title[lang]);
    });
  });
}
```

`tests/e2e/helpers.ts`：在 `PHASE2A_PAGES` 之后加一行，并把它并入 `PAGES`：

```ts
export const INSIGHTS_PAGES = ['/projects/campus-delivery/insights/', '/en/projects/campus-delivery/insights/'];
export const PAGES = [...PHASE1_PAGES, ...PHASE2A_PAGES, ...INSIGHTS_PAGES];
```

`tests/e2e/numbers.spec.ts`：把 `EXCLUDE` 改为（并在上方注释加一句"[data-insight-num] / [data-insight-data] hold query-derived numbers; insights.spec checks them against insights.json."）：

```ts
const EXCLUDE = 'script, style, .prow__n, .door__index, [data-demo], [data-reel], [data-insight-num], [data-insight-data], .p-pager, .contact, .footer, .nav, .prose';
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/insights.spec.ts --project=desktop`
Expected: FAIL（构建成功，但页面 404：`toBeGreaterThan(30)` 收到 0，或 `toHaveCount(6)` 收到 0）。

- [ ] **Step 3: 站点数据与布局插槽**

`src/data/site.ts`：在 `projects` 数组里 `campus-delivery` 那一项之后插入：

```ts
    project({ slug: 'campus-delivery/insights', line: 'data', inBrief: false,
      title: { zh: '校园外卖经营分析（进阶版）', en: 'Campus Delivery Insights (advanced)' },
      did: { zh: '在课程设计数据库上扩展出一个学期的合成数据：滚动读五个经营问题的答案，再在驾驶舱里自己筛选验证', en: 'A synthetic term built on the course-project database: scroll through five business questions, then filter the dashboard yourself' },
      status: { zh: '进阶版 · 借助 AI 编程工具开发 · 合成数据', en: 'Advanced · built with AI coding tools · synthetic data' } }),
```

在 `pages` 对象里（`campus` 之后）加入：

```ts
    insights: {
      title: { zh: '校园外卖经营分析（进阶版）', en: 'Campus Delivery Insights (advanced)' },
      lead: { zh: '同一套表结构，一个学期的订单，五个经营问题。', en: 'One schema, one term of orders, five business questions.' },
      description: { zh: '校园外卖课程设计的进阶版：一个学期的合成订单，用 SQL 回答五个经营问题；滚动看结论，驾驶舱里实时筛选。', en: 'The advanced edition of the campus delivery project: a synthetic term of orders, five business questions answered in SQL — scroll for the findings, then filter the live dashboard.' },
      tags: [ { zh: '进阶版 · 合成数据', en: 'Advanced · synthetic data' }, { zh: 'SQLite · sql.js · SVG', en: 'SQLite · sql.js · SVG' } ],
      summary: {
        task: { zh: '把课程设计的外卖数据库放大到一个学期，用 SQL 回答"什么时候最忙、钱从哪里来、学生会不会回来、送得够不够快、为什么退款"，再给出运营建议。', en: 'Scale the course-project delivery database to a full term and answer in SQL: when is it busiest, where does the money come from, do students come back, is delivery fast enough, why do orders get refunded — then suggest what operations should do.' },
        mine: { zh: '在课程设计数据库的基础上，提出五个经营问题、确定指标口径、审核每条结论；数据生成、图表和页面借助 AI 编程工具完成。', en: 'On top of my course-project database, I posed the five business questions, set the metric definitions and reviewed every conclusion; the data generator, charts and page were built with AI coding tools.' },
        tools: { zh: 'SQLite 与原有的表结构、约束和触发器；sql.js 在浏览器里执行同一批查询；图表为手写 SVG。', en: 'SQLite with the original schema, constraints and triggers; sql.js runs the same queries in the browser; hand-built SVG charts.' },
        evidence: { zh: '本页的滚动叙事与驾驶舱、全部 SQL、学期数据库与生成脚本。', en: 'The story and dashboard on this page, every query, the term database and the generator script.' },
        status: { zh: '进阶版 · 借助 AI 编程工具开发 · 合成数据；数据中的规律由生成脚本预设。', en: 'Advanced · built with AI coding tools · synthetic data; the patterns in the data are set by the generator.' },
      },
    },
```

`src/layouts/ProjectLayout.astro`：在 `<main id="main">` 的下一行加入 `<slot name="top" />`。

- [ ] **Step 4: 数字与图表标签组件**

`src/components/InsightText.astro`：

```astro
---
import { formatFact, type Fact } from '../scripts/insights-facts';
import type { Lang } from '../i18n';
interface Props { text: string; facts: Record<string, Fact>; lang: Lang }
const { text, facts, lang } = Astro.props;
// '{orders} 笔订单' → [<span data-insight-num="orders">5,142</span>, ' 笔订单']
const parts = text.split(/(\{\w+\})/).filter(Boolean).map(p => {
  const key = p.match(/^\{(\w+)\}$/)?.[1];
  if (!key) return { text: p };
  if (!facts[key]) throw new Error(`Unknown insight fact: ${key}`);
  return { key, text: formatFact(facts[key], lang) };
});
---
{parts.map(p => (p.key ? <span class="inum" data-insight-num={p.key}>{p.text}</span> : p.text))}
<style>
  .inum { font-weight: 700; color: var(--red-text); font-variant-numeric: tabular-nums; }
</style>
```

`src/components/ChartLabels.astro`：

```astro
---
import { PLOT, AREAS } from '../scripts/morph';
import { areaName, merchantLegend, reasonLegend } from '../scripts/insights-names';
import type { Results } from '../scripts/insights-facts';
import type { Lang } from '../i18n';
type LabelKind = 'heatmap' | 'merchants' | 'retention' | 'delivery' | 'reasons' | 'blocks';
interface Props { kind: LabelKind; results: Results; lang: Lang; chapter?: number }
const { kind, results, lang, chapter } = Astro.props;
const DAYS = { zh: ['一', '二', '三', '四', '五', '六', '日'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
const bottom = PLOT.y + PLOT.h + 16;
const ch7 = PLOT.h / 7, cw24 = PLOT.w / 24, rh4 = PLOT.h / 4, bw13 = PLOT.w / 13, cell = PLOT.h / 14, bw3 = PLOT.w / 3;
---
<g class="lbl" data-for={chapter}>
  {kind === 'heatmap' && DAYS[lang].map((d, i) => <text x={PLOT.x - 8} y={PLOT.y + i * ch7 + ch7 / 2 + 4} text-anchor="end">{d}</text>)}
  {kind === 'heatmap' && [0, 6, 12, 18].map(h => <text x={PLOT.x + h * cw24 + cw24 / 2} y={bottom} text-anchor="middle">{`${h}:00`}</text>)}
  {kind === 'merchants' && merchantLegend(results.merchants.values, lang).map((t, i) => <text class="red" data-legend={i} x={PLOT.x + PLOT.w} y={PLOT.y + 14 + i * 18} text-anchor="end">{t}</text>)}
  {kind === 'retention' && [1, 4, 7, 10, 13, 16].map(c => <text x={PLOT.x - 8} y={PLOT.y + (c - 1) * (PLOT.h / 16) + PLOT.h / 32 + 4} text-anchor="end">{lang === 'zh' ? `第${c}周` : `W${c}`}</text>)}
  {kind === 'retention' && [0, 4, 8, 12].map(k => <text x={PLOT.x + k * (PLOT.w / 16) + PLOT.w / 32} y={bottom} text-anchor="middle">{`+${k}`}</text>)}
  {kind === 'delivery' && AREAS.map((a, i) => <text x={PLOT.x - 8} y={PLOT.y + i * rh4 + rh4 - 8} text-anchor="end">{areaName(a, lang, true)}</text>)}
  {kind === 'delivery' && [0, 15, 30, 45, 60].map(m => <text x={PLOT.x + (m / 5) * bw13 + bw13 / 2} y={bottom} text-anchor="middle">{m === 60 ? '60+' : String(m)}</text>)}
  {kind === 'reasons' && reasonLegend(results.reasons.values, lang).map((t, i) => <text class={`r${Math.min(i, 3)}`} data-legend={i} x={PLOT.x + 12 * cell + 16} y={PLOT.y + 14 + i * 22}>{t}</text>)}
  {kind === 'blocks' && [1, 2, 3].map(b => <text x={PLOT.x + (b - 1) * bw3} y={bottom}>{`0${b}`}</text>)}
</g>
<style>
  text { font: 400 11px/1 var(--font-body); fill: currentColor; }
  .red, .r0 { fill: var(--red-text); font-weight: 700; }
  .r1 { fill-opacity: 0.85; } .r2 { fill-opacity: 0.7; } .r3 { fill-opacity: 0.6; }
  :global(.night-zone) .red, :global(.night-zone) .r0 { fill: var(--red); }
  :global([data-stage]) .lbl { opacity: 0; transition: opacity 0.3s var(--ease); }
  :global([data-stage][data-chapter='1']) .lbl[data-for='1'],
  :global([data-stage][data-chapter='2']) .lbl[data-for='2'],
  :global([data-stage][data-chapter='3']) .lbl[data-for='3'],
  :global([data-stage][data-chapter='4']) .lbl[data-for='4'],
  :global([data-stage][data-chapter='5']) .lbl[data-for='5'],
  :global([data-stage][data-chapter='6']) .lbl[data-for='6'] { opacity: 1; }
</style>
```

- [ ] **Step 5: 开场与叙事组件**

`src/components/InsightsHero.astro`：

```astro
---
import InsightText from './InsightText.astro';
import { INSIGHTS_COPY as C } from '../data/insights-copy';
import { deriveFacts, type Results } from '../scripts/insights-facts';
import data from '../data/insights.json';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const facts = deriveFacts(data.results as unknown as Results);
---
<section class="ihero" data-rain>
  <canvas aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="ihero__big" data-rain-target><InsightText text={C.hero.big[lang]} facts={facts} lang={lang} /></p>
    <p class="ihero__sub"><InsightText text={C.hero.sub[lang]} facts={facts} lang={lang} /></p>
  </div>
</section>
<style>
  .ihero { position: relative; padding-block: clamp(40px, 9vh, 110px) 8px; overflow: hidden; }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .ihero__big { font: 900 clamp(26px, 3.4vw, 52px)/1 var(--font-cjk-bold); letter-spacing: -0.01em; }
  .ihero__big :global(.inum) { display: inline-block; margin-right: 0.12em; font: 700 clamp(84px, 15vw, 230px)/0.82 var(--font-display); color: var(--ink); letter-spacing: -0.01em; }
  .ihero__sub { margin-top: 18px; color: var(--mute); font-size: clamp(14px, 1.2vw, 17px); }
  .ihero__sub :global(.inum) { color: inherit; }
</style>
```

`src/components/InsightsStory.astro`：

```astro
---
import InsightText from './InsightText.astro';
import ChartLabels from './ChartLabels.astro';
import { INSIGHTS_COPY as C } from '../data/insights-copy';
import { deriveFacts, type Results } from '../scripts/insights-facts';
import { storyLayouts, VIEW } from '../scripts/morph';
import { merchantName, areaName, reasonName } from '../scripts/insights-names';
import data from '../data/insights.json';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const R = data.results as unknown as Results;
const facts = deriveFacts(R);
const first = storyLayouts(R)[0].marks;
const KINDS = ['heatmap', 'merchants', 'retention', 'delivery', 'reasons', 'blocks'] as const;
const L = C.tables;
const yuan = (c: number) => `¥${Math.round(c / 100).toLocaleString('en-US')}`;
const DAYS = { zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
const hm = new Map(R.heatmap.values.map(([d, h, n]) => [`${d}-${h}`, String(n)]));
const hours = [...new Set(R.heatmap.values.map(r => Number(r[1])))].sort((a, b) => a - b);
const cohorts = [...new Set(R.retention.values.map(r => Number(r[0])))];
const maxK = Math.max(0, ...R.retention.values.map(r => Number(r[1])));
const ret = new Map(R.retention.values.map(([c, k, size, n]) => [`${c}-${k}`, `${Math.round((Number(n) / Number(size)) * 100)}%`]));
const ks = Array.from({ length: maxK + 1 }, (_, k) => k);
const tables: ({ head: string[]; rows: string[][] } | null)[] = [
  { head: [L.day[lang], ...hours.map(h => `${h}:00`)], rows: DAYS[lang].map((d, i) => [d, ...hours.map(h => hm.get(`${i}-${h}`) ?? '0')]) },
  { head: [L.merchant[lang], L.orders[lang], L.net[lang]], rows: R.merchants.values.map(([, m, n, net]) => [merchantName(String(m), lang), String(n), yuan(Number(net))]) },
  { head: [L.cohort[lang], ...ks.map(k => `+${k}`)], rows: cohorts.map(c => [lang === 'zh' ? `第 ${c} 周` : `Week ${c}`, ...ks.map(k => ret.get(`${c}-${k}`) ?? '')]) },
  { head: [L.area[lang], L.delivered[lang], L.avg[lang], L.over45[lang]], rows: R.slow.values.map(([a, n, over, avg]) => [areaName(String(a), lang), String(n), String(avg), String(over)]) },
  { head: [L.reason[lang], L.refunds[lang]], rows: R.reasons.values.map(([r, n]) => [reasonName(String(r), lang), String(n)]) },
  null,
];
---
<section class="story" data-story aria-labelledby="story-h">
  <h2 id="story-h" class="sr">{C.storyTitle[lang]}</h2>
  <div class="story__grid wrap">
    <div class="story__text">
      {C.chapters.map((c, i) => (
        <article class="chapter" data-chapter-section>
          <p class="chapter__n" data-insight-data>{`0${i + 1}`}</p>
          <h3>{c.q[lang]}</h3>
          <p class="chapter__a"><InsightText text={c.a[lang]} facts={facts} lang={lang} /></p>
          {c.recs && <ol class="recs">{c.recs.map(r => <li><InsightText text={r[lang]} facts={facts} lang={lang} /></li>)}</ol>}
          {c.note && <p class="chapter__note"><InsightText text={c.note[lang]} facts={facts} lang={lang} /></p>}
          {tables[i] && (
            <details class="chapter__data" data-insight-data>
              <summary>{L.view[lang]}</summary>
              <div class="table-wrap" role="region" tabindex="0" aria-label={`${c.q[lang]} · ${L.view[lang]}`}>
                <table>
                  <thead><tr>{tables[i]!.head.map(h => <th scope="col">{h}</th>)}</tr></thead>
                  <tbody>{tables[i]!.rows.map(r => <tr>{r.map((v, j) => (j === 0 ? <th scope="row">{v}</th> : <td>{v}</td>))}</tr>)}</tbody>
                </table>
              </div>
            </details>
          )}
        </article>
      ))}
    </div>
    <figure class="stage" data-stage data-chapter="1" data-insight-data aria-hidden="true">
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}>
        {first.map((m, i) => <rect data-m={i} x={m.x.toFixed(1)} y={m.y.toFixed(1)} width={m.w.toFixed(1)} height={m.h.toFixed(1)} fill-opacity={m.a.toFixed(3)} class:list={[{ red: m.red === 1 }]} />)}
        {KINDS.map((k, i) => <ChartLabels kind={k} results={R} lang={lang} chapter={i + 1} />)}
      </svg>
    </figure>
  </div>
</section>
<style>
  .story { border-top: var(--rule); }
  .story__grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(24px, 4vw, 72px); align-items: start; }
  .chapter { min-height: 100vh; padding-block: 16vh 8vh; }
  .chapter:last-child { min-height: 80vh; }
  .chapter__n { font: 700 14px/1 var(--font-display); letter-spacing: 0.2em; color: var(--red-text); }
  .chapter h3 { margin: 12px 0 20px; font-size: clamp(32px, 3.8vw, 60px); line-height: 1.05; letter-spacing: -0.02em; }
  .chapter__a { max-width: 30em; font-size: clamp(18px, 1.6vw, 22px); line-height: 1.75; }
  .recs { max-width: 32em; margin-top: 20px; padding-left: 1.4em; font-size: 17px; line-height: 1.7; }
  .recs li { margin-bottom: 12px; }
  .chapter__note { max-width: 36em; margin-top: 16px; color: var(--mute); font-size: 14px; }
  .chapter__data { margin-top: 18px; font-size: 14px; }
  .chapter__data summary { cursor: pointer; font-weight: 500; }
  .table-wrap { max-width: 100%; overflow-x: auto; margin-top: 10px; }
  table { border-collapse: collapse; font-size: 13px; white-space: nowrap; }
  th, td { padding: 6px 10px; border-bottom: var(--hair); text-align: right; }
  th[scope='row'], thead th:first-child { text-align: left; }
  thead th { border-bottom: var(--rule); font-weight: 500; }
  .stage { position: sticky; top: 12vh; margin: 0; color: var(--ink); }
  .stage svg { display: block; width: 100%; height: auto; overflow: visible; }
  .stage rect { fill: currentColor; }
  .stage rect.red { fill: var(--red); }
  @media (max-width: 800px) {
    .story__grid { grid-template-columns: minmax(0, 1fr); gap: 0; }
    .stage { order: -1; top: 0; z-index: 2; margin-inline: calc(var(--gutter) * -1); padding: 8px var(--gutter); background: var(--paper); border-bottom: var(--hair); }
    .stage svg { width: auto; max-width: 100%; max-height: 36svh; margin-inline: auto; }
    .chapter { min-height: 85svh; padding-block: 6vh; }
  }
</style>
```

- [ ] **Step 6: 方法、入口、正文、视图与页面**

`src/components/InsightsMethod.astro`：

```astro
---
import { PARAMS } from '../../tools/insights-gen.mjs';
import { QUERIES } from '../scripts/insights-queries.mjs';
import { merchantName, areaName, reasonName } from '../scripts/insights-names';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const zh = lang === 'zh';
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const T = {
  params: zh ? '生成参数（预设的规律都在这里）' : 'Generator parameters (every planted pattern is here)',
  sql: zh ? '全部 SQL' : 'Every query',
  downloads: zh ? '下载' : 'Downloads',
  db: zh ? '学期数据库（SQLite）' : 'Term database (SQLite)',
  gen: zh ? '数据生成脚本' : 'Generator script',
  queries: zh ? '全部查询' : 'All queries',
  label: zh ? '生成参数，可横向滚动' : 'Generator parameters, scrolls sideways',
};
const rows: [string, string][] = [
  [zh ? '学期' : 'Term', zh ? `${PARAMS.termStart} 起，${PARAMS.weeks} 周` : `${PARAMS.weeks} weeks from ${PARAMS.termStart}`],
  [zh ? '学生' : 'Students', String(PARAMS.students)],
  [zh ? '宿舍区（基础送达分钟 · 学生占比）' : 'Dorm areas (base minutes · share of students)', PARAMS.areas.map(([a, m, s]) => `${areaName(a, lang, true)} ${m} · ${pct(s)}`).join('；')],
  [zh ? '开学头两周加入的学生占比' : 'Share joining in the first two weeks', pct(PARAMS.freshmanShare)],
  [zh ? '加入后下单兴趣的衰减（下限 + 幅度 × e^(−周/半衰)）' : 'Interest after joining (floor + span × e^(−weeks/half-life))', `${zh ? '头两周' : 'first two weeks'} ${PARAMS.retention.fresh.join(' / ')}；${zh ? '之后' : 'later'} ${PARAMS.retention.later.join(' / ')}`],
  [zh ? '每周下单强度（次数 · 学生占比）' : 'Weekly ordering (orders · share)', PARAMS.appetite.map(([n, s]) => `${n} · ${pct(s)}`).join('；')],
  [zh ? '各小时权重' : 'Hour weights', Object.entries(PARAMS.hourWeights).map(([h, w]) => `${h}:00 ${w}`).join(' · ')],
  [zh ? '周五周六夜宵加成' : 'Friday/Saturday late-night boost', `× ${PARAMS.lateBoost}`],
  [zh ? '高峰时段与额外送达分钟' : 'Peak hours and extra minutes', `${PARAMS.peakHours.map(h => `${h}:00`).join(' · ')}；+${PARAMS.peakExtraMinutes}`],
  [zh ? '取消概率（基础 · 高峰加 · 北区加）' : 'Cancellation (base · peak extra · North extra)', `${pct(PARAMS.cancel.base)} · ${pct(PARAMS.cancel.peak)} · ${pct(PARAMS.cancel.far)}`],
  [zh ? '退款原因（高峰）' : 'Refund reasons (peak)', PARAMS.reasons.peak.map(([r, s]) => `${reasonName(r, lang)} ${pct(s)}`).join('；')],
  [zh ? '退款原因（平时）' : 'Refund reasons (off-peak)', PARAMS.reasons.calm.map(([r, s]) => `${reasonName(r, lang)} ${pct(s)}`).join('；')],
  [zh ? '商家热度权重' : 'Merchant popularity weights', PARAMS.merchants.map(([m, w]) => `${merchantName(m, lang)} ${w}`).join(' · ')],
  [zh ? '随机种子' : 'Random seed', String(PARAMS.seed)],
];
---
<section class="method" data-method data-insight-data>
  <h2>{T.params}</h2>
  <div class="table-wrap" role="region" tabindex="0" aria-label={T.label}>
    <table><tbody>{rows.map(([k, v]) => <tr><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table>
  </div>
  <h2>{T.sql}</h2>
  {Object.entries(QUERIES).map(([id, sql]) => (
    <>
      <h3><code>{id}</code></h3>
      <pre tabindex="0"><code>{sql}</code></pre>
    </>
  ))}
  <h2>{T.downloads}</h2>
  <ul>
    <li><a href="/assets/insights/campus-term.sqlite" download>{T.db}</a></li>
    <li><a href="/downloads/insights/insights-gen.mjs" download>{T.gen}</a></li>
    <li><a href="/downloads/insights/insights-queries.mjs" download>{T.queries}</a></li>
  </ul>
</section>
<style>
  .table-wrap { overflow-x: auto; }
  pre { max-width: 72em; }
</style>
```

`src/components/InsightsTeaser.astro`：

```astro
---
import { localizePath, type Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const T = lang === 'zh'
  ? { kicker: '进阶版', title: '一个学期的经营分析 →', sub: '同一套表结构放大到一个学期，用 SQL 回答五个经营问题，还能在驾驶舱里自己筛选。' }
  : { kicker: 'Advanced edition', title: 'A full term of business analysis →', sub: 'The same schema scaled to a whole term: five business questions answered in SQL, plus a dashboard you can filter.' };
---
<a class="teaser" href={localizePath('/projects/campus-delivery/insights/', lang)}>
  <span class="teaser__kicker">{T.kicker}</span>
  <span class="teaser__title">{T.title}</span>
  <span class="teaser__sub">{T.sub}</span>
</a>
<style>
  .teaser { display: grid; gap: 8px; max-width: 900px; margin: 48px 0 8px; padding: 24px 28px; background: var(--ink); color: var(--paper); text-decoration: none; transition: background-color 0.2s var(--ease); }
  .teaser:hover, .teaser:focus-visible { background: var(--red-text); }
  .teaser__kicker { font: 700 12px/1 var(--font-display); letter-spacing: 0.24em; text-transform: uppercase; }
  .teaser__title { font: 900 clamp(22px, 2.6vw, 36px)/1.2 var(--font-cjk-bold); }
  .teaser__sub { font-size: 15px; opacity: 0.85; }
</style>
```

`src/views/CampusView.astro`：导入 `InsightsTeaser`，在 `<Body />` 下一行放 `<InsightsTeaser lang={lang} />`。

`src/copy/projects/campus-insights.zh.md`：

```md
## 数据从哪里来

这是一份**合成数据**：一个固定种子的脚本，沿用课程设计的表结构、约束和触发器，逐笔写入一个学期的订单、明细、支付、配送和退款。所以它和课程设计一样满足全部业务规则，但它不是真实的经营数据。

## 哪些规律是预设的

午餐和晚餐双高峰、周五周六的夜宵、少数商家贡献大部分收入、开学头两周加入的同学更常回来、北区送得更慢、高峰时段更容易取消——这些规律都写在生成脚本的参数里（见下表）。上面的五章，是用 SQL 把这些规律**找回来**：展示的是提出问题、确定口径、写查询、读结果的方法，而不是新的经营发现。

## 数字是怎么算的

滚动叙事里的每个数字，都是构建网站时用下面同一批 SQL 算好的；驾驶舱则在你的浏览器里，对同一个数据库实时执行这些 SQL。测试会核对两边的结果完全一致，也会核对页面上的每个数字都来自查询结果。
```

`src/copy/projects/campus-insights.en.md`：

```md
## Where the data comes from

This is **synthetic data**: a script with a fixed seed writes a full term of orders, items, payments, deliveries and refunds, one by one, through the course project's schema, constraints and triggers. It obeys every business rule the course project does — but it is not real business data.

## Which patterns were planted

Lunch and dinner peaks, Friday and Saturday late nights, a few merchants earning most of the revenue, students who join in the first two weeks coming back more often, slower delivery to the North dorms, more cancellations at peak hours — all of these are set in the generator's parameters (table below). The five chapters above use SQL to **find them again**: what they show is the method — asking the question, defining the metric, writing the query, reading the result — not new business findings.

## How the numbers are computed

Every number in the story was computed at build time with the same queries listed below; the dashboard runs those queries live, in your browser, on the same database. Tests check that both agree, and that every number on the page comes from a query result.
```

`src/views/InsightsView.astro`：

```astro
---
import ProjectLayout from '../layouts/ProjectLayout.astro';
import InsightsHero from '../components/InsightsHero.astro';
import InsightsStory from '../components/InsightsStory.astro';
import InsightsMethod from '../components/InsightsMethod.astro';
import { SITE } from '../data/site';
import { Content as BodyZh } from '../copy/projects/campus-insights.zh.md';
import { Content as BodyEn } from '../copy/projects/campus-insights.en.md';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const P = SITE.pages.insights;
const Body = lang === 'zh' ? BodyZh : BodyEn;
---
<ProjectLayout lang={lang} slug="campus-delivery/insights" title={P.title} lead={P.lead} tags={P.tags} summary={P.summary} description={P.description}>
  <InsightsHero slot="top" lang={lang} />
  <Fragment slot="demo">
    <InsightsStory lang={lang} />
  </Fragment>
  <Body />
  <InsightsMethod lang={lang} />
</ProjectLayout>
```

`src/pages/projects/campus-delivery/insights.astro`：

```astro
---
import InsightsView from '../../../views/InsightsView.astro';
---
<InsightsView lang="zh" />
```

`src/pages/en/projects/campus-delivery/insights.astro`：

```astro
---
import InsightsView from '../../../../views/InsightsView.astro';
---
<InsightsView lang="en" />
```

- [ ] **Step 7: 运行，确认通过**

Run: `npx playwright test tests/e2e/insights.spec.ts`
Expected: PASS（桌面 8 个、手机 8 个）。

Run: `npm test && npx playwright test tests/e2e/numbers.spec.ts tests/e2e/a11y.spec.ts tests/e2e/layout.spec.ts tests/e2e/links.spec.ts tests/e2e/projects-index.spec.ts tests/e2e/campus.spec.ts`
Expected: 全部 PASS。若 `site.test.ts` 的数字检查报错，说明 `site.ts` 新文案里出现了数字，改文案，不改检查；若 axe 报 `scrollable-region-focusable` 或对比度问题，按报出的节点修正并记 Ruling。

- [ ] **Step 8: 提交**

```bash
git add src tests/e2e
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights page: hero, six-chapter story with data tables, method and downloads; linked from the index and the SQL page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 滚动变形与数字计数

**Files:**
- Create: `src/scripts/morph-dom.ts`, `src/scripts/countup-dom.ts`
- Modify: `src/components/InsightsStory.astro`（加 `<script>`）
- Test: `tests/e2e/insights.spec.ts`（追加）

**Interfaces:**
- Consumes: Task 3 `chapterProgress`, `frameAt`, `storyLayouts`, `Mark`；`countText`；Task 4 的 DOM 约定。
- Produces: `paint(rects: SVGRectElement[], marks: Mark[]): void`（Task 7 复用）；`initMorph(stage, chapters, layouts)`；`initCountUp(els)`；舞台的 `data-chapter` 随滚动更新为 `1…6`。

- [ ] **Step 1: 写失败的测试**（追加到 `tests/e2e/insights.spec.ts` 末尾；`import` 行移到文件顶部，与已有的 import 放在一起）

```ts
import { storyLayouts } from '../../src/scripts/morph';

const LAYOUTS = storyLayouts(R);
/** Scrolls so chapter i's top sits at 30% of the viewport (past the 55% reading line). */
async function toChapter(page: import('@playwright/test').Page, i: number) {
  await page.locator('[data-chapter-section]').nth(i).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3));
}

test('scrolling morphs the stage chapter by chapter, and back', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop layout');
  await page.goto(PATH);
  const stage = page.locator('[data-stage]');
  const rect = page.locator('[data-stage] rect[data-m="0"]');
  const h1 = await rect.getAttribute('height');
  await toChapter(page, 2);
  await expect(stage).toHaveAttribute('data-chapter', '3');
  await expect(rect).not.toHaveAttribute('height', h1!);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(stage).toHaveAttribute('data-chapter', '1');
  await expect(rect).toHaveAttribute('height', h1!);
});

test('reduced motion snaps to each chapter\'s exact chart', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop layout');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PATH);
  await toChapter(page, 1);
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-chapter', '2');
  const m = LAYOUTS[1].marks[0];
  await expect(page.locator('[data-stage] rect[data-m="0"]')).toHaveAttribute('height', m.h.toFixed(1));
});

test('mobile: the stage stays pinned at the top while the chapters scroll', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile layout');
  await page.goto(PATH);
  await toChapter(page, 1);
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-chapter', '2');
  const top = await page.locator('[data-stage]').evaluate(el => el.getBoundingClientRect().top);
  expect(Math.abs(top)).toBeLessThanOrEqual(1);
});

test('chapter numbers count up and land exactly on the query result', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(PATH);
  await toChapter(page, 0);
  const n = page.locator('[data-chapter-section]').first().locator('[data-insight-num="lunchShare"]');
  await expect(n).toHaveText(formatFact(FACTS.lunchShare, 'zh'), { timeout: 3000 });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/insights.spec.ts -g "morphs|snaps|pinned"`
Expected: FAIL：`data-chapter` 一直是 `"1"`（还没有滚动脚本）。计数测试此时会通过（文字本来就是终值），这符合预期：它守护的是加动画之后终值不变。

- [ ] **Step 3: 实现 DOM 脚本**

`src/scripts/morph-dom.ts`：

```ts
import { chapterProgress, frameAt, type Mark } from './morph';

/** Writes marks into the pool of <rect data-m> elements. */
export function paint(rects: SVGRectElement[], marks: Mark[]): void {
  marks.forEach((m, i) => {
    const r = rects[i];
    if (!r) return;
    r.setAttribute('x', m.x.toFixed(1));
    r.setAttribute('y', m.y.toFixed(1));
    r.setAttribute('width', m.w.toFixed(1));
    r.setAttribute('height', m.h.toFixed(1));
    r.setAttribute('fill-opacity', m.a.toFixed(3));
    r.classList.toggle('red', m.red === 1);
  });
}

/** Drives the story stage from the scroll position: charts hold, then morph into the next near each chapter's end.
 *  With reduced motion the stage jumps straight to the current chapter's chart. */
export function initMorph(stage: HTMLElement, chapters: HTMLElement[], layouts: Mark[][]): void {
  const rects = [...stage.querySelectorAll<SVGRectElement>('rect[data-m]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let shown = -1;
  const update = () => {
    frame = 0;
    let p = chapterProgress(chapters.map(c => c.getBoundingClientRect().top), innerHeight * 0.55);
    if (reduced) p = Math.floor(p);
    stage.dataset.chapter = String(Math.round(p) + 1);
    if (p === shown) return;
    shown = p;
    paint(rects, frameAt(layouts, p));
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}
```

`src/scripts/countup-dom.ts`：

```ts
import { countText } from './countup';

/** Counts each number up once as it enters the viewport; always ends on the exact original text. */
export function initCountUp(els: Iterable<HTMLElement>): void {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target as HTMLElement;
      const final = el.textContent ?? '';
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 700);
        el.textContent = countText(final, 1 - (1 - k) ** 3);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { rootMargin: '0px 0px -15% 0px' });
  for (const el of els) io.observe(el);
}
```

在 `src/components/InsightsStory.astro` 的 `</section>` 之后、`<style>` 之前加入：

```astro
<script>
  import { initMorph } from '../scripts/morph-dom';
  import { initCountUp } from '../scripts/countup-dom';
  import { storyLayouts } from '../scripts/morph';
  import data from '../data/insights.json';
  import type { Results } from '../scripts/insights-facts';
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter-section]')];
  if (stage && chapters.length) initMorph(stage, chapters, storyLayouts(data.results as unknown as Results).map(l => l.marks));
  initCountUp(document.querySelectorAll<HTMLElement>('[data-story] [data-insight-num]'));
</script>
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx playwright test tests/e2e/insights.spec.ts`
Expected: PASS（新增 4 个测试按设备各跑一次）。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/morph-dom.ts src/scripts/countup-dom.ts src/components/InsightsStory.astro tests/e2e/insights.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights story: scroll-driven chart morph with a pinned stage; numbers count up once" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 开场点雨

**Files:**
- Create: `src/scripts/rain.ts`, `src/scripts/rain-dom.ts`
- Modify: `src/components/InsightsHero.astro`
- Test: `tests/unit/rain.test.ts`, `tests/e2e/insights.spec.ts`（追加）

**Interfaces:**
- Consumes: Task 4 的 `[data-rain]`、`canvas`、`[data-rain-target]`。
- Produces: `FALL`, `DURATION`, `interface Dot`, `sampleTargets(alpha, w, h, count)`, `makeDots(targets, w, h, seed?)`, `dotAt(d, t)`；`initRain(hero)`；开场结束时 `section.ihero` 带 `is-done`，`canvas` 已移除。

- [ ] **Step 1: 写失败的测试**

`tests/unit/rain.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { sampleTargets, makeDots, dotAt, FALL, DURATION } from '../../src/scripts/rain';

describe('rain', () => {
  it('samples only opaque pixels', () => {
    const w = 8, h = 8, alpha = new Uint8ClampedArray(w * h * 4);
    alpha[(4 * w + 4) * 4 + 3] = 255; // one opaque pixel at (4, 4)
    const pts = sampleTargets(alpha, w, h, 5);
    expect(pts).toHaveLength(5);
    expect(pts.every(([x, y]) => x === 4 && y === 4)).toBe(true);
    expect(sampleTargets(new Uint8ClampedArray(w * h * 4), w, h, 5)).toEqual([]);
  });

  it('dots start above, fall, then land exactly on their targets', () => {
    const [d] = makeDots([[100, 50]], 400, 300);
    expect(dotAt(d, 0)).toEqual([d.sx, d.sy]);
    expect(d.sy).toBeLessThanOrEqual(0);
    expect(dotAt(d, FALL / 2)[1]).toBeGreaterThan(d.sy);
    expect(dotAt(d, DURATION)).toEqual([100, 50]);
    expect(dotAt(d, DURATION + 500)).toEqual([100, 50]);
  });

  it('is deterministic', () => {
    expect(makeDots([[1, 2], [3, 4]], 400, 300)).toEqual(makeDots([[1, 2], [3, 4]], 400, 300));
  });
});
```

追加到 `tests/e2e/insights.spec.ts`：

```ts
test('the rain ends on its own and leaves the real number', async ({ page }) => {
  await page.goto(PATH);
  const hero = page.locator('[data-rain]');
  await expect(hero).toHaveClass(/is-done/, { timeout: 4000 });
  await expect(hero.locator('canvas')).toHaveCount(0);
  await expect(hero.locator('[data-insight-num="orders"]')).toHaveText(formatFact(FACTS.orders, 'zh'));
  const color = await hero.locator('[data-rain-target] .inum').evaluate(el => getComputedStyle(el).color);
  expect(color).not.toBe('rgba(0, 0, 0, 0)');
});

test('a click ends the rain at once', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(PATH);
  await page.mouse.click(5, 5);
  await expect(page.locator('[data-rain]')).toHaveClass(/is-done/, { timeout: 500 });
});

test('reduced motion skips the rain', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PATH);
  await expect(page.locator('[data-rain]')).toHaveClass(/is-done/, { timeout: 500 });
  await expect(page.locator('[data-rain] canvas')).toHaveCount(0);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/rain.test.ts`
Expected: FAIL，找不到 `../../src/scripts/rain`。

Run: `npx playwright test tests/e2e/insights.spec.ts -g "rain"`
Expected: FAIL，`is-done` 从未出现。

- [ ] **Step 3: 实现**

`src/scripts/rain.ts`：

```ts
/** Opening rain: dots fall, then converge onto the pixels of the big number. Pure; no DOM. */
export const FALL = 520;
export const DURATION = 1200;
export interface Dot { sx: number; sy: number; tx: number; ty: number; drop: number }

/** Every other pixel of an RGBA buffer whose alpha passes 128, thinned evenly to `count` points. */
export function sampleTargets(rgba: Uint8ClampedArray, w: number, h: number, count: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (rgba[(y * w + x) * 4 + 3] > 128) pts.push([x, y]);
  if (!pts.length) return [];
  return Array.from({ length: count }, (_, i) => pts[Math.floor((i * pts.length) / count)]);
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeDots(targets: [number, number][], w: number, h: number, seed = 7): Dot[] {
  const r = seeded(seed);
  return targets.map(([tx, ty]) => ({ sx: r() * w, sy: -r() * h * 0.6, tx, ty, drop: h * (0.25 + r() * 0.35) }));
}

/** Position at t ms: an accelerating fall, then an ease-out onto the target. */
export function dotAt(d: Dot, t: number): [number, number] {
  if (t <= 0) return [d.sx, d.sy];
  if (t < FALL) { const k = t / FALL; return [d.sx, d.sy + d.drop * k * k]; }
  if (t >= DURATION) return [d.tx, d.ty];
  const fx = d.sx, fy = d.sy + d.drop;
  const e = 1 - (1 - (t - FALL) / (DURATION - FALL)) ** 3;
  return [fx + (d.tx - fx) * e, fy + (d.ty - fy) * e];
}
```

`src/scripts/rain-dom.ts`：

```ts
import { sampleTargets, makeDots, dotAt, DURATION } from './rain';

/** Plays the opening rain once. Any click, wheel, key or touch ends it; reduced motion or no canvas skips it. */
export function initRain(hero: HTMLElement): void {
  const canvas = hero.querySelector('canvas');
  const target = hero.querySelector<HTMLElement>('[data-rain-target]');
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    canvas?.remove();
    hero.classList.remove('is-raining');
    hero.classList.add('is-done');
  };
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();

  const box = hero.getBoundingClientRect();
  const num = target.querySelector<HTMLElement>('.inum') ?? target;
  const nb = num.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(box.width * dpr);
  canvas.height = Math.ceil(box.height * dpr);
  ctx.scale(dpr, dpr);

  // Rasterise the number where it sits, then aim one dot at every sampled pixel.
  const off = document.createElement('canvas');
  off.width = Math.ceil(box.width);
  off.height = Math.ceil(box.height);
  const o = off.getContext('2d');
  if (!o) return finish();
  const cs = getComputedStyle(num);
  o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  o.textBaseline = 'top';
  o.fillText(num.textContent ?? '', nb.left - box.left, nb.top - box.top);
  const targets = sampleTargets(o.getImageData(0, 0, off.width, off.height).data, off.width, off.height, innerWidth < 800 ? 900 : 2400);
  if (!targets.length) return finish();
  const dots = makeDots(targets, box.width, box.height);
  const red = getComputedStyle(hero).getPropertyValue('--red').trim() || '#e8380d';

  hero.classList.add('is-raining');
  for (const ev of ['pointerdown', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, finish, { once: true, passive: true });
  let start = 0;
  const frame = (now: number) => {
    if (finished) return;
    if (!start) start = now;
    const t = now - start;
    ctx.clearRect(0, 0, box.width, box.height);
    ctx.fillStyle = red;
    for (const d of dots) { const [x, y] = dotAt(d, t); ctx.fillRect(x, y, 2, 2); }
    if (t >= DURATION) return finish();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
```

`src/components/InsightsHero.astro`：`</section>` 之后加入两段脚本（内联那段先把数字藏起来，避免模块加载前闪一下；2.5 秒兜底，模块没加载也不会一直看不见数字）：

```astro
<script is:inline>
  (function () {
    var hero = document.currentScript.previousElementSibling;
    if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    hero.classList.add('is-raining');
    setTimeout(function () { if (!hero.classList.contains('is-done')) { hero.classList.remove('is-raining'); hero.classList.add('is-done'); } }, 2500);
  })();
</script>
<script>
  import { initRain } from '../scripts/rain-dom';
  const hero = document.querySelector<HTMLElement>('[data-rain]');
  if (hero) initRain(hero);
</script>
```

并在该组件的 `<style>` 里加：

```css
  .ihero.is-raining [data-rain-target] :global(.inum) { color: transparent; }
  .ihero [data-rain-target] :global(.inum) { transition: color 0.25s var(--ease); }
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/rain.test.ts && npx playwright test tests/e2e/insights.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/rain.ts src/scripts/rain-dom.ts src/components/InsightsHero.astro tests/unit/rain.test.ts tests/e2e/insights.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights hero: one-off dot rain converging on the order count; any input ends it" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 驾驶舱

**Files:**
- Create: `public/assets/insights-worker.js`, `src/scripts/cockpit-text.ts`, `src/scripts/cockpit-ui.ts`, `src/components/InsightsCockpit.astro`
- Modify: `src/views/InsightsView.astro`（`demo` 插槽里在 `InsightsStory` 之后放 `InsightsCockpit`）
- Test: `tests/unit/cockpit-text.test.ts`, `tests/e2e/insights.spec.ts`（追加）

**Interfaces:**
- Consumes: Task 1 `QUERIES`、`params`；Task 3 `heatmap`、`pareto`、`delivery`、`waffle`、`interpolate`、`Mark`；Task 5 `paint`；Task 2 `merchantLegend`、`reasonLegend`、`merchantName`、`areaName`、`Results`。
- Produces:
  - DOM：`section[data-cockpit][data-insight-data][data-lang]`；`#ck-status`（`data-error`）；`#ck-form` 内 `#ck-from`、`#ck-to`（range 1–16）、`input[name="merchant"][value=<id>]`、`input[name="area"][value=<区>]`、`#ck-reset`；`[data-kpi="orders|net|aov|refund|minutes"]`；`figure[data-chart="heatmap|merchants|delivery|reasons"]`，内含 168 个 `rect[data-m]`、`details` 里的 `pre[data-sql]` 与 `table[data-table]`。
  - `cockpit-text.ts`: `KPI_IDS`, `type KpiId`, `COCKPIT_TEXT`, `kpiText(id, v, lang)`。
  - 工作线程协议：请求 `{ id, action: 'init' }` 或 `{ id, action: 'run', queries: { id, sql }[], params }`；回复 `{ id, ok: true, results }` 或 `{ id, ok: false, error }`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/cockpit-text.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { kpiText } from '../../src/scripts/cockpit-text';

describe('kpiText', () => {
  it('formats each indicator', () => {
    expect(kpiText('orders', 5142, 'zh')).toBe('5,142');
    expect(kpiText('net', 13989600, 'zh')).toBe('¥139,896');
    expect(kpiText('aov', 2851, 'en')).toBe('¥28.5');
    expect(kpiText('refund', 4.6, 'zh')).toBe('4.6%');
    expect(kpiText('minutes', 26.2, 'zh')).toBe('26.2 分钟');
    expect(kpiText('minutes', 26.2, 'en')).toBe('26.2 min');
  });
  it('shows a dash when there is nothing to measure', () => {
    expect(kpiText('aov', null, 'zh')).toBe('—');
    expect(kpiText('minutes', Number.NaN, 'en')).toBe('—');
  });
});
```

追加到 `tests/e2e/insights.spec.ts`（`import` 行移到文件顶部）：

```ts
import { loadSqlJs } from '../../tools/sqljs-node.mjs';
import { QUERIES, params } from '../../src/scripts/insights-queries.mjs';
import { kpiText } from '../../src/scripts/cockpit-text';

type F = { from: number; to: number; merchants: number[]; areas: string[] };
let SQLDB: any;
test.beforeAll(async () => {
  const SQL = await loadSqlJs();
  SQLDB = new SQL.Database(readFileSync('public/assets/insights/campus-term.sqlite'));
});
const kpiFor = (f: F) => {
  const s = SQLDB.prepare(QUERIES.kpi);
  s.bind(params(f));
  s.step();
  const v = s.get();
  s.free();
  return v as (number | null)[];
};
const ALLF: F = { from: 1, to: 16, merchants: [], areas: [] };

async function openCockpit(page: import('@playwright/test').Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
  await expect(page.locator('#ck-from')).toBeEnabled({ timeout: 25000 });
}

test('before the engine loads, the dashboard already shows the whole term', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor(ALLF)[0], 'zh'));
  await expect(page.locator('[data-chart] rect[data-m]')).toHaveCount(168 * 4);
});

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`filters re-run the SQL and every indicator matches it (${lang})`, async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await openCockpit(page, prefix);
    await page.locator('#ck-from').fill('3');
    await page.locator('#ck-to').fill('9');
    await page.locator('input[name="area"][value="北区"]').check();
    const f: F = { from: 3, to: 9, merchants: [], areas: ['北区'] };
    const v = kpiFor(f);
    const ids = ['orders', 'net', 'aov', 'refund', 'minutes'] as const;
    for (const [i, id] of ids.entries()) await expect(page.locator(`[data-kpi="${id}"]`)).toHaveText(kpiText(id, v[i], lang));
  });
}

test('clicking a merchant bar filters by that merchant', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await openCockpit(page);
  const top = Number(R.merchants.values[0][0]);
  await page.locator('[data-chart="merchants"] rect[data-m="0"]').click();
  await expect(page.locator(`input[name="merchant"][value="${top}"]`)).toBeChecked();
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor({ ...ALLF, merchants: [top] })[0], 'zh'));
});

test('rapid changes settle on the last filter', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await openCockpit(page);
  for (const v of ['2', '3', '4', '5', '6', '7', '8']) await page.locator('#ck-from').fill(v);
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor({ ...ALLF, from: 8 })[0], 'zh'));
});

test('a filter with no orders shows dashes, not NaN', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  let empty: F | undefined;
  for (let m = 1; m <= 12 && !empty; m++) for (const a of ['东区', '西区', '南区', '北区']) {
    const f: F = { from: 16, to: 16, merchants: [m], areas: [a] };
    if (kpiFor(f)[0] === 0) { empty = f; break; }
  }
  test.skip(!empty, 'no empty combination in this data');
  await openCockpit(page);
  await page.locator('#ck-from').fill('16');
  await page.locator(`input[name="merchant"][value="${empty!.merchants[0]}"]`).check();
  await page.locator(`input[name="area"][value="${empty!.areas[0]}"]`).check();
  await expect(page.locator('[data-kpi="orders"]')).toHaveText('0');
  await expect(page.locator('[data-kpi="aov"]')).toHaveText('—');
  await expect(page.locator('#ck-status')).toContainText('没有订单');
  expect(await page.locator('[data-cockpit]').innerText()).not.toContain('NaN');
});

test('"View SQL" shows the exact query that ran', async ({ page }) => {
  await page.goto(PATH);
  const box = page.locator('[data-chart="heatmap"] details');
  await box.locator('summary').click();
  const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
  expect(squash((await box.locator('pre[data-sql]').textContent())!)).toBe(squash(QUERIES.heatmap));
});

test('engine fails to load: the story stays whole, the dashboard explains itself', async ({ page }) => {
  await page.route('**/*.wasm', r => r.abort());
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PATH);
  await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
  await expect(page.locator('#ck-status')).toHaveAttribute('data-error', 'true', { timeout: 25000 });
  await expect(page.locator('#ck-status')).toContainText('未能下载');
  await expect(page.locator('#ck-from')).toBeDisabled();
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor(ALLF)[0], 'zh'));
  await expect(page.locator('[data-chapter-section]')).toHaveCount(6);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/cockpit-text.test.ts`
Expected: FAIL，找不到 `../../src/scripts/cockpit-text`。

- [ ] **Step 3: 工作线程**

`public/assets/insights-worker.js`：

```js
importScripts('/assets/vendor/sql-wasm.js');
// sql.js also rejects an internal promise when the wasm fails to load; the failure is already reported via postMessage below.
addEventListener('unhandledrejection', e => e.preventDefault());
let db;
onmessage = async ({ data: m }) => {
  try {
    if (m.action === 'init') {
      const SQL = await initSqlJs({ locateFile: () => '/assets/vendor/sql-wasm.wasm' });
      const res = await fetch('/assets/insights/campus-term.sqlite');
      if (!res.ok) throw Error('HTTP ' + res.status);
      db = new SQL.Database(new Uint8Array(await res.arrayBuffer()));
      db.run('PRAGMA query_only = ON');
      postMessage({ id: m.id, ok: true, results: {} });
      return;
    }
    if (!db) throw Error('database not loaded');
    const results = {};
    for (const q of m.queries) {
      const s = db.prepare(q.sql);
      try {
        s.bind(m.params);
        const values = [];
        while (s.step()) values.push(s.get());
        results[q.id] = { columns: s.getColumnNames(), values };
      } finally {
        s.free();
      }
    }
    postMessage({ id: m.id, ok: true, results });
  } catch (e) {
    postMessage({ id: m.id, ok: false, error: String((e && e.message) || e) });
  }
};
```

- [ ] **Step 4: 文案与指标格式**

`src/scripts/cockpit-text.ts`：

```ts
import type { Lang } from '../i18n';

export const KPI_IDS = ['orders', 'net', 'aov', 'refund', 'minutes'] as const;
export type KpiId = (typeof KPI_IDS)[number];

export const COCKPIT_TEXT = {
  zh: {
    title: '驾驶舱：自己筛选验证', kicker: 'Live SQL',
    idle: '显示的是整个学期的结果。滚动到这里时载入 SQLite 与学期数据库（约 2 MB），之后可以筛选。',
    loading: '正在载入 SQLite 与学期数据库…', ready: '已载入 · 改变筛选，所有图表一起更新。', running: '正在执行 SQL…',
    empty: '当前筛选下没有订单。',
    loadFailed: '引擎或数据库未能下载（网络较慢或被拦截）。上面的滚动叙事不受影响；也可以在页尾下载数据库，在本地运行同样的 SQL。',
    runFailed: '查询没有完成，请刷新页面重试。',
    weeks: '周范围', from: '从第', to: '到第', week: '周', merchants: '商家', areas: '宿舍区', reset: '清除筛选',
    kpi: { orders: '订单数', net: '净收款', aov: '客单价', refund: '退款率', minutes: '平均送达' },
    charts: { heatmap: '下单时段（星期 × 小时）', merchants: '商家净收款', delivery: '送达时长（按宿舍区，分钟）', reasons: '退款原因' },
    viewSql: '查看 SQL 与结果', resultLabel: '查询结果，可横向滚动',
    clickHint: '点击商家的柱子或宿舍区的柱子，也能按它筛选；再点一次取消。',
  },
  en: {
    title: 'Dashboard: filter it yourself', kicker: 'Live SQL',
    idle: 'Showing the whole term. SQLite and the term database (about 2 MB) load when you scroll here; then you can filter.',
    loading: 'Loading SQLite and the term database…', ready: 'Loaded · change a filter and every chart updates.', running: 'Running SQL…',
    empty: 'No orders match this filter.',
    loadFailed: 'The engine or database could not be downloaded (slow or blocked network). The story above is unaffected; you can also download the database at the end of the page and run the same SQL locally.',
    runFailed: 'The query did not finish — please refresh the page.',
    weeks: 'Weeks', from: 'From week', to: 'To week', week: '', merchants: 'Merchants', areas: 'Dorm areas', reset: 'Clear filters',
    kpi: { orders: 'Orders', net: 'Net revenue', aov: 'Avg order', refund: 'Refund rate', minutes: 'Avg delivery' },
    charts: { heatmap: 'Order times (day × hour)', merchants: 'Net revenue by merchant', delivery: 'Delivery time by dorm area (min)', reasons: 'Refund reasons' },
    viewSql: 'View SQL and result', resultLabel: 'Query result, scrolls sideways',
    clickHint: 'Click a merchant bar or a dorm-area bar to filter by it; click again to clear.',
  },
} as const;

export function kpiText(id: KpiId, v: number | null, lang: Lang): string {
  if (v === null || !Number.isFinite(v)) return '—';
  switch (id) {
    case 'orders': return Math.round(v).toLocaleString('en-US');
    case 'net': return `¥${Math.round(v / 100).toLocaleString('en-US')}`;
    case 'aov': return `¥${(v / 100).toFixed(1)}`;
    case 'refund': return `${v.toFixed(1)}%`;
    case 'minutes': return lang === 'zh' ? `${v.toFixed(1)} 分钟` : `${v.toFixed(1)} min`;
  }
}
```

Run: `npx vitest run tests/unit/cockpit-text.test.ts`
Expected: PASS（2 个测试）。

- [ ] **Step 5: 驾驶舱脚本**

`src/scripts/cockpit-ui.ts`：

```ts
import { QUERIES, params } from './insights-queries.mjs';
import { heatmap, pareto, delivery, waffle, interpolate, type Layout, type Mark, type Key, type Rows } from './morph';
import { paint } from './morph-dom';
import { merchantLegend, reasonLegend } from './insights-names';
import { COCKPIT_TEXT, KPI_IDS, kpiText, type KpiId } from './cockpit-text';
import type { Results } from './insights-facts';

type ChartId = 'heatmap' | 'merchants' | 'delivery' | 'reasons';
const CHARTS: ChartId[] = ['heatmap', 'merchants', 'delivery', 'reasons'];
const LAYOUT: Record<ChartId, (v: Rows) => Layout> = { heatmap, merchants: pareto, delivery, reasons: waffle };
const RUN = ['kpi', ...CHARTS] as const;
interface Reply { id: number; ok: boolean; error?: string; results?: Results }
interface Chart { rects: SVGRectElement[]; shown: Mark[]; keys: Key[]; token: number; fig: HTMLElement }

/** The live dashboard: server-rendered for the whole term, then re-queried in a worker as filters change.
 *  The engine loads when the dashboard is a quarter into view or a control gets focus. */
export function initCockpit(root: HTMLElement, initial: Results): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const T = COCKPIT_TEXT[lang];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = <E extends Element>(sel: string) => root.querySelector<E>(sel)!;
  const form = $<HTMLFormElement>('#ck-form');
  const status = $<HTMLElement>('#ck-status');
  const from = $<HTMLInputElement>('#ck-from');
  const to = $<HTMLInputElement>('#ck-to');
  const controls = [...form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')];
  const charts = new Map<ChartId, Chart>();
  for (const id of CHARTS) {
    const fig = $<HTMLElement>(`[data-chart="${id}"]`);
    const layout = LAYOUT[id](initial[id].values);
    charts.set(id, { rects: [...fig.querySelectorAll<SVGRectElement>('rect[data-m]')], shown: layout.marks, keys: layout.keys, token: 0, fig });
  }
  const kpiShown = new Map<KpiId, number | null>(KPI_IDS.map((k, i) => [k, initial.kpi.values[0][i] as number | null]));

  let worker: Worker | null = null;
  let seq = 0, booted = false, ready = false, failed = false, running = false, queued = false, timer = 0;

  const say = (text: string, error = false) => { status.textContent = text; status.dataset.error = String(error); };
  const enable = (on: boolean) => controls.forEach(c => (c.disabled = !on));
  const halt = (text: string) => { failed = true; ready = false; enable(false); say(text, true); worker?.terminate(); };

  const call = (msg: Record<string, unknown>, ms: number, failText: string) => new Promise<Reply>((resolve, reject) => {
    const id = ++seq;
    const t = window.setTimeout(() => reject(Error(failText)), ms);
    worker!.onmessage = ({ data }: MessageEvent<Reply>) => {
      if (data.id !== id) return;
      clearTimeout(t);
      if (data.ok) resolve(data);
      else { console.error(data.error); reject(Error(failText)); }
    };
    worker!.postMessage({ id, ...msg });
  });

  const filter = () => ({
    from: Number(from.value),
    to: Number(to.value),
    merchants: [...form.querySelectorAll<HTMLInputElement>('input[name="merchant"]:checked')].map(i => Number(i.value)),
    areas: [...form.querySelectorAll<HTMLInputElement>('input[name="area"]:checked')].map(i => i.value),
  });

  const sync = () => {
    $<HTMLOutputElement>('#ck-from-out').value = from.value;
    $<HTMLOutputElement>('#ck-to-out').value = to.value;
  };

  function draw(id: ChartId, values: Rows) {
    const c = charts.get(id)!;
    const next = LAYOUT[id](values);
    const start = c.shown;
    const token = ++c.token;
    c.keys = next.keys;
    const legend = id === 'merchants' ? merchantLegend(values, lang) : id === 'reasons' ? reasonLegend(values, lang) : null;
    if (legend) c.fig.querySelectorAll<SVGTextElement>('[data-legend]').forEach((t, i) => (t.textContent = legend[i] ?? ''));
    fillTable(c.fig.querySelector('table[data-table]')!, values, id);
    if (reduced) { c.shown = next.marks; return paint(c.rects, next.marks); }
    const t0 = performance.now();
    const step = (now: number) => {
      if (token !== c.token) return; // a newer result took over
      const k = Math.min(1, (now - t0) / 400);
      c.shown = interpolate(start, next.marks, 1 - (1 - k) ** 3);
      paint(c.rects, c.shown);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function fillTable(table: HTMLTableElement, values: Rows, id: ChartId) {
    const cols = initial[id].columns;
    const head = document.createElement('thead');
    const hr = document.createElement('tr');
    cols.forEach(c => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = c; hr.append(th); });
    head.append(hr);
    const body = document.createElement('tbody');
    values.slice(0, 50).forEach(r => {
      const tr = document.createElement('tr');
      r.forEach(v => { const td = document.createElement('td'); td.textContent = String(v); tr.append(td); });
      body.append(tr);
    });
    table.replaceChildren(head, body);
  }

  function setKpi(k: KpiId, v: number | null) {
    const el = $<HTMLElement>(`[data-kpi="${k}"]`);
    const was = kpiShown.get(k) ?? null;
    kpiShown.set(k, v);
    if (reduced || v === null || was === null) { el.textContent = kpiText(k, v, lang); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      if (kpiShown.get(k) !== v) return;
      const e = 1 - (1 - Math.min(1, (now - t0) / 400)) ** 3;
      el.textContent = e >= 1 ? kpiText(k, v, lang) : kpiText(k, was + (v - was) * e, lang);
      if (e < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function run() {
    if (!ready || failed) return;
    if (running) { queued = true; return; }
    running = true;
    say(T.running);
    try {
      const reply = await call({ action: 'run', queries: RUN.map(id => ({ id, sql: QUERIES[id] })), params: params(filter()) }, 5000, T.runFailed);
      const res = reply.results!;
      KPI_IDS.forEach((k, i) => setKpi(k, res.kpi.values[0][i] as number | null));
      CHARTS.forEach(id => draw(id, res[id].values));
      say(res.kpi.values[0][0] ? T.ready : T.empty);
    } catch (e) {
      halt((e as Error).message);
    } finally {
      running = false;
    }
    if (queued && !failed) { queued = false; run(); }
  }

  const schedule = () => { clearTimeout(timer); timer = window.setTimeout(run, 120); };

  const boot = () => {
    if (booted) return;
    booted = true;
    say(T.loading);
    try { worker = new Worker('/assets/insights-worker.js'); } catch (e) { console.error(e); return halt(T.loadFailed); }
    worker.onerror = e => { e.preventDefault(); halt(T.loadFailed); };
    call({ action: 'init' }, 20000, T.loadFailed)
      .then(() => { if (failed) return; ready = true; enable(true); say(T.ready); })
      .catch(e => { if (!failed) halt((e as Error).message); });
  };

  from.addEventListener('input', () => { if (+from.value > +to.value) to.value = from.value; sync(); schedule(); });
  to.addEventListener('input', () => { if (+to.value < +from.value) from.value = to.value; sync(); schedule(); });
  form.addEventListener('change', e => { if ((e.target as HTMLInputElement).type === 'checkbox') schedule(); });
  form.addEventListener('reset', () => setTimeout(() => { sync(); schedule(); }));
  form.addEventListener('submit', e => e.preventDefault());
  for (const id of ['merchants', 'delivery'] as const) {
    const c = charts.get(id)!;
    c.rects.forEach((rect, i) => rect.addEventListener('click', () => {
      const key = c.keys[i];
      if (key === null || !ready) return;
      const box = form.querySelector<HTMLInputElement>(`input[name="${id === 'merchants' ? 'merchant' : 'area'}"][value="${key}"]`);
      if (box) { box.checked = !box.checked; schedule(); }
    }));
  }

  enable(false);
  say(T.idle);
  new IntersectionObserver((entries, io) => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: '0px 0px -25% 0px' }).observe(root);
  root.addEventListener('focusin', boot, { once: true });
}
```

- [ ] **Step 6: 驾驶舱组件并接入页面**

`src/components/InsightsCockpit.astro`：

```astro
---
import ChartLabels from './ChartLabels.astro';
import { COCKPIT_TEXT, KPI_IDS, kpiText } from '../scripts/cockpit-text';
import { heatmap, pareto, delivery, waffle, VIEW, AREAS, type Rows } from '../scripts/morph';
import { QUERIES } from '../scripts/insights-queries.mjs';
import { merchantName, areaName } from '../scripts/insights-names';
import type { Results } from '../scripts/insights-facts';
import data from '../data/insights.json';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const T = COCKPIT_TEXT[lang];
const R = data.results as unknown as Results;
const CHARTS = [
  { id: 'heatmap', layout: heatmap, label: 'heatmap' },
  { id: 'merchants', layout: pareto, label: 'merchants' },
  { id: 'delivery', layout: delivery, label: 'delivery' },
  { id: 'reasons', layout: waffle, label: 'reasons' },
] as const;
const merchants = [...R.merchants.values].sort((a, b) => Number(a[0]) - Number(b[0]));
const rows = (v: Rows) => v.slice(0, 50);
---
<section class="cockpit night-zone" data-cockpit data-insight-data data-lang={lang} aria-labelledby="ck-h">
  <div class="wrap">
    <div class="section-head"><h2 id="ck-h">{T.title}</h2><span class="label">{T.kicker}</span></div>
    <p id="ck-status" class="ck-status" role="status" aria-live="polite">{T.idle}</p>
    <form id="ck-form" class="ck-form">
      <fieldset class="ck-weeks">
        <legend>{T.weeks}</legend>
        <label>{T.from} <input id="ck-from" type="range" min="1" max="16" value="1" disabled /> <output id="ck-from-out" for="ck-from">1</output> {T.week}</label>
        <label>{T.to} <input id="ck-to" type="range" min="1" max="16" value="16" disabled /> <output id="ck-to-out" for="ck-to">16</output> {T.week}</label>
      </fieldset>
      <fieldset>
        <legend>{T.merchants}</legend>
        <div class="chips">{merchants.map(([id, name]) => <label class="chip"><input type="checkbox" name="merchant" value={String(id)} disabled /><span>{merchantName(String(name), lang)}</span></label>)}</div>
      </fieldset>
      <fieldset>
        <legend>{T.areas}</legend>
        <div class="chips">{AREAS.map(a => <label class="chip"><input type="checkbox" name="area" value={a} disabled /><span>{areaName(a, lang)}</span></label>)}</div>
      </fieldset>
      <button id="ck-reset" type="reset" class="secondary" disabled>{T.reset}</button>
    </form>
    <dl class="ck-kpis">
      {KPI_IDS.map((k, i) => <div><dt>{T.kpi[k]}</dt><dd data-kpi={k}>{kpiText(k, R.kpi.values[0][i] as number | null, lang)}</dd></div>)}
    </dl>
    <div class="ck-charts">
      {CHARTS.map(c => (
        <figure class="ck-chart" data-chart={c.id}>
          <figcaption>{T.charts[c.id]}</figcaption>
          <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
            {c.layout(R[c.id].values).marks.map((m, i) => <rect data-m={i} x={m.x.toFixed(1)} y={m.y.toFixed(1)} width={m.w.toFixed(1)} height={m.h.toFixed(1)} fill-opacity={m.a.toFixed(3)} class:list={[{ red: m.red === 1 }]} />)}
            <ChartLabels kind={c.label} results={R} lang={lang} />
          </svg>
          <details>
            <summary>{T.viewSql}</summary>
            <pre data-sql tabindex="0"><code>{QUERIES[c.id].split('\n').map((line, i) => <span style={`--i:${i}`}>{line + '\n'}</span>)}</code></pre>
            <div class="table-wrap" role="region" tabindex="0" aria-label={T.resultLabel}>
              <table data-table>
                <thead><tr>{R[c.id].columns.map(col => <th scope="col">{col}</th>)}</tr></thead>
                <tbody>{rows(R[c.id].values).map(r => <tr>{r.map(v => <td>{String(v)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </details>
        </figure>
      ))}
    </div>
    <p class="ck-hint">{T.clickHint}</p>
  </div>
</section>
<script>
  import { initCockpit } from '../scripts/cockpit-ui';
  import data from '../data/insights.json';
  import type { Results } from '../scripts/insights-facts';
  document.querySelectorAll<HTMLElement>('[data-cockpit]').forEach(el => initCockpit(el, data.results as unknown as Results));
</script>
<style>
  .cockpit { padding-bottom: 56px; }
  .ck-status { margin: 18px 0; color: var(--night-mute); font-size: 14px; }
  .ck-status[data-error='true'] { color: var(--night-fg); border-left: 3px solid var(--red); padding-left: 10px; }
  .ck-form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr) auto; gap: 16px 28px; align-items: start; }
  fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
  legend { margin-bottom: 8px; font: 700 12px/1 var(--font-display); letter-spacing: 0.2em; text-transform: uppercase; color: var(--night-mute); }
  .ck-weeks label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
  input[type='range'] { flex: 1; accent-color: var(--red); }
  output { min-width: 2ch; font: 700 18px/1 var(--font-display); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { position: relative; }
  .chip input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
  .chip span { display: inline-block; padding: 5px 10px; border: 1.5px solid var(--night-mute); font-size: 13px; }
  .chip input:checked + span { background: var(--red); border-color: var(--red); color: var(--night); }
  .chip input:focus-visible + span { outline: 3px solid var(--night-fg); outline-offset: 2px; }
  .chip input:disabled + span { opacity: 0.45; }
  button.secondary { padding: 8px 14px; border: 1.5px solid var(--night-fg); background: transparent; color: var(--night-fg); cursor: pointer; }
  button:disabled { opacity: 0.45; cursor: default; }
  .ck-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); margin: 32px 0 8px; border-top: 1.5px solid var(--night-fg); }
  .ck-kpis div { padding: 14px 12px 14px 0; }
  .ck-kpis dt { color: var(--night-mute); font-size: 13px; }
  .ck-kpis dd { font: 700 clamp(28px, 3.4vw, 52px)/1 var(--font-display); font-variant-numeric: tabular-nums; }
  .ck-charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px 40px; margin-top: 24px; }
  .ck-chart { margin: 0; min-width: 0; color: var(--night-fg); }
  .ck-chart figcaption { margin-bottom: 8px; font-weight: 500; }
  .ck-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
  .ck-chart rect { fill: currentColor; }
  .ck-chart rect.red { fill: var(--red); }
  [data-chart='merchants'] rect, [data-chart='delivery'] rect { cursor: pointer; }
  details { margin-top: 10px; font-size: 13px; }
  summary { cursor: pointer; color: var(--night-mute); }
  pre { max-height: 320px; overflow: auto; margin: 10px 0; padding: 12px 14px; background: #000; font: 12px/1.55 Consolas, 'Cascadia Mono', monospace; }
  /* Spans stay inline so each trailing newline breaks the line exactly once; opacity is all that animates. */
  details[open] pre span { animation: line-in 0.3s var(--ease) both; animation-delay: calc(var(--i) * 25ms); }
  @keyframes line-in { from { opacity: 0; } }
  .table-wrap { overflow-x: auto; }
  table { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
  th, td { padding: 4px 8px; border-bottom: 1px solid rgb(236 228 214 / 0.2); text-align: right; }
  .ck-hint { margin-top: 20px; color: var(--night-mute); font-size: 13px; }
  @media (max-width: 800px) {
    .ck-form { grid-template-columns: minmax(0, 1fr); }
    .ck-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ck-charts { grid-template-columns: minmax(0, 1fr); }
  }
</style>
```

说明：`pre` 的 `#000` 背景与 2A 方法页代码块同属暂缓小问题（不在调色板内）；若执行者改为 `var(--ink)`，记 Ruling。

`src/views/InsightsView.astro`：导入 `InsightsCockpit`，`demo` 插槽改为：

```astro
  <Fragment slot="demo">
    <InsightsStory lang={lang} />
    <InsightsCockpit lang={lang} />
  </Fragment>
```

- [ ] **Step 7: 运行，确认通过**

Run: `npx vitest run tests/unit/cockpit-text.test.ts && npx playwright test tests/e2e/insights.spec.ts`
Expected: 全部 PASS。`"View SQL"` 测试按"空白折叠后相等"比较，不受 Astro 输出压缩影响。

- [ ] **Step 8: 提交**

```bash
git add public/assets/insights-worker.js src/scripts/cockpit-text.ts src/scripts/cockpit-ui.ts src/components/InsightsCockpit.astro src/views/InsightsView.astro tests/unit/cockpit-text.test.ts tests/e2e/insights.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights dashboard: live SQL in a worker, linked charts and indicators, click-to-filter, readable load failure" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 全站验收

**Files:**
- Modify: 仅在验收暴露问题时修改（每处修改记 Ruling）

**Interfaces:**
- Consumes: Task 1–7 的全部产出。
- Produces: 全绿的测试套件；`test-results/screens/` 下进阶版中英、桌面与手机的整页截图。

- [ ] **Step 1: 全量单元测试**

Run: `npm test`
Expected: 全部 PASS（2A 的 70 条 + 本计划新增约 33 条）。

- [ ] **Step 2: 全量端到端测试**

Run: `npx playwright test`
Expected: 全部 PASS（被跳过的只有按设备有意跳过的用例）。

- [ ] **Step 3: 看截图**

用 Read 打开 `test-results/screens/desktop-projects-campus-delivery-insights.png`、`mobile-projects-campus-delivery-insights.png`、`desktop-en-projects-campus-delivery-insights.png`，检查：开场巨字没有被裁切；舞台在右侧（桌面）或上方（手机）；驾驶舱四张图无重叠、指标条完整；方法区的参数表与 SQL 可读。发现问题就修，修完重跑 Step 2，并记 Ruling。

- [ ] **Step 4: 提交（仅当 Step 3 有修改）**

```bash
git add -A src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights: acceptance fixes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
