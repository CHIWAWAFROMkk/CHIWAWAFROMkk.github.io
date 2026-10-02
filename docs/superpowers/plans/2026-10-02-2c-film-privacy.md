# 2C：Mais je t'aime 剪辑台页、隐私页与上线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新站补齐旧站仍在用的两页——暗场的 Mais je t'aime 短片页（核心是与成片同步的剪辑台）和按新站真实行为重写的隐私页，补上 `sitemap.xml`，然后把构建成品推到 `main` 上线。

**Architecture:** 剪辑数据从 `edit_60s.py` 逐行转录成 `src/data/film-edit.ts`（纯数据 + 纯函数）；页面文案集中在 `src/data/film.ts`；成片的画面颜色与音轨峰值由 `tools/film-signals.mjs` 用 ffmpeg 一次性提取成 JSON 入库。短片页复用 `ProjectLayout`，新增 `night` 开关，通过 `body.night` 改写颜色 tokens 实现整页暗场；剪辑台的轨道和镜头块在构建时按百分比定位，浏览器脚本只负责播放头、跳转、镜头卡切换和画布绘制。隐私页是 `Base` + Markdown 正文。上线时从 `origin/main` 开干净工作区放入 `dist/` 与 `.nojekyll`，普通推送。

**Tech Stack:** Astro 7、TypeScript、Canvas 2D、ffmpeg（只在生成数据时用）、Vitest、Playwright（Edge）。

**Spec:** `docs/superpowers/specs/2026-10-02-2c-film-privacy-design.md`

## 用户已确认的决定（2026-10-02）

| 问题 | 决定 |
| --- | --- |
| 缺的两页 | 先按新设计重做再上线（不原样搬旧页） |
| 发布方式 | 构建成品推到 `main`（不切 GitHub Actions），源码推到 `redesign` 分支备份 |
| 短片页核心 | 剪辑台时间轴：成片 + 色带 / 镜头轨 / 声波轨，播放头同步，点镜头跳转并展开镜头卡 |

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`。**Task 7 之前不推送**；Task 7 只在用户本地看过并同意后执行。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。只 `git add` 明确列出的路径；`.superpowers/` 永不提交；不用裸 `git stash`。
- 素材以 origin/main（90cd241）的 `assets/mais-je-taime/` 为准，原样复制，不重新编码。
- 剪辑台上的每个时间、倍数都由 `film-edit.ts` 计算得出，不手写；`film-edit.ts` 的每一行都能在 `edit_60s.py` 里找到。
- S02 如实标注"出片但未用于成片"。
- 数字测试：`main` 里 `[data-film]`、`.prose` 等排除区以外的阿拉伯数字必须出现在事实台账里；摘要、标签、导语不写阿拉伯数字（F8 原文除外）。
- 颜色只用 tokens 变量（可用 `color-mix()` 调透明度）；动效亮度克制；减少动态效果时不做 rAF 平滑、不自动播放。
- 隐私页的每句话都必须符合新站的真实行为（已核对：外部资源只有链接，没有外部脚本 / 字体 / 统计；唯一的浏览器存储是 `hyj-intro-seen`）。

## Review Focus

1. **页面刚打开、成片元数据还没加载时就点镜头**：应等元数据就绪后跳到该镜头起点，而不是停在 0 → Task 4 `a shot clicked before the film is ready still seeks`。
2. **`film-signals.json` 加载失败**：色带和声波空着，镜头轨、播放头、镜头卡照常工作，没有脚本错误 → Task 4 `without the signals file the desk still works`。
3. **减少动态效果**：镜头卡的分镜视频不自动播放；播放头仍随 `timeupdate` 移动 → Task 4 `reduced motion: card clips stay still`。
4. **关掉 JavaScript**：成片、S01 镜头卡、四幕分镜、返修记录、废片都能看 → Task 4 `without JavaScript`。
5. **手机上极窄的镜头块（S14b 只有约 4 px 宽）**：用"上一镜 / 下一镜"能走遍全部 23 张镜头卡，页面不横向溢出 → Task 4 `previous / next walk every card, S02 included`（桌面与手机两个项目都跑）。

---

## 文件结构

```
public/media/mais-je-taime/**                 新/改：从 origin/main 原样复制的首帧、draft/、video/（含成片与废片）
public/media/mais-je-taime/film-signals.json  新：成片每 0.1 秒的平均颜色与音轨峰值（工具生成）
tools/film-signals.mjs                        新：ffmpeg 提取上面的数据
src/data/film-edit.ts                         新：剪辑表转录 + slots()
src/data/film.ts                              新：镜头说明、四幕、返修、废片、剪辑台文字（中英）
src/scripts/film-desk.ts                      新：纯函数 pct / timeAt / clock / speedLabel / stepIndex
src/scripts/film-desk-dom.ts                  新：剪辑台浏览器脚本
src/components/FilmRed.astro                  新："全片只有一种红"
src/components/FilmStory.astro                新：规则、四幕分镜、返修记录、废片
src/components/FilmDesk.astro                 新：剪辑台
src/views/FilmView.astro                      新
src/views/PrivacyView.astro                   新
src/copy/projects/mais-je-taime.{zh,en}.md    新：工具与流程
src/copy/privacy.{zh,en}.md                   新
src/pages/projects/mais-je-taime.astro、src/pages/en/projects/mais-je-taime.astro   新
src/pages/privacy.astro、src/pages/en/privacy.astro                                 新
src/pages/sitemap.xml.ts                      新
src/data/facts.ts                             改：F8
src/data/site.ts                              改：film.clips 取自 FILM_SHOTS；项目状态；pages.film / pages.privacy
src/layouts/ProjectLayout.astro               改：night 开关
src/styles/base.css                           改：body.night 改写 tokens
tests/unit/film-signals.test.ts、film-edit.test.ts、film-desk.test.ts、privacy.test.ts   新
tests/unit/facts.test.ts、contrast.test.ts    改
tests/e2e/film.spec.ts、privacy.spec.ts、legacy.spec.ts   新
tests/e2e/helpers.ts、numbers.spec.ts、links.spec.ts、reel.spec.ts   改
```

---

### Task 1: 素材与成片信号

**Files:**
- Create: `public/media/mais-je-taime/**`（复制）、`tools/film-signals.mjs`、`public/media/mais-je-taime/film-signals.json`
- Test: `tests/unit/film-signals.test.ts`

**Interfaces:**
- Produces: `/media/mais-je-taime/{sNN}.webp`（首帧 1200×675）、`/media/mais-je-taime/draft/*.webp`（800×450）、`/media/mais-je-taime/video/{sNN,fail-*,film-60s}.{mp4,webp}`；`film-signals.json` = `{ fps: 10, colors: string[600], peaks: number[600] }`。

- [ ] **Step 1: 原样复制素材**

```bash
T="$TEMP/mjt-assets" && rm -rf "$T" && mkdir -p "$T" && git archive 90cd241 assets/mais-je-taime | tar -x -C "$T"
cp -r "$T/assets/mais-je-taime/." public/media/mais-je-taime/
find public/media/mais-je-taime -type f | wc -l     # 期望 101（旧站 assets/mais-je-taime 的文件数）
git ls-tree -r --name-only 90cd241 assets/mais-je-taime | wc -l
```

两行数字一致（`film-signals.json` 还没生成）。

- [ ] **Step 2: 写失败的测试**

`tests/unit/film-signals.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const S = JSON.parse(readFileSync('public/media/mais-je-taime/film-signals.json', 'utf8')) as { fps: number; colors: string[]; peaks: number[] };
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

describe('film signals', () => {
  it('has one colour and one peak per tenth of a second of the 60-second film', () => {
    expect(S.fps).toBe(10);
    expect(S.colors).toHaveLength(600);
    expect(S.peaks).toHaveLength(600);
  });

  it('colours are #rrggbb and peaks are normalised to 0…1', () => {
    for (const c of S.colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    for (const p of S.peaks) { expect(p).toBeGreaterThanOrEqual(0); expect(p).toBeLessThanOrEqual(1); }
    expect(Math.max(...S.peaks)).toBe(1);
  });

  it('the desaturated flashback (S07–S13, 23.0–39.5 s) reads as grey', () => {
    const grey = S.colors.slice(230, 395).filter(c => { const [r, g, b] = rgb(c); return Math.max(r, g, b) - Math.min(r, g, b) <= 12; });
    expect(grey.length / 165).toBeGreaterThanOrEqual(0.9);
  });

  it('the dock in the present (S01, 3–6 s) is bluer than it is red', () => {
    const blue = S.colors.slice(30, 60).filter(c => { const [r, , b] = rgb(c); return b > r; });
    expect(blue.length).toBeGreaterThanOrEqual(20);
  });
});
```

- [ ] **Step 3: 运行，确认失败**

Run: `npx vitest run tests/unit/film-signals.test.ts`
Expected: FAIL，`ENOENT … film-signals.json`

- [ ] **Step 4: 写提取工具并生成数据**

`tools/film-signals.mjs`：

```js
// Picture colour and soundtrack peaks of the finished Mais je t'aime film, every 0.1 s, for the edit desk.
// Run once after the film changes: node tools/film-signals.mjs   (set FFMPEG to override the ffmpeg path)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const FF = process.env.FFMPEG ?? 'C:/Users/yoshi/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const FILM = 'public/media/mais-je-taime/video/film-60s.mp4';
const OUT = 'public/media/mais-je-taime/film-signals.json';
const FPS = 10, N = 600, SR = 8000, PER = SR / FPS;

const run = args => execFileSync(FF, ['-v', 'error', '-i', FILM, ...args, '-'], { maxBuffer: 1 << 28 });

// One frame every 0.1 s, scaled to a single pixel with area averaging = the frame's mean colour.
const rgb = run(['-vf', `fps=${FPS},scale=1:1:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24']);
const hex = v => v.toString(16).padStart(2, '0');
const colors = Array.from({ length: N }, (_, i) => {
  const j = Math.min(i, rgb.length / 3 - 1) * 3;
  return `#${hex(rgb[j])}${hex(rgb[j + 1])}${hex(rgb[j + 2])}`;
});

// Mono 8 kHz PCM; the loudest sample in each 0.1 s, normalised to the loudest in the film.
const pcm = run(['-vn', '-ac', '1', '-ar', String(SR), '-f', 's16le']);
const raw = Array.from({ length: N }, (_, i) => {
  let m = 0;
  for (let k = i * PER; k < (i + 1) * PER && 2 * k + 1 < pcm.length; k++) m = Math.max(m, Math.abs(pcm.readInt16LE(2 * k)));
  return m;
});
const top = Math.max(...raw) || 1;
const peaks = raw.map(m => Math.round((m / top) * 1000) / 1000);

writeFileSync(OUT, JSON.stringify({ fps: FPS, colors, peaks }) + '\n');
console.log(`${OUT}: ${colors.length} colours, ${peaks.length} peaks`);
```

Run: `node tools/film-signals.mjs`
Expected: `public/media/mais-je-taime/film-signals.json: 600 colours, 600 peaks`

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run tests/unit/film-signals.test.ts`
Expected: PASS（4 项）。若"码头偏蓝"一项不过，打印 `S.colors.slice(30, 60)` 看实际颜色，按实际画面改断言并在提交说明里写明原因——不要改数据。

- [ ] **Step 6: 提交**

```bash
git add public/media/mais-je-taime tools/film-signals.mjs tests/unit/film-signals.test.ts
git commit -m "Mais je t'aime media from the live site, and the film's colour and sound every 0.1 s"
```

---

### Task 2: 剪辑表、文案数据与事实

**Files:**
- Create: `src/data/film-edit.ts`、`src/data/film.ts`、`src/scripts/film-desk.ts`
- Modify: `src/data/facts.ts:27`（F8）、`src/data/site.ts`（film.clips、mais-je-taime 状态、pages.film）
- Test: `tests/unit/film-edit.test.ts`、`tests/unit/film-desk.test.ts`、`tests/unit/facts.test.ts:24-25`、`tests/e2e/reel.spec.ts:43,83`

**Interfaces:**
- Produces（`film-edit.ts`）：`interface EditRow { id: string; src: string | null; inPt: number; outPt: number; start: number; gray: boolean }`、`interface Slot extends EditRow { stop: number; speed: number | null }`、`FPS = 24`、`END = 60`、`S16_START`、`EDIT: readonly EditRow[]`、`TRANSITIONS: readonly { at: number; kind: 'dissolve' | 'dip'; dur: number }[]`、`BEATS: readonly { key: 'vocal' | 'shot' | 'turn'; at: number; label: string }[]`、`slots(): Slot[]`。
- Produces（`film.ts`）：`ActKey`、`Frame`、`FilmShot`、`Revision`、`Reject` 类型；`FILM_SHOTS`（23 项，故事顺序）、`ACTS`、`REVISIONS`（10 项）、`REJECTS`（5 项）、`FILM_TEXT`、`DESK`。
- Produces（`film-desk.ts`）：`pct(t): number`（0–100）、`timeAt(x, width): number`、`clock(t): string`（`0:43.9`）、`speedLabel(v): string`（`0.98×`）、`stepIndex(len, i, dir: 1 | -1): number`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/film-edit.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { EDIT, END, TRANSITIONS, BEATS, S16_START, slots } from '../../src/data/film-edit';

const S = slots();
const byId = new Map(S.map(s => [s.id, s]));

describe('the edit list', () => {
  it('has the opening black, 22 shots and the title, S02 not among them', () => {
    expect(S).toHaveLength(24);
    expect(S[0].id).toBe('S00');
    expect(S.at(-1)!.id).toBe('S21');
    expect(S.filter(s => s.src !== null)).toHaveLength(22);
    expect(byId.has('S02')).toBe(false);
  });

  it('runs from 0 to 60 s with every slot ending where the next begins', () => {
    expect(S[0].start).toBe(0);
    expect(S.at(-1)!.stop).toBe(END);
    expect(END).toBe(60);
    S.slice(1).forEach((s, i) => { expect(s.start).toBeGreaterThan(S[i].start); expect(S[i].stop).toBe(s.start); });
  });

  it('puts every transition on a cut', () => {
    for (const t of TRANSITIONS) expect(S.some(s => Math.abs(s.start - t.at) < 0.02), String(t.at)).toBe(true);
  });

  it('desaturates exactly the flashback S05a–S13', () => {
    expect(S.filter(s => s.gray).map(s => s.id)).toEqual(['S05a', 'S05b', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11', 'S12', 'S13']);
  });

  it('computes speed the way edit_60s.py does (whole frames at 24 fps)', () => {
    expect(byId.get('S01')!.speed).toBeCloseTo(0.98, 3);     // 4.9 s of source in 120 frames
    expect(byId.get('S03')!.speed).toBeCloseTo(1.008, 3);    // 5.04 s in 120 frames
    expect(byId.get('S14c')!.speed).toBeCloseTo(1.263, 3);   // 1.0 s in 19 frames
    expect(byId.get('S00')!.speed).toBeNull();
    for (const s of S) if (s.speed !== null) { expect(s.speed).toBeGreaterThan(0.8); expect(s.speed).toBeLessThan(2.6); }
  });

  it('places S16 so its white frame lands on the 44.17 s gunshot', () => {
    expect(S16_START).toBeCloseTo(43.880, 3);
    expect(byId.get('S16')!.start).toBe(S16_START);
  });

  it('marks the three beats inside the film', () => {
    expect(BEATS.map(b => b.label)).toEqual(['0:12', '0:44', '0:52']);
    for (const b of BEATS) expect(b.at).toBeLessThan(END);
  });

  it('keeps the raw rows unchanged', () => {
    expect(EDIT.find(r => r.id === 'S19')).toEqual({ id: 'S19', src: 'S19_即梦_01', inPt: 1.0, outPt: 4.4, start: 54.17, gray: false });
  });
});
```

`tests/unit/film-desk.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { pct, timeAt, clock, speedLabel, stepIndex } from '../../src/scripts/film-desk';

describe('film desk helpers', () => {
  it('maps film time to a percentage of the track, clamped', () => {
    expect(pct(0)).toBe(0);
    expect(pct(30)).toBe(50);
    expect(pct(60)).toBe(100);
    expect(pct(-3)).toBe(0);
    expect(pct(75)).toBe(100);
  });

  it('maps a click on the track back to film time, clamped', () => {
    expect(timeAt(50, 100)).toBe(30);
    expect(timeAt(-5, 100)).toBe(0);
    expect(timeAt(500, 100)).toBe(60);
    expect(timeAt(10, 0)).toBe(0);
  });

  it('prints m:ss.s and rolls over at the minute', () => {
    expect(clock(0)).toBe('0:00.0');
    expect(clock(7.17)).toBe('0:07.2');
    expect(clock(43.880229)).toBe('0:43.9');
    expect(clock(59.99)).toBe('1:00.0');
  });

  it('prints speeds with two decimals', () => {
    expect(speedLabel(0.98)).toBe('0.98×');
    expect(speedLabel(1.2632)).toBe('1.26×');
  });

  it('steps within bounds', () => {
    expect(stepIndex(22, 0, -1)).toBe(0);
    expect(stepIndex(22, 21, 1)).toBe(21);
    expect(stepIndex(22, 4, 1)).toBe(5);
    expect(stepIndex(22, -1, 1)).toBe(0);
  });
});
```

`tests/unit/facts.test.ts` 第 24–25 行改为：

```ts
    expect(fact('F8').text.zh).toMatch(/23.*22/);
    expect(fact('F8').text.en).toMatch(/23.*22/);
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/film-edit.test.ts tests/unit/film-desk.test.ts tests/unit/facts.test.ts`
Expected: FAIL（找不到模块；F8 不匹配）

- [ ] **Step 3: 剪辑表**

`src/data/film-edit.ts`：

```ts
/**
 * The final cut of Mais je t'aime, transcribed row by row from
 * D:\Users\yoshi\AgentWorkspace\MaisJeTaime\成片\edit_60s.py — SHOTS (lines 26–49), END (line 51), TRANS (lines 54–57).
 * A row is (shot, source clip, source in, source out, start in the film, desaturated in the edit); a slot runs to the
 * next row's start. S02 was generated but is not in the cut: S01 runs on to 7.17 s in its place.
 */
export interface EditRow { id: string; src: string | null; inPt: number; outPt: number; start: number; gray: boolean }
export interface Slot extends EditRow { stop: number; speed: number | null }

export const FPS = 24;
export const END = 60.0;
const S16_SP = 3.6667 / 4.25;
/** S16 holds a white frame and a black frame (frames 6 and 7), slowed slightly so the white one lands on the 44.17 s gunshot. */
export const S16_START = 44.17 - (6 / 24) / S16_SP;

export const EDIT: readonly EditRow[] = [
  { id: 'S00', src: null, inPt: 0, outPt: 0, start: 0.00, gray: false },
  { id: 'S01', src: 'S01_即梦_01', inPt: 0.1, outPt: 5.0, start: 2.17, gray: false },
  { id: 'S03', src: 'S03_可灵_01', inPt: 0.0, outPt: 5.04, start: 7.17, gray: false },
  { id: 'S04', src: 'S04_即梦_02', inPt: 0.0, outPt: 4.5, start: 12.17, gray: false },
  { id: 'S05a', src: 'S05a_即梦_05', inPt: 0.3, outPt: 2.7, start: 16.17, gray: true },
  { id: 'S05b', src: 'S05b_即梦_01', inPt: 0.5, outPt: 3.5, start: 18.17, gray: true },
  { id: 'S06', src: 'S06_即梦_01', inPt: 0.3, outPt: 3.5, start: 20.17, gray: true },
  { id: 'S07', src: 'S07_即梦_01_去色', inPt: 0.8, outPt: 4.8, start: 22.17, gray: true },
  { id: 'S08', src: 'S08_即梦_01_去色', inPt: 0.5, outPt: 4.5, start: 24.17, gray: true },
  { id: 'S09', src: 'S09_即梦_01_去色', inPt: 0.2, outPt: 4.2, start: 26.17, gray: true },
  { id: 'S10', src: 'S10_即梦_01_去色', inPt: 0.2, outPt: 4.2, start: 28.17, gray: true },
  { id: 'S11', src: 'S11_即梦_01_去色', inPt: 0.3, outPt: 4.3, start: 32.17, gray: true },
  { id: 'S12', src: 'S12_可灵_01', inPt: 0.0, outPt: 2.3, start: 34.17, gray: true },
  { id: 'S13', src: 'S13_可灵_01_去色', inPt: 0.0, outPt: 4.5, start: 36.17, gray: true },
  { id: 'S14a', src: 'S14a_可灵_01', inPt: 0.5, outPt: 1.3, start: 40.17, gray: false },
  { id: 'S14b', src: 'S14b_可灵_01', inPt: 0.2, outPt: 1.0, start: 40.98, gray: false },
  { id: 'S14c', src: 'S14c_可灵_01', inPt: 4.0, outPt: 5.0, start: 41.79, gray: false },
  { id: 'S15', src: 'S15_可灵_01', inPt: 0.3, outPt: 2.3, start: 42.60, gray: false },
  { id: 'S16', src: 'S16_定稿_即梦03剪辑', inPt: 0.0, outPt: 3.6667, start: S16_START, gray: false },
  { id: 'S17', src: 'S17_可灵_01', inPt: 0.3, outPt: 5.0, start: 48.17, gray: false },
  { id: 'S18', src: 'S18_可灵_01', inPt: 1.5, outPt: 5.0, start: 52.17, gray: false },
  { id: 'S19', src: 'S19_即梦_01', inPt: 1.0, outPt: 4.4, start: 54.17, gray: false },
  { id: 'S20', src: 'S20_可灵_01_后期上升', inPt: 0.0, outPt: 5.0, start: 56.17, gray: false },
  { id: 'S21', src: null, inPt: 0, outPt: 0, start: 59.40, gray: false },
];

/** Cuts not listed here are hard cuts. */
export const TRANSITIONS: readonly { at: number; kind: 'dissolve' | 'dip'; dur: number }[] = [
  { at: 7.17, kind: 'dissolve', dur: 0.5 }, { at: 16.17, kind: 'dissolve', dur: 0.4 }, { at: 18.17, kind: 'dissolve', dur: 0.25 },
  { at: 20.17, kind: 'dissolve', dur: 0.4 }, { at: 22.17, kind: 'dissolve', dur: 0.4 }, { at: 24.17, kind: 'dissolve', dur: 0.4 },
  { at: 26.17, kind: 'dissolve', dur: 0.4 }, { at: 28.17, kind: 'dip', dur: 0.4 }, { at: 48.17, kind: 'dissolve', dur: 0.5 },
  { at: 54.17, kind: 'dissolve', dur: 0.3 }, { at: 56.17, kind: 'dissolve', dur: 0.6 },
];

/** Vocals enter with S04, the gunshot is S16's white frame, the music collapses with S18. */
export const BEATS: readonly { key: 'vocal' | 'shot' | 'turn'; at: number; label: string }[] = [
  { key: 'vocal', at: 12.17, label: '0:12' }, { key: 'shot', at: 44.17, label: '0:44' }, { key: 'turn', at: 52.17, label: '0:52' },
];

const fr = (t: number) => Math.round(t * FPS);

/** Each row with its end and its speed (source seconds ÷ whole frames of the slot, as edit_60s.py renders it). */
export function slots(): Slot[] {
  return EDIT.map((r, i) => {
    const stop = i + 1 < EDIT.length ? EDIT[i + 1].start : END;
    const speed = r.src === null ? null : (r.outPt - r.inPt) / ((fr(stop) - fr(r.start)) / FPS);
    return { ...r, stop, speed };
  });
}
```

- [ ] **Step 4: 核对转录（一次性，不入库）**

```bash
node -e "
const py=require('fs').readFileSync('D:/Users/yoshi/AgentWorkspace/MaisJeTaime/成片/edit_60s.py','utf8');
const rows=[...py.matchAll(/\('(S\w+)', (None|'[^']+'), ([\d.]+), ([\d.]+), ([\w.]+), (True|False)\)/g)].map(m=>({id:m[1],src:m[2]==='None'?null:m[2].slice(1,-1),inPt:+m[3],outPt:+m[4],start:m[5]==='S16_START'?'S16_START':+m[5],gray:m[6]==='True'}));
console.log(JSON.stringify(rows));" > "$TEMP/edit-py.json"
node --input-type=module -e "
import { EDIT } from './src/data/film-edit.ts';
import { readFileSync } from 'node:fs';
const py = JSON.parse(readFileSync(process.env.TEMP + '/edit-py.json', 'utf8'));
const ts = EDIT.map(r => ({ ...r, start: r.id === 'S16' ? 'S16_START' : r.start }));
console.log(JSON.stringify(py) === JSON.stringify(ts) ? 'MATCH' : 'DIFF\n' + JSON.stringify(py) + '\n' + JSON.stringify(ts));"
```

Expected: `MATCH`。（Node 24 直接剥离 TypeScript 类型，`film-edit.ts` 只有可擦除的类型、没有 import，可以直接导入。）

- [ ] **Step 5: 剪辑台纯函数**

`src/scripts/film-desk.ts`：

```ts
import { END } from '../data/film-edit';

/** Film time → percentage across the track (0–100), clamped. */
export const pct = (t: number): number => (Math.min(Math.max(t, 0), END) / END) * 100;

/** A click x pixels into a track of the given width → film time, clamped. */
export const timeAt = (x: number, width: number): number => (width > 0 ? Math.min(Math.max(x / width, 0), 1) * END : 0);

/** 43.88 → '0:43.9'; rounds to tenths first so 59.99 becomes '1:00.0', not '0:60.0'. */
export function clock(t: number): string {
  const tenths = Math.round(Math.max(0, t) * 10);
  const m = Math.floor(tenths / 600);
  return `${m}:${((tenths - m * 600) / 10).toFixed(1).padStart(4, '0')}`;
}

export const speedLabel = (v: number): string => `${v.toFixed(2)}×`;

/** The next index in a direction, kept inside 0…len-1 (a missing index counts as before the first). */
export const stepIndex = (len: number, i: number, dir: 1 | -1): number => Math.min(Math.max(i + dir, 0), len - 1);
```

- [ ] **Step 6: 文案数据**

`src/data/film.ts`：

```ts
import type { Bi } from '../i18n';

const b = (zh: string, en: string): Bi => ({ zh, en });

export type ActKey = 'dock' | 'love' | 'betrayal' | 'standoff';
/** A storyboard still in /media/mais-je-taime/; `tag` tells first and end frames apart. */
export interface Frame { file: string; tag?: Bi; note: Bi }
export interface FilmShot { id: string; file: string; title: Bi; made: Bi; clip: Bi; act: ActKey; frames: Frame[]; revision?: string }
export interface Revision { key: string; title: Bi; rule: Bi; drafts: { file: string; note: Bi }[]; final: { file: string; note: Bi } }
export interface Reject { file: string; title: Bi; note: Bi }

const FIRST = b('首帧', 'first frame');
const LAST = b('尾帧', 'end frame');

/** All 23 generated shots in story order. Text from the storyboard page on the live site (origin/main 90cd241). */
export const FILM_SHOTS: readonly FilmShot[] = [
  { id: 'S01', file: 's01', act: 'dock', revision: 's01', title: b('握枪的手', 'The hand on the gun'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('戒指全程在左手无名指，枪口滴水，手先握紧再放松', 'The ring stays on the left ring finger throughout; water drips from the muzzle; the hand tightens, then relaxes'),
    frames: [{ file: 's01', note: b('局部揭示：她的左手握枪，无名指上是对戒', 'Partial reveal: her left hand holds the gun, the ring on her ring finger') }] },
  { id: 'S02', file: 's02', act: 'dock', title: b('警员停步', 'The officers stop'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('三人始终背对镜头，POLICE 字样清楚，走两步后停住', 'All three keep their backs to the camera, POLICE clearly legible; two steps, then they stop'),
    frames: [{ file: 's02', note: b('他人反应：只拍赶到的警员', 'Reaction shot: only the arriving officers') }] },
  { id: 'S03', file: 's03', act: 'dock', revision: 's03', title: b('高空垂直下降', 'Vertical drop from above'), made: b('可灵 · 第 2 次通过', 'Kling · passed on take 2'),
    clip: b('程序逐帧测得全程旋转不超过 0.03°，笔直推近到尾帧', 'Measured frame by frame: rotation never exceeds 0.03°; a straight push to the end frame'),
    frames: [
      { file: 's03', tag: FIRST, note: b('首尾帧驱动，笔直下降到正上方俯视', 'Driven by first and end frames: a straight descent to a top-down view') },
      { file: 's03-end', tag: LAST, note: b('直接从首帧中心裁切放大，保证镜头只推近、不旋转；尾帧与 S04 对齐硬切', 'Cropped and enlarged from the centre of the first frame, so the camera only pushes in and never rotates; it lines up for a hard cut to S04') },
    ] },
  { id: 'S04', file: 's04', act: 'love', title: b('舞池红裙', 'Red dress on the dance floor'), made: b('即梦 · 第 2 次通过', 'Jimeng · passed on take 2'),
    clip: b('改成原地慢摇后，她全程可见；红色只在裙子上', 'Changed to a slow sway on the spot, she stays visible throughout; the red is only on the dress'),
    frames: [{ file: 's04', note: b('视觉匹配剪辑：雨水里的红变成展开的裙摆', 'Match cut: the red in the rain becomes the opening skirt') }] },
  { id: 'S05a', file: 's05a', act: 'love', title: b('隔着人群对视', 'Eyes meet across the crowd'), made: b('即梦 · 第 5 次通过', 'Jimeng · passed on take 5'),
    clip: b('前景客人挡住视线，他探身绕过去继续看她；她全程冷淡平视', 'A guest in the foreground blocks the view; he leans around to keep looking; her gaze stays cool and level'),
    frames: [{ file: 's05a', note: b('前景遮挡', 'Foreground occlusion') }] },
  { id: 'S05b', file: 's05b', act: 'love', title: b('手下的眼神', "The henchman's look"), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('推近，他放低酒杯、眯眼皱眉，从漫不经心变成怀疑', 'Push in: he lowers his glass, narrows his eyes and frowns — idle to suspicious'),
    frames: [{ file: 's05b', note: b('他人反应，为 S11 埋线', 'Reaction shot, setting up S11') }] },
  { id: 'S06', file: 's06', act: 'love', title: b('共撑一把伞', 'Sharing one umbrella'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('伞越倾越偏向她，他整个人露在雨里，她把头靠过去', 'The umbrella tilts further toward her, leaving him in the rain; she leans her head on him'),
    frames: [{ file: 's06', note: b('碎片蒙太奇：伞偏向她', 'Fragment montage: the umbrella leans her way') }] },
  { id: 'S07', file: 's07', act: 'love', revision: 's07', title: b('天台分烟', 'Sharing a cigarette on the roof'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('接烟、吸一口、转头吐烟；原片火光出现后偏暖黄，后期去色', 'Takes it, draws, turns to exhale; the flame warmed the colour, so it was desaturated in post'),
    frames: [{ file: 's07', note: b('碎片蒙太奇', 'Fragment montage') }] },
  { id: 'S08', file: 's08', act: 'love', revision: 's08', title: b('描他的枪疤', 'Tracing his bullet scar'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('指尖描一圈、按一下，最后整只手掌盖住；此时她手上还没有戒指', 'A fingertip circles it, presses once, then her whole palm covers it; no ring on her hand yet'),
    frames: [{ file: 's08', note: b('碎片蒙太奇；此时她手上还没有戒指', 'Fragment montage; no ring on her hand yet') }] },
  { id: 'S09', file: 's09', act: 'love', title: b('戴上对戒', 'Putting on the rings'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('三只手各连袖子、始终两枚戒指；戒指推到指根，他的左手托住她', 'Three hands, each traced to its sleeve, always two rings; the ring slides home as his left hand holds hers'),
    frames: [{ file: 's09', note: b('她无名指上的戒指从这一刻开始出现', 'From this moment the ring is on her finger') }] },
  { id: 'S10', file: 's10', act: 'betrayal', title: b('百叶窗与耳麦', 'Blinds and an earpiece'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('手指按一下耳麦，眼神瞬间变冷，低声说了一句', 'A finger touches the earpiece, her eyes turn cold, a few low words'),
    frames: [{ file: 's10', note: b('卧底身份的显性揭示', 'The open reveal: she is undercover') }] },
  { id: 'S11', file: 's11', act: 'betrayal', title: b('照片甩在桌上', 'Photos thrown on the table'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('照片推向焦外的他，手下前倾压低，一言不发地盯着对面', 'The photos slide toward him, out of focus; the henchman leans in low and stares without a word'),
    frames: [{ file: 's11', note: b('他人反应：焦外的他', 'Reaction shot: him, out of focus') }] },
  { id: 'S12', file: 's12', act: 'betrayal', title: b('他攥紧的手', 'His clenched fist'), made: b('可灵 · 截取前 2.3 秒', 'Kling · first 2.3 s used'),
    clip: b('手指一根根收拢成拳；后段青筋被夸大成肉瘤，只用前半段', 'Fingers close one by one; later the veins swell into lumps, so only the first part is used'),
    frames: [{ file: 's12', note: b('局部揭示，与 S19 呼应', 'Partial reveal, echoed by S19') }] },
  { id: 'S13', file: 's13', act: 'betrayal', title: b('一颗颗退出子弹', 'Ejecting the bullets one by one'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('桌上的子弹 2→3→4→5 逐颗增加，剪辑时让落桌卡在拍子上', 'The bullets on the table go 2→3→4→5; in the edit each one lands on the beat'),
    frames: [{ file: 's13', note: b('伏笔：子弹落桌卡在拍子上', 'Foreshadowing: the bullets land on the beat') }] },
  { id: 'S14a', file: 's14a', act: 'standoff', title: b('她的眼', 'Her eyes'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('雨水顺着睫毛落下，下眼睑微颤', 'Rain runs off her lashes; her lower lid trembles'),
    frames: [{ file: 's14a', note: b('逐拍推近', 'Pushing in beat by beat') }] },
  { id: 'S14b', file: 's14b', act: 'standoff', title: b('他的眼', 'His eyes'), made: b('可灵 · 截取前 1.3 秒', 'Kling · first 1.3 s used'),
    clip: b('后段笑纹被画成满眼皱纹，只用前半段', 'Later the laugh lines turn into wrinkles everywhere, so only the first part is used'),
    frames: [{ file: 's14b', note: b('右眉断口与右颧骨旧疤是同一道刀伤', 'The break in his right eyebrow and the scar on his right cheekbone are one knife wound') }] },
  { id: 'S14c', file: 's14c', act: 'standoff', revision: 's14c', title: b('扣扳机', 'The trigger'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('食指压下扳机，托枪的左手戴着戒指；枪声在剪辑里加', 'The index finger presses the trigger; the supporting left hand wears the ring; the gunshot is added in the edit'),
    frames: [{ file: 's14c', note: b('右手扣扳机，左手托枪戴戒', 'Right hand on the trigger, ringed left hand under the gun') }] },
  { id: 'S15', file: 's15', act: 'standoff', revision: 's15', title: b('屏息', 'Holding breath'), made: b('可灵 · 截取前 2.2 秒', 'Kling · first 2.2 s used'),
    clip: b('无声地说了三个字，不露牙；后段变成坏笑，不用', 'He silently mouths three words, teeth hidden; later it turns into a smirk, which is cut'),
    frames: [{ file: 's15', note: b('他在笑', 'He is smiling') }] },
  { id: 'S16', file: 's16', act: 'standoff', title: b('枪响，他倒下', 'The shot; he falls'), made: b('即梦 · 第 9 次暂定', 'Jimeng · take 9, provisional'),
    clip: b('可灵 5 次、即梦 3 次后暂定；闪光帧换成白黑帧，干站段加速', 'Provisional after five Kling and three Jimeng takes; the flash became one white and one black frame, and the idle standing was sped up'),
    frames: [{ file: 's16', note: b('音画同步；中弹用白一帧、黑一帧卡枪声', 'Sound and picture in sync: one white and one black frame hit the gunshot') }] },
  { id: 'S17', file: 's17', act: 'standoff', revision: 's17', title: b('她扑过去', 'She rushes to him'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('左手托着他的下巴，戒指在左手无名指；额头贴着额头', 'Her left hand cradles his chin, the ring on her left ring finger; forehead to forehead'),
    frames: [{ file: 's17', note: b('左手托着他的下巴，戒指在左手无名指', 'Her left hand cradles his chin; the ring is on her left ring finger') }] },
  { id: 'S18', file: 's18', act: 'standoff', revision: 's18', title: b('空弹匣', 'The empty magazine'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('弹匣全程是空的，她把开口转向自己又看了一遍', 'The magazine is empty throughout; she turns the opening toward herself and looks again'),
    frames: [{ file: 's18', note: b('反转：音乐骤然塌下', 'The reversal: the music suddenly collapses') }] },
  { id: 'S19', file: 's19', act: 'standoff', revision: 's19', title: b('掰开他的手', 'Opening his hand'), made: b('即梦 · 首尾帧', 'Jimeng · first and end frames'),
    clip: b('可灵三次手指都假，重画尾帧成自然微蜷后改用即梦；断指唯一露出的地方', 'Three Kling takes all had fake-looking fingers; with the end frame redrawn to a natural curl it moved to Jimeng; the only place the missing fingertip shows'),
    frames: [
      { file: 's19', tag: FIRST, note: b('首尾帧：手心朝上攥拳，和尾帧同一朝向', 'A palm-up fist, facing the same way as the end frame') },
      { file: 's19-end', tag: LAST, note: b('手心里是他的那枚对戒；断指唯一露出的地方', 'His ring lies in his palm; the only place the missing fingertip shows') },
    ] },
  { id: 'S20', file: 's20', act: 'standoff', revision: 's20', title: b('垂直上升', 'Vertical rise'), made: b('可灵 + 后期', 'Kling + post'),
    clip: b('可灵固定机位只负责雨和涟漪，上升由后期缓动拉远完成，保证不旋转', 'Kling, locked off, provides only the rain and ripples; the rise is an eased pull-out in post, so it never rotates'),
    frames: [{ file: 's20', note: b('与 S03 呼应，血迹压小压暗', 'Echoes S03; the blood made smaller and darker') }] },
];

export const ACTS: readonly { key: ActKey; title: Bi; look: Bi }[] = [
  { key: 'dock', title: b('现在 · 雨夜码头', 'Now · the dock in the rain'), look: b('冷蓝彩色，昏黄路灯；结局先行', 'Cold blue colour under sodium lamps; the ending comes first') },
  { key: 'love', title: b('过去 · 相爱', 'Then · in love'), look: b('黑白，只有舞会红裙保留红色', 'Black and white; only the red dress at the ball keeps its colour') },
  { key: 'betrayal', title: b('过去 · 背叛', 'Then · betrayal'), look: b('黑白，光影更硬', 'Black and white, harder light') },
  { key: 'standoff', title: b('现在 · 对峙与反转', 'Now · standoff and reversal'), look: b('回到冷蓝码头，枪响在 0:44，反转在 0:52', 'Back on the cold blue dock: the shot at 0:44, the reversal at 0:52') },
];

const d = (file: string, zh: string, en: string) => ({ file, note: b(zh, en) });

export const REVISIONS: readonly Revision[] = [
  { key: 's01', title: b('S01 握枪的手', 'S01 The hand on the gun'), rule: b('戒指必须在左手无名指', 'The ring must be on the left ring finger'),
    drafts: [d('draft/s01-a', '握枪的是右手。', 'The right hand holds the gun.')],
    final: d('s01', '水平镜像成左手，戒指随之到左手无名指。', 'Mirrored into a left hand, which takes the ring to the left ring finger.') },
  { key: 's03', title: b('S03 尾帧', 'S03 end frame'), rule: b('首尾帧必须同一机位、同一方向', 'First and end frames need the same camera position and direction'),
    drafts: [
      d('draft/s03e-a', '比首帧转了约 30°，可灵只能边转边变形去凑。', 'Rotated about 30° from the first frame; Kling could only warp while turning to match.'),
      d('draft/s03e-b', '方向对了，地面钢板格子和路灯对不上，视频里地面会漂。', 'Direction right, but the deck plates and lamps did not line up, so the ground would drift.'),
    ],
    final: d('s03-end', '直接从首帧中心裁切放大 2 倍，和首帧像素级一致。', 'Cropped from the centre of the first frame and enlarged 2×, pixel-consistent with it.') },
  { key: 's07', title: b('S07 天台分烟', 'S07 Sharing a cigarette'), rule: b('伤疤跨镜头一致', 'Scars stay consistent across shots'),
    drafts: [d('draft/s07-a', '他露出右脸，却没有右眉断口和颧骨旧疤。', 'His right side shows, but without the broken eyebrow and cheekbone scar.')],
    final: d('s07', '补上同一道刀伤。', 'The same knife wound added.') },
  { key: 's08', title: b('S08 描枪疤', 'S08 Tracing the scar'), rule: b('道具时间线', 'The prop timeline'),
    drafts: [d('draft/s08-a', 'S09 才戴戒指，这里她已经戴上了。', 'She only puts the ring on in S09, but here she already wears it.')],
    final: d('s08', '去掉戒指。', 'Ring removed.') },
  { key: 's14c', title: b('S14c 扣扳机', 'S14c The trigger'), rule: b('动作要真的在做', 'The action must really happen'),
    drafts: [
      d('draft/s14c-a', '食指搭在枪身外侧，没有扣扳机。', 'The index finger rests along the frame, off the trigger.'),
      d('draft/s14c-b', '扣上了，但露出了脸，和 S14a 重复。', 'On the trigger now, but her face shows, repeating S14a.'),
    ],
    final: d('s14c', '只拍手和枪：右手食指压扳机，左手托枪戴戒。', 'Hands and gun only: right index finger on the trigger, ringed left hand under the gun.') },
  { key: 's15', title: b('S15 屏息', 'S15 Holding breath'), rule: b('伤疤要看得见', 'The scar must be visible'),
    drafts: [
      d('draft/s15-a', '右颧骨的旧疤几乎看不见。', 'The scar on the right cheekbone is barely visible.'),
      d('draft/s15-b', '修了一次，还是太淡。', 'Fixed once, still too faint.'),
    ],
    final: d('s15', '右眉断口和颧骨旧疤清楚可见。', 'The broken eyebrow and the cheekbone scar are clearly visible.') },
  { key: 's17', title: b('S17 她扑过去', 'S17 She rushes to him'), rule: b('每只手都要追到它的肩膀', 'Every hand must trace back to its shoulder'),
    drafts: [
      d('draft/s17-a', '他的脸不像标准脸；她胸口那只手粗得像男人的手。', 'His face does not match the reference; the hand on her chest is as thick as a man’s.'),
      d('draft/s17-b', '手改细了，但这只手是从他大衣里伸出来的，接不到她的胳膊。', 'The hand is slimmer, but it comes out of his coat and cannot reach her arm.'),
      d('draft/s17-c', '把胸口的手藏掉，他的两条胳膊也跟着不见了。', 'Hiding the hand on the chest made both of his arms disappear too.'),
      d('draft/s17-d', '构图终于对了，戒指却戴在她的右手上。', 'The composition is finally right, but the ring is on her right hand.'),
    ],
    final: d('s17', '左手托他下巴、戴戒指；右手放在他胸口。', 'Left hand under his chin, wearing the ring; right hand on his chest.') },
  { key: 's18', title: b('S18 空弹匣', 'S18 The empty magazine'), rule: b('看得出是空的，戒指在对的手', 'Visibly empty, ring on the correct hand'),
    drafts: [
      d('draft/s18-a', '戒指戴在中指；只露出弹匣底座，看不出是空的。', 'Ring on the middle finger; only the base of the magazine shows, so it cannot read as empty.'),
      d('draft/s18-b', '开口朝上看得出空了，但她的主观视角里戴戒指的是右手。', 'Opening up and visibly empty — but in her point of view the ring is on the right hand.'),
    ],
    final: d('s18', '左手拿空弹匣、左手无名指戴戒，右手拿枪。', 'Left hand holds the empty magazine, ring on its ring finger; right hand holds the gun.') },
  { key: 's19', title: b('S19 首帧', 'S19 first frame'), rule: b('为视频动作服务', 'Serve the motion in the video'),
    drafts: [
      d('draft/s19-a', '手背朝上，尾帧却是手心朝上，视频得先翻手再掰开，手指容易乱。', 'Back of the hand up while the end frame is palm up: the video would have to turn the hand before opening it, and the fingers fall apart.'),
      d('draft/s19-b', '改成手心朝上，但蜷起的手指多画了一根。', 'Palm up now, but the curled fingers gained one too many.'),
    ],
    final: d('s19', '手心朝上、五根手指，和尾帧同一朝向。', 'Palm up, five fingers, facing the same way as the end frame.') },
  { key: 's20', title: b('S20 垂直上升', 'S20 Vertical rise'), rule: b('平台审核', 'Platform review'),
    drafts: [d('draft/s20-a', '血迹太大太红，视频平台可能不过审。', 'Too much blood, too red: the video platforms might reject it.')],
    final: d('s20', '血迹缩到三分之一，压暗。', 'The blood cut to a third and darkened.') },
];

export const REJECTS: readonly Reject[] = [
  { file: 'fail-s16k2', title: b('S16 · 可灵第 2 次', 'S16 · Kling take 2'), note: b('枪凭空消失、手往前伸、咧嘴大笑，站很久后突然倒下，背景集装箱变橙', 'The gun vanishes, the hand reaches out, a wide grin, a long stand and a sudden fall; the containers behind turn orange') },
  { file: 'fail-s16', title: b('S16 · 可灵第 4 次', 'S16 · Kling take 4'), note: b('提示词堆了一串强动作词：画面飞进子弹、胸口冒火花、嘴张成 O 形', 'A prompt stacked with strong action words: bullets fly into frame, sparks from the chest, mouth in an O') },
  { file: 'fail-s04', title: b('S04 · 即梦第 1 次', 'S04 · Jimeng take 1'), note: b('俯拍转圈时她的身体融进裙摆，画面上只剩他一个人站在红裙中间', 'In the overhead spin her body melts into the skirt, leaving only him standing in a pool of red') },
  { file: 'fail-s05a', title: b('S05a · 即梦第 2 次', 'S05a · Jimeng take 2'), note: b('同时要求横移、视差和前景有人走过，模型从第一帧起重新构图，人和脸全换了', 'Asked for a truck, parallax and a passer-by at once, the model recomposed from the first frame and replaced every person and face') },
  { file: 'fail-s19', title: b('S19 · 可灵第 1 次', 'S19 · Kling take 1'), note: b('要求手指"一根一根"掰开，模型连画五次形变，拳头上长出一圈圈褶子', 'Asked to open the fingers "one by one", the model warped five times over and grew rings of folds on the fist') },
];

export const FILM_TEXT = {
  red: {
    h: b('全片只有一种红。', 'One red in the whole film.'),
    p: b('现在是冷蓝的雨夜码头，过去一律黑白，只有舞会那条红裙是红色。S03 高空俯拍的尾帧硬切到 S04，雨水里的红变成展开的裙摆。', 'The present is a cold blue dock in the rain; the past is all black and white, except the red dress at the ball. S03’s overhead end frame hard-cuts to S04, and the red in the rain becomes the opening skirt.'),
    credit: b('AI 生成首帧 · 剧本、分镜与逐张审图为本人完成', 'First frames generated by AI · script, storyboard and frame-by-frame review by me'),
    alt: b('正上方俯视的舞池，红裙在黑白人群中央展开', 'The dance floor from directly above: a red dress opening amid a black-and-white crowd'),
  },
  rules: {
    h: b('先定规则，再出图', 'Rules first, then pictures'),
    bgm: b('BGM 选用《Mais je t\'aime》，先把人声分轨、剪出 60 秒和 30 秒两版，再按卡点写分镜：人声进入 0:12，枪响 0:44，音乐塌下的反转 0:52。', 'The music is “Mais je t’aime”. I split out the vocals, cut 60- and 30-second versions, then wrote the storyboard to the beats: vocals enter at 0:12, the shot at 0:44, the reversal as the music collapses at 0:52.'),
    items: [
      { h: b('人物设定', 'Characters'), p: b('他：42 岁，蓝眼、棕色卷发，右眉断口与右颧骨旧疤是同一道刀伤，左手小指缺一节（全片只在结尾摊开手心时露出一次），爱笑。她：27 岁，黑长直，眼神冷。', 'He: 42, blue eyes, curly brown hair; the break in his right eyebrow and the scar on his right cheekbone are one knife wound; the tip of his left little finger is missing (seen once, when his palm opens at the end); he smiles easily. She: 27, long straight black hair, cold eyes.') },
      { h: b('道具连续性', 'Prop continuity'), p: b('两枚同款素圈银戒。她戴在左手无名指；S08 时还没有戒指，S09 戴上；他死前摘下，攥在左手手心。', 'Two identical plain silver rings. Hers is on her left ring finger: not yet in S08, on from S09. He takes his off before he dies and holds it in his left palm.') },
      { h: b('审图', 'Review'), p: b('每张首帧都放大核对：每只手顺着袖子追到是谁的哪只手，再看戒指戴在哪根手指、手指数量、伤疤位置和时间线。25 张定稿里有 14 个镜头返修过，最多的 S17 改了 5 版。', 'Every first frame was checked zoomed in: each hand followed up its sleeve to whose hand it is, then which finger wears the ring, how many fingers, where the scars are, and the timeline. Of 25 final frames, 14 shots were revised; S17 took five versions.') },
      { h: b('图生视频', 'Image to video'), p: b('每段生成 5 秒，按剧本时间码截取。提示词按秒写动作，写清每只手、每个道具的去向和被挡住的背景；平台没有负面提示词框，所以只写想要的画面。人物动作即梦明显比可灵听话，后续默认用即梦。AI 视频原生偏慢，剪辑时按每个镜头的时长变速（倍数见剪辑台）；即梦会给黑白画面染上暖色，回忆镜头统一后期去色。', 'Each clip was generated at 5 seconds and trimmed to the script’s timecode. Prompts set out the action second by second — where every hand and prop goes, what background is hidden; the platforms have no negative-prompt box, so they describe only what should be seen. Jimeng followed character action far better than Kling and became the default. AI video runs slow, so each clip was retimed to its slot in the edit (speeds on the edit desk); Jimeng also warmed black-and-white frames, so the flashback was desaturated in post.') },
    ],
  },
  acts: b('四幕分镜', 'The storyboard in four acts'),
  notInCut: b('未用于成片', 'Not in the cut'),
  revisions: {
    h: b('返修记录', 'Revision log'),
    meta: b('废稿 → 定稿，每一版被打回的原因', 'Draft → final, and why each version was sent back'),
    lede: b('AI 出图最常见的错不是画得不好看，而是逻辑不对：手接不到胳膊、戒指戴错手指、道具在时间线上提前出现、首尾帧方向对不上。下面是有代表性的 10 个镜头。', 'The commonest AI image errors are not ugliness but logic: hands that do not reach an arm, a ring on the wrong finger, a prop appearing too early, first and end frames facing different ways. Ten representative shots.'),
  },
  draft: b('废稿', 'Draft'),
  final: b('定稿', 'Final'),
  rejects: { h: b('废片', 'Rejected takes'), meta: b('失败的生成视频', 'Failed generations') },
} as const;

export const DESK = {
  h: b('剪辑台', 'The edit desk'),
  lede: b('成片下面的三条轨道都取自成片和剪辑脚本：画面颜色每 0.1 秒取一次平均色；镜头按剪辑表的真实起止时间排开，块上是变速倍数；音轨是成片声音的峰值。点镜头跳到那一刻，方向键逐镜切换。', 'The three tracks under the film come from the film itself and its edit script: the picture’s average colour every 0.1 s; the shots at their real in and out times from the edit list, each with its speed; the soundtrack’s peaks. Click a shot to jump there; arrow keys step through shots.'),
  caption: b('成片 · 60 秒 · BGM《Mais je t\'aime》，带声音播放', 'The film · 60 s · music: “Mais je t’aime”, plays with sound'),
  tracks: { colour: b('画面颜色', 'Picture'), shots: b('镜头', 'Shots'), sound: b('音轨', 'Sound') },
  beats: { vocal: b('人声', 'Vocals'), shot: b('枪响', 'Gunshot'), turn: b('反转', 'Reversal') },
  black: b('黑场 · 枪声先响', 'Black · the shot is heard first'),
  title: b('片名', 'Title'),
  legend: { gray: b('灰色：剪辑时去色', 'Grey: desaturated in the edit'), dissolve: b('叠化', 'Dissolve'), dip: b('闪黑', 'Dip to black') },
  s02: b('S02 警员停步出片了，但没有用在成片里：S01 延长到 0:07，占了它的位置。', 'S02, The officers stop, was generated but not used: S01 runs on to 0:07 in its place.'),
  viewS02: b('看 S02', 'View S02'),
  card: {
    inCut: b('成片中', 'In the film'), speed: b('变速', 'Speed'), source: b('截取素材', 'Source used'), unit: b(' 秒', ' s'),
    notInCut: b('未用于成片', 'Not in the cut'), prev: b('上一镜', 'Previous shot'), next: b('下一镜', 'Next shot'), revision: b('看这个镜头的返修记录', 'See this shot’s revisions'),
  },
} as const;
```

- [ ] **Step 7: 事实与站点配置**

`src/data/facts.ts` 第 27 行替换为：

```ts
  F8: { id: 'F8', figure: '23', text: { zh: '60 秒成片完成：出片 23 段，成片用 22 段', en: '60-second film finished: 23 clips generated, 22 in the cut' }, scope: '成片状态；出片数与成片所用镜头数同时出现', source: 'edit_60s.py 的 SHOTS（22 镜）与 origin/main 90cd241（23 段分镜视频 + 成片）', confirmed: '2026-10-02', public: true },
```

`src/data/site.ts`：

1. 顶部 import 区加：`import { FILM_SHOTS } from './film';`
2. `film.clips` 整段（第 66–80 行，从注释到 `],`）替换为：

```ts
    /** Every generated shot, in story order (S02 included: it was generated, just not used in the cut). */
    clips: FILM_SHOTS.map(s => ({ shot: s.id, file: s.file, title: s.title })),
```

3. `mais-je-taime` 项目的 `status` 改为：

```ts
      status: { zh: '成片完成 · AI 短片', en: 'Finished · AI short film' } }),
```

4. `pages` 里 `quota: {…},` 之后加入：

```ts
    film: {
      title: { zh: "Mais je t'aime", en: "Mais je t'aime" },
      lead: { zh: '他是黑帮少主，她是潜伏三年的卧底。雨夜码头，她开枪打死了他；扑过去才发现，他的枪是空的，攥紧的手心里是那枚对戒。', en: 'He is heir to a gang; she has been undercover beside him for three years. On a rainy dock she shoots him dead — and, reaching him, finds his gun was empty and their ring clenched in his hand.' },
      description: { zh: "Mais je t'aime：60 秒 AI 短片。剪辑台按真实剪辑表展示每个镜头的起止、变速与转场，附分镜视频、返修记录与废片。", en: "Mais je t'aime: a 60-second AI short. The edit desk lays out every shot's timing, speed and transitions from the real edit list, with the clips, revision log and rejected takes." },
      tags: [ { zh: 'AI 短片 · 个人作品', en: 'AI short film · personal work' }, { zh: 'GPT 图像 · 可灵 · 即梦 · Python', en: 'GPT Image · Kling · Jimeng · Python' } ],
      summary: {
        task: { zh: '用一首歌的时间讲完一个反转故事；每个画面由 AI 生成，但手、戒指、伤疤和时间线必须前后一致。', en: 'Tell a story with a twist in the length of one song; AI generates every picture, but hands, rings, scars and the timeline must stay consistent.' },
        mine: { zh: '剧本、分镜、人物与道具连续性设定；逐张审图并写返修意见；按秒写图生视频提示词；用 Python 按 BGM 卡点剪辑合成。', en: 'Script, storyboard, character and prop continuity; reviewing every frame and writing the revision notes; second-by-second video prompts; the edit, cut to the beat in Python.' },
        tools: { zh: 'GPT 图像生成首帧；可灵、即梦图生视频；Demucs 分离人声；Python、OpenCV、ffmpeg 剪辑、去色与合成音效。', en: 'GPT image generation for first frames; Kling and Jimeng for image-to-video; Demucs for stems; Python, OpenCV and ffmpeg for the edit, desaturation and sound effects.' },
        evidence: { zh: '本页的成片与剪辑台（剪辑表、画面颜色与音轨波形都取自成片和剪辑脚本）、每段分镜视频、返修记录与废片。', en: 'The film and edit desk on this page (edit list, picture colour and waveform all taken from the film and its edit script), every clip, the revision log and the rejected takes.' },
        status: { zh: '60 秒成片完成：出片 23 段，成片用 22 段', en: '60-second film finished: 23 clips generated, 22 in the cut' },
      },
    },
```

`tests/e2e/reel.spec.ts`：第 43 行 `\/ 12$` 改为 `\/ 23$`；第 83 行 `toHaveLength(12)` 改为 `toHaveLength(23)`。

- [ ] **Step 8: 运行测试，确认通过**

Run: `npx vitest run`
Expected: 全部 PASS（含新的 film-edit / film-desk、改过的 facts）

Run: `npx playwright test tests/e2e/reel.spec.ts tests/e2e/brief.spec.ts tests/e2e/projects-index.spec.ts`
Expected: 全部 PASS（放映厅现在是 23 段）

- [ ] **Step 9: 提交**

```bash
git add src/data/film-edit.ts src/data/film.ts src/scripts/film-desk.ts src/data/facts.ts src/data/site.ts tests/unit/film-edit.test.ts tests/unit/film-desk.test.ts tests/unit/facts.test.ts tests/e2e/reel.spec.ts
git commit -m "Mais je t'aime: the edit list from edit_60s.py, the storyboard copy, and F8 now that the film is finished"
```

---

### Task 3: 暗场短片页

**Files:**
- Create: `src/components/FilmRed.astro`、`src/components/FilmStory.astro`、`src/views/FilmView.astro`、`src/copy/projects/mais-je-taime.zh.md`、`src/copy/projects/mais-je-taime.en.md`、`src/pages/projects/mais-je-taime.astro`、`src/pages/en/projects/mais-je-taime.astro`、`tests/e2e/film.spec.ts`
- Modify: `src/styles/base.css`（body.night）、`src/layouts/ProjectLayout.astro`（night）、`tests/e2e/helpers.ts`、`tests/e2e/numbers.spec.ts:9`、`tests/unit/contrast.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `FILM_SHOTS`、`ACTS`、`REVISIONS`、`REJECTS`、`FILM_TEXT`、`slots()`、`clock()`；`SITE.pages.film`。
- Produces: `ProjectLayout` 新 prop `night?: boolean`；`FilmView`（Task 4 往里放 `FilmDesk`）；`FILM_PAGES` 加入 `PAGES`。

- [ ] **Step 1: 写失败的测试**

`tests/e2e/film.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro, noHorizontalOverflow } from './helpers';

for (const lang of ['zh', 'en'] as const) {
  const PATH = `${lang === 'en' ? '/en' : ''}/projects/mais-je-taime/`;

  test(`film page (${lang}) is dark, with four acts, 25 stills, 10 revision cases and 5 rejected takes`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(PATH);
    await expect(page.locator('body')).toHaveClass(/night/);
    await expect(page.locator('.fs__act')).toHaveCount(4);
    await expect(page.locator('.fs__frame')).toHaveCount(25);
    await expect(page.locator('.fs__rev')).toHaveCount(10);
    await expect(page.locator('.fs__rejects video')).toHaveCount(5);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test(`film page (${lang}): every still, draft and poster is served`, async ({ page, request, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await skipIntro(page);
    await page.goto(PATH);
    const urls = await page.locator('[data-film] img, [data-film] video').evaluateAll(els => els.flatMap(el =>
      [el.getAttribute('src'), el.getAttribute('poster'), el.getAttribute('data-src')].filter((u): u is string => !!u)));
    for (const u of new Set(urls)) expect((await request.get(u)).status(), u).toBe(200);
  });
}

test('S02 is shown in the storyboard as not in the cut', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await expect(page.locator('.fs__frame', { hasText: '警员停步' })).toContainText('未用于成片');
});

test('the English film page carries no Chinese', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await skipIntro(page);
  await page.goto('/en/projects/mais-je-taime/');
  const text = await page.locator('main').innerText();
  expect(text.match(/[\u4e00-\u9fff]+/g) ?? []).toEqual([]);
});
```

`tests/e2e/helpers.ts`：在 `LIVE_PAGES` 之后加

```ts
export const FILM_PAGES = ['/projects/mais-je-taime/', '/en/projects/mais-je-taime/'];
```

并把 `PAGES` 改为 `[...PHASE1_PAGES, ...PHASE2A_PAGES, ...INSIGHTS_PAGES, ...PHASE2B_PAGES, ...LIVE_PAGES, ...FILM_PAGES]`；`PHASE2_PENDING` 里删掉 `'/projects/mais-je-taime/'`（只留 `'/privacy/'`）。

`tests/e2e/numbers.spec.ts` 第 9 行的 `EXCLUDE` 里，在 `[data-reel], ` 之后加入 `[data-film], `，并把上面注释的第一行补成：

```ts
// [data-demo] holds fictional demo records ("page 2"); [data-reel] holds shot ids and a clip counter; [data-film] holds the
// film's shot ids, timecodes, speeds and take counts — identifiers and edit data, not claims.
```

`tests/unit/contrast.test.ts` 的 `it.each` 表里加一行：

```ts
    ['red as small text on night (red-text on dark pages)', C.red, C.night, 4.5],
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/film.spec.ts`
Expected: FAIL（页面 404）

- [ ] **Step 3: 暗场 tokens 与 ProjectLayout 开关**

`src/styles/base.css` 第 19 行 `body.night { … }` 之后加：

```css
/* Dark pages: the same components, inverted through the tokens. --rule and --hair are redefined because a custom
   property that refers to another is resolved where it is declared (:root), not where it is used. */
body.night { --paper: var(--night); --ink: var(--night-fg); --mute: var(--night-mute); --red-text: var(--red);
  --rule: 1.5px solid var(--night-fg); --hair: 1px solid rgb(236 228 214 / 0.18); }
```

`src/layouts/ProjectLayout.astro`：

```ts
interface Props { lang: Lang; slug: string; title: Bi; lead: Bi; tags: Bi[]; summary: Summary; description: Bi; night?: boolean }
const { lang, slug, title, lead, tags, summary, description, night = false } = Astro.props;
```

并把 `<Base lang={lang} path={path} …>` 加上 `night={night}`。

- [ ] **Step 4: 组件、视图、正文与页面**

`src/components/FilmRed.astro`：

```astro
---
import { FILM_TEXT } from '../data/film';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const R = FILM_TEXT.red;
---
<figure class="fr wrap" data-film>
  <img src="/media/mais-je-taime/s04.webp" alt={R.alt[lang]} width="1200" height="675" decoding="async" />
  <figcaption>
    <h2>{R.h[lang]}</h2>
    <p>{R.p[lang]}</p>
    <small>{R.credit[lang]}</small>
  </figcaption>
</figure>
<style>
  .fr { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 24px clamp(24px, 4vw, 56px); align-items: end; margin: 0; padding-block: 48px; }
  .fr img { display: block; width: 100%; height: auto; }
  .fr h2 { margin-bottom: 14px; font-size: clamp(28px, 3.4vw, 48px); }
  .fr p { max-width: 30em; }
  .fr small { display: block; margin-top: 14px; color: var(--mute); font-size: 13px; }
  @media (max-width: 760px) { .fr { grid-template-columns: 1fr; } }
</style>
```

`src/components/FilmStory.astro`：

```astro
---
import { FILM_SHOTS, FILM_TEXT, ACTS, REVISIONS, REJECTS } from '../data/film';
import { slots } from '../data/film-edit';
import { clock } from '../scripts/film-desk';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const T = FILM_TEXT;
const M = '/media/mais-je-taime';
const cut = new Map(slots().map(s => [s.id, s]));
const span = (id: string) => { const s = cut.get(id); return s ? `${clock(s.start)}–${clock(s.stop)}` : T.notInCut[lang]; };
---
<div class="fs" data-film>
  <section class="wrap fs__rules" aria-labelledby="fs-rules">
    <div class="section-head"><h2 id="fs-rules">{T.rules.h[lang]}</h2></div>
    <div class="fs__cols">
      <p class="fs__bgm">{T.rules.bgm[lang]}</p>
      <div>{T.rules.items.map(it => <Fragment><h3>{it.h[lang]}</h3><p>{it.p[lang]}</p></Fragment>)}</div>
    </div>
  </section>

  <section class="wrap" aria-labelledby="fs-acts">
    <div class="section-head"><h2 id="fs-acts">{T.acts[lang]}</h2></div>
    {ACTS.map(a => (
      <section class="fs__act" aria-labelledby={`fs-act-${a.key}`}>
        <h3 id={`fs-act-${a.key}`}>{a.title[lang]}<span class="fs__meta"> · {a.look[lang]}</span></h3>
        <ul class="fs__grid">
          {FILM_SHOTS.filter(s => s.act === a.key).flatMap(s => s.frames.map((f, k) => (
            <li class="fs__frame">
              <img src={`${M}/${f.file}.webp`} alt={`${s.id} ${s.title[lang]}${f.tag ? ` · ${f.tag[lang]}` : ''}`} width="1200" height="675" loading="lazy" decoding="async" />
              <p class="fs__meta">{s.id}{k === 0 ? ` · ${span(s.id)}` : ''}</p>
              <p class="fs__name">{s.title[lang]}{f.tag ? ` · ${f.tag[lang]}` : ''}</p>
              <p>{f.note[lang]}</p>
            </li>
          )))}
        </ul>
      </section>
    ))}
  </section>

  <section class="wrap" aria-labelledby="fs-rev">
    <div class="section-head"><h2 id="fs-rev">{T.revisions.h[lang]}</h2><span class="fs__meta">{T.revisions.meta[lang]}</span></div>
    <p class="fs__lede">{T.revisions.lede[lang]}</p>
    {REVISIONS.map(r => (
      <article class="fs__rev" id={`rev-${r.key}`} aria-labelledby={`rev-${r.key}-h`}>
        <h3 id={`rev-${r.key}-h`}>{r.title[lang]}<span class="fs__meta"> · {r.rule[lang]}</span></h3>
        <ul class="fs__row">
          {r.drafts.map((x, i) => (
            <li class="fs__draft">
              <img src={`${M}/${x.file}.webp`} alt={`${r.title[lang]} · ${T.draft[lang]} ${i + 1}`} width="800" height="450" loading="lazy" decoding="async" />
              <p class="fs__meta">{T.draft[lang]} {i + 1}</p>
              <p>{x.note[lang]}</p>
            </li>
          ))}
          <li class="fs__final">
            <img src={`${M}/${r.final.file}.webp`} alt={`${r.title[lang]} · ${T.final[lang]}`} width="1200" height="675" loading="lazy" decoding="async" />
            <p class="fs__meta">{T.final[lang]}</p>
            <p>{r.final.note[lang]}</p>
          </li>
        </ul>
      </article>
    ))}
  </section>

  <section class="wrap fs__rejects" aria-labelledby="fs-rej">
    <div class="section-head"><h2 id="fs-rej">{T.rejects.h[lang]}</h2><span class="fs__meta">{T.rejects.meta[lang]}</span></div>
    <ul class="fs__grid">
      {REJECTS.map(r => (
        <li>
          <video src={`${M}/video/${r.file}.mp4`} poster={`${M}/video/${r.file}.webp`} width="960" height="540" controls muted playsinline preload="none" aria-label={r.title[lang]}></video>
          <p class="fs__name">{r.title[lang]}</p>
          <p>{r.note[lang]}</p>
        </li>
      ))}
    </ul>
  </section>
</div>
<style>
  .fs > section { padding-bottom: 48px; }
  .fs__cols { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: 16px clamp(24px, 4vw, 56px); padding-top: 20px; }
  .fs__bgm { font: 500 clamp(17px, 1.5vw, 21px)/1.6 var(--font-body); }
  .fs__cols h3 { margin: 18px 0 6px; font-size: 17px; }
  .fs__cols h3:first-child { margin-top: 0; }
  .fs__act { padding-top: 28px; }
  .fs__act h3, .fs__rev h3 { margin-bottom: 14px; font-size: 18px; }
  .fs__meta { color: var(--mute); font-size: 13px; font-weight: 400; }
  .fs__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 24px; margin: 0; padding: 0; list-style: none; }
  .fs__grid img, .fs__grid video, .fs__row img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; background: #000; }
  .fs__grid p, .fs__row p { margin: 6px 0 0; font-size: 14px; }
  .fs__name { font-weight: 500; }
  .fs__lede { max-width: 46em; margin: 16px 0 8px; }
  .fs__rev { padding-top: 28px; }
  .fs__row { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 16px; align-items: start; margin: 0; padding: 0; list-style: none; }
  .fs__draft img { opacity: 0.85; filter: saturate(0.8); }
  .fs__final img { outline: 2px solid var(--ink); outline-offset: 3px; }
  @media (max-width: 760px) { .fs__cols { grid-template-columns: 1fr; } }
</style>
```

`src/views/FilmView.astro`：

```astro
---
import ProjectLayout from '../layouts/ProjectLayout.astro';
import FilmRed from '../components/FilmRed.astro';
import FilmStory from '../components/FilmStory.astro';
import { SITE } from '../data/site';
import { Content as BodyZh } from '../copy/projects/mais-je-taime.zh.md';
import { Content as BodyEn } from '../copy/projects/mais-je-taime.en.md';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const P = SITE.pages.film;
const Body = lang === 'zh' ? BodyZh : BodyEn;
---
<ProjectLayout night lang={lang} slug="mais-je-taime" title={P.title} lead={P.lead} tags={P.tags} summary={P.summary} description={P.description}>
  <Fragment slot="demo">
    <FilmRed lang={lang} />
    <FilmStory lang={lang} />
  </Fragment>
  <Body />
</ProjectLayout>
```

`src/copy/projects/mais-je-taime.zh.md`：

```md
## 工具与流程

- 首帧：GPT 图像生成；剧本、分镜与逐张审图为本人完成。
- 视频：可灵、即梦图生视频，每段生成 5 秒。
- 声音：Demucs 分离人声与伴奏，ffmpeg 剪出 BGM；雨声与枪声由 Python 程序合成。
- 剪辑：Python + OpenCV + ffmpeg 按剪辑表逐段变速、去色、做叠化与闪黑，最后响度标准化。
- 检查：Python + OpenCV 逐帧检查旋转角度、首尾帧对齐、闪光与红色像素，并做后期修补。

## 之后

可以从同一批素材再剪一个 30 秒版，并继续优化 S16 中弹镜头。
```

`src/copy/projects/mais-je-taime.en.md`：

```md
## Tools and process

- First frames: GPT image generation; the script, storyboard and frame-by-frame review are mine.
- Video: image-to-video in Kling and Jimeng, five seconds per clip.
- Sound: Demucs to separate vocals from the backing, ffmpeg to cut the music; the rain and the gunshots are synthesised in Python.
- Edit: Python, OpenCV and ffmpeg retime each clip to the edit list, desaturate, dissolve and dip to black, then normalise loudness.
- Checks: Python and OpenCV measure rotation, first/end-frame alignment, flash frames and red pixels frame by frame, with fixes in post.

## Next

A 30-second cut from the same material, and another pass at S16, the shot where he is hit.
```

`src/pages/projects/mais-je-taime.astro`：

```astro
---
import FilmView from '../../views/FilmView.astro';
---
<FilmView lang="zh" />
```

`src/pages/en/projects/mais-je-taime.astro`：

```astro
---
import FilmView from '../../../views/FilmView.astro';
---
<FilmView lang="en" />
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run tests/unit/contrast.test.ts`
Expected: PASS

Run: `npx playwright test tests/e2e/film.spec.ts tests/e2e/numbers.spec.ts tests/e2e/a11y.spec.ts tests/e2e/links.spec.ts tests/e2e/layout.spec.ts`
Expected: 全部 PASS。a11y 若报暗场里某个共享组件对比度不足，先看是不是写死了颜色（应改用 tokens），在该组件里修，不要在 a11y 测试里排除。

- [ ] **Step 6: 提交**

```bash
git add src/styles/base.css src/layouts/ProjectLayout.astro src/components/FilmRed.astro src/components/FilmStory.astro src/views/FilmView.astro src/copy/projects/mais-je-taime.zh.md src/copy/projects/mais-je-taime.en.md src/pages/projects/mais-je-taime.astro src/pages/en/projects/mais-je-taime.astro tests/e2e/film.spec.ts tests/e2e/helpers.ts tests/e2e/numbers.spec.ts tests/unit/contrast.test.ts
git commit -m "Mais je t'aime page on the new site: dark, with the rules, the storyboard in four acts, revisions and rejected takes"
```

---

### Task 4: 剪辑台

**Files:**
- Create: `src/components/FilmDesk.astro`、`src/scripts/film-desk-dom.ts`
- Modify: `src/views/FilmView.astro`（在 `FilmRed` 之后放 `FilmDesk`）
- Test: `tests/e2e/film.spec.ts`（追加）

**Interfaces:**
- Consumes: `slots()`、`TRANSITIONS`、`BEATS`（film-edit）；`FILM_SHOTS`、`DESK`（film）；`pct`、`timeAt`、`clock`、`speedLabel`、`stepIndex`（film-desk）；`frameCap()`（`src/scripts/frame-cap.ts`，返回 `(now: number) => boolean`）。
- Produces: DOM 约定——`[data-film-desk]` 根元素（脚本写 `data-signals="ready" | "missing"`）；`[data-fd-video]`；`[data-fd-shots] [data-fd-shot]` 镜头按钮（`data-start`、`data-stop`、`aria-pressed`）；`[data-fd-card]` 镜头卡（成片中的带 `data-start`）；`[data-fd-step="-1"|"1"]`；`[data-fd-pick="S02"]`；`[data-fd-scrub]` 可点击跳转的轨道；`[data-fd-head]` 播放头（`style.left` 为百分比）。

- [ ] **Step 1: 写失败的测试**

追加到 `tests/e2e/film.spec.ts`：

```ts
test.describe('edit desk', () => {
  const PATH = '/projects/mais-je-taime/';
  const desk = '[data-film-desk]';
  const time = (page: import('@playwright/test').Page) => page.locator('[data-fd-video]').evaluate(v => (v as HTMLVideoElement).currentTime);

  test.beforeEach(async ({ page }) => {
    await skipIntro(page);
    await page.goto(PATH);
    await page.locator(desk).scrollIntoViewIfNeeded();
  });

  test('22 shots on the track, S02 offered on its own, colour and sound drawn', async ({ page }) => {
    await expect(page.locator('[data-fd-shots] [data-fd-shot]')).toHaveCount(22);
    await expect(page.locator('[data-fd-shots] [data-fd-shot="S02"]')).toHaveCount(0);
    await expect(page.locator('[data-fd-pick="S02"]')).toBeVisible();
    await expect(page.locator(desk)).toHaveAttribute('data-signals', 'ready');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test('a shot clicked before the film is ready still seeks to its start and opens its card', async ({ page }) => {
    await page.locator('[data-fd-shot="S16"]').click();
    await expect(page.locator('[data-fd-card="S16"]')).toBeVisible();
    await expect(page.locator('[data-fd-card="S01"]')).toBeHidden();
    await expect(page.locator('[data-fd-shot="S16"]')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => time(page)).toBeCloseTo(43.88, 1);
  });

  test('playing the film moves the playhead', async ({ page }) => {
    const left = () => page.locator('[data-fd-head]').evaluate(el => parseFloat((el as HTMLElement).style.left));
    await page.locator('[data-fd-video]').evaluate(v => { const el = v as HTMLVideoElement; el.muted = true; return el.play(); });
    await expect.poll(left, { timeout: 10_000 }).toBeGreaterThan(1);
  });

  test('clicking the picture track scrubs to that moment', async ({ page }) => {
    const box = (await page.locator('.fd__track--colour').boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(() => time(page)).toBeCloseTo(30, 0);
  });

  test('arrow keys, Home and End step through the shots and keep focus', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'keyboard');
    await page.locator('[data-fd-shot="S01"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-fd-shot="S03"]')).toBeFocused();
    await expect(page.locator('[data-fd-card="S03"]')).toBeVisible();
    await page.keyboard.press('End');
    await expect(page.locator('[data-fd-shot="S20"]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('[data-fd-shot="S01"]')).toBeFocused();
    await expect(page.locator('[data-fd-shot="S01"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('previous / next walk every card, S02 included', async ({ page }) => {
    const seen: string[] = [];
    for (let i = 0; i < 23; i++) {
      seen.push(await page.locator('[data-fd-card]:not([hidden])').getAttribute('data-fd-card') ?? '');
      await page.locator('[data-fd-step="1"]').click();
    }
    expect(seen).toHaveLength(23);
    expect(new Set(seen).size).toBe(23);
    expect(seen[1]).toBe('S02');
    await expect(page.locator('[data-fd-card="S20"]')).toBeVisible();
  });

  test('the S02 button opens its card without moving the film', async ({ page }) => {
    await page.locator('[data-fd-pick="S02"]').click();
    await expect(page.locator('[data-fd-card="S02"]')).toBeVisible();
    await expect(page.locator('[data-fd-card="S02"]')).toContainText('未用于成片');
    expect(await time(page)).toBe(0);
  });
});

test('without the signals file the desk still works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/film-signals.json', r => r.abort());
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await expect(page.locator('[data-film-desk]')).toHaveAttribute('data-signals', 'missing');
  await page.locator('[data-fd-shot="S04"]').click();
  await expect(page.locator('[data-fd-card="S04"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced motion: card clips stay still, the playhead still follows the film', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await page.locator('[data-film-desk]').scrollIntoViewIfNeeded();
  await page.locator('[data-fd-shot="S04"]').click();
  expect(await page.locator('[data-fd-card="S04"] video').evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.locator('[data-fd-video]').evaluate(v => new Promise<void>(done => {
    const el = v as HTMLVideoElement;
    const set = () => { el.currentTime = 30; done(); };
    if (el.readyState >= 1) set(); else el.addEventListener('loadedmetadata', set, { once: true });
  }));
  await expect.poll(() => page.locator('[data-fd-head]').evaluate(el => parseFloat((el as HTMLElement).style.left))).toBeCloseTo(50, 0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the film, the first shot card and the whole storyboard are there', async ({ page }) => {
    await page.goto('/projects/mais-je-taime/');
    await expect(page.locator('[data-fd-video]')).toBeVisible();
    await expect(page.locator('[data-fd-card="S01"]')).toBeVisible();
    await expect(page.locator('[data-fd-card]:not([hidden])')).toHaveCount(1);
    await expect(page.locator('.fs__frame')).toHaveCount(25);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/film.spec.ts`
Expected: 新增的剪辑台用例 FAIL（找不到 `[data-film-desk]`）；Task 3 的用例仍 PASS。

- [ ] **Step 3: 剪辑台组件**

`src/components/FilmDesk.astro`：

```astro
---
import { FILM_SHOTS, DESK } from '../data/film';
import { slots, TRANSITIONS, BEATS } from '../data/film-edit';
import { pct, clock, speedLabel } from '../scripts/film-desk';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const M = '/media/mais-je-taime';
const all = slots();
const cut = all.filter(s => s.src !== null);
const pads = all.filter(s => s.src === null);
const at = new Map(all.map(s => [s.id, s]));
const title = new Map(FILM_SHOTS.map(s => [s.id, s.title[lang]]));
const box = (a: number, z: number) => `left:${pct(a)}%;width:${pct(z) - pct(a)}%`;
const first = cut[0].id;
const C = DESK.card;
---
<section class="fd" data-film data-film-desk aria-labelledby="fd-h">
  <div class="wrap">
    <div class="section-head"><h2 id="fd-h">{DESK.h[lang]}</h2></div>
    <p class="fd__lede">{DESK.lede[lang]}</p>
    <figure class="fd__film">
      <video data-fd-video src={`${M}/video/film-60s.mp4`} poster={`${M}/video/film-60s.webp`} width="1280" height="720" controls playsinline preload="metadata"></video>
      <figcaption>{DESK.caption[lang]}</figcaption>
    </figure>

    <div class="fd__rows">
      <p class="fd__label">{DESK.tracks.colour[lang]}</p>
      <div class="fd__track fd__track--colour" data-fd-scrub><canvas data-fd-colour aria-hidden="true"></canvas></div>

      <p class="fd__label" id="fd-shots-l">{DESK.tracks.shots[lang]}</p>
      <div class="fd__track fd__track--shots" role="group" aria-labelledby="fd-shots-l" data-fd-shots>
        {pads.map(p => <span class="fd__pad" style={box(p.start, p.stop)} aria-hidden="true">{p.id === 'S00' ? DESK.black[lang] : DESK.title[lang]}</span>)}
        {cut.map(s => (
          <button type="button" class:list={['fd__shot', { 'is-gray': s.gray, 'is-narrow': pct(s.stop) - pct(s.start) < 3.2 }]} style={box(s.start, s.stop)}
            data-fd-shot={s.id} data-start={s.start} data-stop={s.stop} aria-pressed={String(s.id === first)} tabindex={s.id === first ? 0 : -1}
            aria-label={`${s.id} ${title.get(s.id)} · ${clock(s.start)}–${clock(s.stop)} · ${speedLabel(s.speed!)}`}>
            <span class="fd__id">{s.id}</span><span class="fd__speed">{speedLabel(s.speed!)}</span>
          </button>
        ))}
        {TRANSITIONS.map(c => <span class:list={['fd__cut', `fd__cut--${c.kind}`]} style={`left:${pct(c.at)}%`} aria-hidden="true"></span>)}
      </div>

      <p class="fd__label">{DESK.tracks.sound[lang]}</p>
      <div class="fd__track fd__track--sound" data-fd-scrub>
        <canvas data-fd-wave aria-hidden="true"></canvas>
        {BEATS.map(x => <span class="fd__beat" style={`left:${pct(x.at)}%`}>{DESK.beats[x.key][lang]} {x.label}</span>)}
      </div>

      <div class="fd__lane" aria-hidden="true"><div class="fd__head" data-fd-head style="left:0%"></div></div>
    </div>

    <ul class="fd__legend">
      <li><span class="fd__key fd__key--gray"></span>{DESK.legend.gray[lang]}</li>
      <li><span class="fd__key fd__key--dissolve"></span>{DESK.legend.dissolve[lang]}</li>
      <li><span class="fd__key fd__key--dip"></span>{DESK.legend.dip[lang]}</li>
    </ul>
    <p class="fd__s02">{DESK.s02[lang]} <button type="button" class="fd__link" data-fd-pick="S02">{DESK.viewS02[lang]}</button></p>

    <div class="fd__panel">
      <div class="fd__nav">
        <button type="button" data-fd-step="-1">‹ {C.prev[lang]}</button>
        <button type="button" data-fd-step="1">{C.next[lang]} ›</button>
      </div>
      {FILM_SHOTS.map(s => { const c = at.get(s.id); return (
        <article class="fd__card" data-fd-card={s.id} data-start={c ? c.start : undefined} hidden={s.id !== first} aria-labelledby={`fd-c-${s.id}`}>
          <video data-src={`${M}/video/${s.file}.mp4`} poster={`${M}/video/${s.file}.webp`} width="960" height="540" muted loop playsinline preload="none" aria-label={`${s.id} ${s.title[lang]}`}></video>
          <div>
            <h3 id={`fd-c-${s.id}`}><span class="fd__id">{s.id}</span> {s.title[lang]}</h3>
            <p class="fd__meta">{s.made[lang]}</p>
            <dl class="fd__facts">
              {c ? (
                <Fragment>
                  <div><dt>{C.inCut[lang]}</dt><dd>{clock(c.start)}–{clock(c.stop)}</dd></div>
                  <div><dt>{C.speed[lang]}</dt><dd>{speedLabel(c.speed!)}</dd></div>
                  <div><dt>{C.source[lang]}</dt><dd>{c.inPt.toFixed(1)}–{c.outPt.toFixed(1)}{C.unit[lang]}</dd></div>
                </Fragment>
              ) : <div><dt>{C.inCut[lang]}</dt><dd>{C.notInCut[lang]}</dd></div>}
            </dl>
            <p>{s.clip[lang]}</p>
            {s.revision && <p><a href={`#rev-${s.revision}`}>{C.revision[lang]} →</a></p>}
          </div>
        </article>
      ); })}
    </div>
  </div>
</section>
<script>
  import { initFilmDesk } from '../scripts/film-desk-dom';
  document.querySelectorAll<HTMLElement>('[data-film-desk]').forEach(initFilmDesk);
</script>
<style>
  .fd { padding-block: 24px 56px; }
  .fd__lede { max-width: 46em; margin: 16px 0 24px; }
  .fd__film { margin: 0 0 20px; }
  .fd__film video { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; background: #000; }
  .fd__film figcaption { margin-top: 8px; color: var(--mute); font-size: 14px; }

  .fd__rows { position: relative; display: grid; grid-template-columns: minmax(4.5em, 7em) minmax(0, 1fr); gap: 6px 12px; align-items: center; }
  .fd__label { margin: 0; color: var(--mute); font-size: 13px; }
  .fd__track { position: relative; height: 36px; cursor: pointer; }
  .fd__track canvas { display: block; width: 100%; height: 100%; color: var(--ink); }
  .fd__track--shots { height: 52px; cursor: default; }
  .fd__track--sound { height: 56px; }
  .fd__shot { position: absolute; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 2px;
    min-width: 0; padding: 0 4px; overflow: hidden; border: 1px solid var(--paper); background: color-mix(in srgb, var(--ink) 16%, transparent);
    color: var(--ink); font: 500 11px/1.1 var(--font-body); text-align: left; cursor: pointer; }
  .fd__shot.is-gray { background: color-mix(in srgb, var(--mute) 28%, transparent); }
  .fd__shot.is-live { background: color-mix(in srgb, var(--ink) 34%, transparent); }
  .fd__shot[aria-pressed='true'] { outline: 2px solid var(--red); outline-offset: -2px; }
  .fd__shot.is-narrow > span { display: none; }
  .fd__speed { color: var(--mute); font-size: 10px; }
  .fd__pad { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; padding: 0 4px; overflow: hidden; white-space: nowrap;
    border: 1px dashed color-mix(in srgb, var(--mute) 60%, transparent); color: var(--mute); font-size: 10px; }
  .fd__cut { position: absolute; top: -5px; width: 8px; height: 8px; margin-left: -4px; pointer-events: none; }
  .fd__cut--dissolve { transform: rotate(45deg); border: 1.5px solid var(--ink); background: var(--paper); }
  .fd__cut--dip { background: var(--ink); }
  .fd__beat { position: absolute; top: 2px; padding-left: 6px; border-left: 1.5px solid var(--red); color: var(--ink); font-size: 11px; white-space: nowrap; pointer-events: none; }
  .fd__beat:nth-of-type(2) { top: auto; bottom: 2px; }
  .fd__beat:last-of-type { padding: 0 6px 0 0; border-left: 0; border-right: 1.5px solid var(--red); transform: translateX(-100%); }
  /* Absolutely positioned on the track column: takes no grid cell, so the labels and tracks keep their auto-placed rows. */
  .fd__lane { position: absolute; inset: 0; grid-column: 2; grid-row: 1 / 4; pointer-events: none; }
  .fd__head { position: absolute; top: -6px; bottom: -6px; width: 2px; margin-left: -1px; background: var(--red); }

  .fd__legend { display: flex; flex-wrap: wrap; gap: 6px 20px; margin: 14px 0 0; padding: 0; list-style: none; color: var(--mute); font-size: 13px; }
  .fd__legend li { display: flex; align-items: center; gap: 8px; }
  .fd__key { width: 12px; height: 12px; }
  .fd__key--gray { background: color-mix(in srgb, var(--mute) 28%, transparent); border: 1px solid var(--mute); }
  .fd__key--dissolve { width: 8px; height: 8px; transform: rotate(45deg); border: 1.5px solid var(--ink); }
  .fd__key--dip { width: 8px; height: 8px; background: var(--ink); }
  .fd__s02 { margin-top: 10px; color: var(--mute); font-size: 14px; }
  .fd__link { padding: 0; border: 0; background: none; color: var(--ink); font: inherit; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }

  .fd__panel { margin-top: 28px; }
  .fd__nav { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
  .fd__nav button { padding: 6px 12px; border: 1.5px solid var(--ink); background: transparent; color: var(--ink); font-size: 13px; font-weight: 500; cursor: pointer; }
  .fd__nav button:hover { background: var(--ink); color: var(--paper); }
  .fd__card { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 20px 32px; align-items: start; }
  .fd__card[hidden] { display: none; }
  .fd__card video { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; background: #000; }
  .fd__card h3 { font-size: 20px; }
  .fd__id { font-family: var(--font-display); letter-spacing: 0.02em; }
  .fd__meta { margin-top: 4px; color: var(--mute); font-size: 13px; }
  .fd__facts { display: flex; flex-wrap: wrap; gap: 4px 24px; margin: 12px 0; }
  .fd__facts dt { color: var(--mute); font-size: 12px; }
  .fd__facts dd { margin: 0; font-weight: 500; }
  @media (max-width: 760px) { .fd__card { grid-template-columns: 1fr; } .fd__nav { justify-content: space-between; } }
</style>
```

- [ ] **Step 4: 剪辑台脚本**

`src/scripts/film-desk-dom.ts`：

```ts
import { frameCap } from './frame-cap';
import { pct, timeAt, stepIndex } from './film-desk';

interface Signals { fps: number; colors: string[]; peaks: number[] }
const SIGNALS = '/media/mais-je-taime/film-signals.json';

export function initFilmDesk(root: HTMLElement): void {
  const video = root.querySelector<HTMLVideoElement>('[data-fd-video]');
  const head = root.querySelector<HTMLElement>('[data-fd-head]');
  if (!video || !head) return;
  const shots = [...root.querySelectorAll<HTMLButtonElement>('[data-fd-shots] [data-fd-shot]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-fd-card]')];
  const ids = cards.map(c => c.dataset.fdCard ?? '');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = cards.find(c => !c.hidden)?.dataset.fdCard ?? ids[0];

  const place = (t: number) => {
    head.style.left = `${pct(t)}%`;
    for (const b of shots) b.classList.toggle('is-live', Number(b.dataset.start) <= t && t < Number(b.dataset.stop));
  };
  // Before the film's metadata arrives, setting currentTime is unreliable: wait for it, but move the playhead now.
  const seek = (t: number) => {
    place(t);
    if (video.readyState >= 1) video.currentTime = t;
    else video.addEventListener('loadedmetadata', () => { video.currentTime = t; }, { once: true });
  };
  const select = (id: string, focus = false) => {
    current = id;
    for (const c of cards) {
      const on = c.dataset.fdCard === id;
      c.hidden = !on;
      const v = c.querySelector('video');
      if (!v) continue;
      if (on) {
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        if (!reduced) void v.play().catch(() => { /* autoplay refused: the poster stays */ });
      } else if (!v.paused) v.pause();
    }
    const onTrack = shots.some(b => b.dataset.fdShot === id);
    for (const b of shots) {
      const on = b.dataset.fdShot === id;
      b.setAttribute('aria-pressed', String(on));
      b.tabIndex = on || (!onTrack && b === shots[0]) ? 0 : -1;
      if (on && focus) b.focus();
    }
  };
  const go = (id: string, focus = false) => {
    select(id, focus);
    const start = cards.find(c => c.dataset.fdCard === id)?.dataset.start;
    if (start !== undefined) seek(Number(start));
  };

  for (const b of shots) b.addEventListener('click', () => go(b.dataset.fdShot ?? ''));
  root.querySelector('[data-fd-shots]')?.addEventListener('keydown', e => {
    const key = (e as KeyboardEvent).key;
    const i = shots.findIndex(b => b === document.activeElement);
    if (i < 0) return;
    const j = key === 'ArrowRight' ? stepIndex(shots.length, i, 1) : key === 'ArrowLeft' ? stepIndex(shots.length, i, -1)
      : key === 'Home' ? 0 : key === 'End' ? shots.length - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    go(shots[j].dataset.fdShot ?? '', true);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-fd-step]').forEach(b => b.addEventListener('click', () => {
    go(ids[stepIndex(ids.length, ids.indexOf(current), b.dataset.fdStep === '-1' ? -1 : 1)]);
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-fd-pick]').forEach(b => b.addEventListener('click', () => go(b.dataset.fdPick ?? '')));
  root.querySelectorAll<HTMLElement>('[data-fd-scrub]').forEach(el => el.addEventListener('click', e => {
    const r = el.getBoundingClientRect();
    seek(timeAt((e as MouseEvent).clientX - r.left, r.width));
  }));

  // The playhead follows every timeupdate; while playing it is also smoothed on animation frames (not with reduced motion).
  const sync = () => place(video.currentTime);
  video.addEventListener('timeupdate', sync);
  video.addEventListener('seeked', sync);
  const cap = frameCap();
  let raf = 0;
  const loop = (now: number) => { if (cap(now)) sync(); raf = requestAnimationFrame(loop); };
  video.addEventListener('play', () => { if (!reduced && !raf) raf = requestAnimationFrame(loop); });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; sync(); };
  video.addEventListener('pause', stop);
  video.addEventListener('ended', stop);

  // The first card's clip loads only once the desk is on screen.
  const io = new IntersectionObserver(entries => {
    if (!entries.some(en => en.isIntersecting)) return;
    io.disconnect();
    select(current);
  });
  io.observe(root);

  void drawSignals(root);
}

async function drawSignals(root: HTMLElement): Promise<void> {
  const colour = root.querySelector<HTMLCanvasElement>('[data-fd-colour]');
  const wave = root.querySelector<HTMLCanvasElement>('[data-fd-wave]');
  if (!colour || !wave) return;
  let data: Signals;
  try {
    const r = await fetch(SIGNALS);
    if (!r.ok) throw new Error(String(r.status));
    data = await r.json() as Signals;
  } catch {
    root.dataset.signals = 'missing';
    return;
  }
  const paint = () => { band(colour, data.colors); bars(wave, data.peaks); };
  paint();
  new ResizeObserver(paint).observe(colour);
  root.dataset.signals = 'ready';
}

function fit(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
  if (!w || !h) return null;
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c.getContext('2d');
}

function band(c: HTMLCanvasElement, colors: string[]): void {
  const g = fit(c);
  if (!g) return;
  const step = c.width / colors.length;
  colors.forEach((col, i) => { g.fillStyle = col; g.fillRect(Math.floor(i * step), 0, Math.ceil(step) + 1, c.height); });
}

function bars(c: HTMLCanvasElement, peaks: number[]): void {
  const g = fit(c);
  if (!g) return;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = getComputedStyle(c).color;
  g.globalAlpha = 0.6;
  const step = c.width / peaks.length, mid = c.height / 2;
  peaks.forEach((p, i) => { const h = Math.max(1, p * mid * 0.92); g.fillRect(i * step, mid - h, Math.max(1, step - 0.5), h * 2); });
  g.globalAlpha = 1;
}
```

`src/views/FilmView.astro`：import 区加 `import FilmDesk from '../components/FilmDesk.astro';`，`demo` 槽改为：

```astro
  <Fragment slot="demo">
    <FilmRed lang={lang} />
    <FilmDesk lang={lang} />
    <FilmStory lang={lang} />
  </Fragment>
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx playwright test tests/e2e/film.spec.ts tests/e2e/a11y.spec.ts tests/e2e/numbers.spec.ts --grep "mais-je-taime|film|desk|signals|reduced|JavaScript"`
Expected: 全部 PASS（桌面与手机）。

再做一次变异检查（不提交）：把 `seek` 里的 `else video.addEventListener(…)` 整行删掉，重跑 `a shot clicked before the film is ready`——若它仍通过，说明测试没抓到"元数据未就绪"的情况，改测试（例如在 `beforeEach` 之外单独起一个用例，`page.route('**/film-60s.mp4', …)` 延迟 1.5 秒再放行）直到它在变异下失败；然后恢复代码。

- [ ] **Step 6: 提交**

```bash
git add src/components/FilmDesk.astro src/scripts/film-desk-dom.ts src/views/FilmView.astro tests/e2e/film.spec.ts
git commit -m "Mais je t'aime edit desk: the film with its real edit list, picture colour and soundtrack, playhead in sync"
```

---

### Task 5: 隐私页、站点地图与旧网址

**Files:**
- Create: `src/copy/privacy.zh.md`、`src/copy/privacy.en.md`、`src/views/PrivacyView.astro`、`src/pages/privacy.astro`、`src/pages/en/privacy.astro`、`src/pages/sitemap.xml.ts`、`tests/unit/privacy.test.ts`、`tests/e2e/privacy.spec.ts`、`tests/e2e/legacy.spec.ts`
- Modify: `src/data/site.ts`（pages.privacy）、`tests/e2e/helpers.ts`（PRIVACY_PAGES，删 PHASE2_PENDING）、`tests/e2e/links.spec.ts`

**Interfaces:**
- Consumes: `SEEN_KEY`（`src/scripts/intro.ts`）、`SITE.email`、`SITE.projects[].href`、`localizePath`。
- Produces: `/privacy/`、`/en/privacy/`、`/sitemap.xml`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/privacy.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SEEN_KEY } from '../../src/scripts/intro';
import { SITE } from '../../src/data/site';

const zh = readFileSync('src/copy/privacy.zh.md', 'utf8');
const en = readFileSync('src/copy/privacy.en.md', 'utf8');

describe('privacy copy', () => {
  it.each([['zh', zh], ['en', en]])('%s names the one storage key the site really uses, and the contact address', (_l, md) => {
    expect(md).toContain(SEEN_KEY);
    expect(md).toContain(`mailto:${SITE.email}`);
  });

  it('both languages have the same sections', () => {
    expect(zh.match(/^## /gm)).toHaveLength(5);
    expect(en.match(/^## /gm)).toHaveLength(5);
  });
});
```

`tests/e2e/privacy.spec.ts`：

```ts
import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

for (const [lang, path, h1] of [['zh', '/privacy/', '隐私与使用说明'], ['en', '/en/privacy/', 'Privacy & use']] as const) {
  test(`privacy page (${lang}) opens from the footer`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(lang === 'zh' ? '/' : '/en/');
    await page.locator('.footer a[href$="privacy/"]').click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('h1')).toHaveText(h1);
    await expect(page.locator('main')).toContainText('hyj-intro-seen');
  });
}
```

`tests/e2e/legacy.spec.ts`：

```ts
import { test, expect } from '@playwright/test';

// Every HTML address of the old site (git ls-tree origin/main @ 90cd241), plus its sitemap.
const LEGACY = ['/', '/404.html', '/privacy/', '/projects/ai-campus/', '/projects/ai-career/', '/projects/campus-delivery/',
  '/projects/hris-workflow/', '/projects/mais-je-taime/', '/projects/quota-deck/', '/projects/stock-data/',
  '/projects/stock-data/method/', '/downloads/delivery/web-source/page.html', '/sitemap.xml'];

test('every address of the old site still opens', async ({ request, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  const bad: string[] = [];
  for (const p of LEGACY) if ((await request.get(p)).status() !== 200) bad.push(p);
  expect(bad).toEqual([]);
});

test('the sitemap lists both languages of the new pages', async ({ request, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/projects/mais-je-taime/', '/en/projects/mais-je-taime/', '/privacy/', '/en/privacy/', '/projects/stock-data/method/'])
    expect(xml).toContain(`<loc>https://chiwawafromkk.github.io${p}</loc>`);
});
```

`tests/e2e/helpers.ts`：`FILM_PAGES` 之后加 `export const PRIVACY_PAGES = ['/privacy/', '/en/privacy/'];`，`PAGES` 末尾加 `...PRIVACY_PAGES`，删除整个 `PHASE2_PENDING`。

`tests/e2e/links.spec.ts`：import 改为 `import { PAGES, skipIntro } from './helpers';`，删掉 `if (PHASE2_PENDING.has(decodeURI(h))) continue;` 这一行，测试名改为 `'every internal link resolves'`。

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/privacy.test.ts` → FAIL（文件不存在）
Run: `npx playwright test tests/e2e/privacy.spec.ts tests/e2e/legacy.spec.ts` → FAIL（404）

- [ ] **Step 3: 正文**

`src/copy/privacy.zh.md`：

```md
更新于 2026 年 10 月 2 日。

## 你输入的数据

本站的在线演示都在你的浏览器里运行：

- 求职 Agent 与 AI 校园研究的完整版，由 Pyodide 在浏览器里运行公开仓库固定版本的 Python 源码；
- CSV 数据分析工具读取你选择或粘贴的表格，SQL 工作台在浏览器里建库和查询；
- QuotaDeck 完整版运行真实的界面文件，但额度、模型和任务全部是模拟数据。

这些工具不会把你的输入发送到服务器，也不会写入浏览器的持久存储；刷新或关闭页面后，输入不会被保留。导出的文件保存在你自己的设备上。处理他人或企业的数据前，请确认自己有权限。

## 本地存储

首页开场动画播放过一次后，本站会在浏览器的 localStorage 里记一个"已看过"的标记 `hyj-intro-seen`，下次直接显示首页。它不含任何个人信息；清除浏览器里本站的网站数据即可删除。除此之外，本站不使用 Cookie 或其他浏览器存储。

## 网站访问

本站由 GitHub Pages 托管，页面、字体和脚本都从本站加载。访问时，托管服务会处理提供网页所需的网络请求信息，规则见 [GitHub 隐私声明](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)。本站目前没有访问统计、广告追踪、账号注册或支付功能。

## 作品与范例的边界

- CSV 与 SQL 的样本是人工构造的数据，不代表真实业务，也不是投资建议。
- 求职 Agent 演示里的岗位和候选人是虚构的；匹配分不是面试或录用概率，演示也不会代你投递。
- QuotaDeck 演示不读取你的电脑或任何账号，并行分工只走状态流程，不调用真实的 AI Agent。
- Mais je t'aime 的画面由 AI 生成；剧本、分镜、审图与剪辑由我完成。
- 源码、样本与第三方字体的许可，以随附文件或源仓库的说明为准。

## 外部链接与邮件

打开 GitHub 等外部网站后，适用对应网站的规则。点击邮箱会打开你设备上的邮件应用；只有你主动发送时，我才会收到你的地址和内容。请不要通过邮件发送密码或 API 密钥。

如需反馈数据处理问题或页面错误，请发邮件至 [2806660493@qq.com](mailto:2806660493@qq.com)。
```

`src/copy/privacy.en.md`：

```md
Updated 2 October 2026.

## What you enter

The live demos on this site all run in your browser:

- the full editions of the Job Agent and the AI-on-campus study run Python source from a pinned commit of the public repositories, in your browser, through Pyodide;
- the CSV Analysis Tool reads the table you choose or paste, and the SQL lab builds and queries its database in your browser;
- the full QuotaDeck edition runs the real interface files, but every quota, model and task in it is simulated.

None of these tools sends what you enter to a server or writes it to persistent browser storage; it is gone when you reload or close the page. Files you export stay on your own device. Before working with someone else's or a company's data, make sure you are allowed to.

## Local storage

After the home page's opening animation has played once, the site stores a "seen" flag, `hyj-intro-seen`, in your browser's localStorage so the next visit goes straight to the page. It holds no personal information; clearing this site's data in your browser removes it. The site uses no cookies or other browser storage.

## Visiting the site

The site is hosted on GitHub Pages, and its pages, fonts and scripts all load from the site itself. The host processes the network request information needed to serve the pages, under the [GitHub General Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). The site currently has no visitor analytics, ad tracking, accounts or payments.

## Where the demos end

- The CSV and SQL samples are constructed data, not real business records or investment advice.
- The roles and candidates in the Job Agent demo are fictional; match scores are not interview or offer probabilities, and the demo never applies on your behalf.
- The QuotaDeck demo reads nothing from your computer or any account; its parallel hand-off only walks the state flow and calls no real AI agent.
- The pictures in Mais je t'aime are generated by AI; the script, storyboard, review and edit are mine.
- Licences for source code, samples and third-party fonts are as stated in the accompanying files or source repositories.

## Links and email

Once you open GitHub or another outside site, that site's rules apply. The email link opens the mail app on your device; I receive your address and message only if you send it. Please do not send passwords or API keys by email.

To report a data-handling concern or a page error, email [2806660493@qq.com](mailto:2806660493@qq.com).
```

- [ ] **Step 4: 视图、页面、配置、站点地图**

`src/data/site.ts` 的 `pages` 里，`film: {…},` 之后加：

```ts
    privacy: {
      title: { zh: '隐私与使用说明', en: 'Privacy & use' },
      description: { zh: '本站如何处理你输入的数据、本地存储与网站访问，以及作品与范例的边界。', en: 'How this site handles what you enter, local storage and visits, and where the demos and samples end.' },
    },
```

`src/views/PrivacyView.astro`：

```astro
---
import Base from '../layouts/Base.astro';
import { SITE } from '../data/site';
import { Content as Zh } from '../copy/privacy.zh.md';
import { Content as En } from '../copy/privacy.en.md';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const P = SITE.pages.privacy;
const Body = lang === 'zh' ? Zh : En;
---
<Base lang={lang} path="/privacy/" title={`${P.title[lang]} · ${SITE.name[lang]}`} description={P.description[lang]}>
  <main id="main">
    <header class="pv wrap"><h1>{P.title[lang]}</h1></header>
    <article class="prose wrap"><Body /></article>
  </main>
</Base>
<style>
  .pv { padding-block: clamp(32px, 6vh, 72px) 8px; }
  .pv h1 { font-size: clamp(36px, 5vw, 72px); line-height: 1; letter-spacing: -0.03em; }
</style>
```

`src/pages/privacy.astro`：

```astro
---
import PrivacyView from '../views/PrivacyView.astro';
---
<PrivacyView lang="zh" />
```

`src/pages/en/privacy.astro`：

```astro
---
import PrivacyView from '../../views/PrivacyView.astro';
---
<PrivacyView lang="en" />
```

`src/pages/sitemap.xml.ts`：

```ts
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { localizePath } from '../i18n';

const ORIGIN = 'https://chiwawafromkk.github.io';

/** Kept at the old site's address; robots.txt already points here. */
export const GET: APIRoute = () => {
  const bare = [...new Set(['/', '/brief/', '/projects/', ...SITE.projects.map(p => p.href), '/projects/stock-data/method/', '/privacy/'])];
  const urls = bare.flatMap(p => [localizePath(p, 'zh'), localizePath(p, 'en')]);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    urls.map(u => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run tests/unit/privacy.test.ts` → PASS
Run: `npx playwright test tests/e2e/privacy.spec.ts tests/e2e/legacy.spec.ts tests/e2e/links.spec.ts tests/e2e/a11y.spec.ts tests/e2e/numbers.spec.ts --grep "privacy|old site|sitemap|internal link"` → 全部 PASS

- [ ] **Step 6: 提交**

```bash
git add src/copy/privacy.zh.md src/copy/privacy.en.md src/views/PrivacyView.astro src/pages/privacy.astro src/pages/en/privacy.astro src/pages/sitemap.xml.ts src/data/site.ts tests/unit/privacy.test.ts tests/e2e/privacy.spec.ts tests/e2e/legacy.spec.ts tests/e2e/helpers.ts tests/e2e/links.spec.ts
git commit -m "Privacy page rewritten for the new site, the sitemap back at its old address, and a check that every old URL opens"
```

---

### Task 6: 全量验收与本地预览

- [ ] **Step 1: 全量测试**

Run: `npx vitest run` → 全部 PASS
Run: `npx playwright test` → 全部 PASS（记录通过数）。失败先查根因；不加重试、不放宽断言。

- [ ] **Step 2: 截图自查**

用 Playwright 截取 `/projects/mais-je-taime/`（1440×900 与 390×844，各截剪辑台、四幕分镜、返修记录三处）和 `/privacy/`、`/en/privacy/`，存到 `.superpowers/sdd/2026-10-02-2c-film-privacy/shots/`，逐张看：暗场下文字和边线是否都看得清、播放头与卡点标签是否压字、手机上镜头轨是否可读、卡片布局是否整齐。发现问题就修，修完重跑相关 e2e 并提交。

- [ ] **Step 3: 构建并替用户打开预览**

```bash
npm run build
npx astro preview --port 4321      # 后台运行
start "" "http://localhost:4321/projects/mais-je-taime/"
start "" "http://localhost:4321/privacy/"
```

**停在这里**：把两个地址告诉用户，等用户确认"可以上线"后才做 Task 7。

---

### Task 7: 上线（用户确认后）

- [ ] **Step 1: 用最新源码构建**

```bash
git status --short | grep -v '^?? .superpowers'     # 期望为空
npm run build
find dist -type f | wc -l
```

- [ ] **Step 2: 在干净工作区准备 main 的新提交**

```bash
REPO="$(pwd)"; SRC="$(git rev-parse --short HEAD)"
D="C:/Users/yoshi/AppData/Local/Temp/claude/C--Users-yoshi/52ecd9ee-b46a-49bf-8c1f-52598791a571/scratchpad/deploy-main"
git fetch origin
git worktree add --detach "$D" origin/main
cd "$D"
git rm -rq .
cp -r "$REPO/dist/." .
touch .nojekyll                                     # 否则 Pages 的 Jekyll 会丢掉 _astro/
git add -A
echo "files in dist: $(find "$REPO/dist" -type f | wc -l) · tracked: $(git ls-files | wc -l)"   # 后者应 = 前者 + 1（.nojekyll）
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -q -m "Publish the redesigned portfolio (Astro build of redesign@$SRC)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git log --oneline -2
```

如果两个文件数对不上，查是不是全局 `.gitignore` 挡掉了某类文件（例如 `.whl`），用 `git add -f` 补上后再提交。

- [ ] **Step 3: 推送（快进，不强推）**

```bash
cd "$D" && git push origin HEAD:main
cd "$REPO" && git push origin redesign
```

推送被拒（远端有新提交）就停下来报告用户，不要强推。

- [ ] **Step 4: 线上验收**

等 GitHub Pages 发布（通常一两分钟），然后：

```bash
for i in $(seq 1 30); do curl -s https://chiwawafromkk.github.io/projects/mais-je-taime/ | grep -q 'data-film-desk' && break; sleep 10; done
for p in / /brief/ /projects/ /privacy/ /en/privacy/ /projects/mais-je-taime/ /en/projects/mais-je-taime/ /projects/ai-career/ /projects/ai-career/live/ /projects/ai-campus/live/ /projects/quota-deck/live/ /projects/campus-delivery/insights/ /projects/stock-data/method/ /downloads/delivery/web-source/page.html /sitemap.xml /media/mais-je-taime/film-signals.json; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "https://chiwawafromkk.github.io$p")" "$p"
done
```

全部 200。再用浏览器替用户打开 `https://chiwawafromkk.github.io/` 和短片页。

- [ ] **Step 5: 收尾**

```bash
cd "$REPO" && git worktree remove "$D"
```

写 Obsidian 收件箱记录（上线时间、main 提交号、源码提交号、回滚方法：`git revert <main 提交>` 后推送）。

**回滚**：在任意工作区 `git fetch origin && git worktree add --detach <dir> origin/main`，`git revert --no-edit HEAD`，`git push origin HEAD:main`。
