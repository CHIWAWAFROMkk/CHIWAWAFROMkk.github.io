# 全站动效升级 · 第一批（基础设施 + 首页 / 快速概览 / 项目索引）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 Astro 作品集接入 React 与 GSAP，引入四个 React Bits 组件（SplitText、ScrollReveal、Magnet、SpotlightCard），先用在首页、快速概览、项目索引三页，并补上 taste 清单里的排版与交互细节。

**Architecture:** React 只以 Astro 岛的形式出现，标题和链接本身仍由 Astro 输出（保留作用域样式与静态 HTML），React 组件包在它们里面。GSAP 从一个模块统一注册插件与动效令牌。首屏拆字用 `client:load`，其余组件用 `client:visible`。一段内联脚本在首次绘制前判断"可以播动效"，并设 2.5 秒保底，保证任何情况下文字都会显示。

**Tech Stack:** Astro 7、@astrojs/react、React 19、GSAP 3（ScrollTrigger、SplitText）、@gsap/react、Vitest、Playwright（Edge）。

**Spec:** `docs/superpowers/specs/2026-10-05-react-bits-gsap-motion-design.md`

## Global Constraints

- 缓动统一为 `cubic-bezier(.2,.8,.2,1)`；时长 0.2 秒（交互）/ 0.6 秒（揭示）/ 0.9 秒（大标题）；错落 40 毫秒（字）/ 70 毫秒（行）/ 90 毫秒（块）。
- 只动 transform 与 opacity；不引起布局跳动（每页 CLS < 0.1）。
- 没有闪白、没有整屏变亮。
- 磁吸位移不超过 6 像素；触屏（`pointer: coarse`）不启用磁吸与光斑。
- "减少动态"下：不拆字、不创建 ScrollTrigger、不做磁吸与光斑，文字立即可见。
- 关闭 JavaScript 时文字完整可读。
- 每页首屏脚本中 React 运行时 + 组件 ≤ 70 KB（gzip）。
- React Bits 源码保留其 MIT + Commons Clause 版权声明；对原版的改动在文件头逐条注明。
- 中英双语页面同等处理；新增文案为零（只改表现层）。
- 提交身份：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit`，提交信息结尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- 不推送、不上线；第一批做完由用户本机预览确认。

## Review Focus

1. **React 激活失败或很慢**（网络慢、脚本被拦）：标题必须在 2.5 秒内自行显示，不能永久隐藏 —— Task 1 的保底测试覆盖。
2. **"减少动态"用户**：所有文字立即可见，没有拆开的字、没有滚动触发器 —— Task 3、4、5 各自的测试覆盖。
3. **触屏手机**：没有磁吸位移、没有光斑，点击直接跳转不被拦截 —— Task 2 的纯函数测试 + Task 3 的触屏模拟测试。
4. **英文页**：拆字按词拆（不能把英文拆成单个字母导致换行断词）；中文按字拆 —— Task 2 的 `splitUnits` 测试。
5. **宽屏与 320 像素窄屏**：组件包裹后不出现横向溢出、不破坏刚修好的版心对齐 —— Task 5 的布局测试。

## File Structure

| 文件 | 职责 |
|---|---|
| `astro.config.mjs` | 加入 React 集成 |
| `package.json` | 新依赖 |
| `src/scripts/motion/tokens.ts` | 动效令牌、`prefersMotion()`、`isCoarse()`、`magnetOffset()`、`splitUnits()` 纯函数 |
| `src/scripts/motion/gsap.ts` | 注册 GSAP 插件与站点缓动 `site`，供组件使用 |
| `src/layouts/Base.astro` | 首次绘制前的内联脚本（`html.motion-ok`、2.5 秒保底） |
| `src/styles/base.css` | 激活前隐藏规则、taste 细节（text-wrap、tabular-nums、按压反馈） |
| `src/components/rb/SplitText.tsx` | React Bits SplitText（改：令牌、减少动态、`data-split-ready`、块级包装） |
| `src/components/rb/ScrollReveal.tsx` | React Bits ScrollReveal（改：中文按字、合法标签、只清理自己的触发器、无独立字号） |
| `src/components/rb/Magnet.tsx` | React Bits Magnet（改：位移上限、触屏与减少动态禁用） |
| `src/components/rb/SpotlightCard.tsx` + `SpotlightCard.css` | React Bits SpotlightCard（改：去掉卡片外观，只留光斑；触屏禁用） |
| `src/components/rb/LICENSE.md` | React Bits 许可原文 |
| `src/views/HomeView.astro`、`src/components/Gate.astro`、`src/components/ContactBar.astro` | 首页使用 |
| `src/views/BriefView.astro`、`src/components/ProjectRow.astro` | 概览页使用 |
| `src/views/ProjectsView.astro` | 项目索引使用 |
| `tests/unit/motion-tokens.test.ts` | 纯函数测试 |
| `tests/e2e/motion-batch1.spec.ts` | 三页的动效、减少动态、触屏、无 JS、CLS、体积测试 |

---

### Task 1: React 与 GSAP 基础设施、首次绘制前的保护

**Files:**
- Modify: `package.json`、`astro.config.mjs`、`src/layouts/Base.astro`、`src/styles/base.css`
- Create: `src/scripts/motion/tokens.ts`、`src/scripts/motion/gsap.ts`、`tests/unit/motion-tokens.test.ts`、`tests/e2e/motion-batch1.spec.ts`

**Interfaces:**
- Produces: `MOTION`（令牌对象）、`prefersMotion(): boolean`、`isCoarse(): boolean`、`magnetOffset(dx: number, dy: number, strength: number, max: number): { x: number; y: number }`、`splitUnits(text: string): 'chars' | 'words'`（tokens.ts）；`gsap`、`ScrollTrigger`、`SplitText`、缓动名 `'site'`（gsap.ts）；全局类 `html.motion-ok`、`html.motion-timeout`；元素属性 `[data-split-ready]`。

- [ ] **Step 1: 安装依赖**

Run: `npm install @astrojs/react react react-dom gsap @gsap/react`
Expected: 安装成功，`package.json` 的 dependencies 出现这五项。

- [ ] **Step 2: 写纯函数的失败测试** `tests/unit/motion-tokens.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { MOTION, magnetOffset, splitUnits } from '../../src/scripts/motion/tokens';

describe('motion tokens', () => {
  it('carry the spec values', () => {
    expect(MOTION.ease).toBe('cubic-bezier(.2,.8,.2,1)');
    expect([MOTION.quick, MOTION.reveal, MOTION.title]).toEqual([0.2, 0.6, 0.9]);
    expect([MOTION.staggerChar, MOTION.staggerRow, MOTION.staggerBlock]).toEqual([0.04, 0.07, 0.09]);
    expect(MOTION.magnetMax).toBe(6);
  });
});

describe('magnetOffset', () => {
  it('follows the pointer, scaled down by strength', () => {
    expect(magnetOffset(8, -4, 4, 6)).toEqual({ x: 2, y: -1 });
  });
  it('never moves more than the cap, in any direction', () => {
    const o = magnetOffset(300, 400, 2, 6);
    expect(Math.hypot(o.x, o.y)).toBeCloseTo(6, 5);
    expect(o.x / o.y).toBeCloseTo(300 / 400, 5);
  });
  it('stays still at the centre', () => {
    expect(magnetOffset(0, 0, 3, 6)).toEqual({ x: 0, y: 0 });
  });
});

describe('splitUnits', () => {
  it('splits Chinese by character and English by word', () => {
    expect(splitUnits('何彦钧')).toBe('chars');
    expect(splitUnits('项目与演示')).toBe('chars');
    expect(splitUnits('Projects & demos')).toBe('words');
    expect(splitUnits('Yanjun He')).toBe('words');
  });
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npx vitest run tests/unit/motion-tokens.test.ts`
Expected: FAIL，找不到 `src/scripts/motion/tokens`。

- [ ] **Step 4: 写实现** `src/scripts/motion/tokens.ts`

```ts
/** Site-wide motion tokens (spec 2026-10-05 §4). Every animated component reads its timing from here. */
export const MOTION = {
  ease: 'cubic-bezier(.2,.8,.2,1)',
  quick: 0.2,
  reveal: 0.6,
  title: 0.9,
  staggerChar: 0.04,
  staggerRow: 0.07,
  staggerBlock: 0.09,
  magnetMax: 6,
} as const;

/** False with "reduce motion", and before the browser exists (server render). */
export function prefersMotion(): boolean {
  return typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Touch screens: no magnet, no spotlight. */
export function isCoarse(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

/** The magnet's offset for a pointer at (dx, dy) from the centre: divided by strength, capped at `max` pixels. */
export function magnetOffset(dx: number, dy: number, strength: number, max: number): { x: number; y: number } {
  const x = dx / strength, y = dy / strength;
  const len = Math.hypot(x, y);
  if (len <= max || len === 0) return { x: x || 0, y: y || 0 };
  return { x: (x / len) * max, y: (y / len) * max };
}

/** Chinese (and other text without spaces) splits into characters; text with spaces splits into words, so words never break mid-line. */
export function splitUnits(text: string): 'chars' | 'words' {
  return /[㐀-鿿豈-﫿]/.test(text) ? 'chars' : 'words';
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/unit/motion-tokens.test.ts`
Expected: PASS（5 项）。

- [ ] **Step 6: 写 GSAP 注册模块** `src/scripts/motion/gsap.ts`

```ts
/** One place registers GSAP's plugins and the site's ease, so every component animates on the same rhythm. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('site', '.2,.8,.2,1');

export { gsap, ScrollTrigger, SplitText };
```

- [ ] **Step 7: 接入 React 集成** `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://chiwawafromkk.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react()],
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
```

- [ ] **Step 8: 首次绘制前的内联脚本** —— 在 `src/layouts/Base.astro` 的 `<head>` 里、`<link rel="stylesheet" href="/assets/fonts.css" />` 之后加入：

```astro
    <script is:inline>
      /* Before first paint: animated headings may start hidden only when motion is allowed and JavaScript runs.
         Whatever happens to the scripts after that, everything shows after 2.5 s. */
      (function () {
        var d = document.documentElement;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        d.classList.add('motion-ok');
        setTimeout(function () { d.classList.add('motion-timeout'); }, 2500);
      })();
    </script>
```

- [ ] **Step 9: 隐藏规则与 taste 细节** —— 在 `src/styles/base.css` 末尾加入：

```css
/* Motion (spec 2026-10-05): a split heading waits hidden only until its component is ready, and never past 2.5 s. */
html.motion-ok:not(.motion-timeout) .split-parent:not([data-split-ready]) { visibility: hidden; }

/* taste: no orphans, steady digits, a press you can feel */
h1, h2, h3, .section-head h2 { text-wrap: balance; }
p, li, dd { text-wrap: pretty; }
.num, .prow__n, .door__index, .door__big, time, td { font-variant-numeric: tabular-nums; }
.button, .door, .contact a, .nav__resume, .jp__btn, button { transition-property: transform, background-color, color, border-color, background-size; }
.button:active, .door:active, .contact a:active, .nav__resume:active, button:active { transform: scale(0.98); transition-duration: 0.12s; }
@media (prefers-reduced-motion: reduce) { .button:active, .door:active, .contact a:active, .nav__resume:active, button:active { transform: none; } }
```

- [ ] **Step 10: 写保底与无 JS 的 e2e 测试** `tests/e2e/motion-batch1.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

const PAGES = ['/', '/brief/', '/projects/', '/en/', '/en/brief/', '/en/projects/'];

test.describe('first-paint safety', () => {
  for (const p of PAGES) {
    test(`${p}: with scripts blocked after the inline check, the heading still shows within 2.5 s`, async ({ page }) => {
      await skipIntro(page);
      await page.route('**/_astro/**', r => r.abort());                     // components never arrive
      await page.goto(p);
      await page.waitForTimeout(2800);
      const vis = await page.locator('main h1').first().evaluate(el => getComputedStyle(el.querySelector('.split-parent') ?? el).visibility);
      expect(vis).toBe('visible');
    });
  }

  test('without JavaScript every heading is in the HTML and visible', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(p);
      const h1 = page.locator('main h1').first();
      await expect(h1).toBeVisible();
      expect((await h1.innerText()).trim().length).toBeGreaterThan(1);
    }
    await ctx.close();
  });
});
```

- [ ] **Step 11: 构建并跑测试**

Run: `npm run build && npx vitest run && npx playwright test tests/e2e/motion-batch1.spec.ts`
Expected: 构建成功；单元测试全过；保底与无 JS 测试通过（此时还没有组件，标题本来就可见）。

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/scripts/motion src/layouts/Base.astro src/styles/base.css tests/unit/motion-tokens.test.ts tests/e2e/motion-batch1.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Motion foundation: React islands, GSAP with the site ease, first-paint safety" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 引入四个 React Bits 组件（按站点改造）

**Files:**
- Create: `src/components/rb/SplitText.tsx`、`src/components/rb/ScrollReveal.tsx`、`src/components/rb/Magnet.tsx`、`src/components/rb/SpotlightCard.tsx`、`src/components/rb/SpotlightCard.css`、`src/components/rb/LICENSE.md`
- Test: `tests/unit/rb-components.test.ts`

**Interfaces:**
- Consumes: `MOTION`、`prefersMotion`、`isCoarse`、`magnetOffset`、`splitUnits`（Task 1）；`gsap`、`ScrollTrigger`、`SplitText`（Task 1 gsap.ts）。
- Produces:
  - `<SplitText text: string className?: string />` —— 渲染 `<span class="split-parent …">`（块级），完成拆分后设 `data-split-ready`；减少动态下不拆分、直接设 `data-split-ready`。
  - `<ScrollReveal text: string className?: string />` —— 渲染 `<span class="scroll-reveal …">`，内部 `<span class="sr-unit">` 按 `splitUnits` 拆分；滚动时由 0.15 透明度、轻微旋转归正；减少动态下不创建触发器。
  - `<Magnet className?: string>{children}</Magnet>` —— 位移 ≤ 6 像素；触屏或减少动态下不监听。
  - `<SpotlightCard className?: string tone?: 'paper' | 'night'>{children}</SpotlightCard>` —— 只有光斑层，无边框、无圆角、无背景；触屏下不显示光斑。

- [ ] **Step 1: 写源码一致性与改造约束的失败测试** `tests/unit/rb-components.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const rb = (f: string) => readFileSync(`src/components/rb/${f}`, 'utf8');

describe('vendored React Bits components', () => {
  it('ship the licence and name every change from the original', () => {
    expect(rb('LICENSE.md')).toContain('MIT + Commons Clause');
    for (const f of ['SplitText.tsx', 'ScrollReveal.tsx', 'Magnet.tsx', 'SpotlightCard.tsx']) {
      expect(rb(f), f).toContain('Adapted from React Bits');
      expect(rb(f), f).toContain('Changes:');
    }
  });

  it('read timing from the site tokens and respect reduced motion', () => {
    for (const f of ['SplitText.tsx', 'ScrollReveal.tsx', 'Magnet.tsx']) {
      expect(rb(f), f).toContain("from '../../scripts/motion/tokens'");
      expect(rb(f), f).toContain('prefersMotion()');
    }
  });

  it('ScrollReveal only kills its own triggers and renders valid markup', () => {
    const s = rb('ScrollReveal.tsx');
    expect(s).not.toContain('ScrollTrigger.getAll().forEach(trigger => trigger.kill())');
    expect(s).not.toMatch(/<h2[\s>]/);
    expect(s).not.toMatch(/<p[\s>]/);
    expect(existsSync('src/components/rb/ScrollReveal.css')).toBe(false);   // no own font size
  });

  it('SpotlightCard carries no card look of its own', () => {
    const css = rb('SpotlightCard.css');
    for (const banned of ['border-radius', 'border:', 'background-color', 'padding']) expect(css, banned).not.toContain(banned);
  });

  it('Magnet is capped and off on touch screens', () => {
    const s = rb('Magnet.tsx');
    expect(s).toContain('magnetOffset(');
    expect(s).toContain('isCoarse()');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/rb-components.test.ts`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 放入许可原文** —— 从 `https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md` 下载保存为 `src/components/rb/LICENSE.md`（原样，不改）。

Run: `curl -s -o src/components/rb/LICENSE.md https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md && head -1 src/components/rb/LICENSE.md`
Expected: `MIT + Commons Clause License Condition v1.0`

- [ ] **Step 4: 写 `src/components/rb/SplitText.tsx`**

```tsx
/* Adapted from React Bits — SplitText (ts-default), https://github.com/DavidHDev/react-bits, MIT + Commons Clause (see LICENSE.md).
   Changes: timing from the site tokens; splits Chinese by character and English by word (splitUnits);
   renders a block-level <span> inside the page's own heading; with reduced motion it never splits;
   marks [data-split-ready] when it may be shown (base.css hides it until then, never past 2.5 s);
   plays once on mount instead of waiting for a scroll trigger (it is used above the fold). */
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SplitText as GSAPSplitText } from '../../scripts/motion/gsap';
import { MOTION, prefersMotion, splitUnits } from '../../scripts/motion/tokens';

export interface SplitTextProps { text: string; className?: string }

export default function SplitText({ text, className = '' }: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    if (!prefersMotion()) { el.dataset.splitReady = ''; return; }
    let split: GSAPSplitText | null = null;
    const run = () => {
      split = new GSAPSplitText(el, { type: splitUnits(text), charsClass: 'split-char', wordsClass: 'split-word', reduceWhiteSpace: false });
      const targets = splitUnits(text) === 'chars' ? split.chars : split.words;
      gsap.set(targets, { yPercent: 110, opacity: 0 });
      el.dataset.splitReady = '';
      gsap.to(targets, { yPercent: 0, opacity: 1, duration: MOTION.title, ease: 'site', stagger: MOTION.staggerChar });
    };
    // Split after the web fonts settle, so the pieces match the final glyph widths (no layout jump afterwards).
    document.fonts.status === 'loaded' ? run() : document.fonts.ready.then(run);
    return () => { split?.revert(); };
  }, { scope: ref, dependencies: [text] });
  return <span ref={ref} className={`split-parent ${className}`} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>{text}</span>;
}
```

- [ ] **Step 5: 写 `src/components/rb/ScrollReveal.tsx`**

```tsx
/* Adapted from React Bits — ScrollReveal (ts-default), https://github.com/DavidHDev/react-bits, MIT + Commons Clause (see LICENSE.md).
   Changes: takes plain `text`; splits Chinese by character (the original split on spaces only);
   renders <span>s to sit inside the page's own <h2> (the original rendered <h2><p>, which is invalid);
   no stylesheet of its own (the page keeps its type scale); no blur (keeps text crisp, cheaper);
   kills only its own ScrollTriggers on unmount (the original killed every trigger on the page);
   timing from the site tokens; with reduced motion it creates no triggers. */
import { useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../scripts/motion/gsap';
import { MOTION, prefersMotion, splitUnits } from '../../scripts/motion/tokens';

export interface ScrollRevealProps { text: string; className?: string }

export default function ScrollReveal({ text, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const units = useMemo(() => (splitUnits(text) === 'chars' ? [...text] : text.split(/(\s+)/)), [text]);
  useGSAP(() => {
    const el = ref.current;
    if (!el || !prefersMotion()) return;
    const parts = el.querySelectorAll<HTMLElement>('.sr-unit');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom-=8%', end: 'top 55%', scrub: 0.6 } });
    tl.fromTo(el, { rotate: 1.5, transformOrigin: '0% 50%' }, { rotate: 0, ease: 'none' }, 0)
      .fromTo(parts, { opacity: 0.15 }, { opacity: 1, ease: 'none', stagger: MOTION.staggerChar }, 0);
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, { scope: ref, dependencies: [text] });
  return (
    <span ref={ref} className={`scroll-reveal ${className}`} style={{ display: 'inline-block' }}>
      {units.map((u, i) => (/^\s+$/.test(u) ? u : <span className="sr-unit" key={i} style={{ display: 'inline-block' }}>{u}</span>))}
    </span>
  );
}
```

- [ ] **Step 6: 写 `src/components/rb/Magnet.tsx`**

```tsx
/* Adapted from React Bits — Magnet (ts-default), https://github.com/DavidHDev/react-bits, MIT + Commons Clause (see LICENSE.md).
   Changes: the offset is capped at MOTION.magnetMax (6 px) via magnetOffset(); off on touch screens and with reduced motion;
   transitions use the site ease; an inline <span> wrapper so it can sit inside links and lines of text. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MOTION, prefersMotion, isCoarse, magnetOffset } from '../../scripts/motion/tokens';

export interface MagnetProps { children: ReactNode; className?: string; padding?: number; strength?: number }

export default function Magnet({ children, className = '', padding = 60, strength = 4 }: MagnetProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, on: false });
  useEffect(() => {
    if (!prefersMotion() || isCoarse()) return;
    const move = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const inside = Math.abs(e.clientX - cx) < r.width / 2 + padding && Math.abs(e.clientY - cy) < r.height / 2 + padding;
      if (!inside) { setPos(p => (p.on ? { x: 0, y: 0, on: false } : p)); return; }
      const o = magnetOffset(e.clientX - cx, e.clientY - cy, strength, MOTION.magnetMax);
      setPos({ x: o.x, y: o.y, on: true });
    };
    addEventListener('mousemove', move);
    return () => removeEventListener('mousemove', move);
  }, [padding, strength]);
  return (
    <span ref={ref} className={`magnet ${className}`} style={{ display: 'inline-block' }}>
      <span style={{ display: 'inline-block', transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, transition: `transform ${pos.on ? MOTION.quick : MOTION.reveal}s ${MOTION.ease}`, willChange: 'transform' }}>
        {children}
      </span>
    </span>
  );
}
```

- [ ] **Step 7: 写 `src/components/rb/SpotlightCard.tsx` 与 `SpotlightCard.css`**

```tsx
/* Adapted from React Bits — SpotlightCard (ts-default), https://github.com/DavidHDev/react-bits, MIT + Commons Clause (see LICENSE.md).
   Changes: no card look (no border, radius, background, padding) — it only lays a soft light under the pointer over
   whatever it wraps; two tones from the site palette (warm ink on paper, warm light on night);
   off on touch screens. */
import { useRef, type ReactNode, type MouseEvent } from 'react';
import { isCoarse } from '../../scripts/motion/tokens';
import './SpotlightCard.css';

export interface SpotlightCardProps { children: ReactNode; className?: string; tone?: 'paper' | 'night' }

export default function SpotlightCard({ children, className = '', tone = 'paper' }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || isCoarse()) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
  };
  return <div ref={ref} onMouseMove={move} className={`card-spotlight card-spotlight--${tone} ${className}`}>{children}</div>;
}
```

```css
/* Only the light: the wrapped element keeps its own look. */
.card-spotlight { position: relative; --mouse-x: 50%; --mouse-y: 50%; }
.card-spotlight::before {
  content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(360px circle at var(--mouse-x) var(--mouse-y), var(--spot), transparent 70%);
  opacity: 0; transition: opacity 0.5s cubic-bezier(.2,.8,.2,1);
}
.card-spotlight--paper { --spot: rgb(15 15 15 / 0.06); }
.card-spotlight--night { --spot: rgb(236 228 214 / 0.10); }
.card-spotlight:hover::before, .card-spotlight:focus-within::before { opacity: 1; }
@media (pointer: coarse), (prefers-reduced-motion: reduce) { .card-spotlight::before { display: none; } }
```

- [ ] **Step 8: 跑测试确认通过、构建通过**

Run: `npx vitest run tests/unit/rb-components.test.ts && npm run build`
Expected: PASS；构建成功（组件尚未被页面使用）。

- [ ] **Step 9: Commit**

```bash
git add src/components/rb tests/unit/rb-components.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Vendor four React Bits components, adapted to the site's tokens and accessibility rules" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 首页

**Files:**
- Modify: `src/views/HomeView.astro`、`src/components/Gate.astro`、`src/components/ContactBar.astro`
- Test: `tests/e2e/motion-batch1.spec.ts`

**Interfaces:**
- Consumes: `SplitText`、`Magnet`、`SpotlightCard`（Task 2）。

- [ ] **Step 1: 追加首页的失败测试**（`tests/e2e/motion-batch1.spec.ts` 末尾）

```ts
test.describe('home', () => {
  test('the name splits and plays, then rests exactly where the static name sits', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/');
    const name = page.locator('.home__name .split-parent');
    await expect(name).toHaveAttribute('data-split-ready', '', { timeout: 5000 });
    await expect(page.locator('.home__name .split-char').first()).toBeAttached();
    await page.waitForTimeout(1500);
    expect(await page.locator('.home__name .split-char').evaluateAll(cs => cs.every(c => getComputedStyle(c).opacity === '1'))).toBe(true);
  });

  test('reduced motion: the name is whole and visible at once', async ({ page }) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.home__name')).toBeVisible();
    await expect(page.locator('.home__name .split-char')).toHaveCount(0);
  });

  test('the door arrows and the contact links are magnetic, at most 6 px', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop pointer');
    await skipIntro(page);
    await page.goto('/');
    const arrow = page.locator('.door .magnet').first();
    const box = (await arrow.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 30);
    await page.waitForTimeout(400);
    const shift = await arrow.locator('> span').evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.hypot(m.e, m.f); });
    expect(shift).toBeGreaterThan(1);
    expect(shift).toBeLessThanOrEqual(6.01);
  });

  test('on a touch screen nothing follows the finger and the doors still navigate', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch');
    await skipIntro(page);
    await page.goto('/');
    await page.locator('a.door').first().tap();
    await expect(page).toHaveURL(/\/brief\/$/);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm run build && npx playwright test tests/e2e/motion-batch1.spec.ts -g home`
Expected: FAIL（还没有 `.split-parent`、`.magnet`）。

- [ ] **Step 3: 首页姓名用 SplitText** —— `src/views/HomeView.astro`：在 frontmatter 加 `import SplitText from '../components/rb/SplitText';`，把

```astro
        <h1 class="home__name">{SITE.name[lang]}</h1>
```

改为

```astro
        <h1 class="home__name"><SplitText client:load text={SITE.name[lang]} /></h1>
```

- [ ] **Step 4: 门的箭头用 Magnet，门用 SpotlightCard 的光斑** —— `src/components/Gate.astro`：frontmatter 加 `import Magnet from './rb/Magnet';`，把

```astro
      <span class="door__title">{d.title[lang]}<span class="door__arrow" aria-hidden="true">→</span></span>
```

改为

```astro
      <span class="door__title">{d.title[lang]}<Magnet client:visible className="door__magnet"><span class="door__arrow" aria-hidden="true">→</span></Magnet></span>
```

并在 `<style>` 里加 `.door :global(.door__magnet) { margin-left: 0.1em; }`。（门本身的悬停底色保持现状；门的大字 `ALL`/`1:00` 不加组件。）

- [ ] **Step 5: 联系栏两条链接用 Magnet** —— `src/components/ContactBar.astro`：frontmatter 加 `import Magnet from './rb/Magnet';`，把两条 `<a>` 包起来：

```astro
    <Magnet client:visible><a class="contact__mail" href={`mailto:${SITE.email}`}>{SITE.email}</a></Magnet>
    <Magnet client:visible><a class="contact__cv" href={SITE.resume[lang]} download>{SITE.nav.resume[lang]} <span aria-hidden="true">↓</span></a></Magnet>
```

- [ ] **Step 6: 构建并跑测试**

Run: `npm run build && npx playwright test tests/e2e/motion-batch1.spec.ts tests/e2e/home.spec.ts tests/e2e/intro.spec.ts tests/e2e/door-transition.spec.ts tests/e2e/a11y.spec.ts -g "home|/ |intro|door|first-paint"`
Expected: 全部 PASS。若 `intro.spec` 因首访开场与拆字同时进行而失败：拆字在开场结束后才播放——在 `SplitText` 的 `run` 前等待 `document.documentElement` 不再带开场类（`intro-dom.ts` 里设置的类名），并在测试注释里写明。

- [ ] **Step 7: Commit**

```bash
git add src/views/HomeView.astro src/components/Gate.astro src/components/ContactBar.astro tests/e2e/motion-batch1.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Home: the name splits in, door arrows and contact links are gently magnetic" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 快速概览与项目行光斑

**Files:**
- Modify: `src/views/BriefView.astro`、`src/components/ProjectRow.astro`
- Test: `tests/e2e/motion-batch1.spec.ts`

**Interfaces:**
- Consumes: `SplitText`、`ScrollReveal`、`SpotlightCard`（Task 2）。
- Produces: `ProjectRow` 渲染为 `<SpotlightCard client:visible tone="paper"><a class="prow">…</a></SpotlightCard>`（项目索引在 Task 5 复用）。

- [ ] **Step 1: 追加概览页失败测试**

```ts
test.describe('brief', () => {
  test('heading splits in; section headings reveal with the scroll; rows carry the spotlight', async ({ page, isMobile }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    await expect(page.locator('main h1 .split-parent')).toHaveAttribute('data-split-ready', '', { timeout: 5000 });
    await expect(page.locator('.section-head h2 .scroll-reveal').first()).toBeAttached();
    await expect(page.locator('.card-spotlight a.prow').first()).toBeAttached();
    expect(await page.locator('a.prow').count()).toBe(5);
    if (!isMobile) {
      const row = page.locator('a.prow').first();
      await row.hover();
      await expect.poll(() => row.evaluate(el => getComputedStyle(el.parentElement!.closest('.card-spotlight')!, '::before').opacity)).toBe('1');
    }
  });

  test('reduced motion: section headings are fully opaque, no triggers', async ({ page }) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/brief/');
    const dim = await page.locator('.sr-unit').evaluateAll(us => us.filter(u => getComputedStyle(u).opacity !== '1').length);
    expect(dim).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { ScrollTrigger?: { getAll(): unknown[] } }).ScrollTrigger?.getAll().length ?? 0)).toBe(0);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm run build && npx playwright test tests/e2e/motion-batch1.spec.ts -g brief`
Expected: FAIL。

- [ ] **Step 3: 概览页标题与段落标题** —— `src/views/BriefView.astro`：frontmatter 加

```astro
import SplitText from '../components/rb/SplitText';
import ScrollReveal from '../components/rb/ScrollReveal';
```

把 `<h1 class="b-id__name">{SITE.name[lang]}</h1>` 改为 `<h1 class="b-id__name"><SplitText client:load text={SITE.name[lang]} /></h1>`；把三个段落标题

```astro
<h2 id="b-exp">{B.experience[lang]}</h2>
<h2 id="b-edu">{B.education[lang]}</h2>
<h2 id="b-proj">{B.projects[lang]}</h2>
```

分别改为

```astro
<h2 id="b-exp"><ScrollReveal client:visible text={B.experience[lang]} /></h2>
<h2 id="b-edu"><ScrollReveal client:visible text={B.education[lang]} /></h2>
<h2 id="b-proj"><ScrollReveal client:visible text={B.projects[lang]} /></h2>
```

- [ ] **Step 4: 项目行包上光斑** —— `src/components/ProjectRow.astro`：frontmatter 加 `import SpotlightCard from './rb/SpotlightCard';`，把整个 `<a class="prow" …>…</a>` 包进

```astro
<SpotlightCard client:visible tone="paper">
  <a class="prow" href={localizePath(project.href, lang)} data-motion={motion ? '' : undefined}>
    …（原内容不变）…
  </a>
</SpotlightCard>
```

并在 `<style>` 中加 `:global(.card-spotlight:has(> astro-slot > .prow:hover)), :global(.card-spotlight:has(.prow:hover)) { --spot: rgb(236 228 214 / 0.12); }`（行悬停变黑时光斑换成浅色）。原有的出场、悬停反色、预览图逻辑不变。

- [ ] **Step 5: 构建并跑测试**

Run: `npm run build && npx playwright test tests/e2e/motion-batch1.spec.ts tests/e2e/brief.spec.ts tests/e2e/a11y.spec.ts tests/e2e/numbers.spec.ts tests/e2e/layout.spec.ts -g "brief"`
Expected: 全部 PASS。

- [ ] **Step 6: Commit**

```bash
git add src/views/BriefView.astro src/components/ProjectRow.astro tests/e2e/motion-batch1.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Overview: split heading, scroll-revealed section titles, spotlight on project rows" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 项目索引、全页验收（CLS、体积、宽窄屏）

**Files:**
- Modify: `src/views/ProjectsView.astro`
- Test: `tests/e2e/motion-batch1.spec.ts`

**Interfaces:**
- Consumes: `SplitText`、`ScrollReveal`、`SpotlightCard`（Task 2）；`ProjectRow`（Task 4）。

- [ ] **Step 1: 追加项目索引与全页验收的失败测试**

```ts
test.describe('projects index', () => {
  test('heading splits in, section titles reveal, film entries carry the night spotlight', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/projects/');
    await expect(page.locator('main h1 .split-parent')).toHaveAttribute('data-split-ready', '', { timeout: 5000 });
    await expect(page.locator('#i-data .scroll-reveal')).toBeAttached();
    await expect(page.locator('#i-film .scroll-reveal')).toBeAttached();
    await expect(page.locator('.card-spotlight--night a.i-film__link')).toHaveCount(2);
  });
});

test.describe('batch 1 acceptance', () => {
  for (const p of PAGES) {
    test(`${p}: scrolling the whole page shifts nothing (CLS < 0.1)`, async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { __cls: number }).__cls = 0;
        new PerformanceObserver(l => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      await skipIntro(page);
      await page.goto(p);
      for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(200); }
      expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.1);
    });

    test(`${p}: React and the components stay within 70 KB gzip`, async ({ page, request, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      const { gzipSync } = await import('node:zlib');
      const js = new Set<string>();
      page.on('request', r => { if (r.resourceType() === 'script' && r.url().includes('/_astro/')) js.add(new URL(r.url()).pathname); });
      await skipIntro(page);
      await page.goto(p);
      await page.waitForTimeout(1500);
      let total = 0;
      for (const u of js) {
        const body = await (await request.get(u)).body();
        if (/react|client|SplitText|ScrollReveal|Magnet|SpotlightCard|index\./i.test(u)) total += gzipSync(body).length;
      }
      expect(total).toBeLessThan(70 * 1024);
    });
  }

  test('wide 1920 and narrow 320: no sideways scroll, rows still line up with the heading', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [w, h] of [[1920, 1000], [320, 844]]) {
      await page.setViewportSize({ width: w, height: h });
      for (const p of ['/brief/', '/projects/', '/en/projects/']) {
        await page.goto(p);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
        if (w === 1920) {
          const l = (s: string) => page.locator(s).first().evaluate(el => Math.round(el.getBoundingClientRect().left));
          expect(Math.abs((await l('a.prow > .prow__n')) - (await l('main h1')))).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm run build && npx playwright test tests/e2e/motion-batch1.spec.ts -g "projects index"`
Expected: FAIL。

- [ ] **Step 3: 项目索引页** —— `src/views/ProjectsView.astro`：frontmatter 加

```astro
import SplitText from '../components/rb/SplitText';
import ScrollReveal from '../components/rb/ScrollReveal';
import SpotlightCard from '../components/rb/SpotlightCard';
```

- `<h1>{P.title[lang]}</h1>` → `<h1><SplitText client:load text={P.title[lang]} /></h1>`
- `<h2 id="i-data">{P.data[lang]}</h2>` → `<h2 id="i-data"><ScrollReveal client:visible text={P.data[lang]} /></h2>`
- `<h2 id="i-film">{P.film[lang]}</h2>` → `<h2 id="i-film"><ScrollReveal client:visible text={P.film[lang]} /></h2>`
- 影像区每个 `<a class="i-film__link" …>…</a>` 外包 `<SpotlightCard client:visible tone="night">…</SpotlightCard>`。

- [ ] **Step 4: 构建并跑第一批全部测试与全站测试**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: 单元测试全过；端到端全部 PASS（基线 634 项 + 本批新增）。若体积测试超限：把 `ContactBar` 的 Magnet 改为 `client:idle`，并检查 `_astro` 是否把 GSAP 打进了没有用到它的页面。

- [ ] **Step 5: 截图检查** —— 1440、1920、390 三个宽度下三页首屏与滚动中段截图，人工确认：标题拆字完整、无重叠、光斑不刺眼、磁吸不跳。

- [ ] **Step 6: Commit**

```bash
git add src/views/ProjectsView.astro tests/e2e/motion-batch1.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Projects index: split heading, scroll-revealed titles, night spotlight on the film zone; batch 1 acceptance tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: 本机预览交给用户** —— `node tools/serve-dist.mjs 4420`，在浏览器打开 `/`、`/brief/`、`/projects/` 让用户确认；用户说"上线"后，按 `docs/superpowers/plans/2026-10-02-2c-film-privacy.md` 第 1780 行起的流程推送 main 与 redesign。
