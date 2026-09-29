# 2A 页面动效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 2A 已上线的四处页面加动效：SQL 页（关系图、事务进度带、查询结果落下、关键决策升起）、CSV 工具页（清洗过程、直方图、报错）、过程与运行子页（时间线、数字计数）、项目总目录（滑入、悬停色带与预览、背景大字）。原有内容不删。

**Architecture:** 所有"隐藏后再出现"的效果都由脚本给元素加类名才生效。没有脚本、脚本失败或开了减少动态效果时，页面就是现在的样子。时间与几何计算放在纯函数里（`txn-band.ts`、`scroll-progress.ts`、`countup.ts`），用单元测试锁定；DOM 脚本只负责写类名和 CSS 变量。事务进度带回放的是 `delivery-core.mjs` 里 `place()` / `refund()` 实际执行语句的顺序，失败步骤由触发器报错定位。

**Tech Stack:** Astro 7、TypeScript、Vitest、Playwright（Edge，测试服务器 `tools/serve-dist.mjs` 端口 4399）。

**Spec:** `docs/superpowers/specs/2026-09-28-campus-insights-and-motion-design.md` 第 8 节（旧页面动效）与第 9 节中对应的测试条目。

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；**不推送、不合并、不部署**。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。不要用裸 `git stash`。
- 原有内容一个字不删（spec §3、§8.5）。本计划唯一的文字增补：进度带多出"生成配送"一步、退款进度带、进度带的结果行与"按实际顺序回放"说明、关键决策前的序号（装饰，`::before` 生成）。
- 颜色只用 tokens 变量；直角、无阴影；悬停不改变尺寸。
- 所有动效在 `prefers-reduced-motion: reduce` 下关闭，直接显示终态；不自动循环；除滚动联动外单次动效 ≤ 约 0.6 秒。
- 隐藏类效果只在脚本加上 `.reveal` 之后才隐藏元素；没有脚本时一切可见。
- 触屏设备（`(hover: hover) and (pointer: fine)` 不成立）不显示悬停预览。
- 页面上关于作者本人的数字仍只来自 `src/data/facts.ts`；新增文字不含阿拉伯数字（序号由 CSS 计数器生成）。
- 现有测试不改断言（spec §8.5）；只允许追加断言。

## Review Focus

1. **动画进行中又操作**（CSV 页连续勾选、取消"去重/去空"；SQL 页在进度带回放时再下单）：终态与没有动画时完全一致，不留下划线行或卡住的进度状态 → Task 5 `rapid toggles end in the same table`，Task 3 `a new order restarts the band`。
2. **各种失败下单**（库存耗尽、份数超范围）在中英文页：进度带停在正确的步骤并显示"已回滚"或"未进入事务" → Task 3（库存耗尽、份数超范围，中英各一次）。
3. **减少动态效果**：关系图连线直接画满、关键决策与目录行直接可见、时间线全部点亮、CSV 行立即更新 → Task 2、5、6、7 各一条 reduced-motion 测试。
4. **没有脚本**：目录行、关键决策、关系图（原图片）全部可见 → Task 7 `without JavaScript everything is visible`（覆盖 SQL 页与目录）。
5. **触屏与窄屏**：没有悬停预览，背景大字不造成横向滚动 → Task 7 `touch devices get no preview`，外加全站 `layout.spec`。

---

## 设计决定（spec 授权"以源码为准"的地方）

- **下单步骤**：`place()` 的实际顺序是：校验份数（事务外）→ 查菜品 → 写订单 → 写明细（触发器 `reserve_stock` 校验价格快照并扣库存）→ 写支付（触发器 `verify_payment`）→ 写配送 → 提交。进度带五步为：创建订单 → 写明细 · 扣库存 → 登记支付 → 生成配送 → 提交事务。
- **失败定位**：`份数须为 1–20 的整数` → 未进入事务；`菜品不存在` → 第 1 步；`价格快照不一致`、`库存不足` → 第 2 步；`支付金额与明细不一致` → 第 3 步；其他 → 只显示"已回滚"。
- **退款三步**：找到订单 → 写退款（触发器校验状态与金额）→ 改状态 · 恢复库存（触发器 `apply_refund`）。`订单不存在` → 第 1 步；`仅未送达订单可取消退款`、`退款金额不一致` → 第 2 步。退款进度带是独立的第二条，首次退款时出现。
- **关系图**：现有插图有 6 个框（学生、商家与菜品、订单 / 明细、支付、配送、退款）和 5 条连线；内嵌版逐框出现（spec 写"8 张表"，以插图内容为准）。内嵌版由脚本替换正文里的图片，没有脚本时仍是原图片。

---

## 文件结构

```
src/scripts/scroll-progress.ts   scrollProgress()：元素穿过视口的进度（纯函数）
src/scripts/motion-dom.ts        reveal()、onScroll()：通用 DOM 动效工具
src/scripts/countup.ts           新增 countEvery()（所有数字一起滚动）
src/scripts/countup-dom.ts       initCountUp() 增加可选的文字函数参数
src/styles/base.css              .reveal 通用隐藏态
src/scripts/txn-band.ts          STEPS、BAND_TEXT、failedStep()、bandFrames()、playBand()
src/scripts/delivery-ui.ts       接入进度带；查询结果落下；行数滚动
src/components/CampusDemo.astro  两条进度带的标记与样式；结果行落下样式
src/components/RelationsDiagram.astro   内嵌的等价关系图 + 替换脚本
src/views/CampusView.astro       关键决策序号、升起、红色划过；放入 RelationsDiagram
src/scripts/lab-ui.ts            清洗过程动画、指标滚动、直方图生长、报错抖动
src/components/CsvLab.astro      对应样式
src/views/MethodView.astro       时间线与数字计数
public/assets/editorial/hris-flow.svg   git mv 自 legacy 并换色（目录预览图）
src/pages/assets/previews/campus-insights.svg.ts   构建时生成的进阶版热力图预览
src/data/site.ts                 ProjectEntry 新增可选 preview
src/components/ProjectRow.astro  滑入、色带、序号翻动、跟随鼠标的预览
src/views/ProjectsView.astro     背景大字
tests/unit/{scroll-progress,txn-band}.test.ts, tests/unit/countup.test.ts（追加）, tests/unit/assets.test.ts（追加）
tests/e2e/motion-campus.spec.ts, motion-csv.spec.ts, motion-method.spec.ts, motion-index.spec.ts
```

---

### Task 1: 通用工具——滚动进度、显现、全数字计数

**Files:**
- Create: `src/scripts/scroll-progress.ts`, `src/scripts/motion-dom.ts`
- Modify: `src/scripts/countup.ts`, `src/scripts/countup-dom.ts`, `src/styles/base.css`
- Test: `tests/unit/scroll-progress.test.ts`, `tests/unit/countup.test.ts`（追加）

**Interfaces:**
- Produces:
  - `scrollProgress(top: number, height: number, viewport: number, start = 0.85, end = 0.5): number`：元素顶边到达视口 `start` 处为 0，底边到达视口 `end` 处为 1，夹在 [0, 1]。
  - `reveal(els: Iterable<Element>, staggerMs = 0): void`：减少动态效果或无 IntersectionObserver 时什么都不做；否则给元素加 `.reveal` 和 `--d`（第 i 个为 i × staggerMs 毫秒），进入视口 10% 后加 `.is-in`。
  - `onScroll(update: () => void): void`：rAF 节流的 scroll + resize 监听，并立即调用一次。
  - `countEvery(final: string, k: number): string`：文本中每个数字按 k 缩放，格式不变；含 `:` 或 k ≥ 1 时原样返回。
  - `initCountUp(els, text = countText)`：第二个参数可换成 `countEvery`。
  - CSS：`.reveal:not(.is-in)` 为隐藏态（透明、下移 18px），`.reveal` 带 0.6 秒过渡与 `var(--d)` 延迟。

- [ ] **Step 1: 写失败的测试**

`tests/unit/scroll-progress.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { scrollProgress } from '../../src/scripts/scroll-progress';

describe('scrollProgress', () => {
  const vh = 1000, h = 400;
  it('is 0 until the top reaches 85% of the viewport', () => {
    expect(scrollProgress(900, h, vh)).toBe(0);
    expect(scrollProgress(850, h, vh)).toBe(0);
  });
  it('is 1 once the bottom has reached the middle of the viewport', () => {
    expect(scrollProgress(100, h, vh)).toBe(1);
    expect(scrollProgress(-500, h, vh)).toBe(1);
  });
  it('rises linearly in between', () => {
    // from: top 850 → 0; to: top 100 → 1
    expect(scrollProgress(475, h, vh)).toBeCloseTo(0.5);
  });
});
```

在 `tests/unit/countup.test.ts` 末尾追加：

```ts
import { countEvery } from '../../src/scripts/countup';

describe('countEvery', () => {
  it('scales every number in the text', () => {
    expect(countEvery('13 行 / 2 个空白 / 1 行重复', 0.5)).toBe('7 行 / 1 个空白 / 1 行重复');
    expect(countEvery('mean 15.2 / min 8 / max 22', 0.5)).toBe('mean 7.6 / min 4 / max 11');
  });
  it('ends exactly on the final text and leaves clock times alone', () => {
    expect(countEvery('均值 15.2 / 最小 8 / 最大 22', 1)).toBe('均值 15.2 / 最小 8 / 最大 22');
    expect(countEvery('11:00–13:00', 0.2)).toBe('11:00–13:00');
  });
});
```

（`import` 行并入文件顶部已有的 import。）

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/scroll-progress.test.ts tests/unit/countup.test.ts`
Expected: FAIL：找不到 `scroll-progress`；`countEvery` 不是函数。

- [ ] **Step 3: 实现**

`src/scripts/scroll-progress.ts`：

```ts
/** How far an element has travelled through the viewport: 0 when its top reaches `start` (fraction of the viewport height),
 *  1 when its bottom reaches `end`, clamped in between. */
export function scrollProgress(top: number, height: number, viewport: number, start = 0.85, end = 0.5): number {
  const from = viewport * start;
  const to = viewport * end - height;
  return Math.min(1, Math.max(0, (from - top) / Math.max(1, from - to)));
}
```

`src/scripts/motion-dom.ts`：

```ts
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Hides each element (.reveal) and shows it (.is-in) once it is 10% into the viewport.
 *  Does nothing with reduced motion or without IntersectionObserver, so content is never left hidden. */
export function reveal(els: Iterable<Element>, staggerMs = 0): void {
  if (reduced() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  let i = 0;
  for (const el of els) {
    (el as HTMLElement).style.setProperty('--d', `${i++ * staggerMs}ms`);
    el.classList.add('reveal');
    io.observe(el);
  }
}

/** Calls `update` once now and then at most once per frame while scrolling or resizing. */
export function onScroll(update: () => void): void {
  let frame = 0;
  const run = () => { frame = 0; update(); };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(run); }, { passive: true });
  addEventListener('resize', run);
  update();
}
```

`src/scripts/countup.ts` 改为（`countText` 行为不变，抽出共用的缩放函数）：

```ts
const NUMBER = /\d[\d,]*(?:\.\d+)?/;

/** One number string scaled by k, keeping its decimals and thousands separators. */
function scale(digits: string, k: number): string {
  const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
  const v = Number(digits.replace(/,/g, '')) * Math.max(0, k);
  return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
}

/** Text at fraction k (0–1) of a count-up to `final`: the first number scales, its format and the surrounding text stay. */
export function countText(final: string, k: number): string {
  if (k >= 1 || final.includes(':')) return final;
  return final.replace(NUMBER, m => scale(m, k));
}

/** Like countText, but every number in the text counts up together. */
export function countEvery(final: string, k: number): string {
  if (k >= 1 || final.includes(':')) return final;
  return final.replace(new RegExp(NUMBER, 'g'), m => scale(m, k));
}
```

`src/scripts/countup-dom.ts`：函数签名改为 `export function initCountUp(els: Iterable<HTMLElement>, text: (final: string, k: number) => string = countText): void`，循环里的 `countText(final, …)` 改为 `text(final, …)`。

`src/styles/base.css`：在 `[data-rise]` 两行之后加入：

```css
/* Scripted reveal (motion-dom.ts): hidden only after a script adds .reveal, so content without JS stays visible. */
.reveal { transition: opacity 0.6s var(--ease) var(--d, 0ms), transform 0.6s var(--ease) var(--d, 0ms); }
.reveal:not(.is-in) { opacity: 0; transform: translateY(18px); }
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/scroll-progress.test.ts tests/unit/countup.test.ts`
Expected: PASS（scroll-progress 3 个；countup 共 5 个）。

Run: `npm test`
Expected: 全部 PASS（`countText` 的原有 3 个测试证明重构未改变行为）。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/scroll-progress.ts src/scripts/motion-dom.ts src/scripts/countup.ts src/scripts/countup-dom.ts src/styles/base.css tests/unit/scroll-progress.test.ts tests/unit/countup.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Motion helpers: scroll progress, scripted reveal, count every number" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: SQL 页——活的关系图与关键决策

**Files:**
- Create: `src/components/RelationsDiagram.astro`
- Modify: `src/views/CampusView.astro`
- Test: `tests/e2e/motion-campus.spec.ts`

**Interfaces:**
- Consumes: `scrollProgress`、`reveal`、`onScroll`（Task 1）。
- Produces: `figure.rel[data-relations]`（替换正文里的 `<p><img src=".../delivery-relations.svg"></p>`），内含 6 个 `g[data-box]`、5 条 `path.rel-wire`、5 个 `path.rel-head`；CSS 变量 `--p`（连线进度）。关键决策的 6 个 `h3` 带类 `decision`。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/motion-campus.spec.ts`：

```ts
import { test, expect, type Page } from '@playwright/test';

const CAMPUS = '/projects/campus-delivery/';
const offset = (page: Page) => page.locator('[data-relations] .rel-wire').first().evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset));
async function placeTop(page: Page, sel: string, fraction: number) {
  await page.locator(sel).first().evaluate((el, f) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * f), fraction);
}

test.describe('relations diagram', () => {
  test('the picture becomes a live diagram with the same description', async ({ page }) => {
    await page.goto(CAMPUS);
    const fig = page.locator('.prose [data-relations]');
    await expect(fig).toHaveCount(1);
    await expect(page.locator('.prose img[src$="delivery-relations.svg"]')).toHaveCount(0);
    await expect(fig.locator('svg')).toHaveAttribute('aria-label', '以订单为中心的业务关系');
    await expect(fig.locator('[data-box]')).toHaveCount(6);
    await expect(fig.locator('.rel-wire')).toHaveCount(5);
  });

  test('wires draw as the diagram scrolls through the screen', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto(CAMPUS);
    await placeTop(page, '[data-relations]', 0.8);
    await expect.poll(() => offset(page)).toBeGreaterThan(0.8);
    await placeTop(page, '[data-relations]', 0.2);
    await expect.poll(() => offset(page)).toBeLessThan(0.3);
    await expect(page.locator('[data-relations] [data-box]').last()).toHaveClass(/is-in/);
  });

  test('reduced motion: wires fully drawn, boxes visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(CAMPUS);
    expect(await offset(page)).toBe(0);
    await expect(page.locator('[data-relations] [data-box].reveal')).toHaveCount(0);
  });
});

test.describe('key decisions', () => {
  test('six numbered decisions rise in as they scroll into view', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto(CAMPUS);
    const h = page.locator('.prose h3.decision');
    await expect(h).toHaveCount(6);
    expect(await h.first().evaluate(el => getComputedStyle(el, '::before').content)).not.toBe('none');
    await expect(h.first()).not.toHaveClass(/is-in/);
    await h.first().scrollIntoViewIfNeeded();
    await expect(h.first()).toHaveClass(/is-in/);
  });

  test('English page: same structure, English label', async ({ page }) => {
    await page.goto(`/en${CAMPUS}`);
    await expect(page.locator('.prose [data-relations] svg')).toHaveAttribute('aria-label', 'Order-centred relationships (diagram in Chinese)');
    await expect(page.locator('.prose h3.decision')).toHaveCount(6);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/motion-campus.spec.ts`
Expected: FAIL：`[data-relations]` 数量为 0，`h3.decision` 数量为 0。

- [ ] **Step 3: 关系图组件**

`src/components/RelationsDiagram.astro`（几何与文字逐项取自 `public/assets/editorial/delivery-relations.svg`；箭头改为独立小路径，随连线画完才出现）：

```astro
---
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
// Same alt text as the Markdown image this replaces.
const label = lang === 'zh' ? '以订单为中心的业务关系' : 'Order-centred relationships (diagram in Chinese)';
const boxes = [
  { x: 46, y: 110, w: 240, h: 96, fill: 'card', title: '学生', sub: '下单人与送达地址' },
  { x: 46, y: 310, w: 240, h: 96, fill: 'card', title: '商家与菜品', sub: '菜单、数量与库存' },
  { x: 409, y: 163, w: 276, h: 165, fill: 'ink', title: '订单 / 明细', sub: '金额 · 状态 · 数量', note: '一致的事务边界' },
  { x: 811, y: 79, w: 243, h: 96, fill: 'card', title: '支付', sub: '金额记录' },
  { x: 811, y: 214, w: 243, h: 96, fill: 'tint', title: '配送', sub: '履约状态' },
  { x: 811, y: 349, w: 243, h: 96, fill: 'card', title: '退款', sub: '反向冲销' },
];
const wires = [
  { d: 'M286 158 H347.5 V245 H409', end: [409, 245] },
  { d: 'M286 358 H347.5 V245 H409', end: [409, 245] },
  { d: 'M685 245 H748 V127 H811', end: [811, 127] },
  { d: 'M685 245 H748 V262 H811', end: [811, 262] },
  { d: 'M685 245 H748 V397 H811', end: [811, 397] },
];
---
<template id="relations-tpl">
  <figure class="rel" data-relations>
    <svg viewBox="0 0 1100 500" role="img" aria-label={label}>
      <text class="rel-head-text" x="46" y="55">ONE ORDER, CONNECTED RECORDS</text>
      {wires.map(w => <path class="rel-wire" d={w.d} pathLength="1" />)}
      {wires.map(w => <path class="rel-head" d="M-9 -5 0 0-9 5" transform={`translate(${w.end[0]} ${w.end[1]})`} />)}
      {boxes.map((b, i) => (
        <g data-box class={`rel-box rel-box--${b.fill}`} style={`--i:${i}`}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="12" />
          <text class="t1" x={b.x + (b.fill === 'ink' ? 29 : 22)} y={b.y + (b.fill === 'ink' ? 47 : 38)}>{b.title}</text>
          <text class="t2" x={b.x + (b.fill === 'ink' ? 29 : 22)} y={b.y + (b.fill === 'ink' ? 93 : 69)}>{b.sub}</text>
          {b.note && <text class="t3" x={b.x + 29} y={b.y + 136}>{b.note}</text>}
        </g>
      ))}
    </svg>
  </figure>
</template>
<script>
  import { scrollProgress } from '../scripts/scroll-progress';
  import { reveal, onScroll } from '../scripts/motion-dom';
  const tpl = document.querySelector<HTMLTemplateElement>('#relations-tpl');
  const img = document.querySelector<HTMLImageElement>('.prose img[src$="delivery-relations.svg"]');
  if (tpl && img) {
    const fig = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    // Markdown wraps the image in its own paragraph; replace the paragraph so the figure is not nested in a <p>.
    const target = img.parentElement?.tagName === 'P' && img.parentElement.childElementCount === 1 ? img.parentElement : img;
    target.replaceWith(fig);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal(fig.querySelectorAll('[data-box]'), 120);
      onScroll(() => {
        const r = fig.getBoundingClientRect();
        fig.style.setProperty('--p', scrollProgress(r.top, r.height, innerHeight).toFixed(3));
      });
    }
  }
</script>
<style>
  .rel { margin: 8px 0 20px; max-width: 900px; --p: 1; }
  svg { display: block; width: 100%; height: auto; font-family: Arial, 'Microsoft YaHei', sans-serif; }
  .rel-head-text { font-size: 30px; fill: var(--ink); }
  .rel-wire { fill: none; stroke: var(--mute); stroke-width: 2; stroke-dasharray: 1; stroke-dashoffset: calc(1 - var(--p)); }
  .rel-head { fill: none; stroke: var(--mute); stroke-width: 1.5; opacity: clamp(0, (var(--p) - 0.9) * 10, 1); }
  .rel-box rect { fill: #fff; }
  .rel-box--ink rect { fill: var(--ink); }
  .rel-box--tint rect { fill: #f6d5ca; }
  .t1 { font-size: 24px; fill: var(--ink); }
  .t2 { font-size: 18px; fill: var(--mute); }
  .rel-box--ink .t1 { font-size: 29px; fill: #f6d5ca; }
  .rel-box--ink .t2 { font-size: 21px; fill: #fff; }
  .t3 { font-size: 18px; fill: #d9d7cf; }
  .rel-box { transition: opacity 0.5s var(--ease) var(--d, 0ms), transform 0.5s var(--ease) var(--d, 0ms); }
  .rel-box:global(.reveal):not(:global(.is-in)) { opacity: 0; transform: translateY(14px); }
</style>
```

（`#fff`、`#f6d5ca`、`#d9d7cf` 是原插图的颜色，`tests/unit/assets.test.ts` 已把它们列为允许的调色板颜色。）

- [ ] **Step 4: 接入 SQL 页并加关键决策**

`src/views/CampusView.astro`：导入 `RelationsDiagram`，放在 `<CampusDemo slot="demo" … />` 之后（模板不显示，由脚本搬进正文）：

```astro
  <RelationsDiagram lang={lang} />
```

在文件末尾加入：

```astro
<script>
  import { reveal } from '../scripts/motion-dom';
  // The six h3 in this page's Markdown are the key decisions; number them and let each rise with its paragraph.
  const heads = [...document.querySelectorAll<HTMLElement>('article.prose h3')];
  heads.forEach(h => h.classList.add('decision'));
  reveal(heads.flatMap(h => (h.nextElementSibling ? [h, h.nextElementSibling] : [h])), 0);
</script>
<style>
  :global(article.prose) { counter-reset: decision; }
  :global(article.prose h3.decision)::before {
    counter-increment: decision;
    content: counter(decision, decimal-leading-zero);
    display: inline-block; margin-right: 0.6em; padding: 0 0.2em;
    font: 700 0.95em/1.2 var(--font-display); color: var(--red-text);
    background: linear-gradient(var(--red), var(--red)) no-repeat left / 0% 100%;
  }
  :global(article.prose h3.decision.is-in)::before { animation: decision-sweep 0.7s var(--ease) 0.15s both; }
  @keyframes decision-sweep {
    0% { background-size: 0% 100%; background-position: left; }
    45% { background-size: 100% 100%; background-position: left; color: var(--paper); }
    100% { background-size: 0% 100%; background-position: right; color: var(--red-text); }
  }
</style>
```

- [ ] **Step 5: 运行，确认通过**

Run: `npx playwright test tests/e2e/motion-campus.spec.ts tests/e2e/campus.spec.ts tests/e2e/smoke.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/components/RelationsDiagram.astro src/views/CampusView.astro tests/e2e/motion-campus.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "SQL page: live relations diagram and numbered key decisions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: SQL 页——事务进度带

**Files:**
- Create: `src/scripts/txn-band.ts`
- Modify: `src/scripts/delivery-ui.ts`, `src/components/CampusDemo.astro`
- Test: `tests/unit/txn-band.test.ts`, `tests/e2e/motion-campus.spec.ts`（追加）

**Interfaces:**
- Consumes: `DELIVERY_ERRORS`（`tool-i18n.ts`）。
- Produces:
  - `type Kind = 'place' | 'refund'`，`type StepState = 'idle' | 'on' | 'fail'`，`type Outcome = 'committed' | 'rolled-back' | 'rejected'`，`interface Frame { at: number; states: StepState[]; result: Outcome | '' }`
  - `STEP_MS = 110`，`STEPS: Record<Kind, Bi[]>`（下单 5 步、退款 3 步），`BAND_TEXT: Record<Lang, { committed; rolledBack; rejected; replay; refundTitle: string }>`
  - `failedStep(kind, message): number | null`（-1 = 未进入事务；null = 无法定位）
  - `bandFrames(kind, failAt?: number | null): Frame[]`（`undefined` = 成功）
  - `playBand(band: HTMLElement, kind: Kind, failAt: number | null | undefined, lang: Lang): void`
  - DOM：`div.band[data-band="place"|"refund"]`，内含 `li[data-step][data-state]`、`[data-band-result]`；退款带初始 `hidden`。

- [ ] **Step 1: 写失败的单元测试**

`tests/unit/txn-band.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { failedStep, bandFrames, STEPS, STEP_MS } from '../../src/scripts/txn-band';

describe('failedStep', () => {
  it('maps each trigger or core error to the step that raised it, in either language', () => {
    expect(failedStep('place', '份数须为 1–20 的整数')).toBe(-1);
    expect(failedStep('place', '菜品不存在')).toBe(0);
    expect(failedStep('place', '库存不足')).toBe(1);
    expect(failedStep('place', 'Not enough stock')).toBe(1);
    expect(failedStep('place', '价格快照不一致')).toBe(1);
    expect(failedStep('place', 'The payment does not match the order items')).toBe(2);
    expect(failedStep('refund', '订单不存在')).toBe(0);
    expect(failedStep('refund', 'Only undelivered orders can be cancelled and refunded')).toBe(1);
    expect(failedStep('place', 'something else')).toBeNull();
  });
});

describe('bandFrames', () => {
  const last = <T,>(a: T[]) => a[a.length - 1];

  it('success lights every step in order, then commits', () => {
    const f = bandFrames('place');
    expect(f).toHaveLength(STEPS.place.length + 1);
    expect(f[0].states).toEqual(['on', 'idle', 'idle', 'idle', 'idle']);
    expect(f[2].at).toBe(2 * STEP_MS);
    expect(last(f)).toEqual({ at: 5 * STEP_MS, states: ['on', 'on', 'on', 'on', 'on'], result: 'committed' });
  });

  it('a failure lights up to the failing step, marks it, undoes the rest and rolls back', () => {
    const f = bandFrames('place', 1);
    expect(f.map(x => x.states)).toEqual([
      ['on', 'idle', 'idle', 'idle', 'idle'],
      ['on', 'fail', 'idle', 'idle', 'idle'],
      ['idle', 'fail', 'idle', 'idle', 'idle'],
      ['idle', 'fail', 'idle', 'idle', 'idle'],
    ]);
    expect(last(f).result).toBe('rolled-back');
    expect(f.slice(0, -1).every(x => x.result === '')).toBe(true);
  });

  it('a failure at the first step fails it at once and rolls back', () => {
    expect(bandFrames('refund', 0)).toEqual([
      { at: 0, states: ['fail', 'idle', 'idle'], result: '' },
      { at: STEP_MS, states: ['fail', 'idle', 'idle'], result: 'rolled-back' },
    ]);
  });

  it('input rejected before the transaction lights nothing', () => {
    expect(bandFrames('place', -1)).toEqual([{ at: 0, states: ['idle', 'idle', 'idle', 'idle', 'idle'], result: 'rejected' }]);
  });

  it('an unplaceable error just rolls back', () => {
    expect(bandFrames('place', null)).toEqual([{ at: 0, states: ['idle', 'idle', 'idle', 'idle', 'idle'], result: 'rolled-back' }]);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/txn-band.test.ts`
Expected: FAIL，找不到 `../../src/scripts/txn-band`。

- [ ] **Step 3: 实现 `txn-band.ts`**

```ts
import type { Bi, Lang } from '../i18n';
import { DELIVERY_ERRORS } from './tool-i18n';

export type Kind = 'place' | 'refund';
export type StepState = 'idle' | 'on' | 'fail';
export type Outcome = 'committed' | 'rolled-back' | 'rejected';
export interface Frame { at: number; states: StepState[]; result: Outcome | '' }

export const STEP_MS = 110;

/** The statements place() and refund() in delivery-core.mjs run, in their real order. */
export const STEPS: Record<Kind, Bi[]> = {
  place: [
    { zh: '创建订单', en: 'Create order' },
    { zh: '写明细 · 扣库存', en: 'Add items · deduct stock' },
    { zh: '登记支付', en: 'Record payment' },
    { zh: '生成配送', en: 'Create delivery' },
    { zh: '提交事务', en: 'Commit' },
  ],
  refund: [
    { zh: '找到订单', en: 'Find the order' },
    { zh: '写退款（校验状态与金额）', en: 'Write the refund (status and amount checked)' },
    { zh: '改状态 · 恢复库存', en: 'Mark refunded · restore stock' },
  ],
};

export const BAND_TEXT: Record<Lang, { committed: string; rolledBack: string; rejected: string; replay: string; refundTitle: string }> = {
  zh: { committed: '已提交', rolledBack: '已回滚：整笔事务撤销', rejected: '未进入事务：输入校验未通过', replay: '按事务里语句的实际顺序回放。', refundTitle: '取消退款的事务' },
  en: { committed: 'Committed', rolledBack: 'Rolled back: the whole transaction was undone', rejected: 'Never started: the input failed validation', replay: 'Replayed in the order the transaction runs its statements.', refundTitle: 'The refund transaction' },
};

const FAIL_AT: Record<Kind, Record<string, number>> = {
  place: { '份数须为 1–20 的整数': -1, 菜品不存在: 0, 价格快照不一致: 1, 库存不足: 1, 支付金额与明细不一致: 2 },
  refund: { 订单不存在: 0, 仅未送达订单可取消退款: 1, 退款金额不一致: 1 },
};

/** Which step raised an error (-1: rejected before the transaction began; null: cannot tell). Accepts the English translations too. */
export function failedStep(kind: Kind, message: string): number | null {
  const zh = DELIVERY_ERRORS.find(([z, en]) => typeof z === 'string' && en === message)?.[0];
  const key = typeof zh === 'string' ? zh : message;
  return key in FAIL_AT[kind] ? FAIL_AT[kind][key] : null;
}

/** Band states over time. failAt undefined = success. */
export function bandFrames(kind: Kind, failAt?: number | null): Frame[] {
  const n = STEPS[kind].length;
  const states = (fn: (j: number) => StepState) => Array.from({ length: n }, (_, j) => fn(j));
  if (failAt === undefined) {
    const lit = Array.from({ length: n }, (_, i): Frame => ({ at: i * STEP_MS, states: states(j => (j <= i ? 'on' : 'idle')), result: '' }));
    return [...lit, { at: n * STEP_MS, states: states(() => 'on'), result: 'committed' }];
  }
  if (failAt === null) return [{ at: 0, states: states(() => 'idle'), result: 'rolled-back' }];
  if (failAt < 0) return [{ at: 0, states: states(() => 'idle'), result: 'rejected' }];
  const f = Math.min(failAt, n - 1);
  const failed = (lit: number) => states(j => (j === f ? 'fail' : j < lit ? 'on' : 'idle'));
  const frames: Frame[] = [];
  for (let i = 0; i < f; i++) frames.push({ at: i * STEP_MS, states: states(j => (j <= i ? 'on' : 'idle')), result: '' });
  frames.push({ at: f * STEP_MS, states: failed(f), result: '' });
  for (let k = 1; k <= f; k++) frames.push({ at: (f + k) * STEP_MS, states: failed(f - k), result: '' });
  frames.push({ at: (2 * f + 1) * STEP_MS, states: failed(0), result: 'rolled-back' });
  return frames;
}

/** Replays a transaction on a band; a newer replay cancels an older one. Reduced motion shows the end state at once. */
export function playBand(band: HTMLElement, kind: Kind, failAt: number | null | undefined, lang: Lang): void {
  const items = [...band.querySelectorAll<HTMLElement>('[data-step]')];
  const result = band.querySelector<HTMLElement>('[data-band-result]')!;
  const T = BAND_TEXT[lang];
  const label: Record<Outcome, string> = { committed: T.committed, 'rolled-back': T.rolledBack, rejected: T.rejected };
  const run = String(Number(band.dataset.run ?? '0') + 1);
  band.dataset.run = run;
  band.hidden = false;
  const apply = (f: Frame) => {
    f.states.forEach((s, i) => { if (items[i]) items[i].dataset.state = s; });
    band.dataset.result = f.result;
    result.textContent = f.result ? label[f.result] : '';
  };
  const frames = bandFrames(kind, failAt);
  apply({ at: 0, states: frames[0].states.map(() => 'idle'), result: '' });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(frames[frames.length - 1]); return; }
  for (const f of frames) setTimeout(() => { if (band.dataset.run === run) apply(f); }, f.at);
}
```

Run: `npx vitest run tests/unit/txn-band.test.ts`
Expected: PASS（6 个测试）。

- [ ] **Step 4: 写失败的端到端测试**（追加到 `tests/e2e/motion-campus.spec.ts`）

```ts
for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`transaction band (${lang})`, () => {
    const status = (page: Page) => page.locator('#order-status');
    const band = (page: Page) => page.locator('[data-band="place"]');
    async function ready(page: Page) {
      await page.goto(`${prefix}${CAMPUS}`);
      await page.locator('#order-form').scrollIntoViewIfNeeded();
      await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
    }

    test('a placed order lights all five steps and commits', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await page.locator('#place-order').click();
      await expect(band(page)).toHaveAttribute('data-result', 'committed');
      await expect(band(page).locator('[data-step][data-state="on"]')).toHaveCount(5);
    });

    test('running out of stock fails at "items · stock" and rolls back', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await page.locator('#quantity').fill('20');
      for (let i = 0; i < 8; i++) {
        const before = (await status(page).textContent()) ?? '';
        await page.locator('#place-order').click();
        await expect(status(page)).not.toHaveText(before);
        if ((await status(page).textContent())!.includes(lang === 'zh' ? '库存不足' : 'Not enough stock')) break;
      }
      await expect(status(page)).toContainText(lang === 'zh' ? '库存不足' : 'Not enough stock');
      await expect(band(page)).toHaveAttribute('data-result', 'rolled-back');
      await expect(band(page).locator('[data-step]').nth(1)).toHaveAttribute('data-state', 'fail');
      await expect(band(page).locator('[data-step]').nth(0)).toHaveAttribute('data-state', 'idle');
    });

    test('an out-of-range quantity never enters the transaction', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await page.locator('#quantity').evaluate(el => { (el as HTMLInputElement).removeAttribute('max'); (el as HTMLInputElement).value = '25'; });
      await page.locator('#place-order').click();
      await expect(band(page)).toHaveAttribute('data-result', 'rejected');
      await expect(band(page).locator('[data-state="on"], [data-state="fail"]')).toHaveCount(0);
    });

    test('a refund plays its own three-step band', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await expect(page.locator('[data-band="refund"]')).toBeHidden();
      await page.locator('[data-refund]').first().click();
      const refund = page.locator('[data-band="refund"]');
      await expect(refund).toBeVisible();
      await expect(refund).toHaveAttribute('data-result', 'committed');
      await expect(refund.locator('[data-step][data-state="on"]')).toHaveCount(3);
    });
  });
}

test('a new order restarts the band', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(CAMPUS);
  await page.locator('#order-form').scrollIntoViewIfNeeded();
  await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
  await page.locator('#place-order').click();
  await expect(page.locator('#place-order')).toBeEnabled();
  await page.locator('#place-order').click();
  await expect(page.locator('[data-band="place"]')).toHaveAttribute('data-result', 'committed');
  await expect(page.locator('[data-band="place"] [data-state="fail"]')).toHaveCount(0);
});

test('reduced motion shows the band\'s end state at once', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(CAMPUS);
  await page.locator('#order-form').scrollIntoViewIfNeeded();
  await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
  await page.locator('#place-order').click();
  await expect(page.locator('[data-band="place"]')).toHaveAttribute('data-result', 'committed', { timeout: 1000 });
});
```

Run: `npx playwright test tests/e2e/motion-campus.spec.ts -g "band"`
Expected: FAIL，`[data-band="place"]` 不存在。

- [ ] **Step 5: 进度带标记与样式**

`src/components/CampusDemo.astro`：
1. 在 frontmatter 导入：`import { STEPS, BAND_TEXT } from '../scripts/txn-band';`，并在 `const L = TEXT[lang];` 下一行加 `const B = BAND_TEXT[lang];`。
2. 从 `TEXT.zh` 与 `TEXT.en` 中删去 `flow: [...]` 字段（文字已移入 `STEPS.place`，并按实际顺序补上"生成配送"）。
3. 把 `<ol class="flow__steps">{L.flow.map(s => <li>{s}</li>)}</ol>` 替换为：

```astro
    <div class="band" data-band="place" data-result="">
      <ol class="flow__steps">{STEPS.place.map(s => <li data-step data-state="idle">{s[lang]}</li>)}</ol>
      <p class="band__result" data-band-result aria-hidden="true"></p>
      <p class="meta band__note">{B.replay}</p>
    </div>
```

4. 在"订单流水"卡片里，`<p id="order-status" …>` 之后插入退款进度带：

```astro
        <div class="band band--refund" data-band="refund" data-result="" hidden>
          <p class="band__title">{B.refundTitle}</p>
          <ol class="flow__steps">{STEPS.refund.map(s => <li data-step data-state="idle">{s[lang]}</li>)}</ol>
          <p class="band__result" data-band-result aria-hidden="true"></p>
        </div>
```

5. `<style>` 中，把 `.flow__steps { … grid-template-columns: repeat(4, 1fr); … }` 改为 `repeat(5, 1fr)`，并在 `.flow__steps li::before` 之后加入：

```css
  .flow__steps li { transition: border-color 0.2s var(--ease), background-color 0.2s var(--ease), color 0.2s var(--ease); }
  .flow__steps li[data-state='on'] { border-top-color: var(--red); }
  .flow__steps li[data-state='fail'] { border-top-color: var(--red-text); background: var(--red-text); color: #fff; }
  .flow__steps li[data-state='fail']::before { color: #fff; }
  .band__result { min-height: 1.6em; font-weight: 700; font-size: 14px; }
  .band[data-result='committed'] .band__result { color: var(--ink); }
  .band[data-result='rolled-back'] .band__result, .band[data-result='rejected'] .band__result { color: var(--red-text); }
  .band__note { margin-bottom: 12px; }
  .band--refund { margin: 6px 0 10px; }
  .band--refund .flow__steps { grid-template-columns: repeat(3, 1fr); margin: 6px 0; }
  .band__title { font-size: 13px; font-weight: 500; color: var(--mute); }
```

并在 `@media (max-width: 900px)` 块里把 `.flow__steps { grid-template-columns: 1fr 1fr; }` 保留不变（窄屏两列，第五步换行）。

- [ ] **Step 6: 接入 `delivery-ui.ts`**

1. 顶部导入：`import { playBand, failedStep } from './txn-band';`
2. 在 `const controls = [...]` 之后加：

```ts
  const placeBand = root.querySelector<HTMLElement>('[data-band="place"]');
  const refundBand = root.querySelector<HTMLElement>('[data-band="refund"]');
  /** Errors that mean the operation was never attempted: nothing to replay. */
  const notAttempted = (msg: string) => msg === T.busy || msg === T.loadFailed;
```

3. `refundOrder` 改为：

```ts
  async function refundOrder(id: number) {
    try {
      await request('refund', { order: id });
      if (refundBand) playBand(refundBand, 'refund', undefined, lang);
      $('order-status').textContent = T.refunded(id);
      await run();
    } catch (e) {
      const msg = (e as Error).message;
      if (refundBand && !notAttempted(msg)) playBand(refundBand, 'refund', failedStep('refund', msg), lang);
      $('order-status').textContent = msg;
    }
  }
```

4. `order-form` 的 `onsubmit` 改为：

```ts
  $<HTMLFormElement>('order-form').onsubmit = async e => {
    e.preventDefault();
    try {
      const data = await request('place', { input: { student: Number(student.value), dish: Number($<HTMLSelectElement>('dish').value), quantity: Number($<HTMLInputElement>('quantity').value) } });
      if (placeBand) playBand(placeBand, 'place', undefined, lang);
      $('order-status').textContent = T.placed(data.order!); await run();
    } catch (err) {
      const msg = (err as Error).message;
      if (placeBand && !notAttempted(msg)) playBand(placeBand, 'place', failedStep('place', msg), lang);
      $('order-status').textContent = T.placeFailed(msg);
    }
  };
```

- [ ] **Step 7: 运行，确认通过**

Run: `npx vitest run tests/unit/txn-band.test.ts && npx playwright test tests/e2e/motion-campus.spec.ts tests/e2e/campus.spec.ts tests/e2e/numbers.spec.ts tests/e2e/a11y.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add src/scripts/txn-band.ts src/scripts/delivery-ui.ts src/components/CampusDemo.astro tests/unit/txn-band.test.ts tests/e2e/motion-campus.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "SQL page: transaction bands replay place and refund in real statement order, failing at the step that raised" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: SQL 页——查询结果落下与行数滚动

**Files:**
- Modify: `src/scripts/delivery-ui.ts`, `src/components/CampusDemo.astro`
- Test: `tests/e2e/motion-campus.spec.ts`（追加）

**Interfaces:**
- Consumes: `countText`（`countup.ts`）。
- Produces: 结果表前 20 行带类 `drop` 和 `--i`；成功时 `#sql-status` 内为 `<span class="sr">最终文字</span><span aria-hidden="true">滚动中的文字</span>`（减少动态效果时仍是纯文字）。

- [ ] **Step 1: 写失败的测试**（追加到 `tests/e2e/motion-campus.spec.ts`）

```ts
test.describe('query results', () => {
  async function runAllOrders(page: Page) {
    await page.goto(CAMPUS);
    await page.locator('[data-campus]').scrollIntoViewIfNeeded();
    await expect(page.locator('#run-query')).toBeEnabled({ timeout: 20000 });
    await page.locator('#sql-input').fill('SELECT * FROM orders');
    await page.locator('#run-query').click();
    await expect(page.locator('#sql-results tbody tr').nth(25)).toBeAttached();
  }

  test('the first twenty rows drop in, the rest appear at once', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await runAllOrders(page);
    await expect(page.locator('#sql-results tbody tr').nth(0)).toHaveClass(/drop/);
    await expect(page.locator('#sql-results tbody tr').nth(19)).toHaveClass(/drop/);
    await expect(page.locator('#sql-results tbody tr').nth(20)).not.toHaveClass(/drop/);
  });

  test('the row count rolls up visually while screen readers get the final text once', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await runAllOrders(page);
    const sr = page.locator('#sql-status .sr');
    await expect(sr).toHaveText(/\d+ 行/);
    await expect(page.locator('#sql-status [aria-hidden="true"]')).toHaveText((await sr.textContent())!);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/motion-campus.spec.ts -g "query results"`
Expected: FAIL：第一行没有 `drop` 类；`#sql-status .sr` 不存在。

- [ ] **Step 3: 实现**

`src/scripts/delivery-ui.ts`：
1. 顶部导入：`import { countText } from './countup';`
2. `table()` 里构造行的那一行改为（只给前 20 行加动画）：

```ts
      r.values.forEach((v, i) => {
        const row = document.createElement('tr');
        if (i < 20) { row.className = 'drop'; row.style.setProperty('--i', String(i)); }
        v.forEach(x => { const td = document.createElement('td'); td.textContent = x === null ? 'NULL' : String(x); row.append(td); });
        body.append(row);
      });
```

3. 在 `message` 定义之后加入：

```ts
  /** Success line for a query: screen readers get the final text once (.sr); the visible copy counts the rows up. */
  const showRows = (text: string) => {
    const s = $('sql-status');
    s.dataset.error = 'false';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { s.textContent = text; return; }
    const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = text;
    const shown = document.createElement('span'); shown.setAttribute('aria-hidden', 'true');
    s.replaceChildren(sr, shown);
    const t0 = performance.now();
    const step = (now: number) => {
      if (!shown.isConnected) return;
      const k = Math.min(1, (now - t0) / 500);
      shown.textContent = countText(text, 1 - (1 - k) ** 3);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
```

4. `run()` 里成功那行 `message(T.rows(n, …))` 改为 `showRows(T.rows(n, Math.round(performance.now() - started), data.result.some(x => x.truncated)));`

`src/components/CampusDemo.astro` 的 `<style>`，在 `.table-wrap :global(th) {…}` 之后加入：

```css
  .table-wrap :global(tr.drop) { animation: row-drop 0.35s var(--ease) both; animation-delay: calc(var(--i, 0) * 20ms); }
  @keyframes row-drop { from { opacity: 0; transform: translateY(-10px); } }
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx playwright test tests/e2e/motion-campus.spec.ts tests/e2e/campus.spec.ts`
Expected: 全部 PASS（`campus.spec.ts` 里 `toHaveText(/\d+ 行/)` 对整段 `textContent` 仍然成立）。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/delivery-ui.ts src/components/CampusDemo.astro tests/e2e/motion-campus.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "SQL page: result rows drop in; the row count rolls up without re-announcing" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: CSV 工具页——清洗过程、直方图、报错

**Files:**
- Modify: `src/scripts/lab-ui.ts`, `src/components/CsvLab.astro`
- Test: `tests/e2e/motion-csv.spec.ts`

**Interfaces:**
- Produces: 勾选"去重"或"去空"后，预览里将被移除的行先带类 `leaving`（完全重复，划线）或 `sinking`（含空白，变灰下沉），约 480 ms 后整页重新渲染（终态与原来一致）；指标数字滚动到新值；直方图柱子 `i` 带 `--i`；报错时 `.lab__import` 与 `.paste-box` 带类 `shake`，下一次成功载入时移除。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/motion-csv.spec.ts`：

```ts
import { test, expect, type Page } from '@playwright/test';

const LAB = '/projects/stock-data/';
const metric = (page: Page, i: number) => page.locator('#metrics .metric strong').nth(i);

test('removing duplicates strikes the duplicate row out before it goes', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#dedupe').check();
  await expect(page.locator('#data-body tr.leaving')).toHaveCount(1);
  await expect(metric(page, 0)).toHaveText('12');
  await expect(page.locator('#data-body tr.leaving, #data-body tr.sinking')).toHaveCount(0);
  await expect(page.locator('#data-body tr')).toHaveCount(12);
});

test('removing rows with blanks sinks both of them', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#drop-missing').check();
  await expect(page.locator('#data-body tr.sinking')).toHaveCount(2);
  await expect(metric(page, 0)).toHaveText('11');
});

test('rapid toggles end in the same table as without animation', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  for (const id of ['#dedupe', '#drop-missing', '#dedupe', '#drop-missing', '#dedupe']) await page.locator(id).click();
  // dedupe on, drop-missing off
  await expect(metric(page, 0)).toHaveText('12');
  await expect(page.locator('#data-body tr')).toHaveCount(12);
  await expect(page.locator('#data-body tr.leaving, #data-body tr.sinking')).toHaveCount(0);
});

test('reduced motion updates the table at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#dedupe').check();
  await expect(metric(page, 0)).toHaveText('12', { timeout: 200 });
  await expect(page.locator('#data-body tr.leaving')).toHaveCount(0);
});

test('histogram bars grow from the baseline', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  expect(await page.locator('#histogram .bin i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('bar-grow');
});

test('a bad paste shakes the input area and marks it red until a good load', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('.paste-box summary').click();
  await page.locator('#paste').fill('a,b\n1');
  await page.locator('#paste-run').click();
  await expect(page.locator('.paste-box')).toHaveClass(/shake/);
  await expect(page.locator('.lab__import')).toHaveClass(/shake/);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#paste').fill('x,y\n1,2\n3,4');
  await page.locator('#paste-run').click();
  await expect(metric(page, 0)).toHaveText('2');
  await expect(page.locator('.paste-box')).not.toHaveClass(/shake/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/motion-csv.spec.ts`
Expected: FAIL：`tr.leaving`、`tr.sinking` 数量为 0；`animationName` 为 `none`；`.paste-box` 没有 `shake`。（`reduced motion` 与 `rapid toggles` 两条此时会通过——它们守护的是加入动画后终态不变。）

- [ ] **Step 3: 实现 `lab-ui.ts`**

1. 在 `let generation = 0;` 之后加：

```ts
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Preview rows on screen with the source row each shows, so a toggle can tell which rows are about to go. */
  let onScreen: [HTMLTableRowElement, Row][] = [];
  let removal = 0;
  const shakeTargets = [root.querySelector<HTMLElement>('.lab__import'), root.querySelector<HTMLElement>('.paste-box')];
```

2. `message` 改为（报错时抖动并标红输入区；成功时清除）：

```ts
  const message = (text: string, error = false) => {
    const m = $('message'); m.textContent = text; m.className = 'notice' + (error ? ' error' : '');
    for (const el of shakeTargets) {
      if (!el) continue;
      el.classList.remove('shake');
      if (error) { void el.offsetWidth; el.classList.add('shake'); }
    }
  };
```

3. `render()` 里，把 `$('metrics').replaceChildren(…)` 那一段改为（数字从旧值滚到新值）：

```ts
    const before = [...root.querySelectorAll<HTMLElement>('#metrics .metric strong')].map(e => Number(e.dataset.value ?? NaN));
    const values = [r.rows.length, source.headers.length, r.missingCells, r.duplicates];
    $('metrics').replaceChildren(...values.map((v, i) => {
      const el = node('div', undefined, 'metric');
      const strong = node('strong', fmt(v)); strong.dataset.value = String(v);
      el.append(strong, node('span', T.metrics[i]));
      const from = before[i];
      if (!reduced && Number.isFinite(from) && from !== v) {
        const t0 = performance.now();
        const step = (now: number) => {
          if (!strong.isConnected) return;
          const k = Math.min(1, (now - t0) / 400);
          strong.textContent = fmt(k < 1 ? Math.round(from + (v - from) * (1 - (1 - k) ** 3)) : v);
          if (k < 1) requestAnimationFrame(step);
        };
        strong.textContent = fmt(from);
        requestAnimationFrame(step);
      }
      return el;
    }));
```

4. `renderStats()` 里构造柱子时加序号：`const col = node('div', undefined, 'bin'); const bar = node('i'); bar.style.setProperty('--i', String(i));`（其余不变）。

5. `renderTable()` 里构造预览行的 `.map(r => { … })` 改为记录对应关系：

```ts
    const shown = rows.slice(page * pageSize, (page + 1) * pageSize);
    onScreen = shown.map(r => {
      const row = node('tr');
      r.forEach(v => { const td = node('td', v.trim() ? v : T.blankCell, v.trim() ? '' : 'missing'); td.title = v; row.append(td); });
      return [row, r] as [HTMLTableRowElement, Row];
    });
    $('data-body').replaceChildren(...onScreen.map(([row]) => row));
```

6. 两个复选框的 `onchange` 改为：

```ts
  /** Toggling a cleaning option first shows which preview rows go (struck out or sinking), then renders the new state. */
  const toggle = () => {
    if (!source) return;
    if (removal) { clearTimeout(removal); removal = 0; }
    const next = analyze(source, { deduplicate: $<HTMLInputElement>('dedupe').checked, dropMissing: $<HTMLInputElement>('drop-missing').checked }) as Result;
    const keep = new Set(next.rows);
    const doomed = onScreen.filter(([, r]) => !keep.has(r));
    if (reduced || !doomed.length) { page = 0; render(); return; }
    // A row the de-duplication alone would drop is a duplicate (struck out); anything else goes for its blanks (sinks).
    const deduped = new Set((analyze(source, { deduplicate: $<HTMLInputElement>('dedupe').checked, dropMissing: false }) as Result).rows);
    for (const [tr, r] of doomed) tr.classList.add(deduped.has(r) ? 'sinking' : 'leaving');
    removal = window.setTimeout(() => { removal = 0; page = 0; render(); }, 480);
  };
  ['dedupe', 'drop-missing'].forEach(id => ($<HTMLInputElement>(id).onchange = toggle));
```

（删去原来的 `['dedupe', 'drop-missing'].forEach(id => ($<HTMLInputElement>(id).onchange = () => { page = 0; render(); }));`。`load()` 里已有的 `render()` 调用不变；为防止载入新数据时有未完成的移除，在 `load()` 的 `source = next; …` 之前加 `if (removal) { clearTimeout(removal); removal = 0; }`。）

- [ ] **Step 4: 样式**

`src/components/CsvLab.astro` 的 `<style>` 末尾加入：

```css
  .histogram :global(.bin i) { transform-origin: bottom; animation: bar-grow 0.5s var(--ease) both; animation-delay: calc(var(--i, 0) * 30ms); }
  @keyframes bar-grow { from { transform: scaleY(0); } }
  .lab :global(#data-body tr.leaving td) { text-decoration: line-through; text-decoration-color: var(--red-text); text-decoration-thickness: 2px; }
  .lab :global(#data-body tr.leaving) { animation: row-leave 0.48s var(--ease) both; }
  .lab :global(#data-body tr.sinking) { animation: row-sink 0.48s var(--ease) both; }
  .lab :global(#data-body tr.sinking td) { color: var(--mute); }
  @keyframes row-leave { 55% { opacity: 1; } to { opacity: 0; transform: translateX(24px); } }
  @keyframes row-sink { 30% { opacity: 0.6; } to { opacity: 0; transform: translateY(14px); } }
  .shake { outline: 1.5px solid var(--red-text); outline-offset: 4px; animation: shake 0.36s var(--ease); }
  @keyframes shake { 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } }
```

（`.lab__import`、`.paste-box` 是组件自身渲染的元素，`.shake` 作用域样式可以匹配；预览行由脚本生成，所以用 `:global`。）

- [ ] **Step 5: 运行，确认通过**

Run: `npx playwright test tests/e2e/motion-csv.spec.ts tests/e2e/csv-lab.spec.ts tests/e2e/method.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/scripts/lab-ui.ts src/components/CsvLab.astro tests/e2e/motion-csv.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "CSV lab: removed rows strike out or sink before re-render, metrics roll, histogram grows, bad input shakes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 过程与运行子页——时间线与数字计数

**Files:**
- Modify: `src/views/MethodView.astro`
- Test: `tests/e2e/motion-method.spec.ts`

**Interfaces:**
- Consumes: `scrollProgress`、`onScroll`（Task 1）；`initCountUp`、`countEvery`（Task 1）。
- Produces: 正文第一个 `ol`（"从输入到结果"五步）带类 `timeline` 与 `--p`；其中每个 `li` 越过视口 60% 线时带 `is-lit`；正文第一个表格第二列的单元格进入视野时所有数字一起滚动。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/motion-method.spec.ts`：

```ts
import { test, expect } from '@playwright/test';

const METHOD = '/projects/stock-data/method/';

test('the five steps become a timeline that draws and lights as you scroll', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(METHOD);
  const ol = page.locator('article.prose ol.timeline');
  await expect(ol).toHaveCount(1);
  await expect(ol.locator('li')).toHaveCount(5);
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await ol.locator('li.is-lit').count()).toBeLessThan(5);
  await ol.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3));
  await expect.poll(() => ol.evaluate(el => Number(getComputedStyle(el).getPropertyValue('--p')))).toBeGreaterThan(0);
  await expect.poll(() => ol.locator('li.is-lit').count()).toBeGreaterThan(0);
  await ol.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().bottom + window.scrollY));
  await expect(ol.locator('li.is-lit')).toHaveCount(5);
});

test('reduced motion: the timeline is fully drawn and lit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(METHOD);
  await expect(page.locator('article.prose ol.timeline li.is-lit')).toHaveCount(5);
});

test('the verification numbers count up and land on the documented values', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(METHOD);
  const cell = page.locator('article.prose table').first().locator('tbody tr').first().locator('td').nth(1);
  const final = '13 行 / 2 个空白 / 1 行重复';
  await cell.scrollIntoViewIfNeeded();
  await expect(cell).toHaveText(final, { timeout: 3000 });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/motion-method.spec.ts`
Expected: FAIL：`ol.timeline` 数量为 0。（计数测试此时会通过——守护加动画后终值不变。）

- [ ] **Step 3: 实现**

`src/views/MethodView.astro`：在 `</Base>` 之前加入脚本，在 `<style>` 中追加样式：

```astro
<script>
  import { scrollProgress } from '../scripts/scroll-progress';
  import { onScroll } from '../scripts/motion-dom';
  import { initCountUp } from '../scripts/countup-dom';
  import { countEvery } from '../scripts/countup';
  const ol = document.querySelector<HTMLOListElement>('article.prose ol');
  if (ol) {
    const items = [...ol.querySelectorAll<HTMLElement>(':scope > li')];
    ol.classList.add('timeline');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ol.style.setProperty('--p', '1');
      items.forEach(li => li.classList.add('is-lit'));
    } else {
      onScroll(() => {
        const r = ol.getBoundingClientRect();
        ol.style.setProperty('--p', scrollProgress(r.top, r.height, innerHeight, 0.6, 0.6).toFixed(3));
        items.forEach(li => li.classList.toggle('is-lit', li.getBoundingClientRect().top < innerHeight * 0.6));
      });
    }
  }
  const table = document.querySelector('article.prose table');
  if (table) initCountUp(table.querySelectorAll<HTMLElement>('tbody td:nth-child(2)'), countEvery);
</script>
```

```css
  :global(article.prose ol.timeline) { position: relative; padding-left: 2.4em; list-style: none; counter-reset: step; }
  :global(article.prose ol.timeline)::before,
  :global(article.prose ol.timeline)::after { content: ''; position: absolute; left: 0.55em; top: 0.5em; bottom: 0.5em; width: 2px; }
  :global(article.prose ol.timeline)::after { background: var(--mute); opacity: 0.3; }
  :global(article.prose ol.timeline)::before { z-index: 1; background: var(--red); transform: scaleY(var(--p, 0)); transform-origin: top; }
  :global(article.prose ol.timeline > li) { position: relative; counter-increment: step; }
  :global(article.prose ol.timeline > li)::before {
    content: counter(step); position: absolute; left: -2.4em; top: 0.05em; z-index: 2;
    display: grid; place-items: center; width: 1.6em; height: 1.6em;
    background: var(--paper); border: 2px solid var(--mute); font: 700 13px/1 var(--font-display); color: var(--mute);
    transition: background-color 0.3s var(--ease), border-color 0.3s var(--ease), color 0.3s var(--ease);
  }
  :global(article.prose ol.timeline > li.is-lit)::before { background: var(--red-text); border-color: var(--red-text); color: #fff; }
  :global(article.prose ol.timeline > li strong) { transition: color 0.3s var(--ease); }
  :global(article.prose ol.timeline > li.is-lit strong) { color: var(--red-text); }
```

（原来的 1–5 编号由 `counter(step)` 在圆点里继续显示，内容不变。）

- [ ] **Step 4: 运行，确认通过**

Run: `npx playwright test tests/e2e/motion-method.spec.ts tests/e2e/method.spec.ts tests/e2e/a11y.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/views/MethodView.astro tests/e2e/motion-method.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Method page: scroll-drawn timeline for the five steps; verification numbers count up" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 项目总目录——滑入、色带、序号翻动、跟随预览、背景大字

**Files:**
- Move: `legacy/assets/editorial/hris-flow.svg` → `public/assets/editorial/hris-flow.svg`（git mv 后换色）
- Create: `src/pages/assets/previews/campus-insights.svg.ts`
- Modify: `src/data/site.ts`, `src/components/ProjectRow.astro`, `src/views/ProjectsView.astro`, `tests/unit/assets.test.ts`
- Test: `tests/e2e/motion-index.spec.ts`

**Interfaces:**
- Consumes: `reveal`、`onScroll`（Task 1）；`heatmap`、`VIEW`（`morph.ts`）；`COLORS`（`tokens.ts`）。
- Produces: `ProjectEntry.preview?: string`；`.prow` 内可选 `img.prow__preview`；`.prow` 行带 `reveal`；`ProjectsView` 中 `[data-bgword]`（CSS 变量 `--s`）。

- [ ] **Step 1: 写失败的测试**

`tests/unit/assets.test.ts`：把 `for (const f of ['delivery-relations', 'csv-process'])` 改为 `for (const f of ['delivery-relations', 'csv-process', 'hris-flow'])`。

`tests/e2e/motion-index.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

const INDEX = '/projects/';

test('rows slide in as the list scrolls into view', async ({ page }) => {
  await page.goto(INDEX);
  const rows = page.locator('a.prow');
  await expect(rows.first()).toHaveClass(/reveal/);
  await expect(rows.first()).toHaveClass(/is-in/);
});

test('hovering a row shows its preview beside the pointer', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'hover only');
  await page.goto(INDEX);
  const row = page.locator('a.prow[href="/projects/campus-delivery/insights/"]');
  const preview = row.locator('.prow__preview');
  await expect(preview).toHaveAttribute('src', '/assets/previews/campus-insights.svg');
  await row.hover({ position: { x: 200, y: 20 } });
  await expect.poll(() => preview.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  const x = await row.evaluate(el => getComputedStyle(el).getPropertyValue('--x'));
  expect(parseFloat(x)).toBeGreaterThan(150);
});

test('keyboard focus shows the preview too', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'hover only');
  await page.goto(INDEX);
  const row = page.locator('a.prow[href="/projects/stock-data/"]');
  await row.focus();
  await expect.poll(() => row.locator('.prow__preview').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('touch devices get no preview', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch only');
  await page.goto(INDEX);
  expect(await page.locator('.prow__preview').first().evaluate(el => getComputedStyle(el).display)).toBe('none');
});

test('every preview image exists', async ({ page, request }) => {
  await page.goto(INDEX);
  const srcs = await page.locator('.prow__preview').evaluateAll(els => els.map(e => e.getAttribute('src')!));
  expect(srcs.length).toBeGreaterThanOrEqual(4);
  for (const s of srcs) expect((await request.get(s)).status(), s).toBe(200);
});

test('the background word drifts with the scroll', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(INDEX);
  const word = page.locator('[data-bgword]');
  const t0 = await word.evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect.poll(() => word.evaluate(el => getComputedStyle(el).transform)).not.toBe(t0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('everything is visible', async ({ page }) => {
    await skipIntro(page);
    await page.goto(INDEX);
    for (const o of await page.locator('a.prow').evaluateAll(els => els.map(e => getComputedStyle(e).opacity))) expect(o).toBe('1');
    await page.goto('/projects/campus-delivery/');
    await expect(page.locator('.prose img[src$="delivery-relations.svg"]')).toBeVisible();
    await expect(page.locator('article.prose h3').first()).toBeVisible();
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/assets.test.ts && npx playwright test tests/e2e/motion-index.spec.ts`
Expected: 单元 FAIL（`hris-flow.svg` 不存在）；端到端大部分 FAIL（没有 `reveal`、没有 `.prow__preview`、没有 `[data-bgword]`）。`without JavaScript` 与 `touch devices`（元素不存在会超时失败）按实际结果记录。

- [ ] **Step 3: 预览图**

```bash
git mv legacy/assets/editorial/hris-flow.svg public/assets/editorial/hris-flow.svg
sed -i -e 's/#192622/#0f0f0f/g' -e 's/#53635b/#6b6a64/g' -e 's/#73867e/#6b6a64/g' -e 's/#d1ffca/#f6d5ca/g' -e 's/#ddd8ca/#d9d7cf/g' -e 's/#e9eee7/#f2f1ec/g' public/assets/editorial/hris-flow.svg
```

（映射与 2A 给 `delivery-relations.svg` 换色时相同，另把 `#ddd8ca` 映射到 `#d9d7cf`。）

`src/pages/assets/previews/campus-insights.svg.ts`：

```ts
import { heatmap, VIEW, type Rows } from '../../../scripts/morph';
import { COLORS } from '../../../data/tokens';
import data from '../../../data/insights.json';

/** The insights page's chapter-one heatmap, drawn at build time from the committed results, for the projects index preview. */
export function GET(): Response {
  const marks = heatmap((data.results.heatmap.values as Rows)).marks;
  const rects = marks.map(m => `<rect x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" width="${m.w.toFixed(1)}" height="${m.h.toFixed(1)}" fill="${COLORS.red}" fill-opacity="${m.a.toFixed(3)}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}"><rect width="${VIEW.w}" height="${VIEW.h}" fill="${COLORS.paper}"/>${rects}</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}
```

构建后检查：`npx astro build && ls dist/assets/previews/`，Expected：`campus-insights.svg`。若 Astro 因 `trailingSlash: 'always'` 拒绝带扩展名的端点，改为在 `tools/gen-insights.mjs` 里生成同样内容写入 `public/assets/previews/campus-insights.svg` 并提交，记 Ruling。

- [ ] **Step 4: 站点数据**

`src/data/site.ts`：
1. `ProjectEntry` 接口在 `status: Bi;` 之后加 `/** Illustration shown beside the row on the projects index (desktop hover / focus). */\n  preview?: string;`
2. 在四个项目条目里各加一项：`hris-workflow` → `preview: '/assets/editorial/hris-flow.svg'`；`campus-delivery` → `preview: '/assets/editorial/delivery-relations.svg'`；`campus-delivery/insights` → `preview: '/assets/previews/campus-insights.svg'`；`stock-data` → `preview: '/assets/editorial/csv-process.svg'`。

- [ ] **Step 5: 行组件**

`src/components/ProjectRow.astro` 改为：

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
  {project.preview && <img class="prow__preview" src={project.preview} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
</a>
<script>
  import { reveal } from '../scripts/motion-dom';
  const rows = document.querySelectorAll<HTMLElement>('a.prow');
  reveal(rows, 60);
  // The preview follows the pointer within the row, kept clear of the right edge.
  for (const row of rows) {
    row.addEventListener('pointermove', e => {
      const r = row.getBoundingClientRect();
      row.style.setProperty('--x', `${Math.min(e.clientX - r.left, r.width - 340)}px`);
    });
  }
</script>
<style>
  .prow { position: relative; display: grid; grid-template-columns: 3ch minmax(10em, 1fr) 2fr minmax(9em, 1fr) 2ch; gap: 8px clamp(14px, 2vw, 32px); align-items: baseline; padding: 18px var(--gutter); border-bottom: var(--hair); text-decoration: none; transition: background-color 0.2s var(--ease), color 0.2s var(--ease), opacity 0.6s var(--ease) var(--d, 0ms), transform 0.6s var(--ease) var(--d, 0ms); }
  .prow:global(.reveal):not(:global(.is-in)) { opacity: 0; transform: translateX(-28px); }
  .prow::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; background: var(--red); transform: scaleX(0); transform-origin: left; transition: transform 0.45s var(--ease); }
  .prow:hover, .prow:focus-visible { background: var(--ink); color: var(--paper); }
  .prow:hover::after, .prow:focus::after { transform: scaleX(1); }
  .prow__n { display: inline-block; font: 700 18px/1 var(--font-display); }
  .prow:hover .prow__n, .prow:focus .prow__n { animation: n-flip 0.45s var(--ease); }
  @keyframes n-flip { from { transform: rotateX(90deg); opacity: 0.2; } }
  .prow__title { font: 900 clamp(17px, 1.5vw, 22px)/1.3 var(--font-cjk-bold); }
  .prow__did { font-size: 15px; line-height: 1.6; }
  .prow__status { font-size: 13px; color: var(--mute); }
  .prow:hover .prow__status, .prow:focus-visible .prow__status { color: var(--night-mute); }
  .prow__arrow { color: var(--red); }
  .prow__preview { position: absolute; z-index: 3; top: 50%; left: clamp(0px, var(--x, 58%), calc(100% - 340px)); width: 300px; height: auto; border: var(--rule); background: var(--paper); pointer-events: none; opacity: 0; transform: translate(24px, -50%) scale(0.96); transition: opacity 0.2s var(--ease), transform 0.2s var(--ease); }
  @media (hover: hover) and (pointer: fine) {
    .prow:hover .prow__preview, .prow:focus .prow__preview { opacity: 1; transform: translate(24px, -50%) scale(1); }
  }
  @media not ((hover: hover) and (pointer: fine)) { .prow__preview { display: none; } }
  @media (max-width: 800px) {
    .prow { grid-template-columns: 3ch 1fr; }
    .prow__did, .prow__status { grid-column: 2; }
    .prow__arrow { display: none; }
  }
</style>
```

（原样式里 `.prow:hover` 的背景、文字色与移动端网格保持不变；新增的是位置、色带、序号翻动、预览和滑入。）

- [ ] **Step 6: 背景大字**

`src/views/ProjectsView.astro`：
1. `<main id="main">` 改为 `<main id="main" class="i-main">`，并在其内第一行加 `<div class="i-bgword" aria-hidden="true" data-bgword>PROJECTS</div>`。
2. 在 `</Base>` 之前加：

```astro
<script>
  import { onScroll } from '../scripts/motion-dom';
  const word = document.querySelector<HTMLElement>('[data-bgword]');
  if (word && !matchMedia('(prefers-reduced-motion: reduce)').matches) onScroll(() => word.style.setProperty('--s', String(Math.round(window.scrollY * 0.35))));
</script>
```

3. `<style>` 中加入：

```css
  /* isolation keeps the word's negative z-index inside main, behind the rows but above the page background. */
  .i-main { position: relative; isolation: isolate; overflow-x: clip; }
  .i-bgword { position: absolute; z-index: -1; top: clamp(24px, 6vh, 72px); left: 0; font: 700 clamp(160px, 30vw, 520px)/0.8 var(--font-display); letter-spacing: -0.02em; color: var(--ink); opacity: 0.05; white-space: nowrap; pointer-events: none; transform: translateX(calc(var(--s, 0) * -1px)); }
```

- [ ] **Step 7: 运行，确认通过**

Run: `npm test && npx playwright test tests/e2e/motion-index.spec.ts tests/e2e/projects-index.spec.ts tests/e2e/layout.spec.ts tests/e2e/a11y.spec.ts tests/e2e/numbers.spec.ts tests/e2e/links.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add -A public/assets/editorial legacy/assets/editorial src/pages/assets src/data/site.ts src/components/ProjectRow.astro src/views/ProjectsView.astro tests/unit/assets.test.ts tests/e2e/motion-index.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Projects index: rows slide in, red sweep and number flip on hover, pointer-following previews, drifting background word" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 全站验收

**Files:**
- Modify: 仅在验收暴露问题时修改（每处修改记 Ruling）

- [ ] **Step 1: 全量测试**

Run: `npm test && npx playwright test`
Expected: 全部 PASS（按设备有意跳过的除外）。

- [ ] **Step 2: 看动效中途的画面**

用一个临时脚本（放在 `.superpowers/sdd/` 下，不提交）在 `node tools/serve-dist.mjs 4398` 上截取：SQL 页关系图连线画到一半、下单进度带点亮到第 3 步、库存不足回滚后的进度带；CSV 页勾选去重后 200 ms 的预览表；方法页时间线画到一半；目录页悬停一行的预览。截图缩小到 960 宽后查看。检查：没有重叠、裁切、颜色越出调色板；预览图不超出右边缘。发现问题就修，修完重跑 Step 1，并记 Ruling。

- [ ] **Step 3: 提交（仅当 Step 2 有修改）**

```bash
git add -A src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "2A motion: acceptance fixes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
