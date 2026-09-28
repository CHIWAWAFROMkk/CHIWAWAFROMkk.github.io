# 作品集重做 · 第一阶段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Astro 重建作品集的骨架，打通一条完整的中英双语阅读路径「首页（开场 + 身份 + 两扇门）→ 快速概览 → HRIS 项目页（含审核演示）→ 下载简历」，并通过第一阶段验收。

**Architecture:** 旧的静态站整体移入 `legacy/`，作为第二阶段的迁移来源，不再参与发布；需要保留原网址的文件（字体、`downloads/`）移入 `public/`。所有事实性表述放在 `src/data/facts.ts`，其余中英文短文字放在 `src/data/site.ts`；每个页面由一个带 `lang` 参数的视图组件渲染，`src/pages/` 与 `src/pages/en/` 下只放薄入口。浏览器脚本只有三段：开场、上滑入场、HRIS 演示，逻辑写成纯函数单独测试。

**Tech Stack:** Astro（静态输出）、TypeScript、Vitest（单元测试）、Playwright + Microsoft Edge 通道（端到端测试）、@axe-core/playwright（无障碍检查）、Edge headless（生成英文简历 PDF）。

**Spec:** `docs/superpowers/specs/2026-09-28-portfolio-redesign-design.md`（v2）

## Global Constraints

- 工作目录：`C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；所有命令都在这个目录下执行（PowerShell）。
- 提交身份：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit ...`；提交信息末尾加一行 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- **不推送、不部署、不改 GitHub 仓库设置**。第一阶段只在本地完成。
- 颜色：`--paper #f2f1ec`、`--ink #0f0f0f`、`--mute #6b6a64`、`--red #e8380d`、`--red-text #c4300a`、`--night #0a0908`、`--night-fg #ece4d6`、`--night-mute #a39c8f`；只在 `src/data/tokens.ts` 里定义。
- 正文文字对比度 ≥ 4.5:1；`--red` 只用于大字和色面（≥ 3:1）。
- 全部直角，不用阴影、毛玻璃、呼吸点；悬停只改变颜色、箭头位置和底色，**不改变元素尺寸和位置**。
- 缓动 `cubic-bezier(.2,.8,.2,1)`，时长 200–700ms；`prefers-reduced-motion: reduce` 时不播放任何动画。
- 开场：只在首次访问播放，DATA → AI → FILM，总长 ≤ 2.4 秒（`INTRO_MS = 2400`）；跳过方式是按钮和 Esc；localStorage 键名 `hyj-intro-seen`。
- 中文为默认语言，没有前缀；英文前缀 `/en/`；`trailingSlash: 'always'`。
- 页面上出现的每个数字都必须来自 `src/data/facts.ts`（例外只有序号 `01`/`02`、门上的 `1:00`、产品名 `Microsoft 365`、演示工号 `DEMO-00x`）。
- 英文文案与中文文案的事实完全一致；不得出现"单岗位耗时降低 70%"。
- 第一阶段不存在、要到第二阶段才建的页面：`/projects/`、`/projects/{campus-delivery,ai-career,quota-deck,ai-campus,stock-data,mais-je-taime}/`、`/privacy/`，以及它们的 `/en/` 版本。链接可以指向它们，链接检查会跳过。

## Review Focus

1. **localStorage 被禁用或读写抛错**（Safari 无痕模式、企业策略）：开场照常播放一次，首页可以正常使用，不报错 → 测试加在 Task 6（`storage blocked` 用例）。
2. **开场脚本加载失败或很慢**：首屏被开场的纸白遮罩盖住后，最多 3 秒必须露出首页，不能永久白屏 → 测试加在 Task 6（`module blocked` 用例，拦截脚本请求）。
3. **英文长文本在 390px 宽度下撑破布局**（门的标题、导航、项目行）：页面不能出现横向滚动 → 测试加在 Task 5 和 Task 11（`scrollWidth <= clientWidth`，中英两种语言）。
4. **在深层页面切换语言**：`/en/brief/` 切到中文应落在 `/brief/`，而不是首页；`/enrich/` 这类以 "en" 开头的路径不能被误判成英文 → 测试加在 Task 2（单元）和 Task 7（端到端，`language switch stays on the overview page`）。
5. **开场期间的键盘用户**：Tab、Enter、字母键不能误触发跳过；焦点不能跑到被遮住的页面上 → 测试加在 Task 6（`Tab and letters do not skip`，并检查页面 `inert`）。

---

## 文件结构

```
package.json / astro.config.mjs / tsconfig.json / vitest.config.ts / playwright.config.ts
legacy/                              旧站原样保留（第二阶段迁移来源，不参与构建）
public/
  favicon.svg  robots.txt
  assets/fonts.css  assets/fonts/*   字体（保留原网址）
  downloads/**                       原下载文件（保留原网址）
  downloads/resume/heyanjun-resume-{zh,en}.pdf
  media/mais-je-taime/{s04,s06,s16,s19-end}.webp
src/
  i18n.ts                            Lang、Bi、localizePath、stripLang、langFromPath
  data/tokens.ts                     颜色 + 对比度计算 + cssVars()
  data/facts.ts                      事实清单
  data/site.ts                       短文字、项目清单、各页文案
  styles/base.css                    全局基础样式
  layouts/Base.astro                 <html>、head、导航、页脚、overlay 插槽
  layouts/ProjectLayout.astro        项目页模板（标题区、五栏摘要、正文、上一个/下一个）
  components/Nav.astro LangSwitch.astro Footer.astro ContactBar.astro
  components/Gate.astro Intro.astro EvidenceRow.astro ProjectRow.astro FilmStrip.astro HrisDemo.astro
  views/HomeView.astro BriefView.astro HrisView.astro NotFoundView.astro
  pages/index.astro brief.astro 404.astro projects/hris-workflow.astro
  pages/en/index.astro en/brief.astro en/projects/hris-workflow.astro
  scripts/intro.ts intro-dom.ts rise.ts hris-demo.ts hris-demo-dom.ts
  copy/projects/hris-workflow.zh.md  hris-workflow.en.md
tools/resume-en.html  tools/print-resume.mjs
tests/unit/*.test.ts   tests/e2e/*.spec.ts   tests/e2e/helpers.ts
```

---

### Task 1: 旧站归档与 Astro 骨架

**Files:**
- Move: 根目录旧站文件 → `legacy/`；`assets/fonts*`、`assets/favicon.svg`、`downloads/`、`robots.txt` → `public/`
- Create: `package.json`、`astro.config.mjs`、`tsconfig.json`、`vitest.config.ts`、`playwright.config.ts`、`src/pages/index.astro`（临时首页，Task 5 替换）、`tests/e2e/smoke.spec.ts`
- Modify: `.gitignore`、`README.md`

**Interfaces:**
- Produces: `npm run build`、`npm test`、`npm run e2e` 三个命令；网址 `/assets/fonts.css`、`/assets/fonts/BarlowCondensed-Bold.ttf`、`/downloads/**`、`/favicon.svg`、`/media/mais-je-taime/*.webp`。

- [ ] **Step 1: 移动旧站文件**

```powershell
New-Item -ItemType Directory -Force legacy, public/assets, public/media/mais-je-taime | Out-Null
git mv index.html 404.html privacy projects sitemap.xml .nojekyll legacy/
git mv assets legacy/assets
git mv legacy/assets/fonts public/assets/fonts
git mv legacy/assets/fonts.css public/assets/fonts.css
git mv legacy/assets/favicon.svg public/favicon.svg
git mv downloads public/downloads
git mv robots.txt public/robots.txt
foreach ($s in 's04','s06','s16','s19-end') { Copy-Item "legacy/assets/mais-je-taime/$s.webp" "public/media/mais-je-taime/$s.webp" }
```

- [ ] **Step 2: 更新 `.gitignore`**

整个文件替换为：

```
.backup_pre_motion/
.DS_Store
Thumbs.db
node_modules/
dist/
.astro/
test-results/
playwright-report/
```

- [ ] **Step 3: 安装依赖**

```powershell
npm init -y | Out-Null
npm install --save-dev astro typescript vitest @playwright/test @axe-core/playwright
```

然后把 `package.json` 改成下面这样（保留 npm 写入的 `devDependencies` 版本号不动）：

```json
{
  "name": "heyanjun-portfolio",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --port 4321",
    "test": "vitest run",
    "e2e": "playwright test",
    "resume:en": "node tools/print-resume.mjs"
  },
  "devDependencies": { "...": "保留 npm install 写入的内容" }
}
```

- [ ] **Step 4: 写配置文件**

`astro.config.mjs`：

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chiwawafromkk.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
```

`tsconfig.json`：

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "legacy", "node_modules"]
}
```

`vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

`playwright.config.ts`：

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321', channel: 'msedge' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
```

- [ ] **Step 5: 临时首页**

`src/pages/index.astro`（Task 5 会整个替换）：

```astro
---
---
<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" /><title>何彦钧</title></head><body><h1>何彦钧</h1></body></html>
```

- [ ] **Step 6: 写失败的冒烟测试**

`tests/e2e/smoke.spec.ts`：

```ts
import { test, expect } from '@playwright/test';

test('site builds and legacy URLs survive', async ({ request }) => {
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  expect(await home.text()).toContain('何彦钧');
  for (const url of [
    '/assets/fonts.css',
    '/assets/fonts/BarlowCondensed-Bold.ttf',
    '/favicon.svg',
    '/media/mais-je-taime/s04.webp',
    encodeURI('/downloads/hris/HRIS方案.md'),
    '/downloads/delivery/init.sql',
  ]) {
    expect((await request.get(url)).status(), url).toBe(200);
  }
});
```

- [ ] **Step 7: 运行测试**

Run: `npx playwright test tests/e2e/smoke.spec.ts --project=desktop`
Expected: PASS（如果 Step 1 漏了文件，这里会报对应网址 404）。

- [ ] **Step 8: 更新 README**

`README.md` 整个替换为：

```markdown
# 何彦钧作品集

https://chiwawafromkk.github.io/

Astro 静态站。`legacy/` 是旧版静态站，只作迁移参考，不参与构建。

- 开发：`npm run dev`
- 单元测试：`npm test`
- 端到端测试：`npm run e2e`（使用本机 Microsoft Edge）
- 设计与计划：`docs/superpowers/`
```

- [ ] **Step 9: 提交**

```powershell
git add -A
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Scaffold Astro site and archive legacy static site" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 双语路径工具

**Files:**
- Create: `src/i18n.ts`、`tests/unit/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'zh' | 'en'`、`const LANGS: readonly Lang[]`、`type Bi = { zh: string; en: string }`
  - `localizePath(path: string, lang: Lang): string`
  - `stripLang(path: string): string`
  - `langFromPath(path: string): Lang`

- [ ] **Step 1: 写失败的测试**

`tests/unit/i18n.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { localizePath, stripLang, langFromPath } from '../../src/i18n';

describe('localizePath', () => {
  it.each([
    ['/', 'en', '/en/'],
    ['/', 'zh', '/'],
    ['/en/', 'zh', '/'],
    ['/en/', 'en', '/en/'],
    ['/brief/', 'en', '/en/brief/'],
    ['/en/brief/', 'zh', '/brief/'],
    ['/en/brief/', 'en', '/en/brief/'],
    ['/projects/hris-workflow/', 'en', '/en/projects/hris-workflow/'],
    ['/enrich/', 'en', '/en/enrich/'],
  ] as const)('%s → %s = %s', (path, lang, want) => {
    expect(localizePath(path, lang)).toBe(want);
  });
});

describe('stripLang / langFromPath', () => {
  it('only treats /en or /en/… as English', () => {
    expect(stripLang('/en')).toBe('/');
    expect(stripLang('/enrich/')).toBe('/enrich/');
    expect(langFromPath('/en/brief/')).toBe('en');
    expect(langFromPath('/en')).toBe('en');
    expect(langFromPath('/enrich/')).toBe('zh');
    expect(langFromPath('/')).toBe('zh');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: FAIL，报 "Failed to resolve import ../../src/i18n"

- [ ] **Step 3: 实现**

`src/i18n.ts`：

```ts
export const LANGS = ['zh', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export type Bi = { zh: string; en: string };

/** '/en/brief/' → '/brief/'; paths that merely start with "en" are left alone. */
export function stripLang(path: string): string {
  if (path === '/en' || path === '/en/') return '/';
  return path.startsWith('/en/') ? path.slice(3) : path;
}

export function langFromPath(path: string): Lang {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'zh';
}

/** Site-absolute page path in the given language. Chinese is unprefixed. */
export function localizePath(path: string, lang: Lang): string {
  const bare = stripLang(path);
  if (lang === 'zh') return bare;
  return bare === '/' ? '/en/' : `/en${bare}`;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```powershell
git add src/i18n.ts tests/unit/i18n.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add bilingual path helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 事实清单与站点文案

**Files:**
- Create: `src/data/facts.ts`、`src/data/site.ts`、`tests/unit/facts.test.ts`、`tests/unit/site.test.ts`、`tests/unit/digits.ts`
- Modify: `docs/superpowers/specs/2026-09-28-portfolio-redesign-design.md`（第 4 节：F8 措辞，新增 F11、F12）

**Interfaces:**
- Consumes: `Bi` from `src/i18n.ts`
- Produces:
  - `type FactId = 'F1' | … | 'F12'`；`interface Fact { id; text: Bi; figure?: string; scope: string; source: string; confirmed: string; public: boolean }`
  - `FACTS: Record<FactId, Fact>`、`fact(id: FactId): Fact`、`factCorpus(): string`
  - `SITE`（结构见 Step 5），`interface ProjectEntry { slug; line: 'data' | 'film'; inBrief: boolean; href; title: Bi; did: Bi; status: Bi }`
  - `tests/unit/digits.ts`：`digitTokens(text: string): string[]`、`ALLOWED_TOKENS`、`stripAllowed(text: string): string`（端到端测试也会用）

- [ ] **Step 1: 写失败的测试**

`tests/unit/digits.ts`：

```ts
/** Numbers that are UI ordinals or product names, not claims. */
export const ALLOWED_TOKENS = ['01', '02', '1:00'];
const ALLOWED_PATTERNS = [/Microsoft 365/g, /DEMO-\d+/g, /CET-6/g];

export function stripAllowed(text: string): string {
  let out = text;
  for (const re of ALLOWED_PATTERNS) out = out.replace(re, ' ');
  return out;
}

/** '2026.03—2026.06 · 4–5 天 · 12/23' → ['2026.03', '2026.06', '4–5', '12/23'] */
export function digitTokens(text: string): string[] {
  return (stripAllowed(text).match(/\d[\d,.:–/]*\d|\d/g) ?? []).filter(t => !ALLOWED_TOKENS.includes(t));
}
```

`tests/unit/facts.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { FACTS, fact, factCorpus } from '../../src/data/facts';

describe('fact ledger', () => {
  const all = Object.values(FACTS);

  it('has F1–F12 with matching ids', () => {
    expect(all.map(f => f.id)).toEqual(['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12']);
    for (const [k, f] of Object.entries(FACTS)) expect(f.id).toBe(k);
  });

  it('every fact is bilingual, sourced and dated', () => {
    for (const f of all) {
      expect(f.text.zh.trim(), f.id).not.toBe('');
      expect(f.text.en.trim(), f.id).not.toBe('');
      expect(f.source.trim(), f.id).not.toBe('');
      expect(f.confirmed, f.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps scale numbers paired with their meaning', () => {
    expect(fact('F6').text.zh).toContain('2000');
    expect(fact('F6').text.zh).toContain('6,000+');
    expect(fact('F8').text.zh).toMatch(/23.*12/);
    expect(fact('F8').text.en).toMatch(/23.*12/);
  });

  it('uses the confirmed availability', () => {
    expect(fact('F3').text.zh).toContain('每周 4–5 天');
    expect(fact('F3').text.en).toContain('4–5 days');
  });

  it('corpus contains every figure', () => {
    for (const f of all) if (f.figure) expect(factCorpus()).toContain(f.figure);
  });
});
```

`tests/unit/site.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { SITE } from '../../src/data/site';
import { factCorpus } from '../../src/data/facts';
import { digitTokens } from './digits';

const SKIP_KEYS = new Set(['email', 'resume', 'href', 'slug', 'src']);

function strings(node: unknown, key = ''): string[] {
  if (SKIP_KEYS.has(key)) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(n => strings(n));
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => strings(v, k));
  return [];
}

describe('SITE copy', () => {
  it('uses no number that is missing from the fact ledger', () => {
    const corpus = factCorpus();
    for (const s of strings(SITE)) for (const t of digitTokens(s)) expect(corpus, `"${t}" in "${s}"`).toContain(t);
  });

  it('every project is bilingual and links to /projects/<slug>/', () => {
    for (const p of SITE.projects) {
      expect(p.href).toBe(`/projects/${p.slug}/`);
      for (const k of ['title', 'did', 'status'] as const) {
        expect(p[k].zh.trim(), `${p.slug}.${k}.zh`).not.toBe('');
        expect(p[k].en.trim(), `${p.slug}.${k}.en`).not.toBe('');
      }
    }
  });

  it('brief lists five data projects and one film', () => {
    const inBrief = SITE.projects.filter(p => p.inBrief);
    expect(inBrief.filter(p => p.line === 'data')).toHaveLength(5);
    expect(inBrief.filter(p => p.line === 'film')).toHaveLength(1);
  });

  it('never claims the unsupported 70% metric', () => {
    expect(strings(SITE).join('\n')).not.toContain('70%');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/facts.test.ts tests/unit/site.test.ts`
Expected: FAIL，报 "Failed to resolve import ../../src/data/facts"

- [ ] **Step 3: 实现事实清单**

`src/data/facts.ts`：

```ts
import type { Bi } from '../i18n';

export type FactId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12';

export interface Fact {
  id: FactId;
  text: Bi;
  /** Numeral shown in display type, if any. Must also appear in text. */
  figure?: string;
  scope: string;
  source: string;
  /** YYYY-MM-DD */
  confirmed: string;
  public: boolean;
}

const RESUME = '《何彦钧_通用基准参考简历》2026-09-19';

export const FACTS: Record<FactId, Fact> = {
  F1: { id: 'F1', text: { zh: '从 HR 数据整理出发，探索 AI 在办公、个人工具和影像创作中的应用。', en: 'Starting from HR data work, I explore how AI fits into office workflows, personal tools and film-making.' }, scope: '自我介绍', source: '用户采纳（评审 v2）', confirmed: '2026-09-28', public: true },
  F2: { id: 'F2', text: { zh: '上海立信会计金融学院 · 行政管理本科 · 2027 届', en: 'Shanghai Lixin University of Accounting and Finance · BA in Public Administration · Class of 2027' }, scope: '教育', source: RESUME, confirmed: '2026-09-19', public: true },
  F3: { id: 'F3', text: { zh: '可立即到岗 · 每周 4–5 天 · 可连续实习 3 个月以上', en: 'Available now · 4–5 days a week · 3+ months' }, scope: '求职条件', source: '用户（本次对话）', confirmed: '2026-09-28', public: true },
  F4: { id: 'F4', text: { zh: '专业排名前 5%（获校级奖学金）', en: 'Top 5% of major (university scholarship)' }, scope: '教育；只出现在教育背景一行', source: RESUME, confirmed: '2026-09-19', public: true },
  F5: { id: 'F5', text: { zh: '丹纳赫（上海）企业管理有限公司 · HR 与人才数据实习生 · 2026.03—2026.06', en: 'Danaher (Shanghai) Enterprise Management Co., Ltd. · HR & Talent Data Intern · 2026.03—2026.06' }, scope: '实习；派遣单位为薪得付信息技术（上海）有限公司，派遣服务期至 2026.07，同一段实习', source: RESUME, confirmed: '2026-09-19', public: true },
  F6: { id: 'F6', figure: '2000', text: { zh: '核查约 2000 名员工的档案主数据 · 所在 CDP 系统覆盖 6,000+ 员工', en: 'Reviewed master records for about 2000 employees · in a CDP system covering 6,000+ staff' }, scope: '个人工作范围（约 2000 名）与系统规模（6,000+）分开写', source: '用户确认"约 2000 名员工"与"逾 2000 条关键字段"都成立', confirmed: '2026-09-28', public: true },
  F7: { id: 'F7', figure: '8', text: { zh: '8 张业务表', en: '8 business tables' }, scope: '课程设计的数据库规模，只出现在 SQL 项目', source: 'legacy/assets/delivery-schema.sql（8 条 CREATE TABLE）', confirmed: '2026-09-28', public: true },
  F8: { id: 'F8', figure: '12/23', text: { zh: '60 秒短片：计划 23 镜，已完成视频 12 镜', en: '60-second short: 23 shots planned, 12 rendered as video' }, scope: '制作进度，两个数字必须同时出现', source: 'legacy/projects/mais-je-taime/index.html（12/23）', confirmed: '2026-09-28', public: true },
  F9: { id: 'F9', text: { zh: '校级大学生创新创业项目一等奖（项目组长）', en: 'First Prize, university student innovation programme (team lead)' }, scope: '研究项目', source: RESUME, confirmed: '2026-09-19', public: true },
  F10: { id: 'F10', text: { zh: 'CET-6 550 分', en: 'CET-6: 550' }, scope: '教育', source: RESUME, confirmed: '2026-09-19', public: true },
  F11: { id: 'F11', text: { zh: '2026.08 至今', en: '2026.08 – present' }, scope: '求职 Agent 项目时间', source: RESUME, confirmed: '2026-09-19', public: true },
  F12: { id: 'F12', text: { zh: '2024.03—2024.07', en: '2024.03—2024.07' }, scope: 'AI 校园研究项目时间', source: RESUME, confirmed: '2026-09-19', public: true },
};

export function fact(id: FactId): Fact {
  return FACTS[id];
}

/** All fact text in both languages plus figures; used to police numbers on pages. */
export function factCorpus(): string {
  return Object.values(FACTS).flatMap(f => [f.text.zh, f.text.en, f.figure ?? '']).join('\n');
}
```

说明：F6 的英文写成 "2000" 而不是 "2,000"，与中文和大字保持同一个写法，数字检查因此只需要认一种形式。

- [ ] **Step 4: 实现站点文案**

`src/data/site.ts`：

```ts
import type { Bi } from '../i18n';

export interface ProjectEntry {
  slug: string;
  line: 'data' | 'film';
  inBrief: boolean;
  href: string;
  title: Bi;
  did: Bi;
  status: Bi;
}

const project = (p: Omit<ProjectEntry, 'href'>): ProjectEntry => ({ ...p, href: `/projects/${p.slug}/` });

export const SITE = {
  name: { zh: '何彦钧', en: 'Yanjun He' },
  tagline: { zh: '数据分析 · AI 应用 · AI 影像', en: 'Data · Applied AI · AI Film' },
  email: '2806660493@qq.com',
  resume: { zh: '/downloads/resume/heyanjun-resume-zh.pdf', en: '/downloads/resume/heyanjun-resume-en.pdf' },
  nav: {
    label: { zh: '主导航', en: 'Main' },
    skip: { zh: '跳到内容', en: 'Skip to content' },
    brief: { zh: '快速概览', en: 'Overview' },
    projects: { zh: '项目与演示', en: 'Projects & demos' },
    resume: { zh: '下载简历', en: 'Résumé (PDF)' },
    otherLang: { zh: 'English', en: '中文' },
  },
  gate: {
    label: { zh: '选择浏览方式', en: 'Choose how to browse' },
    brief: { index: '01', big: '1:00', href: '/brief/', title: { zh: '一分钟了解我', en: 'Know me in a minute' }, desc: { zh: '经历、项目、影像与联系方式', en: 'Experience, projects, film and contact' } },
    projects: { index: '02', big: 'ALL', href: '/projects/', title: { zh: '查看项目与演示', en: 'See projects & demos' }, desc: { zh: '过程与取舍、在线演示、源码下载', en: 'Process, live demos and source code' } },
  },
  intro: {
    skip: { zh: '跳过', en: 'Skip' },
    words: [
      { word: 'DATA', caption: { zh: 'HR 数据', en: 'HR data' } },
      { word: 'AI', caption: { zh: 'AI 应用', en: 'Applied AI' } },
      { word: 'FILM', caption: { zh: 'AI 影像', en: 'AI film' } },
    ],
  },
  contact: { heading: { zh: '聊聊？', en: "Let's talk." } },
  footer: { privacy: { zh: '隐私与使用说明', en: 'Privacy' } },
  brief: {
    experience: { zh: '经历', en: 'Experience' },
    education: { zh: '教育', en: 'Education' },
    projects: { zh: '项目', en: 'Projects' },
    film: { zh: '影像', en: 'Film' },
    status: { zh: '状态', en: 'Status' },
  },
  summaryLabels: {
    heading: { zh: '一分钟摘要', en: 'In one minute' },
    task: { zh: '任务', en: 'The task' },
    mine: { zh: '我的工作', en: 'What I did' },
    tools: { zh: '工具协作', en: 'Tools & AI' },
    evidence: { zh: '可查证成果', en: 'What you can check' },
    status: { zh: '当前状态', en: 'Status' },
  },
  pager: { label: { zh: '上一个 / 下一个项目', en: 'Previous / next project' } },
  film: {
    stills: [
      { src: '/media/mais-je-taime/s04.webp', alt: { zh: '黑白舞池中央展开的红裙', en: 'A red dress unfurling at the centre of a black-and-white dance floor' } },
      { src: '/media/mais-je-taime/s06.webp', alt: { zh: '雨夜伞下相依的两人背影', en: 'Two figures under one umbrella on a rainy night' } },
      { src: '/media/mais-je-taime/s16.webp', alt: { zh: '雨夜码头，风衣男人握枪而立', en: 'A man in a trench coat holding a gun on a rainy dock' } },
      { src: '/media/mais-je-taime/s19-end.webp', alt: { zh: '雨中摊开的掌心里放着一枚戒指', en: 'A ring resting in an open palm in the rain' } },
    ],
  },
  projects: [
    project({ slug: 'hris-workflow', line: 'data', inBrief: true,
      title: { zh: '员工电子档案补录', en: 'HR Records Backfill' },
      did: { zh: '核查约 2000 名员工的档案主数据，并把补录流程拆成可审核的工作流', en: 'Reviewed master records for about 2000 employees and turned the backfill into a reviewable workflow' },
      status: { zh: '实习任务已完成 · 企业流程为方案设计', en: 'Internship task done · enterprise flow is a design' } }),
    project({ slug: 'campus-delivery', line: 'data', inBrief: true,
      title: { zh: '校园外卖 SQL 工作台', en: 'Campus Delivery SQL Lab' },
      did: { zh: '独立完成的课程设计：8 张业务表、事务与复合外键，可在浏览器里直接运行', en: 'Solo course project: 8 business tables with transactions and composite keys, runnable in the browser' },
      status: { zh: '课程设计 · 可在线运行', en: 'Course project · runs online' } }),
    project({ slug: 'ai-career', line: 'data', inBrief: true,
      title: { zh: '个人求职 Agent', en: 'Personal Job Agent' },
      did: { zh: '借助 AI 编程工具开发的求职辅助工具，每条匹配判断都能追溯到事实证据', en: 'A job-search helper built with AI coding tools; every match traces back to a fact' },
      status: { zh: '个人项目 · 2026.08 至今', en: 'Personal project · 2026.08 – present' } }),
    project({ slug: 'quota-deck', line: 'data', inBrief: true,
      title: { zh: 'QuotaDeck', en: 'QuotaDeck' },
      did: { zh: '借助 AI 编程工具开发的桌面小工具，集中查看多家 AI 服务的额度', en: 'A desktop tool, built with AI coding tools, that shows AI service quotas in one place' },
      status: { zh: '个人项目 · MIT 开源', en: 'Personal project · MIT licensed' } }),
    project({ slug: 'ai-campus', line: 'data', inBrief: true,
      title: { zh: 'AI 校园应用研究', en: 'AI on Campus — Study' },
      did: { zh: '项目组长：设计问卷、清洗数据并做交叉统计，获校级大学生创新创业项目一等奖', en: 'Team lead: survey design, data cleaning and cross-tab analysis; First Prize, university student innovation programme' },
      status: { zh: '大创项目 · 2024.03—2024.07', en: 'Student research · 2024.03—2024.07' } }),
    project({ slug: 'stock-data', line: 'data', inBrief: false,
      title: { zh: 'CSV 数据分析工具', en: 'CSV Analysis Tool' },
      did: { zh: '上传表格即可检查缺失与重复、查看统计与分布', en: 'Upload a table to check gaps and duplicates and see its statistics' },
      status: { zh: '原型 · 构造样本', en: 'Prototype · synthetic sample' } }),
    project({ slug: 'mais-je-taime', line: 'film', inBrief: true,
      title: { zh: "Mais je t'aime", en: "Mais je t'aime" },
      did: { zh: 'AI 短片的分镜、人物与道具连续性设计，按 BGM 卡点', en: 'Storyboard, character and prop continuity for an AI short, cut to the beat' },
      status: { zh: '60 秒短片：计划 23 镜，已完成视频 12 镜 · 制作中', en: '60-second short: 23 shots planned, 12 rendered as video · in production' } }),
  ] satisfies ProjectEntry[],
  pages: {
    home: {
      title: { zh: '何彦钧 · 数据分析 · AI 应用 · AI 影像', en: 'Yanjun He · Data · Applied AI · AI Film' },
      description: { zh: '何彦钧的作品集：HR 数据实习、AI 工作流与工具项目、AI 短片分镜。可以一分钟了解，也可以查看项目过程与在线演示。', en: 'Portfolio of Yanjun He: HR data internship, AI workflow and tool projects, and an AI short-film storyboard. Take the one-minute overview or dig into the projects and live demos.' },
    },
    brief: {
      title: { zh: '快速概览 · 何彦钧', en: 'Overview · Yanjun He' },
      description: { zh: '一分钟了解何彦钧：到岗信息、实习经历、教育背景、项目与影像作品。', en: 'Yanjun He in one minute: availability, internship, education, projects and film work.' },
    },
    notFound: {
      title: { zh: '页面不存在', en: 'Page not found' },
      body: { zh: '这个页面不存在，或者还在制作中。', en: 'This page does not exist, or is still being built.' },
    },
    hris: {
      description: { zh: '员工电子档案补录：先确定员工再找档案，AI 只给候选，人工审核后写回。含虚构数据的审核流程演示。', en: 'HR records backfill: find the employee first, then the document; AI only proposes, a person approves the write-back. Includes a demo on fictional data.' },
      title: { zh: '员工电子档案补录', en: 'HR Records Backfill' },
      lead: { zh: '让每一份档案资料，都回到正确的员工名下。', en: 'Getting every document back to the right employee.' },
      tags: [
        { zh: '丹纳赫 HR 实习', en: 'Danaher HR internship' },
        { zh: '2026.03—2026.06', en: '2026.03—2026.06' },
        { zh: 'Excel · OpenClaw · Microsoft 365', en: 'Excel · OpenClaw · Microsoft 365' },
      ],
      summary: {
        task: { zh: '中国区 CDP 系统中不少员工档案字段缺失，需要从 PDF 与图片档案中补全地址、紧急联系人、学历等字段，而且每份资料都必须归到正确的员工名下。', en: 'Many employee records in the China CDP system had empty fields. Addresses, emergency contacts and education had to be filled in from PDF and image files, and every file had to land on the right employee.' },
        mine: { zh: '核查约 2000 名员工的档案主数据；负责资料下载、范围确认、字段核对、异常处理与结果复查；把补录需求拆成主名单、匹配优先级、字段提取、异常分类和审核写回五个部分。', en: 'Reviewed master records for about 2000 employees; handled downloading files, scoping each batch, checking fields, resolving exceptions and re-checking results; broke the backfill into five parts: master roster, match priority, field extraction, exception types and reviewed write-back.' },
        tools: { zh: '初版由我用 OpenClaw 调用 DeepSeek 与 GPT API 做字段提取（个人实践）；Excel 用于核对；企业版方案基于 Microsoft 365。模型只提供候选，写入由人工审核决定。', en: 'My first version used OpenClaw to call the DeepSeek and GPT APIs for field extraction (personal practice); Excel for checking; the enterprise design runs on Microsoft 365. The model only proposes values — a person decides what gets written.' },
        evidence: { zh: '本页的审核流程演示（虚构数据）；可下载的完整方案文档。公司真实资料不公开。', en: 'The review demo on this page (fictional data) and the downloadable full design document. No real company records are published.' },
        status: { zh: '实习任务已在离岗前完成；企业版流程为方案设计。', en: 'The internship task was completed before I left; the enterprise flow is a design.' },
      },
    },
  },
};
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx vitest run tests/unit/facts.test.ts tests/unit/site.test.ts`
Expected: PASS。如果 `uses no number…` 失败，说明某段文案里的数字不在事实清单中：修改文案或补事实，不要扩大 `ALLOWED_TOKENS`。

- [ ] **Step 6: 同步设计文档第 4 节**

在 `docs/superpowers/specs/2026-09-28-portfolio-redesign-design.md` 第 4 节的表格中：
- 把 F8 的表述改为「60 秒短片：计划 23 镜，已完成视频 12 镜」；
- 在 F10 之后追加两行：

```
| F11 求职 Agent 时间 | 2026.08 至今 | 项目时间 | 通用基准简历 | 2026-09-19 |
| F12 研究时间 | 2024.03—2024.07 | 项目时间 | 通用基准简历 | 2026-09-19 |
```

- [ ] **Step 7: 提交**

```powershell
git add src/data tests/unit docs/superpowers/specs
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add fact ledger and bilingual site copy" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 视觉系统、基础布局、导航与 404

**Files:**
- Create: `src/data/tokens.ts`、`src/styles/base.css`、`src/layouts/Base.astro`、`src/components/{Nav,LangSwitch,Footer,ContactBar}.astro`、`src/scripts/rise.ts`、`src/views/NotFoundView.astro`、`src/pages/404.astro`、`tests/unit/contrast.test.ts`、`tests/e2e/helpers.ts`、`tests/e2e/chrome.spec.ts`

**Interfaces:**
- Consumes: `localizePath`、`Lang`、`SITE`
- Produces:
  - `COLORS`、`contrast(a: string, b: string): number`、`cssVars(): string`
  - `<Base lang path title description nav? footer? intro? night?>`，带默认插槽和 `overlay` 具名插槽；页面内容包在 `<div class="page" id="page">` 里（开场会对它设 `inert`）
  - `<Nav lang path>`、`<LangSwitch lang path>`、`<Footer lang>`、`<ContactBar lang variant?: 'bar' | 'red'>`
  - 全局类名：`.wrap`、`.num`、`.label`、`.section-head`、`.night-zone`、`.sr`；属性 `data-rise`
  - `tests/e2e/helpers.ts`：`skipIntro(page)`、`noHorizontalOverflow(page)`、`PHASE1_PAGES`、`PHASE2_PENDING`

- [ ] **Step 1: 写失败的对比度测试**

`tests/unit/contrast.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { COLORS as C, contrast, cssVars } from '../../src/data/tokens';

describe('colour tokens', () => {
  it.each([
    ['ink on paper', C.ink, C.paper, 4.5],
    ['mute on paper', C.mute, C.paper, 4.5],
    ['white on redText', '#ffffff', C.redText, 4.5],
    ['paper on ink', C.paper, C.ink, 4.5],
    ['nightMute on ink', C.nightMute, C.ink, 4.5],
    ['nightFg on night', C.nightFg, C.night, 4.5],
    ['nightMute on night', C.nightMute, C.night, 4.5],
    ['red display type on paper', C.red, C.paper, 3],
    ['red display type on night', C.red, C.night, 3],
    ['redText focus ring on ink', C.redText, C.ink, 3],
  ])('%s ≥ %s', (_name, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('emits kebab-case custom properties', () => {
    expect(cssVars()).toContain('--red-text:#c4300a');
    expect(cssVars()).toContain('--night-fg:#ece4d6');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/contrast.test.ts`
Expected: FAIL，报 "Failed to resolve import ../../src/data/tokens"

- [ ] **Step 3: 实现颜色模块**

`src/data/tokens.ts`：

```ts
export const COLORS = {
  paper: '#f2f1ec',
  ink: '#0f0f0f',
  mute: '#6b6a64',
  red: '#e8380d',
  redText: '#c4300a',
  night: '#0a0908',
  nightFg: '#ece4d6',
  nightMute: '#a39c8f',
} as const;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 'paper:#f2f1ec;…' → '--paper:#f2f1ec;--red-text:#c4300a;…' for the <html> style attribute. */
export function cssVars(): string {
  return Object.entries(COLORS)
    .map(([k, v]) => `--${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
    .join(';');
}
```

- [ ] **Step 4: 运行对比度测试确认通过**

Run: `npx vitest run tests/unit/contrast.test.ts`
Expected: PASS。若某一对不达标，只调整 `COLORS` 里对应的值，并同步修改本计划 Global Constraints 与设计文档第 6 节。

- [ ] **Step 5: 全局样式**

`src/styles/base.css`：

```css
@font-face {
  font-family: 'Barlow';
  src: url('/assets/fonts/BarlowCondensed-Bold.ttf') format('truetype');
  font-weight: 700;
  font-display: swap;
}
:root {
  --rule: 1.5px solid var(--ink);
  --hair: 1px solid rgb(15 15 15 / 0.18);
  --ease: cubic-bezier(.2, .8, .2, 1);
  --font-display: 'Barlow', 'Arial Narrow', Impact, sans-serif;
  --font-cjk-bold: 'PingFang SC', 'Microsoft YaHei UI', 'Microsoft YaHei', sans-serif;
  --font-body: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei UI', sans-serif;
  --gutter: clamp(16px, 3vw, 44px);
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; background: var(--paper); }
body { margin: 0; background: var(--paper); color: var(--ink); font: 300 16px/1.75 var(--font-body); overflow-wrap: anywhere; }
body.night { background: var(--night); color: var(--night-fg); }
h1, h2, h3 { margin: 0; font-family: var(--font-cjk-bold); font-weight: 900; line-height: 1.15; letter-spacing: -0.01em; }
p, ul, ol, dl, dd { margin: 0; }
a { color: inherit; }
img { display: block; max-width: 100%; height: auto; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--red-text); outline-offset: 3px; }
.night :focus-visible, .night-zone :focus-visible { outline-color: var(--night-fg); }
.wrap { max-width: 1600px; margin-inline: auto; padding-inline: var(--gutter); }
.skip { position: absolute; left: 12px; top: -80px; z-index: 300; padding: 10px 14px; background: var(--ink); color: var(--paper); text-decoration: none; }
.skip:focus { top: 12px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.num { font: 700 clamp(72px, 11vw, 168px)/0.82 var(--font-display); letter-spacing: -0.01em; font-variant-numeric: lining-nums; }
.label { font: 700 12px/1 var(--font-display); letter-spacing: 0.24em; text-transform: uppercase; }
.section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding-block: 44px 14px; border-bottom: var(--rule); }
.section-head h2 { font-size: clamp(24px, 2.6vw, 36px); }
.night-zone { background: var(--night); color: var(--night-fg); }
.night-zone .section-head { border-bottom-color: var(--night-fg); }
html.intro-lock { overflow: hidden; }
[data-rise] { transition: opacity 0.6s var(--ease), transform 0.6s var(--ease); }
.rise-ready [data-rise]:not(.is-in) { opacity: 0; transform: translateY(24px); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 6: 上滑入场脚本**

`src/scripts/rise.ts`：

```ts
/** Adds .is-in once to each [data-rise] element as it enters the viewport. No-op without IO or with reduced motion. */
export function initRise(): void {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll<HTMLElement>('[data-rise]');
  if (!els.length) return;
  document.documentElement.classList.add('rise-ready');
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach(el => io.observe(el));
}
```

- [ ] **Step 7: 布局与导航组件**

`src/components/LangSwitch.astro`：

```astro
---
import { SITE } from '../data/site';
import { localizePath, type Lang } from '../i18n';
interface Props { lang: Lang; path: string }
const { lang, path } = Astro.props;
const other: Lang = lang === 'zh' ? 'en' : 'zh';
const tag = other === 'zh' ? 'zh-CN' : 'en';
---
<a class="lang" href={localizePath(path, other)} hreflang={tag} lang={tag}>{SITE.nav.otherLang[lang]}</a>
<style>
  .lang { display: inline-block; padding: 6px 12px; border: 1.5px solid currentColor; font: 700 13px/1 var(--font-cjk-bold); letter-spacing: 0.06em; text-decoration: none; white-space: nowrap; }
  .lang:hover { background: var(--ink); color: var(--paper); }
</style>
```

`src/components/Nav.astro`：

```astro
---
import { SITE } from '../data/site';
import { localizePath, type Lang } from '../i18n';
import LangSwitch from './LangSwitch.astro';
interface Props { lang: Lang; path: string }
const { lang, path } = Astro.props;
const L = (p: string) => localizePath(p, lang);
---
<header class="nav wrap">
  <a class="nav__brand" href={L('/')}>{SITE.name[lang]}</a>
  <nav class="nav__links" aria-label={SITE.nav.label[lang]}>
    <a href={L('/brief/')} aria-current={path === '/brief/' ? 'page' : undefined}>{SITE.nav.brief[lang]}</a>
    <a href={L('/projects/')} aria-current={path.startsWith('/projects/') ? 'page' : undefined}>{SITE.nav.projects[lang]}</a>
  </nav>
  <div class="nav__end">
    <LangSwitch lang={lang} path={path} />
    <a class="nav__resume" href={SITE.resume[lang]} download>{SITE.nav.resume[lang]}</a>
  </div>
</header>
<style>
  .nav { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 28px; padding-block: 14px; border-bottom: var(--rule); font-size: 14px; }
  .nav__brand { font: 900 18px/1 var(--font-cjk-bold); text-decoration: none; }
  .nav__links { display: flex; gap: 22px; }
  .nav__links a { text-decoration: none; font-weight: 500; }
  .nav__links a:hover, .nav__links a[aria-current='page'] { text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1.5px; }
  .nav__end { display: flex; align-items: center; gap: 12px; margin-left: auto; }
  .nav__resume { padding: 7px 14px; background: var(--red-text); color: #fff; font-weight: 700; text-decoration: none; white-space: nowrap; }
  .nav__resume:hover { background: var(--ink); }
  @media (max-width: 640px) {
    .nav__links { order: 3; width: 100%; }
  }
</style>
```

`src/components/ContactBar.astro`：

```astro
---
import { SITE } from '../data/site';
import type { Lang } from '../i18n';
interface Props { lang: Lang; variant?: 'bar' | 'red' }
const { lang, variant = 'bar' } = Astro.props;
---
<section class:list={['contact', `contact--${variant}`]} aria-label={SITE.contact.heading[lang]}>
  <div class="wrap contact__in">
    {variant === 'red' && <p class="contact__h">{SITE.contact.heading[lang]}</p>}
    <a class="contact__mail" href={`mailto:${SITE.email}`}>{SITE.email}</a>
    <a class="contact__cv" href={SITE.resume[lang]} download>{SITE.nav.resume[lang]} <span aria-hidden="true">↓</span></a>
  </div>
</section>
<style>
  .contact__in { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 12px 24px; }
  .contact--bar .contact__in { padding-block: 18px; font-size: 15px; }
  .contact--red { background: var(--red); color: var(--ink); }
  .contact--red .contact__in { padding-block: clamp(40px, 7vw, 88px); }
  .contact__h { width: 100%; font: 900 clamp(48px, 9vw, 128px)/0.9 var(--font-cjk-bold); letter-spacing: -0.04em; }
  .contact a { font-weight: 700; text-underline-offset: 5px; text-decoration-thickness: 1.5px; }
  .contact--red a { font-size: clamp(17px, 1.6vw, 22px); }
  .contact--red :focus-visible { outline-color: var(--ink); }
</style>
```

`src/components/Footer.astro`：

```astro
---
import { SITE } from '../data/site';
import { localizePath, type Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
---
<footer class="footer wrap">
  <p><strong>{SITE.name[lang]}</strong> · {SITE.tagline[lang]}</p>
  <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a> · <a href={localizePath('/privacy/', lang)}>{SITE.footer.privacy[lang]}</a></p>
</footer>
<style>
  .footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px; padding-block: 28px 40px; border-top: var(--rule); font-size: 13px; color: var(--mute); }
  :global(.night) .footer { color: var(--night-mute); border-top-color: var(--night-fg); }
</style>
```

`src/layouts/Base.astro`：

```astro
---
import '../styles/base.css';
import { cssVars } from '../data/tokens';
import { SITE } from '../data/site';
import { localizePath, type Lang } from '../i18n';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props {
  lang: Lang;
  /** Language-neutral page path, e.g. '/brief/'. */
  path: string;
  title: string;
  description: string;
  nav?: boolean;
  footer?: boolean;
  intro?: boolean;
  night?: boolean;
}
const { lang, path, title, description, nav = true, footer = true, intro = false, night = false } = Astro.props;
const origin = 'https://chiwawafromkk.github.io';
const canonical = origin + localizePath(path, lang);
---
<!doctype html>
<html lang={lang === 'zh' ? 'zh-CN' : 'en'} style={cssVars()} data-intro={intro ? 'on' : undefined}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hreflang="zh-CN" href={origin + localizePath(path, 'zh')} />
    <link rel="alternate" hreflang="en" href={origin + localizePath(path, 'en')} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta name="theme-color" content="#f2f1ec" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preload" href="/assets/fonts/BarlowCondensed-Bold.ttf" as="font" type="font/ttf" crossorigin />
    <link rel="stylesheet" href="/assets/fonts.css" />
    <slot name="head" />
  </head>
  <body class:list={[{ night }]}>
    <a class="skip" href="#main">{SITE.nav.skip[lang]}</a>
    <div class="page" id="page">
      {nav && <Nav lang={lang} path={path} />}
      <slot />
      {footer && <Footer lang={lang} />}
    </div>
    <slot name="overlay" />
    <script>
      import { initRise } from '../scripts/rise';
      initRise();
    </script>
  </body>
</html>
```

- [ ] **Step 8: 404 页**

`src/views/NotFoundView.astro`：

```astro
---
import Base from '../layouts/Base.astro';
import { SITE } from '../data/site';
const P = SITE.pages.notFound;
---
<Base lang="zh" path="/404/" title={`${P.title.zh} / ${P.title.en}`} description={P.body.zh}>
  <main id="main" class="nf wrap">
    <p class="num" aria-hidden="true">404</p>
    <h1>{P.title.zh} <span lang="en">/ {P.title.en}</span></h1>
    <p>{P.body.zh}</p>
    <p lang="en">{P.body.en}</p>
    <p class="nf__links"><a href="/">{SITE.name.zh}</a> · <a href="/en/" lang="en">{SITE.name.en}</a></p>
  </main>
</Base>
<style>
  .nf { display: grid; gap: 18px; padding-block: 12vh; }
  .nf h1 { font-size: clamp(28px, 4vw, 52px); }
</style>
```

`src/pages/404.astro`：

```astro
---
import NotFoundView from '../views/NotFoundView.astro';
---
<NotFoundView />
```

注意："404" 只出现在 404 页的装饰大字上，数字检查（Task 11）不覆盖 404 页。

- [ ] **Step 9: 端到端测试辅助与失败的测试**

`tests/e2e/helpers.ts`：

```ts
import type { Page } from '@playwright/test';

export const PHASE1_PAGES = ['/', '/brief/', '/projects/hris-workflow/', '/en/', '/en/brief/', '/en/projects/hris-workflow/'];

export const PHASE2_PENDING = new Set(
  ['/projects/', '/projects/campus-delivery/', '/projects/ai-career/', '/projects/quota-deck/', '/projects/ai-campus/', '/projects/stock-data/', '/projects/mais-je-taime/', '/privacy/']
    .flatMap(p => [p, `/en${p}`]),
);

/** Mark the intro as seen before any page script runs. */
export async function skipIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try { localStorage.setItem('hyj-intro-seen', '1'); } catch { /* storage blocked */ }
  });
}

export async function noHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}
```

`tests/e2e/chrome.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

test('404 page is bilingual and links home in both languages', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('页面不存在');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Page not found');
  await expect(page.locator('main a[href="/"]')).toBeVisible();
  await expect(page.locator('main a[href="/en/"]')).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('nav switches language to the same page', async ({ page }) => {
  await page.goto('/no-such-page/');
  const lang = page.locator('header.nav a.lang');
  await expect(lang).toHaveAttribute('href', '/en/404/');
  await expect(page.locator('header.nav a[href="/brief/"]')).toBeVisible();
  await expect(page.locator('header.nav a.nav__resume')).toHaveAttribute('href', '/downloads/resume/heyanjun-resume-zh.pdf');
});
```

- [ ] **Step 10: 运行测试**

Run: `npx vitest run; npx playwright test tests/e2e/chrome.spec.ts`
Expected: 单元测试全部 PASS；两个端到端用例在 desktop 和 mobile 下都 PASS。

- [ ] **Step 11: 提交**

```powershell
git add src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add visual tokens, base layout, nav and bilingual 404" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 首页（身份信息 + 两扇门 + 联系栏）

**Files:**
- Create: `src/components/Gate.astro`、`src/views/HomeView.astro`、`src/pages/en/index.astro`、`tests/e2e/home.spec.ts`
- Modify: `src/pages/index.astro`（整个替换 Task 1 的临时首页）

**Interfaces:**
- Consumes: `Base`、`LangSwitch`、`ContactBar`、`SITE.gate`、`fact('F1' | 'F2' | 'F3')`
- Produces: `<HomeView lang>`；类名 `.home__name`、`.home__line`、`.home__meta`、`.home__avail`、`a.door`、`a.door--ink`（Task 6、11 的测试会用到）

- [ ] **Step 1: 写失败的测试**

`tests/e2e/home.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro, noHorizontalOverflow } from './helpers';
import { fact } from '../../src/data/facts';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`home (${lang})`, () => {
    test.beforeEach(async ({ page }) => { await skipIntro(page); });

    test('identity is readable in the first viewport without clicking', async ({ page }) => {
      await page.goto(`${prefix}/`);
      const vh = page.viewportSize()!.height;
      for (const sel of ['.home__name', '.home__line', '.home__avail']) {
        const box = await page.locator(sel).boundingBox();
        expect(box, sel).not.toBeNull();
        expect(box!.y + box!.height, sel).toBeLessThanOrEqual(vh);
      }
      await expect(page.locator('.home__line')).toHaveText(fact('F1').text[lang]);
      await expect(page.locator('.home__avail')).toHaveText(fact('F3').text[lang]);
      await expect(page.locator('.contact a[href^="mailto:"]')).toBeVisible();
    });

    test('doors link to overview and projects', async ({ page }) => {
      await page.goto(`${prefix}/`);
      await expect(page.locator('a.door').nth(0)).toHaveAttribute('href', `${prefix}/brief/`);
      await expect(page.locator('a.door').nth(1)).toHaveAttribute('href', `${prefix}/projects/`);
    });

    test('hovering a door does not move or resize it', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'hover only');
      await page.goto(`${prefix}/`);
      const door = page.locator('a.door').nth(0);
      const before = await door.boundingBox();
      await door.hover();
      await page.waitForTimeout(400);
      expect(await door.boundingBox()).toEqual(before);
    });

    test('no horizontal overflow', async ({ page }) => {
      await page.goto(`${prefix}/`);
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  });
}

test.describe('home without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows identity and doors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home__name')).toBeVisible();
    await expect(page.locator('a.door')).toHaveCount(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx playwright test tests/e2e/home.spec.ts --project=desktop`
Expected: FAIL（临时首页没有 `.home__line`）

- [ ] **Step 3: 两扇门组件**

`src/components/Gate.astro`：

```astro
---
import { SITE } from '../data/site';
import { localizePath, type Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const doors = [SITE.gate.brief, SITE.gate.projects];
---
<nav class="gate" aria-label={SITE.gate.label[lang]}>
  {doors.map((d, i) => (
    <a class:list={['door', { 'door--ink': i === 1 }]} href={localizePath(d.href, lang)}>
      <span class="door__index">{d.index}</span>
      <span class="door__big" aria-hidden="true">{d.big}</span>
      <span class="door__title">{d.title[lang]}<span class="door__arrow" aria-hidden="true">→</span></span>
      <span class="door__desc">{d.desc[lang]}</span>
    </a>
  ))}
</nav>
<style>
  .gate { display: grid; grid-template-columns: 1fr 1fr; border-block: var(--rule); }
  .door { display: grid; grid-template-rows: auto 1fr auto auto; gap: 12px; min-height: clamp(260px, 40vh, 440px); padding: 28px var(--gutter) 32px; background: var(--paper); color: var(--ink); text-decoration: none; transition: background-color 0.25s var(--ease); }
  .door + .door { border-left: var(--rule); }
  .door--ink { background: var(--ink); color: var(--paper); }
  .door__index { font: 700 14px/1 var(--font-display); letter-spacing: 0.2em; }
  .door__big { align-self: end; font: 700 clamp(88px, 13vw, 200px)/0.8 var(--font-display); }
  .door__title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.4em; font: 900 clamp(22px, 2.4vw, 34px)/1.2 var(--font-cjk-bold); }
  .door__arrow { color: var(--red); transition: transform 0.3s var(--ease); }
  .door__desc { color: var(--mute); font-size: 15px; }
  .door--ink .door__desc { color: var(--night-mute); }
  .door:hover { background: #e6e5de; }
  .door--ink:hover { background: #222; }
  .door:hover .door__arrow, .door:focus-visible .door__arrow { transform: translateX(8px); }
  .door:focus-visible { outline-offset: -8px; }
  @media (max-width: 640px) {
    .gate { grid-template-columns: 1fr; }
    .door + .door { border-left: 0; border-top: var(--rule); }
    .door { min-height: 0; padding-block: 22px 26px; }
    .door__big { font-size: 88px; }
  }
</style>
```

- [ ] **Step 4: 首页视图与入口**

`src/views/HomeView.astro`：

```astro
---
import Base from '../layouts/Base.astro';
import LangSwitch from '../components/LangSwitch.astro';
import Gate from '../components/Gate.astro';
import ContactBar from '../components/ContactBar.astro';
import { SITE } from '../data/site';
import { fact } from '../data/facts';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const meta = SITE.pages.home;
---
<Base lang={lang} path="/" title={meta.title[lang]} description={meta.description[lang]} nav={false} footer={false}>
  <main id="main" class="home">
    <header class="home__id wrap">
      <div class="home__top">
        <h1 class="home__name">{SITE.name[lang]}</h1>
        <LangSwitch lang={lang} path="/" />
      </div>
      <p class="home__line">{fact('F1').text[lang]}</p>
      <p class="home__meta">{fact('F2').text[lang]}</p>
      <p class="home__avail">{fact('F3').text[lang]}</p>
    </header>
    <Gate lang={lang} />
  </main>
  <ContactBar lang={lang} />
</Base>
<style>
  .home__id { display: grid; gap: 10px; padding-block: clamp(20px, 4vh, 44px) clamp(24px, 4vh, 40px); }
  .home__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .home__name { font-size: clamp(56px, 9vw, 132px); line-height: 0.95; letter-spacing: -0.05em; }
  :global(html[lang='en']) .home__name { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.01em; text-transform: uppercase; }
  .home__line { max-width: 34em; font: 500 clamp(18px, 1.8vw, 26px)/1.5 var(--font-body); }
  .home__meta { color: var(--mute); font-size: 15px; }
  .home__avail { justify-self: start; padding: 4px 10px; background: var(--ink); color: var(--paper); font-weight: 500; font-size: 14px; }
</style>
```

`src/pages/index.astro`（整个替换）：

```astro
---
import HomeView from '../views/HomeView.astro';
---
<HomeView lang="zh" />
```

`src/pages/en/index.astro`：

```astro
---
import HomeView from '../../views/HomeView.astro';
---
<HomeView lang="en" />
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx playwright test tests/e2e/home.spec.ts tests/e2e/smoke.spec.ts`
Expected: desktop 和 mobile 全部 PASS。如果 mobile 下 `identity is readable…` 失败，就缩小 `.home__name` 在 640px 以下的字号或减少上下留白，直到三行都落在首屏内；不要删减内容。

- [ ] **Step 6: 提交**

```powershell
git add src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Build bilingual home with identity, doors and contact bar" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 开场动画

**Files:**
- Create: `src/scripts/intro.ts`、`src/scripts/intro-dom.ts`、`src/components/Intro.astro`、`tests/unit/intro.test.ts`、`tests/e2e/intro.spec.ts`
- Modify: `src/layouts/Base.astro`（`<head>` 中加入早期判断脚本）、`src/views/HomeView.astro`（开启 `intro`，挂载 `<Intro>`）

**Interfaces:**
- Consumes: `Base` 的 `intro` 属性和 `overlay` 插槽、`#page` 容器、`SITE.intro`
- Produces:
  - `SEEN_KEY = 'hyj-intro-seen'`、`INTRO_MS = 2400`、`FONT_WAIT_MS = 800`
  - `shouldPlayIntro(env: { seen: boolean; reducedMotion: boolean; fontsReady: boolean }): boolean`
  - `readSeen(storage: Pick<Storage, 'getItem'> | null): boolean`、`markSeen(storage: Pick<Storage, 'setItem'> | null): void`
  - `withTimeout(p: Promise<unknown>, ms: number): Promise<boolean>`
  - `initIntro(overlay: HTMLElement, page: HTMLElement): Promise<void>`
  - DOM：`.intro`（遮罩，默认 `hidden`）、`.intro.is-playing`、`[data-intro-skip]`、`html.intro-pending`

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/intro.test.ts`：

```ts
import { describe, it, expect, vi } from 'vitest';
import { shouldPlayIntro, readSeen, markSeen, withTimeout, SEEN_KEY } from '../../src/scripts/intro';

describe('shouldPlayIntro', () => {
  it('plays only on a first visit with motion allowed and fonts ready', () => {
    expect(shouldPlayIntro({ seen: false, reducedMotion: false, fontsReady: true })).toBe(true);
    expect(shouldPlayIntro({ seen: true, reducedMotion: false, fontsReady: true })).toBe(false);
    expect(shouldPlayIntro({ seen: false, reducedMotion: true, fontsReady: true })).toBe(false);
    expect(shouldPlayIntro({ seen: false, reducedMotion: false, fontsReady: false })).toBe(false);
  });
});

describe('storage helpers', () => {
  const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

  it('reads the seen flag', () => {
    expect(readSeen({ getItem: k => (k === SEEN_KEY ? '1' : null) })).toBe(true);
    expect(readSeen({ getItem: () => null })).toBe(false);
    expect(readSeen(null)).toBe(false);
  });

  it('treats blocked storage as a first visit and never throws', () => {
    expect(readSeen(throwing)).toBe(false);
    expect(() => markSeen(throwing)).not.toThrow();
    expect(() => markSeen(null)).not.toThrow();
  });
});

describe('withTimeout', () => {
  it('resolves true when the promise settles in time, false otherwise', async () => {
    vi.useFakeTimers();
    const fast = withTimeout(Promise.resolve(), 800);
    const slow = withTimeout(new Promise(() => {}), 800);
    const failing = withTimeout(Promise.reject(new Error('x')), 800);
    await vi.advanceTimersByTimeAsync(800);
    expect(await fast).toBe(true);
    expect(await slow).toBe(false);
    expect(await failing).toBe(false);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/intro.test.ts`
Expected: FAIL，报 "Failed to resolve import ../../src/scripts/intro"

- [ ] **Step 3: 实现纯逻辑**

`src/scripts/intro.ts`：

```ts
export const SEEN_KEY = 'hyj-intro-seen';
export const INTRO_MS = 2400;
export const FONT_WAIT_MS = 800;

export interface IntroEnv { seen: boolean; reducedMotion: boolean; fontsReady: boolean }

export function shouldPlayIntro(env: IntroEnv): boolean {
  return !env.seen && !env.reducedMotion && env.fontsReady;
}

export function readSeen(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSeen(storage: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(SEEN_KEY, '1');
  } catch {
    // Storage blocked: the next visit is treated as a first visit, which is acceptable.
  }
}

/** true if p settles successfully within ms. */
export function withTimeout(p: Promise<unknown>, ms: number): Promise<boolean> {
  return Promise.race([
    p.then(() => true, () => false),
    new Promise<boolean>(resolve => setTimeout(() => resolve(false), ms)),
  ]);
}
```

- [ ] **Step 4: 运行单元测试确认通过**

Run: `npx vitest run tests/unit/intro.test.ts`
Expected: PASS

- [ ] **Step 5: DOM 控制器**

`src/scripts/intro-dom.ts`：

```ts
import { FONT_WAIT_MS, INTRO_MS, markSeen, readSeen, shouldPlayIntro, withTimeout } from './intro';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function initIntro(overlay: HTMLElement, page: HTMLElement): Promise<void> {
  const html = document.documentElement;
  const store = storage();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = readSeen(store);
  const fontsReady = !seen && !reducedMotion && (await withTimeout(document.fonts.load('700 1em Barlow'), FONT_WAIT_MS));

  if (!shouldPlayIntro({ seen, reducedMotion, fontsReady })) {
    html.classList.remove('intro-pending');
    return;
  }

  markSeen(store);
  const skip = overlay.querySelector<HTMLButtonElement>('[data-intro-skip]');
  let timer = 0;

  const finish = () => {
    window.clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('is-playing');
    overlay.hidden = true;
    page.inert = false;
    html.classList.remove('intro-lock');
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') finish();
  };

  page.inert = true;
  html.classList.add('intro-lock');
  overlay.hidden = false;
  overlay.classList.add('is-playing');
  html.classList.remove('intro-pending');
  skip?.addEventListener('click', finish, { once: true });
  document.addEventListener('keydown', onKey);
  skip?.focus({ preventScroll: true });
  timer = window.setTimeout(finish, INTRO_MS);
}
```

- [ ] **Step 6: 开场组件**

`src/components/Intro.astro`：

```astro
---
import { SITE } from '../data/site';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
---
<div class="intro" hidden data-intro>
  <div class="intro__words" aria-hidden="true">
    {SITE.intro.words.map(w => (
      <div class="intro__word"><b>{w.word}</b><span>{w.caption[lang]}</span></div>
    ))}
  </div>
  <div class="intro__wipe" aria-hidden="true"></div>
  <button type="button" class="intro__skip" data-intro-skip>{SITE.intro.skip[lang]} <kbd>Esc</kbd></button>
</div>
<script>
  import { initIntro } from '../scripts/intro-dom';
  const overlay = document.querySelector<HTMLElement>('[data-intro]');
  const page = document.getElementById('page');
  if (overlay && page) void initIntro(overlay, page);
</script>
<style>
  .intro { position: fixed; inset: 0; z-index: 100; overflow: hidden; background: var(--paper); }
  :global(html.intro-pending) .intro, .intro.is-playing { display: block; }
  .intro__word { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; }
  .intro__word b { font: 700 min(38vw, 56vh)/0.8 var(--font-display); color: var(--ink); }
  .intro__word:nth-child(2) b { color: var(--red); }
  .intro__word span { margin-top: 3vh; font: 700 clamp(14px, 1.4vw, 20px)/1 var(--font-cjk-bold); letter-spacing: 0.3em; }
  .intro__wipe { position: absolute; inset: 0; background: var(--red); transform: scaleX(0); transform-origin: left; }
  .intro__skip { position: absolute; right: var(--gutter); bottom: 24px; z-index: 2; padding: 8px 14px; border: 1.5px solid var(--ink); background: var(--paper); font-weight: 700; cursor: pointer; }
  .intro__skip kbd { margin-left: 6px; font: 700 11px/1 var(--font-display); letter-spacing: 0.1em; }
  .is-playing { animation: intro-lift 0.5s 1.85s cubic-bezier(.7, 0, .2, 1) forwards; }
  .is-playing .intro__word:nth-child(1) { animation: intro-flash 0.5s 0.05s both; }
  .is-playing .intro__word:nth-child(2) { animation: intro-flash 0.5s 0.5s both; }
  .is-playing .intro__word:nth-child(3) { animation: intro-flash 0.5s 0.95s both; }
  .is-playing .intro__wipe { animation: intro-wipe 0.45s 1.4s cubic-bezier(.7, 0, .2, 1) forwards; }
  @keyframes intro-flash { 0% { opacity: 0; transform: scale(1.1); } 14% { opacity: 1; transform: none; } 82% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes intro-wipe { to { transform: scaleX(1); } }
  @keyframes intro-lift { to { transform: translateY(-100%); } }
</style>
```

- [ ] **Step 7: 早期判断脚本（防止首屏闪一下再盖上）**

在 `src/layouts/Base.astro` 的 `<slot name="head" />` 之前加入：

```astro
    {intro && (
      <script is:inline>
        (function () {
          var d = document.documentElement;
          try {
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (localStorage.getItem('hyj-intro-seen') === '1') return;
          } catch (e) { /* storage blocked: treat as first visit */ }
          d.classList.add('intro-pending');
          // Failsafe: never leave the page covered if the intro module fails to load.
          setTimeout(function () { d.classList.remove('intro-pending'); }, 3000);
        })();
      </script>
    )}
```

这里的键名 `hyj-intro-seen` 必须与 `SEEN_KEY` 一致；Step 9 的 `second visit` 用例会在两者不一致时失败。

- [ ] **Step 8: 首页挂载开场**

修改 `src/views/HomeView.astro`：
- frontmatter 增加 `import Intro from '../components/Intro.astro';`
- `<Base … nav={false} footer={false}>` 改为 `<Base … nav={false} footer={false} intro>`
- 在 `<ContactBar lang={lang} />` 之后、`</Base>` 之前加入 `<Intro slot="overlay" lang={lang} />`

- [ ] **Step 9: 写端到端测试**

`tests/e2e/intro.spec.ts`：

```ts
import { test, expect } from '@playwright/test';

const overlay = '[data-intro]';

test.describe('intro', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing checks run once on desktop');

  test('plays on first visit, then reveals the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('page')!.inert)).toBe(true);
    await expect(page.locator('[data-intro-skip]')).toBeFocused();
    await expect(page.locator(overlay)).toBeHidden({ timeout: 3500 });
    expect(await page.evaluate(() => document.getElementById('page')!.inert)).toBe(false);
  });

  test('Escape skips immediately', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('skip button skips', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-intro-skip]').click();
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('Tab and letters do not skip', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('a');
    await expect(page.locator(overlay)).toBeVisible();
  });

  test('second visit shows the page with no intro at all', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(false);
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('reduced motion: no intro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('storage blocked: intro still plays once and the page works', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 3500 });
    await expect(page.locator('a.door').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('module blocked: the page is uncovered within 3 seconds', async ({ page }) => {
    await page.route(/\.js($|\?)/, route => route.abort());
    await page.goto('/');
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(false);
    await expect(page.locator('a.door').first()).toBeVisible();
  });
});

test.describe('intro without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('overlay never shows', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });
});
```

- [ ] **Step 10: 运行测试**

Run: `npx vitest run; npx playwright test tests/e2e/intro.spec.ts tests/e2e/home.spec.ts`
Expected: 全部 PASS（`home.spec.ts` 用 `skipIntro`，不受开场影响）。

- [ ] **Step 11: 提交**

```powershell
git add src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add first-visit intro with Esc/skip, storage and load failsafes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 快速概览 `/brief/`

**Files:**
- Create: `src/components/EvidenceRow.astro`、`src/components/ProjectRow.astro`、`src/components/FilmStrip.astro`、`src/views/BriefView.astro`、`src/pages/brief.astro`、`src/pages/en/brief.astro`、`tests/e2e/brief.spec.ts`

**Interfaces:**
- Consumes: `Base`、`ContactBar variant="red"`、`fact()`、`FACTS`、`SITE.projects`、`SITE.film.stills`、`SITE.brief`
- Produces: `<EvidenceRow lang factId context?>`（大字带 `.num[data-fact]`，说明在 `.evidence__caption`）、`<ProjectRow lang project>`（`a.prow`）、`<FilmStrip lang>`

- [ ] **Step 1: 写失败的测试**

`tests/e2e/brief.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { FACTS, fact } from '../../src/data/facts';
import { SITE } from '../../src/data/site';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`brief (${lang})`, () => {
    test('who, availability, main experience and contact are all present', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.name[lang]);
      for (const id of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F8'] as const) {
        await expect(page.getByText(fact(id).text[lang], { exact: false }).first(), id).toBeVisible();
      }
      await expect(page.locator('.contact--red a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator(`.contact--red a[href="${SITE.resume[lang]}"]`)).toBeVisible();
    });

    test('every display number carries a ledger id and a caption', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      const nums = await page.locator('.num[data-fact]').evaluateAll(els =>
        els.map(el => ({ id: el.getAttribute('data-fact')!, text: el.textContent!.trim(), caption: el.closest('.evidence')?.querySelector('.evidence__caption')?.textContent?.trim() ?? '' })),
      );
      expect(nums.length).toBeGreaterThan(0);
      for (const n of nums) {
        expect(Object.keys(FACTS)).toContain(n.id);
        expect(FACTS[n.id as keyof typeof FACTS].figure).toBe(n.text);
        expect(n.caption.length, n.id).toBeGreaterThan(8);
      }
      expect(await page.locator('.num:not([data-fact])').count()).toBe(0);
    });

    test('language switch stays on the overview page', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      await expect(page.locator('header.nav a.lang')).toHaveAttribute('href', lang === 'en' ? '/brief/' : '/en/brief/');
    });

    test('project rows link to their deep pages', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      const hrefs = await page.locator('a.prow, a.b-film__row').evaluateAll(as => as.map(a => a.getAttribute('href')));
      const expected = SITE.projects.filter(p => p.inBrief).map(p => `${prefix}${p.href}`);
      expect(hrefs.sort()).toEqual(expected.sort());
    });

    test('film stills have alt text; layout does not overflow', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      const alts = await page.locator('.film img').evaluateAll(imgs => imgs.map(i => i.getAttribute('alt') ?? ''));
      expect(alts).toHaveLength(4);
      for (const a of alts) expect(a.length).toBeGreaterThan(3);
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  });
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx playwright test tests/e2e/brief.spec.ts --project=desktop`
Expected: FAIL（`/brief/` 返回 404）

- [ ] **Step 3: 组件**

`src/components/EvidenceRow.astro`：

```astro
---
import { fact, type FactId } from '../data/facts';
import type { Lang } from '../i18n';
interface Props { lang: Lang; factId: FactId; context?: FactId }
const { lang, factId, context } = Astro.props;
const f = fact(factId);
---
<div class="evidence" data-rise>
  <span class="num" data-fact={f.id}>{f.figure}</span>
  <div class="evidence__text">
    <p class="evidence__caption">{f.text[lang]}</p>
    {context && <p class="evidence__context">{fact(context).text[lang]}</p>}
  </div>
</div>
<style>
  .evidence { display: grid; grid-template-columns: auto 1fr; align-items: end; gap: 12px clamp(20px, 3vw, 48px); padding-block: 28px; }
  .num { color: var(--red); }
  .evidence__caption { font: 900 clamp(18px, 1.8vw, 26px)/1.4 var(--font-cjk-bold); }
  .evidence__context { margin-top: 6px; color: var(--mute); font-size: 15px; }
  @media (max-width: 640px) { .evidence { grid-template-columns: 1fr; } }
</style>
```

`src/components/ProjectRow.astro`：

```astro
---
import type { ProjectEntry } from '../data/site';
import { localizePath, type Lang } from '../i18n';
interface Props { lang: Lang; project: ProjectEntry; index: number }
const { lang, project, index } = Astro.props;
---
<a class="prow" href={localizePath(project.href, lang)}>
  <span class="prow__n">{String(index + 1).padStart(2, '0')}</span>
  <span class="prow__title">{project.title[lang]}</span>
  <span class="prow__did">{project.did[lang]}</span>
  <span class="prow__status">{project.status[lang]}</span>
  <span class="prow__arrow" aria-hidden="true">→</span>
</a>
<style>
  .prow { display: grid; grid-template-columns: 3ch minmax(10em, 1fr) 2fr minmax(9em, 1fr) 2ch; gap: 8px clamp(14px, 2vw, 32px); align-items: baseline; padding: 18px var(--gutter); border-bottom: var(--hair); text-decoration: none; transition: background-color 0.2s var(--ease), color 0.2s var(--ease); }
  .prow:hover { background: var(--ink); color: var(--paper); }
  .prow__n { font: 700 18px/1 var(--font-display); }
  .prow__title { font: 900 clamp(17px, 1.5vw, 22px)/1.3 var(--font-cjk-bold); }
  .prow__did { font-size: 15px; line-height: 1.6; }
  .prow__status { font-size: 13px; color: var(--mute); }
  .prow:hover .prow__status { color: var(--night-mute); }
  .prow__arrow { color: var(--red); }
  @media (max-width: 800px) {
    .prow { grid-template-columns: 3ch 1fr; }
    .prow__did, .prow__status { grid-column: 2; }
    .prow__arrow { display: none; }
  }
</style>
```

说明：序号 `01`–`05` 由组件生成，属于 `ALLOWED_TOKENS` 之外的序号；Task 11 的数字检查会把 `.prow__n` 排除（见 Task 11 Step 1 的 `EXCLUDE` 选择器）。

`src/components/FilmStrip.astro`：

```astro
---
import { SITE } from '../data/site';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
---
<ul class="film">
  {SITE.film.stills.map(s => (
    <li><img src={s.src} alt={s.alt[lang]} width="1200" height="675" loading="lazy" decoding="async" /></li>
  ))}
</ul>
<style>
  .film { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; padding: 0; list-style: none; }
  .film img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; filter: grayscale(1) contrast(1.05); transition: filter 0.5s var(--ease); }
  .film img:hover { filter: none; }
  @media (max-width: 640px) { .film { grid-template-columns: 1fr 1fr; } }
</style>
```

- [ ] **Step 4: 概览视图与入口**

`src/views/BriefView.astro`：

```astro
---
import Base from '../layouts/Base.astro';
import EvidenceRow from '../components/EvidenceRow.astro';
import ProjectRow from '../components/ProjectRow.astro';
import FilmStrip from '../components/FilmStrip.astro';
import ContactBar from '../components/ContactBar.astro';
import { SITE } from '../data/site';
import { fact } from '../data/facts';
import { localizePath, type Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const B = SITE.brief;
const meta = SITE.pages.brief;
const dataProjects = SITE.projects.filter(p => p.inBrief && p.line === 'data');
const film = SITE.projects.find(p => p.line === 'film')!;
---
<Base lang={lang} path="/brief/" title={meta.title[lang]} description={meta.description[lang]}>
  <main id="main">
    <header class="b-id wrap">
      <h1 class="b-id__name">{SITE.name[lang]}</h1>
      <div class="b-id__text">
        <p class="b-id__line">{fact('F1').text[lang]}</p>
        <p class="b-id__avail">{fact('F3').text[lang]}</p>
      </div>
    </header>

    <section class="wrap" aria-labelledby="b-exp">
      <div class="section-head"><h2 id="b-exp">{B.experience[lang]}</h2></div>
      <EvidenceRow lang={lang} factId="F6" context="F5" />
    </section>

    <section class="wrap" aria-labelledby="b-edu">
      <div class="section-head"><h2 id="b-edu">{B.education[lang]}</h2></div>
      <ul class="b-edu">
        <li>{fact('F2').text[lang]}</li>
        <li>{fact('F4').text[lang]}</li>
        <li>{fact('F10').text[lang]}</li>
      </ul>
    </section>

    <section aria-labelledby="b-proj">
      <div class="wrap"><div class="section-head"><h2 id="b-proj">{B.projects[lang]}</h2></div></div>
      {dataProjects.map((p, i) => <ProjectRow lang={lang} project={p} index={i} />)}
    </section>

    <section class="night-zone b-film" aria-labelledby="b-film">
      <div class="wrap"><div class="section-head"><h2 id="b-film">{B.film[lang]}</h2></div></div>
      <FilmStrip lang={lang} />
      <a class="b-film__row wrap" href={localizePath(film.href, lang)}>
        <span class="b-film__title">{film.title[lang]}</span>
        <span>{film.did[lang]}</span>
        <span class="b-film__status">{fact('F8').text[lang]}</span>
      </a>
    </section>
  </main>
  <ContactBar lang={lang} variant="red" />
</Base>
<style>
  .b-id { display: grid; grid-template-columns: auto 1fr; gap: 16px clamp(24px, 4vw, 64px); align-items: end; padding-block: clamp(32px, 6vh, 72px) 32px; }
  .b-id__name { font-size: clamp(64px, 11vw, 168px); line-height: 0.9; letter-spacing: -0.05em; }
  :global(html[lang='en']) .b-id__name { font-family: var(--font-display); font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; }
  .b-id__text { display: grid; gap: 12px; }
  .b-id__line { font: 500 clamp(17px, 1.6vw, 22px)/1.55 var(--font-body); }
  .b-id__avail { justify-self: start; padding: 4px 10px; background: var(--ink); color: var(--paper); font-weight: 500; font-size: 14px; }
  .b-edu { display: grid; gap: 6px; padding: 22px 0 8px; list-style: none; font-size: 16px; }
  .b-edu li:nth-child(2) { font-weight: 500; }
  .b-film { margin-top: 56px; padding-bottom: 8px; }
  .b-film__row { display: grid; grid-template-columns: minmax(10em, 1fr) 2fr minmax(12em, 1fr); gap: 8px 32px; align-items: baseline; padding-block: 22px 28px; text-decoration: none; }
  .b-film__row:hover .b-film__title { text-decoration: underline; text-underline-offset: 6px; }
  .b-film__title { font: 900 22px/1.3 var(--font-cjk-bold); }
  .b-film__status { color: var(--night-mute); font-size: 14px; }
  @media (max-width: 800px) {
    .b-id { grid-template-columns: 1fr; }
    .b-film__row { grid-template-columns: 1fr; }
  }
</style>
```

`src/pages/brief.astro`：

```astro
---
import BriefView from '../views/BriefView.astro';
---
<BriefView lang="zh" />
```

`src/pages/en/brief.astro`：

```astro
---
import BriefView from '../../views/BriefView.astro';
---
<BriefView lang="en" />
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx playwright test tests/e2e/brief.spec.ts`
Expected: desktop 和 mobile 全部 PASS。

- [ ] **Step 6: 提交**

```powershell
git add src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add bilingual quick overview with ledger-backed evidence" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: HRIS 审核演示的逻辑

**Files:**
- Create: `src/scripts/hris-demo.ts`、`tests/unit/hris-demo.test.ts`

**Interfaces:**
- Consumes: `Bi`
- Produces:
  - `type StepId = 'roster' | 'match' | 'identity' | 'extract' | 'review' | 'writeback'`
  - `type Outcome = 'done' | 'missing-file' | 'missing-field' | 'unreadable' | 'manual-review'`
  - `type StepState = 'passed' | 'stopped' | 'skipped'`
  - `interface DemoCase { id: string; name: Bi; situation: Bi; stopsAt: StepId; outcome: Outcome; result: Bi; next: Bi }`
  - `STEPS: { id: StepId; label: Bi }[]`、`CASES: DemoCase[]`、`OUTCOME_LABEL: Record<Outcome, Bi>`、`STATE_LABEL: Record<StepState, Bi>`、`DEMO_TEXT`
  - `trace(c: DemoCase): { id: StepId; state: StepState }[]`

- [ ] **Step 1: 写失败的测试**

`tests/unit/hris-demo.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { CASES, STEPS, OUTCOME_LABEL, trace } from '../../src/scripts/hris-demo';

describe('HRIS demo data', () => {
  it('has five fictional cases covering all five outcomes', () => {
    expect(CASES).toHaveLength(5);
    expect(new Set(CASES.map(c => c.outcome)).size).toBe(5);
    expect(new Set(CASES.map(c => c.id)).size).toBe(5);
    for (const c of CASES) expect(c.id).toMatch(/^DEMO-00\d$/);
  });

  it('is fully bilingual', () => {
    for (const c of CASES) for (const k of ['name', 'situation', 'result', 'next'] as const) {
      expect(c[k].zh.trim(), `${c.id}.${k}`).not.toBe('');
      expect(c[k].en.trim(), `${c.id}.${k}`).not.toBe('');
    }
    for (const o of Object.values(OUTCOME_LABEL)) expect(o.zh && o.en).toBeTruthy();
  });
});

describe('trace', () => {
  const byOutcome = (o: string) => CASES.find(c => c.outcome === o)!;

  it('a completed record passes every step', () => {
    expect(trace(byOutcome('done')).every(s => s.state === 'passed')).toBe(true);
  });

  it('a missing file stops at matching; later steps never run', () => {
    expect(trace(byOutcome('missing-file')).map(s => s.state)).toEqual(['passed', 'stopped', 'skipped', 'skipped', 'skipped', 'skipped']);
  });

  it('an ownership conflict stops at identity', () => {
    const t = trace(byOutcome('manual-review'));
    expect(t.find(s => s.state === 'stopped')?.id).toBe('identity');
  });

  it('every non-done case stops exactly once, at its stopsAt step', () => {
    for (const c of CASES.filter(x => x.outcome !== 'done')) {
      const stopped = trace(c).filter(s => s.state === 'stopped');
      expect(stopped.map(s => s.id), c.id).toEqual([c.stopsAt]);
    }
  });

  it('returns one entry per step in order', () => {
    for (const c of CASES) expect(trace(c).map(s => s.id)).toEqual(STEPS.map(s => s.id));
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/hris-demo.test.ts`
Expected: FAIL，报 "Failed to resolve import ../../src/scripts/hris-demo"

- [ ] **Step 3: 实现**

`src/scripts/hris-demo.ts`（数据全部取自旧版 HRIS 页的"一条候选，如何进入主表"和"四种结果"两节，均为虚构记录）：

```ts
import type { Bi } from '../i18n';

export type StepId = 'roster' | 'match' | 'identity' | 'extract' | 'review' | 'writeback';
export type Outcome = 'done' | 'missing-file' | 'missing-field' | 'unreadable' | 'manual-review';
export type StepState = 'passed' | 'stopped' | 'skipped';

export interface DemoCase { id: string; name: Bi; situation: Bi; stopsAt: StepId; outcome: Outcome; result: Bi; next: Bi }

export const STEPS: { id: StepId; label: Bi }[] = [
  { id: 'roster', label: { zh: '主名单', en: 'Roster' } },
  { id: 'match', label: { zh: '查找档案', en: 'Find file' } },
  { id: 'identity', label: { zh: '确认身份', en: 'Confirm identity' } },
  { id: 'extract', label: { zh: '提取候选', en: 'Extract candidates' } },
  { id: 'review', label: { zh: 'HR 审核', en: 'HR review' } },
  { id: 'writeback', label: { zh: '写回并核对', en: 'Write back & verify' } },
];

export const OUTCOME_LABEL: Record<Outcome, Bi> = {
  done: { zh: '已完成', en: 'Done' },
  'missing-file': { zh: '未找到电子档案', en: 'No file found' },
  'missing-field': { zh: '档案存在 · 信息缺失', en: 'File found · field missing' },
  unreadable: { zh: '档案存在 · 识别失败', en: 'File found · unreadable' },
  'manual-review': { zh: '处理状态：人工审核', en: 'Status: manual review' },
};

export const STATE_LABEL: Record<StepState, Bi> = {
  passed: { zh: '通过', en: 'passed' },
  stopped: { zh: '停在这里', en: 'stopped here' },
  skipped: { zh: '未进行', en: 'not reached' },
};

export const DEMO_TEXT = {
  title: { zh: '一条记录，怎样走完补录流程', en: 'How one record moves through the backfill' },
  badge: { zh: '模拟演示 · 全部为虚构数据', en: 'Simulated demo · fictional data only' },
  intro: { zh: '选一位虚构员工，看记录在哪一步通过、在哪一步停下，以及下一步交给谁。', en: 'Pick a fictional employee to see where the record passes, where it stops, and who acts next.' },
  casesLabel: { zh: '虚构员工', en: 'Fictional employees' },
  nextLabel: { zh: '下一步：', en: 'Next: ' },
};

export const CASES: DemoCase[] = [
  {
    id: 'DEMO-001', name: { zh: '员工甲', en: 'Employee A' }, stopsAt: 'writeback', outcome: 'done',
    situation: { zh: '主表里最高学历为空，紧急联系人关系已填"父亲"；档案第 2 页写着"最高学历：本科"，关系一栏写的是"母亲"。', en: 'In the master table, highest education is empty and the emergency-contact relation already says "father". Page 2 of the file says "highest education: bachelor" and gives the relation as "mother".' },
    result: { zh: '"本科"经 HR 确认后写入空白单元格并回读核对；关系字段与主表冲突，保留原值"父亲"，不因模型读到"母亲"就覆盖。', en: '"Bachelor" is written into the empty cell after HR confirms it, then read back. The relation conflicts with the master table, so the existing "father" stays — the model reading "mother" does not overwrite it.' },
    next: { zh: '冲突的关系字段单独交 HR 核对。', en: 'The conflicting relation goes to HR for a separate check.' },
  },
  {
    id: 'DEMO-002', name: { zh: '员工乙', en: 'Employee B' }, stopsAt: 'match', outcome: 'missing-file',
    situation: { zh: '按工号和姓名查找完成后，没有任何对应档案。', en: 'After searching by employee ID and name, no matching file exists.' },
    result: { zh: '进入无档案名单，不用"/"代替状态。', en: 'Goes on the no-file list; a "/" is never used in place of a status.' },
    next: { zh: '联系员工或区域 HR 补交资料。', en: 'Ask the employee or regional HR to submit the document.' },
  },
  {
    id: 'DEMO-003', name: { zh: '员工丙', en: 'Employee C' }, stopsAt: 'extract', outcome: 'missing-field',
    situation: { zh: '身份明确、资料清晰，但档案里没有填写教育结束时间。', en: 'Identity is clear and the file is legible, but it does not give an education end date.' },
    result: { zh: '记录具体缺失的字段，其他字段的候选照常进入审核。', en: 'The missing field is recorded by name; candidates for other fields still go to review.' },
    next: { zh: '定向补充这一个字段。', en: 'Request just that one field.' },
  },
  {
    id: 'DEMO-004', name: { zh: '员工丁', en: 'Employee D' }, stopsAt: 'extract', outcome: 'unreadable',
    situation: { zh: '身份明确，但电话号码所在区域扫描模糊。', en: 'Identity is clear, but the phone number area of the scan is blurred.' },
    result: { zh: '标明页码与识别问题，不猜电话号码。', en: 'The page and the problem are noted; the phone number is never guessed.' },
    next: { zh: '人工阅读原件或重新扫描。', en: 'A person reads the original, or it is rescanned.' },
  },
  {
    id: 'DEMO-005', name: { zh: '员工戊', en: 'Employee E' }, stopsAt: 'identity', outcome: 'manual-review',
    situation: { zh: '文件名里的姓名相同，但工号不一致。', en: 'The name in the file name matches, but the employee ID does not.' },
    result: { zh: '暂停补录，不强行归入无档案，也不写入任何字段。', en: 'The backfill pauses: the record is neither marked "no file" nor written to.' },
    next: { zh: '人工确认档案归属。', en: 'A person confirms who the file belongs to.' },
  },
];

export function trace(c: DemoCase): { id: StepId; state: StepState }[] {
  const stop = STEPS.findIndex(s => s.id === c.stopsAt);
  return STEPS.map((s, i) => ({
    id: s.id,
    state: i < stop ? 'passed' : i === stop ? (c.outcome === 'done' ? 'passed' : 'stopped') : 'skipped',
  }));
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/hris-demo.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```powershell
git add src/scripts/hris-demo.ts tests/unit/hris-demo.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add HRIS review demo model with five fictional cases" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 项目页模板与 HRIS 项目页

**Files:**
- Create: `src/layouts/ProjectLayout.astro`、`src/components/HrisDemo.astro`、`src/scripts/hris-demo-dom.ts`、`src/copy/projects/hris-workflow.zh.md`、`src/copy/projects/hris-workflow.en.md`、`src/views/HrisView.astro`、`src/pages/projects/hris-workflow.astro`、`src/pages/en/projects/hris-workflow.astro`、`tests/e2e/hris.spec.ts`
- Modify: `public/downloads/hris/HRIS方案.md` 第 4 行

**Interfaces:**
- Consumes: `Base`、`SITE.pages.hris`、`SITE.summaryLabels`、`SITE.projects`、`CASES`、`STEPS`、`OUTCOME_LABEL`、`STATE_LABEL`、`DEMO_TEXT`、`trace`
- Produces: `<ProjectLayout lang slug title lead tags summary description>`，具名插槽 `demo`，默认插槽放正文；DOM：`.p-summary dt`（五个）、`[data-demo]`、`[data-case]`、`[data-step][data-state]`、`[data-outcome]`

- [ ] **Step 1: 写失败的测试**

`tests/e2e/hris.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { CASES, OUTCOME_LABEL, DEMO_TEXT } from '../../src/scripts/hris-demo';
import { fact } from '../../src/data/facts';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`HRIS page (${lang})`, () => {
    test.beforeEach(async ({ page }) => { await page.goto(`${prefix}/projects/hris-workflow/`); });

    test('five-part summary is present', async ({ page }) => {
      await expect(page.locator('.p-summary dt')).toHaveCount(5);
    });

    test('states personal scope with the ledger wording and never the old 6000 framing', async ({ page }) => {
      await expect(page.getByText('about 2000 employees', { exact: false }).or(page.getByText('约 2000 名员工', { exact: false })).first()).toBeVisible();
      const body = await page.locator('main').innerText();
      expect(body).not.toContain('约 6000 名员工的档案维护');
      expect(body).toContain(fact('F5').text[lang].split(' · ')[2]);
    });

    test('demo is labelled as simulated and every case reaches its outcome', async ({ page }) => {
      await expect(page.getByText(DEMO_TEXT.badge[lang])).toBeVisible();
      for (const c of CASES) {
        await page.locator(`[data-case="${c.id}"]`).click();
        await expect(page.locator('[data-outcome]')).toHaveText(OUTCOME_LABEL[c.outcome][lang]);
        await expect(page.locator(`[data-case="${c.id}"]`)).toHaveAttribute('aria-pressed', 'true');
        const stopped = await page.locator('[data-step][data-state="stopped"]').count();
        expect(stopped, c.id).toBe(c.outcome === 'done' ? 0 : 1);
      }
    });

    test('links to the downloadable design and does not overflow', async ({ page }) => {
      await expect(page.locator(`a[href="${encodeURI('/downloads/hris/HRIS方案.md')}"], a[href="/downloads/hris/HRIS方案.md"]`).first()).toBeVisible();
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  });
}

test.describe('HRIS demo without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows the first case statically', async ({ page }) => {
    await page.goto('/projects/hris-workflow/');
    await expect(page.locator('[data-outcome]')).toHaveText(OUTCOME_LABEL[CASES[0].outcome].zh);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx playwright test tests/e2e/hris.spec.ts --project=desktop`
Expected: FAIL（页面 404）

- [ ] **Step 3: 项目页模板**

`src/layouts/ProjectLayout.astro`：

```astro
---
import Base from './Base.astro';
import { SITE } from '../data/site';
import { localizePath, type Lang, type Bi } from '../i18n';

export interface Summary { task: Bi; mine: Bi; tools: Bi; evidence: Bi; status: Bi }
interface Props { lang: Lang; slug: string; title: Bi; lead: Bi; tags: Bi[]; summary: Summary; description: Bi }
const { lang, slug, title, lead, tags, summary, description } = Astro.props;
const path = `/projects/${slug}/`;
const order = SITE.projects;
const i = order.findIndex(p => p.slug === slug);
const prev = i > 0 ? order[i - 1] : undefined;
const next = i >= 0 && i < order.length - 1 ? order[i + 1] : undefined;
const S = SITE.summaryLabels;
const rows: [Bi, Bi][] = [[S.task, summary.task], [S.mine, summary.mine], [S.tools, summary.tools], [S.evidence, summary.evidence], [S.status, summary.status]];
---
<Base lang={lang} path={path} title={`${title[lang]} · ${SITE.name[lang]}`} description={description[lang]}>
  <main id="main">
    <header class="p-head wrap">
      <ul class="p-tags">{tags.map(t => <li>{t[lang]}</li>)}</ul>
      <h1 class="p-title">{title[lang]}</h1>
      <p class="p-lead">{lead[lang]}</p>
    </header>
    <section class="p-summary wrap" aria-labelledby="p-summary-h">
      <h2 id="p-summary-h" class="label">{S.heading[lang]}</h2>
      <dl>{rows.map(([k, v]) => <div class="p-row"><dt>{k[lang]}</dt><dd>{v[lang]}</dd></div>)}</dl>
    </section>
    <slot name="demo" />
    <article class="prose wrap"><slot /></article>
    <nav class="p-pager wrap" aria-label={SITE.pager.label[lang]}>
      {prev ? <a href={localizePath(prev.href, lang)}>← {prev.title[lang]}</a> : <span></span>}
      {next && <a href={localizePath(next.href, lang)}>{next.title[lang]} →</a>}
    </nav>
  </main>
</Base>
<style>
  .p-head { display: grid; gap: 18px; padding-block: clamp(32px, 6vh, 72px) 36px; border-bottom: var(--rule); }
  .p-tags { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; }
  .p-tags li { padding: 3px 10px; border: 1.5px solid var(--ink); font-size: 13px; font-weight: 500; }
  .p-title { font-size: clamp(44px, 7.5vw, 112px); line-height: 0.95; letter-spacing: -0.04em; }
  .p-lead { max-width: 30em; font: 500 clamp(18px, 1.7vw, 24px)/1.5 var(--font-body); }
  .p-summary { padding-block: 36px 48px; }
  .p-summary .label { margin-bottom: 16px; color: var(--red-text); }
  .p-row { display: grid; grid-template-columns: minmax(7em, 14em) 1fr; gap: 8px 32px; padding-block: 14px; border-top: var(--hair); }
  .p-row dt { font: 900 16px/1.6 var(--font-cjk-bold); }
  .p-row dd { max-width: 48em; }
  .prose { max-width: 1600px; padding-block: 24px 64px; }
  .prose :global(h2) { margin: 56px 0 16px; padding-bottom: 12px; border-bottom: var(--rule); font-size: clamp(24px, 2.6vw, 36px); }
  .prose :global(h3) { margin: 28px 0 8px; font-size: 19px; }
  .prose :global(p), .prose :global(ul), .prose :global(ol) { max-width: 46em; margin-bottom: 14px; }
  .prose :global(li) { margin-bottom: 8px; }
  .prose :global(strong) { font-weight: 500; }
  .prose :global(table) { display: block; overflow-x: auto; width: 100%; margin: 20px 0; border-collapse: collapse; font-size: 15px; }
  .prose :global(th), .prose :global(td) { padding: 10px 14px; border-bottom: var(--hair); text-align: left; vertical-align: top; min-width: 9em; }
  .prose :global(th) { border-bottom: var(--rule); font-weight: 500; }
  .p-pager { display: flex; justify-content: space-between; gap: 16px; padding-block: 28px; border-top: var(--rule); font-weight: 500; }
  .p-pager a { text-decoration: none; }
  .p-pager a:hover { text-decoration: underline; text-underline-offset: 6px; }
  @media (max-width: 640px) { .p-row { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 4: 演示组件与交互脚本**

`src/scripts/hris-demo-dom.ts`：

```ts
import { CASES, DEMO_TEXT, OUTCOME_LABEL, STATE_LABEL, trace } from './hris-demo';

export function bindDemo(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-case]')];
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const set = (sel: string, text: string) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  };

  const show = (id: string) => {
    const c = CASES.find(x => x.id === id);
    if (!c) return;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.case === id));
    set('[data-situation]', c.situation[lang]);
    trace(c).forEach((s, i) => {
      const li = steps[i];
      if (!li) return;
      li.dataset.state = s.state;
      const sr = li.querySelector('.sr');
      if (sr) sr.textContent = STATE_LABEL[s.state][lang];
    });
    set('[data-outcome]', OUTCOME_LABEL[c.outcome][lang]);
    set('[data-result]', c.result[lang]);
    set('[data-next]', DEMO_TEXT.nextLabel[lang] + c.next[lang]);
  };

  for (const b of buttons) b.addEventListener('click', () => show(b.dataset.case ?? ''));
}
```

`src/components/HrisDemo.astro`：

```astro
---
import { CASES, STEPS, OUTCOME_LABEL, STATE_LABEL, DEMO_TEXT, trace } from '../scripts/hris-demo';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const first = CASES[0];
const firstTrace = trace(first);
---
<section class="demo" aria-labelledby="demo-title" data-demo data-lang={lang}>
  <div class="wrap demo__in">
    <div class="demo__head">
      <h2 id="demo-title">{DEMO_TEXT.title[lang]}</h2>
      <p class="demo__badge">{DEMO_TEXT.badge[lang]}</p>
    </div>
    <p class="demo__intro">{DEMO_TEXT.intro[lang]}</p>
    <div class="demo__cases" role="group" aria-label={DEMO_TEXT.casesLabel[lang]}>
      {CASES.map((c, i) => (
        <button type="button" class="demo__case" data-case={c.id} aria-pressed={i === 0 ? 'true' : 'false'}>
          <span class="demo__id">{c.id}</span>{c.name[lang]}
        </button>
      ))}
    </div>
    <p class="demo__situation" data-situation>{first.situation[lang]}</p>
    <ol class="demo__steps">
      {STEPS.map((s, i) => (
        <li class="demo__step" data-step={s.id} data-state={firstTrace[i].state}>
          {s.label[lang]}<span class="sr">{STATE_LABEL[firstTrace[i].state][lang]}</span>
        </li>
      ))}
    </ol>
    <div class="demo__result" aria-live="polite">
      <p class="demo__outcome" data-outcome>{OUTCOME_LABEL[first.outcome][lang]}</p>
      <p data-result>{first.result[lang]}</p>
      <p class="demo__next" data-next>{DEMO_TEXT.nextLabel[lang] + first.next[lang]}</p>
    </div>
  </div>
</section>
<script>
  import { bindDemo } from '../scripts/hris-demo-dom';
  document.querySelectorAll<HTMLElement>('[data-demo]').forEach(bindDemo);
</script>
<style>
  .demo { background: var(--ink); color: var(--paper); }
  .demo__in { display: grid; gap: 20px; padding-block: 48px 56px; }
  .demo__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 12px; }
  .demo__head h2 { font-size: clamp(24px, 2.6vw, 36px); }
  .demo__badge { padding: 3px 10px; border: 1.5px solid var(--paper); font-size: 13px; font-weight: 500; }
  .demo__intro { color: var(--night-mute); max-width: 46em; }
  .demo__cases { display: flex; flex-wrap: wrap; gap: 8px; }
  .demo__case { display: inline-flex; gap: 8px; align-items: baseline; padding: 8px 14px; border: 1.5px solid var(--paper); background: transparent; cursor: pointer; }
  .demo__case[aria-pressed='true'] { background: var(--paper); color: var(--ink); }
  .demo__case:hover { border-color: var(--red); }
  .demo__id { font: 700 13px/1 var(--font-display); letter-spacing: 0.08em; }
  .demo__situation { max-width: 52em; font-size: 16px; }
  .demo__steps { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; padding: 0; list-style: none; counter-reset: step; }
  .demo__step { padding: 12px 10px; border-top: 4px solid var(--night-mute); font-size: 14px; font-weight: 500; }
  .demo__step[data-state='passed'] { border-top-color: var(--paper); }
  .demo__step[data-state='stopped'] { border-top-color: var(--red); color: var(--red); }
  .demo__step[data-state='skipped'] { color: var(--night-mute); border-top-style: dashed; }
  .demo__result { display: grid; gap: 8px; padding: 18px 20px; border: 1.5px solid var(--paper); max-width: 52em; }
  .demo__outcome { font: 900 20px/1.3 var(--font-cjk-bold); }
  .demo__next { color: var(--night-mute); }
  .demo :global(:focus-visible) { outline-color: var(--paper); }
  @media (max-width: 800px) { .demo__steps { grid-template-columns: repeat(2, 1fr); } }
</style>
```

- [ ] **Step 5: 正文（中文）**

`src/copy/projects/hris-workflow.zh.md`（由旧版 HRIS 页压缩而来，只精简和重新分段，不改动事实；Power Automate 的逐步配置、表结构和验收用例留在可下载的方案文档里）：

```markdown
## 为什么不能只做 PDF 提取

原来的处理思路从文件夹出发，但文件顺序与 Excel 不一致，部分员工又没有上传档案。即使每份文件都读完，也不能回答"花名册里还有谁没有被处理"。

- **按文件走，只能看见已有资料。** 第 N 个文件不代表第 N 位员工；少一份文件，缺档员工就可能不进入处理范围。一个空值也分不清是"没上传""没填写"还是"看不清"。
- **按员工走，才能覆盖整份名单。** 先固定员工队列，再为每个人查找资料；档案是否存在、身份是否确认、字段是否可读分别判断，最后按花名册原序输出。

## 实际处理中的几次修正

1. **可见员工，不等于本批都要补写。** 按部门筛选后，仍要区分当前批次已提供资料的人。试处理曾把没有对应 PDF 的可见员工也标成"/"，我指出范围偏差，要求只处理本批资料对应的员工。由此把"全量查缺"与"本批补写"拆开：全量检查可以登记缺档状态，但不能擅自填入正式字段。
2. **文件名匹配后，还要检查文件内部。** 处理中出现过文件名归属与证件内姓名不一致，也出现过学校名称需要重新核对的情况。所以把文件内的身份核验与证书交叉核对放到写入之前；学历、学校和起止时间必须来自同一段明确的教育记录。
3. **提速先减少重复读取。** 扫描 PDF 需要逐页查看，Excel 多次定位、读取与保存也带来等待。我提出缩小读取范围、把同一员工的资料集中处理。企业方案据此增加文件版本缓存与持久化队列，写回仍保留身份确认、审核和回读核对。
4. **保存与归档必须有先后。** 保存成功、回读一致，才算完成归档，避免文件已经移走、表格却没有可靠写入。补充资料到达时回到对应员工处理，不按新文件在目录里的位置顺延写入。

## 我如何做取舍

- **先保证归属，再考虑提取量。** 姓名可以帮助找文件，但不能独立决定写给谁。同名、工号冲突和多份资料不一致时转人工；宁可保留一个异常，也不把别人的信息补进主表。
- **把空值拆成可行动的原因。** 没有档案需要补交资料；缺字段需要定向补充；扫描模糊需要重新扫描或人工阅读。状态决定下一步找谁、做什么。
- **模型输出是候选，不是写入指令。** 提取结果同时保留来源页码、原文和文件版本。已有内容不覆盖，空白字段经 HR 确认后再写回。

## 从初版到企业方案

| | 初版实践（个人） | 企业版方案 |
|---|---|---|
| 工具 | OpenClaw 调用 DeepSeek 与 GPT API | Microsoft 365：Excel、SharePoint、Power Automate、AI Builder |
| 重点 | 围绕档案信息提取与补录需求，做出初级版本 | 接入企业批准的数据存储、权限和审核机制，把识别、审核与写回分开 |
| 产出 | 匹配规则、四类状态、待审核表和写回条件 | 流程步骤、表结构、连接器、错误处理及验收用例 |

企业方案分成四条流程：**建立任务**（读取花名册、固定原始序号、按员工建立队列）→ **匹配与提取**（工号、姓名、文本识别、身份确认、生成候选）→ **审核与写回**（HR 逐项确认，只写空白字段，写后回读）→ **汇总与续跑**（恢复中断任务，按原序输出无档案、异常与已完成清单）。

| 档案状态 | 判断依据 | 处理结果 |
|---|---|---|
| 未找到电子档案 | 已完成查找，且不存在尚未排除的身份候选 | 进入无档案名单，不用"/"代替状态 |
| 档案存在 · 信息缺失 | 身份确认、内容可读，资料未提供所需字段 | 记录具体缺失字段 |
| 档案存在 · 识别失败 | 档案归属已确认，相关内容模糊或无法读取 | 标明页码与问题，转人工处理 |
| 已完成 | 必需字段有依据，审核及写回核对均完成 | 记录来源、审核人与更新时间 |

同名、重复工号、多份冲突或归属不明的文件，处理状态标为"人工审核"，不强行归入无档案。

## 局限与下一步

- 企业版是方案设计。连接器策略、服务区域、数据保留、许可与 AI 容量需要企业管理员核定；企业版不沿用初版的外部 API 调用路径。
- Excel 不支持本流程需要的并发安全写入，所以写回保持单通道串行；正式批量前先用小样本测量识别耗时和审核时间，再决定批次规模。
- 回滚按单元格进行：只恢复本批次写过、且当前仍等于写入值的单元格，后续人工修改不会被整表备份覆盖。
- 公开作品集不包含任何真实员工资料；本页演示全部使用虚构记录。

## 下载

- [完整方案（Markdown）](/downloads/hris/HRIS方案.md)：Power Automate 四条流程的配置步骤、Excel 与 SharePoint 表结构、连接器清单和验收用例。
```

- [ ] **Step 6: 正文（英文）**

`src/copy/projects/hris-workflow.en.md`（与中文逐节对应，事实一致）：

```markdown
## Why PDF extraction alone was not enough

The original approach started from the folder. But the file order did not match the Excel roster, and some employees had never uploaded anything. Even after reading every file, you still could not answer "who on the roster has not been handled yet?"

- **Going file by file only shows what exists.** The Nth file is not the Nth employee; if a file is missing, that employee can silently drop out of scope. And an empty value cannot tell you whether something was never uploaded, never filled in, or simply unreadable.
- **Going employee by employee covers the whole roster.** Fix the employee queue first, then look for each person's documents. Whether a file exists, whether identity is confirmed and whether a field is readable are judged separately, and results come out in the roster's original order.

## Corrections made along the way

1. **Visible does not mean in this batch.** After filtering by department, you still have to separate the people whose documents came in with the current batch. A trial run marked visible employees without a PDF as "/"; I flagged the scope error and limited processing to the employees covered by this batch. That split "find every gap" from "fill in this batch": a full check may record that a file is missing, but it may not write into official fields.
2. **A matching file name is not enough — check inside the file.** There were cases where the file name pointed to one person and the name on the certificate said another, and school names that needed a second look. So identity checks inside the file and cross-checks against certificates happen before anything is written. Degree, school and dates must come from one clearly identified education record.
3. **To go faster, read less, not more often.** Scanned PDFs have to be read page by page, and repeatedly locating, reading and saving in Excel adds waiting. I proposed narrowing what is read and handling each employee's documents together. The enterprise design adds a per-version file cache and a persistent queue as a result; write-back still keeps identity confirmation, review and read-back.
4. **Save first, then file away.** A document only counts as filed once the save succeeded and the read-back matched — otherwise a file can be moved while the table was never reliably updated. When extra documents arrive, they go back to the right employee rather than being written in folder order.

## How I made trade-offs

- **Ownership first, extraction volume second.** A name helps find a file but cannot decide on its own whose record it goes into. Same names, conflicting IDs and inconsistent documents go to a person; it is better to leave an exception open than to write someone else's data into the master table.
- **Turn empty values into actionable reasons.** No file means asking for a document; a missing field means asking for that field; a blurred scan means rescanning or reading it by hand. The status decides who acts next.
- **Model output is a candidate, not a write command.** Each extracted value keeps its source page, original text and file version. Existing values are never overwritten; empty fields are written only after HR confirms.

## From first version to enterprise design

| | First version (personal) | Enterprise design |
|---|---|---|
| Tools | OpenClaw calling the DeepSeek and GPT APIs | Microsoft 365: Excel, SharePoint, Power Automate, AI Builder |
| Focus | A first working version for extracting and backfilling record fields | Use company-approved storage, permissions and review; separate recognition, review and write-back |
| Output | Matching rules, four statuses, a review sheet and write-back conditions | Flow steps, table schemas, connectors, error handling and acceptance cases |

The enterprise design has four flows: **create tasks** (read the roster, fix the original order, one queue item per employee) → **match and extract** (employee ID, name, text recognition, identity check, candidates) → **review and write back** (HR confirms field by field; only empty cells are written; read back afterwards) → **summarise and resume** (recover interrupted tasks; output no-file, exception and done lists in the original order).

| File status | How it is decided | What happens |
|---|---|---|
| No file found | Search completed and no unresolved identity candidate remains | Goes on the no-file list; "/" is never used as a status |
| File found · field missing | Identity confirmed and legible, but the document lacks the field | The missing field is recorded |
| File found · unreadable | Ownership confirmed, but the content is blurred or unreadable | Page and problem noted; handed to a person |
| Done | Required fields have evidence; review and read-back complete | Source, reviewer and time recorded |

Files with the same name, duplicate IDs, conflicting versions or unknown ownership are marked "manual review" rather than forced into "no file".

## Limits and next steps

- The enterprise version is a design. Connector policy, service region, data retention, licensing and AI capacity must be set by the company's administrators, and it does not reuse the first version's external API path.
- Excel does not offer the concurrency-safe writes this flow would need, so write-back stays single-channel and sequential. Before a real batch, measure recognition time and review time on a small sample, then size the batches.
- Rollback works cell by cell: only cells written by this batch, and still holding the written value, are restored, so later manual edits are not overwritten by a whole-table backup.
- This public portfolio contains no real employee data; the demo on this page uses fictional records only.

## Download

- [Full design (Markdown, in Chinese)](/downloads/hris/HRIS方案.md): step-by-step setup of the four Power Automate flows, Excel and SharePoint schemas, connector list and acceptance cases.
```

- [ ] **Step 7: 视图与入口**

`src/views/HrisView.astro`：

```astro
---
import ProjectLayout from '../layouts/ProjectLayout.astro';
import HrisDemo from '../components/HrisDemo.astro';
import { SITE } from '../data/site';
import { Content as BodyZh } from '../copy/projects/hris-workflow.zh.md';
import { Content as BodyEn } from '../copy/projects/hris-workflow.en.md';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const P = SITE.pages.hris;
const Body = lang === 'zh' ? BodyZh : BodyEn;
---
<ProjectLayout lang={lang} slug="hris-workflow" title={P.title} lead={P.lead} tags={P.tags} summary={P.summary} description={P.description}>
  <HrisDemo slot="demo" lang={lang} />
  <Body />
</ProjectLayout>
```

`src/pages/projects/hris-workflow.astro`：

```astro
---
import HrisView from '../../views/HrisView.astro';
---
<HrisView lang="zh" />
```

`src/pages/en/projects/hris-workflow.astro`：

```astro
---
import HrisView from '../../../views/HrisView.astro';
---
<HrisView lang="en" />
```

- [ ] **Step 8: 修正下载文档里的规模表述**

`public/downloads/hris/HRIS方案.md` 第 4 行，原文：

```
约 6000 名员工的档案维护，真正的问题不是读出一份 PDF，而是让每一份资料回到正确的员工名下。
```

改为：

```
所在 CDP 系统覆盖 6,000+ 员工，我核查了其中约 2000 名员工的档案主数据。真正的问题不是读出一份 PDF，而是让每一份资料回到正确的员工名下。
```

第 11 行"面向覆盖约 6000 名员工的 CDP 系统"保持不变（这句本来就是系统规模）。

- [ ] **Step 9: 运行测试确认通过**

Run: `npx playwright test tests/e2e/hris.spec.ts`
Expected: desktop 和 mobile 全部 PASS。

- [ ] **Step 10: 提交**

```powershell
git add src tests public/downloads/hris
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add project page template and bilingual HRIS page with review demo" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 中英文简历下载

**Files:**
- Create: `public/downloads/resume/heyanjun-resume-zh.pdf`（复制）、`tools/resume-en.html`、`tools/print-resume.mjs`、`public/downloads/resume/heyanjun-resume-en.pdf`（生成）、`tests/unit/resume.test.ts`、`tests/e2e/resume.spec.ts`

**Interfaces:**
- Consumes: `SITE.resume`
- Produces: 两个 PDF 下载网址；`npm run resume:en`

- [ ] **Step 1: 写失败的测试**

`tests/unit/resume.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';

const html = readFileSync('tools/resume-en.html', 'utf8');

describe('English résumé source', () => {
  it('uses the confirmed availability and ledger wording', () => {
    expect(html).toContain('4–5 days a week');
    expect(html).toContain('3+ months');
    expect(html).toContain('about 2000 employees');
    expect(html).toContain('6,000+');
  });
  it('drops the unsupported 70% claim', () => {
    expect(html).not.toContain('70%');
  });
  it('has been printed to PDF', () => {
    expect(statSync('public/downloads/resume/heyanjun-resume-en.pdf').size).toBeGreaterThan(10_000);
  });
});
```

`tests/e2e/resume.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';

test('both résumés download as PDF', async ({ request }) => {
  for (const url of [SITE.resume.zh, SITE.resume.en]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
    expect(res.headers()['content-type'], url).toContain('application/pdf');
  }
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/resume.test.ts`
Expected: FAIL，报 "ENOENT … tools/resume-en.html"

- [ ] **Step 3: 复制中文简历**

```powershell
New-Item -ItemType Directory -Force public/downloads/resume | Out-Null
Copy-Item 'C:\Users\yoshi\Documents\ChatGPT\项目培训\output\何彦钧_通用基准参考简历.pdf' public/downloads/resume/heyanjun-resume-zh.pdf
```

- [ ] **Step 4: 英文简历源文件**

`tools/resume-en.html`（依据《通用基准参考简历》翻译；到岗信息按 F3 更新；删去无证据的"70%"；不放照片）：

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Yanjun He — Résumé</title>
<style>
  @page { size: A4; margin: 14mm 16mm; }
  body { margin: 0; font: 10.2pt/1.45 "Segoe UI", Arial, sans-serif; color: #111; }
  h1 { margin: 0; font-size: 22pt; letter-spacing: -0.01em; }
  .target { margin: 2px 0 4px; font-weight: 700; }
  .meta { color: #333; }
  h2 { margin: 14px 0 6px; padding-bottom: 3px; border-bottom: 1.5px solid #111; font-size: 12pt; text-transform: uppercase; letter-spacing: 0.06em; }
  .row { display: flex; justify-content: space-between; gap: 12px; font-weight: 700; }
  .sub { color: #333; margin-bottom: 3px; }
  ul { margin: 3px 0 8px; padding-left: 16px; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
  <h1>Yanjun He</h1>
  <p class="target">Target roles: AI Product Operations | LLM Prompt Assistant | HR &amp; Talent Data Operations</p>
  <p class="meta">+86 199 2155 2388 | 2806660493@qq.com | Shanghai | Portfolio: chiwawafromkk.github.io</p>
  <p class="meta">Class of 2027 (BA) | Available now | 4–5 days a week | 3+ months</p>

  <h2>Education</h2>
  <div class="row"><span>Shanghai Lixin University of Accounting and Finance | BA, Public Administration</span><span>Sep 2023 – Jun 2027 (expected)</span></div>
  <ul>
    <li>Top 5% of major (university scholarship). Core courses: Human Resource Management, Management Psychology, Organizational Behavior, Management Information Systems.</li>
    <li>English: CET-6, 550. Comfortable reading English material and handling cross-border business email.</li>
  </ul>

  <h2>Internship</h2>
  <div class="row"><span>Danaher (Shanghai) Enterprise Management Co., Ltd. (Fortune 500) | HR &amp; Talent Data Intern</span><span>Mar 2026 – Jun 2026</span></div>
  <p class="sub">Placed through 薪得付信息技术（上海）有限公司 (staffing agency); service period Mar – Jul 2026 — one internship.</p>
  <ul>
    <li><strong>Master data at scale:</strong> On the CDP HR core system covering 6,000+ employees in China, independently reviewed and batch-validated employee master records for about 2000 employees (2,000+ key fields), keeping HR data complete and accurate.</li>
    <li><strong>Cross-regional coordination:</strong> For missing or abnormal documents across regional branches, worked with dozens of regional HR contacts, built a standard chase-and-backfill tracker, and followed up labor-contract filing and new-hire records.</li>
    <li><strong>Compliance and reporting:</strong> Helped review safety-compliance rules and checks; produced multi-dimensional statistics and visual reports with advanced Excel functions and PivotTables for management and team reviews.</li>
    <li><strong>Recognition:</strong> On my own initiative, brought AI office tools into document summarizing and data cleaning; gradually took over CDP maintenance and broader HR operations; recognized by the HRBP and invited to extend the internship.</li>
  </ul>

  <h2>Projects</h2>
  <div class="row"><span>Personal job-search assistant on LLMs and a local workflow | Product planning &amp; prompt design</span><span>Aug 2026 – present</span></div>
  <ul>
    <li><strong>Problem and scope:</strong> For non-technical job seekers facing low-yield mass applications, slow extraction of key job requirements and generic outreach, planned an end-to-end workbench from job collection and structured parsing to personalized materials.</li>
    <li><strong>Prompt engineering:</strong> Built on DeepSeek; designed a prompt pipeline for extracting information from Chinese job descriptions; iterated three outreach templates (skills match / ready to contribute / self-driven growth), optimizing for first-reply rate.</li>
    <li><strong>Safety by design:</strong> "AI prepares, the person decides" — sensitive data stays local and private, with a hard-pause mechanism balancing automation and privacy.</li>
  </ul>
  <div class="row"><span>Generative AI in campus and office use — empirical study | Team lead, student innovation project</span><span>Mar 2024 – Jul 2024</span></div>
  <ul>
    <li>Led the team studying generative AI in study and office scenarios; collected domestic and international tool cases; built the survey framework and led data cleaning.</li>
    <li>Summarized findings with cross-tab statistics, wrote a report of about 10,000 Chinese characters and presented at the defense; the project won First Prize in the university's student innovation programme.</li>
  </ul>

  <h2>Campus &amp; Skills</h2>
  <div class="row"><span>Student Union, New Media Operations | Core member</span><span>Sep 2023 – Jul 2025</span></div>
  <ul>
    <li>Planned topics, wrote and laid out WeChat official-account posts; supported publicity and coordination for large campus events.</li>
    <li>Skills: Excel (VLOOKUP/XLOOKUP, PivotTables, charts), advanced Word layout; SQL basics; Python data libraries (Pandas/NumPy). Completed Alibaba Cloud "AI New Force" training.</li>
  </ul>
</body>
</html>
```

- [ ] **Step 5: 打印脚本**

`tools/print-resume.mjs`：

```js
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!EDGE) throw new Error('Microsoft Edge not found; add its path to tools/print-resume.mjs');

const src = pathToFileURL(resolve('tools/resume-en.html')).href;
const out = resolve('public/downloads/resume/heyanjun-resume-en.pdf');
mkdirSync(resolve('public/downloads/resume'), { recursive: true });
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${out}`, src], { stdio: 'inherit' });

const size = statSync(out).size;
if (size < 10_000) throw new Error(`PDF looks empty (${size} bytes)`);
console.log(`wrote ${out} (${size} bytes)`);
```

- [ ] **Step 6: 生成 PDF 并检查版面**

Run: `npm run resume:en`
Expected: 输出 `wrote …heyanjun-resume-en.pdf (N bytes)`。然后用 Read 工具打开这个 PDF，确认是一页 A4、没有文字被截断；如果超出一页，把 `body` 的字号降到 `9.8pt` 后重新生成。

- [ ] **Step 7: 运行测试确认通过**

Run: `npx vitest run tests/unit/resume.test.ts; npx playwright test tests/e2e/resume.spec.ts --project=desktop`
Expected: PASS

- [ ] **Step 8: 提交**

```powershell
git add tools public/downloads/resume tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add Chinese and English résumé downloads" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: 第一阶段验收测试

**Files:**
- Create: `tests/e2e/links.spec.ts`、`tests/e2e/a11y.spec.ts`、`tests/e2e/keyboard.spec.ts`、`tests/e2e/numbers.spec.ts`、`tests/e2e/layout.spec.ts`

**Interfaces:**
- Consumes: `helpers.ts` 的 `PHASE1_PAGES`、`PHASE2_PENDING`、`skipIntro`、`noHorizontalOverflow`；`tests/unit/digits.ts` 的 `digitTokens`；`factCorpus()`

- [ ] **Step 1: 写验收测试**

`tests/e2e/links.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { PHASE1_PAGES, PHASE2_PENDING, skipIntro } from './helpers';

test('every internal link resolves (phase-2 pages excepted)', async ({ page, request, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await skipIntro(page);
  const found = new Set<string>();
  for (const p of PHASE1_PAGES) {
    await page.goto(p);
    const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href') ?? ''));
    for (const h of hrefs) if (h.startsWith('/') && !h.startsWith('//')) found.add(h.split('#')[0]);
  }
  const broken: string[] = [];
  for (const h of found) {
    if (PHASE2_PENDING.has(decodeURI(h))) continue;
    if ((await request.get(h)).status() !== 200) broken.push(h);
  }
  expect(broken).toEqual([]);
});
```

`tests/e2e/a11y.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PHASE1_PAGES, skipIntro } from './helpers';

for (const p of PHASE1_PAGES) {
  test(`no serious a11y issues on ${p}`, async ({ page }) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(p);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
```

`tests/e2e/keyboard.spec.ts`：

```ts
import { test, expect, type Page } from '@playwright/test';
import { skipIntro } from './helpers';

async function tabTo(page: Page, selector: string, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(s => document.activeElement?.matches(s) ?? false, selector)) return;
  }
  throw new Error(`Tab never reached ${selector}`);
}

async function expectVisibleFocus(page: Page) {
  const style = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(style).not.toBe('none');
}

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`keyboard path home → overview → HRIS → résumé (${lang})`, async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'keyboard path runs on desktop');
    await skipIntro(page);
    await page.goto(`${prefix}/`);
    await tabTo(page, `a.door[href="${prefix}/brief/"]`);
    await expectVisibleFocus(page);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${prefix}/brief/$`));
    await tabTo(page, `a.prow[href="${prefix}/projects/hris-workflow/"]`);
    await expectVisibleFocus(page);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/hris-workflow\/$/);
    await tabTo(page, `a.nav__resume[href$="heyanjun-resume-${lang}.pdf"]`);
    await expectVisibleFocus(page);
  });
}
```

`tests/e2e/numbers.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';
import { digitTokens } from '../unit/digits';
import { factCorpus } from '../../src/data/facts';

const EXCLUDE = '.prow__n, .door__index, .demo__id, .p-pager, .contact, .footer, .nav, .prose';

for (const p of ['/', '/brief/', '/projects/hris-workflow/', '/en/', '/en/brief/', '/en/projects/hris-workflow/']) {
  test(`every number on ${p} comes from the fact ledger`, async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await skipIntro(page);
    await page.goto(p);
    const text = await page.locator('main').evaluate((main, sel) => {
      const clone = main.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(sel).forEach(el => el.remove());
      return clone.innerText;
    }, EXCLUDE);
    const corpus = factCorpus();
    const stray = digitTokens(text).filter(t => !corpus.includes(t));
    expect(stray).toEqual([]);
  });
}
```

说明：`.prose`（HRIS 迁移正文）不在这项检查内，因为正文里的数字都来自旧页面，在 Task 9 已逐条核对；`.contact`、`.footer`、`.nav` 里只有邮箱和导航。

`tests/e2e/layout.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { PHASE1_PAGES, skipIntro, noHorizontalOverflow } from './helpers';

for (const p of PHASE1_PAGES) {
  test(`layout ${p}`, async ({ page }, info) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(p);
    expect(await noHorizontalOverflow(page)).toBe(true);
    const name = `${info.project.name}${p.replace(/\/+/g, '-').replace(/-$/, '') || '-home'}`;
    await page.screenshot({ path: `test-results/screens/${name}.png`, fullPage: true });
  });
}
```

- [ ] **Step 2: 运行完整测试**

Run: `npx vitest run; npx playwright test`
Expected: 全部 PASS。任何失败都按失败信息修正对应组件，然后重新运行整套测试；**不得**通过放宽断言、扩大 `ALLOWED_TOKENS` 或把页面加入 `PHASE2_PENDING` 来让测试通过。

- [ ] **Step 3: 逐张检查截图**

用 Read 工具打开 `test-results/screens/` 下的 12 张截图（6 个页面 × desktop/mobile），逐张检查：文字没有被遮挡或截断，英文没有撑破容器，暗场区和朱红联系区的对比清楚，大字和说明文字挨在一起。发现问题就修正并回到 Step 2。

- [ ] **Step 4: 提交**

```powershell
git add tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Add phase-1 acceptance suite: links, a11y, keyboard, numbers, layout" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: 交给用户验收（人工检查点）

**Files:** 无代码改动。

- [ ] **Step 1: 启动本地预览**

Run（后台运行）: `npm run build; npm run preview`
Expected: `http://localhost:4321/` 可以访问。

- [ ] **Step 2: 向用户汇报并停下**

用中文告诉用户：
- 预览地址 `http://localhost:4321/` 和 `http://localhost:4321/en/`；截图目录 `test-results/screens/`。
- 第一阶段验收结果：各项测试的通过情况（附命令输出的摘要），以及截图检查中发现并修正的问题。
- 需要用户确认的四件事：
  1. 英文文案和英文简历（`/en/` 各页、`public/downloads/resume/heyanjun-resume-en.pdf`）。
  2. 中文简历 PDF 上写的是"每周 5 天"，网站写的是"每周 4–5 天"，是否需要重新生成中文简历。
  3. HRIS 页的"当前状态"写的是"企业版流程为方案设计"，是否准确（旧页面只写了"企业版架构方案"）。
  4. 是否进入第二阶段。
- 明确说明：没有推送，没有部署，线上网站未变。

- [ ] **Step 3: 记录到共享记忆库**

在 `C:\Users\yoshi\Documents\ChatGPT\长期记忆\00-收件箱\` 新建 `YYYYMMDD-HHMMSS-Claude Code-作品集第一阶段完成.md`，写明：完成的内容、最后一次提交的哈希、测试结果、上面四个待确认事项；状态标为"本地完成，未推送、未部署"。
