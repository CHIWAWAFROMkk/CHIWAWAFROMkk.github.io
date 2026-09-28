# 作品集重做 · 第二阶段 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `redesign` 分支上做出深入版总目录 `/projects/`、校园外卖 SQL 项目页（工作台按需加载）、CSV 工具页及其"过程与运行"子页，全部中英双语，并通过验收。

**Architecture:** 交互内核原样迁移：`delivery-worker.js`、`delivery-core.mjs`、sql.js 放在 `public/assets/`（Worker 按原路径加载），CSV 计算模块 `analysis-core.mjs` 移入 `src/scripts/` 并由测试保证与可下载源码包逐字节一致。界面脚本改写成接收语言参数的 TypeScript 模块，中英文字典和英文 SQL 放在独立数据文件里。项目页继续使用第一阶段的 `ProjectLayout`（五栏摘要 + `demo` 插槽 + Markdown 正文）。

**Tech Stack:** Astro 7、TypeScript、Vitest、Playwright（Edge，测试服务器 `tools/serve-dist.mjs`，端口 4399）、sql.js 1.14.2（原 vendor 文件）。

**Spec:** `docs/superpowers/specs/2026-09-28-portfolio-redesign-design.md`（第 5、9、10、13 节第二阶段部分）

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；不推送、不部署。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。
- 沿用第一阶段的全部视觉规则：颜色只用 `src/data/tokens.ts` 的变量；直角、无阴影；悬停不改变尺寸；`prefers-reduced-motion` 下无动画。
- 页面上关于作者本人的数字必须来自 `src/data/facts.ts`；演示数据（合成订单、构造样本）的数字放在带 `data-demo` 属性的容器里，不受该检查约束。
- 英文页的演示数据值（商家名、菜品名、学生名）保持中文，界面文字、查询名、说明、列名、错误提示用英文；页面注明 "Demo data is in Chinese"。
- 旧网址 `/projects/campus-delivery/`、`/projects/stock-data/`、`/projects/stock-data/method/`、`/downloads/**`、`/assets/sample.csv` 必须可访问。
- 本计划的中文正文逐字迁移自 `legacy/projects/**/index.html`（只删改与新模板重复的段落，不改事实）；英文正文由执行者翻译，交付时列入"待用户过目"。

## Review Focus

1. **SQL 引擎加载失败或超时**（国内网络拉不到 700 KB 的 wasm）：工作台显示可理解的错误，页面其他部分照常可读，按钮不会永远停在"运行中" → 测试加在 Task 4（`engine fails to load`，拦截 wasm 请求）。
2. **在英文页触发中文内核抛出的错误**（下单份数超范围、非法 CSV）：英文页显示英文提示 → 单元测试在 Task 2，端到端在 Task 4、Task 5。
3. **粘贴或上传坏 CSV 后再加载好数据**：旧结果在出错时保留，之后能正常恢复 → 测试加在 Task 5（`bad paste keeps previous result`）。
4. **窄屏下的宽表格**（SQL 结果、字段质量表、数据预览）：页面本身不横向溢出，表格在自己的可聚焦容器里横向滚动 → 测试加在 Task 4、Task 5（`noHorizontalOverflow` + axe）。
5. **工作台尚未加载时就点"运行"或提交订单**：不报 JS 错误，触发加载后完成操作 → 测试加在 Task 4（`first interaction boots the engine`）。

---

## 文件结构

```
public/assets/vendor/sql-wasm.js, sql-wasm.wasm, LICENSE   ← git mv 自 legacy/assets/vendor
public/assets/delivery-worker.js, delivery-core.mjs, delivery-schema.sql   ← git mv
public/assets/sample.csv                                      ← git mv
public/assets/editorial/delivery-relations.svg, csv-process.svg ← git mv 后换色
src/scripts/analysis-core.mjs     ← git mv 自 legacy/assets（与 downloads/source 版逐字节一致）
src/scripts/tool-i18n.ts          错误提示翻译
src/scripts/delivery-queries.ts   10 条业务查询（中 / 英）
src/scripts/delivery-text.ts      SQL 工作台界面文字（中 / 英）
src/scripts/delivery-ui.ts        SQL 工作台、分析卡跳转、下单演示（按需加载）
src/scripts/lab-text.ts           CSV 工具界面文字（中 / 英）
src/scripts/lab-ui.ts             CSV 工具
src/components/CampusDemo.astro   工作台 + 经营分析 + 下单演示
src/components/CsvLab.astro       CSV 工具
src/copy/projects/campus-delivery.{zh,en}.md
src/copy/projects/stock-data.{zh,en}.md
src/copy/projects/stock-data-method.{zh,en}.md
src/views/CampusView.astro  StockDataView.astro  MethodView.astro  ProjectsView.astro
src/pages/projects/{index,campus-delivery,stock-data}.astro, projects/stock-data/method.astro
src/pages/en/projects/{index,campus-delivery,stock-data}.astro, en/projects/stock-data/method.astro
src/data/site.ts   ← 新增 pages.projects / pages.campus / pages.stock / pages.method（摘要里不出现事实清单以外的数字）
tests/unit/{assets,tool-i18n,delivery-queries}.test.ts
tests/e2e/{campus,csv-lab,method,projects-index}.spec.ts
tests/e2e/helpers.ts ← PHASE1_PAGES 扩为 PAGES，PHASE2_PENDING 删去已完成页面
```

---

### Task 1: 迁移运行时文件与示意图

**Files:**
- Move: 见上方"文件结构"中的 git mv 项
- Create: `tests/unit/assets.test.ts`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: 网址 `/assets/vendor/sql-wasm.{js,wasm}`、`/assets/delivery-worker.js`、`/assets/delivery-core.mjs`、`/assets/delivery-schema.sql`、`/assets/sample.csv`、`/assets/editorial/{delivery-relations,csv-process}.svg`；模块 `src/scripts/analysis-core.mjs`（导出与原文件相同：`parseCSV, numeric, quantile, stats, analyze, histogram, csvExport, VERSION, LIMIT`）。

- [ ] **Step 1: 写失败的测试**

`tests/unit/assets.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('shipped runtime files', () => {
  it('the CSV module on the site is byte-identical to the one in the download package', () => {
    expect(readFileSync('src/scripts/analysis-core.mjs')).toEqual(readFileSync('public/downloads/source/analysis-core.mjs'));
  });

  it('diagrams use only the site palette', () => {
    const allowed = new Set(['#0f0f0f', '#6b6a64', '#a39c8f', '#d9d7cf', '#e6e5de', '#f2f1ec', '#f6d5ca', '#e8380d', '#ffffff', '#fff']);
    for (const f of ['delivery-relations', 'csv-process']) {
      const svg = readFileSync(`public/assets/editorial/${f}.svg`, 'utf8');
      for (const c of svg.match(/#[0-9a-f]{3,6}\b/gi) ?? []) expect(allowed, `${f}: ${c}`).toContain(c.toLowerCase());
    }
  });
});
```

在 `tests/e2e/smoke.spec.ts` 的网址数组末尾追加：

```ts
    '/assets/vendor/sql-wasm.wasm',
    '/assets/delivery-worker.js',
    '/assets/delivery-core.mjs',
    '/assets/delivery-schema.sql',
    '/assets/sample.csv',
    '/assets/editorial/delivery-relations.svg',
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/unit/assets.test.ts`
Expected: FAIL（ENOENT：src/scripts/analysis-core.mjs）

- [ ] **Step 3: 移动文件并换色**

```powershell
New-Item -ItemType Directory -Force public/assets/editorial | Out-Null
git mv legacy/assets/vendor public/assets/vendor
git mv legacy/assets/delivery-worker.js public/assets/delivery-worker.js
git mv legacy/assets/delivery-core.mjs public/assets/delivery-core.mjs
git mv legacy/assets/delivery-schema.sql public/assets/delivery-schema.sql
git mv legacy/assets/sample.csv public/assets/sample.csv
git mv legacy/assets/analysis-core.mjs src/scripts/analysis-core.mjs
git mv legacy/assets/editorial/delivery-relations.svg public/assets/editorial/delivery-relations.svg
git mv legacy/assets/editorial/csv-process.svg public/assets/editorial/csv-process.svg
$map = @{ '#192622'='#0f0f0f'; '#53635b'='#6b6a64'; '#73867e'='#6b6a64'; '#8daba0'='#a39c8f'; '#cad8d1'='#d9d7cf'; '#d1ffca'='#f6d5ca'; '#e9eee7'='#f2f1ec'; '#edf0eb'='#f2f1ec'; '#ddd8ca'='#e6e5de' }
foreach ($f in 'delivery-relations','csv-process') {
  $p = "public/assets/editorial/$f.svg"; $c = Get-Content $p -Raw
  foreach ($k in $map.Keys) { $c = $c -ireplace [regex]::Escape($k), $map[$k] }
  Set-Content $p $c -NoNewline
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/unit/assets.test.ts; npx playwright test tests/e2e/smoke.spec.ts --project=desktop`
Expected: PASS

- [ ] **Step 5: 提交** — `git add -A` 后提交 "Move SQL and CSV runtime files into public/ and recolour diagrams"。

---

### Task 2: 错误提示翻译

**Files:** Create `src/scripts/tool-i18n.ts`、`tests/unit/tool-i18n.test.ts`

**Interfaces:**
- Produces: `type ErrorRule = [string | RegExp, string]`；`CSV_ERRORS: ErrorRule[]`；`DELIVERY_ERRORS: ErrorRule[]`；`localizeError(message: string, lang: Lang, rules: ErrorRule[]): string`（中文原样返回；英文按规则替换，正则支持 `$1`；无匹配原样返回）。

- [ ] **Step 1: 写失败的测试**

```ts
import { describe, it, expect } from 'vitest';
import { localizeError, CSV_ERRORS, DELIVERY_ERRORS } from '../../src/scripts/tool-i18n';

describe('localizeError', () => {
  it('leaves Chinese untouched', () => {
    expect(localizeError('只有表头，没有数据行。', 'zh', CSV_ERRORS)).toBe('只有表头，没有数据行。');
  });
  it('translates fixed CSV messages', () => {
    expect(localizeError('只有表头，没有数据行。', 'en', CSV_ERRORS)).toBe('Only a header row — no data rows.');
  });
  it('translates templated messages and keeps the number', () => {
    expect(localizeError('第 7 条数据记录的列数与表头不一致，请检查分隔符或缺失的逗号。', 'en', CSV_ERRORS))
      .toBe('Record 7 has a different number of columns from the header — check the delimiter or a missing comma.');
  });
  it('translates delivery core errors', () => {
    expect(localizeError('份数须为 1–20 的整数', 'en', DELIVERY_ERRORS)).toBe('Quantity must be a whole number from 1 to 20');
  });
  it('passes through messages it does not know (e.g. SQLite errors)', () => {
    expect(localizeError('no such table: foo', 'en', DELIVERY_ERRORS)).toBe('no such table: foo');
  });
});
```

- [ ] **Step 2: 运行确认失败** — `npx vitest run tests/unit/tool-i18n.test.ts` → FAIL（模块不存在）

- [ ] **Step 3: 实现**

```ts
import type { Lang } from '../i18n';

export type ErrorRule = [string | RegExp, string];

export const CSV_ERRORS: ErrorRule[] = [
  ['文件超过 2 MB，请先拆分数据。', 'The file is over 2 MB — split it first.'],
  ['文件超过 2 MB，请先拆分。原有结果未改变。', 'The file is over 2 MB — split it first. The previous result is unchanged.'],
  ['没有数据。请上传 CSV，或粘贴包含表头的数据。', 'No data. Upload a CSV or paste data with a header row.'],
  ['不支持的分隔符。', 'Unsupported delimiter.'],
  ['最多支持 20,000 行数据。', 'At most 20,000 data rows are supported.'],
  ['引号格式不正确。含分隔符的内容请用双引号包围。', 'Malformed quotes. Wrap values that contain the delimiter in double quotes.'],
  ['存在未闭合的双引号，请检查 CSV。', 'A double quote is never closed — check the CSV.'],
  ['需要表头，且最多支持 100 列。', 'A header row is required, with at most 100 columns.'],
  ['表头不能为空或重复，请修改后再导入。', 'Headers must be non-empty and unique.'],
  ['只有表头，没有数据行。', 'Only a header row — no data rows.'],
  [/^第 (\d+) 条数据记录的列数与表头不一致，请检查分隔符或缺失的逗号。$/, 'Record $1 has a different number of columns from the header — check the delimiter or a missing comma.'],
];

export const DELIVERY_ERRORS: ErrorRule[] = [
  ['份数须为 1–20 的整数', 'Quantity must be a whole number from 1 to 20'],
  ['菜品不存在', 'That dish does not exist'],
  ['订单不存在', 'That order does not exist'],
  ['数据库尚未载入', 'The database has not loaded yet'],
  ['请输入 1–12000 字符的 SQL', 'Enter 1–12,000 characters of SQL'],
  ['一次最多执行 10 条语句', 'At most 10 statements per run'],
];

export function localizeError(message: string, lang: Lang, rules: ErrorRule[]): string {
  if (lang === 'zh') return message;
  for (const [pattern, en] of rules) {
    if (typeof pattern === 'string' ? pattern === message : pattern.test(message)) {
      return typeof pattern === 'string' ? en : message.replace(pattern, en);
    }
  }
  return message;
}
```

- [ ] **Step 4: 运行确认通过**；**Step 5: 提交** "Add error message translation for the SQL and CSV tools"。

---

### Task 3: 双语业务查询

**Files:** Create `src/scripts/delivery-queries.ts`、`tests/unit/delivery-queries.test.ts`

**Interfaces:**
- Produces: `interface DeliveryQuery { name: string; note: string; sql: string }`；`DELIVERY_QUERIES: Record<Lang, DeliveryQuery[]>`（各 10 条，顺序相同；第 7、8 条对应经营分析卡片的跳转，下标 6、7）。

- [ ] **Step 1: 写失败的测试**

```ts
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DELIVERY_QUERIES } from '../../src/scripts/delivery-queries';
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
      expect(q.sql).not.toMatch(/[\u4e00-\u9fff]/); // no Chinese identifiers in English SQL
    }
  });

  it('every English query runs on the demo database and returns the same shape as its Chinese twin', async () => {
    const initSqlJs = require(resolve('public/assets/vendor/sql-wasm.js'));
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
```

- [ ] **Step 2: 运行确认失败** — FAIL（模块不存在）

- [ ] **Step 3: 实现**

`src/scripts/delivery-queries.ts` 的 `zh` 数组：把 `public/assets/delivery-core.mjs` 里 `export const queries=[ … ];` 的数组字面量**原样复制**过来（10 个对象，名称、说明、SQL 一字不改）。`en` 数组如下：

```ts
import type { Lang } from '../i18n';

export interface DeliveryQuery { name: string; note: string; sql: string }

const zh: DeliveryQuery[] = [ /* 原样复制 delivery-core.mjs 的 queries 数组内容 */ ];

const en: DeliveryQuery[] = [
  { name: 'Net revenue by merchant', note: 'Payments minus full refunds. Order items are not joined to payments, so multi-dish orders are not double-counted.', sql: `SELECT m.name AS merchant, COUNT(o.id) AS orders,
ROUND(COALESCE(SUM(p.amount_cents),0)/100.0,2) AS paid_yuan,
ROUND(COALESCE(SUM(r.amount_cents),0)/100.0,2) AS refunded_yuan,
ROUND((COALESCE(SUM(p.amount_cents),0)-COALESCE(SUM(r.amount_cents),0))/100.0,2) AS net_yuan
FROM merchants m LEFT JOIN orders o ON o.merchant_id=m.id
LEFT JOIN payments p ON p.order_id=o.id
LEFT JOIN refunds r ON r.order_id=o.id
GROUP BY m.id,m.name ORDER BY net_yuan DESC;` },
  { name: 'Best-selling dishes', note: 'Refunded orders excluded; ranked within each merchant, using the price at the time of sale rather than today\'s menu price.', sql: `WITH sales AS (
 SELECT m.name AS merchant,d.name AS dish,SUM(i.quantity) AS portions,
 ROUND(SUM(i.quantity*i.unit_price_cents)/100.0,2) AS amount_yuan
 FROM order_items i JOIN orders o ON o.id=i.order_id
 JOIN dishes d ON d.id=i.dish_id JOIN merchants m ON m.id=i.merchant_id
 WHERE o.status!='refunded' GROUP BY m.id,d.id
)
SELECT *, DENSE_RANK() OVER(PARTITION BY merchant ORDER BY portions DESC) AS rank_in_shop
FROM sales ORDER BY merchant,rank_in_shop;` },
  { name: 'Repeat students', note: 'Students with at least two non-refunded orders in this dataset count as repeat buyers for the period; this is not a retention rate.', sql: `WITH counts AS (
 SELECT student_id,COUNT(*) AS n FROM orders
 WHERE status!='refunded' GROUP BY student_id
)
SELECT COUNT(*) AS buying_students,SUM(n>=2) AS repeat_students,
ROUND(100.0*SUM(n>=2)/NULLIF(COUNT(*),0),2) AS repeat_percent
FROM counts;` },
  { name: 'Delivery speed', note: 'Delivered orders only, minutes from order to delivery; over 40 minutes counts as late in this project.', sql: `SELECT m.name AS merchant,COUNT(*) AS delivered,
ROUND(AVG((julianday(d.delivered_at)-julianday(o.created_at))*1440),1) AS avg_minutes,
SUM((strftime('%s',d.delivered_at)-strftime('%s',o.created_at))>2400) AS late_orders
FROM orders o JOIN deliveries d ON d.order_id=o.id
JOIN merchants m ON m.id=o.merchant_id
WHERE o.status='delivered' GROUP BY m.id;` },
  { name: 'Order reconciliation', note: 'Checks that order, line-item and payment amounts agree; a healthy result is zero rows.', sql: `SELECT o.id AS order_id,o.total_cents AS order_cents,
SUM(i.quantity*i.unit_price_cents) AS items_cents,p.amount_cents AS paid_cents
FROM orders o LEFT JOIN order_items i ON i.order_id=o.id
LEFT JOIN payments p ON p.order_id=o.id GROUP BY o.id
HAVING o.total_cents!=COALESCE(SUM(i.quantity*i.unit_price_cents),0)
OR o.total_cents!=COALESCE(p.amount_cents,0);` },
  { name: 'Query plan', note: 'The composite index serves "student + time" lookups; this reads SQLite\'s actual plan.', sql: `EXPLAIN QUERY PLAN
SELECT id,status,total_cents FROM orders
WHERE student_id=3 AND created_at>='2024-04-01'
ORDER BY created_at;` },
  { name: '── Analysis ── Overview', note: 'GMV = all payments; net revenue = GMV − refunds; refund rate = refunded orders ÷ all orders. Matches the "Overview" figures below.', sql: `SELECT
  COUNT(*)                                             AS total_orders,
  SUM(o.status='delivered')                           AS delivered,
  SUM(o.status='refunded')                            AS refunded,
  SUM(o.status='paid')                                AS awaiting_delivery,
  ROUND(SUM(p.amount_cents)/100.0,2)                 AS gmv_yuan,
  ROUND(COALESCE(SUM(r.amount_cents),0)/100.0,2)     AS refunds_yuan,
  ROUND((SUM(p.amount_cents)
        -COALESCE(SUM(r.amount_cents),0))/100.0,2)   AS net_yuan,
  ROUND(100.0*SUM(o.status='refunded')/COUNT(*),1)   AS refund_rate_percent
FROM orders o
JOIN  payments p ON p.order_id=o.id
LEFT JOIN refunds  r ON r.order_id=o.id;` },
  { name: '── Analysis ── Dish GMV ranking', note: 'Refunds excluded; uses the price at the time of sale (unit_price_cents), so later price changes do not rewrite history. Matches "Dish GMV top 5".', sql: `SELECT
  d.name                                               AS dish,
  m.name                                               AS merchant,
  SUM(i.quantity)                                      AS portions,
  ROUND(d.price_cents/100.0,2)                        AS current_price_yuan,
  ROUND(SUM(i.quantity*i.unit_price_cents)/100.0,2)   AS dish_gmv_yuan
FROM order_items i
JOIN orders    o ON o.id=i.order_id
JOIN dishes    d ON d.id=i.dish_id
JOIN merchants m ON m.id=i.merchant_id
WHERE o.status != 'refunded'
GROUP BY d.id,d.name,m.name,d.price_cents
ORDER BY dish_gmv_yuan DESC;` },
  { name: '── Analysis ── Spending by student', note: 'Average order value = total spend ÷ orders; more than one refund can serve as a risk flag.', sql: `SELECT
  s.name                                               AS student,
  s.dorm                                               AS dorm,
  COUNT(o.id)                                          AS orders,
  SUM(o.status='refunded')                             AS refunds,
  ROUND(SUM(p.amount_cents)/100.0,2)                  AS total_yuan,
  ROUND(AVG(p.amount_cents)/100.0,2)                  AS avg_order_yuan
FROM students s
JOIN orders   o ON o.student_id=s.id
JOIN payments p ON p.order_id=o.id
GROUP BY s.id,s.name,s.dorm
ORDER BY total_yuan DESC;` },
  { name: '── Analysis ── Refund risk', note: 'Students with two or more refunds appear in this dataset. In practice this should trigger a manual check, not a ban.', sql: `WITH refund_counts AS (
  SELECT o.student_id, COUNT(*) AS n
  FROM orders o
  WHERE o.status='refunded'
  GROUP BY o.student_id
)
SELECT
  s.name    AS student,
  s.dorm    AS dorm,
  rc.n      AS refunds,
  CASE WHEN rc.n>=2 THEN 'review' ELSE 'ok' END AS risk_flag
FROM refund_counts rc
JOIN students s ON s.id=rc.student_id
ORDER BY rc.n DESC;` },
];

export const DELIVERY_QUERIES: Record<Lang, DeliveryQuery[]> = { zh, en };
```

- [ ] **Step 4: 运行确认通过**；**Step 5: 提交** "Add bilingual business queries for the SQL workbench"。

---

### Task 4: 校园外卖 SQL 项目页

**Files:**
- Create: `src/scripts/delivery-text.ts`、`src/scripts/delivery-ui.ts`、`src/components/CampusDemo.astro`、`src/copy/projects/campus-delivery.{zh,en}.md`、`src/views/CampusView.astro`、`src/pages/projects/campus-delivery.astro`、`src/pages/en/projects/campus-delivery.astro`、`tests/e2e/campus.spec.ts`
- Modify: `src/data/site.ts`（新增 `pages.campus`）

**Interfaces:**
- Consumes: `DELIVERY_QUERIES`、`DELIVERY_ERRORS`、`localizeError`、`ProjectLayout`
- Produces: `initDelivery(root: HTMLElement): void`；DOM 约定：根元素 `[data-campus][data-lang][data-demo]`；元素 id 与旧页面相同（`query-preset, query-note, sql-input, run-query, cancel-query, export-csv, sql-status, sql-results, student, dish, quantity, order-total, place-order, order-form, order-status, order-list, reset-db, download-db, schema-source`），外加跳转按钮 `[data-jump="<下标>"]`。

- [ ] **Step 1: 写失败的端到端测试**

`tests/e2e/campus.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

const status = '#sql-status';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`campus delivery (${lang})`, () => {
    test('the SQL engine is not downloaded until the workbench comes into view', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      const wasm: string[] = [];
      page.on('request', r => { if (r.url().endsWith('.wasm')) wasm.push(r.url()); });
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.waitForTimeout(800);
      expect(wasm).toEqual([]);
      await page.locator('[data-campus]').scrollIntoViewIfNeeded();
      await expect(page.locator(status)).toHaveText(lang === 'zh' ? /\d+ 行/ : /\d+ rows?/, { timeout: 20000 });
      expect(wasm.length).toBe(1);
      expect(await page.locator('#sql-results tbody tr').count()).toBeGreaterThan(0);
    });

    test('placing an order and refunding it updates the order list', async ({ page }) => {
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator('#order-form').scrollIntoViewIfNeeded();
      await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
      await page.locator('#place-order').click();
      await expect(page.locator('#order-status')).toContainText(lang === 'zh' ? '已提交' : 'placed');
      await page.locator('[data-refund]').first().click();
      await expect(page.locator('#order-status')).toContainText(lang === 'zh' ? '已全额退款' : 'refunded');
      expect(await noHorizontalOverflow(page)).toBe(true);
    });

    test('an out-of-range quantity is refused in the page language', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator('#order-form').scrollIntoViewIfNeeded();
      await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
      await page.locator('#quantity').evaluate(el => { (el as HTMLInputElement).removeAttribute('max'); (el as HTMLInputElement).value = '25'; });
      await page.locator('#place-order').click();
      await expect(page.locator('#order-status')).toContainText(lang === 'zh' ? '份数须为 1–20 的整数' : 'Quantity must be a whole number from 1 to 20');
    });

    test('an analysis card jumps to its query in the workbench', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator('[data-jump="7"]').click();
      await expect(page.locator('#query-preset')).toHaveValue('7');
      await expect(page.locator('#sql-input')).toHaveValue(/unit_price_cents/);
    });
  });
}

test('first interaction boots the engine even before it scrolls into view', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto('/projects/campus-delivery/');
  await page.locator('#sql-input').focus();
  await expect(page.locator(status)).toHaveText(/\d+ 行/, { timeout: 20000 });
});

test('engine fails to load: a readable error, the rest of the page still works', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.route('**/*.wasm', r => r.abort());
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/projects/campus-delivery/');
  await page.locator('[data-campus]').scrollIntoViewIfNeeded();
  await expect(page.locator(status)).toHaveAttribute('data-error', 'true', { timeout: 25000 });
  await expect(page.locator('#run-query')).toBeDisabled();
  await expect(page.locator('#cancel-query')).toBeDisabled();
  await expect(page.locator('.prose h2').first()).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: 运行确认失败** — `npx playwright test tests/e2e/campus.spec.ts --project=desktop` → 页面 404。

- [ ] **Step 3: 界面文字**

`src/scripts/delivery-text.ts`：

```ts
import type { Lang } from '../i18n';

export interface DeliveryText {
  idle: string; loading: string; running: string; loadTimeout: string; runTimeout: string; engineError: string;
  stopped: string; busy: string; reload: string; noSqlFile: string;
  rows: (n: number, ms: number, truncated: boolean) => string;
  status: Record<'paid' | 'delivered' | 'refunded', string>;
  dishOption: (merchant: string, name: string, yuan: string, stock: number) => string;
  student: (n: string) => string;
  total: (yuan: string) => string; totalInvalid: string;
  placed: (id: number) => string; placeFailed: (msg: string) => string;
  refunded: (id: number) => string; refundButton: string; reset: string;
  orderLine: (id: number, merchant: string, yuan: string) => string;
}

export const DELIVERY_TEXT: Record<Lang, DeliveryText> = {
  zh: {
    idle: '滚动到这里时载入 SQLite（约 700 KB）。',
    loading: '正在载入 SQLite…', running: '正在执行 SQL…',
    loadTimeout: '数据库加载超时，请刷新重试。', runTimeout: '运行已停止：超过 3 秒限制。',
    engineError: '运行引擎出错，已保留上次成功提交的数据。', stopped: '已停止运行。',
    busy: '请等待当前操作完成', reload: ' 请刷新页面重试。', noSqlFile: '请下载建表与数据 SQL。',
    rows: (n, ms, t) => `${n} 行 · ${ms} ms${t ? ' · 已截取前 500 行' : ''}${n === 0 ? ' · 查询成功，无匹配记录' : ''}`,
    status: { paid: '已支付 · 未送达', delivered: '已送达', refunded: '已退款' },
    dishOption: (m, name, y, s) => `${m} / ${name} · ¥${y} · 库存 ${s}`,
    student: n => `同学 ${n}`,
    total: y => `订单金额 ¥${y}`, totalInvalid: '请输入 1–20 份',
    placed: id => `订单 #${id} 已提交；明细、支付、配送记录及库存同步更新。`, placeFailed: m => `下单未提交：${m}`,
    refunded: id => `订单 #${id} 已全额退款，库存已恢复。`, refundButton: '取消退款', reset: '已恢复初始演示订单。',
    orderLine: (id, m, y) => `#${id} ${m} · ¥${y}`,
  },
  en: {
    idle: 'SQLite (about 700 KB) loads when you scroll here.',
    loading: 'Loading SQLite…', running: 'Running SQL…',
    loadTimeout: 'The database took too long to load — please refresh.', runTimeout: 'Stopped: the 3-second limit was reached.',
    engineError: 'The engine failed; the last committed data is kept.', stopped: 'Stopped.',
    busy: 'Please wait for the current operation to finish', reload: ' Please refresh the page.', noSqlFile: 'Download the schema and data SQL instead.',
    rows: (n, ms, t) => `${n} ${n === 1 ? 'row' : 'rows'} · ${ms} ms${t ? ' · first 500 rows shown' : ''}${n === 0 ? ' · query succeeded, no matching records' : ''}`,
    status: { paid: 'paid · not delivered', delivered: 'delivered', refunded: 'refunded' },
    dishOption: (m, name, y, s) => `${m} / ${name} · ¥${y} · stock ${s}`,
    student: n => `同学 ${n}`,
    total: y => `Order total ¥${y}`, totalInvalid: 'Enter 1–20 portions',
    placed: id => `Order #${id} placed; items, payment, delivery and stock updated together.`, placeFailed: m => `Order not placed: ${m}`,
    refunded: id => `Order #${id} refunded in full; stock restored.`, refundButton: 'Cancel & refund', reset: 'Initial demo orders restored.',
    orderLine: (id, m, y) => `#${id} ${m} · ¥${y}`,
  },
};
```

- [ ] **Step 4: 界面脚本**

`src/scripts/delivery-ui.ts`（逻辑逐行对应 `legacy/assets/delivery.mjs`，改动只有：语言字典、错误翻译、按需加载、跳转按钮不用内联 onclick）：

```ts
import { DELIVERY_QUERIES } from './delivery-queries';
import { DELIVERY_TEXT } from './delivery-text';
import { DELIVERY_ERRORS, localizeError } from './tool-i18n';

interface Dish { id: number; name: string; merchant: string; price_cents: number; stock: number }
interface Order { id: number; student: string; merchant: string; status: 'paid' | 'delivered' | 'refunded'; total_cents: number }
interface State { dishes: Dish[]; orders: Order[] }
interface Result { columns?: string[]; values?: unknown[][]; truncated?: boolean }
interface Reply { id: number; ok: boolean; error?: string; result: Result[]; state: State; order?: number; backup?: Uint8Array | null }
interface Pending { id: number; action: string; resolve: (r: Reply) => void; reject: (e: Error) => void; timer: number }

const yuan = (cents: number) => (cents / 100).toFixed(2);

export function initDelivery(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const T = DELIVERY_TEXT[lang];
  const queries = DELIVERY_QUERIES[lang];
  const tr = (m: string) => localizeError(m, lang, DELIVERY_ERRORS);
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const controls = ['run-query', 'place-order', 'reset-db', 'download-db'];
  let worker: Worker | null = null;
  let sequence = 0;
  let pending: Pending | null = null;
  let backup: Uint8Array | null = null;
  let state: State | null = null;
  let exportRows: unknown[][] = [];
  let booted = false;

  const busy = (value: boolean) => {
    controls.forEach(id => ($(id) as HTMLButtonElement).disabled = value);
    root.querySelectorAll<HTMLButtonElement>('[data-refund]').forEach(b => (b.disabled = value));
    ($('cancel-query') as HTMLButtonElement).disabled = !value;
  };
  const halt = (text: string) => { busy(true); ($('cancel-query') as HTMLButtonElement).disabled = true; message(text, true); };
  const message = (text: string, error = false) => { const s = $('sql-status'); s.textContent = text; s.dataset.error = String(error); };

  const start = () => {
    worker = new Worker('/assets/delivery-worker.js');
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      if (!pending || data.id !== pending.id) return;
      clearTimeout(pending.timer);
      const { resolve, reject } = pending;
      pending = null;
      busy(false);
      if (data.ok) { if (data.backup) backup = data.backup; state = data.state; renderState(); resolve(data); }
      else reject(Error(tr(data.error ?? '')));
    };
    worker.onerror = () => abort(T.engineError);
  };

  const request = (action: string, extra: Record<string, unknown> = {}): Promise<Reply> => {
    if (pending) return Promise.reject(Error(T.busy));
    busy(true);
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      pending = { id, action, resolve, reject, timer: window.setTimeout(() => abort(action === 'init' ? T.loadTimeout : T.runTimeout), action === 'init' ? 20000 : 3000) };
      worker!.postMessage({ id, action, ...extra });
    });
  };

  function abort(text: string) {
    if (!pending) return;
    const task = pending;
    clearTimeout(task.timer);
    pending = null;
    worker?.terminate();
    task.reject(Error(text));
    if (task.action === 'init') return halt(text);
    start();
    request('init', { backup }).then(() => message(text, true)).catch(e => halt(e.message + T.reload));
  }

  const download = (data: BlobPart, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  function renderState() {
    if (!state) return;
    const dish = $('dish') as HTMLSelectElement;
    const selected = dish.value;
    dish.replaceChildren(...state.dishes.map(d => new Option(T.dishOption(d.merchant, d.name, yuan(d.price_cents), d.stock), String(d.id))));
    if (selected) dish.value = selected;
    $('order-list').replaceChildren(...state.orders.map(o => {
      const row = document.createElement('div'); row.className = 'order-row';
      const p = document.createElement('p'); p.textContent = T.orderLine(o.id, o.merchant, yuan(o.total_cents));
      const small = document.createElement('small'); small.className = `status-${o.status}`; small.textContent = `${o.student} · ${T.status[o.status]}`;
      p.append(small); row.append(p);
      if (o.status === 'paid') {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'secondary'; b.textContent = T.refundButton;
        b.dataset.refund = String(o.id); b.onclick = () => refundOrder(o.id); row.append(b);
      }
      return row;
    }));
    total();
  }

  function total() {
    const d = state?.dishes.find(x => x.id === Number(($('dish') as HTMLSelectElement).value));
    const q = Number(($('quantity') as HTMLInputElement).value);
    $('order-total').textContent = d && Number.isInteger(q) && q > 0 && q <= 20 ? T.total(yuan(d.price_cents * q)) : T.totalInvalid;
  }

  function table(results: Result[]) {
    const out = $('sql-results'); out.replaceChildren(); exportRows = []; let count = 0;
    for (const r of results) {
      if (r.truncated || !r.columns || !r.values) continue;
      if (!exportRows.length) exportRows = [r.columns, ...r.values];
      const t = document.createElement('table'); const head = document.createElement('thead'); const hr = document.createElement('tr');
      r.columns.forEach(c => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = c; hr.append(th); });
      head.append(hr); t.append(head);
      const body = document.createElement('tbody');
      r.values.forEach(v => { const row = document.createElement('tr'); v.forEach(x => { const td = document.createElement('td'); td.textContent = x === null ? 'NULL' : String(x); row.append(td); }); body.append(row); });
      t.append(body); out.append(t); count += r.values.length;
    }
    ($('export-csv') as HTMLButtonElement).disabled = !exportRows.length;
    return count;
  }

  async function run() {
    const started = performance.now();
    message(T.running); ($('export-csv') as HTMLButtonElement).disabled = true;
    try {
      const data = await request('query', { sql: ($('sql-input') as HTMLTextAreaElement).value });
      const n = table(data.result);
      message(T.rows(n, Math.round(performance.now() - started), data.result.some(x => x.truncated)));
    } catch (e) { $('sql-results').replaceChildren(); exportRows = []; message((e as Error).message, true); }
  }

  async function refundOrder(id: number) {
    try { await request('refund', { order: id }); $('order-status').textContent = T.refunded(id); await run(); }
    catch (e) { $('order-status').textContent = (e as Error).message; }
  }

  const boot = () => {
    if (booted) return;
    booted = true;
    message(T.loading);
    start();
    request('init').then(run).catch(e => halt((e as Error).message + T.reload));
  };

  // Static wiring works before the engine loads.
  const preset = $('query-preset') as HTMLSelectElement;
  queries.forEach((q, i) => preset.add(new Option(q.name, String(i))));
  const showPreset = () => { const q = queries[Number(preset.value)]; ($('sql-input') as HTMLTextAreaElement).value = q.sql; $('query-note').textContent = q.note; };
  preset.onchange = showPreset; showPreset();
  const student = $('student') as HTMLSelectElement;
  for (let i = 1; i <= 12; i++) student.add(new Option(T.student(String(i).padStart(2, '0')), String(i)));
  message(T.idle);
  busy(true); ($('cancel-query') as HTMLButtonElement).disabled = true;

  $('run-query').onclick = run;
  $('cancel-query').onclick = () => abort(T.stopped);
  ($('sql-input') as HTMLTextAreaElement).onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!pending) run(); } };
  ($('dish') as HTMLSelectElement).onchange = total;
  ($('quantity') as HTMLInputElement).oninput = total;
  ($('order-form') as HTMLFormElement).onsubmit = async e => {
    e.preventDefault();
    try {
      const q = Number(($('quantity') as HTMLInputElement).value);
      const data = await request('place', { input: { student: Number(student.value), dish: Number(($('dish') as HTMLSelectElement).value), quantity: q } });
      $('order-status').textContent = T.placed(data.order!); await run();
    } catch (err) { $('order-status').textContent = T.placeFailed((err as Error).message); }
  };
  $('reset-db').onclick = async () => { try { await request('init'); $('order-status').textContent = T.reset; await run(); } catch (e) { message((e as Error).message, true); } };
  $('download-db').onclick = () => { if (backup) download(backup, 'campus-delivery.sqlite', 'application/vnd.sqlite3'); };
  $('export-csv').onclick = () => download('\uFEFF' + exportRows.map(row => row.map(v => '"' + String(v ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n'), 'query-result.csv', 'text/csv;charset=utf-8');
  root.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach(b => b.addEventListener('click', () => {
    preset.value = b.dataset.jump ?? '0'; showPreset();
    root.querySelector('#workbench')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    boot();
  }));
  fetch('/assets/delivery-schema.sql').then(r => { if (!r.ok) throw Error(); return r.text(); })
    .then(t => { $('schema-source').textContent = t; }).catch(() => { $('schema-source').textContent = T.noSqlFile; });

  // Observe the whole demo (workbench, analysis, order form) so jumping straight to the order form still boots the engine.
  new IntersectionObserver((entries, io) => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }).observe(root);
  root.addEventListener('focusin', boot, { once: true });
}
```

说明："一次最多 20 份"在旧版由浏览器表单校验拦截；Step 1 的第三条用例去掉 `max` 属性，模拟绕过前端校验，验证内核报错被翻译。

- [ ] **Step 5: 组件**

`src/components/CampusDemo.astro`：结构逐段对应旧页面的 `#workbench`、`#analysis`、`#order-flow` 三节，改为：
- 根 `<div class="campus" data-campus data-demo data-lang={lang}>`；
- 所有固定文字由组件内的 `const L = { zh: {...}, en: {...} }[lang]` 提供（标签、标题、说明、按钮文字；中文逐字取自旧页面，英文如下表）；
- 经营分析卡的两个跳转按钮改为 `<button type="button" class="jump" data-jump="6">` 和 `data-jump="7"`（下标对应 Task 3 的查询）；
- 表格容器 `<div class="table-wrap" tabindex="0" aria-label={L.scrollHint}>`；
- 新增 `<details class="schema"><summary>{L.schema}</summary><pre id="schema-source"></pre></details>`；
- 英文页在分析区说明后加一行 `L.dataNote`；
- 脚本：`import { initDelivery } from '../scripts/delivery-ui'; document.querySelectorAll<HTMLElement>('[data-campus]').forEach(initDelivery);`。

| 键 | 中文（旧页面原文） | 英文 |
|---|---|---|
| wbTitle | 查询真实执行，结果直接查看。 | Real queries, real results. |
| wbMeta | 2024.04 · 合成业务数据 | Apr 2024 · synthetic business data |
| preset | 业务问题 | Business question |
| editor | SQL 编辑器 | SQL editor |
| hint | SQL 在独立沙盒中执行；自定义修改不写回订单演示。最多显示 500 行，运行超过 3 秒自动停止。 | SQL runs in a separate sandbox; your edits never touch the order demo. Up to 500 rows are shown, and runs stop after 3 seconds. |
| run / stop | 运行 SQL / 停止 | Run SQL / Stop |
| results / export | 查询结果 / 导出 CSV | Results / Export CSV |
| anTitle | 从数字读出经营状态。 | Reading the business from the numbers. |
| anMeta | 基于 96 笔合成订单 · 2024.04 · 静态分析结论 | Based on 96 synthetic orders · Apr 2024 · static findings |
| kpi | 总 GMV / 净收入（扣退款）/ 退款率 · 12/96 笔 / 已配送订单 | Total GMV / Net revenue (after refunds) / Refund rate · 12 of 96 / Delivered orders |
| card1 | 商家净收入排名；说明"支付总额 − 退款总额 · 退款率 = 退款笔数 ÷ 总订单数"；表头 商家/订单/GMV/净收入/退款率；标签"零退款" | Net revenue by merchant; "Payments − refunds · refund rate = refunded orders ÷ all orders"; Merchant/Orders/GMV/Net/Refund rate; "no refunds" |
| card2 | 菜品 GMV Top 5；说明"排除退款单 · 按历史成交价格统计（非当前菜单价）"；表头 菜品/商家/销量/GMV | Dish GMV top 5; "Refunds excluded · priced at the time of sale, not today's menu"; Dish/Merchant/Portions/GMV |
| jump | ↑ 在工作台运行对应查询 | ↑ Run this query in the workbench |
| findings | 经营发现与建议（三条原文 + 说明段原文） | Findings: ① All refunds come from lunchtime orders (12:00); 同学 03 refunded twice and is the only high-risk user. In practice, flag users with two or more refunds for a manual check rather than banning them — a false positive loses an active customer. ② 校园茶点 has no refunds but an average order of only ¥12.67, far below the other three (¥27.5+ on average). If fixed delivery cost is ¥3 or more, small orders may lose money; consider a minimum order or a packaging fee. ③ 土豆牛肉饭 (¥22, the highest price) ties for most portions sold and leads the runner-up by ¥144 in GMV — students accept "more expensive, more filling" dishes, making it a good lead item. Note: these findings come from 96 synthetic orders and only demonstrate SQL analysis, not a real business judgement. |
| flowTitle | 一笔订单，四处一致。/ 订单 / 明细 / 支付 / 库存；步骤 创建订单 / 库存扣减与明细 / 支付登记 / 提交事务 | One order, consistent in four places. / order · items · payment · stock; Create order / Deduct stock & add items / Record payment / Commit |
| form | 下单演示 / 学生 / 菜品 · 单价 · 剩余库存 / 份数 / 下单并登记支付 / 仅操作当前页面的演示数据库，不产生真实交易。 | Place an order / Student / Dish · price · stock left / Portions / Place order & record payment / Only touches this page's demo database — no real transactions. |
| list | 订单流水 / 载入后可创建订单，或取消未送达订单。 | Order log / Once loaded, place orders or cancel undelivered ones. |
| reset / dl | 重置演示数据 / 下载当前数据库 | Reset demo data / Download current database |
| schema | 查看建表 SQL | View the schema SQL |
| scrollHint | 可横向滚动 | Scrolls sideways |
| dataNote | —（中文页不显示） | Demo data (merchants, dishes, students) is in Chinese. |

样式：沿用第一阶段组件的写法（直角、1.5px 墨线、`--hair` 分隔），工作台为左右两栏（≥ 900px），窄屏单栏；`.table-wrap { overflow-x: auto; }`，表格 `white-space: nowrap`；KPI 大字用 `.num` 的字体但字号 `clamp(32px,4vw,56px)`；错误状态 `#sql-status[data-error=true] { color: var(--red-text); }`。

- [ ] **Step 6: 正文、视图与入口**

`src/copy/projects/campus-delivery.zh.md`：逐字迁移旧页面"关系模型"（段落 + 八张表列表，写成 Markdown 表格：表 / 作用 / 关键字段）、"关键决策"六小节（`###` 标题 + 原文段落）、"项目交付"（下载链接：`/downloads/delivery/campus-sql-source.zip` 完整源码、`/downloads/delivery/init.sql` 建表与数据 SQL、`/downloads/delivery/campus.sqlite` 示例数据库、`/downloads/delivery/README.md` 设计与运行说明，以及"本地运行：解压后执行 `node verify.mjs`，需要 Node.js 20.11 或以上"）。在"关系模型"前插入图：`![以订单为中心的业务关系](/assets/editorial/delivery-relations.svg)`。
`campus-delivery.en.md`：与中文逐节对应的英文翻译（图注写 "Order-centred relationships (diagram in Chinese)"）。

`src/data/site.ts` 的 `pages` 新增：

```ts
    campus: {
      title: { zh: '校园外卖 SQL 工作台', en: 'Campus Delivery SQL Lab' },
      lead: { zh: '一笔订单背后，是一组相互约束的记录。', en: 'Behind every order is a set of records that keep each other honest.' },
      description: { zh: '校园外卖课程设计：8 张业务表、事务与复合外键，在浏览器里直接运行 SQL、下单和退款。', en: 'Campus delivery course project: 8 business tables, transactions and composite keys — run SQL, place orders and refunds in the browser.' },
      tags: [ { zh: '课程设计', en: 'Course project' }, { zh: 'SQLite · sql.js · Web Worker', en: 'SQLite · sql.js · Web Worker' } ],
      summary: {
        task: { zh: '用一个校园外卖场景，把下单、库存、支付、配送和退款设计成相互约束、可以查询的关系数据库，再用 SQL 做经营分析。', en: 'Model campus food delivery — ordering, stock, payment, delivery and refunds — as a relational database whose records constrain each other, then analyse it with SQL.' },
        mine: { zh: '独立完成：8 张业务表的建模、约束与触发器、下单与退款事务、业务查询和经营分析结论，并把数据库放进浏览器做成可操作的工作台。', en: 'On my own: modelled the 8 business tables, constraints and triggers, the order and refund transactions, the business queries and findings, and put the database in the browser as a working lab.' },
        tools: { zh: 'SQLite；sql.js（WebAssembly）让它在浏览器里运行，查询放在 Web Worker 里执行并有超时保护。', en: 'SQLite; sql.js (WebAssembly) runs it in the browser, with queries in a Web Worker behind a timeout.' },
        evidence: { zh: '本页的 SQL 工作台（可运行查询、下单、退款）、建表与数据 SQL、完整源码包。', en: 'The SQL lab on this page (run queries, place and refund orders), the schema and data SQL, and the full source package.' },
        status: { zh: '课程设计，已完成；演示数据为合成数据。', en: 'Course project, finished; the demo data is synthetic.' },
      },
    },
```

`src/views/CampusView.astro`（仿照 `HrisView.astro`）：

```astro
---
import ProjectLayout from '../layouts/ProjectLayout.astro';
import CampusDemo from '../components/CampusDemo.astro';
import { SITE } from '../data/site';
import { Content as BodyZh } from '../copy/projects/campus-delivery.zh.md';
import { Content as BodyEn } from '../copy/projects/campus-delivery.en.md';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const P = SITE.pages.campus;
const Body = lang === 'zh' ? BodyZh : BodyEn;
---
<ProjectLayout lang={lang} slug="campus-delivery" title={P.title} lead={P.lead} tags={P.tags} summary={P.summary} description={P.description}>
  <CampusDemo slot="demo" lang={lang} />
  <Body />
</ProjectLayout>
```

两个入口页：`src/pages/projects/campus-delivery.astro` → `<CampusView lang="zh" />`；`src/pages/en/projects/campus-delivery.astro` → `<CampusView lang="en" />`。

- [ ] **Step 7: 运行确认通过**

Run: `npx vitest run; npx playwright test tests/e2e/campus.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 8: 提交** — "Add bilingual campus delivery SQL page with on-demand engine"。

---

### Task 5: CSV 工具页

**Files:**
- Create: `src/scripts/lab-text.ts`、`src/scripts/lab-ui.ts`、`src/components/CsvLab.astro`、`src/copy/projects/stock-data.{zh,en}.md`、`src/views/StockDataView.astro`、两个入口页、`tests/e2e/csv-lab.spec.ts`
- Modify: `src/data/site.ts`（新增 `pages.stock`）

**Interfaces:**
- Consumes: `analysis-core.mjs`、`CSV_ERRORS`、`localizeError`
- Produces: `initLab(root: HTMLElement): void`；根 `[data-lab][data-lang][data-demo]`；元素 id 与旧页面相同（`file, example, delimiter, paste, paste-run, message, empty, results, source-label, dedupe, drop-missing, metrics, audit, column, stats-title, histogram, chart-empty, range-min, range-max, bins-body, stat-list, numeric-note, quality-body, search, data-head, data-body, table-empty, page-info, prev, next, export-csv, export-json`）。注意：`export-csv` 与 SQL 页同名，但两个页面不会同时存在。

- [ ] **Step 1: 写失败的端到端测试**

```ts
import { test, expect } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

const metric = (page, i: number) => page.locator('#metrics .metric strong').nth(i);

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`CSV lab (${lang})`, () => {
    test('the constructed sample reproduces the documented numbers', async ({ page }) => {
      await page.goto(`${prefix}/projects/stock-data/`);
      await expect(metric(page, 0)).toHaveText('13');
      await expect(metric(page, 2)).toHaveText('2');
      await expect(metric(page, 3)).toHaveText('1');
      await page.locator('#dedupe').check();
      await expect(metric(page, 0)).toHaveText('12');
      await page.locator('#drop-missing').check();
      await expect(metric(page, 0)).toHaveText('10');
      await expect(page.locator('#stat-list')).toContainText('15.2');
      expect(await noHorizontalOverflow(page)).toBe(true);
    });

    test('bad paste keeps the previous result and reports in the page language', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await page.goto(`${prefix}/projects/stock-data/`);
      await expect(metric(page, 0)).toHaveText('13');
      await page.locator('.paste-box summary').click();
      await page.locator('#paste').fill('a,b\n1');
      await page.locator('#paste-run').click();
      await expect(page.locator('#message')).toContainText(lang === 'zh' ? '列数与表头不一致' : 'different number of columns');
      await expect(metric(page, 0)).toHaveText('13');
      await page.locator('#paste').fill('x,y\n1,2\n3,4');
      await page.locator('#paste-run').click();
      await expect(metric(page, 0)).toHaveText('2');
    });
  });
}
```

- [ ] **Step 2: 运行确认失败** — 页面 404。

- [ ] **Step 3: 界面文字**

`src/scripts/lab-text.ts` 导出 `LAB_TEXT: Record<Lang, LabText>`，键与中文值逐字取自 `legacy/assets/lab.mjs` 中的字符串（`metrics` 四个标签、`audit` 模板、`statKeys` 七个名称、`numericNote` 模板、`sourceLabel` 模板与三个分隔符名、`sampleNote`、`fileNote`、`kept`（" 原有分析结果已保留。"）、`utf8Error`、`exampleLoading`、`exampleError`、`pasteName`、`typeLabel`（`{'数值': '数值', '文本': '文本'}` / `{'数值': 'number', '文本': 'text'}`）、`binTitle` 模板、`pageInfo` 模板、`sortTitle` 模板、`blankCell`、`jsonMethod`、`numberLocale`（'zh-CN' / 'en-US')）。英文值：

```ts
en: {
  metrics: ['Rows now', 'Columns', 'Blank cells', 'Duplicate rows in input'],
  audit: (i, d, m, k) => `Input ${i} rows → ${d} removed as duplicates → ${m} removed for blanks → ${k} kept. A duplicate means every original cell matches; the first occurrence is kept.`,
  statKeys: ['Valid numbers', 'Mean', 'Median', 'Min', 'Max', 'Sample std. dev.', 'IQR outlier candidates'],
  numericNote: (blank, bad) => `${blank} blank and ${bad} non-numeric values in this column were left out. Use IDs and dates only for grouping; numeric statistics on ID numbers mean nothing. Outlier candidates are never removed automatically.`,
  sourceLabel: (name, cols, delim) => `${name} · ${cols} columns · ${delim}-separated`,
  delimiters: { ',': 'comma', ';': 'semicolon', '\t': 'tab' },
  sampleNote: 'This is a hand-made sample shaped like market data, not real market data. Upload your own CSV to replace it.',
  fileNote: 'File read. Everything is computed in this browser; nothing is uploaded.',
  kept: ' The previous result is kept.',
  utf8Error: 'This file is not valid UTF-8 text. Save it as "CSV UTF-8" and try again; Excel workbooks are not supported yet.',
  exampleLoading: 'Loading the sample…',
  exampleError: 'The sample could not load. Try again later, or paste your own CSV.',
  pasteName: 'pasted data',
  typeLabel: { '数值': 'number', '文本': 'text' },
  binTitle: (lo, op, hi, n) => `${lo} ${op} x ${hi}: ${n} rows`,
  statsTitle: name => `${name} · distribution`,
  pageInfo: (a, b, n) => `${a}–${b} of ${n} rows`,
  sortTitle: h => `Sort by ${h}`,
  blankCell: 'blank',
  jsonMethod: 'Blanks are not filled; numbers are parsed strictly; quantiles use linear interpolation; standard deviation uses n−1; outliers use 1.5×IQR. Searching and sorting the table do not change statistics or exports.',
  numberLocale: 'en-US',
},
```

- [ ] **Step 4: 界面脚本**

`src/scripts/lab-ui.ts`：把 `legacy/assets/lab.mjs` 改写为 `export function initLab(root: HTMLElement)`，改动仅限：
1. `$` 改为 `root.querySelector('#'+id)`；
2. 所有中文字符串换成 `LAB_TEXT[lang]` 的对应键；`fmt` 使用 `numberLocale`；类型列显示 `typeLabel[c.type]`（`analyze` 返回的 `type` 仍是 '数值'/'文本'，逻辑判断不变）；
3. `message(e.message)` 改为 `message(localizeError(e.message, lang, CSV_ERRORS) + (source ? T.kept : ''), true)`；文件过大的提示同样经过 `localizeError`；
4. 示例地址仍为 `/assets/sample.csv`；页面加载后自动载入示例（与旧版相同）；
5. 导入 `from './analysis-core.mjs'`。

- [ ] **Step 5: 组件、正文、视图**

`src/components/CsvLab.astro`：结构逐段对应旧页面 `<section class="lab">`，根改为 `<div class="lab" data-lab data-demo data-lang={lang}>`，固定文字用组件内 `L[lang]` 字典（中文逐字取自旧页面；英文：Choose CSV / Load sample / Download sample / Delimiter / Auto-detect, Comma, Semicolon, Tab / "UTF-8 · up to 2 MB / 20,000 rows / 100 columns · re-import after changing the delimiter" / Or paste data / "The first line must be unique, non-empty headers" / Analyse pasted data / "Choose a CSV or paste data to see results here." / Remove exact duplicate rows / Remove rows with blanks / Column to analyse / Distribution / "No numeric values in this column — choose another." / Show bins / Range, Rows / Descriptive statistics / Column quality + 说明 "Blank means empty after trimming spaces; text such as NULL or NA is not treated as missing. Numeric-convertible is a diagnostic, not a sign that an ID has statistical meaning." / Column, Inferred type, Blank, Unique non-blank, Convertible to number, Non-blank non-numeric / Data preview / Search cells / "Click a header to sort; search and sort affect only the preview, not statistics or exports." / "No rows match." / Previous / Next / Export processed CSV / Export analysis record (JSON) / 说明 "The JSON holds the input's SHA-256, the options, row-count audit and column statistics — not the rows. Text a spreadsheet might treat as a formula gets a leading quote in the CSV. Refreshing the page discards your input."）。三个表格容器都是 `tabindex="0"` 并有 `aria-label`。脚本：`initLab`。
`stock-data.zh.md`：逐字迁移旧页面"这是什么项目？""当前边界"两节，外加图 `![从原始行到分析结果](/assets/editorial/csv-process.svg)` 与链接 `[查看方法、源码和运行步骤](/projects/stock-data/method/)`；`stock-data.en.md` 为英文对应（图注注明 diagram in Chinese，链接 `/en/projects/stock-data/method/`）。
`site.ts` 的 `pages.stock`：

```ts
    stock: {
      title: { zh: 'CSV 数据分析工具', en: 'CSV Analysis Tool' },
      lead: { zh: '让一张表，讲清楚自己的来路。', en: 'Let a table explain where it came from.' },
      description: { zh: '上传或粘贴表格，检查缺失与重复，查看统计与分布，导出处理记录。数据只在浏览器中处理。', en: 'Upload or paste a table to check blanks and duplicates, see statistics and distributions, and export a processing record — all in the browser.' },
      tags: [ { zh: '原型 · 构造样本', en: 'Prototype · synthetic sample' }, { zh: 'JavaScript · CSV · 描述统计', en: 'JavaScript · CSV · descriptive statistics' } ],
      summary: {
        task: { zh: '把原股票行情项目里的数据检查思路，改造成任何人都能带入自己表格的轻量工具：检查缺失与重复、看分布、导出处理记录。', en: 'Turn the data checks from my earlier market-data project into a light tool anyone can use on their own table: find blanks and duplicates, see distributions, export a record of what was done.' },
        mine: { zh: '定义统计口径与处理规则（默认只诊断、不自动修复），实现解析、去重、统计与导出，并用构造样本做可手工核对的检查。', en: 'Defined the statistics and handling rules (diagnose by default, never auto-fix), implemented parsing, de-duplication, statistics and export, and checked it against a hand-verifiable sample.' },
        tools: { zh: '浏览器与命令行共用同一个计算模块；没有服务器端处理，也不调用 AI 分析接口。', en: 'The browser and the command line share one calculation module; no server-side processing and no AI analysis calls.' },
        evidence: { zh: '本页的工具、构造样本、源码包与检查脚本。', en: 'The tool on this page, the synthetic sample, the source package and the check script.' },
        status: { zh: '原型，使用构造样本；真实行情回测项目正在重做，完成后替换本页。', en: 'Prototype on a synthetic sample; the real market backtest is being rebuilt and will replace this page.' },
      },
    },
```

`src/views/StockDataView.astro` 仿照 `CampusView`（`slug="stock-data"`，`demo` 插槽放 `<CsvLab lang={lang} />`）；入口页 `src/pages/projects/stock-data.astro`、`src/pages/en/projects/stock-data.astro`。

- [ ] **Step 6: 运行确认通过** — `npx vitest run; npx playwright test tests/e2e/csv-lab.spec.ts` → PASS
- [ ] **Step 7: 提交** — "Add bilingual CSV lab page"。

---

### Task 6: CSV 工具的"过程与运行"子页

**Files:**
- Create: `src/copy/projects/stock-data-method.{zh,en}.md`、`src/views/MethodView.astro`、`src/pages/projects/stock-data/method.astro`、`src/pages/en/projects/stock-data/method.astro`、`tests/e2e/method.spec.ts`
- Modify: `src/data/site.ts`（新增 `pages.method`）

**Interfaces:** Consumes `Base`；Produces 网址 `/projects/stock-data/method/` 与英文镜像。

- [ ] **Step 1: 写失败的测试**

```ts
import { test, expect } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`method page (${lang}) documents the reproducible sample and links back to the tool`, async ({ page }) => {
    const res = await page.goto(`${prefix}/projects/stock-data/method/`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('main')).toContainText('15.2');
    await expect(page.locator('main')).toContainText('node reproduce.mjs sample.csv --dedupe --drop-missing');
    await expect(page.locator(`main a[href="${prefix}/projects/stock-data/"]`).first()).toBeVisible();
    await expect(page.locator('main a[href="/downloads/csv-lab-source.zip"]').first()).toBeVisible();
    await expect(page.locator('header.nav a.lang')).toHaveAttribute('href', lang === 'zh' ? '/en/projects/stock-data/method/' : '/projects/stock-data/method/');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}
```

- [ ] **Step 2: 运行确认失败**

- [ ] **Step 3: 实现**

`stock-data-method.zh.md`：逐字迁移旧方法页的"项目目标""输入与输出""使用工具""从输入到结果"（五步写成有序列表）、"验证结果"（表格：操作 / 预期结果）、"为什么这些数值可信？""自己运行"（"不写代码"有序列表，"在本地运行"两条命令写成代码块）、"过程与取舍"四小节；末尾"计算源码"只保留一句说明和下载链接 `/downloads/source/analysis-core.mjs`（不再内嵌整段源码，源码包里有），以及下载链接 `/downloads/csv-lab-source.zip`、`/assets/sample.csv`、返回工具的链接 `/projects/stock-data/`。`stock-data-method.en.md` 为逐节英文翻译，链接换成 `/en/projects/stock-data/`。

`site.ts` 的 `pages.method`：

```ts
    method: {
      title: { zh: '过程与运行 · CSV 数据分析工具', en: 'Method & results · CSV Analysis Tool' },
      heading: { zh: '一份分析，应该留下一条可复算的路径。', en: 'An analysis should leave a path you can recompute.' },
      description: { zh: 'CSV 数据分析工具的处理规则、构造样本的可核对结果和本地运行方法。', en: 'Handling rules of the CSV Analysis Tool, hand-checkable results on the synthetic sample, and how to run it locally.' },
    },
```

`src/views/MethodView.astro`：

```astro
---
import Base from '../layouts/Base.astro';
import { SITE } from '../data/site';
import { Content as BodyZh } from '../copy/projects/stock-data-method.zh.md';
import { Content as BodyEn } from '../copy/projects/stock-data-method.en.md';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const P = SITE.pages.method;
const Body = lang === 'zh' ? BodyZh : BodyEn;
---
<Base lang={lang} path="/projects/stock-data/method/" title={P.title[lang]} description={P.description[lang]}>
  <main id="main">
    <header class="m-head wrap"><h1>{P.heading[lang]}</h1></header>
    <article class="prose wrap"><Body /></article>
  </main>
</Base>
<style>
  .m-head { padding-block: clamp(32px, 6vh, 72px) 28px; border-bottom: var(--rule); }
  .m-head h1 { font-size: clamp(34px, 5vw, 72px); line-height: 1.05; letter-spacing: -0.03em; max-width: 18em; }
</style>
```

`.prose` 的样式目前写在 `ProjectLayout.astro` 的 `<style>` 里（带 `:global`，只对使用该布局的页面生效）。把 `.prose` 相关的规则整段移到 `src/styles/base.css` 末尾（去掉 `:global(...)` 包装），让两个布局共用。入口页各一个。

- [ ] **Step 4: 运行确认通过**（同时跑 `tests/e2e/hris.spec.ts` 确认 `.prose` 搬迁没有影响 HRIS 页）
- [ ] **Step 5: 提交** — "Add bilingual CSV method page; share prose styles"。

---

### Task 7: 深入版总目录 `/projects/`

**Files:**
- Create: `src/views/ProjectsView.astro`、`src/pages/projects/index.astro`、`src/pages/en/projects/index.astro`、`tests/e2e/projects-index.spec.ts`
- Modify: `src/data/site.ts`（新增 `pages.projects`）

**Interfaces:** Consumes `ProjectRow`、`SITE.projects`、`SITE.film.clips`、`fact('F8')`。

- [ ] **Step 1: 写失败的测试**

```ts
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`projects index (${lang}) lists every data project, then the film zone`, async ({ page }) => {
    await page.goto(`${prefix}/projects/`);
    const data = SITE.projects.filter(p => p.line === 'data').map(p => `${prefix}${p.href}`);
    expect(await page.locator('a.prow').evaluateAll(as => as.map(a => a.getAttribute('href')))).toEqual(data);
    const film = page.locator('.night-zone a[href$="/projects/mais-je-taime/"]');
    await expect(film).toBeVisible();
    await expect(page.locator('header.nav a[aria-current="page"]')).toHaveText(SITE.nav.projects[lang]);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('the second door on the home page now lands on the index', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/');
  await page.locator('a.door').nth(1).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.pages.projects.title.zh);
});
```

- [ ] **Step 2: 运行确认失败**

- [ ] **Step 3: 实现**

`site.ts` 的 `pages.projects`：

```ts
    projects: {
      title: { zh: '项目与演示', en: 'Projects & demos' },
      lead: { zh: '数据 × AI 工具是主要作品，每个项目都能打开看过程、亲手试；影像是独立的创作板块。', en: 'Data × AI tools are the main work — open any project to see the process and try it yourself. Film is a separate creative strand.' },
      description: { zh: '何彦钧的全部项目：HR 档案补录工作流、SQL 工作台、求职 Agent、QuotaDeck、AI 校园研究、CSV 工具，以及 AI 短片分镜。', en: 'All of Yanjun He\'s projects: the HR records workflow, SQL lab, job agent, QuotaDeck, AI-on-campus study, CSV tool, and an AI short-film storyboard.' },
      data: { zh: '数据 × AI 工具', en: 'Data × AI tools' },
      film: { zh: 'AI 影像', en: 'AI film' },
    },
```

`src/views/ProjectsView.astro`：

```astro
---
import Base from '../layouts/Base.astro';
import ProjectRow from '../components/ProjectRow.astro';
import { SITE } from '../data/site';
import { fact } from '../data/facts';
import { localizePath, type Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const P = SITE.pages.projects;
const data = SITE.projects.filter(p => p.line === 'data');
const film = SITE.projects.find(p => p.line === 'film')!;
const posters = SITE.film.clips.filter(c => ['s04', 's06', 's09', 's16'].includes(c.file));
---
<Base lang={lang} path="/projects/" title={`${P.title[lang]} · ${SITE.name[lang]}`} description={P.description[lang]}>
  <main id="main">
    <header class="i-head wrap">
      <h1>{P.title[lang]}</h1>
      <p>{P.lead[lang]}</p>
    </header>
    <section aria-labelledby="i-data">
      <div class="wrap"><div class="section-head"><h2 id="i-data">{P.data[lang]}</h2></div></div>
      {data.map((p, i) => <ProjectRow lang={lang} project={p} index={i} />)}
    </section>
    <section class="night-zone i-film" aria-labelledby="i-film">
      <div class="wrap"><div class="section-head"><h2 id="i-film">{P.film[lang]}</h2></div></div>
      <a class="i-film__link" href={localizePath(film.href, lang)}>
        <ul class="i-film__strip">
          {posters.map(c => <li><img src={`/media/mais-je-taime/video/${c.file}.webp`} alt={`${c.shot} ${c.title[lang]}`} width="960" height="540" loading="lazy" decoding="async" /></li>)}
        </ul>
        <span class="wrap i-film__row">
          <span class="i-film__title">{film.title[lang]}<span aria-hidden="true"> →</span></span>
          <span>{film.did[lang]}</span>
          <span class="i-film__status">{fact('F8').text[lang]}</span>
        </span>
      </a>
    </section>
  </main>
</Base>
<style>
  .i-head { display: grid; gap: 16px; padding-block: clamp(32px, 6vh, 72px) 24px; }
  .i-head h1 { font-size: clamp(56px, 10vw, 150px); line-height: 0.9; letter-spacing: -0.05em; }
  :global(html[lang='en']) .i-head h1 { font-family: var(--font-display); font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; }
  .i-head p { max-width: 40em; font: 500 clamp(17px, 1.6vw, 22px)/1.55 var(--font-body); }
  .i-film { margin-top: 56px; }
  .i-film__link { display: block; text-decoration: none; }
  .i-film__strip { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0; padding: 0; list-style: none; }
  .i-film__strip img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; filter: grayscale(1); transition: filter 0.5s var(--ease); }
  .i-film__link:hover img, .i-film__link:focus-visible img { filter: none; }
  .i-film__row { display: grid; grid-template-columns: minmax(10em, 1fr) 2fr minmax(12em, 1fr); gap: 8px 32px; padding-block: 22px 32px; }
  .i-film__title { font: 900 24px/1.3 var(--font-cjk-bold); }
  .i-film__status { color: var(--night-mute); font-size: 14px; }
  @media (max-width: 800px) { .i-film__strip { grid-template-columns: 1fr 1fr; } .i-film__row { grid-template-columns: 1fr; } }
</style>
```

入口页 `src/pages/projects/index.astro` → `<ProjectsView lang="zh" />`，英文同理。

- [ ] **Step 4: 运行确认通过**；**Step 5: 提交** — "Add bilingual projects index"。

---

### Task 8: 验收

**Files:** Modify `tests/e2e/helpers.ts`、`tests/e2e/numbers.spec.ts`

- [ ] **Step 1: 扩大验收覆盖范围**

`helpers.ts`：

```ts
export const PHASE1_PAGES = ['/', '/brief/', '/projects/hris-workflow/', '/en/', '/en/brief/', '/en/projects/hris-workflow/'];
export const PHASE2A_PAGES = ['/projects/', '/projects/campus-delivery/', '/projects/stock-data/', '/projects/stock-data/method/'].flatMap(p => [p, `/en${p}`]);
export const PAGES = [...PHASE1_PAGES, ...PHASE2A_PAGES];

export const PHASE2_PENDING = new Set(
  ['/projects/ai-career/', '/projects/quota-deck/', '/projects/ai-campus/', '/projects/mais-je-taime/', '/privacy/']
    .flatMap(p => [p, `/en${p}`]),
);
```

`links.spec.ts`、`a11y.spec.ts`、`layout.spec.ts` 里的 `PHASE1_PAGES` 改为 `PAGES`。`numbers.spec.ts` 的页面数组改为 `PAGES`（排除项已包含 `[data-demo]` 与 `.prose`）。

- [ ] **Step 2: 运行完整测试** — `npx vitest run; npx playwright test`，全部 PASS；失败时修正实现，不放宽断言。
- [ ] **Step 3: 截图检查** — 逐张查看 `test-results/screens/` 中新增的 16 张图（8 个页面 × 桌面/手机），重点看宽表格、工作台两栏在窄屏的折叠、KPI 大字、英文长文本。
- [ ] **Step 4: 提交** — "Extend acceptance suite to phase 2A pages"。
- [ ] **Step 5: 交给用户**：给出预览地址；列出待过目的英文正文（SQL 页、CSV 页、方法页）；说明未推送、未部署。
