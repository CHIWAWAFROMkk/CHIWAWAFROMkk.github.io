# 数据动效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 进阶版开场换成电影级 WebGL2 粒子序章（20 万粒子、HDR 泛光、镜头穿越、冲击波、点击爆破，调暗版），快速概览与驾驶舱的数字改为机械计数，SQL 页经营分析改为冲击排版 + 解码扫描；任何不适合的环境都退回静态、内容不变。

**Architecture:** 粒子序章拆成纯函数（形状生成、镜头路径、质量决策，单元测试锁定）和一个 DOM/GL 渲染器（原生 WebGL2，不引第三方库）。页面先渲染静态开场，渲染器在空闲时构建，成功才把序章切到"live"并展开滚动长度；任何失败都保持或回到"static"。机械计数用 CSS 生成内容绘制滚轮数字，所以动画全程元素的 `textContent` 就是最终值；冲击排版结束后逐格恢复服务器渲染的原文。

**Tech Stack:** Astro 7、TypeScript、Vitest、Playwright（Edge）、WebGL2（原生）。

**Spec:** `docs/superpowers/specs/2026-09-29-data-motion-design.md`；视觉参数以原型 `portfolio-site/.superpowers/brainstorm/1010-1790687193/content/data-motion-v7.html` 为准。

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；**不推送、不合并、不部署**。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。不要用裸 `git stash`。
- 不引入任何第三方库；WebGL2 原生实现。
- 粒子预算：桌面 200,000；窄屏（< 800px）或粗指针 50,000；运行时前 90 帧平均帧率 < 40 → 粒子减半并关闭半分辨率泛光，< 20 → 退回静态。
- 亮度采用 v7：桌面粒子增益 0.13、窄屏 0.34；亮部阈值 `smoothstep(0.45, 1.6, …)`；泛光一级 0.5（窄屏或降级时 0）、二级 0.8；曝光 0.9。
- `prefers-reduced-motion: reduce`：不创建 WebGL 上下文、不做机械计数与冲击排版。
- 页面上关于数据的数字只能来自 `insights.json`（经 `InsightText` / `formatFact`）或事实清单；文案模板不许手写数字（单元测试强制）。
- 动效结束后 DOM 文字与原文一致；现有测试不改断言（点雨相关测试随点雨一起删除除外）。
- 颜色只用 tokens 变量（WebGL 着色器里的颜色常量取自原型，等价于 `--red` / `--night-fg` / `--night`）。

## Review Focus

1. **没有 WebGL2、着色器失败、上下文丢失**：停在或回到静态开场，序章不占四屏空白，无页面错误 → Task 2 `static when WebGL2 is unavailable`，Task 3 `a lost context falls back to the static opening`。
2. **读屏与键盘用户**：可以跳过序章直达摘要；字幕是真实文字；机械计数期间元素文字始终是最终值 → Task 2 `the skip link reaches the summary`，Task 4 `text stays final while the reels spin`。
3. **减少动态效果**：不创建上下文、不转滚轮、不砸指标 → Task 2、4、5 各一条。
4. **驾驶舱快速筛选**：机械计数的旧动画不会盖掉新值，结束时不残留滚轮 → Task 4 `rapid filters leave the final value and no reels`。
5. **窄屏与粗指针**：粒子预算降到 50,000 → Task 3 `mobile gets the lighter budget`（有 WebGL2 时）与 Task 1 `particleBudget` 单元测试。

---

## 设计细化（相对 spec 的实现决定）

- 机械计数：spec 写"原文放 `.sr`、滚轮 `aria-hidden`、带 `data-spinning`"。实现改为**滚轮数字由 CSS 生成内容（`::before { content: '0\A 1\A …' }`）绘制**，滚轮元素本身没有文字节点，因此动画全程 `textContent` 恰为最终值（快速概览页的现有测试会在任意时刻读取它）。数字核对因此无需排除 `[data-spinning]`。
- 序章的镜头、字幕、交互与 v7 原型逐项一致；字幕中的数字改由 `InsightText` 渲染（原型里是手写的）。

---

## 文件结构

```
src/scripts/cinema/shapes.ts     seeded()、galaxy()、textFromPixels()、terrain()、terrainTop()、bars()、barWeights()
src/scripts/cinema/camera.ts     CAM、DIVE、SWING、cam()、stateFromScroll()
src/scripts/cinema/quality.ts    particleBudget()、decideQuality()
src/scripts/cinema/shaders.ts    六段着色器源码
src/scripts/cinema/renderer.ts   startPrologue()：WebGL2 渲染、泛光、交互、降级
src/components/InsightsPrologue.astro   静态开场 + 序章舞台 + 字幕 + 跳过链接（取代 InsightsHero）
src/data/insights-copy.ts        新增 prologue 文案
src/views/InsightsView.astro     top 插槽改用 InsightsPrologue
src/scripts/odometer.ts / odometer-dom.ts   机械计数
src/styles/base.css              机械计数的全局样式
src/components/EvidenceRow.astro 快速概览大数字接入机械计数
src/scripts/cockpit-ui.ts        指标条改用机械计数
src/scripts/impact.ts / impact-dom.ts   冲击排版与解码扫描
src/components/CampusDemo.astro  经营分析接入冲击排版
删除：src/components/InsightsHero.astro、src/scripts/rain.ts、src/scripts/rain-dom.ts、tests/unit/rain.test.ts
tests/unit/{cinema,odometer,impact}.test.ts，tests/unit/insights-facts.test.ts（追加）
tests/e2e/prologue.spec.ts、tests/e2e/data-motion.spec.ts；tests/e2e/insights.spec.ts（删去点雨三条）
```

---

### Task 1: 序章的纯函数——形状、镜头、质量

**Files:**
- Create: `src/scripts/cinema/shapes.ts`, `src/scripts/cinema/camera.ts`, `src/scripts/cinema/quality.ts`
- Test: `tests/unit/cinema.test.ts`

**Interfaces:**
- Produces:
  - `type Rand = () => number`；`interface Cloud { pos: Float32Array; col: Float32Array }`（长度 n × 3）；`RED`、`LIGHT`、`DIM`（`[number, number, number]`）
  - `seeded(seed: number): Rand`
  - `galaxy(n, rand): Cloud`；`textFromPixels(px: ArrayLike<number>, cw, ch, n, rand, sx): Cloud`（px 为扁平 x,y 列表）；`terrainTop(v, max): number`；`terrain(n, heat: Rows, rand, sx): Cloud`；`barWeights(nets: number[]): number[]`；`bars(n, nets, rand, sx): Cloud`
  - `interface Cam { yaw; pitch; dist: number }`；`CAM: Cam[4]`、`DIVE`、`SWING`；`cam(state: number): Cam`；`stateFromScroll(top, height, viewport): number`（0–3）
  - `particleBudget(width: number, coarse: boolean): number`；`type Quality = 'full' | 'reduced' | 'static'`；`decideQuality(avgFps: number): Quality`

- [ ] **Step 1: 写失败的测试**

`tests/unit/cinema.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { seeded, galaxy, textFromPixels, terrain, terrainTop, bars, barWeights, RED } from '../../src/scripts/cinema/shapes';
import { cam, CAM, stateFromScroll } from '../../src/scripts/cinema/camera';
import { particleBudget, decideQuality } from '../../src/scripts/cinema/quality';

const R = JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results;
const HEAT = R.heatmap.values;
const NETS = R.merchants.values.map((r: (number | string)[]) => Number(r[3]));
const finite = (a: Float32Array) => a.every(Number.isFinite);

describe('shapes', () => {
  it('are deterministic for a seed and sized n × 3', () => {
    const a = galaxy(5000, seeded(1)), b = galaxy(5000, seeded(1));
    expect(a.pos).toHaveLength(15000);
    expect(a.col).toHaveLength(15000);
    expect(Array.from(a.pos)).toEqual(Array.from(b.pos));
  });

  it('galaxy stays within its radius', () => {
    const { pos } = galaxy(20000, seeded(2));
    expect(finite(pos)).toBe(true);
    for (let i = 0; i < pos.length; i += 3) expect(Math.hypot(pos[i], pos[i + 2])).toBeLessThan(3.8);
  });

  it('text lands every particle on a lit pixel (within jitter) and is mostly red', () => {
    const px = [100, 50, 300, 150];
    const { pos, col } = textFromPixels(px, 400, 200, 3000, seeded(3), 1);
    const xs = [(100 / 400 - .5) * 3.3, (300 / 400 - .5) * 3.3];
    for (let i = 0; i < pos.length; i += 3) expect(Math.min(...xs.map(x => Math.abs(pos[i] - x)))).toBeLessThan(0.03);
    let red = 0;
    for (let i = 0; i < col.length; i += 3) if (Math.abs(col[i] - RED[0]) < 1e-6 && Math.abs(col[i + 1] - RED[1]) < 1e-6) red++;
    expect(red / 3000).toBeGreaterThan(0.85);
  });

  it('text with no pixels gives finite zeros', () => {
    const { pos } = textFromPixels([], 400, 200, 100, seeded(4), 1);
    expect(finite(pos)).toBe(true);
  });

  it('terrain never rises above the busiest cell, and reaches it', () => {
    const max = Math.max(...HEAT.map((r: number[]) => r[2]));
    const { pos } = terrain(40000, HEAT, seeded(5), 1);
    let top = -Infinity;
    for (let i = 1; i < pos.length; i += 3) top = Math.max(top, pos[i]);
    expect(top).toBeLessThanOrEqual(terrainTop(max, max) + 1e-6);
    expect(top).toBeGreaterThan(terrainTop(max, max) - 0.05);
    expect(terrainTop(max / 2, max) - terrainTop(0, max)).toBeCloseTo((terrainTop(max, max) - terrainTop(0, max)) / 2);
  });

  it('bars get particles in proportion to their weights', () => {
    const n = 60000, { pos } = bars(n, NETS, seeded(6), 1), w = barWeights(NETS), tot = w.reduce((a, b) => a + b, 0);
    const centres = NETS.map((_: number, j: number) => (j / 11 - .5) * 2.9);
    const counts = Array(12).fill(0);
    for (let i = 0; i < pos.length; i += 3) {
      let best = 0;
      centres.forEach((c: number, j: number) => { if (Math.abs(pos[i] - c) < Math.abs(pos[i] - centres[best])) best = j; });
      counts[best]++;
    }
    counts.forEach((c, j) => expect(Math.abs(c - n * w[j] / tot)).toBeLessThanOrEqual(12));
  });
});

describe('camera', () => {
  it('sits exactly on each keyframe at whole states', () => {
    for (let k = 0; k < 4; k++) {
      const c = cam(k);
      expect(c.yaw).toBeCloseTo(CAM[k].yaw);
      expect(c.pitch).toBeCloseTo(CAM[k].pitch);
      expect(c.dist).toBeCloseTo(CAM[k].dist);
    }
  });
  it('is continuous and dives mid-transition', () => {
    for (let s = 0; s < 3; s += 0.01) expect(Math.abs(cam(s + 0.01).dist - cam(s).dist)).toBeLessThan(0.1);
    expect(cam(1.5).dist).toBeLessThan(Math.min(CAM[1].dist, CAM[2].dist));
  });
  it('maps the scroll through the prologue onto 0–3', () => {
    expect(stateFromScroll(0, 4600, 1000)).toBe(0);
    expect(stateFromScroll(-1800, 4600, 1000)).toBeCloseTo(1.5);
    expect(stateFromScroll(-9999, 4600, 1000)).toBe(3);
    expect(stateFromScroll(500, 4600, 1000)).toBe(0);
  });
});

describe('quality', () => {
  it('budgets particles by screen and pointer', () => {
    expect(particleBudget(1440, false)).toBe(200000);
    expect(particleBudget(390, false)).toBe(50000);
    expect(particleBudget(1440, true)).toBe(50000);
  });
  it('steps down with the measured frame rate', () => {
    expect(decideQuality(60)).toBe('full');
    expect(decideQuality(39)).toBe('reduced');
    expect(decideQuality(19)).toBe('static');
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/cinema.test.ts`
Expected: FAIL，找不到 `../../src/scripts/cinema/shapes`。

- [ ] **Step 3: 实现**

`src/scripts/cinema/shapes.ts`：

```ts
import type { Rows } from '../morph';

/** Particle clouds for the insights prologue. Each shape fills exactly n particles: xyz positions and rgb colours. Pure. */
export type Rand = () => number;
export type RGB = [number, number, number];
export interface Cloud { pos: Float32Array; col: Float32Array }

export const RED: RGB = [1.0, 0.24, 0.055];
export const LIGHT: RGB = [0.93, 0.89, 0.84];
export const DIM: RGB = [0.3, 0.09, 0.04];

export function seeded(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cloud = (n: number): Cloud => ({ pos: new Float32Array(n * 3), col: new Float32Array(n * 3) });

/** A three-armed spiral galaxy on the xz plane; the core is red, the arms warm white. */
export function galaxy(n: number, rand: Rand): Cloud {
  const c = cloud(n);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  for (let i = 0; i < n; i++) {
    const r = 0.12 + Math.pow(rand(), 0.75) * 3.2, arm = (i % 3) * Math.PI * 2 / 3, th = arm + r * 1.35 + gauss() * (0.5 / (r + 0.35));
    c.pos.set([Math.cos(th) * r + gauss() * 0.1, gauss() * 0.14 * (1.4 - r / 3.4), Math.sin(th) * r + gauss() * 0.1], i * 3);
    const core = Math.max(0, 1 - r / 1.4);
    c.col.set(rand() < 0.35 + core * 0.5 ? RED : scale(LIGHT, 0.5 + core * 0.5), i * 3);
  }
  return c;
}

/** Particles on the lit pixels of a rasterised label (flat x,y list on a cw × ch canvas), slightly thick in z. */
export function textFromPixels(px: ArrayLike<number>, cw: number, ch: number, n: number, rand: Rand, sx: number): Cloud {
  const c = cloud(n), count = Math.floor(px.length / 2);
  if (!count) return c;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(rand() * count) * 2;
    c.pos.set([((px[k] + rand() * 2) / cw - 0.5) * 3.3 * sx, -((px[k + 1] + rand() * 2) / ch - 0.5) * 1.16 * sx, (rand() - 0.5) * 0.26], i * 3);
    c.col.set(rand() < 0.92 ? RED : LIGHT, i * 3);
  }
  return c;
}

/** Height of a terrain column for v orders, on the same scale for every column. */
export const terrainTop = (v: number, max: number) => -0.65 + (v / Math.max(1, max)) * 1.25;

/** Rows [dow, hour, orders] → a 24 × 7 field of columns; taller, redder columns for busier hours. */
export function terrain(n: number, heat: Rows, rand: Rand, sx: number): Cloud {
  const c = cloud(n), map = new Map(heat.map(r => [Number(r[0]) * 24 + Number(r[1]), Number(r[2])]));
  const max = Math.max(1, ...map.values());
  const cells: { d: number; h: number; v: number }[] = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) cells.push({ d, h, v: map.get(d * 24 + h) ?? 0 });
  const weights = cells.map(x => 0.6 + x.v), tot = weights.reduce((a, b) => a + b, 0);
  let i = 0;
  cells.forEach((cell, j) => {
    const count = j === cells.length - 1 ? n - i : Math.round(n * weights[j] / tot), top = terrainTop(cell.v, max), a = cell.v / max;
    for (let k = 0; k < count && i < n; k++, i++) {
      const f = Math.pow(rand(), 0.55);
      c.pos.set([((cell.h + 0.1 + rand() * 0.8) / 24 - 0.5) * 3.2 * sx, -0.65 + f * (top + 0.65), ((cell.d + 0.1 + rand() * 0.8) / 7 - 0.5) * 1.1], i * 3);
      c.col.set(mixRGB(DIM, RED, Math.min(1, a * 1.4) * (0.55 + 0.45 * f)), i * 3);
    }
  });
  return c;
}

/** Share of particles per bar: proportional to net revenue, with a floor so the smallest bar stays visible. */
export function barWeights(nets: number[]): number[] {
  const max = Math.max(1, ...nets);
  return nets.map(v => 0.05 + v / max);
}

/** Net revenue per merchant (sorted, highest first) → 12 upright bars; the top three red. */
export function bars(n: number, nets: number[], rand: Rand, sx: number): Cloud {
  const c = cloud(n), max = Math.max(1, ...nets), w = barWeights(nets), tot = w.reduce((a, b) => a + b, 0);
  let i = 0;
  nets.forEach((v, j) => {
    const count = j === nets.length - 1 ? n - i : Math.round(n * w[j] / tot), h = 1.35 * v / max, x0 = (j / Math.max(1, nets.length - 1) - 0.5) * 2.9 * sx;
    for (let k = 0; k < count && i < n; k++, i++) {
      c.pos.set([x0 + (rand() - 0.5) * 0.17 * sx, -0.68 + rand() * h, (rand() - 0.5) * 0.17], i * 3);
      c.col.set(j < 3 ? RED : scale(LIGHT, 0.7), i * 3);
    }
  });
  return c;
}
```

`src/scripts/cinema/camera.ts`：

```ts
/** Camera path through the prologue: one keyframe per shape; between shapes it swoops (dist dips) and swings (yaw arcs). */
export interface Cam { yaw: number; pitch: number; dist: number }

export const CAM: Cam[] = [
  { yaw: 0.4, pitch: 0.62, dist: 5.2 },   // galaxy, from above
  { yaw: 0, pitch: 0, dist: 3.2 },        // the number, face on
  { yaw: -0.38, pitch: 0.58, dist: 2.75 }, // terrain, looking down the ridges
  { yaw: 0.28, pitch: 0.1, dist: 3.3 },   // bars
];
export const DIVE = [1.0, 1.9, 1.1];
export const SWING = [0, 0.9, -0.5];

const smooth = (t: number) => t * t * (3 - 2 * t);

export function cam(state: number): Cam {
  const s = Math.min(3, Math.max(0, state));
  const i = Math.min(2, Math.floor(s)), f = Math.min(1, s - i), t = smooth(f), a = CAM[i], b = CAM[i + 1], arc = Math.sin(Math.PI * f);
  return { yaw: a.yaw + (b.yaw - a.yaw) * t + SWING[i] * arc, pitch: a.pitch + (b.pitch - a.pitch) * t, dist: a.dist + (b.dist - a.dist) * t - DIVE[i] * arc };
}

/** How far the prologue has been scrolled (its top, its height, the viewport height) → story state 0–3. */
export function stateFromScroll(top: number, height: number, viewport: number): number {
  return Math.max(0, Math.min(1, -top / Math.max(1, height - viewport))) * 3;
}
```

`src/scripts/cinema/quality.ts`：

```ts
/** How many particles a device gets: phones and touch screens take the lighter load. */
export function particleBudget(width: number, coarse: boolean): number {
  return width < 800 || coarse ? 50000 : 200000;
}

export type Quality = 'full' | 'reduced' | 'static';

/** After a short probe: below 40 fps halve the work; below 20 give up on the film and show the static opening. */
export function decideQuality(avgFps: number): Quality {
  if (avgFps < 20) return 'static';
  if (avgFps < 40) return 'reduced';
  return 'full';
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/cinema.test.ts`
Expected: PASS（11 个测试）。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/cinema tests/unit/cinema.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Prologue geometry: particle shapes from the real results, camera path, quality budget" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 序章组件（静态版）并移除点雨

**Files:**
- Create: `src/components/InsightsPrologue.astro`, `tests/e2e/prologue.spec.ts`
- Modify: `src/data/insights-copy.ts`, `src/views/InsightsView.astro`, `tests/unit/insights-facts.test.ts`, `tests/e2e/insights.spec.ts`
- Delete: `src/components/InsightsHero.astro`, `src/scripts/rain.ts`, `src/scripts/rain-dom.ts`, `tests/unit/rain.test.ts`

**Interfaces:**
- Consumes: `InsightText`、`deriveFacts`、`formatFact`、`INSIGHTS_COPY`。
- Produces（Task 3 依赖的 DOM 约定）：`section.prologue[data-prologue][data-state="static"|"live"][data-label]`；其中 `a.prologue__skip`、`.prologue__static`（静态开场）、`.prologue__stick > canvas`、4 个 `[data-cap="0…3"]`、`[data-hud-count]`、`[data-hud-fps]`。`data-state="live"` 时序章高 460vh、舞台 sticky；`canvas[data-ready]` 时画布淡入。
- 文案：`INSIGHTS_COPY.prologue = { label: Bi; skip: Bi; caps: { small: Bi; title: Bi; body: Bi }[4] }`。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/prologue.spec.ts`：

```ts
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deriveFacts, formatFact, type Results } from '../../src/scripts/insights-facts';

const PATH = '/projects/campus-delivery/insights/';
const FACTS = deriveFacts(JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results as Results);
const noWebGL2 = (page: Page) => page.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  // @ts-expect-error test override
  HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) { return type === 'webgl2' ? null : orig.call(this, type, ...rest); };
});

test('static when WebGL2 is unavailable: the opening reads in full and takes no extra scroll', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await noWebGL2(page);
  await page.goto(PATH);
  await page.waitForTimeout(1500);
  const pro = page.locator('[data-prologue]');
  await expect(pro).toHaveAttribute('data-state', 'static');
  await expect(pro.locator('.prologue__static [data-insight-num="orders"]')).toHaveText(formatFact(FACTS.orders, 'zh'));
  await expect(pro.locator('.prologue__static')).toBeVisible();
  const h = await pro.evaluate(el => el.getBoundingClientRect().height / innerHeight);
  expect(h).toBeLessThan(1.2);
  expect(errors).toEqual([]);
});

test('reduced motion stays static and never creates a WebGL context', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PATH);
  await page.waitForTimeout(1200);
  await expect(page.locator('[data-prologue]')).toHaveAttribute('data-state', 'static');
  await expect(page.locator('[data-prologue] canvas[data-ready]')).toHaveCount(0);
});

test('captions carry the query results in both languages', async ({ page }) => {
  for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
    await noWebGL2(page);
    await page.goto(`${prefix}${PATH}`);
    await expect(page.locator('[data-cap="1"] [data-insight-num="orders"]')).toHaveText(formatFact(FACTS.orders, lang));
    await expect(page.locator('[data-cap="3"] [data-insight-num="top3Share"]')).toHaveText(formatFact(FACTS.top3Share, lang));
  }
});

test('the skip link reaches the summary', async ({ page }) => {
  await noWebGL2(page);
  await page.goto(PATH);
  const skip = page.locator('.prologue__skip');
  await skip.focus();
  await expect(skip).toBeVisible();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#p-summary-h$/);
  await expect(page.locator('#p-summary-h')).toBeInViewport();
});
```

在 `tests/e2e/insights.spec.ts` 中删除以 `test('the rain ends on its own` 开始、到 `test('reduced motion skips the rain'` 结束的三个测试（点雨已被序章取代）。

在 `tests/unit/insights-facts.test.ts` 的 `templates` 数组末尾加入序章文案（让"不许手写数字、中英占位一致"的检查覆盖它们）：

```ts
    INSIGHTS_COPY.prologue.label, INSIGHTS_COPY.prologue.skip,
    ...INSIGHTS_COPY.prologue.caps.flatMap(c => [c.small, c.title, c.body]),
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/insights-facts.test.ts && npx playwright test tests/e2e/prologue.spec.ts --project=desktop`
Expected: 单元 FAIL（`INSIGHTS_COPY.prologue` 未定义）；端到端 FAIL（`[data-prologue]` 不存在）。

- [ ] **Step 3: 文案**

`src/data/insights-copy.ts`：在 `storyTitle` 之前加入：

```ts
  prologue: {
    label: { zh: '序章：一个学期的订单', en: 'Prologue: one term of orders' },
    skip: { zh: '跳过序章', en: 'Skip the intro' },
    caps: [
      { small: { zh: 'ONE TERM · SYNTHETIC DATA', en: 'ONE TERM · SYNTHETIC DATA' }, title: { zh: '一个学期的外卖订单', en: 'One term of delivery orders' }, body: { zh: '向下滚动', en: 'Scroll down' } },
      { small: { zh: 'CAMPUS DELIVERY · {weeks} WEEKS', en: 'CAMPUS DELIVERY · {weeks} WEEKS' }, title: { zh: '{orders} 笔订单', en: '{orders} orders' }, body: { zh: '每一个光点，都会落到它该去的位置。', en: 'Every point of light lands where it belongs.' } },
      { small: { zh: 'WHEN IS IT BUSIEST', en: 'WHEN IS IT BUSIEST' }, title: { zh: '什么时候最忙？', en: 'When is it busiest?' }, body: { zh: '星期 × 小时。午餐和晚餐，是两条山脊。', en: 'Weekday × hour. Lunch and dinner rise as two ridges.' } },
      { small: { zh: 'WHERE DOES THE MONEY COME FROM', en: 'WHERE DOES THE MONEY COME FROM' }, title: { zh: '前三家拿走 {top3Share}', en: 'The top three take {top3Share}' }, body: { zh: '{merchants} 家商家的净收款，从高到低。', en: 'Net revenue of {merchants} merchants, highest first.' } },
    ],
  },
```

- [ ] **Step 4: 组件**

`src/components/InsightsPrologue.astro`：

```astro
---
import InsightText from './InsightText.astro';
import { INSIGHTS_COPY as C } from '../data/insights-copy';
import { deriveFacts, formatFact, type Results } from '../scripts/insights-facts';
import data from '../data/insights.json';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const facts = deriveFacts(data.results as unknown as Results);
const P = C.prologue;
---
<section class="prologue" data-prologue data-state="static" data-label={formatFact(facts.orders, 'en')} aria-label={P.label[lang]}>
  <a class="prologue__skip" href="#p-summary-h">{P.skip[lang]}</a>
  <div class="prologue__static wrap">
    <p class="prologue__big"><InsightText text={C.hero.big[lang]} facts={facts} lang={lang} /></p>
    <p class="prologue__sub"><InsightText text={C.hero.sub[lang]} facts={facts} lang={lang} /></p>
  </div>
  <div class="prologue__stick">
    <canvas aria-hidden="true"></canvas>
    {P.caps.map((c, i) => (
      <div class="prologue__cap" data-cap={i}>
        <small><InsightText text={c.small[lang]} facts={facts} lang={lang} /></small>
        <p class="prologue__title"><InsightText text={c.title[lang]} facts={facts} lang={lang} /></p>
        <p class="prologue__body"><InsightText text={c.body[lang]} facts={facts} lang={lang} /></p>
      </div>
    ))}
    <p class="prologue__hud" aria-hidden="true" data-insight-data><b data-hud-count></b> PARTICLES · WEBGL2 · <b data-hud-fps></b> FPS</p>
  </div>
</section>
<style>
  .prologue { position: relative; }
  .prologue__static { padding-block: clamp(40px, 9vh, 110px) 8px; }
  .prologue__big { font: 900 clamp(26px, 3.4vw, 52px)/1 var(--font-cjk-bold); letter-spacing: -0.01em; }
  .prologue__big :global(.inum) { display: inline-block; margin-right: 0.12em; font: 700 clamp(84px, 15vw, 230px)/0.82 var(--font-display); color: var(--ink); letter-spacing: -0.01em; }
  .prologue__sub { margin-top: 18px; color: var(--mute); font-size: clamp(14px, 1.2vw, 17px); }
  .prologue__sub :global(.inum) { color: inherit; }
  .prologue__stick { display: none; }
  .prologue__skip { position: absolute; left: 6vw; top: 18px; z-index: 3; font-size: 13px; color: inherit; }
  .prologue[data-state='static'] .prologue__skip:not(:focus) { width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .prologue[data-state='live'] { height: 460vh; background: var(--night); color: var(--night-fg); }
  .prologue[data-state='live'] .prologue__static { display: none; }
  .prologue[data-state='live'] .prologue__stick { display: block; position: sticky; top: 0; height: 100vh; overflow: hidden; }
  .prologue[data-state='live'] :focus-visible { outline-color: var(--night-fg); }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 0.8s var(--ease); cursor: crosshair; touch-action: pan-y; }
  canvas[data-ready] { opacity: 1; }
  canvas.drag { cursor: grabbing; }
  .prologue__cap { position: absolute; left: 6vw; bottom: 12vh; max-width: 34em; opacity: 0; pointer-events: none; }
  .prologue__cap small { display: block; margin-bottom: 8px; font: 700 13px var(--font-display); letter-spacing: 0.26em; color: var(--night-mute); }
  .prologue__cap small :global(.inum) { color: inherit; font-weight: 700; }
  .prologue__title { font: 900 clamp(30px, 3.6vw, 56px)/1.1 var(--font-cjk-bold); }
  .prologue__title :global(.inum) { color: var(--red); font-family: var(--font-display); font-size: 1.25em; }
  .prologue__body { margin-top: 10px; font-size: 17px; color: var(--night-mute); }
  .prologue__body :global(.inum) { color: var(--night-fg); }
  .prologue__hud { position: absolute; right: 24px; top: 22px; text-align: right; font: 700 12px/1.8 var(--font-display); letter-spacing: 0.2em; color: var(--night-mute); pointer-events: none; }
  .prologue__hud b { color: var(--night-fg); }
</style>
```

- [ ] **Step 5: 接入页面并删除点雨**

`src/views/InsightsView.astro`：把 `import InsightsHero from '../components/InsightsHero.astro';` 改为 `import InsightsPrologue from '../components/InsightsPrologue.astro';`，把 `<InsightsHero slot="top" lang={lang} />` 改为 `<InsightsPrologue slot="top" lang={lang} />`。

```bash
git rm src/components/InsightsHero.astro src/scripts/rain.ts src/scripts/rain-dom.ts tests/unit/rain.test.ts
```

- [ ] **Step 6: 运行，确认通过**

Run: `npm test && npx playwright test tests/e2e/prologue.spec.ts tests/e2e/insights.spec.ts tests/e2e/numbers.spec.ts tests/e2e/a11y.spec.ts`
Expected: 全部 PASS（此时还没有渲染器，序章始终是静态）。

- [ ] **Step 7: 提交**

```bash
git add -A src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights prologue: static opening, captions and skip link replace the dot rain" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: WebGL2 渲染器

**Files:**
- Create: `src/scripts/cinema/shaders.ts`, `src/scripts/cinema/renderer.ts`
- Modify: `src/components/InsightsPrologue.astro`（加 `<script>`）
- Test: `tests/e2e/prologue.spec.ts`（追加）

**Interfaces:**
- Consumes: Task 1 全部导出；Task 2 的 DOM 约定。
- Produces: `startPrologue(root: HTMLElement, data: { heat: Rows; nets: number[]; label: string }): void`。成功时 `root.dataset.state = 'live'`、`root.dataset.particles = String(N)`、`canvas.dataset.ready`、`root.dataset.chapter`（'0'–'3'）、`root.dataset.quality`（探测后）；失败或降级到静态时 `root.dataset.state = 'static'`。

- [ ] **Step 1: 写失败的测试**（追加到 `tests/e2e/prologue.spec.ts`）

```ts
const hasWebGL2 = (page: Page) => page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));

test.describe('with WebGL2', () => {
  test('the film takes over the opening and scrolls through its chapters', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop');
    await page.goto(PATH);
    test.skip(!(await hasWebGL2(page)), 'no WebGL2 in this browser');
    const pro = page.locator('[data-prologue]');
    await expect(pro).toHaveAttribute('data-state', 'live', { timeout: 10000 });
    await expect(pro.locator('canvas')).toHaveAttribute('data-ready', '');
    await expect(pro).toHaveAttribute('data-particles', '200000');
    await pro.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * 0.67));
    await expect(pro).toHaveAttribute('data-chapter', '2', { timeout: 5000 });
    await expect.poll(() => page.locator('[data-cap="2"]').evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.5);
  });

  test('mobile gets the lighter budget', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile');
    await page.goto(PATH);
    test.skip(!(await hasWebGL2(page)), 'no WebGL2 in this browser');
    await expect(page.locator('[data-prologue]')).toHaveAttribute('data-particles', '50000', { timeout: 10000 });
  });

  test('a lost context falls back to the static opening', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop');
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(PATH);
    test.skip(!(await hasWebGL2(page)), 'no WebGL2 in this browser');
    const pro = page.locator('[data-prologue]');
    await expect(pro).toHaveAttribute('data-state', 'live', { timeout: 10000 });
    await pro.locator('canvas').evaluate(c => (c as HTMLCanvasElement).getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
    await expect(pro).toHaveAttribute('data-state', 'static');
    await expect(pro.locator('.prologue__static')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
```

Run: `npx playwright test tests/e2e/prologue.spec.ts -g "WebGL2"`
Expected: 若浏览器有 WebGL2：FAIL（`data-state` 一直是 `static`）。若没有：三条都显示 skipped——此时用下面的命令在开启 GPU 的 Edge 上确认失败：
`npx playwright test tests/e2e/prologue.spec.ts -g "WebGL2" --project=desktop` 之前，在 `playwright.config.ts` **不改动**的前提下，另用 `node` 临时脚本（放 `.superpowers/sdd/`，不提交）以 `chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })` 打开页面，确认 `data-state` 停在 `static`；记录结果。

- [ ] **Step 2: 着色器**

`src/scripts/cinema/shaders.ts`：

```ts
/** Point sprites: each particle mixes four shape positions/colours by the story state, flies on a curl between shapes,
 *  rides the chapter shockwave, swirls round the pointer and blasts away from a click. */
export const POINT_VS = `#version 300 es
precision highp float;
in vec3 aP0, aP1, aP2, aP3;
in vec3 aC0, aC1, aC2, aC3;
in float aSeed;
uniform float uState, uTime, uAspect, uDpr, uYaw, uPitch, uDist, uMouseOn, uGain, uPulse, uBoomT;
uniform vec2 uMouse, uBoom;
out vec3 vColor;
float ease(float t) { return t * t * (3.0 - 2.0 * t); }
float seg(float k) { return ease(clamp((uState - k - aSeed * 0.35) / 0.65, 0.0, 1.0)); }
void main() {
  float t0 = seg(0.0), t1 = seg(1.0), t2 = seg(2.0);
  float spin = uTime * 0.12 + 0.6 * (1.0 - length(aP0.xz) / 3.3);
  vec3 g = vec3(cos(spin) * aP0.x - sin(spin) * aP0.z, aP0.y, sin(spin) * aP0.x + cos(spin) * aP0.z);
  vec3 p = mix(mix(mix(g, aP1, t0), aP2, t1), aP3, t2);
  vec3 c = mix(mix(mix(aC0, aC1, t0), aC2, t1), aC3, t2);
  float fly = t0 * (1.0 - t0) + t1 * (1.0 - t1) + t2 * (1.0 - t2);
  float a = aSeed * 6.2831 + uTime * 0.7;
  vec3 curl = vec3(sin(a * 1.3 + p.y * 3.1) + 0.5 * sin(p.z * 5.0 + uTime),
                   cos(a * 0.9 + p.x * 2.3) + 0.5 * cos(p.x * 4.0 - uTime * 1.3),
                   sin(a + p.z * 4.2) + 0.5 * sin(p.y * 6.0 + uTime * 0.8));
  p += fly * 2.4 * curl;
  p += 0.006 * vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 31.0), sin(uTime * 0.9 + aSeed * 17.0));
  float wave = uPulse * 2.6;
  float ring = exp(-pow(length(p.xy) - wave, 2.0) * 14.0) * exp(-uPulse * 1.4);
  p += normalize(p + 1e-4) * ring * 0.16;
  float cy = cos(uYaw), sy = sin(uYaw), cp = cos(uPitch), sp = sin(uPitch);
  vec3 q = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  q = vec3(q.x, cp * q.y - sp * q.z, sp * q.y + cp * q.z);
  q.z -= uDist;
  float w = -q.z;
  if (w < 0.18) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vColor = vec3(0.0); return; }
  vec2 ndc = vec2(q.x * 1.6 / uAspect, q.y * 1.6) / w;
  vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
  float r = max(length(d), 1e-4), fall = uMouseOn * smoothstep(0.34, 0.0, r);
  vec2 dir = d / r, tang = vec2(-dir.y, dir.x);
  ndc += (dir * 0.10 + tang * 0.16) * fall * vec2(1.0 / uAspect, 1.0);
  vec2 bd = (ndc - uBoom) * vec2(uAspect, 1.0);
  float br = max(length(bd), 1e-4), boom = exp(-uBoomT * 2.2) * smoothstep(1.1, 0.0, br) * step(0.0, uBoomT);
  ndc += (bd / br) * boom * (0.35 + aSeed * 0.5) * vec2(1.0 / uAspect, 1.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = min(uDpr * (1.4 + 2.6 * fly) * (3.2 / w), 14.0 * uDpr);
  vColor = c * uGain * (1.0 + 0.8 * fly + ring * 6.0 + boom * 3.0) * smoothstep(0.25, 1.6, w);
}`;

export const POINT_FS = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  o = vec4(vColor * smoothstep(0.25, 0.0, r), 1.0);
}`;

export const QUAD_VS = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0); vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

export const BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main() { vec3 c = texture(uTex, vUv).rgb; float b = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(0.45, 1.6, b), 1.0); }`;

export const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir; out vec4 o;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.227027;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0702703;
  o = vec4(c, 1.0);
}`;

/** Tone map (ACES), chromatic fringe, vignette and film grain over the night background. */
export const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uScene, uB1, uB2; uniform float uTime, uB1Gain; uniform vec2 uRes; out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec2 d = vUv - 0.5; float ca = 0.004 * length(d);
  vec3 s = vec3(texture(uScene, vUv + d * ca * 2.0).r, texture(uScene, vUv).g, texture(uScene, vUv - d * ca * 2.0).b);
  vec3 b = texture(uB1, vUv).rgb * uB1Gain + texture(uB2, vUv).rgb * 0.8;
  vec3 c = aces((s + b) * 0.9) + vec3(0.039, 0.035, 0.031);
  c *= mix(0.62, 1.0, smoothstep(0.9, 0.3, length(d)));
  c += (hash(vUv * uRes + fract(uTime * 7.0) * 91.0) - 0.5) * 0.04;
  o = vec4(c, 1.0);
}`;
```

- [ ] **Step 3: 渲染器**

`src/scripts/cinema/renderer.ts`：

```ts
import { galaxy, textFromPixels, terrain, bars, type Cloud } from './shapes';
import { cam, stateFromScroll } from './camera';
import { particleBudget, decideQuality } from './quality';
import { POINT_VS, POINT_FS, QUAD_VS, BRIGHT_FS, BLUR_FS, COMP_FS } from './shaders';
import type { Rows } from '../morph';

export interface PrologueData { heat: Rows; nets: number[]; label: string }
interface Prog { p: WebGLProgram; u: (name: string) => WebGLUniformLocation | null }
interface Target { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }

/** Upgrades the static prologue to the particle film when this device can take it; otherwise the static opening stays. */
export function startPrologue(root: HTMLElement, data: PrologueData): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;
  let gl: WebGL2RenderingContext | null = null;
  try { gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch { gl = null; }
  if (!gl) return;
  const ctx = gl;
  const later = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 600 }) : window.setTimeout(fn, 60));
  later(() => { build(root, canvas, ctx, data).catch(err => { console.error(err); toStatic(root, ctx); }); });
}

function toStatic(root: HTMLElement, gl: WebGL2RenderingContext): void {
  root.dataset.state = 'static';
  root.dispatchEvent(new CustomEvent('prologue:static'));
  if (!gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
}

function textPixels(label: string) {
  const cw = 1600, ch = 560, o = document.createElement('canvas');
  o.width = cw; o.height = ch;
  const g = o.getContext('2d')!;
  g.font = `700 470px Barlow, 'Arial Narrow', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.fillText(label, cw / 2, ch / 2);
  const img = g.getImageData(0, 0, cw, ch).data, px: number[] = [];
  for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (img[(y * cw + x) * 4 + 3] > 128) px.push(x, y);
  return { px, cw, ch };
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string): Prog {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) ?? 'shader');
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p) ?? 'link');
  const cache = new Map<string, WebGLUniformLocation | null>();
  return { p, u: n => (cache.has(n) ? cache.get(n)! : (cache.set(n, gl.getUniformLocation(p, n)), cache.get(n)!)) };
}

async function build(root: HTMLElement, canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, data: PrologueData): Promise<void> {
  await Promise.race([document.fonts.load('700 400px Barlow'), new Promise(r => setTimeout(r, 1500))]);
  root.dataset.state = 'live'; // lays out the sticky stage so the canvas has a size
  const N = particleBudget(innerWidth, matchMedia('(pointer: coarse)').matches);
  const lite = N < 200000;
  root.dataset.particles = String(N);
  root.querySelector('[data-hud-count]')!.textContent = N.toLocaleString('en-US');
  const sx = Math.min(1, canvas.clientWidth / Math.max(1, canvas.clientHeight) / 1.5);
  const t = textPixels(data.label), rand = Math.random;
  const clouds: Cloud[] = [galaxy(N, rand), textFromPixels(t.px, t.cw, t.ch, N, rand, sx), terrain(N, data.heat, rand, sx), bars(N, data.nets, rand, sx)];

  const hdr = !!gl.getExtension('EXT_color_buffer_float');
  const pts = program(gl, POINT_VS, POINT_FS), bright = program(gl, QUAD_VS, BRIGHT_FS), blur = program(gl, QUAD_VS, BLUR_FS), comp = program(gl, QUAD_VS, COMP_FS);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const attr = (name: string, arr: Float32Array, size: number) => {
    const loc = gl.getAttribLocation(pts.p, name);
    if (loc < 0) return;
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  clouds.forEach((c, k) => { attr(`aP${k}`, c.pos, 3); attr(`aC${k}`, c.col, 3); });
  const seeds = new Float32Array(N); for (let i = 0; i < N; i++) seeds[i] = rand();
  attr('aSeed', seeds, 1);
  const quad = gl.createVertexArray();

  const makeTarget = (w: number, h: number): Target => {
    const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, hdr ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const fbo = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
  };
  let dpr = 1, W = 1, H = 1, aspect = 1;
  let T: Record<'scene' | 'h1' | 'h2' | 'q1' | 'q2', Target> | null = null;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, lite ? 1 : 1.5);
    W = Math.max(4, Math.round(canvas.clientWidth * dpr)); H = Math.max(4, Math.round(canvas.clientHeight * dpr));
    canvas.width = W; canvas.height = H; aspect = W / H;
    if (T) Object.values(T).forEach(x => { gl.deleteTexture(x.tex); gl.deleteFramebuffer(x.fbo); });
    T = { scene: makeTarget(W, H), h1: makeTarget(W >> 1, H >> 1), h2: makeTarget(W >> 1, H >> 1), q1: makeTarget(W >> 2, H >> 2), q2: makeTarget(W >> 2, H >> 2) };
  };
  size();
  addEventListener('resize', size);

  const pass = (prog: Prog, target: Target | null, tex: WebGLTexture, setup?: () => void) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.w : W, target ? target.h : H);
    gl.useProgram(prog.p); gl.bindVertexArray(quad);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u('uTex'), 0);
    setup?.();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const blurPair = (a: Target, b: Target, spread: number) => {
    pass(blur, b, a.tex, () => gl.uniform2f(blur.u('uDir'), spread / a.w, 0));
    pass(blur, a, b.tex, () => gl.uniform2f(blur.u('uDir'), 0, spread / a.h));
  };

  // Scroll, pointer, click
  let state = 0, target = 0, dragYaw = 0, dragPitch = 0, mouseOn = 0, mouseOnTarget = 0, settled = 0, pulseStart = -99, boomStart = -99;
  let mouse: [number, number] = [9, 9], boom: [number, number] = [9, 9];
  let drag: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  const onScroll = () => { const r = root.getBoundingClientRect(); target = stateFromScroll(r.top, r.height, innerHeight); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll(); state = target;
  const toNdc = (e: PointerEvent): [number, number] => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)]; };
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: dragYaw, pitch: dragPitch, moved: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    mouse = toNdc(e);
    if (drag) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) { drag.moved = true; canvas.classList.add('drag'); mouseOnTarget = 0; }
      if (drag.moved) { dragYaw = drag.yaw + (e.clientX - drag.x) * 0.006; dragPitch = Math.max(-0.5, Math.min(0.7, drag.pitch + (e.clientY - drag.y) * 0.004)); }
    } else mouseOnTarget = 1;
  });
  canvas.addEventListener('pointerup', e => { if (drag && !drag.moved) { boom = toNdc(e); boomStart = performance.now() / 1000; } drag = null; canvas.classList.remove('drag'); });
  canvas.addEventListener('pointerleave', () => (mouseOnTarget = 0));

  const caps = [...root.querySelectorAll<HTMLElement>('[data-cap]')];
  const fpsEl = root.querySelector<HTMLElement>('[data-hud-fps]')!;
  let drawCount = N, b1Gain = lite ? 0 : 0.5, stopped = false, visible = true, raf = 0;
  let probe = 0, probeStart = 0, frames = 0, last = performance.now();
  const stop = () => { stopped = true; cancelAnimationFrame(raf); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); toStatic(root, gl); });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !stopped && !raf) raf = requestAnimationFrame(frame); }).observe(root);

  function frame(nowMs: number) {
    raf = 0;
    if (stopped || !visible || !T) return;
    const now = nowMs / 1000;
    state += (target - state) * 0.06;
    mouseOn += (mouseOnTarget - mouseOn) * 0.1;
    if (!drag) { dragYaw *= 0.985; dragPitch *= 0.985; }
    const near = Math.round(state);
    if (Math.abs(state - near) < 0.03 && near !== settled) { settled = near; pulseStart = now; }
    const c = cam(state);

    gl.bindFramebuffer(gl.FRAMEBUFFER, T.scene.fbo); gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pts.p); gl.bindVertexArray(vao);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST);
    const u = pts.u;
    gl.uniform1f(u('uState'), state); gl.uniform1f(u('uTime'), now); gl.uniform1f(u('uAspect'), aspect); gl.uniform1f(u('uDpr'), dpr);
    gl.uniform1f(u('uYaw'), c.yaw + dragYaw + Math.sin(now * 0.25) * 0.08); gl.uniform1f(u('uPitch'), c.pitch + dragPitch); gl.uniform1f(u('uDist'), c.dist);
    gl.uniform2f(u('uMouse'), mouse[0], mouse[1]); gl.uniform1f(u('uMouseOn'), mouseOn); gl.uniform1f(u('uGain'), lite ? 0.34 : 0.13);
    gl.uniform1f(u('uPulse'), now - pulseStart); gl.uniform2f(u('uBoom'), boom[0], boom[1]); gl.uniform1f(u('uBoomT'), now - boomStart);
    gl.drawArrays(gl.POINTS, 0, drawCount);
    gl.disable(gl.BLEND);

    pass(bright, T.h1, T.scene.tex);
    if (b1Gain > 0) { blurPair(T.h1, T.h2, 1.0); blurPair(T.h1, T.h2, 2.0); }
    pass(blur, T.q1, T.h1.tex, () => gl.uniform2f(blur.u('uDir'), 0, 0));
    blurPair(T.q1, T.q2, 1.5); blurPair(T.q1, T.q2, 3.0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(comp.p); gl.bindVertexArray(quad);
    [T.scene, T.h1, T.q1].forEach((x, k) => { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, x.tex); });
    gl.uniform1i(comp.u('uScene'), 0); gl.uniform1i(comp.u('uB1'), 1); gl.uniform1i(comp.u('uB2'), 2);
    gl.uniform1f(comp.u('uTime'), now); gl.uniform2f(comp.u('uRes'), W, H); gl.uniform1f(comp.u('uB1Gain'), b1Gain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    caps.forEach((el, k) => { const v = Math.max(0, 1 - Math.abs(state - k) * 2.2); el.style.opacity = String(v); el.style.transform = `translateY(${(1 - v) * 16}px)`; });
    root.dataset.chapter = String(near);

    // Probe the frame rate once (frames 10–100 while visible), then step down if the device struggles.
    if (probe < 100) {
      probe++;
      if (probe === 10) probeStart = nowMs;
      if (probe === 100) {
        const q = decideQuality(90000 / Math.max(1, nowMs - probeStart));
        root.dataset.quality = q;
        if (q === 'static') { stop(); toStatic(root, gl); return; }
        if (q === 'reduced') { drawCount = N >> 1; b1Gain = 0; }
      }
    }
    frames++;
    if (nowMs - last > 500) { fpsEl.textContent = String(Math.round(frames * 1000 / (nowMs - last))); frames = 0; last = nowMs; }
    raf = requestAnimationFrame(frame);
  }
  canvas.dataset.ready = '';
  raf = requestAnimationFrame(frame);
}
```

`src/components/InsightsPrologue.astro`：在 `</section>` 与 `<style>` 之间加入：

```astro
<script>
  import { startPrologue } from '../scripts/cinema/renderer';
  import data from '../data/insights.json';
  const root = document.querySelector<HTMLElement>('[data-prologue]');
  if (root) startPrologue(root, {
    heat: data.results.heatmap.values as (number | string)[][],
    nets: data.results.merchants.values.map(r => Number(r[3])),
    label: root.dataset.label ?? '',
  });
</script>
```

- [ ] **Step 4: 运行，确认通过**

Run: `npm test && npx playwright test tests/e2e/prologue.spec.ts tests/e2e/insights.spec.ts`
Expected: 全部 PASS；无 WebGL2 的环境里"with WebGL2"三条为 skipped。再用 Step 1 的临时脚本在开启 GPU 的 Edge 上确认：`data-state` 变为 `live`、`data-particles` 为 200000、滚到 67% 时 `data-chapter` 为 2、失去上下文后回到 `static`；把结果记入 ledger。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/cinema/shaders.ts src/scripts/cinema/renderer.ts src/components/InsightsPrologue.astro tests/e2e/prologue.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Insights prologue: WebGL2 particle film with HDR bloom, camera dives, shockwaves and click blasts; static fallback on any failure" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: A 机械计数

**Files:**
- Create: `src/scripts/odometer.ts`, `src/scripts/odometer-dom.ts`
- Modify: `src/styles/base.css`, `src/components/EvidenceRow.astro`, `src/scripts/cockpit-ui.ts`
- Test: `tests/unit/odometer.test.ts`, `tests/e2e/data-motion.spec.ts`

**Interfaces:**
- Produces:
  - `interface Slot { digit: number | null; char: string }`；`slots(text: string): Slot[]`；`reelRows(from: number | null, to: number): { from: number; to: number }`（行号：从 `from === null ? 0 : 10 + from` 转到 `20 + to`）
  - `spinOdometer(el: HTMLElement, final: string, delay = 0, from?: string): void`：减少动态效果时直接写文字；否则元素内为 `<span class="sr">最终文字</span><span class="odo" aria-hidden="true">滚轮…</span>`，结束后换回纯文字并加 `data-spun`。滚轮数字由 CSS 生成内容绘制，元素 `textContent` 全程等于最终文字。

- [ ] **Step 1: 写失败的测试**

`tests/unit/odometer.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { slots, reelRows } from '../../src/scripts/odometer';

describe('odometer', () => {
  it('splits text into digit reels and fixed glyphs', () => {
    expect(slots('¥2,851')).toEqual([
      { digit: null, char: '¥' }, { digit: 2, char: '2' }, { digit: null, char: ',' },
      { digit: 8, char: '8' }, { digit: 5, char: '5' }, { digit: 1, char: '1' },
    ]);
    expect(slots('4.6%').map(s => s.digit)).toEqual([4, null, 6, null]);
    expect(slots('—')).toEqual([{ digit: null, char: '—' }]);
  });
  it('always spins forward at least one full turn', () => {
    expect(reelRows(null, 7)).toEqual({ from: 0, to: 27 });
    expect(reelRows(3, 3)).toEqual({ from: 13, to: 23 });
    expect(reelRows(9, 0)).toEqual({ from: 19, to: 20 });
  });
});
```

`tests/e2e/data-motion.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

test.describe('odometer', () => {
  test('the overview number spins and ends as plain text', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    const num = page.locator('.evidence .num[data-fact="F6"]');
    await expect(num).toHaveAttribute('data-spun', '', { timeout: 5000 });
    await expect(num).toHaveText('2000');
    await expect(num.locator('.odo, .sr')).toHaveCount(0);
  });

  test('text stays final while the reels spin', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    const num = page.locator('.evidence .num[data-fact="F6"]');
    for (let i = 0; i < 10; i++) {
      expect(await num.evaluate(el => el.textContent)).toBe('2000');
      await page.waitForTimeout(80);
    }
  });

  test('reduced motion shows the number without reels', async ({ page }) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/brief/');
    await page.waitForTimeout(800);
    await expect(page.locator('.evidence .num .odo')).toHaveCount(0);
    await expect(page.locator('.evidence .num[data-spun]')).toHaveCount(0);
  });

  test('rapid filters leave the final value and no reels', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto('/projects/campus-delivery/insights/');
    await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
    await expect(page.locator('#ck-from')).toBeEnabled({ timeout: 25000 });
    for (const v of ['2', '5', '9', '3']) await page.locator('#ck-from').fill(v);
    await expect(page.locator('[data-kpi="orders"] .odo')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-kpi="orders"]')).toHaveAttribute('data-spun', '');
  });
});
```

Run: `npx vitest run tests/unit/odometer.test.ts && npx playwright test tests/e2e/data-motion.spec.ts -g odometer`
Expected: 单元 FAIL（找不到模块）；端到端中 `spins and ends`、`rapid filters` FAIL（没有 `data-spun`）；`text stays final`、`reduced motion` 此时通过（守护终态）。

- [ ] **Step 2: 实现**

`src/scripts/odometer.ts`：

```ts
/** Odometer layout: which characters spin, and how far. Pure. */
export interface Slot { digit: number | null; char: string }

export function slots(text: string): Slot[] {
  return [...text].map(char => ({ digit: /\d/.test(char) ? Number(char) : null, char }));
}

/** Reel rows (each row 1em; the strip holds 0–9 three times): start in the first or second turn, stop in the third. */
export function reelRows(from: number | null, to: number): { from: number; to: number } {
  return { from: from === null ? 0 : 10 + from, to: 20 + to };
}
```

`src/scripts/odometer-dom.ts`：

```ts
import { slots, reelRows } from './odometer';

/** Spins el's text in as a mechanical counter. The reels draw their digits with CSS generated content, so el.textContent
 *  is the final text the whole time; when the reels stop, they are replaced by that plain text. A newer spin cancels an older one. */
export function spinOdometer(el: HTMLElement, final: string, delay = 0, from?: string): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = final; return; }
  const run = String(Number(el.dataset.odoRun ?? '0') + 1);
  el.dataset.odoRun = run;
  const fromDigits = from ? slots(from).flatMap(s => (s.digit === null ? [] : [s.digit])) : [];
  const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = final;
  const reels = document.createElement('span'); reels.className = 'odo'; reels.setAttribute('aria-hidden', 'true');
  const anims: Animation[] = [];
  let d = 0;
  for (const s of slots(final)) {
    if (s.digit === null) {
      const g = document.createElement('span'); g.className = 'odo__g'; g.dataset.ch = s.char; reels.append(g);
      anims.push(g.animate([{ opacity: 0, transform: 'translateY(0.3em)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: delay + 250, fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' }));
      continue;
    }
    const reel = document.createElement('span'); reel.className = 'odo__reel';
    const strip = document.createElement('span'); strip.className = 'odo__strip';
    reel.append(strip); reels.append(reel);
    const rows = reelRows(fromDigits[d] ?? null, s.digit);
    anims.push(strip.animate(
      [{ transform: `translateY(-${rows.from}em)`, filter: 'blur(0)' }, { filter: 'blur(5px)', offset: 0.3 }, { filter: 'blur(1.5px)', offset: 0.8 }, { transform: `translateY(-${rows.to}em)`, filter: 'blur(0)' }],
      { duration: 850 + d * 160, delay: delay + d * 40, easing: 'cubic-bezier(.12,.85,.22,1.12)', fill: 'both' },
    ));
    d++;
  }
  el.replaceChildren(sr, reels);
  Promise.all(anims.map(a => a.finished)).then(() => {
    if (el.dataset.odoRun !== run) return;
    el.textContent = final;
    el.dataset.spun = '';
  }).catch(() => { /* cancelled by a newer spin */ });
}
```

`src/styles/base.css`：在 `.reveal:not(.is-in)` 一行之后加入：

```css
/* Odometer (odometer-dom.ts): reels draw their digits with generated content, so the element's text stays the final value. */
.odo { display: inline-flex; font-variant-numeric: tabular-nums; }
.odo__reel { display: inline-block; height: 1em; overflow: hidden; line-height: 1; }
.odo__strip { display: block; white-space: pre; line-height: 1; }
.odo__strip::before { content: '0\A 1\A 2\A 3\A 4\A 5\A 6\A 7\A 8\A 9\A 0\A 1\A 2\A 3\A 4\A 5\A 6\A 7\A 8\A 9\A 0\A 1\A 2\A 3\A 4\A 5\A 6\A 7\A 8\A 9'; }
.odo__g { line-height: 1; }
.odo__g::before { content: attr(data-ch); }
```

`src/components/EvidenceRow.astro`：在 `<style>` 之前加入：

```astro
<script>
  import { spinOdometer } from '../scripts/odometer-dom';
  const nums = document.querySelectorAll<HTMLElement>('.evidence .num[data-fact]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        spinOdometer(el, el.textContent ?? '', 200);
      }
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }
</script>
```

`src/scripts/cockpit-ui.ts`：顶部导入 `import { spinOdometer } from './odometer-dom';`；把 `setKpi` 整个函数替换为：

```ts
  function setKpi(k: KpiId, v: number | null) {
    const el = $<HTMLElement>(`[data-kpi="${k}"]`);
    const was = kpiShown.get(k) ?? null;
    kpiShown.set(k, v);
    const text = kpiText(k, v, lang);
    if (reduced || v === null || was === null || was === v) { el.textContent = text; return; }
    spinOdometer(el, text, 0, kpiText(k, was, lang));
  }
```

- [ ] **Step 3: 运行，确认通过**

Run: `npx vitest run tests/unit/odometer.test.ts && npx playwright test tests/e2e/data-motion.spec.ts tests/e2e/brief.spec.ts tests/e2e/insights.spec.ts tests/e2e/numbers.spec.ts`
Expected: 全部 PASS（`insights.spec.ts` 里驾驶舱"每个指标等于 SQL 结果"的断言用 `toHaveText`，`textContent` 全程为最终值，照旧通过）。

- [ ] **Step 4: 提交**

```bash
git add src/scripts/odometer.ts src/scripts/odometer-dom.ts src/styles/base.css src/components/EvidenceRow.astro src/scripts/cockpit-ui.ts tests/unit/odometer.test.ts tests/e2e/data-motion.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Odometer: the overview figure and dashboard indicators spin in as mechanical counters; text stays final throughout" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: D 冲击排版 + 解码扫描（SQL 页）

**Files:**
- Create: `src/scripts/impact.ts`, `src/scripts/impact-dom.ts`
- Modify: `src/components/CampusDemo.astro`
- Test: `tests/unit/impact.test.ts`, `tests/e2e/data-motion.spec.ts`（追加）

**Interfaces:**
- Produces:
  - `scrambleText(final: string, k: number, rand: () => number): string`：前 `floor(len × k)` 个字符为原文，其后的数字替换为随机数字，非数字始终保留；k ≥ 1 返回原文。
  - `armImpact(section: HTMLElement): void`：给 `.an__kpi` 加 `is-armed`，进入视野后砸入 4 个 `.kpi__v`、区块短震、`.kpi__k` 加 `is-hit`；两张表各自进入视野后扫描解码。减少动态效果时什么都不做。

- [ ] **Step 1: 写失败的测试**

`tests/unit/impact.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { scrambleText } from '../../src/scripts/impact';
import { seeded } from '../../src/scripts/cinema/shapes';

describe('scrambleText', () => {
  it('keeps every non-digit and the length', () => {
    const s = scrambleText('¥2,592', 0, seeded(1));
    expect(s).toHaveLength(6);
    expect(s[0]).toBe('¥');
    expect(s[2]).toBe(',');
    expect(s.replace(/\d/g, '0')).toBe('¥0,000');
  });
  it('locks from the left and ends on the original', () => {
    expect(scrambleText('12.5%', 0.6, seeded(2)).slice(0, 3)).toBe('12.');
    expect(scrambleText('¥2,592', 1, seeded(3))).toBe('¥2,592');
  });
});
```

追加到 `tests/e2e/data-motion.spec.ts`：

```ts
test.describe('impact on the SQL page', () => {
  const read = (page: import('@playwright/test').Page) => page.evaluate(() => ({
    kpis: [...document.querySelectorAll('.an__kpi .kpi__v')].map(e => e.textContent),
    cells: [...document.querySelectorAll('.an__cards table td')].map(e => e.textContent),
  }));

  test('indicators slam in, tables decode, and every value ends as rendered', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto('/projects/campus-delivery/');
    const before = await read(page);
    await expect(page.locator('.an__kpi')).toHaveClass(/is-armed/);
    await page.locator('.an__kpi').scrollIntoViewIfNeeded();
    await expect(page.locator('.kpi__k.is-hit')).toHaveCount(4, { timeout: 4000 });
    await page.locator('.an__cards').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    expect(await read(page)).toEqual(before);
    await expect(page.locator('.an__cards .scanline')).toHaveCount(0);
  });

  test('reduced motion: no arming, no scan', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects/campus-delivery/');
    await page.locator('.an__cards').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await expect(page.locator('.an__kpi.is-armed')).toHaveCount(0);
    await expect(page.locator('.kpi__k.is-hit')).toHaveCount(0);
    await expect(page.locator('.an__cards .scanline')).toHaveCount(0);
  });
});
```

Run: `npx vitest run tests/unit/impact.test.ts && npx playwright test tests/e2e/data-motion.spec.ts -g impact`
Expected: 单元 FAIL（找不到模块）；端到端第一条 FAIL（没有 `is-armed`），第二条通过（守护）。

- [ ] **Step 2: 实现**

`src/scripts/impact.ts`：

```ts
const DIGITS = '0123456789';

/** A decoding frame: characters left of the lock point are final; digits right of it are noise; everything else stays. */
export function scrambleText(final: string, k: number, rand: () => number): string {
  if (k >= 1) return final;
  const lock = Math.floor(final.length * Math.max(0, k));
  let out = '';
  for (let i = 0; i < final.length; i++) out += i < lock || !/\d/.test(final[i]) ? final[i] : DIGITS[Math.floor(rand() * 10)];
  return out;
}
```

`src/scripts/impact-dom.ts`：

```ts
import { scrambleText } from './impact';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const once = (el: Element, fn: () => void, margin = '0px 0px -20% 0px') => {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
};

/** Indicators hit the page one after another (the block jolts, labels get a black wipe); each table is swept by a red
 *  line that decodes its figures. Every cell ends with exactly its rendered text. */
export function armImpact(section: HTMLElement): void {
  if (reduced() || !('IntersectionObserver' in window)) return;
  const strip = section.querySelector<HTMLElement>('.an__kpi');
  if (strip) {
    strip.classList.add('is-armed');
    once(strip, () => {
      const values = [...strip.querySelectorAll<HTMLElement>('.kpi__v')], labels = [...strip.querySelectorAll<HTMLElement>('.kpi__k')];
      values.forEach((el, i) => {
        const delay = i * 400;
        el.animate([
          { transform: 'scale(3.2) translateY(-8%)', opacity: 0, filter: 'blur(12px)' },
          { transform: 'scale(.93)', opacity: 1, filter: 'blur(0)', offset: 0.72 },
          { transform: 'none', opacity: 1, filter: 'blur(0)' },
        ], { duration: 550, delay, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' });
        strip.animate([{ transform: 'none' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-2px)' }, { transform: 'translate(-2px,1px)' }, { transform: 'none' }], { duration: 220, delay: delay + 400 });
        setTimeout(() => labels[i]?.classList.add('is-hit'), delay + 420);
      });
      strip.classList.remove('is-armed');
    }, '0px 0px -25% 0px');
  }
  section.querySelectorAll<HTMLElement>('.an__cards .table-wrap').forEach(wrap => once(wrap, () => scan(wrap)));
}

function scan(wrap: HTMLElement): void {
  const rows = [...wrap.querySelectorAll<HTMLTableRowElement>('tbody tr')];
  const line = document.createElement('i');
  line.className = 'scanline'; line.setAttribute('aria-hidden', 'true');
  wrap.append(line);
  const per = 180, h = wrap.clientHeight;
  line.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${h}px)`, opacity: 1, offset: 0.92 }, { transform: `translateY(${h}px)`, opacity: 0 }], { duration: per * rows.length + 300, easing: 'linear', fill: 'forwards' })
    .finished.catch(() => undefined).then(() => line.remove());
  rows.forEach((tr, i) => {
    const cells = [...tr.cells].filter(td => td.childElementCount === 0 && /\d/.test(td.textContent ?? ''));
    setTimeout(() => {
      if (i === 0) tr.classList.add('is-top');
      cells.forEach(decode);
    }, 120 + i * per);
  });
}

function decode(td: HTMLTableCellElement): void {
  const final = td.textContent ?? '';
  const t0 = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / 600);
    td.textContent = scrambleText(final, k * k, Math.random);
    if (k < 1) requestAnimationFrame(step); else td.textContent = final;
  };
  requestAnimationFrame(step);
}
```

`src/components/CampusDemo.astro`：
1. 在已有 `<script>` 块中（`initDelivery` 那一行之后）加入：

```ts
  import { armImpact } from '../scripts/impact-dom';
  document.querySelectorAll<HTMLElement>('[data-campus] .an').forEach(armImpact);
```

（`import` 行放到该脚本块顶部。）

2. `<style>` 中 `.kpi__k { … }` 一行替换为：

```css
  .kpi__k { position: relative; isolation: isolate; justify-self: start; padding: 1px 6px; margin-left: -6px; font-size: 14px; color: var(--mute); transition: color 0.2s var(--ease) 0.2s; }
  .kpi__k::before { content: ''; position: absolute; inset: 0; z-index: -1; background: var(--ink); transform: scaleX(0); transform-origin: left; }
  .kpi__k.is-hit { color: var(--paper); }
  .kpi__k.is-hit::before { animation: kpi-wipe 0.45s var(--ease) forwards; }
  @keyframes kpi-wipe { to { transform: scaleX(1); } }
  .an__kpi.is-armed .kpi__v { opacity: 0; }
  .table-wrap { position: relative; }
  .table-wrap :global(.scanline) { position: absolute; left: 0; right: 0; top: 0; height: 40px; margin-top: -40px; pointer-events: none; background: linear-gradient(to bottom, transparent, rgb(232 56 13 / 0.14)); border-bottom: 2px solid var(--red); }
  .table-wrap :global(tr.is-top td) { animation: top-flash 1.2s var(--ease); }
  @keyframes top-flash { 20% { background: rgb(232 56 13 / 0.22); } }
```

（`.table-wrap { overflow-x: auto; max-width: 100%; }` 原规则保留，新增的 `position: relative` 作为单独一行。）

- [ ] **Step 3: 运行，确认通过**

Run: `npx vitest run tests/unit/impact.test.ts && npx playwright test tests/e2e/data-motion.spec.ts tests/e2e/campus.spec.ts tests/e2e/motion-campus.spec.ts tests/e2e/a11y.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 4: 提交**

```bash
git add src/scripts/impact.ts src/scripts/impact-dom.ts src/components/CampusDemo.astro tests/unit/impact.test.ts tests/e2e/data-motion.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "SQL page: indicators slam in, ranking tables are scanned and decoded, every value ends as rendered" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 全站验收

- [ ] **Step 1: 全量测试**

Run: `npm test && npx playwright test`
Expected: 全部 PASS（无 WebGL2 的环境里"with WebGL2"三条为 skipped）。

- [ ] **Step 2: 带 GPU 截图检查**

临时脚本（`.superpowers/sdd/`，不提交），`chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })`，对 `node tools/serve-dist.mjs 4398`：
- 进阶版序章在 0、33%、50%、67%、100% 五处的画面（桌面）与 33% 处（390 宽手机视口）；
- 在"5,142"上点击后 250 ms 的画面；
- 用初始化脚本屏蔽 WebGL2 后的静态开场；
- 快速概览大数字转动中与结束后；SQL 页指标砸入中、表格解码中。

对照 v7 原型检查亮度、字幕位置、无裁切；发现问题就修，修完重跑 Step 1，并记 Ruling。

- [ ] **Step 3: 提交（仅当 Step 2 有修改）**

```bash
git add -A src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Data motion: acceptance fixes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
