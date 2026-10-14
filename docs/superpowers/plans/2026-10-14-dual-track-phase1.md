# 双轨重构第一期：底座 + AI 主站 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把作品集主站改成「AI 产品」定位：并入 HRIS 交付版改写，一个项目一张卡（简易版 + 完整版两个按钮），新的开场、首屏执行轨迹、流式文字、阅读轨迹与影院式暗场，以及让所有访客都看得到动效的三档动效系统。

**Architecture:** 沿用现有 Astro 结构（页面文件一行调用 `src/views/*View.astro`，文案在 `src/data/*.ts`，数字只来自 `src/data/facts.ts`）。新增 `src/data/tracks.ts` 决定主站项目顺序；新增 `src/scripts/motion/tier.ts` 统一动效档位，`<html data-motion>` 由 `Base.astro` 的内联脚本在首帧前写好，CSS 与脚本都读它。新动效全部是"纯函数 + DOM 驱动"两层，纯函数用 Vitest 做确定性测试，DOM 行为用 Playwright 测。

**Tech Stack:** Astro 7、TypeScript、GSAP 3（已有）、原生 SVG / Canvas、Vitest 5、Playwright 1.63（msedge）。

**Spec:** `docs/superpowers/specs/2026-10-14-dual-track-portfolio-design.md`（本计划实现其中第 10 节的"第一期"；第二期 HRIS 站另写计划）。

## Global Constraints

- 工作目录：`C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `dual-track`。不推送任何分支，不改 `main`，不碰 `../github-pages-public`。
- 提交身份：仓库没有配置作者，每次提交都用 `git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit ...`；提交信息末尾加一行 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- 不新增任何依赖（`dependencies` 与 `devDependencies` 都不动）。
- 页面上出现的每个数字都必须来自 `src/data/facts.ts`；构建时由真实文件算出的数字（加载体积）放在带 `data-size` 的元素里，并由单元测试对照真实文件。
- 文案禁用：「独立开发 / 独立完成 / 独立设计 / 独立交付 / 独立编写」「solo」「500 强」「Fortune 500」「100%」「闭环」不得出现在 `SITE`、`FACTS`、`EDITIONS` 的文字中；Markdown 正文不得出现「独立开发 / 独立编写 / 独立交付」「solo」「500 强」「Fortune 500」「闭环」。
- 每一段访客可见文字都是 `Bi`（`{ zh, en }`）双语。
- 动效只动 `transform` 与 `opacity`（SVG 描边动画用 `stroke-dashoffset`）；不闪白、不整屏变亮；磁吸位移不超过 6px；任何动效都不能让正文被遮挡超过 2.5 秒。
- 动效档位语义（spec 7.3）：`full` 默认；`gentle` = 系统开启"减少动态效果"或访客选择，只淡入、不位移；`lite` = 省流量、`deviceMemory ≤ 4` 或前 60 帧平均低于 30fps，帧率封顶 30；`off` = 访客选择，全部静止。访客选择存 `localStorage['hyj-motion']`，优先于自动判断。
- 命令：单元测试 `npm test`（单个文件 `npx vitest run tests/unit/<file>.test.ts`）；端到端 `npm run e2e`（会先 `npm run build`；单个文件 `npx playwright test tests/e2e/<file>.spec.ts`）。在 Git Bash 里运行。
- 上线门槛：第 2 栏「方案取舍」、第 6 栏「下一步」、F1 新文案都是草稿，Task 15 交给用户逐条确认，确认前不发布。

## Review Focus

1. **浏览器禁止本地存储**（`localStorage` 读写抛错）时，档位内联脚本、开关、开场都不能报错，页面按自动判断运行 → Task 7 测试 `storage blocked: tier boots and the switch still works`。
2. **页面在后台标签页打开**（rAF 停摆）时，测帧率不能把访客误降到轻量档 → Task 7 单元测试 `watchFps does nothing while the page is hidden`。
3. **只用键盘的访客**：卡片上"看过程与取舍"是重复链接，不能多出一个 Tab 停靠点，"在浏览器里运行"必须能 Tab 到 → Task 4 测试 `keyboard reaches the live edition right after its card`。
4. **系统开了"减少动态效果"的首次访客**：开场必须是短淡入淡出且能 Esc 跳过 → Task 8 测试 `reduced motion: a short fade instead` 与 `Escape skips the gentle intro`。
5. **390px 手机**：首屏轨迹、卡片按钮、阅读轨迹都不能造成横向滚动，且首屏姓名、一句话、到岗信息仍在第一屏 → Task 9、Task 12 的手机断言；**关闭 JavaScript** 时所有正文可见 → Task 10 测试 `without JavaScript the streamed lines are plain text`。

---

## 文件结构

| 文件 | 职责 | 任务 |
|---|---|---|
| `src/data/facts.ts` | F1、F5 更新（F14 由 Task 1 并入） | 1、2 |
| `tests/unit/claims.test.ts` | 禁用措辞守卫 | 2 |
| `src/data/site.ts` | 项目条目合并（`live` 字段）、卡片与轨迹文案、主站文案、GitHub | 3、4、5、6、9 |
| `src/data/tracks.ts` | 主站项目顺序 `trackProjects('ai')` | 3 |
| `src/data/live-size.ts` | 完整版首次加载体积（构建时读真实文件） | 4 |
| `src/components/ProjectRow.astro` | 一个项目一张卡、两个按钮、描边与体积条 | 4 |
| `src/layouts/ProjectLayout.astro` | 翻页按主站顺序、六栏摘要、导语流式出现、阅读轨迹 | 3、6、10、12 |
| `src/scripts/motion/tier.ts` | 档位判断、开关读写、测帧率 | 7 |
| `src/components/MotionSwitch.astro` | 「动效：完整 / 温和 / 关」开关 | 7 |
| `src/layouts/Base.astro`、`src/styles/base.css` | 首帧前写档位；全局档位规则；暗场入口 | 7、8、13 |
| `src/components/Intro.astro`、`src/scripts/intro.ts`、`intro-dom.ts` | 流式开场与温和版 | 8 |
| `src/scripts/agent-trace.ts`、`agent-trace-dom.ts`、`src/components/AgentTrace.astro` | 首屏执行轨迹 | 9 |
| `src/scripts/motion/stream.ts`、`stream-dom.ts`、`src/components/StreamText.astro` | 流式文字 | 10 |
| `src/components/ReadingRail.astro`、`src/scripts/reading-rail.ts` | 阅读轨迹 | 12 |
| `src/scripts/night-entry.ts` | 影像暗场"熄灯再亮" | 13 |
| `tools/live-shots.mjs`、`src/components/LivePreview.astro`、`public/media/live-previews/*` | 完整版预览截图 | 14 |

---

### Task 1: 并入 `hris-delivered` 与 HRIS 下载文档更正

**Files:**
- Modify（来自 cherry-pick）：`src/copy/projects/hris-workflow.{zh,en}.md`、`src/data/facts.ts`、`src/data/site.ts`、`tests/unit/facts.test.ts`、`public/downloads/hris/HRIS方案.md`
- Create（来自 cherry-pick）：`tests/unit/hris-download.test.ts`

**Interfaces:**
- Produces：`FactId` 新增 `'F14'`；F5 时间变为 `2026.03—2026.08`；`SITE.pages.hris.summary` 改为三版交付口径。

- [ ] **Step 1: 取回另一份克隆里的提交**

```bash
cd "C:/Users/yoshi/Documents/ChatGPT/项目培训/portfolio-site/work/github-pages-redesign"
git fetch "D:/Users/yoshi/AgentWorkspace/portfolio-release-prep" codex/portfolio-release-prep:refs/remotes/release-prep/head
git log --oneline -4 release-prep/head
```

Expected：依次是 `b16b6a3 docs: align HRIS download…`、`b72f1c1 HR records backfill: final version…`、`ef1e9c2 HR records backfill: three versions…`、`62803c7 List Stark…`。

- [ ] **Step 2: 按顺序 cherry-pick 三个提交**

```bash
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com cherry-pick ef1e9c2 b72f1c1 b16b6a3
```

如果 `src/data/site.ts` 冲突：冲突只会出现在 `campus-delivery` 条目附近（该分支基于更早的 62803c7，那里仍是"独立完成的课程设计"）。解决规则：`campus-delivery` 的 `did` 保留当前分支（HEAD）的版本，即以 `个人负责的课程设计：8 张业务表、事务与复合外键；可在浏览器里运行的工作台借助 AI 编程工具开发` 开头的那一行；`hris-workflow` 的 `status` 和 `SITE.pages.hris` 的 `tags`、`summary` 取 cherry-pick 进来的版本。然后：

```bash
git add src/data/site.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com cherry-pick --continue
```

- [ ] **Step 3: 确认没有把"独立完成"带回来**

```bash
grep -n "独立完成\|Solo course" src/data/site.ts
```

Expected：没有输出。

- [ ] **Step 4: 跑单元测试**

Run: `npm test`
Expected：全部通过（包括新的 `tests/unit/hris-download.test.ts`）。

- [ ] **Step 5: 确认三个提交都在**

```bash
git log --oneline -4
```

Expected：最上面三条是 cherry-pick 进来的三个提交（哈希会变），下面是 `03aa4d0 Spec: dual-track portfolio…`。cherry-pick 已经产生提交，这一步不再额外提交。

---

### Task 2: 事实台账更新与禁用措辞守卫

**Files:**
- Modify: `src/data/facts.ts`（F1、F5）
- Create: `tests/unit/claims.test.ts`

**Interfaces:**
- Consumes：Task 1 之后的 `FACTS`。
- Produces：`fact('F1').text` 为 AI 产品定位草稿；`fact('F5').text.zh` 含 `项目专员（HR数字化方向）`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/claims.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../../src/data/site';
import { FACTS, fact } from '../../src/data/facts';
import { EDITIONS } from '../../src/data/editions';

/** Claims about the author that the experience ledger rules out (档案 0.2 红线；2026-10-13/14 简历审查). */
const AUTHOR_CLAIMS = [/独立(开发|完成|设计|交付|编写)/, /\bsolo\b/i, /\bindependently (built|developed|designed|delivered)\b/i, /500\s*强/, /Fortune\s*500/i, /100\s*%/, /闭环/];
/** Long-form copy also talks about other people's independence (learners, reviewers) and UI states such as "reset to 100%". */
const PROSE_CLAIMS = [/独立(开发|编写|交付)/, /\bsolo\b/i, /500\s*强/, /Fortune\s*500/i, /闭环/];

function strings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(strings);
  if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
  return [];
}

function markdown(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return markdown(p);
    return p.endsWith('.md') ? [p] : [];
  });
}

describe('copy makes no claims the ledger rules out', () => {
  it('site data, facts and editions', () => {
    for (const s of strings([SITE, FACTS, EDITIONS])) {
      for (const re of AUTHOR_CLAIMS) expect(re.test(s), `${re} in: ${s}`).toBe(false);
    }
  });

  it('markdown copy', () => {
    for (const file of markdown('src/copy')) {
      const text = readFileSync(file, 'utf8');
      for (const re of PROSE_CLAIMS) expect(re.test(text), `${re} in ${file}`).toBe(false);
    }
  });

  it('the internship carries the confirmed title and dates', () => {
    expect(fact('F5').text.zh).toContain('项目专员（HR数字化方向）');
    expect(fact('F5').text.zh).toContain('2026.03—2026.08');
    expect(fact('F5').text.en).toContain('Project Specialist (HR Digitalization)');
  });

  it('the one-line introduction speaks to AI products', () => {
    expect(fact('F1').text.zh).toContain('AI 工作流');
    expect(fact('F1').text.zh).not.toContain('HR 数据整理');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/claims.test.ts`
Expected：后两个用例失败（F5 仍是"HR 与人才数据实习生"，F1 仍是"从 HR 数据整理出发"）；前两个通过。如果前两个也失败，说明现有文案里有禁用措辞：按失败信息逐条改写那句文案（不要放宽正则），改完再继续。

- [ ] **Step 3: 改 F1 与 F5**

在 `src/data/facts.ts` 中把 F1、F5 两行替换为：

```ts
  F1: { id: 'F1', text: { zh: '设计并验收 AI 工作流与工具：实习中把员工档案补录做成在公司环境运行的 AI 工作流；课余借助 AI 编程工具，把产品想法做成能在浏览器里运行的原型。', en: 'I design and sign off AI workflows and tools: during my internship I turned employee-records backfill into an AI workflow that ran at the company, and on my own time I use AI coding tools to turn product ideas into prototypes that run in the browser.' }, scope: '自我介绍（AI 产品主线）', source: '用户 2026-10-14 选择「AI 产品」主线；措辞为草稿，上线前待用户逐字确认', confirmed: '2026-10-14', public: true },
```

```ts
  F5: { id: 'F5', text: { zh: '丹纳赫（上海）企业管理有限公司 · 项目专员（HR数字化方向） · 2026.03—2026.08', en: 'Danaher (Shanghai) Enterprise Management Co., Ltd. · Project Specialist (HR Digitalization) · 2026.03—2026.08' }, scope: '实习；派遣单位为薪得付信息技术（上海）有限公司，同一段实习；职位名与 2026-10-14 定稿简历一致', source: '用户 2026-10-14 确认职位名；结束月份由用户 2026-10-08 更正', confirmed: '2026-10-14', public: true },
```

- [ ] **Step 4: 跑全部单元测试**

Run: `npm test`
Expected：全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/data/facts.ts tests/unit/claims.test.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Facts: AI-product introduction, confirmed internship title; guard against ruled-out claims

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 一个项目一条目，主站顺序

**Files:**
- Create: `src/data/tracks.ts`、`tests/unit/tracks.test.ts`
- Modify: `src/data/site.ts`（`ProjectEntry`、`SITE.projects`）、`src/views/ProjectsView.astro:13`、`src/views/BriefView.astro:17`、`src/layouts/ProjectLayout.astro:15`、`src/pages/sitemap.xml.ts:9`
- Modify tests: `tests/unit/site.test.ts`、`tests/e2e/projects-index.spec.ts`、`tests/e2e/motion-index.spec.ts`

**Interfaces:**
- Produces：
  - `ProjectEntry.live?: { href: string; size: LiveId }`（`LiveId` 由 Task 4 的 `src/data/live-size.ts` 导出；本任务先在 `site.ts` 用 `import type`，Task 4 创建文件前，本任务在 Step 3 一并创建只含类型的占位导出——见下）。
  - `trackProjects(track: Track): ProjectEntry[]`、`type Track = 'ai'`、`TRACK_ORDER`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/tracks.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { SITE } from '../../src/data/site';
import { trackProjects, TRACK_ORDER } from '../../src/data/tracks';

describe('AI track', () => {
  it('lists the five product projects in the confirmed order', () => {
    expect(trackProjects('ai').map(p => p.slug)).toEqual(['ai-career', 'hris-workflow', 'quota-deck', 'campus-delivery', 'ai-campus']);
  });

  it('every slug in the order is a project, and none is a film', () => {
    for (const slug of TRACK_ORDER.ai) {
      const p = SITE.projects.find(x => x.slug === slug);
      expect(p, slug).toBeDefined();
      expect(p!.line).toBe('data');
    }
  });

  it('live editions hang off their project instead of being projects of their own', () => {
    expect(SITE.projects.some(p => p.slug.includes('/'))).toBe(false);
    const live = Object.fromEntries(SITE.projects.filter(p => p.live).map(p => [p.slug, p.live!.href]));
    expect(live).toEqual({
      'campus-delivery': '/projects/campus-delivery/insights/',
      'ai-career': '/projects/ai-career/live/',
      'quota-deck': '/projects/quota-deck/live/',
      'ai-campus': '/projects/ai-campus/live/',
    });
  });
});
```

在 `tests/unit/site.test.ts` 末尾的 `describe` 里追加：

```ts
  it('the CSV tool keeps its page but is not on the AI track', async () => {
    const { trackProjects } = await import('../../src/data/tracks');
    expect(SITE.projects.some(p => p.slug === 'stock-data')).toBe(true);
    expect(trackProjects('ai').some(p => p.slug === 'stock-data')).toBe(false);
  });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/tracks.test.ts tests/unit/site.test.ts`
Expected：FAIL，`Cannot find module '../../src/data/tracks'`。

- [ ] **Step 3: 创建 `live-size.ts` 的类型出口与 `tracks.ts`**

`src/data/live-size.ts`（Task 4 会在同一文件里补上计算函数，这里先只放类型，保证 `site.ts` 可以编译）：

```ts
/** Live editions whose first-load size is shown on the project cards. */
export type LiveId = 'career' | 'campus' | 'quota' | 'insights';
```

`src/data/tracks.ts`：

```ts
import { SITE, type ProjectEntry } from './site';

/** The main site's audience. The HRIS track joins in phase two (spec §10). */
export type Track = 'ai';

/** Project order per track (spec §2: 求职 Agent → 丹纳赫工作流 → QuotaDeck → 校园外卖 → AI 校园研究). */
export const TRACK_ORDER: Record<Track, readonly string[]> = {
  ai: ['ai-career', 'hris-workflow', 'quota-deck', 'campus-delivery', 'ai-campus'],
};

export function trackProjects(track: Track): ProjectEntry[] {
  return TRACK_ORDER[track].map(slug => {
    const p = SITE.projects.find(x => x.slug === slug);
    if (!p) throw new Error(`Unknown project in ${track} track: ${slug}`);
    return p;
  });
}
```

- [ ] **Step 4: 改 `ProjectEntry` 与项目条目**

`src/data/site.ts` 顶部加：

```ts
import type { LiveId } from './live-size';
```

`ProjectEntry` 接口在 `preview?: string;` 后加：

```ts
  /** The project's live edition, if it has one: a second button on its card. */
  live?: { href: string; size: LiveId };
```

把 `SITE.projects` 中 `hris-workflow` 到 `stock-data` 这一段（原来的 10 条数据项目）整体替换为下面 6 条，影像三条不动：

```ts
    project({ slug: 'hris-workflow', line: 'data', preview: '/assets/editorial/hris-flow.svg', inBrief: true,
      title: { zh: '员工档案补录 AI 工作流', en: 'HR Records Backfill — AI Workflow' },
      did: { zh: '核查约 2000 名员工的档案主数据；把补录迭代成三版 AI 工作流，最终版基于 Copilot + Power Automate，在公司批准的环境中运行', en: 'Reviewed master records for about 2000 employees and iterated the backfill into an AI workflow over three versions; the final one, on Copilot + Power Automate, ran in the company-approved environment' },
      status: { zh: '已结束 · 最终版已在公司环境运行', en: 'Finished · final version ran at the company' } }),
    project({ slug: 'campus-delivery', line: 'data', preview: '/assets/editorial/delivery-relations.svg', inBrief: true,
      live: { href: '/projects/campus-delivery/insights/', size: 'insights' },
      title: { zh: '校园外卖：SQL 工作台与经营分析', en: 'Campus Delivery: SQL Lab & Insights' },
      did: { zh: '个人负责的课程设计：8 张业务表、事务与复合外键；在同一套表上扩展一个学期的合成数据，回答五个经营问题。浏览器里的工作台与分析页借助 AI 编程工具开发', en: 'A course project I was responsible for: 8 business tables with transactions and composite keys, extended with a synthetic term of orders to answer five business questions. The in-browser lab and the analysis were built with AI coding tools' },
      status: { zh: '课程设计 · 分析页为合成数据', en: 'Course project · analysis uses synthetic data' } }),
    project({ slug: 'ai-career', line: 'data', preview: '/assets/editorial/career-evidence.svg', inBrief: true,
      live: { href: '/projects/ai-career/live/', size: 'career' },
      title: { zh: '个人求职 Agent', en: 'Personal Job Agent' },
      did: { zh: '借助 AI 编程工具开发的求职辅助工具，每条匹配判断都能追溯到事实证据', en: 'A job-search helper built with AI coding tools; every match traces back to a fact' },
      status: { zh: '个人项目 · 2026.08 至今', en: 'Personal project · 2026.08 – present' } }),
    project({ slug: 'quota-deck', line: 'data', preview: '/assets/editorial/quota-pools.svg', inBrief: true,
      live: { href: '/projects/quota-deck/live/', size: 'quota' },
      title: { zh: 'QuotaDeck', en: 'QuotaDeck' },
      did: { zh: '借助 AI 编程工具开发的桌面小工具，集中查看多家 AI 服务的额度', en: 'A desktop tool, built with AI coding tools, that shows AI service quotas in one place' },
      status: { zh: '个人项目 · MIT 开源', en: 'Personal project · MIT licensed' } }),
    project({ slug: 'ai-campus', line: 'data', preview: '/assets/editorial/campus-method.svg', inBrief: true,
      live: { href: '/projects/ai-campus/live/', size: 'campus' },
      title: { zh: 'AI 校园应用研究', en: 'AI on Campus — Study' },
      did: { zh: '项目组长：设计问卷、清洗数据并做交叉统计，获校级大学生创新创业项目一等奖', en: 'Team lead: survey design, data cleaning and cross-tab analysis; First Prize, university student innovation programme' },
      status: { zh: '大创项目 · 2024.03—2024.07', en: 'Student research · 2024.03—2024.07' } }),
    project({ slug: 'stock-data', line: 'data', preview: '/assets/editorial/csv-process.svg', inBrief: false,
      title: { zh: 'CSV 数据分析工具', en: 'CSV Analysis Tool' },
      did: { zh: '上传表格即可检查缺失与重复、查看统计与分布', en: 'Upload a table to check gaps and duplicates and see its statistics' },
      status: { zh: '原型 · 构造样本', en: 'Prototype · synthetic sample' } }),
```

- [ ] **Step 5: 让列表、概览、翻页、站点地图按新模型工作**

`src/views/ProjectsView.astro`：import 区加 `import { trackProjects } from '../data/tracks';`，第 13 行改为：

```ts
const data = trackProjects('ai');
```

`src/views/BriefView.astro`：import 区加 `import { trackProjects } from '../data/tracks';`，第 17 行改为：

```ts
const dataProjects = trackProjects('ai').filter(p => p.inBrief);
```

`src/layouts/ProjectLayout.astro`：import 区加 `import { trackProjects } from '../data/tracks';`，第 15 行改为：

```ts
// Pager order is the main site's order, then the films; the CSV tool and the live editions sit outside it.
const order = [...trackProjects('ai'), ...SITE.projects.filter(p => p.line === 'film')];
```

`src/pages/sitemap.xml.ts` 第 9 行改为：

```ts
  const live = SITE.projects.flatMap(p => (p.live ? [p.live.href] : []));
  const bare = [...new Set(['/', '/brief/', '/projects/', ...SITE.projects.map(p => p.href), ...live, '/projects/stock-data/method/', '/privacy/'])];
```

- [ ] **Step 6: 跑单元测试**

Run: `npm test`
Expected：全部通过。

- [ ] **Step 7: 更新依赖旧列表的端到端测试**

`tests/e2e/projects-index.spec.ts`：import 区加 `import { trackProjects } from '../../src/data/tracks';`，第 8 行改为：

```ts
    const data = trackProjects('ai').map(p => `${prefix}${p.href}`);
```

`tests/e2e/motion-index.spec.ts`：
- `hovering a row shows its preview beside the pointer` 中，`a.prow[href="/projects/campus-delivery/insights/"]` 改为 `a.prow[href="/projects/campus-delivery/"]`，期望的 `src` 改为 `'/assets/editorial/delivery-relations.svg'`。
- `keyboard focus shows the preview too` 中，`a.prow[href="/projects/stock-data/"]` 改为 `a.prow[href="/projects/ai-career/"]`。

- [ ] **Step 8: 跑相关端到端测试**

Run: `npx playwright test tests/e2e/projects-index.spec.ts tests/e2e/motion-index.spec.ts tests/e2e/brief.spec.ts tests/e2e/keyboard.spec.ts tests/e2e/links.spec.ts`
Expected：全部通过。若 `motion-batch4.spec.ts` 等依赖行序号的测试在后面的全量运行中失败，按"第 n 行现在是哪个项目"更新断言里的 `nth()` 或 `href`，不改被测代码。

- [ ] **Step 9: 提交**

```bash
git add src/data/live-size.ts src/data/tracks.ts src/data/site.ts src/views/ProjectsView.astro src/views/BriefView.astro src/layouts/ProjectLayout.astro src/pages/sitemap.xml.ts tests/unit/tracks.test.ts tests/unit/site.test.ts tests/e2e/projects-index.spec.ts tests/e2e/motion-index.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "One entry per project with its live edition; main-site order for lists, overview and pager

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 卡片的两个按钮、首次加载体积与描边

**Files:**
- Modify: `src/data/live-size.ts`（补计算函数）、`src/components/ProjectRow.astro`、`src/components/CareerLive.astro:11-12`、`src/components/CampusLive.astro:21`、`src/data/site.ts`（`SITE.cards`）、`tests/e2e/numbers.spec.ts:11`
- Create: `tests/unit/live-size.test.ts`、`tests/e2e/cards.spec.ts`

**Interfaces:**
- Consumes：`ProjectEntry.live`、`trackProjects('ai')`（Task 3）。
- Produces：`liveBytes(id: LiveId): number`、`liveMB(id: LiveId): string`、`formatSize(bytes: number, lang: Lang): string`、`MAX_LIVE_BYTES: number`；卡片 DOM：`.pcard > a.prow + .pcard__actions > (a.pcard__act[aria-hidden] , a.pcard__live > [data-size])`，`.pcard__trace` 描边层。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/live-size.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { liveBytes, liveMB, formatSize, MAX_LIVE_BYTES, type LiveId } from '../../src/data/live-size';

const manifestBytes = (p: string) => (JSON.parse(readFileSync(p, 'utf8')) as { files: { bytes: number }[] }).files.reduce((s, f) => s + f.bytes, 0);

describe('live edition sizes are read from the shipped files', () => {
  it('career = Pyodide manifest + job agent manifest', () => {
    expect(liveBytes('career')).toBe(manifestBytes('public/assets/vendor/pyodide/0.29.5/manifest.json') + manifestBytes('public/assets/py/job-agent/4397ded/manifest.json'));
  });

  it('insights = sql.js + the term database + its worker', () => {
    const files = ['public/assets/vendor/sql-wasm.js', 'public/assets/vendor/sql-wasm.wasm', 'public/assets/insights/campus-term.sqlite', 'public/assets/insights-worker.js'];
    expect(liveBytes('insights')).toBe(files.reduce((s, f) => s + statSync(f).size, 0));
  });

  it('every size is positive and fits the bar scale', () => {
    for (const id of ['career', 'campus', 'quota', 'insights'] as LiveId[]) {
      expect(liveBytes(id), id).toBeGreaterThan(0);
      expect(liveBytes(id), id).toBeLessThanOrEqual(MAX_LIVE_BYTES);
    }
  });

  it('formats one decimal in megabytes, in both languages', () => {
    expect(formatSize(15_000_000, 'zh')).toBe('首次加载约 14.3 MB');
    expect(formatSize(15_000_000, 'en')).toBe('about 14.3 MB on first load');
    expect(liveMB('career')).toBe((liveBytes('career') / 1048576).toFixed(1));
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/live-size.test.ts`
Expected：FAIL，`liveBytes is not a function`（或导出不存在）。

- [ ] **Step 3: 实现 `live-size.ts`**

把 `src/data/live-size.ts` 整个替换为：

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CAMPUS_RUNTIME, CORE_FILES } from '../scripts/campus-flow';
import { QD_DIR } from '../scripts/qd-load';
import type { Lang } from '../i18n';

/** Live editions whose first-load size is shown on the project cards. Read at build time from public/. */
export type LiveId = 'career' | 'campus' | 'quota' | 'insights';

/** Full width of a card's size bar: a little above the largest runtime. */
export const MAX_LIVE_BYTES = 16 * 1048576;

const PYODIDE = 'public/assets/vendor/pyodide/0.29.5/manifest.json';
type Entry = { name: string; bytes: number };
const manifest = (p: string): Entry[] => (JSON.parse(readFileSync(p, 'utf8')) as { files: Entry[] }).files;
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const fileBytes = (p: string) => statSync(p).size;
const dirBytes = (d: string): number =>
  sum(readdirSync(d, { withFileTypes: true }).map(e => (e.isDirectory() ? dirBytes(join(d, e.name)) : fileBytes(join(d, e.name)))));

export function liveBytes(id: LiveId): number {
  switch (id) {
    case 'career':
      return sum(manifest(PYODIDE).map(f => f.bytes)) + sum(manifest('public/assets/py/job-agent/4397ded/manifest.json').map(f => f.bytes));
    case 'campus':
      return sum(manifest(PYODIDE).filter(f => CORE_FILES.includes(f.name)).map(f => f.bytes)) + sum(CAMPUS_RUNTIME.files.map(u => fileBytes(`public${u}`)));
    case 'quota':
      return dirBytes(`public${QD_DIR}`) + fileBytes('public/assets/quotadeck/host.html') + fileBytes('public/assets/quotadeck/host.js');
    case 'insights':
      return sum(['public/assets/vendor/sql-wasm.js', 'public/assets/vendor/sql-wasm.wasm', 'public/assets/insights/campus-term.sqlite', 'public/assets/insights-worker.js'].map(fileBytes));
  }
}

export function liveMB(id: LiveId): string {
  return (liveBytes(id) / 1048576).toFixed(1);
}

export function formatSize(bytes: number, lang: Lang): string {
  const mb = (bytes / 1048576).toFixed(1);
  return lang === 'zh' ? `首次加载约 ${mb} MB` : `about ${mb} MB on first load`;
}
```

如果导入 `../scripts/qd-load` 或 `../scripts/campus-flow` 在 Node 下报错（顶层用到浏览器对象），改为在本文件内复制对应常量：`QD_DIR = '/assets/quotadeck/e9557c6/'`；`CORE_FILES = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']`；`CAMPUS_RUNTIME.files` 从 `src/scripts/campus-flow.ts` 第 6–12 行原样复制。并在提交信息里注明原因。

- [ ] **Step 4: 两个完整版页面改用同一个计算**

`src/components/CareerLive.astro`：删除第 11–12 行（`const bytes = …` 与 `const mb = …`），import 区加 `import { liveMB } from '../data/live-size';`，再加一行：

```ts
const mb = liveMB('career');
```

`src/components/CampusLive.astro`：第 21 行 `const mb = …` 改为 `const mb = liveMB('campus');`，import 区加 `import { liveMB } from '../data/live-size';`（`files` 仍用于哈希清单，保留）。

- [ ] **Step 5: 跑单元测试**

Run: `npm test`
Expected：全部通过。

- [ ] **Step 6: 写卡片的端到端测试**

`tests/e2e/cards.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { trackProjects } from '../../src/data/tracks';
import { liveBytes, formatSize } from '../../src/data/live-size';
import { SITE } from '../../src/data/site';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`cards (${lang}) pair each project with its live edition`, async ({ page }) => {
    await page.goto(`${prefix}/projects/`);
    for (const p of trackProjects('ai')) {
      const card = page.locator('.pcard').filter({ has: page.locator(`a.prow[href="${prefix}${p.href}"]`) });
      await expect(card, p.slug).toHaveCount(1);
      await expect(card.locator('a.pcard__act').first()).toHaveText(`${SITE.cards.read[lang]} →`);
      const live = card.locator('a.pcard__live');
      if (p.live) {
        await expect(live).toHaveAttribute('href', `${prefix}${p.live.href}`);
        await expect(live.locator('[data-size]')).toHaveText(formatSize(liveBytes(p.live.size), lang));
      } else {
        await expect(live).toHaveCount(0);
      }
    }
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('keyboard reaches the live edition right after its card', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard');
  await page.goto('/projects/');
  const row = page.locator('a.prow[href="/projects/ai-career/"]');
  await row.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('a.pcard__live[href="/projects/ai-career/live/"]')).toBeFocused();
});

test('hovering a card draws the trace around it', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'hover only');
  await page.goto('/projects/');
  const card = page.locator('.pcard').first();
  const rect = card.locator('.pcard__trace rect');
  await expect.poll(() => rect.evaluate(el => Number(getComputedStyle(el).strokeDashoffset.replace('px', '')))).toBeGreaterThan(0.5);
  await card.hover();
  await expect.poll(() => rect.evaluate(el => Number(getComputedStyle(el).strokeDashoffset.replace('px', ''))), { timeout: 2000 }).toBeLessThan(0.05);
});
```

`tests/e2e/numbers.spec.ts` 第 11 行的 `EXCLUDE` 在 `[data-plate],` 后加 `[data-size],`，并在上方注释末尾补一句：`[data-size] holds first-load sizes computed at build time from public/ (tests/unit/live-size.test.ts).`

- [ ] **Step 7: 跑测试确认失败**

Run: `npx playwright test tests/e2e/cards.spec.ts`
Expected：FAIL，找不到 `.pcard`。

- [ ] **Step 8: 加卡片文案**

`src/data/site.ts` 中 `pager:` 那一行之前加：

```ts
  cards: {
    read: { zh: '看过程与取舍', en: 'Process & trade-offs' },
    run: { zh: '在浏览器里运行', en: 'Run it in your browser' },
  },
```

`tests/unit/site.test.ts` 的 `SKIP_KEYS` 不需要改（这两段文字没有数字）。

- [ ] **Step 9: 改 `ProjectRow.astro`**

frontmatter 改为：

```astro
---
import type { ProjectEntry } from '../data/site';
import { SITE } from '../data/site';
import SpotlightCard from './rb/SpotlightCard.astro';
import { liveBytes, formatSize, MAX_LIVE_BYTES } from '../data/live-size';
import { localizePath, type Lang } from '../i18n';
/** motion: the projects index's slide-in, hover sweep and preview; other pages (the overview) keep the plain row. */
interface Props { lang: Lang; project: ProjectEntry; index: number; motion?: boolean }
const { lang, project, index, motion = false } = Astro.props;
const live = project.live && { href: localizePath(project.live.href, lang), bytes: liveBytes(project.live.size) };
---
```

模板改为（`a.prow` 内部保持原样，外面包 `.pcard`，后面加按钮行和描边层）：

```astro
<SpotlightCard tone="paper">
<div class="pcard">
<a class="prow" href={localizePath(project.href, lang)} data-motion={motion ? '' : undefined}>
  <span class="prow__n">{String(index + 1).padStart(2, '0')}</span>
  <span class="prow__title">{project.title[lang]}</span>
  <span class="prow__did">{project.did[lang]}</span>
  <span class="prow__status">{project.status[lang]}</span>
  <span class="prow__arrow" aria-hidden="true">→</span>
  {motion && project.preview && <img class="prow__preview" src={project.preview} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
</a>
<div class="pcard__actions">
  {/* The row above is the accessible link to the simple page; this visible twin stays out of the tab order. */}
  <a class="pcard__act" href={localizePath(project.href, lang)} tabindex="-1" aria-hidden="true">{SITE.cards.read[lang]} →</a>
  {live && (
    <a class="pcard__act pcard__live" href={live.href} style={`--share:${Math.min(1, live.bytes / MAX_LIVE_BYTES).toFixed(3)}`}>
      <span>{SITE.cards.run[lang]} ↗</span>
      <small data-size>{formatSize(live.bytes, lang)}</small>
      <i class="pcard__bar" aria-hidden="true"></i>
    </a>
  )}
</div>
<svg class="pcard__trace" aria-hidden="true"><rect pathLength="1" /></svg>
</div>
</SpotlightCard>
```

`rect` 的位置和尺寸由下面的 CSS 几何属性（`x`、`y`、`width`、`height`）给出，因为 SVG 属性值不接受 `calc()`。

`<style>` 中：把 `.prow` 规则里的 `border-bottom: var(--hair);` 删掉；删掉 `.prow[data-motion]::after { … }` 与 `.prow[data-motion]:hover::after, .prow[data-motion]:focus::after { … }` 两条（底部红条由整圈描边取代）；再追加：

```css
  .pcard { position: relative; border-bottom: var(--hair); }
  .pcard__actions { --row-pad: max(var(--gutter), calc((100% - 1600px) / 2 + var(--gutter))); display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 0 var(--row-pad) 18px calc(var(--row-pad) + 3ch + clamp(14px, 2vw, 32px)); }
  .pcard__act { position: relative; display: inline-flex; align-items: baseline; gap: 10px; padding: 6px 12px; border: 1.5px solid var(--ink); overflow: hidden; font-size: 14px; font-weight: 700; text-decoration: none; transition: background-color 0.2s var(--ease), color 0.2s var(--ease); }
  .pcard__act:hover, .pcard__act:focus-visible { background: var(--ink); color: var(--paper); }
  .pcard__live { border-color: var(--red-text); color: var(--red-text); }
  .pcard__live small { color: var(--mute); font-weight: 500; }
  .pcard__live:hover small, .pcard__live:focus-visible small { color: var(--night-mute); }
  /* The bar's length is the download's share of the largest runtime; it fills when the button is pointed at. */
  .pcard__bar { position: absolute; left: 0; bottom: 0; width: calc(var(--share) * 100%); height: 3px; background: var(--red); transform: scaleX(0); transform-origin: left; transition: transform 0.6s var(--ease); }
  .pcard__live:hover .pcard__bar, .pcard__live:focus-visible .pcard__bar { transform: none; }
  .pcard__trace { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
  .pcard__trace rect { x: 1px; y: 1px; width: calc(100% - 2px); height: calc(100% - 2px); fill: none; stroke: var(--red); stroke-width: 1.5; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 0.7s var(--ease); }
  .pcard:hover .pcard__trace rect, .pcard:focus-within .pcard__trace rect { stroke-dashoffset: 0; }
  :global(html[data-motion='gentle']) .pcard__trace rect { stroke-dashoffset: 0; opacity: 0; transition: opacity 0.5s var(--ease); }
  :global(html[data-motion='gentle']) .pcard:hover .pcard__trace rect, :global(html[data-motion='gentle']) .pcard:focus-within .pcard__trace rect { opacity: 1; }
  @media (max-width: 800px) { .pcard__actions { padding-left: calc(var(--gutter) + 3ch + 14px); } }
```

- [ ] **Step 10: 跑卡片与受影响的端到端测试**

Run: `npx playwright test tests/e2e/cards.spec.ts tests/e2e/projects-index.spec.ts tests/e2e/motion-index.spec.ts tests/e2e/brief.spec.ts tests/e2e/numbers.spec.ts tests/e2e/a11y.spec.ts tests/e2e/motion-batch4.spec.ts`
Expected：全部通过。如果某个旧测试断言了 `.prow` 的 `::after` 红条（例如读 `getComputedStyle(row, '::after')`），把那条断言改为读 `.pcard__trace rect` 的 `stroke-dashoffset` 从 1 变到 0；不恢复红条。

- [ ] **Step 11: 提交**

```bash
git add src/data/live-size.ts src/data/site.ts src/components/ProjectRow.astro src/components/CareerLive.astro src/components/CampusLive.astro tests/unit/live-size.test.ts tests/e2e/cards.spec.ts tests/e2e/numbers.spec.ts
git add -u tests/e2e
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Cards: simple page and live edition side by side, first-load size from the shipped files, trace on hover

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 主站文案与 GitHub 入口

**Files:**
- Modify: `src/data/site.ts`（`tagline`、`github`、`nav.github`、`pages.home`、`pages.projects`、`brief.film`）、`src/components/Nav.astro`、`src/components/Footer.astro`
- Modify tests: `tests/unit/site.test.ts`（`SKIP_KEYS`）
- Create: `tests/e2e/identity.spec.ts`、`tests/unit/privacy-email.test.ts`

**Interfaces:**
- Produces：`SITE.github: string`、`SITE.nav.github: Bi`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/privacy-email.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SITE } from '../../src/data/site';

describe('the contact address has one source', () => {
  it('the privacy pages use SITE.email', () => {
    for (const lang of ['zh', 'en']) {
      const md = readFileSync(`src/copy/privacy.${lang}.md`, 'utf8');
      const mails = [...md.matchAll(/mailto:([^)\s]+)/g)].map(m => m[1]);
      expect(mails.length, lang).toBeGreaterThan(0);
      for (const m of mails) expect(m, lang).toBe(SITE.email);
    }
  });
});
```

`tests/e2e/identity.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`AI-product identity (${lang})`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(`${prefix}/brief/`);
    await expect(page.locator('header.nav a[href="https://github.com/CHIWAWAFROMkk"]')).toBeVisible();
    await expect(page.locator('footer.footer a[href="https://github.com/CHIWAWAFROMkk"]')).toBeVisible();
    await expect(page.locator('footer.footer')).toContainText(SITE.tagline[lang]);
    await page.goto(`${prefix}/`);
    await expect(page).toHaveTitle(SITE.pages.home.title[lang]);
    await page.goto(`${prefix}/projects/`);
    await expect(page.locator('#i-data')).toHaveText(SITE.pages.projects.data[lang]);
    await expect(page.locator('#i-film')).toHaveText(SITE.pages.projects.film[lang]);
  });
}
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/privacy-email.test.ts && npx playwright test tests/e2e/identity.spec.ts`
Expected：单元测试通过（邮箱本来就一致，它是守卫）；端到端 FAIL，找不到 GitHub 链接。

- [ ] **Step 3: 改文案**

`src/data/site.ts`：

```ts
  tagline: { zh: 'AI 产品 · Agent 工作流 · AIGC 影像', en: 'AI Products · Agent Workflows · AIGC Film' },
  email: '2806660493@qq.com',
  github: 'https://github.com/CHIWAWAFROMkk',
```

`nav` 对象里 `resume` 之前加：

```ts
    github: { zh: 'GitHub', en: 'GitHub' },
```

`brief.film` 改为：

```ts
    film: { zh: 'AIGC 影像与互动作品', en: 'AIGC film & interactive work' },
```

`pages.home` 改为：

```ts
    home: {
      title: { zh: '何彦钧 · AI 产品 · Agent 工作流 · AIGC 影像', en: 'Yanjun He · AI Products · Agent Workflows · AIGC Film' },
      description: { zh: '何彦钧的作品集：实习中落地的员工档案补录 AI 工作流，能在浏览器里运行的求职 Agent 与 QuotaDeck，以及 AIGC 影像作品。可以一分钟了解，也可以查看项目过程与在线演示。', en: 'Portfolio of Yanjun He: an employee-records AI workflow delivered during an internship, a job agent and QuotaDeck that run in your browser, and AIGC film work. Take the one-minute overview or dig into the projects and live demos.' },
    },
```

`pages.projects` 中 `lead`、`description`、`data`、`film` 四项改为：

```ts
      lead: { zh: 'AI 产品与工作流是主要作品，每个项目都能打开看过程与取舍，或在浏览器里亲手运行；AIGC 影像与互动作品单列在后。', en: 'AI products and workflows are the main work: open any project for the process and trade-offs, or run it in your browser. AIGC film and interactive work follow.' },
      description: { zh: '何彦钧的项目：求职 Agent、员工档案补录 AI 工作流、QuotaDeck、校园外卖 SQL 与经营分析、AI 校园研究，以及 AIGC 影像作品。', en: "Yanjun He's projects: the job agent, the HR records AI workflow, QuotaDeck, campus delivery SQL and insights, the AI-on-campus study, and AIGC film work." },
      data: { zh: 'AI 产品与工作流', en: 'AI products & workflows' },
      film: { zh: 'AIGC 影像与互动作品', en: 'AIGC film & interactive work' },
```

`tests/unit/site.test.ts` 的 `SKIP_KEYS` 加入 `'github'`。

- [ ] **Step 4: 导航与页脚加 GitHub**

`src/components/Nav.astro` 的 `.nav__end` 里，`<LangSwitch …/>` 之前加：

```astro
    <a class="nav__gh" href={SITE.github} rel="me">{SITE.nav.github[lang]} <span aria-hidden="true">↗</span></a>
```

样式加：

```css
  .nav__gh { font-weight: 500; text-decoration: none; }
  .nav__gh:hover { text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1.5px; }
```

`src/components/Footer.astro` 第二个 `<p>` 改为：

```astro
  <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a> · <a href={SITE.github} rel="me">{SITE.nav.github[lang]}</a> · <a href={localizePath('/privacy/', lang)}>{SITE.footer.privacy[lang]}</a></p>
```

- [ ] **Step 5: 跑测试**

Run: `npm test && npx playwright test tests/e2e/identity.spec.ts tests/e2e/chrome.spec.ts tests/e2e/layout.spec.ts tests/e2e/a11y.spec.ts`
Expected：全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/data/site.ts src/components/Nav.astro src/components/Footer.astro tests/unit/site.test.ts tests/unit/privacy-email.test.ts tests/e2e/identity.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Main site speaks AI products; GitHub in nav and footer; one source for the contact address

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 六栏摘要（方案取舍 + 下一步）

**Files:**
- Modify: `src/layouts/ProjectLayout.astro`（`Summary`、`rows`、渲染）、`src/data/site.ts`（`summaryLabels`、5 个项目页的 `summary`）
- Create: `tests/e2e/summary.spec.ts`

**Interfaces:**
- Produces：`Summary = { task: Bi; tradeoff?: Bi; mine: Bi; tools: Bi; evidence: Bi; status: Bi; next?: Bi }`；`SITE.summaryLabels.tradeoff`、`SITE.summaryLabels.statusNext`。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/summary.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';

const PAGES = [['/projects/ai-career/', 'career'], ['/projects/hris-workflow/', 'hris'], ['/projects/quota-deck/', 'quota'], ['/projects/campus-delivery/', 'campus'], ['/projects/ai-campus/', 'aiCampus']] as const;

for (const [path, key] of PAGES) {
  test(`${path} opens with problem, trade-offs, work, tools, evidence and status`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const S = SITE.summaryLabels;
    const labels = await page.locator('.p-summary dt').allTextContents();
    const status = SITE.pages[key].summary.next ? S.statusNext.zh : S.status.zh;
    expect(labels).toEqual([S.task.zh, S.tradeoff.zh, S.mine.zh, S.tools.zh, S.evidence.zh, status]);
    await expect(page.locator('.p-summary dd').nth(1)).toHaveText(SITE.pages[key].summary.tradeoff!.zh);
  });
}
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx playwright test tests/e2e/summary.spec.ts`
Expected：FAIL（类型上 `tradeoff` 不存在；运行时只有五栏）。

- [ ] **Step 3: 扩展 `Summary` 与渲染**

`src/layouts/ProjectLayout.astro`：

```ts
export interface Summary { task: Bi; tradeoff?: Bi; mine: Bi; tools: Bi; evidence: Bi; status: Bi; next?: Bi }
```

把 `const rows …` 一行替换为：

```ts
const rows: [Bi, Bi, Bi?][] = [
  [S.task, summary.task],
  ...(summary.tradeoff ? [[S.tradeoff, summary.tradeoff] as [Bi, Bi]] : []),
  [S.mine, summary.mine], [S.tools, summary.tools], [S.evidence, summary.evidence],
  [summary.next ? S.statusNext : S.status, summary.status, summary.next],
];
```

`<dl>` 的渲染改为（`next` 作为同一栏里的第二句）：

```astro
      <dl>{rows.map(([k, v, next]) => <div class="p-row" data-m-pre={motion ? '' : undefined}><dt>{k[lang]}</dt><dd>{motion ? countableSegments(v[lang]).map(s => s.count ? <span class="p-count" data-count>{s.text}</span> : s.text) : v[lang]}{next && <span class="p-next"> {next[lang]}</span>}</dd></div>)}</dl>
```

样式加：`.p-next { color: var(--red-text); }`

测试里 `dd.nth(1)` 取的是 `tradeoff` 一栏，它没有 `next`，文本完全相等。

- [ ] **Step 4: 加标签与五页草稿**

`SITE.summaryLabels` 中：`task` 改为 `{ zh: '痛点与场景', en: 'Problem & context' }`；新增：

```ts
    tradeoff: { zh: '方案取舍', en: 'Trade-offs' },
    statusNext: { zh: '状态与下一步', en: 'Status & next' },
```

在下面 5 个 `SITE.pages.<key>.summary` 对象里加 `tradeoff`（以及 `career` 的 `next`）。这些是**草稿**，Task 15 交用户确认：

`career`：

```ts
        tradeoff: { zh: '公开演示用确定性的规则匹配：同样的输入总得到同样的分数，每条判断都能追溯到一条事实，访客改了输入可以当场复核。', en: 'The public demo uses deterministic rule matching: the same input always gives the same score, every judgement traces back to a fact, and a visitor who changes the input can check the result on the spot.' },
        next: { zh: '下一步：把大模型的语义判断接入公开演示，与规则结果并排展示并标明来源。', en: 'Next: bring a language model\'s semantic judgement into the public demo, shown beside the rule result with its source labelled.' },
```

`hris`：

```ts
        tradeoff: { zh: '模型只提供候选值，写入由人工审核决定；手写件最容易出错，一律进入人工复核。', en: 'The model only proposes values and a person decides what is written; handwritten files are the most error-prone, so every one goes to manual review.' },
```

`quota`：

```ts
        tradeoff: { zh: '读不到额度时显示"未知"，不当作用完；估算、过期快照和断连都标明来源，刷新失败时保留上次成功的数据和时间，不假装刚同步。', en: 'A quota that cannot be read shows as "unknown", not as used up; estimates, stale snapshots and disconnects are labelled with their source, and a failed refresh keeps the last good data and its time instead of pretending to be fresh.' },
```

`campus`：

```ts
        tradeoff: { zh: '先把一笔订单拆成相互约束的表，再用事务保证下单、支付、配送、退款要么全部写入、要么全部回滚；经营分析用固定种子生成的合成数据，只说明方法，不代表真实经营。', en: 'An order is split into tables that constrain each other, and transactions make ordering, payment, delivery and refunds all land or all roll back; the analysis uses seeded synthetic data and shows a method, not real trading.' },
```

`aiCampus`：

```ts
        tradeoff: { zh: '2024 年的原研究与 2026 年的浏览器重建分开写：重建只复现分析方法，构造样本都有标注，不当作当年的调查结果。', en: 'The 2024 study and its 2026 browser rebuild are kept apart: the rebuild only reproduces the method, and its constructed samples are labelled and never presented as survey results.' },
```

- [ ] **Step 5: 跑测试**

Run: `npm test && npx playwright test tests/e2e/summary.spec.ts tests/e2e/hris.spec.ts tests/e2e/career.spec.ts tests/e2e/campus.spec.ts tests/e2e/phase2b.spec.ts tests/e2e/numbers.spec.ts`
Expected：全部通过。若 `numbers.spec` 报出草稿里的数字，说明草稿引入了台账外数字：改写草稿去掉数字，不改台账。

- [ ] **Step 6: 提交**

```bash
git add src/layouts/ProjectLayout.astro src/data/site.ts tests/e2e/summary.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Project summaries: problem, trade-offs and next step (drafts pending the author's sign-off)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 三档动效系统与开关

**Files:**
- Create: `src/scripts/motion/tier.ts`、`src/components/MotionSwitch.astro`、`tests/unit/tier.test.ts`、`tests/e2e/motion-tier.spec.ts`
- Modify: `src/layouts/Base.astro`（内联脚本、底部脚本）、`src/styles/base.css`、`src/components/Footer.astro`、`src/components/ContactBar.astro`、`src/scripts/motion/tokens.ts`、`src/scripts/motion/arm.ts`、`src/scripts/motion-dom.ts`、`src/data/site.ts`（`SITE.motion`）、`tests/e2e/helpers.ts`，以及下面列出的直接判断处
- Modify tests：凡因"减少动态效果 = 完全静止"而失败的断言

**Interfaces:**
- Produces（`src/scripts/motion/tier.ts`）：
  - `type Tier = 'full' | 'gentle' | 'lite' | 'off'`、`type Choice = 'full' | 'gentle' | 'off'`、`MOTION_KEY = 'hyj-motion'`、`CHOICES`
  - `pickTier(env: TierEnv): Tier`、`currentTier(doc?: Document): Tier`
  - `anyMotion(): boolean`（档位不是 off）、`fullMotion(): boolean`（full 或 lite）
  - `averageFps(stamps: readonly number[]): number`、`SLOW_FPS = 30`、`watchFps(doc?: Document, frames?: number): void`
  - `readChoice(): Choice | null`、`saveChoice(c: Choice): void`
  - `tests/e2e/helpers.ts`：`motionOff(page)`、`motionChoice(page, c)`

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/tier.test.ts`：

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { pickTier, averageFps, watchFps } from '../../src/scripts/motion/tier';

const env = { choice: null, reduced: false, saveData: false, deviceMemory: 8 };

describe('pickTier', () => {
  it('defaults to full', () => expect(pickTier(env)).toBe('full'));
  it('system reduced motion gives gentle, not off', () => expect(pickTier({ ...env, reduced: true })).toBe('gentle'));
  it('save-data or a small device gives lite', () => {
    expect(pickTier({ ...env, saveData: true })).toBe('lite');
    expect(pickTier({ ...env, deviceMemory: 4 })).toBe('lite');
    expect(pickTier({ ...env, deviceMemory: undefined })).toBe('full');
  });
  it("the visitor's choice wins over everything", () => {
    expect(pickTier({ ...env, reduced: true, choice: 'full' })).toBe('full');
    expect(pickTier({ ...env, choice: 'off' })).toBe('off');
    expect(pickTier({ ...env, saveData: true, choice: 'gentle' })).toBe('gentle');
  });
  it('ignores a stored value it does not know', () => expect(pickTier({ ...env, choice: 'turbo' })).toBe('full'));
});

describe('averageFps', () => {
  it('measures frames per second over the run', () => expect(averageFps([0, 50, 100, 150, 200])).toBe(20));
  it('a single stamp is not a measurement', () => expect(averageFps([16])).toBe(Infinity));
});

describe('watchFps', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('does nothing while the page is hidden', () => {
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('localStorage', { getItem: () => null });
    const doc = { visibilityState: 'hidden', documentElement: { dataset: { motion: 'full' } } } as unknown as Document;
    watchFps(doc);
    expect(raf).not.toHaveBeenCalled();
  });
  it('drops a slow full page to lite after the sample', () => {
    let t = 0;
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queue.push(cb); return queue.length; });
    vi.stubGlobal('localStorage', { getItem: () => null });
    const doc = { visibilityState: 'visible', documentElement: { dataset: { motion: 'full' } } } as unknown as Document;
    watchFps(doc, 10);
    while (queue.length) { t += 50; queue.shift()!(t); }          // 20 fps
    expect(doc.documentElement.dataset.motion).toBe('lite');
  });
  it("never overrides the visitor's choice", () => {
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('localStorage', { getItem: () => 'full' });
    const doc = { visibilityState: 'visible', documentElement: { dataset: { motion: 'full' } } } as unknown as Document;
    watchFps(doc);
    expect(raf).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/tier.test.ts`
Expected：FAIL，模块不存在。

- [ ] **Step 3: 实现 `tier.ts`**

`src/scripts/motion/tier.ts`：

```ts
/** Motion tiers (spec §7.3). Base.astro's inline script writes <html data-motion> before first paint with the same rules
 *  as pickTier; everything else reads it through currentTier(). */
export type Tier = 'full' | 'gentle' | 'lite' | 'off';
export type Choice = 'full' | 'gentle' | 'off';
export const MOTION_KEY = 'hyj-motion';
export const CHOICES: readonly Choice[] = ['full', 'gentle', 'off'];
export const SLOW_FPS = 30;

export interface TierEnv { choice: string | null; reduced: boolean; saveData: boolean; deviceMemory?: number }

export function pickTier(env: TierEnv): Tier {
  if (CHOICES.includes(env.choice as Choice)) return env.choice as Choice;
  if (env.reduced) return 'gentle';
  if (env.saveData || (env.deviceMemory !== undefined && env.deviceMemory <= 4)) return 'lite';
  return 'full';
}

export function currentTier(doc: Document = document): Tier {
  const t = doc.documentElement.dataset.motion;
  return t === 'gentle' || t === 'lite' || t === 'off' ? t : 'full';
}

/** Anything moves at all: one-shot fades included. */
export const anyMotion = (): boolean => typeof document !== 'undefined' && currentTier() !== 'off';
/** Travelling motion (slides, splits, parallax, magnets): full and lite only. */
export const fullMotion = (): boolean => {
  if (typeof document === 'undefined') return false;
  const t = currentTier();
  return t === 'full' || t === 'lite';
};

export function averageFps(stamps: readonly number[]): number {
  if (stamps.length < 2) return Infinity;
  return ((stamps.length - 1) * 1000) / (stamps[stamps.length - 1] - stamps[0]);
}

export function readChoice(): Choice | null {
  try {
    const c = localStorage.getItem(MOTION_KEY);
    return CHOICES.includes(c as Choice) ? (c as Choice) : null;
  } catch {
    return null;
  }
}

export function saveChoice(c: Choice): void {
  try { localStorage.setItem(MOTION_KEY, c); } catch { /* storage blocked: this page still switches */ }
  document.documentElement.dataset.motion = c;
}

/** Samples the first frames of a visible page; a page that cannot hold 30 fps drops from full to lite.
 *  A hidden tab has no frames to measure, and a visitor who chose a tier is never second-guessed. */
export function watchFps(doc: Document = document, frames = 60): void {
  if (doc.visibilityState !== 'visible' || currentTier(doc) !== 'full' || readChoice() !== null) return;
  const stamps: number[] = [];
  const tick = (t: number) => {
    if (doc.visibilityState !== 'visible') return;
    stamps.push(t);
    if (stamps.length < frames) { requestAnimationFrame(tick); return; }
    if (averageFps(stamps) < SLOW_FPS && currentTier(doc) === 'full') doc.documentElement.dataset.motion = 'lite';
  };
  requestAnimationFrame(tick);
}
```

- [ ] **Step 4: 跑单元测试**

Run: `npx vitest run tests/unit/tier.test.ts`
Expected：PASS。

- [ ] **Step 5: 写端到端测试与辅助函数**

`tests/e2e/helpers.ts` 末尾加：

```ts
/** Choose a motion tier before any page script runs, as the footer switch would. */
export async function motionChoice(page: Page, choice: 'full' | 'gentle' | 'off'): Promise<void> {
  await page.addInitScript(c => { try { localStorage.setItem('hyj-motion', c); } catch { /* storage blocked */ } }, choice);
}
export const motionOff = (page: Page) => motionChoice(page, 'off');
```

`tests/e2e/motion-tier.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, motionChoice } from './helpers';

const tier = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.dataset.motion);

test.beforeEach(async ({ page }) => { await skipIntro(page); });

test('full by default', async ({ page }) => {
  await page.goto('/projects/');
  expect(await tier(page)).toBe('full');
});

test('system reduced motion: gentle, and rows still fade in without travelling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/projects/');
  expect(await tier(page)).toBe('gentle');
  const last = page.locator('a.prow').last();
  await expect(last).toHaveClass(/reveal/);
  expect(await last.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/is-in/);
  await expect.poll(() => last.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('motion off: nothing is armed and nothing transitions', async ({ page }) => {
  await motionChoice(page, 'off');
  await page.goto('/projects/');
  expect(await tier(page)).toBe('off');
  await expect(page.locator('a.prow.reveal')).toHaveCount(0);
  expect(await page.locator('a.prow').first().evaluate(el => getComputedStyle(el).transitionDuration.split(',').every(d => parseFloat(d) <= 0.001))).toBe(true);
});

test('the footer switch remembers the choice', async ({ page }) => {
  await page.goto('/brief/');
  const sw = page.locator('footer.footer [data-motion-switch]');
  await expect(sw.locator('button[aria-pressed="true"]')).toHaveCount(0);   // automatic until the visitor picks one
  await sw.getByRole('button', { name: SITE.motion.off.zh }).click();
  await page.waitForLoadState('load');
  expect(await tier(page)).toBe('off');
  await expect(page.locator('footer.footer [data-motion-switch] button[aria-pressed="true"]')).toHaveText(SITE.motion.off.zh);
  await page.reload();
  expect(await tier(page)).toBe('off');
});

test('storage blocked: tier boots and the switch still works', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/brief/');
  expect(await tier(page)).toBe('full');
  await page.locator('footer.footer [data-motion-switch]').getByRole('button', { name: SITE.motion.gentle.zh }).click();
  await page.waitForLoadState('load');
  expect(errors).toEqual([]);
});
```

- [ ] **Step 6: 跑测试确认失败**

Run: `npx playwright test tests/e2e/motion-tier.spec.ts`
Expected：FAIL（`data-motion` 未设置；没有开关）。

- [ ] **Step 7: 首帧前写档位**

`src/layouts/Base.astro` 中，把注释为 `A missing or slow island must never leave a heading hidden.` 的那段内联脚本整体替换为：

```astro
    <script is:inline>
      /* Motion tier: the same rules as scripts/motion/tier.ts pickTier (motion-tier.spec keeps them in step).
         A missing or slow island must never leave a heading hidden. */
      (function () {
        var d = document.documentElement, n = navigator, c = null, r = false;
        try { c = localStorage.getItem('hyj-motion'); } catch (e) { /* storage blocked */ }
        try { r = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* no matchMedia */ }
        var t = c === 'full' || c === 'gentle' || c === 'off' ? c
          : r ? 'gentle'
          : (n.connection && n.connection.saveData) || (n.deviceMemory && n.deviceMemory <= 4) ? 'lite' : 'full';
        d.dataset.motion = t;
        if (t === 'off') return;
        d.classList.add('motion-ok');
        setTimeout(function () { d.classList.add('motion-timeout'); }, 2500);
      })();
    </script>
```

同一文件底部的 `<script>`（`initRise`）改为：

```astro
    <script>
      import { initRise } from '../scripts/rise';
      import { watchFps } from '../scripts/motion/tier';
      initRise();
      watchFps();
    </script>
```

- [ ] **Step 8: 全局档位样式**

`src/styles/base.css` 末尾追加：

```css
/* Motion tiers (scripts/motion/tier.ts). Off: nothing moves. Gentle: one-shot reveals fade in place, no travel. */
html[data-motion='off'] *, html[data-motion='off'] *::before, html[data-motion='off'] *::after {
  animation-duration: 1ms !important; animation-delay: 0s !important; animation-iteration-count: 1 !important;
  transition-duration: 1ms !important; transition-delay: 0s !important; scroll-behavior: auto !important;
}
html[data-motion='gentle'] .reveal, html[data-motion='gentle'] .m-armed, html[data-motion='gentle'] .m-armed > * { transform: none !important; }
html[data-motion='gentle'] .reveal:not(.is-in), html[data-motion='gentle'] .m-armed:not(.m-in) { opacity: 0; }
html[data-motion='gentle'] .reveal.is-in, html[data-motion='gentle'] .m-armed.m-in { opacity: 1; transition: opacity 0.7s var(--ease) var(--d, var(--m-d, 0ms)); }
```

- [ ] **Step 9: 开关组件与文案**

`src/data/site.ts` 中 `footer:` 一行之后加：

```ts
  motion: {
    label: { zh: '动效', en: 'Motion' },
    full: { zh: '完整', en: 'Full' },
    gentle: { zh: '温和', en: 'Gentle' },
    off: { zh: '关', en: 'Off' },
  },
```

`src/components/MotionSwitch.astro`：

```astro
---
import { SITE } from '../data/site';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const M = SITE.motion;
const choices = ['full', 'gentle', 'off'] as const;
---
<div class="mswitch" role="group" aria-label={M.label[lang]} data-motion-switch>
  <span class="mswitch__label" aria-hidden="true">{M.label[lang]}</span>
  {choices.map(c => <button type="button" data-choice={c} aria-pressed="false">{M[c][lang]}</button>)}
</div>
<script>
  import { readChoice, saveChoice, type Choice } from '../scripts/motion/tier';
  for (const root of document.querySelectorAll<HTMLElement>('[data-motion-switch]')) {
    const chosen = readChoice();
    for (const b of root.querySelectorAll<HTMLButtonElement>('button[data-choice]')) {
      b.setAttribute('aria-pressed', String(b.dataset.choice === chosen));
      // Every script decides its motion once at start, so a fresh load is the honest way to apply a new tier.
      b.addEventListener('click', () => { saveChoice(b.dataset.choice as Choice); location.reload(); });
    }
  }
</script>
<style>
  .mswitch { display: inline-flex; align-items: center; gap: 2px; font-size: 13px; }
  .mswitch__label { margin-right: 6px; }
  .mswitch button { padding: 2px 8px; border: 1px solid currentColor; background: none; color: inherit; font: inherit; cursor: pointer; }
  .mswitch button[aria-pressed='true'] { background: var(--ink); color: var(--paper); }
  :global(.night) .mswitch button[aria-pressed='true'], :global(.contact--red) .mswitch button[aria-pressed='true'] { background: var(--paper); color: var(--ink); }
</style>
```

`src/components/Footer.astro`：import `MotionSwitch`，在第二个 `<p>` 之后加 `<MotionSwitch lang={lang} />`。
`src/components/ContactBar.astro`：import `MotionSwitch`，在 `.contact__in` 末尾加 `<MotionSwitch lang={lang} />`（首页没有页脚，靠它提供开关）。

- [ ] **Step 10: 统一所有直接判断**

规则：
- `src/scripts/motion/tokens.ts`：`prefersMotion()` 的函数体改为 `return fullMotion();`，并 `import { fullMotion } from './tier';`。（`pointer.ts`、`split-title.ts` 通过它得到"只在 full / lite 下位移"。）
- `src/scripts/motion/arm.ts`：两处 `prefersMotion()` 改为 `anyMotion()`（`import { anyMotion } from './tier';`），让温和档也会布置淡入；`settleOnReduce` 里监听系统变化的 `media` 保留不动。
- `src/scripts/motion-dom.ts`：`const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;` 改为 `const reduced = () => !anyMotion();`，并 import。
- 其余每一处 `matchMedia('(prefers-reduced-motion: reduce)').matches`（作为"要不要开始动"的判断）都改为 `!fullMotion()`，并从 `scripts/motion/tier` 导入（路径按文件位置写相对路径）。保存成 `media` 变量、只用于 `addEventListener('change', …)` 的不改；同一文件里用 `media.matches` 做开始判断的，改为 `!fullMotion()`。
- `src/layouts/Base.astro` 中开场的内联脚本这一处，在 Task 8 处理，本任务不动。

逐个文件处理下面的清单（来自 `grep -rn "prefers-reduced-motion: reduce" src | grep -v "@media"`），改完再跑一次这条 grep，结果应只剩：`tier.ts`、`Base.astro` 的两段内联脚本、以及只用于监听 `change` 的变量声明：

```
src/components/DataRows.astro  src/components/InsightsPrologue.astro  src/components/JungHandbook.astro
src/components/JungPrologue.astro (2)  src/components/RelationsDiagram.astro  src/scripts/campus-live.ts
src/scripts/career-circuit.ts  src/scripts/career-live.ts  src/scripts/cinema/renderer.ts  src/scripts/cockpit-ui.ts
src/scripts/countup-dom.ts  src/scripts/delivery-ui.ts (2)  src/scripts/door-transition-dom.ts  src/scripts/film-desk-dom.ts
src/scripts/impact-dom.ts  src/scripts/intro-dom.ts  src/scripts/jung-prologue.ts  src/scripts/lab-ui.ts
src/scripts/morph-dom.ts  src/scripts/motion/pointer.ts  src/scripts/motion/reveal.ts  src/scripts/motion/split-title.ts
src/scripts/odometer-dom.ts  src/scripts/plate-dom.ts  src/scripts/qd-live.ts  src/scripts/reel-dom.ts
src/scripts/rise.ts  src/scripts/txn-band.ts  src/views/MethodView.astro  src/views/ProjectsView.astro
```

`src/scripts/intro-dom.ts` 也在清单里，但它由 Task 8 整体改写，本任务先按规则替换为 `!fullMotion()`，保证中间状态可运行。

- [ ] **Step 11: 跑新测试**

Run: `npm test && npx playwright test tests/e2e/motion-tier.spec.ts`
Expected：全部通过。

- [ ] **Step 12: 全量端到端，修正"减少动态 = 静止"的旧断言**

Run: `npm run e2e`
对每个失败的测试判断它原本想测什么：
- 想测"没有动效时内容立即可见/数字不在滚动中途"（例如 `numbers.spec.ts` 的 `emulateMedia({ reducedMotion: 'reduce' })`、各 `reduced motion:` 用例）：把 `page.emulateMedia({ reducedMotion: 'reduce' })` 换成 `await motionOff(page)`（在 `goto` 之前调用），测试名里的 `reduced motion` 改成 `motion off`。
- 想测开场（`intro.spec.ts` 的 `reduced motion: no intro`）：留给 Task 8，本任务把它标成 `test.fixme` 并在 Task 8 恢复。
- 其他失败：说明本任务改坏了行为，回到代码修，不改测试。

重跑 `npm run e2e`，Expected：除 `intro.spec.ts` 中被 `fixme` 的一条外全部通过。

- [ ] **Step 13: 提交**

```bash
git add -A src tests
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Motion tiers: reduced-motion visitors get gentle fades instead of a frozen page; footer switch; slow devices drop to lite

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 流式开场与温和版开场

**Files:**
- Modify: `src/data/site.ts`（`SITE.intro.words`）、`src/components/Intro.astro`、`src/scripts/intro.ts`、`src/scripts/intro-dom.ts`、`src/layouts/Base.astro`（开场内联脚本）
- Modify tests: `tests/unit/intro.test.ts`、`tests/e2e/intro.spec.ts`

**Interfaces:**
- Consumes：`currentTier()`（Task 7）。
- Produces：`type IntroMode = 'full' | 'gentle'`、`introMode(env: { seen: boolean; tier: Tier; fontsReady: boolean }): IntroMode | null`、`INTRO_MS = 2400`、`INTRO_GENTLE_MS = 800`、`introLetterDelay(line: number, k: number): number`（秒）。

- [ ] **Step 1: 改单元测试**

`tests/unit/intro.test.ts` 中所有 `shouldPlayIntro` 的用例替换为：

```ts
import { introMode, introLetterDelay, INTRO_MS, INTRO_GENTLE_MS } from '../../src/scripts/intro';

describe('introMode', () => {
  const base = { seen: false, tier: 'full' as const, fontsReady: true };
  it('plays the full intro on a first visit', () => expect(introMode(base)).toBe('full'));
  it('lite devices still get the full intro (it is CSS only)', () => expect(introMode({ ...base, tier: 'lite' })).toBe('full'));
  it('reduced motion gets the short fade', () => expect(introMode({ ...base, tier: 'gentle' })).toBe('gentle'));
  it('never when seen, off, or the display font is late', () => {
    expect(introMode({ ...base, seen: true })).toBeNull();
    expect(introMode({ ...base, tier: 'off' })).toBeNull();
    expect(introMode({ ...base, fontsReady: false })).toBeNull();
  });
});

describe('streamed letters', () => {
  it('each line starts after the previous one and letters stream in order', () => {
    expect(introLetterDelay(0, 0)).toBeLessThan(introLetterDelay(0, 1));
    expect(introLetterDelay(0, 7)).toBeLessThan(introLetterDelay(1, 0));
  });
  it('the last letter of FILM lands before the trace starts drawing', () => {
    expect(introLetterDelay(2, 3)).toBeLessThan(1.45);
  });
  it('gentle is a third of the full intro', () => expect(INTRO_GENTLE_MS * 3).toBe(INTRO_MS));
});
```

保留文件里 `readSeen`、`markSeen`、`withTimeout` 的原有用例。

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/intro.test.ts`
Expected：FAIL，`introMode` 不存在。

- [ ] **Step 3: 改 `intro.ts`**

删除 `IntroEnv` 与 `shouldPlayIntro`，加入：

```ts
import type { Tier } from './motion/tier';

export const INTRO_GENTLE_MS = 800;
export type IntroMode = 'full' | 'gentle';

export function introMode(env: { seen: boolean; tier: Tier; fontsReady: boolean }): IntroMode | null {
  if (env.seen || env.tier === 'off' || !env.fontsReady) return null;
  return env.tier === 'gentle' ? 'gentle' : 'full';
}

/** Seconds into the intro at which letter k of line `line` appears: lines start 0.45 s apart, letters stream 35 ms apart. */
export function introLetterDelay(line: number, k: number): number {
  return Math.round((0.1 + line * 0.45 + k * 0.035) * 1000) / 1000;
}
```

`INTRO_MS = 2400` 保持不变。

- [ ] **Step 4: 新开场词与组件**

`SITE.intro.words` 改为：

```ts
    words: [
      { word: 'WORKFLOW', caption: { zh: 'Agent 工作流', en: 'Agent workflows' } },
      { word: 'PRODUCT', caption: { zh: 'AI 产品', en: 'AI products' } },
      { word: 'FILM', caption: { zh: 'AIGC 影像', en: 'AIGC film' } },
    ],
```

`src/components/Intro.astro` 整体替换为：

```astro
---
import { SITE } from '../data/site';
import { introLetterDelay } from '../scripts/intro';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const words = SITE.intro.words;
---
<div class="intro" hidden data-intro tabindex="-1">
  <div class="intro__stage" aria-hidden="true">
    {words.map((w, i) => (
      <div class="intro__line" style={`--caret-on:${introLetterDelay(i, 0)}s;--caret-off:${i < words.length - 1 ? introLetterDelay(i + 1, 0) : 9}s`}>
        <b>{[...w.word].map((ch, k) => <span style={`--d:${introLetterDelay(i, k)}s`}>{ch}</span>)}<i class="intro__caret"></i></b>
        <span class="intro__cap" style={`--d:${introLetterDelay(i, 0) + 0.25}s`}>{w.caption[lang]}</span>
      </div>
    ))}
  </div>
  <svg class="intro__trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M 72 78 C 52 78, 40 30, 8 10" pathLength="1" /></svg>
  <button type="button" class="intro__skip" data-intro-skip>{SITE.intro.skip[lang]} <kbd>Esc</kbd></button>
</div>
<script>
  import { initIntro } from '../scripts/intro-dom';
  const overlay = document.querySelector<HTMLElement>('[data-intro]');
  if (overlay) void initIntro(overlay);
</script>
<style>
  .intro { position: fixed; inset: 0; z-index: 100; overflow: hidden; background: var(--paper); outline: none; }
  :global(html.intro-pending) .intro, .intro.is-playing { display: block; }
  .intro__stage { position: absolute; inset: 0; display: grid; align-content: center; gap: 2vh; padding-inline: var(--gutter); }
  .intro__line { display: grid; grid-template-columns: auto 1fr; align-items: end; gap: 0 24px; }
  .intro__line b { position: relative; font: 700 min(14vw, 19vh)/0.88 var(--font-display); color: var(--ink); white-space: nowrap; }
  .intro__line:nth-child(2) b { color: var(--red); }
  .intro__line b > span { opacity: 0; }
  .intro__cap { padding-bottom: 1.2vh; font: 700 clamp(12px, 1.2vw, 18px)/1 var(--font-cjk-bold); letter-spacing: 0.3em; opacity: 0; }
  .intro__caret { display: inline-block; width: 0.08em; height: 0.72em; margin-left: 0.06em; background: var(--red); opacity: 0; }
  .intro__trace { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .intro__trace path { fill: none; stroke: var(--red); stroke-width: 2; vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: 1; }
  .intro__skip { position: absolute; right: var(--gutter); bottom: 24px; z-index: 2; padding: 8px 14px; border: 1.5px solid var(--ink); background: var(--paper); font-weight: 700; cursor: pointer; }
  .intro__skip kbd { margin-left: 6px; font: 700 11px/1 var(--font-display); letter-spacing: 0.1em; }

  /* Full: letters stream in like tokens, a caret rides the current line, the trace draws towards the name, the cover lifts. */
  .is-playing:not(.is-gentle) { animation: intro-lift 0.5s 1.9s cubic-bezier(.7, 0, .2, 1) forwards; }
  .is-playing:not(.is-gentle) .intro__line b > span { animation: intro-token 0.12s var(--d) steps(1) forwards; }
  .is-playing:not(.is-gentle) .intro__cap { animation: intro-fade 0.3s var(--d) var(--ease) forwards; }
  .is-playing:not(.is-gentle) .intro__caret { animation: intro-caret 0.24s var(--caret-on) steps(1) infinite, intro-caret-off 0.01s var(--caret-off) forwards; }
  .is-playing:not(.is-gentle) .intro__trace path { animation: intro-draw 0.4s 1.45s cubic-bezier(.6, 0, .2, 1) forwards; }
  /* Gentle: everything at once, a fade in and out; nothing travels. */
  .is-gentle .intro__line b > span, .is-gentle .intro__cap { opacity: 1; }
  .is-playing.is-gentle { animation: intro-gentle 0.8s var(--ease) forwards; }
  @keyframes intro-token { to { opacity: 1; } }
  @keyframes intro-fade { to { opacity: 1; } }
  @keyframes intro-caret { 0% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes intro-caret-off { to { visibility: hidden; } }
  @keyframes intro-draw { to { stroke-dashoffset: 0; } }
  @keyframes intro-lift { to { transform: translateY(-100%); } }
  @keyframes intro-gentle { 0% { opacity: 0; } 30%, 60% { opacity: 1; } 100% { opacity: 0; } }
</style>
```

- [ ] **Step 5: 改 `intro-dom.ts` 与开场内联脚本**

`src/scripts/intro-dom.ts`：import 改为

```ts
import { FONT_WAIT_MS, INTRO_GENTLE_MS, INTRO_MS, introMode, markSeen, readSeen, withTimeout } from './intro';
import { currentTier } from './motion/tier';
```

`initIntro` 开头四行（`reducedMotion`、`seen`、`fontsReady`、判断）替换为：

```ts
  const tier = currentTier();
  const seen = readSeen(store);
  const fontsReady = !seen && tier !== 'off' && (await withTimeout(document.fonts.load('700 1em Barlow'), FONT_WAIT_MS));
  const mode = introMode({ seen, tier, fontsReady });

  // The inline failsafe may already have uncovered the page; never cover it again once the visitor can use it.
  const stillCovered = html.classList.contains('intro-pending');
  if (!stillCovered || !mode) {
    html.classList.remove('intro-pending');
    return;
  }
```

`overlay.classList.add('is-playing');` 改为：

```ts
  overlay.classList.add('is-playing');
  overlay.classList.toggle('is-gentle', mode === 'gentle');
```

`timer = window.setTimeout(finish, INTRO_MS);` 改为 `timer = window.setTimeout(finish, mode === 'gentle' ? INTRO_GENTLE_MS : INTRO_MS);`；`finish` 里 `overlay.classList.remove('is-playing');` 改为 `overlay.classList.remove('is-playing', 'is-gentle');`。

`src/layouts/Base.astro` 开场内联脚本中：

```js
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
```

改为：

```js
            if (d.dataset.motion === 'off') return;
```

- [ ] **Step 6: 更新开场端到端测试**

`tests/e2e/intro.spec.ts`：
- 删掉 Task 7 加的 `fixme`，把 `reduced motion: no intro` 替换为两条：

```ts
  test('reduced motion: a short fade instead', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator(overlay)).toHaveClass(/is-gentle/);
    await expect(page.locator(overlay)).toBeHidden({ timeout: 1500 });
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('Escape skips the gentle intro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('motion off: no intro', async ({ page }) => {
    await motionOff(page);
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });
```

  （文件顶部 `import { motionOff } from './helpers';`）
- `intro script crashes` 用例：开场不再调用 `matchMedia`，原来的注入不会让模块崩溃。把 `addInitScript` 改为让字体接口抛错：

```ts
    // document.fonts throwing makes the intro module crash before it can lift the cover.
    await page.addInitScript(() => { Object.defineProperty(Document.prototype, 'fonts', { get() { throw new Error('boom'); } }); });
```

  并把注释第一句改成这句。
- 新增一条确认流式效果：

```ts
  test('letters stream in and the trace draws before the cover lifts', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('.intro__line').first().locator('b > span').first();
    const last = page.locator('.intro__line').last().locator('b > span').last();
    await expect.poll(() => first.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    expect(await last.evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    await expect.poll(() => page.locator('.intro__trace path').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset)), { timeout: 2500 }).toBeLessThan(0.05);
  });
```

- [ ] **Step 7: 跑测试**

Run: `npm test && npx playwright test tests/e2e/intro.spec.ts tests/e2e/home.spec.ts`
Expected：全部通过。

- [ ] **Step 8: 提交**

```bash
git add src/data/site.ts src/components/Intro.astro src/scripts/intro.ts src/scripts/intro-dom.ts src/layouts/Base.astro tests/unit/intro.test.ts tests/e2e/intro.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Intro: WORKFLOW / PRODUCT / FILM streamed like tokens with a trace to the name; a short fade for reduced motion

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 首屏执行轨迹（AgentTrace）

**Files:**
- Create: `src/scripts/agent-trace.ts`、`src/scripts/agent-trace-dom.ts`、`src/components/AgentTrace.astro`、`tests/unit/agent-trace.test.ts`、`tests/e2e/agent-trace.spec.ts`
- Modify: `src/data/site.ts`（`SITE.trace`）、`src/data/tokens.ts`（`blend`）、`src/views/HomeView.astro`

**Interfaces:**
- Consumes：`currentTier()`、`Tier`（Task 7）、`frameCap(fps)`（`src/scripts/frame-cap.ts`）、`magnetOffset(dx, dy, strength, max)`（`src/scripts/motion/tokens.ts`）、`MOTION.magnetMax`。
- Produces：`TRACE_VIEW`、`TRACE_ALPHA`、`traceNodes(n?)`、`edgePath(a, b)`、`pointOnEdge(a, b, p)`、`pulseAt(t, period, n?, travel?)`、`periodFor(tier)`；`blend(fg, bg, alpha): string`。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/agent-trace.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { traceNodes, edgePath, pointOnEdge, pulseAt, periodFor, TRACE_VIEW, TRACE_ALPHA } from '../../src/scripts/agent-trace';
import { blend, contrast, COLORS } from '../../src/data/tokens';
import { SITE } from '../../src/data/site';

describe('trace layout', () => {
  const nodes = traceNodes(5);
  it('five nodes inside the view, left to right, alternating rows', () => {
    expect(nodes).toHaveLength(5);
    for (const [i, p] of nodes.entries()) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(TRACE_VIEW.w);
      expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(TRACE_VIEW.h);
      if (i) { expect(p.x).toBeGreaterThan(nodes[i - 1].x); expect(p.y).not.toBe(nodes[i - 1].y); }
    }
  });
  it('edges start and end on their nodes', () => {
    const d = edgePath(nodes[0], nodes[1]);
    expect(d.startsWith(`M ${nodes[0].x} ${nodes[0].y}`)).toBe(true);
    expect(d.endsWith(`${nodes[1].x} ${nodes[1].y}`)).toBe(true);
    expect(pointOnEdge(nodes[0], nodes[1], 0)).toEqual(nodes[0]);
    expect(pointOnEdge(nodes[0], nodes[1], 1)).toEqual(nodes[1]);
  });
  it('one label per step, in both languages', () => {
    expect(SITE.trace).toHaveLength(5);
  });
});

describe('pulse', () => {
  it('starts on the first edge with the input ticked', () => expect(pulseAt(0, 5000)).toEqual({ edge: 0, progress: 0, done: 1 }));
  it('crosses the edges in order, then rests with every step ticked', () => {
    expect(pulseAt(1500, 5000).edge).toBe(2);
    expect(pulseAt(3500, 5000)).toEqual({ edge: -1, progress: 1, done: 5 });
  });
  it('repeats every period, also for negative clocks', () => {
    expect(pulseAt(5000 + 1500, 5000)).toEqual(pulseAt(1500, 5000));
    expect(pulseAt(-3500, 5000)).toEqual(pulseAt(1500, 5000));
  });
  it('gentle runs three times slower', () => expect(periodFor('gentle')).toBe(periodFor('full') * 3));
});

describe('visibility floor', () => {
  it('trace lines stay visible on paper (contrast ≥ 1.6)', () => {
    expect(contrast(blend(COLORS.ink, COLORS.paper, TRACE_ALPHA), COLORS.paper)).toBeGreaterThanOrEqual(1.6);
  });
  it('blend is exact at the ends', () => {
    expect(blend('#000000', '#ffffff', 1)).toBe('#000000');
    expect(blend('#000000', '#ffffff', 0)).toBe('#ffffff');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/agent-trace.test.ts`
Expected：FAIL，模块不存在。

- [ ] **Step 3: 纯函数与颜色混合**

`src/data/tokens.ts` 末尾加：

```ts
/** fg laid over bg at the given opacity, as #rrggbb (used to check that decorative lines stay visible). */
export function blend(fg: string, bg: string, alpha: number): string {
  const ch = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const [f, b] = [ch(fg), ch(bg)];
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}
```

`src/scripts/agent-trace.ts`：

```ts
import type { Tier } from './motion/tier';

export interface Pt { x: number; y: number }
/** SVG user space of the home page's trace; the SVG scales it to its box. */
export const TRACE_VIEW = { w: 640, h: 220 } as const;
/** Opacity of the idle edges over paper; tests keep it above the visibility floor (spec §7.3). */
export const TRACE_ALPHA = 0.32;

/** n steps on a shallow zigzag: even steps on the upper line, odd ones on the lower. */
export function traceNodes(n = 5): Pt[] {
  const padX = 48, top = 64, bottom = 156;
  return Array.from({ length: n }, (_, i) => ({ x: padX + (i * (TRACE_VIEW.w - 2 * padX)) / (n - 1), y: i % 2 === 0 ? top : bottom }));
}

/** A cubic edge that leaves and arrives horizontally. */
export function edgePath(a: Pt, b: Pt): string {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

/** The point at fraction p along edgePath(a, b). */
export function pointOnEdge(a: Pt, b: Pt, p: number): Pt {
  const mx = (a.x + b.x) / 2, u = 1 - p;
  return {
    x: u * u * u * a.x + 3 * u * u * p * mx + 3 * u * p * p * mx + p * p * p * b.x,
    y: u * u * u * a.y + 3 * u * u * p * a.y + 3 * u * p * p * b.y + p * p * p * b.y,
  };
}

export interface PulseState { edge: number; progress: number; done: number }

/** Where the pulse is t ms into the loop: it crosses the n-1 edges during the first `travel` of each period,
 *  ticking each step as it reaches it, then rests with every step ticked. edge -1 means resting. */
export function pulseAt(t: number, period: number, n = 5, travel = 0.6): PulseState {
  const phase = (((t % period) + period) % period) / period;
  if (phase >= travel) return { edge: -1, progress: 1, done: n };
  const x = (phase / travel) * (n - 1);
  const edge = Math.floor(x);
  return { edge, progress: x - edge, done: edge + 1 };
}

export function periodFor(tier: Tier): number {
  return tier === 'gentle' ? 15000 : 5000;
}
```

`src/data/site.ts` 中 `intro:` 之前加：

```ts
  /** The home page's agent run, step by step (AgentTrace). */
  trace: [
    { zh: '输入', en: 'Input' },
    { zh: '规则', en: 'Rules' },
    { zh: '证据', en: 'Evidence' },
    { zh: '判断', en: 'Judgement' },
    { zh: '输出', en: 'Output' },
  ],
```

- [ ] **Step 4: 跑单元测试**

Run: `npx vitest run tests/unit/agent-trace.test.ts`
Expected：PASS。

- [ ] **Step 5: 写端到端测试**

`tests/e2e/agent-trace.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro, motionOff, noHorizontalOverflow } from './helpers';

const done = (page: import('@playwright/test').Page) => page.locator('[data-trace] .trace__node.is-done').count();

test.beforeEach(async ({ page }) => { await skipIntro(page); });

test('full: the pulse travels and the steps tick in turn', async ({ page }) => {
  await page.goto('/');
  const pulse = page.locator('[data-trace] .trace__pulse');
  const x0 = await pulse.getAttribute('cx');
  await expect.poll(() => pulse.getAttribute('cx'), { timeout: 3000 }).not.toBe(x0);
  const seen = new Set<number>();
  for (let i = 0; i < 12; i++) { seen.add(await done(page)); await page.waitForTimeout(400); }
  expect(seen.size).toBeGreaterThan(2);
});

test('gentle: no travelling dot, but the steps still light up', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.locator('[data-trace] .trace__pulse').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
  const a = await done(page);
  await expect.poll(() => done(page), { timeout: 8000 }).not.toBe(a);
});

test('off: a still diagram', async ({ page }) => {
  await motionOff(page);
  await page.goto('/');
  await expect(page.locator('[data-trace]')).toHaveClass(/is-static/);
  const a = await done(page);
  await page.waitForTimeout(1500);
  expect(await done(page)).toBe(a);
});

test('the trace never pushes the identity out of the first screen, and never overflows', async ({ page }) => {
  await page.goto('/');
  const vh = page.viewportSize()!.height;
  for (const sel of ['.home__name', '.home__line', '.home__avail']) {
    const box = await page.locator(sel).boundingBox();
    expect(box!.y + box!.height, sel).toBeLessThanOrEqual(vh);
  }
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('the trace script stays under 12 KB gzip', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { gzipSync } = await import('node:zlib');
  const files = readdirSync('dist/_astro').filter(f => f.endsWith('.js')).map(f => readFileSync(`dist/_astro/${f}`)).filter(b => b.includes('trace__pulse'));
  expect(files.length).toBeGreaterThan(0);
  for (const b of files) expect(gzipSync(b).length).toBeLessThan(12 * 1024);
});
```

- [ ] **Step 6: 跑测试确认失败**

Run: `npx playwright test tests/e2e/agent-trace.spec.ts`
Expected：FAIL，找不到 `[data-trace]`。

- [ ] **Step 7: 组件与驱动**

`src/components/AgentTrace.astro`：

```astro
---
import { traceNodes, edgePath, TRACE_VIEW, TRACE_ALPHA } from '../scripts/agent-trace';
import { SITE } from '../data/site';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const nodes = traceNodes(SITE.trace.length);
---
<div class="trace" aria-hidden="true" data-trace style={`--trace-alpha:${TRACE_ALPHA}`}>
  <svg viewBox={`0 0 ${TRACE_VIEW.w} ${TRACE_VIEW.h}`} preserveAspectRatio="xMaxYMid meet">
    {nodes.slice(1).map((b, i) => <path class="trace__edge" d={edgePath(nodes[i], b)} />)}
    {nodes.map((p, i) => (
      <g transform={`translate(${p.x} ${p.y})`}>
        <g class="trace__node">
          <rect x="-7" y="-7" width="14" height="14" />
          <text class="trace__label" y={i % 2 === 0 ? -18 : 30} text-anchor="middle">{SITE.trace[i][lang]}</text>
          <text class="trace__tick" x="13" y="5">✓</text>
        </g>
      </g>
    ))}
    <circle class="trace__pulse" r="4.5" cx={nodes[0].x} cy={nodes[0].y} />
  </svg>
</div>
<script>
  import { initAgentTrace } from '../scripts/agent-trace-dom';
  const root = document.querySelector<HTMLElement>('[data-trace]');
  if (root) initAgentTrace(root);
</script>
<style>
  .trace { position: absolute; z-index: 0; top: clamp(64px, 10vh, 120px); right: var(--gutter); width: min(42vw, 600px); pointer-events: none; }
  .trace svg { display: block; width: 100%; height: auto; overflow: visible; }
  .trace__edge { fill: none; stroke: var(--ink); stroke-opacity: var(--trace-alpha); stroke-width: 1.5; transition: stroke 0.4s var(--ease), stroke-opacity 0.4s var(--ease); }
  .trace__edge.is-lit { stroke: var(--red); stroke-opacity: 1; }
  .trace__node rect { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; transition: fill 0.3s var(--ease); }
  .trace__node.is-done rect { fill: var(--ink); }
  .trace__label { font: 500 13px/1 var(--font-body); fill: var(--mute); }
  .trace__tick { font: 700 13px/1 var(--font-display); fill: var(--red-text); opacity: 0; transition: opacity 0.3s var(--ease); }
  .trace__node.is-done .trace__tick { opacity: 1; }
  .trace__pulse { fill: var(--red); opacity: 0; }
  /* Phones: the diagram follows the text instead of sitting behind it. */
  @media (max-width: 800px) { .trace { position: static; order: 10; width: 100%; margin-top: 4px; } }
</style>
```

`src/scripts/agent-trace-dom.ts`：

```ts
import { traceNodes, pointOnEdge, pulseAt, periodFor } from './agent-trace';
import { currentTier } from './motion/tier';
import { frameCap } from './frame-cap';
import { magnetOffset, MOTION } from './motion/tokens';

/** Runs the home page's agent trace: a pulse crosses the edges and ticks each step. Pauses off screen and in hidden tabs. */
export function initAgentTrace(root: HTMLElement): void {
  const tier = currentTier();
  if (tier === 'off') { root.classList.add('is-static'); return; }
  const svg = root.querySelector<SVGSVGElement>('svg')!;
  const edges = [...svg.querySelectorAll<SVGPathElement>('.trace__edge')];
  const nodes = [...svg.querySelectorAll<SVGGElement>('.trace__node')];
  const pulse = svg.querySelector<SVGCircleElement>('.trace__pulse')!;
  const pts = traceNodes(nodes.length);
  const period = periodFor(tier);
  const cap = frameCap(tier === 'lite' ? 30 : 60);
  const start = performance.now();
  let raf = 0, onScreen = true;

  const draw = (now: number) => {
    raf = requestAnimationFrame(draw);
    if (!cap(now)) return;
    const s = pulseAt(now - start, period, pts.length);
    edges.forEach((e, i) => e.classList.toggle('is-lit', s.edge === -1 || i < s.edge || (tier === 'gentle' && i === s.edge)));
    nodes.forEach((n, i) => n.classList.toggle('is-done', i < s.done));
    if (tier !== 'gentle' && s.edge >= 0) {
      const p = pointOnEdge(pts[s.edge], pts[s.edge + 1], s.progress);
      pulse.setAttribute('cx', p.x.toFixed(1));
      pulse.setAttribute('cy', p.y.toFixed(1));
      pulse.style.opacity = '1';
    } else {
      pulse.style.opacity = '0';
    }
  };
  const run = () => { if (!raf && onScreen && document.visibilityState === 'visible') raf = requestAnimationFrame(draw); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) run(); else stop(); }).observe(root);
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? run() : stop()));
  run();

  // The nearest step leans towards a fine pointer, at most MOTION.magnetMax px (full tier only).
  if (tier !== 'full' || !matchMedia('(pointer: fine)').matches) return;
  const area = root.parentElement ?? root;
  area.addEventListener('pointermove', e => {
    const m = svg.getScreenCTM();
    if (!m) return;
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    let best = -1, bestD = 120;
    pts.forEach((p, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bestD) { best = i; bestD = d; } });
    nodes.forEach((n, i) => {
      const o = i === best ? magnetOffset(q.x - pts[i].x, q.y - pts[i].y, 4, MOTION.magnetMax) : { x: 0, y: 0 };
      n.style.transform = `translate(${o.x}px, ${o.y}px)`;
    });
  });
  area.addEventListener('pointerleave', () => nodes.forEach(n => { n.style.transform = ''; }));
}
```

`src/views/HomeView.astro`：import `AgentTrace`；在 `<header class="home__id wrap">` 内最前面加 `<AgentTrace lang={lang} />`；样式加：

```css
  .home__id { position: relative; }
  .home__id > :not(.trace) { position: relative; z-index: 1; }
  /* Keep the line clear of the diagram on wide screens: at 1440 px the line ends near 764 px and the diagram starts at 796 px. */
  @media (min-width: 801px) { .home__line { max-width: min(34em, 50vw); } }
```

- [ ] **Step 8: 跑测试**

Run: `npm test && npx playwright test tests/e2e/agent-trace.spec.ts tests/e2e/home.spec.ts tests/e2e/intro.spec.ts tests/e2e/a11y.spec.ts`
Expected：全部通过。

- [ ] **Step 9: 提交**

```bash
git add src/scripts/agent-trace.ts src/scripts/agent-trace-dom.ts src/components/AgentTrace.astro src/data/site.ts src/data/tokens.ts src/views/HomeView.astro tests/unit/agent-trace.test.ts tests/e2e/agent-trace.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Home: an agent run behind the name — input, rules, evidence, judgement, output — ticked by a travelling pulse

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 流式文字（首页一句话、概览一句话、项目导语）

**Files:**
- Create: `src/scripts/motion/stream.ts`、`src/scripts/motion/stream-dom.ts`、`src/components/StreamText.astro`、`tests/unit/stream.test.ts`、`tests/e2e/stream.spec.ts`
- Modify: `src/views/HomeView.astro`（`.home__line`）、`src/views/BriefView.astro`（`.b-id__line`）、`src/layouts/ProjectLayout.astro`（`.p-lead`）

**Interfaces:**
- Consumes：`anyMotion()`、`currentTier()`（Task 7）。
- Produces：`chunkText(text: string, size?: { han: number; words: number }): string[]`、`streamStep(tier: Tier): number`、`initStream(el: HTMLElement): void`。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/stream.test.ts`：

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/stream.test.ts`
Expected：FAIL，模块不存在。

- [ ] **Step 3: 实现**

`src/scripts/motion/stream.ts`：

```ts
import type { Tier } from './tier';

const TOKEN = /[A-Za-z0-9]+(?:['’.+\-][A-Za-z0-9]+)*%?|\p{Script=Han}|\s+|[^\s]/gu;
const HAN = /^\p{Script=Han}$/u;
const WORD = /^[A-Za-z0-9]/;
const STOP = /^[，。、；：！？,.;:!?）)」』]$/u;

/** Splits text into the pieces a language model would stream: up to `han` Chinese characters or `words` Latin words,
 *  breaking after punctuation. Joining the pieces gives back the text exactly. */
export function chunkText(text: string, size = { han: 3, words: 2 }): string[] {
  const chunks: string[] = [];
  let cur = '', h = 0, w = 0;
  const flush = () => { if (cur) chunks.push(cur); cur = ''; h = 0; w = 0; };
  for (const t of text.match(TOKEN) ?? []) {
    if (/^\s+$/.test(t)) { cur += t; if (w >= size.words) flush(); continue; }
    if (h >= size.han || w >= size.words) flush();
    cur += t;
    if (HAN.test(t)) h++;
    else if (WORD.test(t)) w++;
    if (STOP.test(t)) flush();
  }
  flush();
  return chunks;
}

/** Milliseconds between chunks. */
export function streamStep(tier: Tier): number {
  return tier === 'gentle' ? 70 : 45;
}
```

`src/scripts/motion/stream-dom.ts`：

```ts
import { chunkText, streamStep } from './stream';
import { anyMotion, currentTier } from './tier';

const coveredByIntro = () => {
  const c = document.documentElement.classList;
  return c.contains('intro-pending') || c.contains('intro-lock');
};

/** Streams the element's text in once it is on screen (after the intro, on the home page). The text node is replaced by
 *  spans holding the same characters, so wrapping and the accessible name do not change. */
export function initStream(el: HTMLElement): void {
  const text = el.textContent ?? '';
  const chunks = chunkText(text);
  if (!anyMotion() || !('IntersectionObserver' in window) || chunks.length < 2) { el.classList.add('is-on'); return; }
  const step = streamStep(currentTier());
  el.textContent = '';
  chunks.forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'stream__c';
    s.textContent = c;
    s.style.setProperty('--sd', `${i * step}ms`);
    el.append(s);
  });
  const caret = document.createElement('span');
  caret.className = 'stream__caret';
  caret.setAttribute('aria-hidden', 'true');
  el.append(caret);
  el.classList.add('is-armed');

  const play = () => {
    el.classList.add('is-on');
    setTimeout(() => caret.remove(), chunks.length * step + 900);
  };
  const whenUncovered = (go: () => void) => {
    if (!coveredByIntro()) { go(); return; }
    const mo = new MutationObserver(() => { if (!coveredByIntro()) { mo.disconnect(); go(); } });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  };
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    whenUncovered(play);
  }, { rootMargin: '0px 0px -8% 0px' });
  io.observe(el);
}
```

`src/components/StreamText.astro`：

```astro
---
interface Props { text: string }
const { text } = Astro.props;
---
<span class="stream" data-stream>{text}</span>
<script>
  import { initStream } from '../scripts/motion/stream-dom';
  for (const el of document.querySelectorAll<HTMLElement>('[data-stream]:not(.is-armed):not(.is-on)')) initStream(el);
</script>
<style>
  /* Held only while scripts may still arm it; html.motion-timeout (2.5 s) always lets it show. */
  :global(html.motion-ok:not(.motion-timeout)) .stream:not(.is-armed):not(.is-on) { opacity: 0; }
  .stream.is-armed :global(.stream__c) { opacity: 0; }
  .stream.is-armed.is-on :global(.stream__c) { opacity: 1; transition: opacity 0.35s var(--ease) var(--sd, 0ms); }
  :global(html.motion-timeout) .stream.is-armed:not(.is-on) :global(.stream__c) { opacity: 1; }
  .stream :global(.stream__caret)::after { content: '▍'; margin-left: 2px; color: var(--red); animation: stream-caret 0.9s steps(1) infinite; }
  @keyframes stream-caret { 50% { opacity: 0; } }
</style>
```

兜底规则保证文字最多被遮 2.5 秒。首页的问题是开场本身就要 2.4 秒，兜底会在开场刚结束时触发，流式效果就看不到了。所以让兜底从开场结束时重新计时：在 `src/scripts/intro-dom.ts` 的 `finish` 函数末尾（`html.classList.remove('intro-lock');` 之后）加两行：

```ts
    // The 2.5 s safety net restarts when the cover lifts, so the first screen's own motion is not cut short by the intro's time.
    html.classList.remove('motion-timeout');
    window.setTimeout(() => html.classList.add('motion-timeout'), 2500);
```

`finish` 只在开场真正播放后才会执行，所以没播开场的页面不受影响。

- [ ] **Step 4: 用到页面上**

- `src/views/HomeView.astro`：`<p class="home__line">{fact('F1').text[lang]}</p>` 改为 `<p class="home__line"><StreamText text={fact('F1').text[lang]} /></p>`，并 import `StreamText`。
- `src/views/BriefView.astro`：`.b-id__line` 同样改。
- `src/layouts/ProjectLayout.astro`：`<p class="p-lead">{motion ? <ScrollReveal text={lead[lang]} /> : lead[lang]}</p>` 改为 `<p class="p-lead">{motion ? <StreamText text={lead[lang]} /> : lead[lang]}</p>`，import `StreamText`（`ScrollReveal` 仍被别处使用的话保留 import，否则删除）。

- [ ] **Step 5: 写端到端测试**

`tests/e2e/stream.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { fact } from '../../src/data/facts';
import { skipIntro, motionOff } from './helpers';

test('the overview line streams in and keeps its exact text', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/brief/');
  const line = page.locator('.b-id__line [data-stream]');
  await expect(line).toHaveClass(/is-on/);
  await expect(line).toHaveText(fact('F1').text.zh);
  const chunks = line.locator('.stream__c');
  expect(await chunks.count()).toBeGreaterThan(5);
  await expect.poll(() => chunks.last().evaluate(el => getComputedStyle(el).opacity), { timeout: 4000 }).toBe('1');
});

test('on the home page the line waits for the intro', async ({ page }) => {
  await page.goto('/');
  const line = page.locator('.home__line [data-stream]');
  await expect(page.locator('[data-intro]')).toBeVisible();
  await expect(line).not.toHaveClass(/is-on/);
  await expect(line).toHaveClass(/is-on/, { timeout: 4000 });
});

test('motion off: plain text, no caret', async ({ page }) => {
  await skipIntro(page);
  await motionOff(page);
  await page.goto('/brief/');
  await expect(page.locator('.b-id__line .stream__c')).toHaveCount(0);
  await expect(page.locator('.b-id__line')).toHaveText(fact('F1').text.zh);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('without JavaScript the streamed lines are plain text', async ({ page }) => {
    await page.goto('/projects/ai-career/');
    expect(await page.locator('.p-lead').evaluate(el => getComputedStyle(el.querySelector('[data-stream]')!).opacity)).toBe('1');
  });
});
```

- [ ] **Step 6: 跑测试**

Run: `npm test && npx playwright test tests/e2e/stream.spec.ts tests/e2e/home.spec.ts tests/e2e/brief.spec.ts tests/e2e/motion-batch1.spec.ts tests/e2e/motion-batch2.spec.ts`
Expected：全部通过。若 `motion-batch1.spec.ts:42` 等断言"页面上存在 `.scroll-reveal`"失败，是因为导语已改用流式：那条断言改为检查 `[data-stream]` 存在。

- [ ] **Step 7: 提交**

```bash
git add src/scripts/motion/stream.ts src/scripts/motion/stream-dom.ts src/components/StreamText.astro src/views/HomeView.astro src/views/BriefView.astro src/layouts/ProjectLayout.astro src/scripts/intro-dom.ts tests/unit/stream.test.ts tests/e2e/stream.spec.ts
git add -u tests/e2e
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Lines stream in like model output: home, overview and project leads

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: （已并入 Task 4）

卡片描边与体积条已在 Task 4 完成。本编号保留，避免后续任务编号变动。

---

### Task 12: 阅读轨迹

**Files:**
- Create: `src/scripts/reading-rail.ts`、`src/components/ReadingRail.astro`、`tests/unit/reading-rail.test.ts`、`tests/e2e/reading-rail.spec.ts`
- Modify: `src/views/BriefView.astro`、`src/layouts/ProjectLayout.astro`、`src/data/site.ts`（`SITE.rail`）

**Interfaces:**
- Consumes：`anyMotion()`（Task 7）。
- Produces：`activeIndex(tops: number[], line: number): number`；DOM：`nav.rail[aria-label] > ol > li > a[aria-current]`、`.rail-bar`。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/reading-rail.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { activeIndex } from '../../src/scripts/reading-rail';

describe('activeIndex', () => {
  const tops = [100, 600, 1200];
  it('nothing before the first section reaches the reading line', () => expect(activeIndex(tops.map(t => t - 0), 50)).toBe(-1));
  it('the last section whose top has passed the line', () => {
    expect(activeIndex([-50, 300, 900], 360)).toBe(1);
    expect(activeIndex([-900, -300, 200], 360)).toBe(2);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/reading-rail.test.ts`
Expected：FAIL。

- [ ] **Step 3: 实现**

`src/scripts/reading-rail.ts`：

```ts
import { anyMotion } from './motion/tier';

/** Index of the section being read: the last one whose top is above the reading line (px from the viewport top). */
export function activeIndex(tops: number[], line: number): number {
  let i = -1;
  tops.forEach((t, k) => { if (t <= line) i = k; });
  return i;
}

/** Builds the rail from [data-rail] sections: a vertical trace with one node per section on wide screens,
 *  a thin progress bar on narrow ones. */
export function initReadingRail(nav: HTMLElement, bar: HTMLElement): void {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-rail]')];
  if (sections.length < 2) { nav.remove(); bar.remove(); return; }
  const list = nav.querySelector('ol')!;
  const links = sections.map((s, i) => {
    if (!s.id) s.id = `rail-${i + 1}`;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${s.id}`;
    a.textContent = s.dataset.rail || s.querySelector('h2')?.textContent?.trim() || '';
    li.append(a);
    list.append(li);
    return a;
  });
  nav.hidden = false;
  bar.hidden = false;
  let frame = 0;
  const update = () => {
    frame = 0;
    const i = activeIndex(sections.map(s => s.getBoundingClientRect().top), innerHeight * 0.4);
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    nav.style.setProperty('--progress', String(Math.max(0, i) / (links.length - 1)));
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  nav.classList.toggle('is-still', !anyMotion());
  update();
}
```

`src/data/site.ts` 中 `pager:` 之前加：

```ts
  rail: { label: { zh: '本页章节', en: 'On this page' } },
```

`src/components/ReadingRail.astro`：

```astro
---
import { SITE } from '../data/site';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
---
<nav class="rail" aria-label={SITE.rail.label[lang]} data-rail-nav hidden><ol></ol></nav>
<div class="rail-bar" aria-hidden="true" data-rail-bar hidden></div>
<script>
  import { initReadingRail } from '../scripts/reading-rail';
  const nav = document.querySelector<HTMLElement>('[data-rail-nav]');
  const bar = document.querySelector<HTMLElement>('[data-rail-bar]');
  if (nav && bar) initReadingRail(nav, bar);
</script>
<style>
  .rail { position: fixed; z-index: 20; left: max(8px, calc(var(--gutter) / 2 - 5px)); top: 50%; transform: translateY(-50%); }
  .rail ol { position: relative; display: grid; gap: 22px; margin: 0; padding: 0; list-style: none; }
  .rail ol::before, .rail ol::after { content: ''; position: absolute; left: 4px; top: 4px; bottom: 4px; width: 1.5px; }
  .rail ol::before { background: var(--ink); opacity: 0.25; }
  .rail ol::after { background: var(--red); transform: scaleY(var(--progress, 0)); transform-origin: top; transition: transform 0.4s var(--ease); }
  /* Each link is a 10 px node; its text (the section name) sits 22 px to the right, shown on hover and focus only. */
  .rail :global(a) { position: relative; display: block; width: 10px; height: 10px; overflow: visible; border: 1.5px solid var(--ink); background: var(--paper); color: transparent; font-size: 13px; line-height: 10px; white-space: nowrap; text-indent: 22px; text-decoration: none; transition: background-color 0.3s var(--ease), border-color 0.3s var(--ease), color 0.2s var(--ease); }
  .rail :global(a[aria-current]) { background: var(--red); border-color: var(--red); }
  .rail :global(a:hover), .rail :global(a:focus-visible) { color: var(--ink); }
  .rail.is-still ol::after, .rail.is-still :global(a) { transition: none; }
  .rail-bar { position: fixed; z-index: 20; left: 0; right: 0; top: 0; height: 2px; background: var(--red); transform: scaleX(0); transform-origin: left; }
  @media (min-width: 1200px) { .rail-bar { display: none; } }
  @media (max-width: 1199px) { .rail { display: none; } }
</style>
```

链接由脚本生成，所以选择器要用 `:global(a)` 才能命中 Astro 的作用域样式。

- [ ] **Step 4: 放到页面上**

- `src/views/BriefView.astro`：四个 `<section>` 各加 `data-rail`（值留空，由 `h2` 文字生成标签）；`<main>` 之后加 `<ReadingRail lang={lang} />`，并 import。
- `src/layouts/ProjectLayout.astro`：`<section class="p-summary …">` 加 `data-rail={S.heading[lang]}`；在 `<article class="prose wrap">` 之后、`<nav class="p-pager">` 之前加 `<ReadingRail lang={lang} />`；在组件脚本里，`initReadingRail` 之前把 `article.prose h2` 也标成章节——在 `src/scripts/reading-rail.ts` 的 `initReadingRail` 开头加：

```ts
  for (const h of document.querySelectorAll<HTMLElement>('article.prose h2')) h.dataset.rail ??= h.textContent?.trim() ?? '';
```

- [ ] **Step 5: 写端到端测试**

`tests/e2e/reading-rail.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, noHorizontalOverflow } from './helpers';

test.beforeEach(async ({ page }) => { await skipIntro(page); });

test('wide screens: one node per overview section, the current one marked', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop rail');
  await page.goto('/brief/');
  const rail = page.getByRole('navigation', { name: SITE.rail.label.zh });
  await expect(rail.locator('a')).toHaveCount(4);
  await page.locator('#b-edu').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 1));
  await expect(rail.locator('a[aria-current="true"]')).toHaveText(SITE.brief.education.zh);
  await rail.locator('a').nth(2).click();
  await expect(rail.locator('a').nth(2)).toHaveAttribute('aria-current', 'true');
});

test('narrow screens: a progress bar instead, no overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone');
  await page.goto('/brief/');
  await expect(page.locator('[data-rail-nav]')).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.locator('[data-rail-bar]').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0.9);
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('project pages list the summary and the prose headings', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop rail');
  await page.goto('/projects/ai-career/');
  const n = await page.locator('article.prose h2').count();
  await expect(page.locator('[data-rail-nav] a')).toHaveCount(n + 1);
});
```

- [ ] **Step 6: 跑测试**

Run: `npm test && npx playwright test tests/e2e/reading-rail.spec.ts tests/e2e/brief.spec.ts tests/e2e/a11y.spec.ts tests/e2e/layout.spec.ts`
Expected：全部通过。

- [ ] **Step 7: 提交**

```bash
git add src/scripts/reading-rail.ts src/components/ReadingRail.astro src/views/BriefView.astro src/layouts/ProjectLayout.astro src/data/site.ts tests/unit/reading-rail.test.ts tests/e2e/reading-rail.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Reading rail: a trace with a node per section on wide screens, a progress bar on phones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: 影像暗场"熄灯再亮"

**Files:**
- Create: `src/scripts/night-entry.ts`、`tests/e2e/night-entry.spec.ts`
- Modify: `src/layouts/Base.astro`（底部脚本）、`src/styles/base.css`

**Interfaces:**
- Consumes：`anyMotion()`（Task 7）。
- Produces：`initNightEntry(): void`；DOM：`.night-zone > .night-dim`。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/night-entry.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro, motionOff } from './helpers';

test('the film zone fades up from black as it scrolls in', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/projects/');
  const dim = page.locator('.i-film > .night-dim');
  await expect(dim).toHaveCount(1);
  expect(await dim.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.locator('.i-film').scrollIntoViewIfNeeded();
  await expect.poll(() => dim.evaluate(el => Number(getComputedStyle(el).opacity)), { timeout: 3000 }).toBe(0);
});

test('motion off: no dimmer at all', async ({ page }) => {
  await skipIntro(page);
  await motionOff(page);
  await page.goto('/projects/');
  await expect(page.locator('.night-dim')).toHaveCount(0);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx playwright test tests/e2e/night-entry.spec.ts`
Expected：FAIL，找不到 `.night-dim`。

- [ ] **Step 3: 实现**

`src/scripts/night-entry.ts`：

```ts
import { anyMotion } from './motion/tier';

/** Dark zones open like a cinema going dark and coming up: a black layer over the zone fades away once a quarter of it
 *  is on screen. Never a white flash; nothing is added when motion is off. */
export function initNightEntry(): void {
  if (!anyMotion() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-lit');
      io.unobserve(e.target);
    }
  }, { threshold: 0.25 });
  for (const zone of document.querySelectorAll<HTMLElement>('.night-zone')) {
    const dim = document.createElement('div');
    dim.className = 'night-dim';
    dim.setAttribute('aria-hidden', 'true');
    zone.classList.add('has-dim');
    zone.prepend(dim);
    io.observe(zone);
  }
}
```

`src/styles/base.css` 末尾加：

```css
/* Film zones come up from black (scripts/night-entry.ts). */
.night-zone.has-dim { position: relative; }
.night-dim { position: absolute; inset: 0; z-index: 5; background: var(--night); pointer-events: none; transition: opacity 0.9s var(--ease) 0.15s; }
.night-zone.is-lit > .night-dim { opacity: 0; }
```

`src/layouts/Base.astro` 底部脚本加：

```ts
      import { initNightEntry } from '../scripts/night-entry';
      initNightEntry();
```

- [ ] **Step 4: 跑测试**

Run: `npx playwright test tests/e2e/night-entry.spec.ts tests/e2e/projects-index.spec.ts tests/e2e/brief.spec.ts tests/e2e/film.spec.ts tests/e2e/reel.spec.ts`
Expected：全部通过。如果某个影像测试在暗场揭开前点击被遮挡（`.night-dim` 有 `pointer-events: none`，不应发生），检查 `z-index` 是否盖住了视频控件的焦点框，必要时把 `.night-dim` 的 `z-index` 降到 1。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/night-entry.ts src/styles/base.css src/layouts/Base.astro tests/e2e/night-entry.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Film zones come up from black like a cinema, never a white flash

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: 完整版预览截图

**Files:**
- Create: `tools/live-shots.mjs`、`src/components/LivePreview.astro`、`public/media/live-previews/{career,campus,quota}.jpg`、`public/media/live-previews/manifest.json`、`tests/e2e/live-preview.spec.ts`
- Modify: `package.json`（`scripts.live:shots`，不动依赖）、`src/views/LiveView.astro`、`src/data/site.ts`（`SITE.livePreview`）

**Interfaces:**
- Consumes：`EditionId`（`src/data/editions.ts`）。
- Produces：`manifest.json` 结构 `{ [id in 'career'|'campus'|'quota']: { file: string; w: number; h: number } }`。

- [ ] **Step 1: 截图脚本**

`tools/live-shots.mjs`：

```js
// npm run live:shots — builds the site, serves dist/ and captures each live edition once its real program is running.
// Output: public/media/live-previews/<id>.jpg and manifest.json (sizes for width/height attributes).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4398;
const OUT = 'public/media/live-previews';
const SHOTS = [
  { id: 'career', path: '/projects/ai-career/live/', stage: '#cl-stage', ready: async p => { await p.locator('#cl-chip.live').waitFor({ timeout: 90_000 }); await p.locator('#cl-score', { hasText: '84' }).waitFor({ timeout: 20_000 }); } },
  { id: 'campus', path: '/projects/ai-campus/live/', stage: '#cm-stage', ready: async p => { await p.locator('#cm-stage[data-state="done"]').waitFor({ timeout: 90_000 }); } },
  { id: 'quota', path: '/projects/quota-deck/live/', stage: '#qd-stage', ready: async p => { await p.locator('#qd-stage[data-state="running"]').waitFor({ timeout: 30_000 }); await p.waitForTimeout(3000); } },
];

if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true }).status !== 0) process.exit(1);
const server = spawn('node', ['tools/serve-dist.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const manifest = {};
try {
  for (const s of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => { try { localStorage.setItem('hyj-intro-seen', '1'); localStorage.setItem('hyj-motion', 'full'); } catch {} });
    await page.goto(`http://localhost:${PORT}${s.path}`);
    await page.locator(s.stage).scrollIntoViewIfNeeded();
    await s.ready(page);
    const stage = page.locator(s.stage);
    const box = await stage.boundingBox();
    await stage.screenshot({ path: `${OUT}/${s.id}.jpg`, type: 'jpeg', quality: 82 });
    manifest[s.id] = { file: `/media/live-previews/${s.id}.jpg`, w: Math.round(box.width), h: Math.round(box.height) };
    await page.close();
    console.log(`✓ ${s.id}`);
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
```

`package.json` 的 `scripts` 加一行：`"live:shots": "node tools/live-shots.mjs",`

- [ ] **Step 2: 生成截图**

Run: `npm run live:shots`
Expected：打印 `✓ career`、`✓ campus`、`✓ quota`，`public/media/live-previews/` 下有三张 JPEG 和 `manifest.json`。用 Read 工具打开三张图逐一目视检查：画面是运行完成后的真实界面，没有加载遮罩、没有报错。

- [ ] **Step 3: 写失败的端到端测试**

`tests/e2e/live-preview.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';

for (const [path, id] of [['/projects/ai-career/live/', 'career'], ['/projects/ai-campus/live/', 'campus'], ['/projects/quota-deck/live/', 'quota']] as const) {
  test(`${path} shows its preview before the live demo`, async ({ page }) => {
    await page.route('**/assets/vendor/pyodide/**', r => r.abort());      // the preview must not depend on the runtime
    await page.goto(path);
    const img = page.locator(`figure.live-preview img[src="/media/live-previews/${id}.jpg"]`);
    await expect(img).toBeVisible();
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(page.locator('figure.live-preview figcaption')).toHaveText(SITE.livePreview.caption.zh);
    const before = await page.evaluate(() => {
      const f = document.querySelector('figure.live-preview')!, d = document.querySelector('[data-demo]')!;
      return !!(f.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(before).toBe(true);
  });
}
```

Run: `npx playwright test tests/e2e/live-preview.spec.ts`
Expected：FAIL，找不到 `figure.live-preview`。

- [ ] **Step 4: 组件**

`src/data/site.ts` 中 `cards:` 之前加：

```ts
  livePreview: {
    caption: { zh: '预览截图：真实程序运行后的界面。下方是在你的浏览器里实时运行的版本。', en: 'Preview: the real program after it has run. The live version runs in your browser below.' },
    alt: { zh: '完整版运行后的界面截图', en: 'Screenshot of the live edition after it has run' },
  },
```

`src/components/LivePreview.astro`：

```astro
---
import { readFileSync } from 'node:fs';
import { SITE } from '../data/site';
import type { EditionId } from '../data/editions';
import type { Lang } from '../i18n';
interface Props { which: EditionId; lang: Lang }
const { which, lang } = Astro.props;
const shot = (JSON.parse(readFileSync('public/media/live-previews/manifest.json', 'utf8')) as Record<EditionId, { file: string; w: number; h: number }>)[which];
---
<figure class="live-preview wrap">
  <img src={shot.file} width={shot.w} height={shot.h} alt={SITE.livePreview.alt[lang]} decoding="async" />
  <figcaption>{SITE.livePreview.caption[lang]}</figcaption>
</figure>
<style>
  .live-preview { display: grid; gap: 10px; padding-block: 8px 28px; }
  .live-preview img { width: 100%; height: auto; border: var(--rule); }
  .live-preview figcaption { color: var(--mute); font-size: 13px; }
</style>
```

`src/views/LiveView.astro`：import `LivePreview`，在 `<Fragment slot="demo">` 的第一行加 `<LivePreview which={which} lang={lang} />`。

- [ ] **Step 5: 跑测试**

Run: `npx playwright test tests/e2e/live-preview.spec.ts tests/e2e/career-live.spec.ts tests/e2e/campus-live.spec.ts tests/e2e/quota-live.spec.ts tests/e2e/editions.spec.ts tests/e2e/numbers.spec.ts`
Expected：全部通过。

- [ ] **Step 6: 提交**

```bash
git add tools/live-shots.mjs package.json src/components/LivePreview.astro src/views/LiveView.astro src/data/site.ts public/media/live-previews tests/e2e/live-preview.spec.ts
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Live editions open with a screenshot of the real program, readable before the runtime arrives

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: 全量验证与交给用户确认

**Files:**
- Create: `docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md`、`tools/phase1-shots.mjs`（一次性检查截图，输出到被 git 忽略的 `test-results/phase1/`）

- [ ] **Step 1: 全量测试**

Run: `npm test && npm run e2e`
Expected：全部通过。记录通过数量（单元、端到端各多少）。任何失败都回到对应任务修，不跳过。

- [ ] **Step 2: 三档 × 两种宽度截图**

`tools/phase1-shots.mjs`：

```js
// One-off visual check for phase 1: every main page in each motion tier at desktop and phone width.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4397, OUT = 'test-results/phase1';
const PAGES = ['/', '/brief/', '/projects/', '/projects/ai-career/', '/projects/hris-workflow/', '/en/', '/en/projects/'];
const SIZES = [['desktop', 1440, 900], ['phone', 390, 844]];
const TIERS = ['full', 'gentle', 'off'];
if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true }).status !== 0) process.exit(1);
const server = spawn('node', ['tools/serve-dist.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
try {
  for (const [name, w, h] of SIZES) for (const tier of TIERS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: tier === 'gentle' ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(t => { try { localStorage.setItem('hyj-intro-seen', '1'); if (t === 'off') localStorage.setItem('hyj-motion', 'off'); } catch {} }, tier);
    for (const p of PAGES) {
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}${p}`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${OUT}/${name}-${tier}${p.replaceAll('/', '_') || '_'}.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); }
console.log(`screenshots in ${OUT}`);
```

Run: `node tools/phase1-shots.mjs`，然后用 Read 工具逐张查看（至少：首页三档 × 两种宽度、项目页 full 档两种宽度、概览 gentle 档桌面）。逐项确认：首屏轨迹在 full 档可见且不压字；gentle 档首屏轨迹线条可见；off 档一切静止但完整；手机宽度没有横向溢出、卡片按钮不换行错位；影像暗场在截图时已亮起。发现问题回到对应任务修。

- [ ] **Step 3: 整理待确认文案**

`docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md` 列出以下内容的中英原文（直接从代码复制，不改写），每条后面留"确认 / 修改为：___"：
1. F1 新的一句话介绍（`src/data/facts.ts`）。
2. 五个项目的「方案取舍」与求职 Agent 的「下一步」（`src/data/site.ts` 各 `summary.tradeoff` / `summary.next`）。
3. 主站卡片标题与简介中本期改写的两条：`hris-workflow`、`campus-delivery`（`SITE.projects`）。
4. 开场三个词与说明、首页标题与描述、项目页导语（`SITE.intro.words`、`SITE.pages.home`、`SITE.pages.projects.lead`）。

- [ ] **Step 4: 提交并交接**

```bash
git add docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md tools/phase1-shots.mjs
git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit -m "Phase 1: copy for the author's sign-off and the visual check script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

向用户汇报（不推送、不发布）：每个任务的提交哈希；`npm test` 与 `npm run e2e` 的通过数；与本计划不同的每一处改动及原因；待确认文案文件的路径；挑 6 张代表性截图直接打开给用户看。在共享记忆 `00-收件箱/` 新建一份记录：第一期完成状态、分支与提交、待确认事项。
