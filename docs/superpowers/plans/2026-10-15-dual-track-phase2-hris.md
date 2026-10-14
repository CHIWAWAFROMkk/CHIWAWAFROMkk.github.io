# 双轨重构第二期：HRIS 站 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建一套只通过 HR 版简历链接进入的 `/hris/` 站：V3 视觉（钴蓝 + 森林绿、1px 结构线、深浅色切换），首页、一分钟版、项目列表、5 个项目的详情与完整版、流程终端，中英双语，动效为"治理收敛"。

**Architecture:** 新的 `track = 'hris'` 沿用第一期的结构：页面文件一行调用 View，View 多接收 `track`，`ProjectLayout` 按 track 选 `Base` 或新的 `HrisBase` 外壳，HRIS 外壳下用 `hris.css` 把同一套详情页结构换成 V3 样子；站内链接一律经 `trackPath()` 生成。HRIS 颜色只定义在 `src/data/tokens.ts`，由 `hrisThemeCss()` 生成浅/深两套变量。拓扑与稽核终端都是"纯函数 + DOM 驱动"两层。

**Tech Stack:** Astro 7、TypeScript、原生 Canvas 2D / SVG、Vitest 5、Playwright 1.63（msedge）。

**Spec:** `docs/superpowers/specs/2026-10-14-dual-track-portfolio-design.md`（第 3.4、4.3、4.4、7.2、7.3、8、10 节）。视觉参考：`D:\Users\yoshi\Downloads\hris_portfolio_v3_architectural.html`（Gemini V3，只取视觉与交互结构，文案与数据一律按本计划重写）。第一期计划 `docs/superpowers/plans/2026-10-14-dual-track-phase1.md` 已完成，本计划依赖它的 `tier.ts`、`trackProjects`、`live-size.ts`、`StreamText`、`ReadingRail`、`night-entry`。

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `dual-track`（起点 4fed3b3）。不推送、不合并、不碰 `main`。
- 提交：`git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit ...`，信息末尾 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- 不新增任何依赖。
- **所有 `/hris/` 页面**带 `<meta name="robots" content="noindex, nofollow">`，不进 `sitemap.xml`，主站任何页面都不含指向 `/hris/` 的链接；从 `/hris/` 出发的站内页面链接都留在 `/hris/` 或 `/en/hris/` 下（下载文件、`/assets/`、`/media/`、外部链接除外）。
- 数字只来自 `src/data/facts.ts`；新增 F15（每满 100 份全部人工核对一次，来源经历档案 4.1 用户口述）。HRIS 文案同样受数字检查和禁用措辞检查（第一期 `tests/unit/claims.test.ts` 的规则）。
- 事实口径：6,000+ 只能以系统作主语；本人核查约 2000 名；工作流三版（v1 OpenClaw 调用 DeepSeek、ChatGPT，个人实践原型；v2 本地 OCR + DeepSeek；最终版 Copilot + Power Automate，另用 Excel、SharePoint、AI Builder，在公司批准环境中运行并交接 mentor）；不写"持续运行"、不写 3000、不写任何员工信息；不出现 Pydantic、`field_diff`、OpenClaw 自动工单、"100% 溯源""COMPLIANCE VERIFIED"。
- 求职 Agent 在 HRIS 站叫「人岗匹配评估引擎」，副标题写明是求职一侧的工具。
- 实习职位统一「项目专员（HR数字化方向）」（F5）。
- **HRIS 字体**：用系统字体栈（与 V3 一致），不加载网站的 Noto Sans SC 子集与 Barlow；等宽只用于编号、状态码等 V3 的结构标签。
- 动效档位语义同第一期（full / gentle / lite / off，`localStorage['hyj-motion']`）；HRIS 拓扑 full 约 2000 点、lite 约 600 点、gentle 约 600 点慢速且无指针互动、off 静态；任何动效不遮挡正文超过 2.5 秒。
- 深浅色：`localStorage['hyj-hris-theme']`（`light` / `dark`），没有选择时跟随系统；深色下演示组件放在浅色纸底面板里。
- 命令：`npm test`、`npx vitest run <file>`、`npm run e2e`、`npx playwright test <file>`（Git Bash）。
- 新文案（HRIS 首屏介绍、技能、一分钟版要点、卡片、流程终端说明）都是草稿，Task 10 加入待确认清单，确认前不上线。

## Review Focus

1. **从 `/hris/` 进入的 HR 转发链接**：任何 `/hris/...` 页面的导航、Logo、翻页、完整版入口、完整版返回链接、页脚都留在 `/hris/` 下 → Task 6 测试 `crawl: every page link reachable from /hris/ stays under /hris/`。
2. **深色模式下的演示组件**：求职引擎、SQL 工作台、QuotaDeck 时钟在深色 HRIS 页里仍可读、可操作 → Task 4 测试 `dark theme: demos sit on a light panel and stay readable`。
3. **禁止本地存储**：主题切换、开场、动效开关都不报错，主题仍可在本页切换 → Task 2 测试 `storage blocked: theme still toggles on this page`。
4. **键盘访客**：流程终端的样例档案和版本切换都能用 Tab / Enter / Space 操作，并有可见焦点 → Task 8 测试 `keyboard: records and versions are operable`。
5. **390 px 手机**：HRIS 首页、详情页、流程终端没有横向滚动，首屏能看到标题与介绍 → Task 2、Task 4、Task 8 的手机断言。

---

## 文件结构

| 文件 | 职责 | 任务 |
|---|---|---|
| `src/i18n.ts` | `trackPath()` | 1 |
| `src/data/tracks.ts` | `Track` 增加 `'hris'`、HRIS 顺序与卡片改写 | 1 |
| `src/data/hris.ts` | HRIS 全部文案 | 1、2、5、7、8 |
| `src/data/facts.ts` | F15 | 1 |
| `src/data/tokens.ts` | `HRIS_COLORS`、`hrisThemeCss()` | 2 |
| `src/components/MotionBoot.astro` | 首帧前写档位（从 Base 抽出，两个外壳共用） | 2 |
| `src/layouts/HrisBase.astro`、`src/components/hris/HrisTopbar.astro`、`HrisFooter.astro`、`src/styles/hris.css` | HRIS 外壳与 V3 样式 | 2、4 |
| `src/views/hris/HrisHomeView.astro`、`HrisBriefView.astro`、`HrisProjectsView.astro`、`HrisWorkbenchView.astro` | HRIS 专属页面 | 2、3、5、8 |
| `src/pages/hris/**`、`src/pages/en/hris/**` | 路由（每个一行） | 2、4、5、8 |
| `src/scripts/hris-topology.ts`、`hris-topology-dom.ts`、`src/components/hris/Topology.astro` | 首屏治理拓扑 | 3 |
| `src/layouts/ProjectLayout.astro`、各 `*View.astro`、`EditionTeaser.astro`、`InsightsTeaser.astro`、`LiveView.astro` | `track` 贯通 | 4 |
| `src/scripts/intro.ts`、`intro-dom.ts`、`src/components/hris/HrisIntro.astro` | HRIS 开场 | 7 |
| `src/data/hris-workbench.ts`、`src/scripts/hris-workbench-dom.ts` | 流程终端 | 8 |
| `src/scripts/hris-motion.ts` | 数字条、结构线 | 9 |

---

### Task 1: HRIS 线的数据与路由

**Files:**
- Modify: `src/i18n.ts`、`src/data/tracks.ts`、`src/data/facts.ts`
- Create: `src/data/hris.ts`、`tests/unit/hris-copy.test.ts`
- Modify tests: `tests/unit/tracks.test.ts`

**Interfaces:**
- Produces:
  - `trackPath(track: Track, path: string, lang: Lang): string`（`src/i18n.ts`；`Track` 从 `src/data/tracks.ts` 以 `import type` 引入会形成循环，所以 `i18n.ts` 自己声明 `export type TrackId = 'ai' | 'hris'`，`tracks.ts` 中 `export type Track = TrackId`）
  - `TRACK_ORDER.hris`、`trackProjects('hris')`（返回带 HRIS 卡片改写的 `ProjectEntry[]`，`href` 仍为 `/projects/<slug>/`，渲染时经 `trackPath`）
  - `HRIS`（`src/data/hris.ts`）：`HRIS.cards`、`HRIS.hero`、`HRIS.ledger`、`HRIS.skills`、`HRIS.brief`、`HRIS.nav`、`HRIS.meta` 等（字段见 Step 3）
  - `fact('F15')`

- [ ] **Step 1: 写失败的测试**

`tests/unit/tracks.test.ts` 末尾追加：

```ts
import { trackPath } from '../../src/i18n';

describe('HRIS track', () => {
  it('lists the HRIS order with the job engine renamed', () => {
    const list = trackProjects('hris');
    expect(list.map(p => p.slug)).toEqual(['hris-workflow', 'ai-career', 'campus-delivery', 'ai-campus', 'quota-deck']);
    expect(list.find(p => p.slug === 'ai-career')!.title.zh).toBe('人岗匹配评估引擎');
  });
  it('rewrites only the card copy, never the links', () => {
    for (const p of trackProjects('hris')) expect(p.href).toBe(`/projects/${p.slug}/`);
  });
});

describe('trackPath', () => {
  it('keeps the AI track as it is', () => {
    expect(trackPath('ai', '/projects/ai-career/', 'zh')).toBe('/projects/ai-career/');
    expect(trackPath('ai', '/', 'en')).toBe('/en/');
  });
  it('puts the HRIS track under /hris/, before the language prefix', () => {
    expect(trackPath('hris', '/', 'zh')).toBe('/hris/');
    expect(trackPath('hris', '/projects/ai-career/live/', 'zh')).toBe('/hris/projects/ai-career/live/');
    expect(trackPath('hris', '/brief/', 'en')).toBe('/en/hris/brief/');
    expect(trackPath('hris', '/en/projects/', 'en')).toBe('/en/hris/projects/');
  });
});
```

`tests/unit/hris-copy.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { HRIS } from '../../src/data/hris';
import { factCorpus, fact } from '../../src/data/facts';
import { strayTokens } from './digits';

const AUTHOR_CLAIMS = [/独立/, /\bsolo\b/i, /\bindependent(ly)?\b/i, /500\s*强/, /Fortune\s*500/i, /100\s*%/, /闭环/, /Pydantic/, /field_diff/, /OpenClaw\s*自动/, /COMPLIANCE/i, /持续运行/, /3000/];
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/tracks.test.ts tests/unit/hris-copy.test.ts`
Expected: FAIL（`trackPath` 不存在；`../../src/data/hris` 不存在）。

- [ ] **Step 3: 实现**

`src/i18n.ts` 末尾加：

```ts
export type TrackId = 'ai' | 'hris';

/** Site-absolute page path in a track and a language. The HRIS track lives under /hris/, after the language prefix:
 *  /hris/brief/ and /en/hris/brief/. Use it for pages only, never for /downloads/, /assets/ or /media/. */
export function trackPath(track: TrackId, path: string, lang: Lang): string {
  const bare = stripLang(path);
  return localizePath(track === 'hris' ? (bare === '/' ? '/hris/' : `/hris${bare}`) : bare, lang);
}
```

`src/data/facts.ts`：`FactId` 联合类型加 `'F15'`；`FACTS` 末尾加：

```ts
  F15: { id: 'F15', figure: '100', text: { zh: '每满 100 份全部人工核对一次', en: 'every 100 files are all re-checked by hand' }, scope: '档案补录工作流的复核规则（不是抽查）', source: '经历档案 4.1，用户口述 2026-10-08', confirmed: '2026-10-08', public: true },
```

`src/data/hris.ts`（全部为草稿，Task 10 交用户确认）：

```ts
import type { Bi } from '../i18n';

type Card = { title: Bi; did: Bi };

/** Copy of the HRIS track (/hris/). Numbers come from the fact ledger only (tests/unit/hris-copy.test.ts). */
export const HRIS = {
  route: '/hris/',
  name: { zh: '何彦钧', en: 'Yanjun He' },
  meta: {
    home: { title: { zh: '何彦钧 · HRIS 与人力数据', en: 'Yanjun He · HRIS & People Data' }, description: { zh: '员工主数据核查、档案补录工作流与 SQL 数据分析。', en: 'Employee master-data checks, a records backfill workflow and SQL analysis.' } },
    brief: { title: { zh: '一分钟了解我 · 何彦钧', en: 'In one minute · Yanjun He' }, description: { zh: '实习、教育、技能与到岗信息。', en: 'Internship, education, skills and availability.' } },
    projects: { title: { zh: '全部项目 · 何彦钧', en: 'All projects · Yanjun He' }, description: { zh: '档案补录工作流、人岗匹配、SQL 数据库、问卷研究与额度工具。', en: 'Records backfill, job matching, an SQL database, a survey study and a quota tool.' } },
    workbench: { title: { zh: '流程终端 · 何彦钧', en: 'Workflow terminal · Yanjun He' }, description: { zh: '用虚构档案走一遍补录流程的三个版本。', en: 'Walk fictional records through the three versions of the backfill workflow.' } },
  },
  nav: {
    label: { zh: 'HRIS 导航', en: 'HRIS navigation' },
    index: { zh: '主页', en: 'Index' },
    brief: { zh: '一分钟了解我', en: 'In one minute' },
    projects: { zh: '全部项目', en: 'All projects' },
    workbench: { zh: '流程终端', en: 'Workflow terminal' },
    resume: { zh: '下载简历', en: 'Résumé (PDF)' },
    themeDark: { zh: '深色', en: 'Dark' },
    themeLight: { zh: '浅色', en: 'Light' },
    otherLang: { zh: 'EN', en: '中文' },
  },
  intro: { top: { zh: '何彦钧 · HRIS 与人力数据', en: 'Yanjun He · HRIS & people data' }, lines: ['HR DATA', 'GOVERNANCE.'], skip: { zh: '跳过', en: 'Skip' } },
  hero: {
    title: { zh: '将非标人事流程，重构为可稽核的数据资产。', en: 'Turning non-standard HR processes into data you can audit.' },
    lead: { zh: '丹纳赫实习期间，核查约 2000 名员工的档案主数据；把档案补录工作流迭代三版，最终版基于 Copilot + Power Automate，在公司批准的环境中运行，并交接给 mentor。', en: 'During my internship at Danaher I reviewed master records for about 2000 employees and iterated the records backfill into three versions; the final one, on Copilot + Power Automate, ran in the company-approved environment and was handed over to my mentor.' },
    doorBrief: { code: '1:00', label: { zh: '一分钟了解我', en: 'Know me in a minute' } },
    doorWorkbench: { code: 'LIVE', label: { zh: '打开档案补录流程终端', en: 'Open the backfill workflow terminal' } },
  },
  topology: {
    figure: { zh: '图 · 档案治理示意', en: 'Figure · records governance (illustration)' },
    note: { zh: '示意，不是实际数据', en: 'Illustration, not real data' },
    governed: { zh: '治理后：按状态归入整齐的分组', en: 'Governed: sorted into tidy groups by status' },
    raw: { zh: '治理前：字段口径不一、状态分散', en: 'Before: inconsistent fields, scattered states' },
    toRaw: { zh: '看治理前', en: 'Show before' },
    toGoverned: { zh: '看治理后', en: 'Show governed' },
    legend: { verified: { zh: '核验通过', en: 'Verified' }, review: { zh: '人工复核', en: 'Manual review' }, missing: { zh: '缺件待补', en: 'Missing' } },
  },
  ledger: [
    { figure: '6,000+', caption: { zh: '实习公司 CDP 系统覆盖的员工数（系统规模）', en: 'Employees covered by the company’s CDP system (system scale)' } },
    { figure: '2000', caption: { zh: '本人核查的档案主数据，约数', en: 'Employee master records I reviewed, approximately' } },
    { figure: '3', caption: { zh: '档案补录工作流迭代的版本', en: 'Versions of the records backfill workflow' } },
    { figure: '8', caption: { zh: '校园外卖课程设计的业务表', en: 'Business tables in the campus delivery course project' } },
  ],
  skills: [
    { group: { zh: '数据与报表', en: 'Data & reporting' }, items: { zh: 'Excel（数据透视表、函数、图表）· SQL · Python（Pandas、NumPy）· 数据分析与可视化', en: 'Excel (pivot tables, functions, charts) · SQL · Python (Pandas, NumPy) · data analysis and visualisation' } },
    { group: { zh: '流程与 AI 工具', en: 'Workflow & AI tools' }, items: { zh: 'Microsoft 365 Copilot · Power Automate · SharePoint · ChatGPT · DeepSeek', en: 'Microsoft 365 Copilot · Power Automate · SharePoint · ChatGPT · DeepSeek' } },
    { group: { zh: '语言', en: 'Languages' }, items: { zh: 'CET-6 550 分', en: 'CET-6: 550' } },
  ],
  brief: {
    experience: { zh: '经历', en: 'Experience' },
    education: { zh: '教育', en: 'Education' },
    skills: { zh: '技能', en: 'Skills' },
    availability: { zh: '到岗', en: 'Availability' },
    points: [
      { zh: '对接全国各区域 HR，跟进员工信息缺失与异常数据，推动档案补全。', en: 'Worked with regional HR teams across China to chase missing and inconsistent employee data until the records were complete.' },
      { zh: '核查约 2000 名员工的档案主数据；所在 CDP 系统覆盖 6,000+ 员工。', en: 'Reviewed master records for about 2000 employees, in a CDP system covering 6,000+ staff.' },
      { zh: '设计并使用档案补录工作流，迭代三版，最终版在公司批准的环境中运行并交接给 mentor。', en: 'Designed and used the records backfill workflow over three versions; the final one ran in the company-approved environment and was handed over to my mentor.' },
      { zh: '用 Excel 整理和分析合规数据，输出可视化报表。', en: 'Organised and analysed compliance data in Excel and produced visual reports.' },
      { zh: '因工作表现获得 HRBP 认可，被邀请延长实习。', en: 'Invited by the HRBP to extend the internship on the strength of my work.' },
    ],
    toWorkbench: { zh: '打开档案补录流程终端 →', en: 'Open the backfill workflow terminal →' },
  },
  projects: {
    title: { zh: '全部项目', en: 'All projects' },
    lead: { zh: '先看档案补录这段真实交付，再看几个能在浏览器里运行的数据与工具项目。', en: 'Start with the records backfill delivered during the internship, then the data and tool projects that run in your browser.' },
  },
  cards: {
    'hris-workflow': { title: { zh: '员工电子档案补录与主数据治理', en: 'Employee Records Backfill & Master Data' }, did: { zh: '核查约 2000 名员工的档案主数据；把补录拆成主名单、查找档案、确认身份、提取候选、HR 审核、写回核对六步，最终版基于 Copilot + Power Automate 在公司环境运行', en: 'Reviewed master records for about 2000 employees and split the backfill into six steps (roster, find file, confirm identity, extract candidates, HR review, write back and verify); the final version ran at the company on Copilot + Power Automate' } },
    'ai-career': { title: { zh: '人岗匹配评估引擎', en: 'Job–Candidate Matching Engine' }, did: { zh: '从求职一侧做的人岗匹配：把职位要求与候选人事实逐条对照，每条判断都能追溯到事实；借助 AI 编程工具开发', en: 'Matching built from the job seeker’s side: each requirement is set against the candidate’s facts and every judgement traces back to one; built with AI coding tools' } },
    'campus-delivery': { title: { zh: '校园业务数据库建模与 SQL 分析', en: 'Campus Database Modelling & SQL Analysis' }, did: { zh: '个人负责的课程设计：8 张业务表、事务与复合外键；在同一套表上用 SQL 回答五个经营问题，分析页为合成数据', en: 'A course project I was responsible for: 8 business tables with transactions and composite keys, then five business questions answered in SQL on the same schema (the analysis uses synthetic data)' } },
    'ai-campus': { title: { zh: '问卷设计与数据清洗：AI 校园应用研究', en: 'Survey Design & Data Cleaning: AI on Campus' }, did: { zh: '项目组长：设计问卷、清洗数据并做交叉统计，获校级大学生创新创业项目一等奖', en: 'Team lead: survey design, data cleaning and cross-tab analysis; First Prize, university student innovation programme' } },
    'quota-deck': { title: { zh: 'QuotaDeck：多服务额度汇总工具', en: 'QuotaDeck: Quotas in One Place' }, did: { zh: '借助 AI 编程工具开发的桌面工具：把多家 AI 服务的额度集中到一处，读不到的数据标为未知', en: 'A desktop tool built with AI coding tools: quotas from several AI services in one place, with anything unreadable marked unknown' } },
  } satisfies Record<string, Card>,
  footer: { note: { zh: '演示均为虚构或构造数据，不含任何公司真实资料与员工信息。', en: 'All demos use fictional or constructed data; no real company records or employee information.' } },
};
```

`src/data/tracks.ts` 整体替换为：

```ts
import { SITE, type ProjectEntry } from './site';
import { HRIS } from './hris';
import type { TrackId } from '../i18n';

/** The main site (ai) and the HRIS fallback (hris, under /hris/). */
export type Track = TrackId;

/** Project order per track (spec §2 and §4.3). */
export const TRACK_ORDER: Record<Track, readonly string[]> = {
  ai: ['ai-career', 'hris-workflow', 'quota-deck', 'campus-delivery', 'ai-campus'],
  hris: ['hris-workflow', 'ai-career', 'campus-delivery', 'ai-campus', 'quota-deck'],
};

/** Projects of a track in its order. The HRIS track rewrites each card's title and line; links stay /projects/<slug>/
 *  and are placed under /hris/ by trackPath when rendered. */
export function trackProjects(track: Track): ProjectEntry[] {
  return TRACK_ORDER[track].map(slug => {
    const p = SITE.projects.find(x => x.slug === slug);
    if (!p) throw new Error(`Unknown project in ${track} track: ${slug}`);
    const card = track === 'hris' ? HRIS.cards[slug as keyof typeof HRIS.cards] : undefined;
    return card ? { ...p, title: card.title, did: card.did } : p;
  });
}
```

- [ ] **Step 4: 跑测试**

Run: `npm test`
Expected：全部通过。若 `fonts.test.ts` 失败：HRIS 文案在 `src/data/hris.ts`，不在该测试的扫描清单里，不会失败；若 `claims.test.ts` 因 F15 失败，检查 F15 文字没有禁用词。

- [ ] **Step 5: 提交**

```bash
git add src/i18n.ts src/data/tracks.ts src/data/facts.ts src/data/hris.ts tests/unit/tracks.test.ts tests/unit/hris-copy.test.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS track: order, card rewrites, copy and trackPath; F15 every-hundred full re-check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: HRIS 外壳（主题、顶栏、页脚）与首页正文

**Files:**
- Modify: `src/data/tokens.ts`、`src/layouts/Base.astro`
- Create: `src/components/MotionBoot.astro`、`src/layouts/HrisBase.astro`、`src/components/hris/HrisTopbar.astro`、`src/components/hris/HrisFooter.astro`、`src/styles/hris.css`、`src/views/hris/HrisHomeView.astro`、`src/pages/hris/index.astro`、`src/pages/en/hris/index.astro`
- Create tests: `tests/unit/hris-theme.test.ts`、`tests/e2e/hris-home.spec.ts`

**Interfaces:**
- Consumes：`HRIS`、`trackPath`、`trackProjects('hris')`（Task 1）；`MotionSwitch.astro`（第一期）。
- Produces：
  - `HRIS_COLORS: { light: HrisPalette; dark: HrisPalette }`、`hrisThemeCss(): string`（`src/data/tokens.ts`）
  - `HrisBase.astro` props：`{ lang: Lang; path: string; title: string; description: string; intro?: boolean }`，`path` 为不带 `/hris` 的站内路径（如 `/brief/`）；`<html data-track="hris" data-theme="light|dark">`；`<body class="hris">`
  - `THEME_KEY = 'hyj-hris-theme'`
  - `MotionBoot.astro`（无 props）

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/hris-theme.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { HRIS_COLORS, hrisThemeCss, contrast } from '../../src/data/tokens';

for (const theme of ['light', 'dark'] as const) {
  const c = HRIS_COLORS[theme];
  describe(`HRIS ${theme} palette`, () => {
    it('body text and secondary text are readable on paper and on cards', () => {
      for (const bg of [c.paper, c.card]) {
        expect(contrast(c.ink, bg)).toBeGreaterThanOrEqual(7);
        expect(contrast(c.mute, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(c.accent, bg)).toBeGreaterThanOrEqual(4.5);
      }
    });
    it('status colours read as text on paper', () => {
      expect(contrast(c.verified, c.paper)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.warn, c.paper)).toBeGreaterThanOrEqual(4.5);
    });
    it('the filled button carries white text', () => {
      expect(contrast('#ffffff', c.accentFill)).toBeGreaterThanOrEqual(4.5);
    });
    it('structure lines stay visible (≥ 1.3:1 on paper)', () => {
      expect(contrast(c.line, c.paper)).toBeGreaterThanOrEqual(1.3);
    });
  });
}

describe('hrisThemeCss', () => {
  it('writes both palettes onto the site variables the shared components read', () => {
    const css = hrisThemeCss();
    for (const v of ['--paper', '--ink', '--mute', '--red', '--red-text', '--red-fill', '--night', '--night-fg', '--night-mute', '--card', '--line', '--verified', '--warn', '--font-body', '--font-display', '--font-cjk-bold', '--font-mono']) expect(css, v).toContain(`${v}:`);
    expect(css).toContain("html[data-track='hris'][data-theme='dark']");
    expect(css).toContain(HRIS_COLORS.dark.paper);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/hris-theme.test.ts`
Expected：FAIL（`HRIS_COLORS` 不存在）。

- [ ] **Step 3: 颜色与主题 CSS**

`src/data/tokens.ts` 末尾加：

```ts
export interface HrisPalette { paper: string; card: string; ink: string; mute: string; accent: string; accentFill: string; verified: string; warn: string; line: string; night: string; nightFg: string; nightMute: string }

/** The HRIS track's V3 palette (Gemini V3: warm stone paper, cobalt, clinical green), light and dark. */
export const HRIS_COLORS: { light: HrisPalette; dark: HrisPalette } = {
  light: { paper: '#f4f3ef', card: '#faf9f6', ink: '#111214', mute: '#52555a', accent: '#174ea6', accentFill: '#174ea6', verified: '#0f5223', warn: '#8a4600', line: '#c9c6bc', night: '#0b0c0e', nightFg: '#edeff2', nightMute: '#9aa0a6' },
  dark: { paper: '#0b0c0e', card: '#121417', ink: '#edeff2', mute: '#9aa0a6', accent: '#8ab4f8', accentFill: '#1a5fc8', verified: '#81c995', warn: '#fdd663', line: '#2e323a', night: '#050607', nightFg: '#edeff2', nightMute: '#9aa0a6' },
};

const HRIS_FONTS = [
  `--font-body:system-ui,-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`,
  `--font-display:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif`,
  `--font-cjk-bold:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif`,
  `--font-mono:ui-monospace,"SFMono-Regular",Consolas,monospace`,
];

/** Both HRIS palettes as CSS on the site's own variable names, so shared components (cards, demos, prose) pick them up. */
export function hrisThemeCss(): string {
  const vars = (c: HrisPalette) => [
    `--paper:${c.paper}`, `--card:${c.card}`, `--ink:${c.ink}`, `--mute:${c.mute}`, `--red:${c.accent}`, `--red-text:${c.accent}`,
    `--red-fill:${c.accentFill}`, `--verified:${c.verified}`, `--warn:${c.warn}`, `--line:${c.line}`, `--night:${c.night}`,
    `--night-fg:${c.nightFg}`, `--night-mute:${c.nightMute}`, `--rule:1px solid ${c.ink}`, `--hair:1px solid ${c.line}`,
  ].join(';');
  return `html[data-track='hris']{${vars(HRIS_COLORS.light)};${HRIS_FONTS.join(';')}}`
    + `html[data-track='hris'][data-theme='dark']{${vars(HRIS_COLORS.dark)}}`;
}
```

（`warn` 浅色取 `#8a4600`、`line` 取 `#c9c6bc`、深色 `accentFill` 取 `#1a5fc8`：是 V3 原色在对比度测试下的最小调整，V3 的 `#B05A00` 与 `#D6D4CC` 在纸色上不达标。）

- [ ] **Step 4: 跑单元测试**

Run: `npx vitest run tests/unit/hris-theme.test.ts`
Expected：PASS。若某条对比度不达标，只调深/调浅那一个颜色值，保持色相。

- [ ] **Step 5: 抽出 `MotionBoot.astro`**

`src/components/MotionBoot.astro`：把 `src/layouts/Base.astro` 里以 `/* Motion tier: the same rules as scripts/motion/tier.ts pickTier` 开头的整段 `<script is:inline>…</script>` 原样剪切进来（不改一个字符），`Base.astro` 原位置改为 `<MotionBoot />` 并 import。

- [ ] **Step 6: 写失败的端到端测试**

`tests/e2e/hris-home.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { trackProjects } from '../../src/data/tracks';
import { fact } from '../../src/data/facts';
import { motionOff, noHorizontalOverflow } from './helpers';

const skipHrisIntro = (page: import('@playwright/test').Page) => page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`HRIS home (${lang}): headline, lead, availability, ledger and projects`, async ({ page }) => {
    await skipHrisIntro(page);
    await motionOff(page);
    await page.goto(`${prefix}/hris/`);
    expect(await page.evaluate(() => document.documentElement.dataset.track)).toBe('hris');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HRIS.hero.title[lang]);
    await expect(page.locator('.h-lead')).toHaveText(HRIS.hero.lead[lang]);
    await expect(page.locator('.h-avail')).toHaveText(fact('F3').text[lang]);
    await expect(page.locator('.h-ledger__num')).toHaveText(HRIS.ledger.map(l => l.figure));
    const hrefs = await page.locator('.h-work a.h-work__title').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(hrefs).toEqual(trackProjects('hris').map(p => `${prefix}/hris${p.href}`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('HRIS pages use system fonts, not the main site\'s web fonts', async ({ page }) => {
  await skipHrisIntro(page);
  const fonts: string[] = [];
  page.on('request', r => { if (r.resourceType() === 'font' || r.url().endsWith('fonts.css')) fonts.push(r.url()); });
  await page.goto('/hris/');
  await page.waitForLoadState('networkidle');
  expect(fonts).toEqual([]);
});

test('theme: follows the system, the switch flips it and remembers', async ({ page }) => {
  await skipHrisIntro(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/hris/');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  await page.locator('[data-theme-toggle]').click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
});

test('storage blocked: theme still toggles on this page', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/hris/');
  await page.keyboard.press('Escape');
  await page.locator('[data-theme-toggle]').click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  expect(errors).toEqual([]);
});

test('phone: the headline and lead are on the first screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone');
  await skipHrisIntro(page);
  await motionOff(page);
  await page.goto('/hris/');
  const vh = page.viewportSize()!.height;
  for (const sel of ['h1', '.h-lead']) {
    const box = (await page.locator(sel).boundingBox())!;
    expect(box.y, sel).toBeLessThan(vh);
  }
});
```

Run: `npx playwright test tests/e2e/hris-home.spec.ts`
Expected：FAIL（`/hris/` 404）。

- [ ] **Step 7: 外壳**

`src/layouts/HrisBase.astro`：

```astro
---
import '../styles/base.css';
import '../styles/hris.css';
import { hrisThemeCss } from '../data/tokens';
import { trackPath, type Lang } from '../i18n';
import MotionBoot from '../components/MotionBoot.astro';
import HrisTopbar from '../components/hris/HrisTopbar.astro';
import HrisFooter from '../components/hris/HrisFooter.astro';

interface Props { lang: Lang; path: string; title: string; description: string }
const { lang, path, title, description } = Astro.props;
const origin = 'https://chiwawafromkk.github.io';
---
<!doctype html>
<html lang={lang === 'zh' ? 'zh-CN' : 'en'} data-track="hris" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href={origin + trackPath('hris', path, lang)} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style is:inline set:html={hrisThemeCss()}></style>
    <script is:inline>
      /* Theme before first paint: the visitor's choice, else the system's. */
      (function () {
        var d = document.documentElement, t = null;
        try { t = localStorage.getItem('hyj-hris-theme'); } catch (e) { /* storage blocked */ }
        if (t !== 'light' && t !== 'dark') { try { t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { t = 'light'; } }
        d.dataset.theme = t;
      })();
    </script>
    <MotionBoot />
    <slot name="head" />
  </head>
  <body class="hris">
    <a class="skip" href="#main">{lang === 'zh' ? '跳到内容' : 'Skip to content'}</a>
    <div class="h-shell">
      <HrisTopbar lang={lang} path={path} />
      <slot />
      <HrisFooter lang={lang} />
    </div>
    <slot name="overlay" />
    <script>
      import { watchFps } from '../scripts/motion/tier';
      import { initNightEntry } from '../scripts/night-entry';
      watchFps();
      initNightEntry();
    </script>
  </body>
</html>
```

`intro` 开场在 Task 7 加入。

`src/components/hris/HrisTopbar.astro`：

```astro
---
import { HRIS } from '../../data/hris';
import { SITE } from '../../data/site';
import { trackPath, type Lang } from '../../i18n';
interface Props { lang: Lang; path: string }
const { lang, path } = Astro.props;
const N = HRIS.nav;
const L = (p: string) => trackPath('hris', p, lang);
const other = lang === 'zh' ? 'en' : 'zh';
const links = [['/', N.index], ['/brief/', N.brief], ['/projects/', N.projects], ['/workbench/', N.workbench]] as const;
const current = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
---
<header class="h-top">
  <a class="h-top__brand" href={L('/')}><b>{HRIS.name[lang]}</b><span class="h-mono">/hris/</span></a>
  <nav class="h-top__nav" aria-label={N.label[lang]}>
    {links.map(([p, label]) => <a href={L(p)} aria-current={current(p) ? 'page' : undefined}>{label[lang]}</a>)}
  </nav>
  <div class="h-top__util">
    <a class="h-top__btn h-mono" href={trackPath('hris', path, other)} hreflang={other}>{N.otherLang[lang]}</a>
    <button type="button" class="h-top__btn h-mono" data-theme-toggle data-dark={N.themeDark[lang]} data-light={N.themeLight[lang]}>{N.themeDark[lang]}</button>
    <a class="h-top__cv h-mono" href={SITE.resume[lang]} download>{N.resume[lang]} ↓</a>
  </div>
</header>
<script>
  // The button names the theme it switches to; the choice is kept for later visits when storage allows.
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (btn) {
    const d = document.documentElement;
    const label = () => { btn.textContent = d.dataset.theme === 'dark' ? btn.dataset.light! : btn.dataset.dark!; btn.setAttribute('aria-pressed', String(d.dataset.theme === 'dark')); };
    label();
    btn.addEventListener('click', () => {
      d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('hyj-hris-theme', d.dataset.theme); } catch { /* storage blocked: this page still switches */ }
      label();
      document.dispatchEvent(new CustomEvent('hris-theme'));
    });
  }
</script>
```

`src/components/hris/HrisFooter.astro`：

```astro
---
import { HRIS } from '../../data/hris';
import { SITE } from '../../data/site';
import MotionSwitch from '../MotionSwitch.astro';
import type { Lang } from '../../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
---
<footer class="h-foot">
  <p class="h-mono">© {HRIS.name[lang]}</p>
  <p>{HRIS.footer.note[lang]}</p>
  <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
  <MotionSwitch lang={lang} />
</footer>
```

注意 `© 何彦钧` 不含数字；不写年份（年份不在台账里）。

`src/styles/hris.css`（V3 结构与比例；只作用于 `html[data-track='hris']`）：

```css
/* HRIS track (V3): stone paper, cobalt, exposed 1px structure, mono indices. Colours come from hrisThemeCss(). */
html[data-track='hris'] { background: var(--paper); transition: background-color 0.4s var(--ease), color 0.4s var(--ease); }
html[data-track='hris'] body { background: var(--paper); color: var(--ink); font: 400 16px/1.65 var(--font-body); }
.hris .h-mono { font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.04em; }
.hris .h-shell { max-width: 1380px; margin: 0 auto; border-inline: var(--hair); min-height: 100svh; }
.hris .h-top { position: sticky; top: 0; z-index: 30; display: grid; grid-template-columns: 260px 1fr auto; border-bottom: var(--hair); background: var(--paper); }
.hris .h-top__brand { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 18px 24px; border-right: var(--hair); text-decoration: none; }
.hris .h-top__brand .h-mono { color: var(--red-text); }
.hris .h-top__nav { display: flex; }
.hris .h-top__nav a { display: inline-flex; align-items: center; padding: 0 22px; border-right: var(--hair); color: var(--mute); text-decoration: none; font-size: 14px; }
.hris .h-top__nav a:hover, .hris .h-top__nav a[aria-current='page'] { color: var(--ink); background: var(--card); box-shadow: inset 0 -2px 0 var(--red); }
.hris .h-top__util { display: flex; border-left: var(--hair); }
.hris .h-top__btn { display: inline-flex; align-items: center; padding: 0 16px; border: 0; border-right: var(--hair); background: none; color: var(--mute); cursor: pointer; text-decoration: none; }
.hris .h-top__btn:hover { color: var(--ink); background: var(--card); }
.hris .h-top__cv { display: inline-flex; align-items: center; padding: 0 20px; background: var(--ink); color: var(--paper); text-decoration: none; }
.hris .h-top__cv:hover { background: var(--red-fill); color: #fff; }
.hris .h-foot { display: grid; grid-template-columns: 260px 1fr auto auto; align-items: center; gap: 0; border-top: var(--hair); background: var(--card); color: var(--mute); font-size: 14px; }
.hris .h-foot > * { padding: 20px 24px; border-right: var(--hair); }
.hris .h-foot > :last-child { border-right: 0; }
/* Sections: a 260 px label column and the content, split by structure lines. */
.hris .h-mast { display: grid; grid-template-columns: 260px 1fr; border-bottom: var(--hair); background: var(--card); }
.hris .h-mast > :first-child { padding: 22px 24px; border-right: var(--hair); color: var(--red-text); }
.hris .h-mast > h2 { padding: 22px 32px; font: 700 20px/1.3 var(--font-body); letter-spacing: -0.01em; }
/* Demos keep a light paper panel in the dark theme (spec §3.4). */
html[data-track='hris'][data-theme='dark'] [data-demo] { --paper: #f4f3ef; --card: #faf9f6; --ink: #111214; --mute: #52555a; --red: #174ea6; --red-text: #174ea6; --red-fill: #174ea6; --line: #c9c6bc; --hair: 1px solid #c9c6bc; --rule: 1px solid #111214; background: var(--paper); color: var(--ink); }
@media (max-width: 1024px) {
  .hris .h-top, .hris .h-foot, .hris .h-mast { grid-template-columns: 1fr; }
  .hris .h-top__brand, .hris .h-mast > :first-child { border-right: 0; border-bottom: var(--hair); }
  .hris .h-top__nav { overflow-x: auto; }
  .hris .h-foot > * { border-right: 0; border-bottom: var(--hair); }
}
```

`src/views/hris/HrisHomeView.astro`（本任务：首屏左栏 + 数字条 + 项目表；右栏的拓扑在 Task 3 加入）：

```astro
---
import HrisBase from '../../layouts/HrisBase.astro';
import { HRIS } from '../../data/hris';
import { fact } from '../../data/facts';
import { trackProjects } from '../../data/tracks';
import { trackPath, type Lang } from '../../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const H = HRIS.hero;
const L = (p: string) => trackPath('hris', p, lang);
const works = trackProjects('hris');
---
<HrisBase lang={lang} path="/" title={HRIS.meta.home.title[lang]} description={HRIS.meta.home.description[lang]}>
  <main id="main">
    <section class="h-hero">
      <div class="h-hero__copy">
        <p class="h-avail h-mono">{fact('F3').text[lang]}</p>
        <h1>{H.title[lang]}</h1>
        <p class="h-lead">{H.lead[lang]}</p>
        <nav class="h-doors" aria-label={HRIS.nav.label[lang]}>
          <a href={L('/brief/')}><span class="h-mono">{H.doorBrief.code} →</span><b>{H.doorBrief.label[lang]}</b></a>
          <a href={L('/workbench/')}><span class="h-mono">{H.doorWorkbench.code} →</span><b>{H.doorWorkbench.label[lang]}</b></a>
        </nav>
      </div>
    </section>
    <section class="h-ledger" aria-label={lang === 'zh' ? '数字' : 'Figures'}>
      {HRIS.ledger.map(l => (
        <div class="h-ledger__item">
          <p class="h-ledger__num h-mono" data-ledger-num>{l.figure}</p>
          <p class="h-ledger__cap">{l.caption[lang]}</p>
        </div>
      ))}
    </section>
    <div class="h-mast"><span class="h-mono">{lang === 'zh' ? '项目' : 'Projects'}</span><h2>{HRIS.projects.title[lang]}</h2></div>
    <section class="h-works">
      {works.map(p => (
        <article class="h-work">
          <div class="h-work__meta h-mono">{p.status[lang]}</div>
          <div class="h-work__body">
            <a class="h-work__title" href={L(p.href)}>{p.title[lang]}</a>
            <p>{p.did[lang]}</p>
          </div>
          <div class="h-work__act">
            <a class="h-act" href={L(p.href)}>{lang === 'zh' ? '看过程与取舍' : 'Process & trade-offs'} →</a>
            {p.live && <a class="h-act h-act--fill" href={L(p.live.href)}>{lang === 'zh' ? '在浏览器里运行' : 'Run it in your browser'} <span aria-hidden="true">↗</span></a>}
          </div>
        </article>
      ))}
    </section>
  </main>
</HrisBase>
<style>
  .h-hero { display: grid; grid-template-columns: 1.15fr 1fr; min-height: 560px; border-bottom: var(--hair); }
  .h-hero__copy { display: flex; flex-direction: column; justify-content: space-between; gap: 40px; padding: 64px 48px; border-right: var(--hair); }
  .h-avail { color: var(--red-text); }
  .h-hero h1 { margin: 20px 0 24px; font: 700 clamp(34px, 4.2vw, 58px)/1.1 var(--font-display); letter-spacing: -0.03em; }
  .h-lead { max-width: 36em; color: var(--mute); font-size: 17px; line-height: 1.75; }
  .h-doors { display: grid; grid-template-columns: 1fr 1fr; border: var(--rule); background: var(--card); }
  .h-doors a { display: grid; gap: 12px; padding: 20px 22px; text-decoration: none; transition: background-color 0.25s var(--ease), color 0.25s var(--ease); }
  .h-doors a + a { border-left: var(--rule); }
  .h-doors a .h-mono { color: var(--red-text); }
  .h-doors a:hover, .h-doors a:focus-visible { background: var(--ink); color: var(--paper); }
  .h-doors a:hover .h-mono, .h-doors a:focus-visible .h-mono { color: var(--paper); }
  .h-doors b { font-size: 16px; }
  .h-ledger { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: var(--hair); }
  .h-ledger__item { display: grid; gap: 12px; align-content: start; padding: 36px 32px; border-right: var(--hair); }
  .h-ledger__item:last-child { border-right: 0; }
  .h-ledger__num { font-size: clamp(36px, 3.6vw, 52px); font-weight: 500; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }
  .h-ledger__cap { color: var(--mute); font-size: 14px; }
  .h-work { display: grid; grid-template-columns: 260px 1fr 240px; border-bottom: var(--hair); transition: background-color 0.25s var(--ease); }
  .h-work:hover { background: var(--card); }
  .h-work > * { padding: 32px 24px; border-right: var(--hair); }
  .h-work > :last-child { border-right: 0; }
  .h-work__meta { color: var(--mute); }
  .h-work__title { display: block; margin-bottom: 10px; font: 700 21px/1.35 var(--font-body); text-decoration: none; }
  .h-work__title:hover { color: var(--red-text); }
  .h-work__body p { max-width: 38em; color: var(--mute); font-size: 15px; }
  .h-work__act { display: grid; align-content: center; gap: 10px; }
  .h-act { display: flex; justify-content: space-between; padding: 10px 14px; border: var(--rule); font-size: 14px; text-decoration: none; transition: background-color 0.2s var(--ease), color 0.2s var(--ease); }
  .h-act--fill { background: var(--ink); color: var(--paper); }
  .h-act:hover, .h-act:focus-visible { background: var(--red-fill); border-color: var(--red-fill); color: #fff; }
  @media (max-width: 1024px) {
    .h-hero, .h-work { grid-template-columns: 1fr; }
    .h-hero__copy, .h-work > * { border-right: 0; border-bottom: var(--hair); }
    .h-hero__copy { padding: 36px 20px; }
    .h-ledger { grid-template-columns: 1fr 1fr; }
    .h-ledger__item:nth-child(2) { border-right: 0; }
  }
  @media (max-width: 640px) { .h-doors { grid-template-columns: 1fr; } .h-doors a + a { border-left: 0; border-top: var(--rule); } }
</style>
```

`src/pages/hris/index.astro`：

```astro
---
import HrisHomeView from '../../views/hris/HrisHomeView.astro';
---
<HrisHomeView lang="zh" />
```

`src/pages/en/hris/index.astro`：同上，路径前缀多一层 `../`，`lang="en"`。

- [ ] **Step 8: 跑测试**

Run: `npm test && npx playwright test tests/e2e/hris-home.spec.ts tests/e2e/home.spec.ts tests/e2e/intro.spec.ts`
Expected：全部通过（主站开场与首页不受 `MotionBoot` 抽取影响）。

- [ ] **Step 9: 提交**

```bash
git add src/data/tokens.ts src/layouts/Base.astro src/components/MotionBoot.astro src/layouts/HrisBase.astro src/components/hris src/styles/hris.css src/views/hris src/pages/hris src/pages/en/hris tests/unit/hris-theme.test.ts tests/e2e/hris-home.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS shell: V3 palette from one source, light/dark theme, topbar and footer; HRIS home copy, ledger and projects

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 首屏治理拓扑

**Files:**
- Create: `src/scripts/hris-topology.ts`、`src/scripts/hris-topology-dom.ts`、`src/components/hris/Topology.astro`、`tests/unit/hris-topology.test.ts`、`tests/e2e/hris-topology.spec.ts`
- Modify: `src/views/hris/HrisHomeView.astro`（首屏右栏）

**Interfaces:**
- Consumes：`currentTier()`、`Tier`、`frameCap()`、`HRIS.topology`、`HRIS_COLORS`、`contrast`、`blend`。
- Produces：`mulberry32(seed): () => number`、`nodeCount(tier: Tier): number`、`governedTargets(n, w, h): Target[]`、`rawTargets(n, w, h, rand): Pt[]`、`springStep(p, v, target, dt, k?, c?): [number, number]`、`repel(x, y, mx, my, radius?, push?): [number, number]`、`settleTime(k, c, dt, tol?): number`；`Kind = 'verified' | 'review' | 'missing'`。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/hris-topology.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { mulberry32, nodeCount, governedTargets, rawTargets, springStep, repel, settleTime, SPLIT } from '../../src/scripts/hris-topology';
import { HRIS_COLORS, contrast } from '../../src/data/tokens';

describe('topology layout', () => {
  const g = governedTargets(2000, 560, 380);
  it('one target per node, all inside the frame', () => {
    expect(g).toHaveLength(2000);
    for (const t of g) { expect(t.x).toBeGreaterThan(0); expect(t.x).toBeLessThan(560); expect(t.y).toBeGreaterThan(0); expect(t.y).toBeLessThan(380); }
  });
  it('three groups in a row, left to right: verified, review, missing', () => {
    const maxX = (k: string) => Math.max(...g.filter(t => t.kind === k).map(t => t.x));
    const minX = (k: string) => Math.min(...g.filter(t => t.kind === k).map(t => t.x));
    expect(maxX('verified')).toBeLessThan(minX('review'));
    expect(maxX('review')).toBeLessThan(minX('missing'));
  });
  it('the group sizes follow the illustration split', () => {
    const n = (k: string) => g.filter(t => t.kind === k).length;
    expect(n('verified') + n('review') + n('missing')).toBe(2000);
    expect(Math.abs(n('review') / 2000 - SPLIT.review)).toBeLessThan(0.01);
  });
  it('raw targets scatter over the frame and are reproducible from the seed', () => {
    const a = rawTargets(50, 560, 380, mulberry32(3)), b = rawTargets(50, 560, 380, mulberry32(3));
    expect(a).toEqual(b);
    expect(new Set(a.map(p => Math.round(p.x / 56))).size).toBeGreaterThan(5);
  });
  it('node counts by tier: full 2000, lite and gentle 600, off draws the still grid', () => {
    expect(nodeCount('full')).toBe(2000);
    expect(nodeCount('lite')).toBe(600);
    expect(nodeCount('gentle')).toBe(600);
    expect(nodeCount('off')).toBe(600);
  });
});

describe('spring', () => {
  it('settles on its target within a second without ringing', () => {
    let p = 0, v = 0, peak = 0;
    for (let i = 0; i < 60; i++) { [p, v] = springStep(p, v, 100, 1 / 60); peak = Math.max(peak, p); }
    expect(Math.abs(p - 100)).toBeLessThan(1);
    expect(peak).toBeLessThan(108);
  });
  it('settleTime reports the same', () => expect(settleTime(120, 22, 1 / 60)).toBeLessThan(1));
});

describe('pointer', () => {
  it('pushes nodes within the radius away from the pointer, leaves others alone', () => {
    const [x] = repel(110, 100, 100, 100);
    expect(x).toBeGreaterThan(110);
    expect(repel(300, 300, 100, 100)).toEqual([300, 300]);
  });
});

describe('colours on the card', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`${theme}: node colours stand out from the card (≥ 3:1)`, () => {
      const c = HRIS_COLORS[theme];
      for (const col of [c.verified, c.warn, c.accent, c.mute]) expect(contrast(col, c.card)).toBeGreaterThanOrEqual(3);
    });
  }
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/hris-topology.test.ts`
Expected：FAIL（模块不存在）。

- [ ] **Step 3: 纯函数**

`src/scripts/hris-topology.ts`：

```ts
import type { Tier } from './motion/tier';

export type Kind = 'verified' | 'review' | 'missing';
export interface Pt { x: number; y: number }
export interface Target extends Pt { kind: Kind }

/** Share of each group in the illustration (labelled "illustration, not real data" on the page). */
export const SPLIT: Record<Kind, number> = { verified: 0.8, review: 0.15, missing: 0.05 };
const KINDS: Kind[] = ['verified', 'review', 'missing'];
const PAD = 24;

/** Small seeded generator, so the scatter is the same on every visit and in tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nodeCount(tier: Tier): number {
  return tier === 'full' ? 2000 : 600;
}

/** Governed state: three tidy grids side by side (verified, review, missing), widths in proportion to their share. */
export function governedTargets(n: number, w: number, h: number): Target[] {
  const counts = KINDS.map(k => Math.round(n * SPLIT[k]));
  counts[0] = n - counts[1] - counts[2];
  const gap = 18, usableW = w - 2 * PAD - gap * 2, usableH = h - 2 * PAD;
  const out: Target[] = [];
  let left = PAD;
  KINDS.forEach((kind, i) => {
    const bw = Math.max(12, usableW * SPLIT[kind]);
    const cols = Math.max(1, Math.round(Math.sqrt((counts[i] * bw) / usableH)));
    const rows = Math.ceil(counts[i] / cols);
    for (let j = 0; j < counts[i]; j++) {
      const c = j % cols, r = Math.floor(j / cols);
      out.push({ kind, x: left + (cols === 1 ? bw / 2 : (c / (cols - 1)) * bw), y: PAD + (rows === 1 ? usableH / 2 : (r / (rows - 1)) * usableH) });
    }
    left += bw + gap;
  });
  return out;
}

/** Before governance: positions scattered over the frame. */
export function rawTargets(n: number, w: number, h: number, rand: () => number): Pt[] {
  return Array.from({ length: n }, () => ({ x: PAD + rand() * (w - 2 * PAD), y: PAD + rand() * (h - 2 * PAD) }));
}

/** One step of a damped spring (semi-implicit Euler). k stiffness, c damping; c ≈ 2√k is critical. */
export function springStep(p: number, v: number, target: number, dt: number, k = 120, c = 22): [number, number] {
  const nv = v + (k * (target - p) - c * v) * dt;
  return [p + nv * dt, nv];
}

/** Seconds a spring from 0 to 1 needs to stay within tol of its target. */
export function settleTime(k: number, c: number, dt: number, tol = 0.01): number {
  let p = 0, v = 0, t = 0, last = 0;
  while (t < 10) {
    [p, v] = springStep(p, v, 1, dt, k, c);
    t += dt;
    if (Math.abs(p - 1) > tol) last = t;
    if (t - last > 0.5) break;
  }
  return last;
}

/** Pushes (x, y) away from the pointer (mx, my) when within radius, by up to push px. */
export function repel(x: number, y: number, mx: number, my: number, radius = 64, push = 2.2): [number, number] {
  const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy);
  if (d === 0 || d >= radius) return [x, y];
  const f = push * (1 - d / radius) + push * 0.5;
  return [x + (dx / d) * f, y + (dy / d) * f];
}
```

- [ ] **Step 4: 跑单元测试**

Run: `npx vitest run tests/unit/hris-topology.test.ts`
Expected：PASS。若"不振荡"用例失败（峰值 ≥ 108），把 `springStep` 默认 `c` 提到 `24`（仍接近临界阻尼），并在台账记录。

- [ ] **Step 5: 写失败的端到端测试**

`tests/e2e/hris-topology.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { motionOff } from './helpers';

const skip = (page: import('@playwright/test').Page) => page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });
const inked = (page: import('@playwright/test').Page) => page.locator('[data-topology] canvas').evaluate((c: HTMLCanvasElement) => {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n;
});

test('full: the canvas draws, and the switch moves between before and governed', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.goto('/hris/');
  await expect.poll(() => inked(page), { timeout: 3000 }).toBeGreaterThan(1500);
  const btn = page.locator('[data-topology] button');
  await expect(btn).toHaveText(HRIS.topology.toRaw.zh);
  await btn.click();
  await expect(btn).toHaveText(HRIS.topology.toGoverned.zh);
  await expect(page.locator('[data-topology] [data-topology-state]')).toHaveText(HRIS.topology.raw.zh);
});

test('labelled as an illustration, not data', async ({ page }) => {
  await skip(page);
  await page.goto('/hris/');
  await expect(page.locator('[data-topology]')).toContainText(HRIS.topology.note.zh);
});

test('motion off: a still grid drawn without the canvas loop', async ({ page }) => {
  await skip(page);
  await motionOff(page);
  await page.goto('/hris/');
  await expect(page.locator('[data-topology] svg.topo-still')).toBeVisible();
  await expect(page.locator('[data-topology] canvas')).toBeHidden();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the still grid shows', async ({ page }) => {
    await page.goto('/hris/');
    await expect(page.locator('[data-topology] svg.topo-still')).toBeVisible();
  });
});
```

Run: `npx playwright test tests/e2e/hris-topology.spec.ts`
Expected：FAIL。

- [ ] **Step 6: 组件与驱动**

`src/components/hris/Topology.astro`：

```astro
---
import { HRIS } from '../../data/hris';
import { governedTargets } from '../../scripts/hris-topology';
import type { Lang } from '../../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const T = HRIS.topology;
const still = governedTargets(600, 560, 380);
---
<figure class="topo" data-topology>
  <figcaption class="topo__head h-mono"><span>{T.figure[lang]}</span><span>{T.note[lang]}</span></figcaption>
  <div class="topo__view">
    <svg class="topo-still" viewBox="0 0 560 380" aria-hidden="true">
      {still.map(t => <rect class={`k-${t.kind}`} x={(t.x - 2).toFixed(1)} y={(t.y - 2).toFixed(1)} width="4" height="4" />)}
    </svg>
    <canvas hidden aria-hidden="true"></canvas>
  </div>
  <div class="topo__foot">
    <p data-topology-state>{T.governed[lang]}</p>
    <ul class="topo__legend h-mono">
      <li class="k-verified">{T.legend.verified[lang]}</li><li class="k-review">{T.legend.review[lang]}</li><li class="k-missing">{T.legend.missing[lang]}</li>
    </ul>
    <button type="button" class="h-mono" aria-pressed="true" data-to-raw={T.toRaw[lang]} data-to-governed={T.toGoverned[lang]} data-raw={T.raw[lang]} data-governed={T.governed[lang]}>{T.toRaw[lang]}</button>
  </div>
</figure>
<script>
  import { initTopology } from '../../scripts/hris-topology-dom';
  const fig = document.querySelector<HTMLElement>('[data-topology]');
  if (fig) initTopology(fig);
</script>
<style>
  .topo { display: grid; grid-template-rows: auto 1fr auto; margin: 0; background: var(--card); }
  .topo__head { display: flex; justify-content: space-between; gap: 12px; padding: 16px 24px; border-bottom: var(--hair); color: var(--mute); }
  .topo__view { position: relative; min-height: 380px; }
  .topo__view svg, .topo__view canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .topo-still .k-verified, .topo__legend .k-verified::before { fill: var(--verified); background: var(--verified); }
  .topo-still .k-review, .topo__legend .k-review::before { fill: var(--red); background: var(--red); }
  .topo-still .k-missing, .topo__legend .k-missing::before { fill: var(--warn); background: var(--warn); }
  .topo__foot { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; align-items: center; padding: 16px 24px; border-top: var(--hair); background: var(--paper); }
  .topo__foot p { color: var(--mute); font-size: 14px; }
  .topo__legend { display: flex; gap: 14px; margin: 0; padding: 0; list-style: none; color: var(--mute); }
  .topo__legend li::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 6px; }
  .topo__foot button { grid-column: 2; grid-row: 1 / 3; padding: 9px 14px; border: var(--rule); background: var(--card); color: var(--ink); cursor: pointer; }
  .topo__foot button[aria-pressed='true'] { background: var(--red-fill); border-color: var(--red-fill); color: #fff; }
  .topo.is-live .topo-still { display: none; }
</style>
```

`src/scripts/hris-topology-dom.ts`：

```ts
import { governedTargets, rawTargets, springStep, repel, nodeCount, mulberry32, type Kind } from './hris-topology';
import { currentTier } from './motion/tier';
import { frameCap } from './frame-cap';

/** Runs the HRIS home topology: nodes spring between scattered (before) and grouped (governed) positions; a fine pointer
 *  pushes nodes aside (full tier). Pauses off screen and in hidden tabs; motion off keeps the server-drawn still grid. */
export function initTopology(fig: HTMLElement): void {
  const tier = currentTier();
  const canvas = fig.querySelector('canvas');
  const btn = fig.querySelector<HTMLButtonElement>('button')!;
  const state = fig.querySelector<HTMLElement>('[data-topology-state]')!;
  let governed = true;
  const setLabels = () => {
    btn.textContent = governed ? btn.dataset.toRaw! : btn.dataset.toGoverned!;
    btn.setAttribute('aria-pressed', String(governed));
    state.textContent = governed ? btn.dataset.governed! : btn.dataset.raw!;
  };
  btn.addEventListener('click', () => { governed = !governed; setLabels(); });
  const ctx = canvas?.getContext('2d');
  if (tier === 'off' || !canvas || !ctx) return;

  const view = canvas.parentElement!;
  const n = nodeCount(tier);
  const rand = mulberry32(2026);
  const k = tier === 'gentle' ? 30 : 120, c = tier === 'gentle' ? 11 : 22;
  const cap = frameCap(tier === 'full' ? 60 : 30);
  let w = 0, h = 0, kinds: Kind[] = [], gx: Float32Array, gy: Float32Array, rx: Float32Array, ry: Float32Array;
  let x = new Float32Array(n), y = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n);
  let colours: Record<Kind | 'raw', string> = { verified: '', review: '', missing: '', raw: '' };
  const readColours = () => {
    const cs = getComputedStyle(fig);
    colours = { verified: cs.getPropertyValue('--verified').trim(), review: cs.getPropertyValue('--red').trim(), missing: cs.getPropertyValue('--warn').trim(), raw: cs.getPropertyValue('--mute').trim() };
  };
  const layout = () => {
    const r = view.getBoundingClientRect();
    w = r.width; h = r.height;
    const dpr = tier === 'full' ? Math.min(2, devicePixelRatio || 1) : 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = governedTargets(n, w, h), raw = rawTargets(n, w, h, rand);
    kinds = g.map(t => t.kind);
    gx = Float32Array.from(g, t => t.x); gy = Float32Array.from(g, t => t.y);
    rx = Float32Array.from(raw, p => p.x); ry = Float32Array.from(raw, p => p.y);
    if (!x[0]) { x = Float32Array.from(gx); y = Float32Array.from(gy); }
  };
  let mx = -1e4, my = -1e4;
  if (tier === 'full' && matchMedia('(pointer: fine)').matches) {
    canvas.style.pointerEvents = 'auto';
    canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    canvas.addEventListener('pointerleave', () => { mx = my = -1e4; });
  }
  let t0 = performance.now(), raf = 0, onScreen = true;
  const draw = (now: number) => {
    raf = requestAnimationFrame(draw);
    if (!cap(now)) return;
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    ctx.clearRect(0, 0, w, h);
    for (const kind of ['verified', 'review', 'missing'] as Kind[]) {
      ctx.fillStyle = governed ? colours[kind] : colours.raw;
      for (let i = 0; i < n; i++) {
        if (kinds[i] !== kind) continue;
        const drift = governed ? 0 : Math.sin(now / 1400 + i) * 6;
        [x[i], vx[i]] = springStep(x[i], vx[i], (governed ? gx[i] : rx[i]) + drift, dt, k, c);
        [y[i], vy[i]] = springStep(y[i], vy[i], (governed ? gy[i] : ry[i]) + drift * 0.6, dt, k, c);
        if (mx > -1e3) [x[i], y[i]] = repel(x[i], y[i], mx, my);
        ctx.fillRect(x[i] - 1.5, y[i] - 1.5, 3, 3);
      }
    }
  };
  const run = () => { if (!raf && onScreen && document.visibilityState === 'visible') { t0 = performance.now(); raf = requestAnimationFrame(draw); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  readColours(); layout();
  canvas.hidden = false;
  fig.classList.add('is-live');
  addEventListener('resize', () => layout());
  document.addEventListener('hris-theme', readColours);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) run(); else stop(); }).observe(fig);
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? run() : stop()));
  run();
}
```

`src/views/hris/HrisHomeView.astro`：import `Topology`；在 `.h-hero__copy` 之后加 `<Topology lang={lang} />`。`.h-hero` 的两列布局在 Task 2 的样式里已经写好。

- [ ] **Step 7: 跑测试**

Run: `npm test && npx playwright test tests/e2e/hris-topology.spec.ts tests/e2e/hris-home.spec.ts`
Expected：全部通过。

- [ ] **Step 8: 提交**

```bash
git add src/scripts/hris-topology.ts src/scripts/hris-topology-dom.ts src/components/hris/Topology.astro src/views/hris/HrisHomeView.astro tests/unit/hris-topology.test.ts tests/e2e/hris-topology.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS home: governance topology — scattered records spring into three status groups; still grid without motion

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 详情页与完整版页的 HRIS 版本

**Files:**
- Modify: `src/layouts/ProjectLayout.astro`、`src/views/HrisView.astro`、`CareerView.astro`、`CampusView.astro`、`AiCampusView.astro`、`QuotaView.astro`、`InsightsView.astro`、`LiveView.astro`、`src/components/EditionTeaser.astro`、`src/components/InsightsTeaser.astro`、`src/styles/hris.css`
- Create pages：`src/pages/hris/projects/{hris-workflow,ai-career,campus-delivery,ai-campus,quota-deck}.astro`、`src/pages/hris/projects/{ai-career,ai-campus,quota-deck}/live.astro`、`src/pages/hris/projects/campus-delivery/insights.astro`，以及 `src/pages/en/hris/...` 同样 9 个
- Create tests: `tests/e2e/hris-detail.spec.ts`

**Interfaces:**
- Consumes：`Track`、`trackPath`、`trackProjects`、`HrisBase`。
- Produces：每个 View 与 `ProjectLayout`、`EditionTeaser`、`InsightsTeaser`、`LiveView` 新增 prop `track?: Track`（默认 `'ai'`）。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/hris-detail.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { trackProjects } from '../../src/data/tracks';
import { motionOff, noHorizontalOverflow } from './helpers';

const PAGES = ['/hris/projects/hris-workflow/', '/hris/projects/ai-career/', '/hris/projects/campus-delivery/', '/hris/projects/ai-campus/', '/hris/projects/quota-deck/',
  '/hris/projects/ai-career/live/', '/hris/projects/ai-campus/live/', '/hris/projects/quota-deck/live/', '/hris/projects/campus-delivery/insights/'];

for (const p of PAGES) {
  test(`${p} is an HRIS page whose own links stay in the track`, async ({ page }) => {
    await motionOff(page);
    await page.goto(p);
    expect(await page.evaluate(() => document.documentElement.dataset.track)).toBe('hris');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    const pageLinks = await page.locator('a[href^="/"]').evaluateAll(as => as.map(a => a.getAttribute('href')!).filter(h => !/^\/(downloads|assets|media|og|favicon)/.test(h)));
    for (const h of pageLinks) expect(h, p).toMatch(/^\/(en\/)?hris\//);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('the pager walks the HRIS order', async ({ page }) => {
  await motionOff(page);
  await page.goto('/hris/projects/hris-workflow/');
  const next = trackProjects('hris')[1];
  await expect(page.locator('.p-pager a').last()).toHaveAttribute('href', `/hris${next.href}`);
});

test('dark theme: demos sit on a light panel and stay readable', async ({ page }) => {
  await motionOff(page);
  await page.addInitScript(() => { try { localStorage.setItem('hyj-hris-theme', 'dark'); } catch { /* blocked */ } });
  await page.goto('/hris/projects/ai-career/');
  const demo = page.locator('[data-demo]').first();
  const bg = await demo.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(244, 243, 239)');
  const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(body).not.toBe('rgb(244, 243, 239)');
});

test('the main site pages are untouched by the HRIS skin', async ({ page }) => {
  await motionOff(page);
  await page.goto('/projects/ai-career/');
  expect(await page.evaluate(() => document.documentElement.dataset.track)).toBeUndefined();
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx playwright test tests/e2e/hris-detail.spec.ts`
Expected：HRIS 页面 404，前 11 条失败；最后一条通过（守卫）。

- [ ] **Step 3: `track` 贯通**

`src/layouts/ProjectLayout.astro`：
- import 加 `import HrisBase from './HrisBase.astro';`、`import { trackPath, type Lang, type Bi } from '../i18n';`（替换原 `localizePath` 的导入，保留 `Lang`、`Bi`）、`import type { Track } from '../data/tracks';`
- `Props` 加 `track?: Track`；解构加 `track = 'ai'`。
- `order` 改为：`const order = track === 'hris' ? trackProjects('hris') : [...trackProjects('ai'), ...SITE.projects.filter(p => p.line === 'film')];`
- 两处 `localizePath(prev.href, lang)` / `localizePath(next.href, lang)` 改为 `trackPath(track, prev.href, lang)` / `trackPath(track, next.href, lang)`。
- 外层外壳按 track 选择。在 frontmatter 加：

```ts
const Shell = track === 'hris' ? HrisBase : Base;
const shellProps = track === 'hris'
  ? { lang, path, title: `${title[lang]} · ${SITE.name[lang]}`, description: description[lang] }
  : { lang, path, night, title: `${title[lang]} · ${SITE.name[lang]}`, description: description[lang] };
```

模板里的 `<Base lang={lang} path={path} night={night} title={…} description={…}>` 与对应的 `</Base>` 改为 `<Shell {...shellProps}>` 与 `</Shell>`（Astro 动态组件：同一段插槽交给按 track 选中的外壳）。`<main>` 加 `class:list={[{ 'p-hris': track === 'hris' }]}`。

每个 View（`HrisView`、`CareerView`、`CampusView`、`AiCampusView`、`QuotaView`、`InsightsView`）：
- import `type Track`；`interface Props { lang: Lang; track?: Track }`；`const { lang, track = 'ai' } = Astro.props;`
- `<ProjectLayout …>` 加 `track={track}`；
- `<EditionTeaser which="…" lang={lang} />` 加 `track={track}`；`<InsightsTeaser lang={lang} />` 加 `track={track}`。

`src/views/LiveView.astro`：同样加 `track`，传给 `ProjectLayout`；返回链接 `localizePath(\`/projects/${E.slug}/\`, lang)` 改为 `trackPath(track, \`/projects/${E.slug}/\`, lang)`。

`src/components/EditionTeaser.astro`、`InsightsTeaser.astro`：`Props` 加 `track?: Track`，链接改用 `trackPath(track, …, lang)`。

- [ ] **Step 4: HRIS 路由**

每个页面一行。例：`src/pages/hris/projects/ai-career.astro`

```astro
---
import CareerView from '../../../views/CareerView.astro';
---
<CareerView lang="zh" track="hris" />
```

`src/pages/hris/projects/ai-career/live.astro`

```astro
---
import LiveView from '../../../../views/LiveView.astro';
---
<LiveView which="career" lang="zh" track="hris" />
```

其余：`hris-workflow` → `HrisView`；`campus-delivery` → `CampusView`；`ai-campus` → `AiCampusView`；`quota-deck` → `QuotaView`；`ai-campus/live` → `LiveView which="campus"`；`quota-deck/live` → `LiveView which="quota"`；`campus-delivery/insights` → `InsightsView`。英文版在 `src/pages/en/hris/projects/…`，import 路径多一层 `../`，`lang="en"`。

- [ ] **Step 5: V3 皮肤**

`src/styles/hris.css` 末尾追加（同一套详情页结构换成 V3 样子）：

```css
/* Project pages in the HRIS track: the shared ProjectLayout markup in V3's structure. */
.hris .p-hris .p-head { padding: 48px 32px 36px; border-bottom: var(--hair); }
.hris .p-hris .p-tags li { border: var(--hair); font-family: var(--font-mono); font-size: 13px; }
.hris .p-hris .p-title { font: 700 clamp(34px, 5vw, 64px)/1.08 var(--font-display); letter-spacing: -0.03em; }
.hris .p-hris .p-lead { color: var(--mute); }
.hris .p-hris .p-summary { padding: 0; }
.hris .p-hris .p-summary .label { padding: 18px 32px; margin: 0; border-bottom: var(--hair); background: var(--card); font-family: var(--font-mono); letter-spacing: 0.04em; text-transform: none; }
.hris .p-hris .p-row { grid-template-columns: 260px 1fr; gap: 0; padding: 0; border-top: 0; border-bottom: var(--hair); }
.hris .p-hris .p-row dt { padding: 20px 24px; border-right: var(--hair); font: 600 15px/1.6 var(--font-body); }
.hris .p-hris .p-row dd { padding: 20px 32px; }
.hris .p-hris .prose { padding-inline: 32px; }
.hris .p-hris .prose h2 { font: 700 24px/1.3 var(--font-body); }
.hris .p-hris .p-pager { border-top: var(--hair); font-family: var(--font-mono); font-size: 14px; }
.hris .edition-teaser, .hris .teaser { background: var(--ink); color: var(--paper); }
@media (max-width: 640px) {
  .hris .p-hris .p-row { grid-template-columns: 1fr; }
  .hris .p-hris .p-row dt { border-right: 0; border-bottom: var(--hair); }
  .hris .p-hris .p-head, .hris .p-hris .p-row dd, .hris .p-hris .prose { padding-inline: 20px; }
}
```

- [ ] **Step 6: 跑测试**

Run: `npm test && npx playwright test tests/e2e/hris-detail.spec.ts tests/e2e/phase2b.spec.ts tests/e2e/editions.spec.ts tests/e2e/summary.spec.ts tests/e2e/career-live.spec.ts`
Expected：全部通过（主站详情页与完整版不受影响）。

- [ ] **Step 7: 提交**

```bash
git add src/layouts/ProjectLayout.astro src/views src/components/EditionTeaser.astro src/components/InsightsTeaser.astro src/styles/hris.css src/pages/hris src/pages/en/hris tests/e2e/hris-detail.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS project and live pages: the shared layout in the V3 shell, links kept inside /hris/

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: HRIS 一分钟版与全部项目

**Files:**
- Create: `src/views/hris/HrisBriefView.astro`、`src/views/hris/HrisProjectsView.astro`、`src/pages/hris/brief.astro`、`src/pages/hris/projects/index.astro`、`src/pages/en/hris/brief.astro`、`src/pages/en/hris/projects/index.astro`、`tests/e2e/hris-brief.spec.ts`

**Interfaces:**
- Consumes：`HrisBase`、`HRIS.brief`、`HRIS.skills`、`HRIS.projects`、`trackProjects('hris')`、`fact('F2'|'F3'|'F5'|'F10')`、`ReadingRail.astro`。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/hris-brief.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { fact } from '../../src/data/facts';
import { trackProjects } from '../../src/data/tracks';
import { motionOff, noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`HRIS brief (${lang}): internship, points, education, skills, availability`, async ({ page }) => {
    await motionOff(page);
    await page.goto(`${prefix}/hris/brief/`);
    await expect(page.locator('.hb-org')).toHaveText(fact('F5').text[lang]);
    await expect(page.locator('.hb-points li')).toHaveText(HRIS.brief.points.map(p => p[lang]));
    await expect(page.locator('.hb-edu')).toContainText(fact('F2').text[lang]);
    await expect(page.locator('.hb-skills dt')).toHaveText(HRIS.skills.map(s => s.group[lang]));
    await expect(page.locator('.hb-avail')).toHaveText(fact('F3').text[lang]);
    await expect(page.locator('a.hb-cta')).toHaveAttribute('href', `${prefix}/hris/workbench/`);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test(`HRIS projects (${lang}): five cards in the HRIS order`, async ({ page }) => {
    await motionOff(page);
    await page.goto(`${prefix}/hris/projects/`);
    const hrefs = await page.locator('.h-work a.h-work__title').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(hrefs).toEqual(trackProjects('hris').map(p => `${prefix}/hris${p.href}`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HRIS.projects.title[lang]);
  });
}
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx playwright test tests/e2e/hris-brief.spec.ts`
Expected：FAIL（404）。

- [ ] **Step 3: 把首页的项目表抽成组件，供首页与项目页共用**

新建 `src/components/hris/HrisWorks.astro`：把 Task 2 `HrisHomeView.astro` 中 `<section class="h-works">…</section>` 整段与 `.h-work*`、`.h-act*` 相关样式剪切进来（props：`{ lang: Lang }`，在组件内 `const works = trackProjects('hris')`、`const L = (p: string) => trackPath('hris', p, lang)`），首页改为 `<HrisWorks lang={lang} />`。

- [ ] **Step 4: 两个页面**

`src/views/hris/HrisBriefView.astro`：

```astro
---
import HrisBase from '../../layouts/HrisBase.astro';
import ReadingRail from '../../components/ReadingRail.astro';
import { HRIS } from '../../data/hris';
import { fact } from '../../data/facts';
import { trackPath, type Lang } from '../../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const B = HRIS.brief;
---
<HrisBase lang={lang} path="/brief/" title={HRIS.meta.brief.title[lang]} description={HRIS.meta.brief.description[lang]}>
  <main id="main">
    <div class="h-mast"><span class="h-mono">1:00</span><h1>{HRIS.nav.brief[lang]}</h1></div>
    <section class="hb-row" data-rail={B.experience[lang]}>
      <h2 class="h-mono">{B.experience[lang]}</h2>
      <div>
        <p class="hb-org">{fact('F5').text[lang]}</p>
        <ul class="hb-points">{B.points.map(p => <li>{p[lang]}</li>)}</ul>
      </div>
    </section>
    <section class="hb-row" data-rail={B.education[lang]}>
      <h2 class="h-mono">{B.education[lang]}</h2>
      <div class="hb-edu"><p>{fact('F2').text[lang]}</p><p>{fact('F10').text[lang]}</p></div>
    </section>
    <section class="hb-row" data-rail={B.skills[lang]}>
      <h2 class="h-mono">{B.skills[lang]}</h2>
      <dl class="hb-skills">{HRIS.skills.map(s => <div><dt>{s.group[lang]}</dt><dd>{s.items[lang]}</dd></div>)}</dl>
    </section>
    <section class="hb-row" data-rail={B.availability[lang]}>
      <h2 class="h-mono">{B.availability[lang]}</h2>
      <div class="hb-close">
        <p class="hb-avail">{fact('F3').text[lang]}</p>
        <a class="hb-cta" href={trackPath('hris', '/workbench/', lang)}>{B.toWorkbench[lang]}</a>
      </div>
    </section>
  </main>
  <ReadingRail lang={lang} />
</HrisBase>
<style>
  .h-mast h1 { padding: 22px 32px; font: 700 24px/1.3 var(--font-body); }
  .hb-row { display: grid; grid-template-columns: 260px 1fr; border-bottom: var(--hair); }
  .hb-row > h2 { padding: 36px 24px; border-right: var(--hair); background: var(--card); color: var(--mute); font-weight: 400; }
  .hb-row > div, .hb-row > dl { padding: 36px 40px; margin: 0; }
  .hb-org { margin-bottom: 14px; font: 700 20px/1.4 var(--font-body); }
  .hb-points { display: grid; gap: 10px; max-width: 42em; padding-left: 18px; }
  .hb-edu { display: grid; gap: 6px; }
  .hb-skills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
  .hb-skills dt { margin-bottom: 8px; color: var(--red-text); font-family: var(--font-mono); font-size: 13px; }
  .hb-skills dd { margin: 0; color: var(--mute); font-size: 15px; }
  .hb-close { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; }
  .hb-avail { font: 700 18px/1.4 var(--font-body); }
  .hb-cta { padding: 12px 18px; background: var(--ink); color: var(--paper); text-decoration: none; }
  .hb-cta:hover, .hb-cta:focus-visible { background: var(--red-fill); color: #fff; }
  @media (max-width: 1024px) { .hb-row, .hb-skills { grid-template-columns: 1fr; } .hb-row > h2 { border-right: 0; border-bottom: var(--hair); padding: 16px 20px; } .hb-row > div, .hb-row > dl { padding: 24px 20px; } }
</style>
```

`src/views/hris/HrisProjectsView.astro`：

```astro
---
import HrisBase from '../../layouts/HrisBase.astro';
import HrisWorks from '../../components/hris/HrisWorks.astro';
import { HRIS } from '../../data/hris';
import type { Lang } from '../../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
---
<HrisBase lang={lang} path="/projects/" title={HRIS.meta.projects.title[lang]} description={HRIS.meta.projects.description[lang]}>
  <main id="main">
    <div class="h-mast"><span class="h-mono">{lang === 'zh' ? '项目' : 'Projects'}</span><h1>{HRIS.projects.title[lang]}</h1></div>
    <p class="hp-lead">{HRIS.projects.lead[lang]}</p>
    <HrisWorks lang={lang} />
  </main>
</HrisBase>
<style>
  .h-mast h1 { padding: 22px 32px; font: 700 24px/1.3 var(--font-body); }
  .hp-lead { max-width: 40em; padding: 28px 32px; border-bottom: var(--hair); color: var(--mute); font-size: 17px; }
</style>
```

路由：`src/pages/hris/brief.astro` → `<HrisBriefView lang="zh" />`；`src/pages/hris/projects/index.astro` → `<HrisProjectsView lang="zh" />`；英文两个同理。

- [ ] **Step 5: 跑测试**

Run: `npx playwright test tests/e2e/hris-brief.spec.ts tests/e2e/hris-home.spec.ts`
Expected：全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/views/hris src/components/hris/HrisWorks.astro src/pages/hris src/pages/en/hris tests/e2e/hris-brief.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS one-minute brief and project list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 隔离守卫（收录、站点地图、链接闭环）

**Files:**
- Create: `tests/e2e/hris-isolation.spec.ts`
- Modify（若测试发现）：泄漏链接所在组件

**Interfaces:**
- Consumes：所有 `/hris/` 页面（Task 2–5、8）。本任务在 Task 8 之前执行时，爬虫只会遇到已存在的页面；Task 8 完成后在 Task 10 重跑本测试。

- [ ] **Step 1: 写测试**

`tests/e2e/hris-isolation.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { motionOff } from './helpers';

const isPage = (h: string) => h.startsWith('/') && !/^\/(downloads|assets|media|og|favicon)/.test(h) && !h.startsWith('//');

test('crawl: every page link reachable from /hris/ stays under /hris/', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  test.setTimeout(180000);
  await motionOff(page);
  const seen = new Set<string>(), queue = ['/hris/', '/en/hris/'], leaks: string[] = [];
  while (queue.length) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const res = await page.goto(url);
    expect(res!.status(), url).toBe(200);
    await expect(page.locator('meta[name="robots"]'), url).toHaveAttribute('content', 'noindex, nofollow');
    const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')!.split('#')[0]).filter(Boolean));
    for (const h of hrefs.filter(isPage).filter(x => !x.includes('/hris/workbench/'))) {   // Task 8 removes this filter
      if (!/^\/(en\/)?hris\//.test(h)) leaks.push(`${url} → ${h}`);
      else if (!seen.has(h)) queue.push(h);
    }
  }
  expect(leaks).toEqual([]);
  expect(seen.size).toBeGreaterThanOrEqual(24);   // Task 8 adds /hris/workbench/ (zh + en) and raises this to 26
});

test('the main site never links to /hris/', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  test.setTimeout(120000);
  await motionOff(page);
  for (const url of ['/', '/brief/', '/projects/', '/projects/hris-workflow/', '/projects/ai-career/', '/projects/ai-career/live/', '/en/', '/en/projects/']) {
    await page.goto(url);
    expect(await page.locator('a[href*="/hris/"]').count(), url).toBe(0);
  }
});

test('the sitemap lists no /hris/ page', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).not.toContain('/hris/');
});
```

（页面数：首页、一分钟版、项目列表、9 个详情/完整版页，各中英两份 = 24。首页入口门指向的 `/hris/workbench/` 要到 Task 8 才存在，所以本任务先把它从爬取中排除。）

- [ ] **Step 2: 跑测试**

Run: `npx playwright test tests/e2e/hris-isolation.spec.ts`
Expected：全部通过。若爬虫一条报 `leaks`，逐条修：每条泄漏都是某个组件里直接写了 `/projects/...` 或 `localizePath(...)`，改为 `trackPath(track, …, lang)` 并把 `track` 传下去。

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/hris-isolation.spec.ts
git add -u src
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS isolation: noindex everywhere, not in the sitemap, no link out of /hris/ and none in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: HRIS 开场（HR DATA / GOVERNANCE.）

**Files:**
- Modify: `src/scripts/intro.ts`、`src/scripts/intro-dom.ts`、`src/layouts/HrisBase.astro`、`src/views/hris/HrisHomeView.astro`
- Create: `src/components/hris/HrisIntro.astro`、`tests/e2e/hris-intro.spec.ts`
- Modify tests: `tests/unit/intro.test.ts`

**Interfaces:**
- Consumes：`introMode`、`readSeen`、`markSeen`、`currentTier`、`mulberry32`。
- Produces：`readSeen(storage, key = SEEN_KEY)`、`markSeen(storage, key = SEEN_KEY)`；`initIntro(overlay, opts?: { key?: string; fullMs?: number; gentleMs?: number })`；`HRIS_SEEN_KEY = 'hyj-hris-intro-seen'`、`HRIS_INTRO_MS = 2200`；`scatter(i: number, seed?: number): { x: number; y: number; r: number }`（`src/scripts/intro.ts`）。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/intro.test.ts` 追加：

```ts
import { scatter, HRIS_SEEN_KEY, HRIS_INTRO_MS } from '../../src/scripts/intro';

describe('HRIS intro', () => {
  it('uses its own seen key, so the main intro and the HRIS intro are independent', () => {
    const store = new Map<string, string>();
    const s = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    markSeen(s, HRIS_SEEN_KEY);
    expect(readSeen(s, HRIS_SEEN_KEY)).toBe(true);
    expect(readSeen(s)).toBe(false);
  });
  it('letters scatter within a screen-sized range and the same way on every visit', () => {
    expect(scatter(3)).toEqual(scatter(3));
    for (let i = 0; i < 20; i++) { const s = scatter(i); expect(Math.abs(s.x)).toBeLessThanOrEqual(60); expect(Math.abs(s.y)).toBeLessThanOrEqual(40); expect(Math.abs(s.r)).toBeLessThanOrEqual(25); }
  });
  it('the HRIS intro is a little shorter than the main one', () => expect(HRIS_INTRO_MS).toBeLessThan(INTRO_MS));
});
```

（文件顶部已有 `markSeen`、`readSeen`、`INTRO_MS` 的导入；若无，补上。）

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/intro.test.ts`
Expected：FAIL（`scatter` 等不存在；`readSeen` 不接受第二个参数时 TS 不报错但第二条失败）。

- [ ] **Step 3: 实现**

`src/scripts/intro.ts`：
- `readSeen(storage, key = SEEN_KEY)`、`markSeen(storage, key = SEEN_KEY)`，内部用 `key`；
- 追加：

```ts
import { mulberry32 } from './hris-topology';

export const HRIS_SEEN_KEY = 'hyj-hris-intro-seen';
export const HRIS_INTRO_MS = 2200;

/** Where letter i of the HRIS intro starts before it springs back to the baseline: px offsets and degrees. */
export function scatter(i: number, seed = 11): { x: number; y: number; r: number } {
  const rand = mulberry32(seed * 1000 + i);
  return { x: Math.round((rand() * 2 - 1) * 60), y: Math.round((rand() * 2 - 1) * 40), r: Math.round((rand() * 2 - 1) * 25) };
}
```

`src/scripts/intro-dom.ts`：`initIntro(overlay: HTMLElement, opts: { key?: string; fullMs?: number; gentleMs?: number } = {})`；`readSeen(store)` → `readSeen(store, opts.key)`，`markSeen(store)` → `markSeen(store, opts.key)`；计时器 `mode === 'gentle' ? (opts.gentleMs ?? INTRO_GENTLE_MS) : (opts.fullMs ?? INTRO_MS)`。主站调用不传 `opts`，行为不变。

`src/components/hris/HrisIntro.astro`：

```astro
---
import { HRIS } from '../../data/hris';
import { scatter } from '../../scripts/intro';
import type { Lang } from '../../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
let n = 0;
---
<div class="hintro" hidden data-hintro tabindex="-1">
  <p class="hintro__top h-mono">{HRIS.intro.top[lang]}</p>
  <div class="hintro__lines" aria-hidden="true">
    {HRIS.intro.lines.map((line, li) => (
      <p class:list={['hintro__line', { 'is-muted': li === 1 }]}>{[...line].map(ch => { const s = scatter(n++); return <span style={`--sx:${s.x}px;--sy:${s.y}px;--sr:${s.r}deg;--d:${(n * 0.03).toFixed(2)}s`}>{ch === ' ' ? '\u00a0' : ch}</span>; })}</p>
    ))}
  </div>
  <i class="hintro__grid" aria-hidden="true"><b></b><b></b><b></b></i>
  <button type="button" class="hintro__skip h-mono" data-intro-skip>{HRIS.intro.skip[lang]} Esc</button>
</div>
<script>
  import { initIntro } from '../../scripts/intro-dom';
  import { HRIS_SEEN_KEY, HRIS_INTRO_MS } from '../../scripts/intro';
  const overlay = document.querySelector<HTMLElement>('[data-hintro]');
  if (overlay) void initIntro(overlay, { key: HRIS_SEEN_KEY, fullMs: HRIS_INTRO_MS });
</script>
<style>
  .hintro { position: fixed; inset: 0; z-index: 100; display: grid; grid-template-rows: auto 1fr auto; padding: 36px 44px; background: #0b0c0e; color: #f4f3ef; outline: none; }
  :global(html.intro-pending) .hintro, .hintro.is-playing { display: grid; }
  .hintro__top { color: #9aa0a6; }
  .hintro__lines { align-self: center; }
  .hintro__line { font: 800 clamp(44px, 8vw, 112px)/0.96 var(--font-display); letter-spacing: -0.04em; }
  .hintro__line.is-muted { color: #8ab4f8; font-weight: 400; }
  .hintro__line span { display: inline-block; }
  .hintro__grid { position: absolute; inset: 0; pointer-events: none; }
  .hintro__grid b { position: absolute; left: 0; right: 0; height: 1px; background: #2e323a; transform: scaleX(0); transform-origin: left; }
  .hintro__grid b:nth-child(1) { top: 22%; } .hintro__grid b:nth-child(2) { top: 50%; } .hintro__grid b:nth-child(3) { top: 78%; }
  .hintro__skip { justify-self: end; padding: 8px 14px; border: 1px solid #5f6368; background: none; color: #f4f3ef; cursor: pointer; }
  /* Full: letters start scattered and spring onto the baseline; the structure lines draw; the curtain lifts. */
  .is-playing:not(.is-gentle) .hintro__line span { animation: h-settle 0.9s var(--d) cubic-bezier(.34, 1.56, .64, 1) both; }
  .is-playing:not(.is-gentle) .hintro__grid b { animation: h-line 0.7s 0.5s cubic-bezier(.6, 0, .2, 1) forwards; }
  .is-playing:not(.is-gentle) .hintro__grid b:nth-child(2) { animation-delay: 0.6s; } .is-playing:not(.is-gentle) .hintro__grid b:nth-child(3) { animation-delay: 0.7s; }
  .is-playing:not(.is-gentle) { animation: h-lift 0.5s 1.7s cubic-bezier(.7, 0, .2, 1) forwards; }
  .is-playing.is-gentle { animation: h-fade 0.8s var(--ease) forwards; }
  :global(html[data-motion='gentle']) .hintro.is-playing.is-gentle { animation: h-fade 0.8s var(--ease) forwards !important; }
  @keyframes h-settle { from { opacity: 0; transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); } to { opacity: 1; transform: none; } }
  @keyframes h-line { to { transform: none; } }
  @keyframes h-lift { to { transform: translateY(-100%); } }
  @keyframes h-fade { 0% { opacity: 0; } 30%, 60% { opacity: 1; } 100% { opacity: 0; } }
</style>
```

`src/layouts/HrisBase.astro`：`Props` 加 `intro?: boolean`；在 `<MotionBoot />` 之后加

```astro
    {intro && (
      <script is:inline>
        (function () {
          var d = document.documentElement;
          try { if (d.dataset.motion === 'off' || localStorage.getItem('hyj-hris-intro-seen') === '1') return; } catch (e) { /* storage blocked: first visit */ }
          d.classList.add('intro-pending');
          setTimeout(function () { d.classList.remove('intro-pending'); }, 3000);
        })();
      </script>
    )}
```

`HrisHomeView.astro`：`<HrisBase … intro>`，并在 `</main>` 之后加 `<HrisIntro slot="overlay" lang={lang} />`。

- [ ] **Step 4: 端到端测试**

`tests/e2e/hris-intro.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { motionOff } from './helpers';

const curtain = '[data-hintro]';
test.describe('HRIS intro', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing checks run once on desktop');
  test('plays on the first HRIS visit and lifts', async ({ page }) => {
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeVisible();
    await expect(page.locator(curtain)).toBeHidden({ timeout: 3200 });
  });
  test('letters land on the baseline', async ({ page }) => {
    await page.goto('/hris/');
    await page.waitForTimeout(1500);
    const off = await page.locator('.hintro__line span').evaluateAll(els => els.filter(el => getComputedStyle(el).transform !== 'none' && getComputedStyle(el).transform !== 'matrix(1, 0, 0, 1, 0, 0)').length);
    expect(off).toBe(0);
  });
  test('Escape skips', async ({ page }) => {
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(curtain)).toBeHidden({ timeout: 300 });
  });
  test('independent of the main intro: seeing one does not skip the other', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('hyj-intro-seen', '1'));
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeVisible();
  });
  test('reduced motion: a short fade', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toHaveClass(/is-gentle/);
    await expect(page.locator(curtain)).toBeHidden({ timeout: 1500 });
  });
  test('motion off: none', async ({ page }) => {
    await motionOff(page);
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeHidden();
  });
});
```

Run: `npm test && npx playwright test tests/e2e/hris-intro.spec.ts tests/e2e/intro.spec.ts tests/e2e/hris-home.spec.ts tests/e2e/hris-topology.spec.ts`
Expected：全部通过（`hris-home` / `hris-topology` 的测试已在打开前写入 `hyj-hris-intro-seen`）。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/intro.ts src/scripts/intro-dom.ts src/components/hris/HrisIntro.astro src/layouts/HrisBase.astro src/views/hris/HrisHomeView.astro tests/unit/intro.test.ts tests/e2e/hris-intro.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS intro: HR DATA / GOVERNANCE. letters spring onto the baseline while the structure lines draw

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 档案补录流程终端（`/hris/workbench/`）

**Files:**
- Create: `src/data/hris-workbench.ts`、`src/scripts/hris-workbench-dom.ts`、`src/views/hris/HrisWorkbenchView.astro`、`src/pages/hris/workbench.astro`、`src/pages/en/hris/workbench.astro`、`tests/unit/hris-workbench.test.ts`、`tests/e2e/hris-workbench.spec.ts`

**Interfaces:**
- Consumes：`CASES`、`STEPS`、`trace()`、`OUTCOME_LABEL`、`STATE_LABEL`、`DEMO_TEXT`（`src/scripts/hris-demo.ts`）；`fact('F15')`。
- Produces：`VERSIONS: Version[]`（`id: 'v1' | 'v2' | 'final'`、`label: Bi`、`nature: Bi`、`chain: Bi[]`、`tools: Partial<Record<StepId, Bi>>`）、`WB_CASES: DemoCase[]`（`CASES` 加一条手写件）、`ROUTING: Bi[]`、`WB_TEXT`。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/hris-workbench.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { VERSIONS, WB_CASES, ROUTING } from '../../src/data/hris-workbench';
import { CASES, STEPS, trace } from '../../src/scripts/hris-demo';
import { factCorpus } from '../../src/data/facts';
import { strayTokens } from './digits';

describe('workbench data', () => {
  it('three versions in order, the final one delivered', () => {
    expect(VERSIONS.map(v => v.id)).toEqual(['v1', 'v2', 'final']);
    expect(VERSIONS[2].chain.map(c => c.zh).join(' ')).toMatch(/Copilot/);
    expect(VERSIONS[2].chain.map(c => c.zh).join(' ')).toMatch(/Power Automate/);
    expect(VERSIONS[0].nature.zh).toContain('个人实践');
  });
  it('tools are named only for steps the ledger documents', () => {
    const steps = new Set(STEPS.map(s => s.id));
    for (const v of VERSIONS) for (const s of Object.keys(v.tools)) expect(steps.has(s as never), `${v.id}.${s}`).toBe(true);
    expect(Object.keys(VERSIONS[0].tools).sort()).toEqual(['extract', 'review']);
  });
  it('the fictional cases are the demo\'s five plus a handwritten form that goes to manual review', () => {
    expect(WB_CASES.slice(0, CASES.length)).toEqual(CASES);
    const hand = WB_CASES[CASES.length];
    expect(hand.id).toBe('DEMO-006');
    expect(hand.outcome).toBe('manual-review');
    expect(trace(hand).find(s => s.state === 'stopped')!.id).toBe('review');
  });
  it('the routing rules include the every-hundred full re-check', () => {
    expect(ROUTING.some(r => r.zh.includes('100'))).toBe(true);
  });
  it('no number outside the ledger, no ruled-out claim', () => {
    const all = JSON.stringify({ VERSIONS, ROUTING, extra: WB_CASES[CASES.length] });
    // Record ids and roster row numbers of the fictional demo are identifiers (the e2e number check skips [data-demo] too).
    expect(strayTokens(all.replace(/DEMO-\d+|第 \d+ 行|Roster row \d+/g, ''), factCorpus())).toEqual([]);
    expect(all).not.toMatch(/Pydantic|field_diff|工单|ticket|持续运行|100\s*%/i);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/hris-workbench.test.ts`
Expected：FAIL（模块不存在）。

- [ ] **Step 3: 数据**

`src/data/hris-workbench.ts`：

```ts
import type { Bi } from '../i18n';
import { CASES, type DemoCase, type StepId } from '../scripts/hris-demo';

export interface Version { id: 'v1' | 'v2' | 'final'; label: Bi; nature: Bi; chain: Bi[]; tools: Partial<Record<StepId, Bi>> }

/** The three versions of the backfill workflow, as the experience ledger records them (档案 4.1). Steps whose tools the
 *  ledger does not record for a version are left unnamed rather than guessed. */
export const VERSIONS: Version[] = [
  { id: 'v1', label: { zh: '第一版', en: 'Version 1' }, nature: { zh: '个人实践原型', en: 'Personal prototype' },
    chain: [{ zh: 'OpenClaw 调用 DeepSeek、ChatGPT 提取字段', en: 'OpenClaw calls DeepSeek and ChatGPT to extract fields' }, { zh: '模型只给候选，写入由人工决定', en: 'The model only proposes; a person decides what is written' }],
    tools: { extract: { zh: 'OpenClaw · DeepSeek / ChatGPT', en: 'OpenClaw · DeepSeek / ChatGPT' }, review: { zh: '人工审核', en: 'Manual review' } } },
  { id: 'v2', label: { zh: '第二版', en: 'Version 2' }, nature: { zh: '个人实践', en: 'Personal practice' },
    chain: [{ zh: '本地 OCR 识别扫描件', en: 'Local OCR reads the scans' }, { zh: 'DeepSeek 从识别结果里提取字段', en: 'DeepSeek extracts fields from the OCR text' }, { zh: '模型只给候选，写入由人工决定', en: 'The model only proposes; a person decides what is written' }],
    tools: { extract: { zh: '本地 OCR · DeepSeek', en: 'Local OCR · DeepSeek' }, review: { zh: '人工审核', en: 'Manual review' } } },
  { id: 'final', label: { zh: '最终版', en: 'Final version' }, nature: { zh: '在公司批准的环境中运行，已交接给 mentor', en: 'Ran in the company-approved environment; handed over to my mentor' },
    chain: [{ zh: 'Power Automate 按工号查找文件并返回工号', en: 'Power Automate finds each file by employee ID and returns the ID' }, { zh: 'Copilot（AI Builder）识别图像中的字段', en: 'Copilot (AI Builder) reads the fields in the image' }, { zh: '分流：通过的自动录入，其余转人工复核', en: 'Routing: passed records are entered automatically; the rest go to manual review' }, { zh: 'Excel 作为数据载体，资料存于 SharePoint', en: 'Excel holds the data; the files live in SharePoint' }],
    tools: { match: { zh: 'Power Automate', en: 'Power Automate' }, identity: { zh: 'Power Automate 返回工号', en: 'Power Automate returns the ID' }, extract: { zh: 'Copilot · AI Builder', en: 'Copilot · AI Builder' }, review: { zh: '人工复核', en: 'Manual review' }, writeback: { zh: 'Power Automate → Excel', en: 'Power Automate → Excel' } } },
];

/** The routing rules of the final version (档案 4.1). */
export const ROUTING: Bi[] = [
  { zh: '无法识别、识别不清、字段缺失 → 转人工复核', en: 'Unreadable, unclear or missing fields → manual review' },
  { zh: '手写件最容易出错 → 一律人工复核', en: 'Handwritten forms are the most error-prone → always manual review' },
  { zh: '核验完成 → 自动录入', en: 'Verified → entered automatically' },
  { zh: '每满 100 份 → 这 100 份全部人工核对一次，不是抽查', en: 'Every 100 files → all 100 are checked by hand, not sampled' },
];

const HANDWRITTEN: DemoCase = {
  id: 'DEMO-006', name: { zh: '员工己', en: 'Employee F' }, stopsAt: 'review', outcome: 'manual-review',
  situation: { zh: '资料是手写填写的登记表，字迹可以辨认。', en: 'The record is a handwritten form; the writing is legible.' },
  result: { zh: '候选字段已提取，但手写件一律转人工复核，不自动录入。', en: 'Candidate fields are extracted, but handwritten forms always go to manual review and are never entered automatically.' },
  next: { zh: 'HR 对照原件逐项核对后再录入。', en: 'HR checks each field against the original before entry.' },
  trail: [
    { zh: '花名册第 6 行：DEMO-006 员工己', en: 'Roster row 6: DEMO-006 Employee F' },
    { zh: '找到 DEMO-006_员工己.pdf（手写登记表扫描件）', en: 'Found DEMO-006_EmployeeF.pdf (scan of a handwritten form)' },
    { zh: '工号、姓名与文件内容一致', en: 'ID and name match the document' },
    { zh: '候选：住址、紧急联系人（手写）', en: 'Candidates: address, emergency contact (handwritten)' },
    { zh: '手写件 → 转人工复核', en: 'Handwritten → manual review' },
  ],
};

export const WB_CASES: DemoCase[] = [...CASES, HANDWRITTEN];

export const WB_TEXT = {
  title: { zh: '档案补录流程终端', en: 'Records backfill workflow terminal' },
  intro: { zh: '选一份虚构档案，看它在补录流程的哪一步通过、在哪一步停下；切换版本，看每一版用了哪些工具。', en: 'Pick a fictional record to see where it passes and where it stops; switch versions to see which tools each one used.' },
  records: { zh: '虚构档案', en: 'Fictional records' },
  versions: { zh: '版本', en: 'Version' },
  chain: { zh: '这一版的做法', en: 'How this version worked' },
  routing: { zh: '分流与复核规则（最终版）', en: 'Routing and review rules (final version)' },
  notRecorded: { zh: '这一版未单独记录', en: 'Not recorded for this version' },
  toProject: { zh: '看档案补录项目页 →', en: 'Open the records backfill project →' },
};
```

- [ ] **Step 4: 跑单元测试**

Run: `npx vitest run tests/unit/hris-workbench.test.ts`
Expected：PASS（`ROUTING` 里的 "100" 来自 F15；档案编号与行号在比较前去掉）。

- [ ] **Step 5: 写失败的端到端测试**

`tests/e2e/hris-workbench.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { VERSIONS, WB_CASES, WB_TEXT, ROUTING } from '../../src/data/hris-workbench';
import { OUTCOME_LABEL, DEMO_TEXT } from '../../src/scripts/hris-demo';
import { motionOff, noHorizontalOverflow } from './helpers';

test.beforeEach(async ({ page }) => { await motionOff(page); });

test('labelled as fictional, with every record and the routing rules', async ({ page }) => {
  await page.goto('/hris/workbench/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(WB_TEXT.title.zh);
  await expect(page.getByText(DEMO_TEXT.badge.zh)).toBeVisible();
  await expect(page.locator('[data-wb-record]')).toHaveCount(WB_CASES.length);
  await expect(page.locator('.wb-routing li')).toHaveText(ROUTING.map(r => r.zh));
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('picking a record shows where it stops and what happens next', async ({ page }) => {
  await page.goto('/hris/workbench/');
  for (const c of [WB_CASES[1], WB_CASES[5]]) {
    await page.locator(`[data-wb-record="${c.id}"]`).click();
    await expect(page.locator(`[data-wb-record="${c.id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.wb-outcome')).toHaveText(OUTCOME_LABEL[c.outcome].zh);
    await expect(page.locator(`.wb-steps [data-step="${c.stopsAt}"]`)).toHaveAttribute('data-state', c.outcome === 'done' ? 'passed' : 'stopped');
    await expect(page.locator('.wb-next')).toContainText(c.next.zh);
  }
});

test('switching versions changes the chain and the tool on each documented step', async ({ page }) => {
  await page.goto('/hris/workbench/');
  for (const v of VERSIONS) {
    await page.locator(`[data-wb-version="${v.id}"]`).click();
    await expect(page.locator(`[data-wb-version="${v.id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.wb-chain li')).toHaveText(v.chain.map(c => c.zh));
    await expect(page.locator('.wb-steps [data-step="extract"] .wb-tool')).toHaveText(v.tools.extract!.zh);
    if (!v.tools.match) await expect(page.locator('.wb-steps [data-step="match"] .wb-tool')).toHaveText(WB_TEXT.notRecorded.zh);
  }
});

test('keyboard: records and versions are operable', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard');
  await page.goto('/hris/workbench/');
  await page.locator(`[data-wb-record="${WB_CASES[2].id}"]`).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(`[data-wb-record="${WB_CASES[2].id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-wb-version="v2"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-wb-version="v2"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('[data-wb-version="v2"]').evaluate(el => getComputedStyle(el).outlineStyle !== 'none' || getComputedStyle(el).boxShadow !== 'none')).toBe(true);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the first record and the final version are shown in full', async ({ page }) => {
    await page.goto('/hris/workbench/');
    await expect(page.locator('.wb-outcome')).toHaveText(OUTCOME_LABEL[WB_CASES[0].outcome].zh);
    await expect(page.locator('.wb-chain li')).toHaveText(VERSIONS[2].chain.map(c => c.zh));
  });
});
```

Run: `npx playwright test tests/e2e/hris-workbench.spec.ts`
Expected：FAIL（404）。

- [ ] **Step 6: 页面与驱动**

`src/views/hris/HrisWorkbenchView.astro`（服务端先渲染第一份档案与最终版，脚本只负责切换）：

```astro
---
import HrisBase from '../../layouts/HrisBase.astro';
import { HRIS } from '../../data/hris';
import { VERSIONS, WB_CASES, WB_TEXT, ROUTING } from '../../data/hris-workbench';
import { STEPS, OUTCOME_LABEL, STATE_LABEL, DEMO_TEXT, trace } from '../../scripts/hris-demo';
import { trackPath, type Lang } from '../../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const first = WB_CASES[0], final = VERSIONS[2];
const steps = trace(first);
const payload = JSON.stringify({ lang, cases: WB_CASES, versions: VERSIONS, steps: STEPS, outcome: OUTCOME_LABEL, state: STATE_LABEL, notRecorded: WB_TEXT.notRecorded });
---
<HrisBase lang={lang} path="/workbench/" title={HRIS.meta.workbench.title[lang]} description={HRIS.meta.workbench.description[lang]}>
  <main id="main" class="wb" data-wb data-demo>
    <div class="h-mast"><span class="h-mono">LIVE</span><h1>{WB_TEXT.title[lang]}</h1></div>
    <p class="wb-intro">{WB_TEXT.intro[lang]} <b class="wb-badge h-mono">{DEMO_TEXT.badge[lang]}</b></p>
    <div class="wb-grid">
      <section class="wb-left" aria-label={WB_TEXT.records[lang]}>
        <ul class="wb-records">
          {WB_CASES.map((c, i) => (
            <li><button type="button" data-wb-record={c.id} aria-pressed={String(i === 0)}>
              <span class="h-mono">{c.id}</span><span>{c.name[lang]}</span><span class="wb-badge-s h-mono" data-outcome={c.outcome}>{OUTCOME_LABEL[c.outcome][lang]}</span>
            </button></li>
          ))}
        </ul>
        <h2 class="h-mono">{WB_TEXT.routing[lang]}</h2>
        <ul class="wb-routing">{ROUTING.map(r => <li>{r[lang]}</li>)}</ul>
      </section>
      <section class="wb-right" aria-live="polite">
        <div class="wb-versions" role="group" aria-label={WB_TEXT.versions[lang]}>
          {VERSIONS.map(v => <button type="button" data-wb-version={v.id} aria-pressed={String(v.id === 'final')}>{v.label[lang]}</button>)}
        </div>
        <p class="wb-nature">{final.nature[lang]}</p>
        <h2 class="h-mono">{WB_TEXT.chain[lang]}</h2>
        <ol class="wb-chain">{final.chain.map(c => <li>{c[lang]}</li>)}</ol>
        <ol class="wb-steps">
          {STEPS.map((s, i) => (
            <li data-step={s.id} data-state={steps[i].state} style={`--i:${i}`}>
              <b>{s.label[lang]}</b><span class="wb-tool h-mono">{final.tools[s.id]?.[lang] ?? WB_TEXT.notRecorded[lang]}</span><span class="wb-state h-mono">{STATE_LABEL[steps[i].state][lang]}</span>
            </li>
          ))}
        </ol>
        <p class="wb-situation">{first.situation[lang]}</p>
        <ul class="wb-trail">{first.trail.map((t, i) => <li style={`--i:${i}`}>{t[lang]}</li>)}</ul>
        <p class="wb-outcome" data-outcome={first.outcome}>{OUTCOME_LABEL[first.outcome][lang]}</p>
        <p class="wb-result">{first.result[lang]}</p>
        <p class="wb-next">{DEMO_TEXT.nextLabel[lang]}{first.next[lang]}</p>
        <a class="wb-link" href={trackPath('hris', '/projects/hris-workflow/', lang)}>{WB_TEXT.toProject[lang]}</a>
      </section>
    </div>
    <script type="application/json" data-wb-data set:html={payload}></script>
  </main>
</HrisBase>
<script>
  import { initWorkbench } from '../../scripts/hris-workbench-dom';
  const root = document.querySelector<HTMLElement>('[data-wb]');
  if (root) initWorkbench(root);
</script>
<style>
  .wb-intro { padding: 24px 32px; border-bottom: var(--hair); color: var(--mute); }
  .wb-badge { margin-left: 8px; padding: 2px 8px; border: 1px solid var(--warn); color: var(--warn); font-weight: 400; }
  .wb-grid { display: grid; grid-template-columns: 1.1fr 1fr; border-bottom: var(--hair); }
  .wb-left { border-right: var(--hair); }
  .wb-records { margin: 0; padding: 0; list-style: none; }
  .wb-records button { display: grid; grid-template-columns: 120px 1fr auto; gap: 12px; width: 100%; padding: 16px 24px; border: 0; border-bottom: var(--hair); background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
  .wb-records button:hover { background: var(--card); }
  .wb-records button[aria-pressed='true'] { background: var(--card); box-shadow: inset 3px 0 0 var(--red); }
  .wb-badge-s[data-outcome='done'] { color: var(--verified); }
  .wb-badge-s:not([data-outcome='done']) { color: var(--warn); }
  .wb-left h2, .wb-right h2 { padding: 18px 24px 8px; color: var(--mute); font-weight: 400; }
  .wb-routing { display: grid; gap: 8px; padding: 0 24px 24px 42px; }
  .wb-right { display: grid; align-content: start; gap: 12px; padding-bottom: 24px; background: var(--card); }
  .wb-versions { display: flex; border-bottom: var(--hair); }
  .wb-versions button { flex: 1; padding: 14px 10px; border: 0; border-right: var(--hair); background: none; color: var(--mute); font: inherit; cursor: pointer; }
  .wb-versions button[aria-pressed='true'] { background: var(--ink); color: var(--paper); }
  .wb-versions button:focus-visible, .wb-records button:focus-visible { outline: 2px solid var(--red); outline-offset: -4px; }
  .wb-nature, .wb-situation, .wb-result, .wb-next, .wb-link { padding-inline: 24px; }
  .wb-chain { display: grid; gap: 6px; padding: 0 24px 0 46px; }
  .wb-steps { display: grid; grid-template-columns: repeat(6, 1fr); margin: 8px 24px; padding: 0; list-style: none; border: var(--hair); }
  .wb-steps li { display: grid; gap: 6px; padding: 12px 10px; border-right: var(--hair); font-size: 14px; }
  .wb-steps li:last-child { border-right: 0; }
  .wb-steps li[data-state='passed'] { box-shadow: inset 0 3px 0 var(--verified); }
  .wb-steps li[data-state='stopped'] { box-shadow: inset 0 3px 0 var(--warn); background: var(--paper); }
  .wb-steps li[data-state='skipped'] { color: var(--mute); }
  .wb-tool, .wb-state { font-size: 13px; color: var(--mute); }
  .wb-trail { display: grid; gap: 6px; margin: 0 24px; padding: 14px 16px 14px 34px; background: var(--paper); border: var(--hair); }
  .wb-outcome { justify-self: start; margin-inline: 24px; padding: 6px 12px; border: 2px solid currentColor; font-weight: 700; }
  .wb-outcome[data-outcome='done'] { color: var(--verified); }
  .wb-outcome:not([data-outcome='done']) { color: var(--warn); }
  .wb-link { color: var(--red-text); }
  @media (max-width: 1024px) { .wb-grid { grid-template-columns: 1fr; } .wb-left { border-right: 0; border-bottom: var(--hair); } .wb-steps { grid-template-columns: repeat(3, 1fr); } .wb-steps li:nth-child(3) { border-right: 0; } }
  @media (max-width: 640px) { .wb-records button { grid-template-columns: 1fr auto; } .wb-records button > :first-child { grid-column: 1 / -1; } .wb-steps { grid-template-columns: 1fr 1fr; } }
</style>
```

`src/scripts/hris-workbench-dom.ts`：

```ts
import type { DemoCase, StepId, Outcome, StepState } from './hris-demo';
import { trace } from './hris-demo';
import type { Version } from '../data/hris-workbench';
import type { Bi, Lang } from '../i18n';

interface Data { lang: Lang; cases: DemoCase[]; versions: Version[]; steps: { id: StepId; label: Bi }[]; outcome: Record<Outcome, Bi>; state: Record<StepState, Bi>; notRecorded: Bi }

/** Switches the terminal between records and versions. The server already rendered record 1 and the final version, so
 *  without the script the page is complete; with it, each switch re-renders the right pane and replays its motion. */
export function initWorkbench(root: HTMLElement): void {
  const data = JSON.parse(root.querySelector('[data-wb-data]')!.textContent!) as Data;
  const L = data.lang;
  let record = data.cases[0], version = data.versions[2];
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const replay = (el: Element) => { el.classList.remove('is-on'); void (el as HTMLElement).offsetWidth; el.classList.add('is-on'); };

  const render = () => {
    $('.wb-nature').textContent = version.nature[L];
    $('.wb-chain').replaceChildren(...version.chain.map(c => Object.assign(document.createElement('li'), { textContent: c[L] })));
    const states = trace(record);
    root.querySelectorAll<HTMLElement>('.wb-steps li').forEach((li, i) => {
      const step = data.steps[i];
      li.dataset.state = states[i].state;
      li.querySelector('.wb-tool')!.textContent = version.tools[step.id]?.[L] ?? data.notRecorded[L];
      li.querySelector('.wb-state')!.textContent = data.state[states[i].state][L];
    });
    $('.wb-situation').textContent = record.situation[L];
    $('.wb-trail').replaceChildren(...record.trail.map((t, i) => { const li = document.createElement('li'); li.textContent = t[L]; li.style.setProperty('--i', String(i)); return li; }));
    const out = $<HTMLElement>('.wb-outcome');
    out.dataset.outcome = record.outcome;
    out.textContent = data.outcome[record.outcome][L];
    $('.wb-result').textContent = record.result[L];
    const next = $('.wb-next');
    next.textContent = next.textContent!.split(/[:：]/)[0] + (L === 'zh' ? '：' : ': ') + record.next[L];
    for (const el of [$('.wb-steps'), $('.wb-trail'), out, $('.wb-chain')]) replay(el);
  };

  root.querySelectorAll<HTMLButtonElement>('[data-wb-record]').forEach(b => b.addEventListener('click', () => {
    record = data.cases.find(c => c.id === b.dataset.wbRecord)!;
    root.querySelectorAll('[data-wb-record]').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    render();
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-wb-version]').forEach(b => b.addEventListener('click', () => {
    version = data.versions.find(v => v.id === b.dataset.wbVersion)!;
    root.querySelectorAll('[data-wb-version]').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    render();
  }));
}
```

`.wb-next` 的前缀写法依赖服务端文本 `DEMO_TEXT.nextLabel`（中文"下一步："、英文 "Next: "）；`split(/[:：]/)[0]` 取回"下一步"/"Next"。

路由：`src/pages/hris/workbench.astro` → `<HrisWorkbenchView lang="zh" />`；英文同理。

- [ ] **Step 7: 动效（选中后字段对齐、流程依次点亮、结论盖章、版本切换）**

在 `HrisWorkbenchView.astro` 的 `<style>` 末尾追加（`is-on` 由脚本每次切换时重新加上；`gentle` 档全局只保留透明度，`off` 档全局去掉过渡与动画）：

```css
  .wb-steps.is-on li { animation: wb-light 0.5s calc(var(--i) * 90ms) var(--ease) both; }
  .wb-trail.is-on li { animation: wb-align 0.45s calc(var(--i) * 70ms) var(--ease) both; }
  .wb-outcome.is-on { animation: wb-stamp 0.45s 0.55s cubic-bezier(.34, 1.56, .64, 1) both; }
  .wb-chain.is-on li { animation: wb-align 0.4s calc(var(--i, 0) * 60ms) var(--ease) both; }
  @keyframes wb-light { from { opacity: 0.35; } }
  @keyframes wb-align { from { opacity: 0; transform: translateX(18px); } }
  @keyframes wb-stamp { from { opacity: 0; transform: scale(1.35) rotate(-4deg); } }
```

- [ ] **Step 8: 跑测试**

Run: `npm test && npx playwright test tests/e2e/hris-workbench.spec.ts tests/e2e/hris-isolation.spec.ts`
Expected：全部通过。然后在 `tests/e2e/hris-isolation.spec.ts` 里删掉 Task 6 加的 `/hris/workbench/` 过滤（连同注释），把 `toBeGreaterThanOrEqual(24)` 改为 `26`，重跑该文件，Expected：通过。

- [ ] **Step 9: 提交**

```bash
git add src/data/hris-workbench.ts src/scripts/hris-workbench-dom.ts src/views/hris/HrisWorkbenchView.astro src/pages/hris/workbench.astro src/pages/en/hris/workbench.astro tests/unit/hris-workbench.test.ts tests/e2e/hris-workbench.spec.ts tests/e2e/hris-isolation.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS workflow terminal: fictional records through the real backfill steps, three versions with only documented tools

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: HRIS 动效收尾（数字条、结构线、主题过渡）

**Files:**
- Create: `src/scripts/hris-motion.ts`、`tests/e2e/hris-motion.spec.ts`
- Modify: `src/layouts/HrisBase.astro`（底部脚本）、`src/styles/hris.css`

**Interfaces:**
- Consumes：`spinOdometer(el, final, delay?)`（`src/scripts/odometer-dom.ts`）、`armOnScroll(els, opts)`（`src/scripts/motion/arm.ts`）、`fullMotion()`、`anyMotion()`。
- Produces：`initHrisMotion(): void`。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/hris-motion.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { motionOff } from './helpers';

const skip = (page: import('@playwright/test').Page) => page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });

test('ledger figures spin in as counters and land on the ledger text', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/hris/');
  const nums = page.locator('[data-ledger-num]');
  await nums.first().scrollIntoViewIfNeeded();
  await expect(nums.first().locator('.odo')).toHaveCount(1, { timeout: 2000 });
  await expect(nums).toHaveText(HRIS.ledger.map(l => l.figure), { timeout: 4000 });
});

test('structure lines draw in as sections scroll in', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/hris/');
  const work = page.locator('.h-work').last();
  await expect(work).toHaveClass(/m-armed/);
  await work.scrollIntoViewIfNeeded();
  await expect(work).toHaveClass(/m-in/);
});

test('theme switch: colours change smoothly, the canvas recolours', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/hris/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).transitionDuration)).not.toBe('0s');
  await page.locator('[data-theme-toggle]').click();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor), { timeout: 2000 }).toBe('rgb(11, 12, 14)');
});

test('motion off: figures and lines are simply there', async ({ page }) => {
  await skip(page);
  await motionOff(page);
  await page.goto('/hris/');
  await expect(page.locator('[data-ledger-num] .odo')).toHaveCount(0);
  await expect(page.locator('.h-work.m-armed')).toHaveCount(0);
});
```

Run: `npx playwright test tests/e2e/hris-motion.spec.ts`
Expected：前两条失败；后两条中主题一条可能已通过（`hris.css` 已写过渡），关闭动效一条通过。

- [ ] **Step 2: 实现**

`src/scripts/hris-motion.ts`：

```ts
import { spinOdometer } from './odometer-dom';
import { armOnScroll } from './motion/arm';
import { fullMotion } from './motion/tier';

/** HRIS motion that is not tied to one component: ledger counters, and structure lines that draw as rows scroll in. */
export function initHrisMotion(): void {
  const nums = [...document.querySelectorAll<HTMLElement>('[data-ledger-num]')];
  if (nums.length && fullMotion() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.disconnect();
        nums.forEach((el, i) => spinOdometer(el, el.textContent ?? '', i * 120));
      }
    }, { threshold: 0.4 });
    io.observe(nums[0]);
  }
  armOnScroll(document.querySelectorAll<HTMLElement>('.h-work, .hb-row, .p-hris .p-row'));
}
```

`src/layouts/HrisBase.astro` 底部脚本加：

```ts
      import { initHrisMotion } from '../scripts/hris-motion';
      initHrisMotion();
```

`src/styles/hris.css` 追加（armed 起始态只在完整档下位移；温和档由全局规则改为只淡入）：

```css
/* Structure lines draw from the left as rows arrive (scripts/hris-motion.ts arms them). */
.hris .h-work.m-armed, .hris .hb-row.m-armed, .hris .p-hris .p-row.m-armed { position: relative; opacity: 0; }
.hris .h-work.m-armed::after, .hris .hb-row.m-armed::after, .hris .p-hris .p-row.m-armed::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: var(--ink); transform: scaleX(0); transform-origin: left; }
.hris .m-armed.m-in { opacity: 1; transition: opacity 0.6s var(--ease) var(--m-d, 0ms); }
.hris .m-armed.m-in::after { transform: scaleX(1); opacity: 0; transition: transform 0.8s var(--ease) var(--m-d, 0ms), opacity 0.4s 0.9s; }
```

- [ ] **Step 3: 跑测试**

Run: `npm test && npx playwright test tests/e2e/hris-motion.spec.ts tests/e2e/hris-home.spec.ts tests/e2e/hris-brief.spec.ts tests/e2e/hris-detail.spec.ts tests/e2e/motion-tier.spec.ts`
Expected：全部通过。

- [ ] **Step 4: 提交**

```bash
git add src/scripts/hris-motion.ts src/layouts/HrisBase.astro src/styles/hris.css tests/e2e/hris-motion.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "HRIS motion: ledger counters, structure lines that draw in, smooth theme change

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 全量验证与待确认文案

**Files:**
- Modify: `docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md`（追加第二期一节）
- Create: `tools/phase2-shots.mjs`

- [ ] **Step 1: 全量测试**

Run: `npm test && npm run e2e`
Expected：全部通过；记录数量。若 `hris-isolation` 发现泄漏，回到对应任务修。

- [ ] **Step 2: 截图检查**

`tools/phase2-shots.mjs`：

```js
// One-off visual check for phase 2: HRIS pages in light and dark, desktop and phone.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4395, OUT = 'test-results/phase2';
const PAGES = ['/hris/', '/hris/brief/', '/hris/projects/', '/hris/workbench/', '/hris/projects/hris-workflow/', '/hris/projects/ai-career/live/', '/en/hris/'];
if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true }).status !== 0) process.exit(1);
const server = spawn('node', ['tools/serve-dist.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
try {
  for (const [name, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]]) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(t => { localStorage.setItem('hyj-hris-intro-seen', '1'); localStorage.setItem('hyj-hris-theme', t); }, theme);
    for (const p of PAGES) {
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}${p}`);
      await page.waitForTimeout(2000);
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } scrollTo(0, 0); });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}/${name}-${theme}${p.replaceAll('/', '_')}.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); }
console.log(`screenshots in ${OUT}`);
```

Run: `node tools/phase2-shots.mjs`，用 Read 工具逐张查看至少：首页浅/深 × 桌面/手机、流程终端桌面浅色与手机深色、一个详情页深色（演示面板必须是浅色纸底）、英文首页。发现问题回到对应任务修。

- [ ] **Step 3: 追加待确认文案**

在 `docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md` 末尾追加 `## 第二期（HRIS 站）` 一节，按第一期同样格式（中文、English、确认 / 修改为：___），原文直接从代码复制：
1. `HRIS.hero.title`、`HRIS.hero.lead`
2. `HRIS.ledger` 四条说明
3. `HRIS.skills` 三组
4. `HRIS.brief.points` 五条（注明来源：经历档案 4.1；"被邀请延长实习"按档案只写半句）
5. `HRIS.cards` 五张卡的标题与简介
6. `VERSIONS` 三版的 `nature` 与 `chain`、`ROUTING` 四条、`DEMO-006` 案例
7. F15 的文字

- [ ] **Step 4: 提交并交接**

```bash
git add docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md tools/phase2-shots.mjs
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Phase 2: HRIS copy for the author's sign-off and the visual check script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

向用户汇报（不推送、不发布）：各任务提交哈希；测试通过数；与计划不同的每处改动与原因；待确认文案的新增条目；挑 6 张代表性截图直接给用户看；在共享记忆收件箱新建第二期完成记录。
