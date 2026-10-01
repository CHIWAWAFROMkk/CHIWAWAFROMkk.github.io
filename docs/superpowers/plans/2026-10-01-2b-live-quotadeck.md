# 2B 技术力 · 计划三：QuotaDeck 页"时间机器" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** QuotaDeck 页的演示区换成"时间机器"：左边是 QuotaDeck 公开仓库 e9557c6 的真实托盘界面（原样的 compact.html / css / js），右边是 13 小时的额度时间轴；模拟时钟 1×/60×/600× 快进，额度消耗、到点重置；Antigravity 的消耗速度和耗尽预测由 QuotaDeck 自己的 `quota-history.cjs` 计算，界面数据由它自己的 `providerToUi` / `toUiSnapshot` 生成；"派一个大任务"和"并行协作"走一遍真实的状态流程，不调用任何 Agent、不编造回答。模拟不可用时只显示现有的三张桌面版截图。

**Architecture:** `npm run quotadeck:vendor` 从本机 QuotaDeck 仓库的 git 记录里原样复制 7 个文件到 `public/assets/quotadeck/e9557c6/`，并写 SHA-256 清单。页面里，`qd-load.ts` 执行原样的 `snapshot.cjs`、`quota-history.cjs`、`model-guidance.cjs`：用浏览器替身代替 `node:fs/promises`（内存文件系统）、`node:path`、`node:crypto`，各家连接器换成"拒绝读取"的空实现，并把 `Date.now()` 接到模拟时钟。`qd-sim.ts` 只负责时钟、使用量、大任务和协作状态流程，产出与 QuotaDeck 自己的规范化函数逐字段一致的服务商快照。`qd-bridge.ts` 是桌面版 preload 的网页版（`window.quotaDeck`）；同源内嵌页 `host.html` 先挂上桥接，再原样加载 compact.html 的标记和 compact.js。`qd-timeline.ts` 移植第二版原型 `p2.html` 的时间轴与特效画布；`qd-live.ts` 串起这一切。

**Tech Stack:** Astro 7、TypeScript、QuotaDeck 0.5.0-rc.5（e9557c6，CommonJS 原样执行）、Canvas 2D、Vitest、Playwright（Edge）。

**Spec:** `docs/superpowers/specs/2026-09-30-2b-live-tech-design.md`（第 3、5、6、7 节；本计划为第 7 节表中的"计划三"）。视觉参考：`.superpowers/proto-v2/p2.html`（第二版原型，用户已选"对，按这个做"）。前两个计划：`docs/superpowers/plans/2026-09-30-2b-live-career.md`、`docs/superpowers/plans/2026-10-01-2b-live-campus.md`。

## 计划中替用户做的决定（交付时请用户确认）

1. **原样代码怎么在浏览器里跑**：规格写"以上都通过构建工具的路径别名完成"。本计划改为运行时加载：页面取回复制来的 `.cjs` 原文，用一个约 60 行的加载器执行，并提供替身模块。这样网站上发布的文件与清单逐字节一致，Node 单元测试也用同一个加载器跑同一批文件。代价是加载器用到 `new Function`（网站没有 CSP 限制）。
2. **时间轴只画 5 小时窗口**：Codex、Claude Code、Antigravity 的演示数据只给 5 小时窗口，不给每周窗口。如果加上每周窗口，重置后界面大字会改显示更紧的每周额度，和时间轴上的 5 小时曲线对不上。DeepSeek（余额）和 WorkBuddy（网页快照，3 小时前）照常出现在界面里。
3. **Antigravity 的演示模型**用真实的家族名"Gemini Models"和 `gemini-` 开头的模型 id，显示名写"演示模型 G1 / G2"，这样会被 QuotaDeck 自己的规则归进同一个共享池。
4. **协作结果怎么显示**：真实界面只认"完成 / 失败"两种状态。网页演示里每个 Agent 显示"完成"，正文是"网页演示：状态流程与额度变化为模拟，没有调用真实 Agent，也没有生成任何回答。桌面版里，这里是该 Agent 的独立成果。"——这是说明，不是回答。
5. **本机 Agent 一律"可调用"**：桌面版用本机是否装了各家 CLI 来判断；网页演示里四个 Agent 都标为可调用，否则真实界面不允许勾选。
6. **桌面版专属操作不在网页里提供**：托盘隐藏、一键接入 Claude、打开 WorkBuddy、打开说明文件。桥接对象不提供这些方法，真实界面会显示它自己的"请在桌面软件中操作 / 使用"提示。"刷新"会立即按当前模拟时间重算一次。
7. **减少动态效果时默认暂停**：先在后台快进 90 分钟（让采样和耗尽预测已经出现），停在那一刻；访客点任一速度再播放。不播放冲击波、火花、扫描线和震动。
8. **"桌面版真实截图"**：现有三张截图保留在时间机器下方，标题从"在本机运行的界面"改为"桌面版真实截图"。
9. **向真实界面推送的节奏**：600× 时 QuotaDeck 每 0.1 秒刷新一次，界面每收到一次快照就整块重绘，访客的点击会被吞掉。所以采样照常按模拟时间每分钟一次，但推给界面的快照最多每 0.5 秒一次，访客正在按下或正在编辑界面里的东西时，等松开或离开再推。
10. **界面缩放**：真实窗口按 520×840 渲染。桌面按 0.8 倍显示（416×672），窄屏按列宽等比缩放。窗口内容超出时在窗口内部滚动，和桌面版一样。

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；不推送、不合并、不部署。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。只 `git add` 明确列出的路径（`.superpowers/` 未被忽略，不能带进提交）。不用裸 `git stash`。
- QuotaDeck 固定提交 `e9557c62f00a085299e5d3d06e9259ed19688ef8`（公开仓库 https://github.com/CHIWAWAFROMkk/quota-deck 的 `main`，版本 0.5.0-rc.5，MIT 许可）。复制的 7 个文件不做任何修改：`src/renderer/compact.html`、`compact.css`、`compact.js`、`src/main/snapshot.cjs`、`quota-history.cjs`、`model-guidance.cjs`、`LICENSE`。本机仓库：`C:\Users\yoshi\Documents\ChatGPT\额度显示器`（复制脚本与比对测试通过 `QUOTADECK_ROOT` 找到它）。
- 网页里没有任何读取真实账号的代码路径：连接器（codex、deepseek、workbuddy、antigravity、claude）的读取函数一律拒绝并报错；`orchestrator.cjs` 不加载；`createHash` 被调用就报错；演示从不传入账号范围。
- 模拟只有四件事：时钟（1×、60×、600×，默认 600×，另有暂停）、使用量（平滑噪声、5 小时窗口、到点重置）、大任务（Codex 骤降 24 点）、协作状态流程（排队中 → 运行中 → 已完成）。其余数字——界面上的百分比、状态、重置倒计时、消耗速度、耗尽预测——全部由 QuotaDeck 自己的代码算出。
- QuotaDeck 每 60 秒刷新一次（`src/main/main.cjs` 第 157 行）；模拟器按模拟时间每 60 秒调用一次它的读取流程，Antigravity 的采样就在这一步由它自己写入历史。
- 演示区根元素带 `data-demo`（数字测试排除）；界面外的标题写"演示数据 · 非真实额度"；协作结果区与条带写明"网页演示：状态流程与额度变化为模拟，不调用真实 Agent，不生成回答"。
- 颜色只用 tokens 变量（`--paper --ink --mute --red --red-text --night --night-fg --night-mute`），画布颜色也从这些变量读取（可以由它们混合）；夜色底上的小字只用 `--night-fg`、`--night-mute`，红色只用于线条、底色、边框和标记。QuotaDeck 界面自己的配色属于被展示的作品，不受此限。
- 动效：闪光不透明度 ≤ 0.35，没有整屏白闪；震动 ≤ 8px、≤ 400ms；关键时刻 ≥ 50 fps。
- 手机（390 宽）：窗口和时间轴上下排列并缩放；页面不横向溢出。
- 英文页界面英文；QuotaDeck 窗口本身是中文，注明"QuotaDeck's interface is in Chinese"。
- 模拟不可用（复制文件取不到、加载器出错、内嵌页失败）：隐藏时间机器、说明原因，三张桌面版截图照常显示。

## Review Focus

1. **暂停、换速、切到别的标签页再回来**：模拟时钟只前进不后退，QuotaDeck 的历史不会因为"时钟回拨"清空；切回来时不会一次跳过几个小时 → Task 6 `pausing and changing speed keeps the estimate`。
2. **协作进行中再点一次（页面按钮或界面里的"开始并行协作"）**：第二次被拒绝，界面显示 QuotaDeck 自己的报错"已有协作任务运行，请等待结束"，第一次照常完成 → Task 4 `a second run while one is running is refused`；Task 6 `the page button stays disabled while a collaboration runs`。
3. **复制来的文件取不到**：隐藏时间机器、说明原因，桌面版截图照常显示 → Task 6 `a blocked QuotaDeck file falls back to the screenshots`。
4. **网页演示绝不读取访客电脑或真实账号**：连接器全部拒绝；没有对站外地址的请求；账号哈希被调用就报错 → Task 2 `every account reader refuses`、`an account scope is refused loudly`；Task 6 `the demo makes no request off the site`。
5. **减少动态效果**：默认暂停在已有耗尽预测的时刻，不播放特效 → Task 6 `reduced motion starts paused with an estimate`。

---

## 文件结构

```
package.json                                  脚本 quotadeck:vendor
.gitattributes                                public/assets/quotadeck/** -text
tools/quotadeck-vendor.mjs                    从 git 记录原样复制 7 个文件、写清单
public/assets/quotadeck/e9557c6/              复制来的文件 + manifest.json（生成）
public/assets/quotadeck/host.html             同源内嵌页（本站自写）
public/assets/quotadeck/host.js               内嵌页脚本：挂桥接、搬入 compact.html 标记、加载 compact.js（本站自写）
src/scripts/qd-load.ts                        在页面里执行原样的主进程代码（替身模块、模拟时钟）
src/scripts/qd-sim.ts                         模拟器：时钟、使用量、大任务、协作状态流程、服务商快照
src/scripts/qd-bridge.ts                      window.quotaDeck（桌面版 preload 的网页版）
src/scripts/qd-timeline.ts                    时间轴与特效画布（原型 p2 的移植）
src/scripts/qd-live-text.ts                   中英文案
src/scripts/qd-live.ts                        控制器
src/components/QuotaLive.astro                演示区标记与样式
src/components/QuotaShots.astro               标题改为"桌面版真实截图"
src/views/QuotaView.astro                     演示区 = QuotaLive + QuotaShots
tests/unit/quotadeck-vendor.test.ts, qd-load.test.ts, qd-sim.test.ts, qd-bridge.test.ts, qd-timeline.test.ts
tests/e2e/quota-live.spec.ts
```

---

### Task 1: 原样复制 QuotaDeck 的界面与额度逻辑

**Files:**
- Create: `tools/quotadeck-vendor.mjs`
- Modify: `package.json`（scripts 加 `"quotadeck:vendor": "node tools/quotadeck-vendor.mjs"`）、`.gitattributes`
- Create（生成）: `public/assets/quotadeck/e9557c6/**`
- Test: `tests/unit/quotadeck-vendor.test.ts`

**Interfaces:**
- Produces: `public/assets/quotadeck/e9557c6/manifest.json` = `{ repository, commit, version, files: [{ path, bytes, sha256 }] }`，`path` 与仓库内路径相同（如 `src/main/quota-history.cjs`）。

- [ ] **Step 1: 写失败的测试 `tests/unit/quotadeck-vendor.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = 'public/assets/quotadeck/e9557c6';
const manifest = () => JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));

describe('vendored QuotaDeck', () => {
  it('is pinned to the public commit and version', () => {
    expect(manifest()).toMatchObject({ repository: 'https://github.com/CHIWAWAFROMkk/quota-deck', commit: 'e9557c62f00a085299e5d3d06e9259ed19688ef8', version: '0.5.0-rc.5' });
  });
  it('carries the tray interface, the quota logic and the licence — nothing else', () => {
    expect(manifest().files.map((f: { path: string }) => f.path)).toEqual(['src/renderer/compact.html', 'src/renderer/compact.css', 'src/renderer/compact.js',
      'src/main/snapshot.cjs', 'src/main/quota-history.cjs', 'src/main/model-guidance.cjs', 'LICENSE']);
  });
  it('every file matches its recorded SHA-256 and size', () => {
    for (const f of manifest().files) {
      const bytes = readFileSync(`${DIR}/${f.path}`);
      expect(createHash('sha256').update(bytes).digest('hex'), f.path).toBe(f.sha256);
      expect(bytes.length, f.path).toBe(f.bytes);
    }
  });
  it('the lines the page quotes (quota-history.cjs 50–61) are still the burn-rate estimate', () => {
    const lines = readFileSync(`${DIR}/src/main/quota-history.cjs`, 'utf8').split('\n');
    expect(lines[49]).toContain('let series = rows.filter(r => r.key === key && r.at >= now - 3600000);');
    expect(lines[56]).toContain('bucket.burnPerHour = (first.value - value) * 100');
    expect(lines[59]).toContain('if (hours !== null && hours < untilReset) bucket.estimatedHoursLeft = hours;');
  });
  it('QuotaDeck still refreshes every minute and samples only Antigravity', () => {
    expect(readFileSync(`${DIR}/src/main/snapshot.cjs`, 'utf8')).toContain("if (history && result.id === 'antigravity') {");
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/quotadeck-vendor.test.ts`
Expected: FAIL，`ENOENT ... manifest.json`。

- [ ] **Step 3: 写 `tools/quotadeck-vendor.mjs`**

```js
// npm run quotadeck:vendor — copies QuotaDeck's tray interface and its quota logic, unmodified, at one public commit.
// Files are read from the git object store (not the working tree), so a local edit can never slip in.
// Usage: QUOTADECK_ROOT=<quota-deck checkout at the commit below> npm run quotadeck:vendor
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const COMMIT = 'e9557c62f00a085299e5d3d06e9259ed19688ef8';
const FILES = ['src/renderer/compact.html', 'src/renderer/compact.css', 'src/renderer/compact.js',
  'src/main/snapshot.cjs', 'src/main/quota-history.cjs', 'src/main/model-guidance.cjs', 'LICENSE'];

const root = process.env.QUOTADECK_ROOT;
if (!root) { console.error('Set QUOTADECK_ROOT to a checkout of https://github.com/CHIWAWAFROMkk/quota-deck'); process.exit(1); }
const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== COMMIT) { console.error(`The checkout is at ${head}; run: git -C "${root}" checkout ${COMMIT}`); process.exit(1); }
const version = JSON.parse(execFileSync('git', ['-C', root, 'show', `${COMMIT}:package.json`], { encoding: 'utf8' })).version;
const out = `public/assets/quotadeck/${COMMIT.slice(0, 7)}`;
const files = FILES.map(path => {
  const bytes = execFileSync('git', ['-C', root, 'show', `${COMMIT}:${path}`], { maxBuffer: 1 << 24 });
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), bytes);
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ repository: 'https://github.com/CHIWAWAFROMkk/quota-deck', commit: COMMIT, version, files }, null, 2) + '\n');
console.log(`${files.length} files → ${out}`);
```

`package.json` 的 scripts 里，在 `"job-agent:vendor"` 之后加 `"quotadeck:vendor": "node tools/quotadeck-vendor.mjs"`。

`.gitattributes` 末尾加一行：`public/assets/quotadeck/** -text`。

- [ ] **Step 4: 运行复制脚本**

Run（PowerShell）: `$env:QUOTADECK_ROOT='C:\Users\yoshi\Documents\ChatGPT\额度显示器'; npm run quotadeck:vendor`
Expected: `7 files → public/assets/quotadeck/e9557c6`。

- [ ] **Step 5: 运行，确认通过**

Run: `npx vitest run tests/unit/quotadeck-vendor.test.ts`
Expected: 5 passed。

- [ ] **Step 6: 提交**

```bash
git add tools/quotadeck-vendor.mjs package.json .gitattributes public/assets/quotadeck/e9557c6 tests/unit/quotadeck-vendor.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "QuotaDeck e9557c6 vendored unmodified: tray UI and quota logic, pinned by SHA-256" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 在页面里执行 QuotaDeck 自己的主进程代码

**Files:**
- Create: `src/scripts/qd-load.ts`
- Test: `tests/unit/qd-load.test.ts`

**Interfaces:**
- Consumes: Task 1 的复制文件。
- Produces:
  - `QD_COMMIT`、`QD_DIR = '/assets/quotadeck/e9557c6/'`、`QD_MAIN`（三个 `.cjs` 的仓库路径）、`HISTORY_FILE = '/quotadeck/quota-history.json'`。
  - `interface Clock { now: number }`。
  - `memoryFs()`：`{ files: Map<string, string>; stat; readFile; writeFile; mkdir; rename }`。
  - `loadQuotaDeck(fetchText: (path: string) => Promise<string>, clock: Clock): Promise<QuotaDeckMain>`，`QuotaDeckMain = { providerToUi, toUiSnapshot, createProviderReader, configureHistory, readProvider, relativeReset, fs }`（前六个是 snapshot.cjs 的原样导出）。

- [ ] **Step 1: 写失败的测试 `tests/unit/qd-load.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadQuotaDeck, QD_DIR, HISTORY_FILE, type Clock } from '../../src/scripts/qd-load';

const H = 3_600_000, M = 60_000;
const T0 = new Date(2026, 9, 5, 9, 0, 0).getTime();
const load = (clock: Clock) => loadQuotaDeck(async p => readFileSync(`public${QD_DIR}${p}`, 'utf8'), clock);
const iso = (ms: number) => new Date(ms).toISOString();
/** An Antigravity snapshot in the shape QuotaDeck's connector normalises to (one shared pool, one 5-hour bucket). */
const agy = (now: number, fraction: number, reset: number, extra: object = {}) => ({
  id: 'antigravity', name: 'Antigravity', status: 'healthy', source: 'Antigravity 本机官方接口', precision: 'provider-reported', updatedAt: iso(now),
  remainingPercent: fraction * 100, groups: [{ displayName: 'Gemini Models', buckets: [{ bucketId: '5h', window: '5h', remainingFraction: fraction, resetTime: iso(reset) }] }],
  models: [], quotaNote: '0 个模型 · 1 个共享额度池', note: '', ...extra,
});

describe('QuotaDeck main-process code, run in the page', () => {
  it('runs its own providerToUi, with relative resets measured on the simulated clock', async () => {
    const clock = { now: T0 }, m = await load(clock);
    const ui = m.providerToUi({ id: 'codex', name: 'Codex', status: 'healthy', precision: 'provider-reported', updatedAt: iso(T0), remainingPercent: 62,
      windows: [{ label: '5 小时', windowDurationMins: 300, remainingPercent: 62, resetsAt: iso(T0 + 2 * H) }],
      models: [{ id: 'a', name: '演示模型 A', pool: 'shared', poolLabel: 'Codex 共享额度' }] });
    expect(ui.quotaHero).toBe('62.0%');
    expect(ui.gauge).toMatchObject({ kind: 'window', provenance: 'live', remainingPercent: 62 });
    expect(ui.models[0].reset).toBe('2h 后重置');
    clock.now = T0 + 90 * M;
    expect(m.relativeReset(iso(T0 + 2 * H))).toBe('30m 后重置');
  });
  it('every account reader refuses; nothing reads the visitor\'s machine', async () => {
    const m = await load({ now: T0 });
    for (const id of ['codex', 'claude', 'antigravity', 'deepseek', 'workbuddy']) expect((await m.readProvider(id)).status, id).toBe('error');
  });
  it('samples Antigravity with its own history and estimates the burn under the simulated clock', async () => {
    const clock = { now: T0 }, m = await load(clock), reset = T0 + 6 * H;
    m.configureHistory(HISTORY_FILE);
    let value = 0.6, p: any;
    const read = m.createProviderReader({ antigravity: async () => agy(clock.now, value, reset) });
    for (let k = 0; k < 7; k++) { clock.now = T0 + k * M; value = 0.6 - k * 0.002; p = await read('antigravity'); }
    const b = p.groups[0].buckets[0];
    expect(b.burnPerHour).toBeCloseTo((0.6 - 0.588) * 100 / 0.1, 9);
    expect(b.estimatedHoursLeft).toBeCloseTo(58.8 / b.burnPerHour, 9);
    expect(JSON.parse(m.fs.files.get(HISTORY_FILE)!)).toHaveLength(7);
  });
  it('an account scope is refused loudly instead of being hashed', async () => {
    const clock = { now: T0 }, m = await load(clock);
    m.configureHistory(HISTORY_FILE);
    const read = m.createProviderReader({ antigravity: async () => agy(T0, 0.5, T0 + H, { historyScope: 'someone@example.com' }) });
    expect((await read('antigravity')).historyWarning).toBe('历史记录保存失败，消耗趋势暂不可用');
  });
  it('toUiSnapshot stamps the simulated time', async () => {
    const m = await load({ now: T0 });
    expect(m.toUiSnapshot({ updatedAt: iso(T0), providers: [] }).lastUpdated).toBe('09:00');
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/qd-load.test.ts`
Expected: FAIL，找不到模块 `qd-load`。

- [ ] **Step 3: 写 `src/scripts/qd-load.ts`**

```ts
/** QuotaDeck's own main-process code (vendored unmodified at e9557c6), run in the page. snapshot.cjs turns provider
 *  snapshots into what the tray UI draws; quota-history.cjs samples Antigravity and estimates its burn rate. The files
 *  are CommonJS written for Node: this loader evaluates them with the few Node modules they use replaced by browser
 *  stand-ins and with a Date whose now() is the simulated clock. Every account reader is replaced by one that refuses,
 *  and the local-agent check (orchestrator.cjs) is never loaded, so no code path here can read the visitor's machine. */
export const QD_COMMIT = 'e9557c62f00a085299e5d3d06e9259ed19688ef8';
export const QD_DIR = `/assets/quotadeck/${QD_COMMIT.slice(0, 7)}/`;
export const QD_MAIN = ['src/main/snapshot.cjs', 'src/main/quota-history.cjs', 'src/main/model-guidance.cjs'];
/** Where quota-history.cjs keeps its samples (in memory; nothing is stored in the browser). */
export const HISTORY_FILE = '/quotadeck/quota-history.json';

export interface Clock { now: number }

/** The part of node:fs/promises quota-history.cjs uses, kept in a Map. */
export function memoryFs() {
  const files = new Map<string, string>();
  const missing = (p: string) => Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' });
  return {
    files,
    async stat(p: string) { if (!files.has(p)) throw missing(p); return { size: files.get(p)!.length }; },
    async readFile(p: string) { if (!files.has(p)) throw missing(p); return files.get(p)!; },
    async writeFile(p: string, data: string) { files.set(p, String(data)); },
    async mkdir() { /* directories are implicit */ },
    async rename(from: string, to: string) { if (!files.has(from)) throw missing(from); files.set(to, files.get(from)!); files.delete(from); },
  };
}
const pathShim = {
  resolve: (p: string) => (p.startsWith('/') ? p : `/${p}`),
  dirname: (p: string) => p.slice(0, p.lastIndexOf('/')) || '/',
};
const cryptoShim = {
  randomUUID: () => globalThis.crypto.randomUUID(),
  // Only an explicit account scope is hashed; the demo never passes one, so reaching this is a bug worth hearing about.
  createHash() { throw new Error('网页演示从不传入账号范围，不计算账号哈希'); },
};
const refuse = (who: string) => async () => { throw new Error(`${who}：网页演示不读取本机账号`); };
const STUBS: Record<string, unknown> = {
  './codex-client.cjs': { readCodexSnapshot: refuse('Codex') },
  './deepseek-client.cjs': { readDeepSeekSnapshot: refuse('DeepSeek') },
  './workbuddy-client.cjs': { readWorkBuddySnapshot: refuse('WorkBuddy') },
  './antigravity-client.cjs': { readAntigravitySnapshot: refuse('Antigravity') },
  './claude-client.cjs': { readClaudeSnapshot: refuse('Claude Code') },
  './orchestrator.cjs': { localAgentAvailability: () => ({ codex: false, claude: false, antigravity: false, workbuddy: false }) },
};

export interface QuotaDeckMain {
  providerToUi: (provider: object) => any;
  toUiSnapshot: (snapshot: { updatedAt: string; providers: object[] }) => any;
  createProviderReader: (readers: Record<string, () => Promise<object>>) => (id: string) => Promise<any>;
  configureHistory: (file: string) => void;
  readProvider: (id: string) => Promise<any>;
  relativeReset: (value: string | null) => string;
  fs: ReturnType<typeof memoryFs>;
}

export async function loadQuotaDeck(fetchText: (path: string) => Promise<string>, clock: Clock): Promise<QuotaDeckMain> {
  const sources = new Map<string, string>(await Promise.all(QD_MAIN.map(async p => [`./${p.slice(p.lastIndexOf('/') + 1)}`, await fetchText(p)] as [string, string])));
  const fs = memoryFs();
  const SimDate = class extends Date { static now() { return clock.now; } } as DateConstructor;
  const proc = { platform: 'browser', pid: 1, env: {} };
  const node: Record<string, unknown> = { 'node:fs/promises': fs, 'node:path': pathShim, 'node:crypto': cryptoShim };
  const loaded = new Map<string, { exports: any }>();
  const require = (spec: string): any => {
    if (spec in node) return node[spec];
    if (spec in STUBS) return STUBS[spec];
    const source = sources.get(spec);
    if (source === undefined) throw new Error(`网页演示没有提供模块 ${spec}`);
    if (!loaded.has(spec)) {
      const module = { exports: {} as any };
      loaded.set(spec, module);
      new Function('require', 'module', 'exports', 'process', 'Date', `${source}\n//# sourceURL=quotadeck/${spec.slice(2)}`)(require, module, module.exports, proc, SimDate);
    }
    return loaded.get(spec)!.exports;
  };
  const { providerToUi, toUiSnapshot, createProviderReader, configureHistory, readProvider, relativeReset } = require('./snapshot.cjs');
  return { providerToUi, toUiSnapshot, createProviderReader, configureHistory, readProvider, relativeReset, fs };
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/qd-load.test.ts`
Expected: 5 passed。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/qd-load.ts tests/unit/qd-load.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "QuotaDeck's own snapshot and quota-history code runs in the page, on a simulated clock, with every account reader refusing" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 模拟器

**Files:**
- Create: `src/scripts/qd-sim.ts`
- Test: `tests/unit/qd-sim.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `loadQuotaDeck`、`HISTORY_FILE`（测试里）。
- Produces:
  - 常量 `H`、`M`、`D`、`WIN`（5 小时）、`REFRESH`（60 000）、`BIG_TASK`（24）、`SPEEDS = [1, 60, 600]`、`START`（本地时间 2026-10-05 09:00）、`PROVIDER_IDS`（`['codex', 'claude', 'antigravity', 'deepseek', 'workbuddy']`，与 snapshot.cjs `readAll` 同序）、`DEMO_OUTPUT`。
  - `type LaneId = 'codex' | 'claude' | 'antigravity'`；`interface Lane { id; name; rem; burn; mean; amp; seed; past; reset; drop; agent; hist: { t: number; v: number }[] }`；`interface ResetMark { t: number; id: LaneId }`。
  - `createSim(start?): Sim`，`Sim = { t; lanes: Lane[]; marks: ResetMark[]; balance: number; step(dtSim: number, dtReal: number): LaneId[]; bigTask(): void; raw(id: string): object }`。
  - `codexRaw`、`claudeRaw`、`antigravityRaw`、`deepseekRaw(balance, now)`、`workbuddyRaw(start)`。
  - `AGENT_FLOW`（四个 Agent 的开始与运行秒数）、`type AgentId`、`type AgentPhase = 'queue' | 'run' | 'done'`、`agentPhase(id, elapsedSeconds)`、`collabEnd(agents): number`（秒）、`collabResult(task, agents, completedAt)`。

- [ ] **Step 1: 写失败的测试 `tests/unit/qd-sim.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { loadQuotaDeck, QD_DIR, HISTORY_FILE } from '../../src/scripts/qd-load';
import {
  H, M, WIN, REFRESH, BIG_TASK, START, PROVIDER_IDS, DEMO_OUTPUT, createSim, claudeRaw, antigravityRaw,
  agentPhase, collabEnd, collabResult,
} from '../../src/scripts/qd-sim';

const ROOT = process.env.QUOTADECK_ROOT ?? 'C:/Users/yoshi/Documents/ChatGPT/额度显示器';
const load = (clock: { now: number }) => loadQuotaDeck(async p => readFileSync(`public${QD_DIR}${p}`, 'utf8'), clock);

describe('the clock and the usage model', () => {
  it('drains, then resets a lane to 100 when its window ends, and marks the reset', () => {
    const sim = createSim();
    const claude = sim.lanes.find(l => l.id === 'claude')!, at = claude.reset;
    const seen: string[] = [];
    while (sim.t < at + M) seen.push(...sim.step(20_000, 0));
    expect(seen).toContain('claude');
    expect(claude.reset).toBe(at + WIN);
    expect(claude.rem).toBeGreaterThan(99);
    expect(sim.marks.some(m => m.id === 'claude' && m.t >= at)).toBe(true);
  });
  it('a big task takes 24 points from Codex over a moment of real time', () => {
    const sim = createSim(), codex = sim.lanes[0], before = codex.rem;
    sim.bigTask();
    for (let k = 0; k < 60; k++) sim.step(10, 16);           // about a second of real time, 0.6 s of simulated time
    expect(before - codex.rem).toBeGreaterThan(BIG_TASK - 0.5);
    expect(before - codex.rem).toBeLessThan(BIG_TASK + 0.5);
  });
  it('seeds ten hours of history so the timeline is never empty', () => {
    const sim = createSim();
    for (const l of sim.lanes) expect(l.hist[0].t).toBeLessThanOrEqual(START - 10 * H);
  });
  it('builds a snapshot for every provider QuotaDeck reads, in its order', () => {
    const sim = createSim();
    expect(PROVIDER_IDS.map(id => (sim.raw(id) as { id: string }).id)).toEqual(['codex', 'claude', 'antigravity', 'deepseek', 'workbuddy']);
  });
});

describe('the collaboration state flow', () => {
  it('each agent queues, runs, then is done; the run ends when the slowest agent does', () => {
    expect([agentPhase('codex', 0.2), agentPhase('codex', 1), agentPhase('codex', 3.2)]).toEqual(['queue', 'run', 'done']);
    expect(collabEnd(['codex', 'claude', 'antigravity', 'workbuddy'])).toBeCloseTo(5.7, 9);
    expect(collabEnd(['codex', 'workbuddy'])).toBeCloseTo(3.9, 9);
  });
  it('the result has the orchestrator\'s shape and no invented answer', () => {
    const r = collabResult(' 任务 ', ['codex', 'claude'], START);
    expect(r).toEqual({ task: '任务', completedAt: new Date(START).toISOString(), results: [
      { id: 'codex', output: DEMO_OUTPUT, status: 'done' }, { id: 'claude', output: DEMO_OUTPUT, status: 'done' }] });
    expect(DEMO_OUTPUT).toContain('没有调用真实 Agent');
  });
});

describe('snapshots in the exact shape of QuotaDeck\'s own connectors', () => {
  const real = existsSync(join(ROOT, 'src/main/claude-client.cjs'));
  it.skipIf(!real)('Claude Code: equals normalizeClaudeSnapshot(sanitizeClaudePayload(statusLine))', () => {
    const require = createRequire(join(ROOT, 'package.json'));
    const { sanitizeClaudePayload, normalizeClaudeSnapshot } = require('./src/main/claude-client.cjs');
    const sim = createSim(), lane = sim.lanes[1], now = sim.t;
    const statusLine = { model: { id: 'demo', display_name: '演示模型（非真实数据）' }, rate_limits: { five_hour: { used_percentage: 100 - lane.rem, resets_at: lane.reset / 1000 } } };
    expect(claudeRaw(lane, now)).toEqual(normalizeClaudeSnapshot(sanitizeClaudePayload(statusLine, now), now));
  });
  it.skipIf(!real)('Antigravity: equals normalizeAntigravitySnapshot for one pool and two Gemini-family models', () => {
    const require = createRequire(join(ROOT, 'package.json'));
    const { normalizeAntigravitySnapshot } = require('./src/main/antigravity-client.cjs');
    const sim = createSim(), lane = sim.lanes[2], now = sim.t;
    const response = { groups: [{ displayName: 'Gemini Models', buckets: [{ bucketId: '5h', window: '5h', remainingFraction: lane.rem / 100, resetTime: new Date(lane.reset).toISOString() }] }] };
    const models = [{ id: 'gemini-demo-1', name: '演示模型 G1' }, { id: 'gemini-demo-2', name: '演示模型 G2' }];
    expect(antigravityRaw(lane, now)).toEqual(normalizeAntigravitySnapshot(response, models, new Date(now).toISOString()));
  });
});

describe('end to end with QuotaDeck\'s own code', () => {
  it('its history turns the simulated samples into the burn rate and estimate of lines 50–61', async () => {
    const sim = createSim(), clock = { now: sim.t }, m = await load(clock);
    m.configureHistory(HISTORY_FILE);
    const read = m.createProviderReader({ antigravity: async () => sim.raw('antigravity') });
    let p: any;
    for (let k = 0; k < 20; k++) { sim.step(REFRESH, 0); clock.now = sim.t; p = await read('antigravity'); }
    const b = p.groups[0].buckets[0], rows = JSON.parse(m.fs.files.get(HISTORY_FILE)!);
    const first = rows[0], last = rows.at(-1);
    expect(rows).toHaveLength(20);
    expect(b.burnPerHour).toBeCloseTo((first.value - last.value) * 100 / ((last.at - first.at) / H), 9);
    expect(b.estimatedHoursLeft).toBeCloseTo(last.value * 100 / b.burnPerHour, 9);
  });
  it('every provider snapshot goes through providerToUi without an unknown or NaN', async () => {
    const sim = createSim(), m = await load({ now: sim.t });
    const ui = m.toUiSnapshot({ updatedAt: new Date(sim.t).toISOString(), providers: PROVIDER_IDS.map(id => sim.raw(id)) });
    expect(JSON.stringify(ui)).not.toMatch(/NaN|undefined|未知数据源/);
    expect(ui.providers.map((p: any) => p.status)).toEqual(['healthy', 'healthy', 'healthy', 'healthy', 'stale']);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/qd-sim.test.ts`
Expected: FAIL，找不到模块 `qd-sim`。

- [ ] **Step 3: 写 `src/scripts/qd-sim.ts`**

```ts
/** The time machine's simulator: a clock, a usage model, a big task and the collaboration's state flow — the only
 *  invented parts of the QuotaDeck demo. It produces provider snapshots in the exact shape QuotaDeck's own connectors
 *  normalise to (the tests compare them with the real normalisers); everything after that is QuotaDeck's own code. */
export const H = 3_600_000, M = 60_000, D = 24 * H, WIN = 5 * H;
/** QuotaDeck refreshes every minute (src/main/main.cjs line 157). */
export const REFRESH = 60_000;
export const BIG_TASK = 24;
export const SPEEDS = [1, 60, 600] as const;
export const START = new Date(2026, 9, 5, 9, 0, 0).getTime();
/** The providers snapshot.cjs readAll() reads, in its order. */
export const PROVIDER_IDS = ['codex', 'claude', 'antigravity', 'deepseek', 'workbuddy'] as const;
export const DEMO_OUTPUT = '网页演示：状态流程与额度变化为模拟，没有调用真实 Agent，也没有生成任何回答。桌面版里，这里是该 Agent 的独立成果。';

export type LaneId = 'codex' | 'claude' | 'antigravity';
export interface Lane {
  id: LaneId; name: string; rem: number; burn: number; mean: number; amp: number; seed: number; past: number;
  reset: number; drop: number; agent: boolean; hist: { t: number; v: number }[];
}
export interface ResetMark { t: number; id: LaneId }
export interface Sim {
  t: number; lanes: Lane[]; marks: ResetMark[]; balance: number;
  /** Advances the simulated clock by dtSim (dtReal paces the big task and agent load); returns the lanes that reset. */
  step(dtSim: number, dtReal: number): LaneId[];
  bigTask(): void;
  raw(id: string): object;
}

const noise = (x: number, l: Lane) => l.mean + l.amp * (Math.sin(x / (37 * M) + l.seed) * 0.6 + Math.sin(x / (11 * M) + l.seed * 2) * 0.4);
const health = (p: number) => (p <= 10 ? 'critical' : p <= 30 ? 'low' : 'healthy');
const iso = (ms: number) => new Date(ms).toISOString();
const shared = (poolLabel: string) => (name: string) => ({ id: name, name, pool: 'shared', poolLabel });

/** Ten-plus hours of past usage for the timeline: earlier windows drain and reset; the current one ends on rem. */
function seedHistory(l: Lane, t: number) {
  const step = 2 * M, from = t - 13.5 * H, ws = l.reset - WIN, pts: { t: number; v: number }[] = [];
  let w = ws; while (w > from) w -= WIN;
  for (; w < ws; w += WIN) {
    let v = 100;
    for (let x = w; x < w + WIN; x += step) { if (x >= from) pts.push({ t: x, v }); v = Math.max(0, v - l.burn * l.past * noise(x, l) * step / H); }
  }
  const acc: [number, number][] = []; let a = 0;
  for (let x = ws; x < t; x += step) { acc.push([x, a]); a += noise(x, l) * step; }
  for (const [x, s] of acc) if (x >= from) pts.push({ t: x, v: 100 - (100 - l.rem) * s / a });
  pts.push({ t, v: l.rem });
  l.hist = pts;
}

export function createSim(start = START): Sim {
  const lane = (id: LaneId, name: string, rem: number, burn: number, mean: number, amp: number, seed: number, past: number, resetIn: number): Lane =>
    ({ id, name, rem, burn, mean, amp, seed, past, reset: start + resetIn, drop: 0, agent: false, hist: [] });
  const lanes = [
    lane('codex', 'Codex', 74, 12, 0.55, 0.45, 12, 1.7, 2.4 * H),
    lane('claude', 'Claude Code', 61, 8, 0.55, 0.45, 8, 1.9, 1.3 * H),
    lane('antigravity', 'Antigravity', 52, 24, 0.9, 0.1, 24, 1, 2.8 * H),
  ];
  lanes.forEach(l => seedHistory(l, start));
  const sim: Sim = {
    t: start, lanes, marks: [], balance: 42.6,
    step(dt, dtReal) {
      sim.t += dt;
      const t = sim.t, resets: LaneId[] = [];
      for (const l of lanes) {
        let d = l.burn * noise(t, l) * dt / H;
        if (l.drop > 0) { const k = Math.min(l.drop, BIG_TASK / 700 * dtReal); l.drop -= k; d += k; }
        if (l.agent) d += 5 * dtReal / 1000;                   // an agent at work: five points a second, at any speed
        l.rem = Math.max(0, l.rem - d);
        if (t >= l.reset) {
          l.hist.push({ t, v: l.rem }, { t, v: 100 });
          sim.marks.push({ t, id: l.id });
          l.rem = 100; l.reset += WIN; l.drop = 0; resets.push(l.id);
        }
        const last = l.hist[l.hist.length - 1];
        if (t - last.t >= 2 * M || Math.abs(l.rem - last.v) >= 1.5) l.hist.push({ t, v: l.rem });
        while (l.hist.length > 2 && l.hist[1].t < t - 13.5 * H) l.hist.shift();
      }
      while (sim.marks.length && sim.marks[0].t < t - 11 * H) sim.marks.shift();
      sim.balance = Math.max(0, sim.balance - 0.42 * dt / H);
      return resets;
    },
    bigTask() { lanes[0].drop += BIG_TASK; },
    raw(id) {
      const [codex, claude, agy] = lanes;
      switch (id) {
        case 'codex': return codexRaw(codex, sim.t);
        case 'claude': return claudeRaw(claude, sim.t);
        case 'antigravity': return antigravityRaw(agy, sim.t);
        case 'deepseek': return deepseekRaw(sim.balance, sim.t);
        case 'workbuddy': return workbuddyRaw(start);
        default: throw new Error(`未知数据源 ${id}`);
      }
    },
  };
  return sim;
}

export function codexRaw(l: Lane, now: number) {
  return {
    id: 'codex', name: 'Codex', status: health(l.rem), precision: 'provider-reported', source: 'Codex 官方额度窗口', updatedAt: iso(now),
    remainingPercent: l.rem, windows: [{ label: '5 小时', windowDurationMins: 300, remainingPercent: l.rem, resetsAt: iso(l.reset) }],
    models: ['演示模型 A', '演示模型 B', '演示模型 C'].map(shared('Codex 共享额度')),
  };
}

const CLAUDE_NOTE = '仅列 statusLine 当前会话观测到的模型，不代表完整可选目录。接收时间不是独立查询时间；超过 5 分钟标记旧数据。缺失额度可能尚未产生首个响应，或登录类型不提供订阅窗口。';
/** normalizeClaudeSnapshot(sanitizeClaudePayload(statusLine), now) for a fresh statusLine report of the 5-hour window. */
export function claudeRaw(l: Lane, now: number) {
  const used = 100 - l.rem, remaining = Math.max(0, 100 - used), resetsAt = iso(l.reset), name = 'Claude 订阅共享额度';
  const windows = [{ id: 'five_hour', label: '5 小时', remainingPercent: remaining, resetsAt }];
  return {
    id: 'claude', name: 'Claude Code', precision: 'provider-reported', status: health(remaining), updatedAt: iso(now),
    source: 'Claude Code 官方 statusLine', remainingPercent: remaining, windows,
    models: [{ id: 'demo', name: '演示模型（非真实数据）', pool: 'shared', poolLabel: name, windows, remainingPercent: remaining, source: 'Claude Code statusLine 当前会话观测' }],
    groups: [{ displayName: name, buckets: [{ bucketId: 'five_hour', label: '5 小时', window: '5h', remainingFraction: remaining / 100, resetTime: resetsAt }] }],
    quotaNote: '订阅窗口 · 当前会话观测', note: CLAUDE_NOTE,
  };
}

const AGY_NOTE = '同组模型共享额度；家族映射为本地兼容规则，未知模型不猜测归属。消耗速度是共享池采样估算，非单模型用量。';
/** normalizeAntigravitySnapshot for the "Gemini Models" pool with one 5-hour bucket and two Gemini-family models. */
export function antigravityRaw(l: Lane, now: number) {
  const fraction = l.rem / 100, resetTime = iso(l.reset), source = 'Antigravity 本机官方接口';
  const windows = [{ id: '5h', label: '5 小时', window: '5h', remainingPercent: fraction * 100, resetsAt: resetTime }];
  const models = [['gemini-demo-1', '演示模型 G1'], ['gemini-demo-2', '演示模型 G2']].map(([id, name]) => ({
    id, name, pool: 'shared', poolLabel: 'Gemini Models', source, windows, remainingPercent: fraction * 100,
    quotaLabel: `5 小时 ${(fraction * 100).toFixed(1)}%`,
  }));
  return {
    id: 'antigravity', name: 'Antigravity', status: health(fraction * 100), source, precision: 'provider-reported', updatedAt: iso(now),
    remainingPercent: fraction * 100,
    groups: [{ displayName: 'Gemini Models', description: undefined, buckets: [{ bucketId: '5h', window: '5h', remainingFraction: fraction, resetTime }] }],
    models, quotaNote: `${models.length} 个模型 · 1 个共享额度池`, note: AGY_NOTE,
  };
}

export function deepseekRaw(balance: number, now: number) {
  return {
    id: 'deepseek', name: 'DeepSeek', status: 'healthy', precision: 'provider-reported', updatedAt: iso(now),
    balances: [{ currency: 'CNY', total_balance: balance.toFixed(2) }], models: ['演示对话模型', '演示推理模型'].map(shared('DeepSeek 账户余额')),
  };
}
/** WorkBuddy is read from a web snapshot, here three hours old: QuotaDeck shows it as stale. */
export function workbuddyRaw(start: number) {
  return {
    id: 'workbuddy', name: 'WorkBuddy', status: 'healthy', precision: 'browser-snapshot', updatedAt: iso(start - 3 * H),
    remainingCredits: 1260, totalCredits: 2000,
    models: ([['演示模型 W1', 0.5], ['演示模型 W2', 1], ['演示模型 W3', 2]] as const).map(([name, consumeMultiplier]) => ({ id: name, name, pool: 'shared', consumeMultiplier })),
  };
}

/** Parallel collaboration, staggered in real time (queued → running → done). No agent is called. */
export const AGENT_FLOW = [
  { id: 'codex', name: 'Codex', start: 0.5, run: 2.6 },
  { id: 'claude', name: 'Claude Code', start: 0.9, run: 4.8 },
  { id: 'antigravity', name: 'Antigravity', start: 1.3, run: 3.3 },
  { id: 'workbuddy', name: 'WorkBuddy', start: 1.7, run: 2.2 },
] as const;
export type AgentId = (typeof AGENT_FLOW)[number]['id'];
export type AgentPhase = 'queue' | 'run' | 'done';
export function agentPhase(id: AgentId, elapsed: number): AgentPhase {
  const a = AGENT_FLOW.find(x => x.id === id)!;
  return elapsed < a.start ? 'queue' : elapsed < a.start + a.run ? 'run' : 'done';
}
export function collabEnd(agents: readonly AgentId[]): number {
  return Math.max(0, ...AGENT_FLOW.filter(a => agents.includes(a.id)).map(a => a.start + a.run));
}
/** What runCollaboration resolves to, in the orchestrator's shape (src/main/orchestrator.cjs runCollaboration). */
export function collabResult(task: string, agents: readonly AgentId[], completedAt: number) {
  return { task: task.trim(), completedAt: iso(completedAt), results: agents.map(id => ({ id, output: DEMO_OUTPUT, status: 'done' as const })) };
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/qd-sim.test.ts`
Expected: 10 passed（两条比对测试在本机能找到 QuotaDeck 仓库时运行）。如果比对测试失败，按真实规范化函数的输出改模拟器的快照构造函数，不改测试。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/qd-sim.ts tests/unit/qd-sim.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "QuotaDeck simulator: clock, usage, big task and collaboration flow; snapshots match its own normalisers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 桥接与界面宿主

**Files:**
- Create: `src/scripts/qd-bridge.ts`
- Create: `public/assets/quotadeck/host.html`、`public/assets/quotadeck/host.js`
- Test: `tests/unit/qd-bridge.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `AgentId`、`AGENT_FLOW`、`collabEnd`、`collabResult`。
- Produces:
  - `interface CollabState { running: boolean; result: ReturnType<typeof collabResult> | null; error: string | null }`。
  - `createBridge(host: BridgeHost, version: string)` → `{ api: QuotaDeckApi; push(snapshot): void; state(): CollabState }`；`BridgeHost = { refresh(): Promise<any>; startCollab(agents: AgentId[]): void; simNow(): number }`。`api` 提供 `refreshAll`、`openSettings`、`runCollaboration`、`collaborationState`、`onCollaborationState`、`onSnapshot`，其余桌面专属方法不提供。
  - 内嵌页约定：父页面先设 `window.__quotaDeckBridge = api`，再设 iframe 的 `src = '/assets/quotadeck/host.html'`；内嵌页取 `parent.__quotaDeckBridge`。内嵌页加载失败时调用 `parent.__quotaDeckFailed?.(message)`。

- [ ] **Step 1: 写失败的测试 `tests/unit/qd-bridge.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createBridge } from '../../src/scripts/qd-bridge';
import { DEMO_OUTPUT, START } from '../../src/scripts/qd-sim';

afterEach(() => { vi.useRealTimers(); });
function setup() {
  const started: string[][] = [];
  const b = createBridge({ refresh: async () => ({ lastUpdated: '09:00', providers: [] }), startCollab: a => started.push(a), simNow: () => START }, '0.5.0-rc.5');
  return { b, started };
}

describe('window.quotaDeck for the hosted tray UI', () => {
  it('offers what the web demo can answer and leaves desktop-only actions out', () => {
    const { b } = setup();
    expect(Object.keys(b.api).sort()).toEqual(['collaborationState', 'onCollaborationState', 'onSnapshot', 'openSettings', 'refreshAll', 'runCollaboration']);
  });
  it('pushes every refresh to the UI, as quota:snapshot does', () => {
    const { b } = setup(), seen: unknown[] = [];
    const off = b.api.onSnapshot(s => seen.push(s));
    b.push({ n: 1 }); off(); b.push({ n: 2 });
    expect(seen).toEqual([{ n: 1 }]);
  });
  it('a collaboration runs through running → done and returns no invented answer', async () => {
    vi.useFakeTimers();
    const { b, started } = setup(), states: boolean[] = [];
    b.api.onCollaborationState(s => states.push(s.running));
    const run = b.api.runCollaboration({ task: '分析需求', agents: ['codex', 'claude', 'nobody'] });
    expect(started).toEqual([['codex', 'claude']]);
    await vi.advanceTimersByTimeAsync(5_800);
    const r = await run;
    expect(states).toEqual([true, false]);
    expect(r.results.map(x => [x.id, x.status, x.output])).toEqual([['codex', 'done', DEMO_OUTPUT], ['claude', 'done', DEMO_OUTPUT]]);
    expect((await b.api.collaborationState()).result).toEqual(r);
  });
  it('a second run while one is running is refused with QuotaDeck\'s own message', async () => {
    vi.useFakeTimers();
    const { b } = setup();
    const first = b.api.runCollaboration({ task: '一', agents: ['codex', 'claude'] });
    await expect(b.api.runCollaboration({ task: '二', agents: ['codex', 'claude'] })).rejects.toThrow('已有协作任务运行，请等待结束');
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(first).resolves.toMatchObject({ task: '一' });
  });
  it('the about box names the version and says where the data lives', async () => {
    const { b } = setup();
    expect(await b.api.openSettings()).toEqual({ status: 'available', version: '0.5.0-rc.5（网页演示）', dataLocation: '浏览器内存（网页演示，不保存）' });
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/qd-bridge.test.ts`
Expected: FAIL，找不到模块 `qd-bridge`。

- [ ] **Step 3: 写 `src/scripts/qd-bridge.ts`**

```ts
import { AGENT_FLOW, collabEnd, collabResult, type AgentId } from './qd-sim';

export interface CollabState { running: boolean; result: ReturnType<typeof collabResult> | null; error: string | null }
export interface BridgeHost {
  /** Re-reads every provider at the current simulated time and returns the UI snapshot (QuotaDeck's refreshAll). */
  refresh(): Promise<any>;
  startCollab(agents: AgentId[]): void;
  simNow(): number;
}
const AGENT_IDS: readonly string[] = AGENT_FLOW.map(a => a.id);

/** window.quotaDeck for the hosted tray UI: the desktop app's preload API (src/main/preload.cjs), answered by the page.
 *  Desktop-only actions — the tray, the Claude statusLine hook-up, the WorkBuddy login, the help file — are left out, so
 *  the UI shows its own "use the desktop app" messages instead of pretending. */
export function createBridge(host: BridgeHost, version: string) {
  const snapshots = new Set<(s: any) => void>(), collabs = new Set<(s: CollabState) => void>();
  let state: CollabState = { running: false, result: null, error: null };
  const notify = () => collabs.forEach(cb => cb(state));
  const api = {
    refreshAll: () => host.refresh(),
    openSettings: async () => ({ status: 'available', version: `${version}（网页演示）`, dataLocation: '浏览器内存（网页演示，不保存）' }),
    // The flow of the desktop app's collab:run handler (src/main/main.cjs), with the agents' work replaced by the demo.
    runCollaboration: async (request: { task: string; agents: string[] }) => {
      if (state.running) throw new Error('已有协作任务运行，请等待结束');
      const agents = [...new Set(request.agents.filter(id => AGENT_IDS.includes(id)))] as AgentId[];
      state = { running: true, result: null, error: null }; notify();
      host.startCollab(agents);
      await new Promise(resolve => setTimeout(resolve, collabEnd(agents) * 1000));
      const result = collabResult(String(request.task), agents, host.simNow());
      state = { running: false, result, error: null }; notify();
      return result;
    },
    collaborationState: async () => state,
    onCollaborationState: (cb: (s: CollabState) => void) => { collabs.add(cb); return () => { collabs.delete(cb); }; },
    onSnapshot: (cb: (s: any) => void) => { snapshots.add(cb); return () => { snapshots.delete(cb); }; },
  };
  return { api, push(snapshot: any) { snapshots.forEach(cb => cb(snapshot)); }, state: () => state };
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/qd-bridge.test.ts`
Expected: 5 passed。

- [ ] **Step 5: 写内嵌页 `public/assets/quotadeck/host.html`**

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=520">
<title>QuotaDeck · 网页演示</title>
<base href="/assets/quotadeck/e9557c6/src/renderer/">
</head>
<body>
<script src="/assets/quotadeck/host.js"></script>
</body>
</html>
```

- [ ] **Step 6: 写 `public/assets/quotadeck/host.js`**

```js
// Hosts QuotaDeck's tray UI exactly as published: points window.quotaDeck at the bridge the portfolio page provides,
// copies compact.html's stylesheet link and body (its script tag excluded) into this document, then runs compact.js.
(async () => {
  const bridge = parent !== window ? parent.__quotaDeckBridge : null;
  if (!bridge) { document.body.textContent = 'QuotaDeck 网页演示需要在作品集页面里打开。'; return; }
  window.quotaDeck = bridge;
  const response = await fetch('compact.html');
  if (!response.ok) throw new Error(`compact.html: HTTP ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  for (const link of doc.querySelectorAll('link[rel="stylesheet"]')) {
    const el = document.importNode(link, true);
    el.onerror = () => parent.__quotaDeckFailed?.(`${link.getAttribute('href')}: failed to load`);
    document.head.append(el);
  }
  for (const node of [...doc.body.childNodes]) if (node.nodeName !== 'SCRIPT') document.body.append(document.importNode(node, true));
  const script = document.createElement('script');
  script.src = doc.querySelector('script[src]').getAttribute('src');
  script.onerror = () => parent.__quotaDeckFailed?.('compact.js');
  document.body.append(script);
})().catch(error => parent.__quotaDeckFailed?.(String(error && error.message || error)));
```

- [ ] **Step 7: 提交**

```bash
git add src/scripts/qd-bridge.ts tests/unit/qd-bridge.test.ts public/assets/quotadeck/host.html public/assets/quotadeck/host.js
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "QuotaDeck bridge and host: the desktop preload API answered by the page; the tray UI loaded as published" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

（内嵌页在 Task 6 的端到端测试里验证。）

---

### Task 5: 时间轴与特效画布

**Files:**
- Create: `src/scripts/qd-timeline.ts`
- Test: `tests/unit/qd-timeline.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `H`、`M`、`D`、`Lane`、`LaneId`、`ResetMark`、`AGENT_FLOW`、`AgentId`、`agentPhase`、`collabEnd`。
- Produces:
  - 纯函数 `hhmm(ms)`（本地时间 HH:MM）、`countdown(hoursLeft, at, now)`、`midnight(ms)`。
  - `interface TlText { title; sub; range; dashes; night; reset; nextReset; window; now; resetTo(name); exhaust(h); noExhaust; exhausted; status: Record<'queue' | 'run' | 'done', string>; bigTask; wbNote }`。
  - `interface TmState { t; lanes: Lane[]; marks: ResetMark[]; samples: { at: number; value: number }[]; estimate: { at: number; value: number; burn: number | null; hoursLeft: number | null; resetAt: number } | null; collab: { at: number; agents: AgentId[] } | null }`——`samples`、`estimate` 来自 QuotaDeck 自己的历史文件和输出。
  - `createTimeMachine(body, tl, fx, text, o: { reduced; light; anchor(): { right: number; rows: Partial<Record<AgentId, number>> } | null; onHit(): void })` → `{ layout(): void; draw(s: TmState, now: number): void; sweep(lane: Lane, t: number): void; shock(lane: Lane, now: number): void }`。

- [ ] **Step 1: 写失败的测试 `tests/unit/qd-timeline.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { hhmm, countdown, midnight } from '../../src/scripts/qd-timeline';

const H = 3_600_000;
describe('time machine helpers', () => {
  it('formats the simulated clock in local time', () => {
    expect(hhmm(new Date(2026, 9, 5, 9, 0).getTime())).toBe('09:00');
    expect(hhmm(new Date(2026, 9, 5, 23, 59).getTime())).toBe('23:59');
  });
  it('counts down from QuotaDeck\'s estimate: equal to it at the sample, never below zero', () => {
    const at = new Date(2026, 9, 5, 10, 0).getTime();
    expect(countdown(3.25, at, at)).toBe(3.25);
    expect(countdown(3.25, at, at + H)).toBeCloseTo(2.25, 9);
    expect(countdown(0.5, at, at + H)).toBe(0);
  });
  it('finds local midnight for the day/night bands', () => {
    expect(midnight(new Date(2026, 9, 5, 15, 30).getTime())).toBe(new Date(2026, 9, 5).getTime());
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/qd-timeline.test.ts`
Expected: FAIL，找不到模块 `qd-timeline`。

- [ ] **Step 3: 写 `src/scripts/qd-timeline.ts`**

对照 `.superpowers/proto-v2/p2.html` 第 372–405 行（布局）、第 506–679 行（时间轴）、第 682–799 行（特效层）。与原型的区别：Antigravity 的采样点和耗尽预测来自 QuotaDeck 自己的历史文件与输出（`s.samples`、`s.estimate`），不再自己计算；颜色只从 tokens 读取（原型的绿色、琥珀色、告急色分别换成前景色、灰色和红色）；小字不用红色；Agent 连线从真实窗口里对应服务商那一行的右缘出发（由 `anchor()` 提供）；`light` 时不画光晕和拖尾、火花减少；`reduced` 时只画静态时间轴，不画扫描线、冲击波、火花和浮字。

```ts
import { H, D, BIG_TASK, AGENT_FLOW, agentPhase, collabEnd, type Lane, type LaneId, type ResetMark, type AgentId } from './qd-sim';

export interface TlText {
  title: string; sub: string; range: string; dashes: string; night: string; reset: string; nextReset: string; window: string; now: string;
  resetTo: (name: string) => string; exhaust: (h: string) => string; noExhaust: string; exhausted: string;
  status: Record<'queue' | 'run' | 'done', string>; bigTask: string; wbNote: string;
}
export interface TmState {
  t: number; lanes: Lane[]; marks: ResetMark[];
  /** QuotaDeck's own persisted Antigravity samples for the current window, in percent. */
  samples: { at: number; value: number }[];
  /** QuotaDeck's own output at its last refresh. */
  estimate: { at: number; value: number; burn: number | null; hoursLeft: number | null; resetAt: number } | null;
  collab: { at: number; agents: AgentId[] } | null;
}
export interface TmOptions {
  reduced: boolean; light: boolean;
  /** The tray window's right edge and the vertical centre of each provider's row, in body coordinates. */
  anchor: () => { right: number; rows: Partial<Record<AgentId, number>> } | null;
  onHit: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const pad = (n: number) => String(n).padStart(2, '0');
export const hhmm = (ms: number) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
/** Hours left at `now`, counting down from QuotaDeck's estimate made at `at`. */
export const countdown = (hoursLeft: number, at: number, now: number) => Math.max(0, hoursLeft - (now - at) / H);
export const midnight = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

interface Bezier { xs: Float32Array; ys: Float32Array; cl: Float32Array; n: number; len: number }
function bez(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, n: number): Bezier {
  const xs = new Float32Array(n + 1), ys = new Float32Array(n + 1), cl = new Float32Array(n + 1);
  for (let k = 0; k <= n; k++) {
    const u = k / n, v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    xs[k] = a * x0 + b * x1 + c * x2 + d * x3; ys[k] = a * y0 + b * y1 + c * y2 + d * y3;
    if (k) cl[k] = cl[k - 1] + Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1]);
  }
  return { xs, ys, cl, n, len: cl[n] };
}
function along(b: Bezier, f: number) {
  const d = clamp(f, 0, 1) * b.len; let k = 1;
  while (k < b.n && b.cl[k] < d) k++;
  const s = (d - b.cl[k - 1]) / ((b.cl[k] - b.cl[k - 1]) || 1);
  return { x: b.xs[k - 1] + (b.xs[k] - b.xs[k - 1]) * s, y: b.ys[k - 1] + (b.ys[k] - b.ys[k - 1]) * s };
}

export function createTimeMachine(body: HTMLElement, tl: HTMLCanvasElement, fx: HTMLCanvasElement, text: TlText, o: TmOptions) {
  const g = tl.getContext('2d')!, gx = fx.getContext('2d')!;
  const css = getComputedStyle(body);
  const tok = (name: string) => {
    const h = css.getPropertyValue(name).trim().replace('#', '');
    const n = parseInt(h.length === 3 ? [...h].map(c => c + c).join('') : h, 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const FG = tok('--night-fg'), MUTE = tok('--night-mute'), RED = tok('--red'), NIGHT = tok('--night');
  const SOFT = RED.map((v, i) => Math.round(v + (FG[i] - v) * 0.35));
  const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const BODY = css.getPropertyValue('--font-body').trim() || 'sans-serif';
  const DISP = css.getPropertyValue('--font-display').trim() || 'sans-serif';
  const MONO = "Consolas, 'Cascadia Mono', monospace";
  const LANE_COL: Record<LaneId, number[]> = { codex: FG, claude: MUTE, antigravity: RED };
  const halo = (c: number[], a0: number) => {
    const s = document.createElement('canvas'); s.width = s.height = 64;
    const x = s.getContext('2d')!, gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(c, a0)); gr.addColorStop(0.3, rgba(c, a0 * 0.38)); gr.addColorStop(1, rgba(c, 0));
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s;
  };
  const SPR = { codex: halo(FG, 0.5), claude: halo(MUTE, 0.5), antigravity: halo(RED, 0.6), red: halo(RED, 0.6) } as Record<string, HTMLCanvasElement>;

  type Layout = { dpr: number; w: number; h: number; bw: number; bh: number; ox: number; oy: number; L: number; R: number; T: number; B: number; fill: CanvasGradient;
    nodes: { cx: number; x: number; y: number; w: number; h: number }[] };
  let lay: Layout | null = null, dirty = true, fxDirty = false, nodesVis = 0;
  // The last collaboration keeps drawing (as "done") while the nodes fade out after the controller lets it go.
  let lastCollab: TmState['collab'] = null;
  // Beams start at the provider rows inside the hosted window, which render (and move) after layout: re-measured from
  // the anchor every frame of a run, rebuilt only when that geometry changes.
  let beamKey = '', beams: (Bezier | null)[] = [];
  function beamsFor(a: ReturnType<TmOptions['anchor']>) {
    const key = a ? `${Math.round(a.right)}|${AGENT_FLOW.map(ag => Math.round(a.rows[ag.id] ?? -1)).join(',')}|${lay!.nodes[0].cx}` : '';
    if (key === beamKey) return beams;
    beamKey = key;
    beams = AGENT_FLOW.map((ag, i) => {
      const y = a?.rows[ag.id]; if (!a || y === undefined) return null;
      const n = lay!.nodes[i], sx = a.right + 1, ex = n.cx, ey = n.y + n.h;
      return bez(sx, y, sx + 170, y, ex, ey + 170, ex, ey, 72);
    });
    return beams;
  }
  const sweeps: { at: number; tr: number; id: LaneId }[] = [], rings: { at: number; x: number; y: number; delay: number; dur: number; max: number; lw: number; hit: boolean }[] = [];
  const floats: { at: number; x: number; y: number }[] = [], jumps = new Map<LaneId, { at: number; tr: number; from: number }>();
  const SP = Array.from({ length: o.light ? 32 : 96 }, () => ({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, c: FG }));
  let last = 0;

  function size(c: HTMLCanvasElement, w: number, h: number, dpr: number) {
    const W = Math.round(w * dpr), Hh = Math.round(h * dpr);
    if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; }
  }
  function layout() {
    dirty = false;
    const dpr = Math.min(2, devicePixelRatio || 1), br = body.getBoundingClientRect(), tr = tl.getBoundingClientRect();
    if (!tr.width || !tr.height) { dirty = true; return; }
    size(tl, tr.width, tr.height, dpr); size(fx, br.width, br.height, dpr);
    const narrow = tr.width < 560, L = narrow ? 40 : 46, R = tr.width - (narrow ? 12 : 22), T = narrow ? 92 : 108, B = tr.height - 40;
    const ox = tr.left - br.left, oy = tr.top - br.top;
    const fill = g.createLinearGradient(0, T, 0, B);
    fill.addColorStop(0, rgba(RED, 0.13)); fill.addColorStop(1, rgba(RED, 0));
    const span = (R - L) / 4, nw = Math.min(172, span - 8);
    const nodes = AGENT_FLOW.map((_, i) => { const cx = ox + L + span * (i + 0.5); return { cx, x: cx - nw / 2, y: oy + 12, w: nw, h: 50 }; });
    lay = { dpr, w: tr.width, h: tr.height, bw: br.width, bh: br.height, ox, oy, L, R, T, B, fill, nodes };
    beamKey = '';
  }
  new ResizeObserver(() => { dirty = true; }).observe(body);

  function label(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, align: CanvasTextAlign, font: string) {
    c.font = font; c.textAlign = align; c.lineWidth = 3; c.strokeStyle = rgba(NIGHT, 0.85); c.strokeText(s, x, y); c.fillStyle = color; c.fillText(s, x, y);
  }

  /* ---------- the timeline ---------- */
  function drawTL(s: TmState, now: number) {
    const { w, h, L, R, T, B, dpr } = lay!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.shadowBlur = 0; g.setLineDash([]);
    g.clearRect(0, 0, w, h);
    const t = s.t, t0 = t - 10 * H, t1 = t + 3 * H, kx = (R - L) / (13 * H);
    const X = (x: number) => L + (x - t0) * kx, Y = (v: number) => B - v / 100 * (B - T), xn = X(t);
    const small = `11px ${BODY}`, mono = `11px ${MONO}`;
    g.textBaseline = 'alphabetic';

    if (nodesVis < 0.99) {                                                  // legend, giving way to the agent nodes
      g.globalAlpha = 1 - nodesVis;
      g.font = `600 12px ${BODY}`; g.textAlign = 'left'; g.fillStyle = rgba(FG, 1); g.fillText(text.title, L, 30);
      const tw = g.measureText(text.title).width;
      g.font = small; g.fillStyle = rgba(MUTE, 1); g.fillText(text.sub, L + tw + 12, 30);
      let lx = L;
      for (const l of s.lanes) {
        const c = LANE_COL[l.id];
        g.strokeStyle = rgba(c, 1); g.lineWidth = 2; g.beginPath(); g.moveTo(lx, 55); g.lineTo(lx + 18, 55); g.stroke();
        g.fillStyle = rgba(FG, 1); g.font = `12px ${BODY}`; g.fillText(l.name, lx + 24, 59); lx += 44 + g.measureText(l.name).width;
      }
      g.font = small; g.textAlign = 'right'; g.fillStyle = rgba(MUTE, 1);
      if (R - g.measureText(text.range).width > L + tw + 12 + g.measureText(text.sub).width + 16) g.fillText(text.range, R, 30);
      if (R - g.measureText(text.dashes).width > lx + 16) g.fillText(text.dashes, R, 59);
      g.globalAlpha = 1;
    }

    for (let day = midnight(t0) - D; day <= t1; day += D) {                 // day / night bands, scrolling with time
      const a = Math.max(t0, day + 7 * H), b = Math.min(t1, day + 23 * H);
      if (b > a) { g.fillStyle = rgba(FG, 0.04); g.fillRect(X(a), T - 20, X(b) - X(a), B - T + 20); }
      const na = Math.max(t0, day + 23 * H), nb = Math.min(t1, day + D + 7 * H);
      if (nb > na && X(nb) - X(na) > 46) { g.globalAlpha = 0.6; label(g, text.night, (X(na) + X(nb)) / 2, B - 9, rgba(MUTE, 1), 'center', small); g.globalAlpha = 1; }
    }
    g.lineWidth = 1;                                                        // grid and axes
    for (let k = Math.ceil(t0 / H); k * H <= t1; k++) {
      const x = Math.round(X(k * H)) + 0.5, even = new Date(k * H).getHours() % 2 === 0;
      g.strokeStyle = rgba(FG, even ? 0.07 : 0.03);
      g.beginPath(); g.moveTo(x, T - 20); g.lineTo(x, B); g.stroke();
      if (even && Math.abs(x - xn) > 34 && x > L + 12 && x < R - 12) { g.font = mono; g.textAlign = 'center'; g.fillStyle = rgba(MUTE, 1); g.fillText(hhmm(k * H), x, B + 16); }
    }
    for (const v of [0, 25, 50, 75, 100]) {
      const y = Math.round(Y(v)) + 0.5;
      g.strokeStyle = rgba(FG, v === 0 ? 0.22 : 0.06);
      g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke();
      if (v % 50 === 0) { g.font = mono; g.textAlign = 'right'; g.fillStyle = rgba(MUTE, 1); g.fillText(`${v}%`, L - 8, y + 4); }
    }
    const xw = X(t - H);                                                    // Antigravity's sampling window: the last hour
    g.fillStyle = rgba(RED, 0.05); g.fillRect(xw, T - 20, xn - xw, B - T + 20);
    g.strokeStyle = rgba(SOFT, 0.55); g.beginPath(); g.moveTo(xw + 0.5, B + 22); g.lineTo(xw + 0.5, B + 27); g.lineTo(xn - 0.5, B + 27); g.lineTo(xn - 0.5, B + 22); g.stroke();
    label(g, text.window, xw - 6, B + 31, rgba(MUTE, 1), 'right', `10.5px ${BODY}`);

    g.save(); g.beginPath(); g.rect(L, 0, R - L, h); g.clip();              // reset markers (past) and next resets (future)
    for (const m of s.marks) {
      if (m.t < t0) continue;
      const x = Math.round(X(m.t)) + 0.5, c = LANE_COL[m.id];
      g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = rgba(c, 0.4); g.beginPath(); g.moveTo(x, T - 20); g.lineTo(x, B); g.stroke();
      g.setLineDash([]); label(g, text.reset, x + 4, T - 8, rgba(FG, 0.9), 'left', `10.5px ${BODY}`);
    }
    s.lanes.forEach((l, i) => {
      if (l.reset > t1) return;
      const x = Math.round(X(l.reset)) + 0.5;
      g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = rgba(LANE_COL[l.id], 0.28); g.beginPath(); g.moveTo(x, T - 20); g.lineTo(x, B); g.stroke();
      g.setLineDash([]); label(g, text.nextReset, x - 4, T + 12 + i * 14, rgba(MUTE, 1), 'right', `10.5px ${BODY}`);
    });
    g.restore();

    g.save(); g.beginPath(); g.rect(L, T - 22, R - L, B - T + 26); g.clip(); // curves
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const l of [s.lanes[1], s.lanes[0], s.lanes[2]]) {
      const hs = l.hist, c = LANE_COL[l.id], agy = l.id === 'antigravity';
      let j = 0; while (j < hs.length - 2 && hs[j + 1].t < t0) j++;
      const trace = () => { g.beginPath(); g.moveTo(X(hs[j].t), Y(hs[j].v)); for (let k = j + 1; k < hs.length; k++) g.lineTo(X(hs[k].t), Y(hs[k].v)); g.lineTo(xn, Y(l.rem)); };
      if (agy) { trace(); g.lineTo(xn, B); g.lineTo(X(hs[j].t), B); g.closePath(); g.fillStyle = lay!.fill; g.fill(); }
      trace();
      g.strokeStyle = rgba(c, 0.95); g.lineWidth = agy ? 2.2 : 2;
      if (!o.light) { g.shadowColor = rgba(c, 0.7); g.shadowBlur = 9; }
      g.stroke(); g.shadowBlur = 0;
      const jump = jumps.get(l.id);                                         // a reset: the vertical segment glows briefly
      if (jump) {
        const a = (now - jump.at) / 1300;
        if (a >= 1 || o.reduced) jumps.delete(l.id);
        else {
          const x = X(jump.tr), k = 1 - a;
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = rgba(c, 0.75 * k); g.lineWidth = 3.2; g.beginPath(); g.moveTo(x, Y(jump.from)); g.lineTo(x, Y(100)); g.stroke();
          if (!o.light) { const sz = 26 + 40 * k; g.globalAlpha = 0.35 * k; g.drawImage(SPR[l.id], x - sz / 2, Y(100) - sz / 2, sz, sz); g.globalAlpha = 1; }
          g.globalCompositeOperation = 'source-over';
        }
      }
    }
    g.restore();

    for (let k = sweeps.length - 1; k >= 0; k--) {                          // reset sweeps: a scan line runs out both ways
      const sw = sweeps[k], a = (now - sw.at) / 1100;
      if (a >= 1) { sweeps.splice(k, 1); continue; }
      const x0 = X(sw.tr), e = easeOut(a), xl = x0 - e * (x0 - L), xr = x0 + e * (R - x0), fade = 1 - a, c = LANE_COL[sw.id];
      g.globalCompositeOperation = 'lighter';
      let gr = g.createLinearGradient(xl, 0, x0, 0); gr.addColorStop(0, rgba(c, 0.2 * fade)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(xl, T - 20, x0 - xl, B - T + 20);
      gr = g.createLinearGradient(x0, 0, xr, 0); gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(1, rgba(c, 0.2 * fade));
      g.fillStyle = gr; g.fillRect(x0, T - 20, xr - x0, B - T + 20);
      g.strokeStyle = rgba(c, 0.35 * fade); g.lineWidth = 2;
      g.beginPath(); g.moveTo(xl, T - 20); g.lineTo(xl, B); g.moveTo(xr, T - 20); g.lineTo(xr, B); g.stroke();
      g.globalCompositeOperation = 'source-over';
      const lane = s.lanes.find(l => l.id === sw.id)!;
      if (a < 0.7) { g.globalAlpha = 1 - a / 0.7; label(g, text.resetTo(lane.name), x0 + 8, Y(100) - 8, rgba(FG, 1), 'left', `600 12px ${BODY}`); g.globalAlpha = 1; }
    }

    const agy = s.lanes[2], e = s.estimate;                                 // Antigravity: QuotaDeck's samples and estimate
    g.save(); g.beginPath(); g.rect(L, T - 22, R - L, B - T + 26); g.clip();
    const recent = s.samples.filter(r => r.at >= t - H);
    for (const r of recent) {
      const x = X(r.at), y = Y(r.value), first = r === recent[0];
      g.strokeStyle = rgba(SOFT, 0.8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x, y + 7); g.stroke();
      g.fillStyle = rgba(SOFT, 1); g.beginPath(); g.arc(x, y, first ? 3 : 2, 0, 7); g.fill();
      if (first) { g.strokeStyle = rgba(SOFT, 0.7); g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.stroke(); }
    }
    if (e && e.burn !== null && e.burn > 0 && recent.length >= 2 && agy.rem > 0) {
      const f = recent[0], x1 = X(f.at), y1 = Y(f.value), x2 = X(e.at), y2 = Y(e.value);
      g.strokeStyle = rgba(SOFT, 0.9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.setLineDash([7, 6]); g.lineDashOffset = o.reduced ? 0 : -now / 60;
      if (e.hoursLeft !== null) {
        const tc = e.at + e.hoursLeft * H, xc = X(tc), y0 = Y(0), left = countdown(e.hoursLeft, e.at, t), urgent = left < 1;
        g.strokeStyle = rgba(SOFT, 0.85); g.beginPath(); g.moveTo(x2, y2); g.lineTo(xc, y0); g.stroke(); g.setLineDash([]);
        g.restore(); g.save();
        const txt = text.exhaust(left.toFixed(1)), inside = xc <= R;
        if (inside) {
          g.strokeStyle = rgba(SOFT, 1); g.lineWidth = 1.5; g.beginPath(); g.arc(xc, y0, 4.5, 0, 7); g.stroke();
          if (urgent && !o.reduced) {
            const ph = (now % 1000) / 1000;
            g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(RED, 0.35 * (1 - ph)); g.lineWidth = 2;
            g.beginPath(); g.arc(xc, y0, 5 + 22 * easeOut(ph), 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over';
          }
        }
        const sc = urgent && !o.reduced ? 1 + 0.07 * Math.sin(now / 150) : 1, lx = inside ? clamp(xc, L + 50, R - 50) : R;
        g.translate(lx, y0 - 14); g.scale(sc, sc);
        g.font = `700 13px ${MONO}`;
        const shown = inside ? txt : `${txt} →`, tw = g.measureText(shown).width, bx = inside ? -tw / 2 : -tw;
        g.fillStyle = rgba(NIGHT, 0.8); g.fillRect(bx - 6, -14, tw + 12, 20);
        g.strokeStyle = rgba(urgent ? RED : SOFT, urgent ? 0.9 : 0.5); g.lineWidth = 1; g.strokeRect(bx - 5.5, -13.5, tw + 11, 19);
        g.fillStyle = rgba(FG, 1); g.textAlign = 'left'; g.fillText(shown, bx, 1);
      } else {
        const tr = Math.min(e.resetAt, t1), vr = e.value - e.burn * (tr - e.at) / H, xr = X(tr), yr = Y(vr);
        g.strokeStyle = rgba(SOFT, 0.6); g.beginPath(); g.moveTo(x2, y2); g.lineTo(xr, yr); g.stroke(); g.setLineDash([]);
        g.restore(); g.save();
        label(g, text.noExhaust, Math.min(xr, R) - 6, yr - 10, rgba(FG, 1), 'right', `600 12px ${BODY}`);
      }
    }
    g.restore();
    if (agy.rem <= 0) label(g, text.exhausted, xn - 8, Y(0) - 12, rgba(FG, 1), 'right', `600 12px ${BODY}`);

    g.strokeStyle = rgba(FG, 0.5); g.lineWidth = 1;                          // now line and heads
    g.beginPath(); g.moveTo(Math.round(xn) + 0.5, T - 22); g.lineTo(Math.round(xn) + 0.5, B + 4); g.stroke();
    label(g, text.now, xn, B + 16, rgba(FG, 1), 'center', `600 11px ${BODY}`);
    if (!o.light) {
      g.globalCompositeOperation = 'lighter';
      for (const l of s.lanes) { const y = Y(l.rem), sz = l.agent && !o.reduced ? 58 + 8 * Math.sin(now / 120) : 42; g.globalAlpha = 0.7; g.drawImage(SPR[l.id], xn - sz / 2, y - sz / 2, sz, sz); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    for (const l of s.lanes) {
      const y = Y(l.rem);
      g.fillStyle = rgba(LANE_COL[l.id], 1); g.beginPath(); g.arc(xn, y, 4, 0, 7); g.fill();
      g.fillStyle = rgba(FG, 0.75); g.beginPath(); g.arc(xn, y, 1.8, 0, 7); g.fill();
    }
  }

  /* ---------- the overlay: beams, agent nodes, shockwave, sparks ---------- */
  function drawNode(i: number, st: 'queue' | 'run' | 'done', el: number, a: number) {
    const n = lay!.nodes[i], ag = AGENT_FLOW[i], ap = clamp((el - i * 0.09) / 0.35, 0, 1);
    if (ap <= 0) return;
    const now = performance.now(), sinceDone = el - ag.start - ag.run;
    gx.save(); gx.globalAlpha = a * ap;
    const pop = st === 'done' && sinceDone < 0.35 ? 1 + 0.12 * (1 - sinceDone / 0.35) : 1, sc = (0.86 + 0.14 * easeOut(ap)) * pop;
    gx.translate(n.cx, n.y + n.h / 2); gx.scale(sc, sc); gx.translate(-n.cx, -(n.y + n.h / 2));
    gx.beginPath(); gx.roundRect(n.x, n.y, n.w, n.h, 7); gx.fillStyle = rgba(NIGHT, 0.95); gx.fill();
    if (st === 'queue') { gx.setLineDash([3, 4]); gx.strokeStyle = rgba(MUTE, 0.55); gx.lineWidth = 1; gx.stroke(); gx.setLineDash([]); }
    else if (st === 'run') { gx.strokeStyle = rgba(SOFT, 0.85); gx.lineWidth = 1.4; gx.stroke(); }
    else { gx.strokeStyle = rgba(FG, 0.8); gx.lineWidth = 1.4; gx.stroke(); }
    const ix = n.x + 23, iy = n.y + 25, compact = n.w < 132;              // phones and ~1000 px: no icon, smaller text
    gx.lineCap = 'round';
    if (compact) { /* no icon */ }
    else if (st === 'queue') { gx.setLineDash([2, 3]); gx.strokeStyle = rgba(MUTE, 1); gx.lineWidth = 1.4; gx.beginPath(); gx.arc(ix, iy, 9, 0, 7); gx.stroke(); gx.setLineDash([]); }
    else if (st === 'run') {
      const ang = now / 170;
      gx.strokeStyle = rgba(RED, 0.25); gx.lineWidth = 2.4; gx.beginPath(); gx.arc(ix, iy, 9, 0, 7); gx.stroke();
      gx.strokeStyle = rgba(SOFT, 1); gx.beginPath(); gx.arc(ix, iy, 9, ang, ang + Math.PI * 1.3); gx.stroke();
      const prog = clamp((el - ag.start) / ag.run, 0, 1);
      gx.strokeStyle = rgba(RED, 0.75); gx.lineWidth = 2; gx.beginPath(); gx.moveTo(n.x + 8, n.y + n.h - 3); gx.lineTo(n.x + 8 + (n.w - 16) * prog, n.y + n.h - 3); gx.stroke();
    } else {
      gx.fillStyle = rgba(FG, 0.12); gx.beginPath(); gx.arc(ix, iy, 10, 0, 7); gx.fill();
      gx.strokeStyle = rgba(FG, 1); gx.lineWidth = 2.2; gx.beginPath(); gx.moveTo(ix - 4.5, iy); gx.lineTo(ix - 1, iy + 3.8); gx.lineTo(ix + 5, iy - 3.8); gx.stroke();
    }
    if (compact && st === 'run') {
      const prog = clamp((el - ag.start) / ag.run, 0, 1);
      gx.strokeStyle = rgba(RED, 0.75); gx.lineWidth = 2; gx.beginPath(); gx.moveTo(n.x + 8, n.y + n.h - 3); gx.lineTo(n.x + 8 + (n.w - 16) * prog, n.y + n.h - 3); gx.stroke();
    }
    const tx = compact ? n.x + 8 : n.x + 42;
    gx.save(); gx.beginPath(); gx.rect(n.x + 2, n.y, n.w - 4, n.h); gx.clip();
    gx.textAlign = 'left'; gx.fillStyle = rgba(FG, 1); gx.font = `700 ${compact ? 11 : 13}px ${BODY}`; gx.fillText(ag.name, tx, n.y + 21);
    gx.font = `${compact ? 11 : 12}px ${BODY}`; gx.fillStyle = rgba(st === 'queue' ? MUTE : FG, 1); gx.fillText(text.status[st], tx, n.y + 39);
    gx.restore();
    if (ag.id === 'workbuddy') {
      gx.font = `11px ${BODY}`; const w = gx.measureText(text.wbNote).width;
      gx.textAlign = 'right'; gx.fillStyle = rgba(MUTE, 1); gx.fillText(text.wbNote, Math.min(n.cx + w / 2, lay!.bw - 4), n.y + n.h + 15);
    }
    gx.restore();
  }
  function drawBeam(b: Bezier | null, i: number, st: 'queue' | 'run' | 'done', el: number, a: number) {
    const ag = AGENT_FLOW[i], now = performance.now(), ap = clamp((el - i * 0.09) / 0.35, 0, 1);
    if (!b || ap <= 0) return;
    const path = () => { gx.beginPath(); gx.moveTo(b.xs[0], b.ys[0]); for (let k = 1; k <= b.n; k++) gx.lineTo(b.xs[k], b.ys[k]); };
    gx.globalAlpha = a * ap;
    if (st === 'queue') { path(); gx.setLineDash([2, 7]); gx.strokeStyle = rgba(MUTE, 0.4); gx.lineWidth = 1.2; gx.stroke(); gx.setLineDash([]); }
    else if (st === 'run') {
      path(); gx.strokeStyle = rgba(RED, 0.14); gx.lineWidth = 5; gx.stroke();
      gx.globalCompositeOperation = 'lighter';
      gx.setLineDash([8, 10]); gx.lineDashOffset = -now * 0.09; gx.strokeStyle = rgba(SOFT, 0.7); gx.lineWidth = 1.8; path(); gx.stroke(); gx.setLineDash([]);
      if (!o.light) for (let k = 0; k < 3; k++) { const q = along(b, ((now / 1100) + k / 3 + i * 0.17) % 1); gx.drawImage(SPR.red, q.x - 11, q.y - 11, 22, 22); }
      gx.globalCompositeOperation = 'source-over';
    } else {
      const k = clamp((el - ag.start - ag.run) / 0.9, 0, 1);
      if (k < 1) { path(); gx.strokeStyle = rgba(FG, 0.55 * (1 - k)); gx.lineWidth = 1.6; gx.stroke(); }
    }
    gx.fillStyle = rgba(st === 'run' ? SOFT : st === 'done' ? FG : MUTE, 1); gx.beginPath(); gx.arc(b.xs[0], b.ys[0], 3.2, 0, 7); gx.fill();
    gx.globalAlpha = 1;
  }
  function spark(x: number, y: number, k: number) {
    for (const p of SP) {
      if (k <= 0) break; if (p.life > 0) continue;
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 7;
      p.x = x; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 1.5; p.max = p.life = 450 + Math.random() * 650; p.c = Math.random() < 0.55 ? SOFT : RED; k--;
    }
  }
  function drawFX(s: TmState, now: number, rdt: number) {
    const sparksAlive = SP.some(p => p.life > 0);
    if (s.collab) nodesVis = Math.min(1, nodesVis + rdt / 300);
    else nodesVis = Math.max(0, nodesVis - rdt / 600);
    const live = s.collab || nodesVis > 0 || rings.length || floats.length || sparksAlive || s.lanes[0].drop > 0;
    if (!live && !fxDirty) return;
    fxDirty = !!live;
    gx.setTransform(lay!.dpr, 0, 0, lay!.dpr, 0, 0);
    gx.globalCompositeOperation = 'source-over'; gx.globalAlpha = 1; gx.shadowBlur = 0; gx.setLineDash([]);
    gx.clearRect(0, 0, lay!.bw, lay!.bh);
    if (s.collab) lastCollab = s.collab;
    const a0 = o.anchor();
    if (s.collab || nodesVis > 0) {
      const el = s.collab ? (now - s.collab.at) / 1000 : collabEnd(AGENT_FLOW.map(a => a.id)) + 1;
      const shown = (s.collab ?? lastCollab)?.agents ?? [], bs = beamsFor(a0);
      AGENT_FLOW.forEach((ag, i) => { if (shown.includes(ag.id)) drawBeam(bs[i], i, agentPhase(ag.id, el), el, nodesVis); });
      AGENT_FLOW.forEach((ag, i) => { if (shown.includes(ag.id)) drawNode(i, agentPhase(ag.id, el), el, nodesVis); });
    }
    if (!s.collab && nodesVis <= 0) lastCollab = null;
    for (let k = rings.length - 1; k >= 0; k--) {                           // shockwave: when it reaches the window, the window takes the hit
      const r = rings[k], a = (now - r.at - r.delay) / r.dur;
      if (a < 0) continue;
      if (a >= 1) { if (!r.hit) { r.hit = true; o.onHit(); } rings.splice(k, 1); continue; }
      const rad = 8 + easeOut(a) * r.max, fade = Math.pow(1 - a, 1.4);
      if (!r.hit && a0 && rad >= r.x - a0.right) { r.hit = true; o.onHit(); }
      gx.globalCompositeOperation = 'lighter';
      gx.strokeStyle = rgba(RED, 0.35 * fade); gx.lineWidth = 1 + r.lw * (1 - a);
      gx.beginPath(); gx.arc(r.x, r.y, rad, 0, 7); gx.stroke();
      if (!o.light && r.delay === 0 && a < 0.3) { const sz = 60 + 260 * (a / 0.3); gx.globalAlpha = 0.35 * (1 - a / 0.3); gx.drawImage(SPR.red, r.x - sz / 2, r.y - sz / 2, sz, sz); gx.globalAlpha = 1; }
      gx.globalCompositeOperation = 'source-over';
    }
    const f = rdt / 16.7;
    gx.globalCompositeOperation = 'lighter'; gx.lineCap = 'round';
    for (const p of SP) {
      if (p.life <= 0) continue;
      p.life -= rdt; p.vx *= Math.pow(0.955, f); p.vy = p.vy * Math.pow(0.955, f) + 0.16 * f; p.x += p.vx * f; p.y += p.vy * f;
      const k = Math.max(0, p.life / p.max);
      gx.strokeStyle = rgba(p.c, 0.6 * k); gx.lineWidth = 1.2 + 1.2 * k;
      const trail = o.light ? 0.6 : 3.2;                                    // phones: short dots, no trails
      gx.beginPath(); gx.moveTo(p.x, p.y); gx.lineTo(p.x - p.vx * trail, p.y - p.vy * trail); gx.stroke();
    }
    gx.globalCompositeOperation = 'source-over';
    for (let k = floats.length - 1; k >= 0; k--) {
      const fl = floats[k], a = (now - fl.at) / 1300;
      if (a >= 1) { floats.splice(k, 1); continue; }
      gx.globalAlpha = 0.85 * (1 - a * a); gx.textAlign = 'right'; gx.fillStyle = rgba(FG, 1);
      gx.font = `700 34px ${DISP}`; gx.fillText(`−${BIG_TASK}`, fl.x - 16, fl.y - 18 - 46 * easeOut(a));
      gx.font = `12px ${BODY}`; gx.fillText(text.bigTask, fl.x - 16, fl.y - 2 - 46 * easeOut(a)); gx.globalAlpha = 1;
    }
  }

  return {
    layout() { dirty = true; },
    draw(s: TmState, now: number) {
      const rdt = last ? Math.min(100, now - last) : 16; last = now;
      if (dirty) layout();
      if (!lay) return;
      if (s.lanes[0].drop > 0 && !o.reduced) spark(headX(), headY(s.lanes[0]), 2);
      drawTL(s, now);
      if (!o.reduced) drawFX(s, now, rdt);
    },
    /** A lane has just reset: its history ends with the value before the reset and then 100. */
    sweep(lane: Lane, t: number) {
      if (o.reduced) return;
      const now = performance.now(), from = lane.hist.length >= 2 ? lane.hist[lane.hist.length - 2].v : 0;
      sweeps.push({ at: now, tr: t, id: lane.id });
      jumps.set(lane.id, { at: now, tr: t, from });
    },
    shock(lane: Lane, now: number) {
      if (!lay || o.reduced) return;
      const x = lay.ox + lay.L + (lay.R - lay.L) * 10 / 13, y = lay.oy + lay.B - lane.rem / 100 * (lay.B - lay.T);
      rings.push({ at: now, x, y, delay: 0, dur: 1300, max: 1000, lw: 6, hit: false }, { at: now, x, y, delay: 150, dur: 1150, max: 760, lw: 3, hit: true });
      floats.push({ at: now, x, y });
      spark(x, y, o.light ? 12 : 44);
    },
  };

  function headX() { return lay!.ox + lay!.L + (lay!.R - lay!.L) * 10 / 13; }
  function headY(l: Lane) { return lay!.oy + lay!.B - l.rem / 100 * (lay!.B - lay!.T); }
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/qd-timeline.test.ts`
Expected: 3 passed。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/qd-timeline.ts tests/unit/qd-timeline.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "QuotaDeck time machine canvas: the prototype's timeline, reset sweeps, shockwave and agent beams, drawn from QuotaDeck's own samples and estimate" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 时间机器演示区（页面、文案、控制器、端到端测试）

**Files:**
- Create: `src/scripts/qd-live-text.ts`、`src/scripts/qd-live.ts`、`src/components/QuotaLive.astro`
- Modify: `src/views/QuotaView.astro`、`src/components/QuotaShots.astro`（标题）、`tests/e2e/a11y.spec.ts`（排除 QuotaDeck 原样界面的 iframe）
- Test: `tests/e2e/quota-live.spec.ts`

**Interfaces:**
- Consumes: Task 1–5 全部导出；已有的 `CodeLive` / `codeLive`。
- Produces（端到端测试依赖）：`#qd-stage[data-state=idle|running|failed][data-resets][data-codex][data-collab=idle|running|done][data-agents="codex:queue claude:run …"]`、`.qd-head`、`#qd-clock`、`#qd-clock-text`（读屏与测试用的时钟文字）、`#qd-speeds [data-sp="0|1|60|600"][aria-pressed]`、`#qd-task`、`#qd-collab`、`#qd-frame`（iframe）、`#qd-eta`、`#qd-strip`、`#qd-strip-k`、`#qd-code .cl-l[data-n]`、`#qd-fallback`。

- [ ] **Step 1: 写端到端测试 `tests/e2e/quota-live.spec.ts`**

```ts
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { noHorizontalOverflow } from './helpers';

const PATH = '/projects/quota-deck/';
test.describe.configure({ timeout: 120_000 });
const desktopOnly = (isMobile: boolean) => test.skip(isMobile, 'desktop flow; phones are covered by the layout test');

async function live(page: Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('#qd-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await expect(page.frameLocator('#qd-frame').locator('.provider')).toHaveCount(5, { timeout: 20_000 });
}
const frame = (page: Page) => page.frameLocator('#qd-frame');
const codex = async (page: Page) => Number(await page.locator('#qd-stage').getAttribute('data-codex'));

test('QuotaDeck\'s own tray UI renders the simulated quota', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(frame(page).locator('h1')).toHaveText('QuotaDeck');
  await expect(frame(page).locator('#syncMeta')).toContainText('更新');
  await expect(frame(page).locator('[data-provider="workbuddy"] .state-word')).toHaveText('缓存数据');
  await expect(page.locator('.qd-apphead')).toContainText('演示数据 · 非真实额度');
});

test('the live source lines are quota-history.cjs 50–61, verbatim', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(PATH);
  const file = readFileSync('public/assets/quotadeck/e9557c6/src/main/quota-history.cjs', 'utf8').replace(/\r\n/g, '\n').split('\n').slice(49, 61);
  await expect(page.locator('#qd-code .cl-src')).toHaveText(file);
});

test('Antigravity gets QuotaDeck\'s own burn rate and exhaustion estimate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#qd-eta')).toContainText('点/小时', { timeout: 15_000 });
  await expect(frame(page).locator('[data-provider="antigravity"]')).toContainText('近 1 小时采样');
  await expect(page.locator('#qd-code .cl-l[data-n="57"] .cl-cnt')).toContainText('点/小时');
});

test('at 600× a window ends and resets to 100%', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#qd-stage')).not.toHaveAttribute('data-resets', '0', { timeout: 40_000 });
});

test('a big task takes Codex down by about 24 points', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('[data-sp="1"]').click();
  await page.waitForTimeout(1500);
  const before = await codex(page);
  await page.locator('#qd-task').click();
  await page.waitForTimeout(1500);
  await page.locator('[data-sp="600"]').click();
  await expect.poll(() => codex(page), { timeout: 4_000 }).toBeLessThan(before - 20);   // well before Codex's reset at 09:00 + 2.4 h
});

test('the page\'s collaboration runs through queued, running and done, and invents no answer', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'running');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-agents', /codex:queue/);
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-agents', /codex:run/, { timeout: 3_000 });
  await expect(page.locator('#qd-collab')).toBeDisabled();
  await expect(page.locator('#qd-strip')).toContainText('不调用真实 Agent');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await expect(page.locator('#qd-strip-k')).toHaveText('✓ 4/4 已完成');
  await frame(page).locator('[data-view="collab"]').click();
  await expect(frame(page).locator('#collabResults .result')).toHaveCount(4);
  for (const pre of await frame(page).locator('#collabResults pre').allTextContents()) expect(pre).toContain('没有调用真实 Agent');
});

test('the tray UI\'s own collaboration form runs the same flow; a second run is refused', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const f = frame(page);
  await f.locator('[data-view="collab"]').click();
  await f.locator('#collabTask').fill('分析这个产品需求');
  await f.locator('#agentChoices input[value="codex"]').check();
  await f.locator('#agentChoices input[value="claude"]').check();
  await f.locator('#runCollabBtn').click();
  await expect(page.locator('#qd-collab')).toBeDisabled();
  await expect(f.locator('#runCollabBtn')).toHaveText('Agent 并行执行中…');
  const second = await page.evaluate(() => (window as any).__quotaDeckBridge.runCollaboration({ task: 'x', agents: ['codex', 'claude'] }).then(() => 'ran', (e: Error) => e.message));
  expect(second).toBe('已有协作任务运行，请等待结束');
  await expect(f.locator('#collabResults .result')).toHaveCount(2, { timeout: 10_000 });
});

test('a second run right after the first one finishes completes too', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'running');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await expect(page.locator('#qd-collab')).toBeEnabled();
});

test('keyboard: the collaboration button gets its focus back when the run ends', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await expect(page.locator('#qd-collab')).toBeFocused();
});

test('the page button stays disabled while a collaboration runs', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-collab')).toBeDisabled();
  const f = frame(page);
  await f.locator('[data-view="collab"]').click();
  await expect(f.locator('#runCollabBtn')).toBeDisabled();
});

test('pausing and changing speed keeps the estimate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#qd-eta')).toContainText('点/小时', { timeout: 15_000 });
  await page.locator('[data-sp="0"]').click();
  const t = await page.locator('#qd-clock-text').textContent();
  await page.waitForTimeout(1500);
  await expect(page.locator('#qd-clock-text')).toHaveText(t!);
  await page.locator('[data-sp="60"]').click();
  await page.waitForTimeout(2500);
  await expect(page.locator('#qd-eta')).toContainText('点/小时');
});

test('reduced motion starts paused with an estimate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await live(page);
  await expect(page.locator('[data-sp="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#qd-eta')).toContainText('点/小时');
  const t = await page.locator('#qd-clock-text').textContent();
  await page.waitForTimeout(1500);
  await expect(page.locator('#qd-clock-text')).toHaveText(t!);
});

test('a blocked QuotaDeck file falls back to the screenshots', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.route('**/quotadeck/e9557c6/src/main/snapshot.cjs', r => r.abort());
  await page.goto(PATH);
  await page.locator('#qd-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#qd-fallback')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#qd-stage')).toBeHidden();
  await expect(page.locator('.qd-intro')).toBeHidden();
  await expect(page.locator('.qshots figure[data-shot]')).toHaveCount(3);
});

for (const blocked of ['**/assets/quotadeck/host.js', '**/quotadeck/e9557c6/src/renderer/compact.css']) {
  test(`the host failing (${blocked.split('/').pop()}) falls back to the screenshots`, async ({ page, isMobile }) => {
    desktopOnly(!!isMobile);
    await page.route(blocked, r => r.abort());
    await page.goto(PATH);
    await page.locator('#qd-stage').scrollIntoViewIfNeeded();
    await expect(page.locator('#qd-fallback')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.qshots figure[data-shot]')).toHaveCount(3);
  });
}

test('the demo makes no request off the site', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  const off: string[] = [];
  page.on('request', r => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.hostname.endsWith('fonts.googleapis.com') && !u.hostname.endsWith('fonts.gstatic.com')) off.push(r.url()); });
  await live(page);
  await page.waitForTimeout(2000);
  expect(off).toEqual([]);
});

test('English page: English interface; QuotaDeck\'s window stays as published', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page, '/en');
  await expect(page.locator('#qd-title')).toHaveText('Time machine: QuotaDeck, live');
  await expect(page.locator('#qd-task')).toHaveText('Give Codex a big task');
  await expect(page.locator('.qd-apphead')).toContainText('in Chinese');
  await expect(frame(page).locator('nav button').first()).toHaveText('额度');
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('on a phone the window and the timeline stack without widening the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  await live(page);
  const w = await page.locator('.qd-window').boundingBox(), t = await page.locator('.qd-tl').boundingBox();
  expect(t!.y).toBeGreaterThan(w!.y + w!.height - 1);
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('the live stage has no serious accessibility issue', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const { violations } = await new AxeBuilder({ page }).include('#qd-stage').exclude('#qd-frame').analyze();
  const bad = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/quota-live.spec.ts --project=desktop -g "tray UI renders"`
Expected: FAIL（找不到 `#qd-stage`）。

- [ ] **Step 3: 写 `src/scripts/qd-live-text.ts`**

```ts
import type { Lang } from '../i18n';
import type { TlText } from './qd-timeline';

export interface QuotaText {
  title: string; meta: string; intro: string; simClock: string; day: (n: number) => string; speedLabel: string; pause: string;
  bigTask: string; collab: string; collabTask: string; appHead: string; frameTitle: string;
  stripIdleK: string; stripIdle: string; stripRun: (done: number, all: number) => string; stripDone: (all: number) => string; disclaimer: string;
  eta: { sampling: (n: number) => string; stable: string; left: (burn: string, h: string) => string; noExhaust: (burn: string) => string; exhausted: string; source: string };
  codeTitle: string; codeMeta: string; codeLabel: string;
  code: { samples: (n: number) => string; broke: string; span: (n: number, min: number) => string; burn: (v: string) => string; hours: (v: string) => string; untilReset: (v: string) => string; shown: (v: string) => string; notShown: string; short: string };
  note: string; fallback: string; tl: TlText;
}

const ZH_TL: TlText = {
  title: '额度时间轴', sub: '5 小时窗口 · 到点重置为 100%', range: '← 过去 10 小时 · 未来 3 小时 →', dashes: '虚线：QuotaDeck 按采样算出的耗尽预测',
  night: '夜间', reset: '重置', nextReset: '下次重置', window: '近 1 小时采样窗口', now: '现在',
  resetTo: name => `${name} 重置 → 100%`, exhaust: h => `耗尽 T-${h}h`, noExhaust: '重置前不会耗尽', exhausted: '已耗尽 · 等待重置',
  status: { queue: '排队中', run: '运行中', done: '已完成' }, bigTask: '大任务', wbNote: '积分以网页快照为准',
};
const EN_TL: TlText = {
  title: 'Quota timeline', sub: '5-hour windows · reset to 100% on time', range: '← past 10 hours · next 3 hours →', dashes: 'dashed: QuotaDeck\'s exhaustion forecast from its samples',
  night: 'night', reset: 'reset', nextReset: 'next reset', window: 'last-hour sampling window', now: 'now',
  resetTo: name => `${name} reset → 100%`, exhaust: h => `empty T-${h}h`, noExhaust: 'will not run out before the reset', exhausted: 'exhausted · waiting for the reset',
  status: { queue: 'queued', run: 'running', done: 'done' }, bigTask: 'big task', wbNote: 'credits per the web snapshot',
};

export const QUOTA_TEXT: Record<Lang, QuotaText> = {
  zh: {
    title: '时间机器：QuotaDeck 在线运行', meta: '公开版 0.5.0-rc.5 · e9557c6 · 在你的浏览器里运行',
    intro: '左边是 QuotaDeck 托盘窗口的真实界面文件，原样运行；界面里的百分比、状态和重置倒计时由 QuotaDeck 自己的代码生成。右边是 13 小时的额度时间轴（过去 10 小时 + 未来 3 小时），模拟时钟可以快进：额度一路消耗、到点重置；QuotaDeck 每分钟刷新一次，Antigravity 的消耗速度和耗尽预测由它自己的 quota-history 算法用近 1 小时的样本算出。只有时钟和使用量是模拟的。',
    simClock: '模拟时钟', day: n => `第 ${n} 天 · 模拟时间`, speedLabel: '时钟速度', pause: '暂停',
    bigTask: '派一个大任务给 Codex', collab: '并行协作 · 4 个 Agent', collabTask: '网页演示：把一个产品需求分给 4 个 Agent',
    appHead: '演示数据 · 非真实额度 · QuotaDeck 真实界面', frameTitle: 'QuotaDeck 托盘窗口（真实界面，演示数据）',
    stripIdleK: '并行协作', stripIdle: '点上方"并行协作 · 4 个 Agent"，或在窗口的"协作"页勾选 Agent，看状态流程和额度变化。',
    stripRun: (d, a) => `协作中 · 已完成 ${d}/${a}`, stripDone: a => `✓ ${a}/${a} 已完成`,
    disclaimer: '网页演示：状态流程与额度变化为模拟，不调用真实 Agent，不生成回答。',
    eta: {
      sampling: n => `Antigravity：采样中 · 近 1 小时 ${n} 个样本`, stable: 'Antigravity：近 1 小时没有下降 · 当前稳定',
      left: (b, h) => `Antigravity：近 1 小时下降 ${b} 点/小时 · 约 ${h} 小时耗尽`, noExhaust: b => `Antigravity：近 1 小时下降 ${b} 点/小时 · 重置前不会耗尽`,
      exhausted: 'Antigravity：已耗尽 · 等待重置', source: '（QuotaDeck 自己的估算）',
    },
    codeTitle: 'quota-history.cjs · record()', codeMeta: '代码实况 · 源码第 50–61 行', codeLabel: '代码实况：QuotaDeck 的消耗速度与耗尽预测源码',
    code: {
      samples: n => `→ 近 1 小时 ${n} 个样本`, broke: '→ 重置后样本清空', span: (n, m) => `→ ${n} 个样本，跨 ${m} 分钟`,
      burn: v => `→ ${v} 点/小时`, hours: v => `→ ${v} h`, untilReset: v => `→ ${v} h`, shown: v => `→ 显示 ${v} h`, notShown: '→ 不显示：重置更早', short: '→ 样本不足：需 2 个且跨 5 分钟',
    },
    note: '左侧是公开仓库 e9557c6 的真实界面文件（MIT 许可）；界面数据由 QuotaDeck 的 providerToUi / toUiSnapshot 生成，消耗速度和耗尽预测由它的 quota-history 计算。只有时钟和使用量来自模拟；不读取你的电脑或任何账号。',
    fallback: '时间机器暂时无法启动（浏览器不支持或文件加载失败）。下面是桌面版的真实截图。',
    tl: ZH_TL,
  },
  en: {
    title: 'Time machine: QuotaDeck, live', meta: 'Public build 0.5.0-rc.5 · e9557c6 · running in your browser',
    intro: 'On the left, QuotaDeck\'s real tray-window files run unchanged; every percentage, status and reset countdown in it is produced by QuotaDeck\'s own code. On the right, a 13-hour quota timeline (10 hours back, 3 ahead) on a simulated clock you can fast-forward: quota drains and resets on time; QuotaDeck refreshes every minute, and its own quota-history algorithm turns the last hour of Antigravity samples into a burn rate and an exhaustion forecast. Only the clock and the usage are simulated.',
    simClock: 'Simulated clock', day: n => `Day ${n} · simulated time`, speedLabel: 'Clock speed', pause: 'Pause',
    bigTask: 'Give Codex a big task', collab: 'Parallel run · 4 agents', collabTask: 'Web demo: hand one product brief to 4 agents',
    appHead: 'Demo data, not real quota · QuotaDeck\'s real interface (in Chinese)', frameTitle: 'QuotaDeck tray window (real interface, demo data, in Chinese)',
    stripIdleK: 'Parallel run', stripIdle: 'Press "Parallel run · 4 agents", or pick agents on the window\'s 协作 tab, to watch the state flow and the quota.',
    stripRun: (d, a) => `running · ${d}/${a} done`, stripDone: a => `✓ ${a}/${a} done`,
    disclaimer: 'Web demo: the state flow and the quota changes are simulated; no real agent is called and no answer is generated.',
    eta: {
      sampling: n => `Antigravity: sampling · ${n} samples in the last hour`, stable: 'Antigravity: no drop in the last hour · steady',
      left: (b, h) => `Antigravity: down ${b} points/hour over the last hour · empty in about ${h} hours`, noExhaust: b => `Antigravity: down ${b} points/hour · will not run out before the reset`,
      exhausted: 'Antigravity: exhausted · waiting for the reset', source: '(QuotaDeck\'s own estimate)',
    },
    codeTitle: 'quota-history.cjs · record()', codeMeta: 'Live source · lines 50–61', codeLabel: 'Live source: QuotaDeck\'s burn-rate and exhaustion estimate',
    code: {
      samples: n => `→ ${n} samples in the last hour`, broke: '→ reset: samples cleared', span: (n, m) => `→ ${n} samples over ${m} min`,
      burn: v => `→ ${v} points/hour`, hours: v => `→ ${v} h`, untilReset: v => `→ ${v} h`, shown: v => `→ shown: ${v} h`, notShown: '→ not shown: the reset comes first', short: '→ too few samples: 2 over 5 minutes needed',
    },
    note: 'The window runs the real interface files of the public repository at e9557c6 (MIT licence); its data comes from QuotaDeck\'s providerToUi / toUiSnapshot, and the burn rate and forecast from its quota-history. Only the clock and the usage are simulated; nothing on your computer or in any account is read.',
    fallback: 'The time machine could not start (unsupported browser or a file failed to load). Below are real screenshots of the desktop app.',
    tl: EN_TL,
  },
};
```

（注意：`eta.left` 等文案里的"点/小时"只在中文页出现；英文页测试只检查标题、按钮与"in Chinese"。端到端测试里断言"点/小时"的用例都跑中文页。）

- [ ] **Step 4: 写 `src/scripts/qd-live.ts`**

```ts
import { loadQuotaDeck, QD_DIR, HISTORY_FILE, type QuotaDeckMain } from './qd-load';
import { createSim, H, M, REFRESH, PROVIDER_IDS, AGENT_FLOW, agentPhase, collabEnd, type AgentId, type LaneId } from './qd-sim';
import { createBridge } from './qd-bridge';
import { createTimeMachine, hhmm, countdown, type TmState } from './qd-timeline';
import { codeLive } from './code-live';
import { QUOTA_TEXT } from './qd-live-text';

declare global { interface Window { __quotaDeckBridge?: unknown; __quotaDeckFailed?: (message: string) => void } }
const HOT = '#agentChoices, #providerList, #modelFilters, #modelSearch, #collabTask';
const VERSION = '0.5.0-rc.5';
const ALL_AGENTS = AGENT_FLOW.map(a => a.id) as AgentId[];
const AGENTS_AVAILABLE = { codex: true, claude: true, antigravity: true, workbuddy: true };

/** Digits on reels (the prototype's clock): rebuilt when the length changes, otherwise each reel slides. */
function reels(el: HTMLElement, s: string) {
  if (el.dataset.len !== String(s.length)) {
    el.replaceChildren(...[...s].map(ch => {
      const span = document.createElement('span');
      if (/\d/.test(ch)) { span.className = 'reel'; const strip = document.createElement('span'); strip.className = 'strip'; strip.textContent = '0123456789'; span.append(strip); }
      else { span.className = 'gl'; span.textContent = ch; }
      return span;
    }));
    el.dataset.len = String(s.length);
  }
  [...el.children].forEach((c, i) => { const strip = c.firstElementChild as HTMLElement | null; if (strip) strip.style.transform = `translateY(${-Number(s[i])}em)`; else c.textContent = s[i]; });
}

export function initQuotaLive(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh', T = QUOTA_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const light = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData || matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const stage = $('qd-stage'), frame = $<HTMLIFrameElement>('qd-frame'), code = codeLive($('qd-code'));
  const clampY = (v: number, a: number, b: number) => Math.max(a + 8, Math.min(b - 8, v));
  const sim = createSim(), clock = { now: sim.t };
  let main: QuotaDeckMain | null = null, read: ((id: string) => Promise<any>) | null = null, ui: any = null;
  let speed = 600, refreshing = false, nextRefresh = sim.t, raf = 0, lastReal = 0, visible = false, failed = false;
  let collab: { at: number; agents: AgentId[] } | null = null, collabDone = 0, resets = 0;
  let estimate: TmState['estimate'] = null, samples: TmState['samples'] = [], sampleKey = '';
  let lastAt = NaN, lastProviders: any[] = [], wasDraining = false;
  // Pushes to the hosted UI wait while the visitor presses or edits something in it (compact.js rebuilds its lists with
  // innerHTML on every snapshot, which would swallow the click), and come at most twice a second.
  let pendingUi: any = null, pointerDown = false, lastPush = 0, flushTimer = 0;

  /* ---------- QuotaDeck's refresh, on the simulated clock ---------- */
  async function refresh() {
    if (!main || !read || refreshing) return ui;
    refreshing = true;
    try {
      clock.now = sim.t;
      // Paused (or QuotaDeck's own refresh button at the same instant): Antigravity must not be sampled twice at one
      // moment — quota-history.cjs lines 37-38 and 53 would drop its estimate — so its last reading is reused.
      const same = sim.t === lastAt && lastProviders.length > 0;
      const providers = await Promise.all(PROVIDER_IDS.map((id, i) => (same && id === 'antigravity' ? lastProviders[i] : read!(id))));
      lastAt = sim.t; lastProviders = providers;
      ui = { ...main.toUiSnapshot({ updatedAt: new Date(sim.t).toISOString(), providers }), agents: AGENTS_AVAILABLE };
      pushUi(ui);
      if (!same) readEstimate(providers.find(p => p.id === 'antigravity'));
      const c = ui.providers.find((p: any) => p.id === 'codex');
      stage.dataset.codex = String(c?.gauge?.remainingPercent ?? '');
      return ui;
    } finally { refreshing = false; }
  }
  /** QuotaDeck's samples for the current Antigravity window, read back from its own history file, and its output. */
  function readEstimate(agy: any) {
    const bucket = agy?.groups?.[0]?.buckets?.[0];
    if (!bucket) return;
    const rows: { key: string; at: number; value: number }[] = JSON.parse(main!.fs.files.get(HISTORY_FILE) ?? '[]');
    const mine = rows.filter(r => { const k = JSON.parse(r.key); return k[1] === 'antigravity' && k[3] === bucket.bucketId && k[4] === bucket.resetTime; });
    const broke = sampleKey !== '' && sampleKey !== bucket.resetTime;
    sampleKey = bucket.resetTime;
    samples = mine.map(r => ({ at: r.at, value: r.value * 100 }));
    const burn = Number.isFinite(bucket.burnPerHour) ? bucket.burnPerHour : null;
    const hoursLeft = Number.isFinite(bucket.estimatedHoursLeft) ? bucket.estimatedHoursLeft : null;
    estimate = { at: sim.t, value: bucket.remainingFraction * 100, burn, hoursLeft, resetAt: Date.parse(bucket.resetTime) };
    paintEstimate(broke);
  }
  function pushUi(next: any) {
    pendingUi = next;
    const active = frame.contentDocument?.activeElement as Element | null | undefined;
    if (pointerDown || active?.closest?.(HOT)) return;                    // sent when the press or the edit ends
    const wait = 500 - (performance.now() - lastPush);
    if (wait > 0) { if (!flushTimer) flushTimer = window.setTimeout(() => { flushTimer = 0; if (pendingUi) pushUi(pendingUi); }, wait); return; }
    lastPush = performance.now(); const snapshot = pendingUi; pendingUi = null; bridge.push(snapshot);
  }
  // After pointerup the click is still to come; a synchronous re-render would remove its target first.
  const flushSoon = () => setTimeout(() => { if (pendingUi) pushUi(pendingUi); }, 0);
  function paintEstimate(broke: boolean) {
    // quota-history.cjs line 50: this key's rows within the last hour, before the current sample is pushed (line 63)
    const e = estimate!, series = samples.filter(r => r.at >= e.at - H && r.at < e.at), n = series.length, untilReset = (e.resetAt - sim.t) / H;
    const eta = $('qd-eta');
    if (sim.lanes[2].rem <= 0) eta.textContent = T.eta.exhausted;
    else if (e.burn === null) eta.textContent = T.eta.sampling(n);
    else if (e.burn <= 0) eta.textContent = T.eta.stable;
    else if (e.hoursLeft !== null) eta.textContent = `${T.eta.left(e.burn.toFixed(1), e.hoursLeft.toFixed(1))} ${T.eta.source}`;
    else eta.textContent = `${T.eta.noExhaust(e.burn.toFixed(1))} ${T.eta.source}`;
    code.reset();
    code.flash(50); code.count(50, T.code.samples(n));
    if (broke) { code.flash(54, 'red'); code.count(54, T.code.broke); }
    if (e.burn !== null && n >= 2) {
      code.count(56, T.code.span(n, Math.round((e.at - series[0].at) / M)));
      code.on(57); code.count(57, T.code.burn(e.burn.toFixed(1)));
      code.on(58); code.count(58, e.burn > 0 ? T.code.hours((e.value / e.burn).toFixed(1)) : '→ null');
      code.on(59); code.count(59, T.code.untilReset(untilReset.toFixed(1)));
      code.heat(57, Math.min(1, e.burn / 45));
      if (e.hoursLeft !== null) { code.on(60, 'red'); code.count(60, T.code.shown(e.hoursLeft.toFixed(1))); } else code.count(60, T.code.notShown);
    } else if (!broke) code.count(56, T.code.short);
  }

  /* ---------- the bridge the hosted UI talks to ---------- */
  const bridge = createBridge({
    refresh: () => refresh(),
    startCollab: agents => {
      collab = { at: performance.now(), agents }; collabDone = 0; stage.dataset.collab = 'running';
      const btn = $<HTMLButtonElement>('qd-collab');
      keepFocus = document.activeElement === btn;                          // disabling drops focus to <body>; it comes back after
      btn.disabled = true; strip();
    },
    simNow: () => sim.t,
  }, VERSION);
  let keepFocus = false;
  bridge.api.onCollaborationState(s => {
    if (!s.running && collab) {
      const finished = collab, btn = $<HTMLButtonElement>('qd-collab');
      stage.dataset.collab = 'done'; btn.disabled = false; strip(true);
      if (keepFocus && document.activeElement === document.body) btn.focus();
      keepFocus = false;
      setTimeout(() => { if (collab === finished) collab = null; }, 1500);   // only this run: a new one may have started
    }
  });
  function strip(done = false) {
    const all = collab?.agents.length ?? 4, box = $('qd-strip');
    box.classList.toggle('run', !done); box.classList.toggle('done', done);
    $('qd-strip-k').textContent = done ? T.stripDone(all) : T.stripRun(collabDone, all);
    $('qd-strip-v').textContent = T.disclaimer;
  }

  /* ---------- the time machine ---------- */
  const tm = createTimeMachine($('qd-body'), $<HTMLCanvasElement>('qd-tl'), $<HTMLCanvasElement>('qd-fx'), T.tl, {
    reduced, light,
    anchor: () => {
      const doc = frame.contentDocument, body = $('qd-body').getBoundingClientRect(), fr = frame.getBoundingClientRect();
      if (!doc) return null;
      const k = fr.width / 520, rows: Partial<Record<AgentId, number>> = {};
      for (const id of ALL_AGENTS) {
        // The row the visitor can see: the provider on the quota tab, the agent's checkbox on the 协作 tab.
        const el = [...doc.querySelectorAll(`[data-provider="${id}"] .provider-summary, #agentChoices input[value="${id}"]`)]
          .map(e => e.closest('.agent-choice') ?? e).find(e => e.getBoundingClientRect().height > 0);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        rows[id] = clampY(fr.top - body.top + (r.top + r.height / 2) * k, fr.top - body.top, fr.bottom - body.top);
      }
      return { right: fr.right - body.left, rows };
    },
    onHit: () => { const w = $('qd-window'); w.classList.remove('hit'); void w.offsetWidth; w.classList.add('hit'); },
  });

  function paintClock() {
    const s = hhmm(sim.t);
    if ($('qd-clock-text').textContent !== s) { $('qd-clock-text').textContent = s; reels($('qd-clock'), s); }
    const day = T.day(Math.floor((sim.t - new Date(2026, 9, 5).getTime()) / (24 * H)) + 1);
    if ($('qd-day').textContent !== day) $('qd-day').textContent = day;
  }
  function state(): TmState { return { t: sim.t, lanes: sim.lanes, marks: sim.marks, samples, estimate, collab }; }
  function advance(dtReal: number) {
    const simDt = dtReal * speed, n = Math.max(1, Math.ceil(simDt / 20_000));
    for (let k = 0; k < n; k++) {
      for (const lane of sim.lanes) lane.agent = !!collab && collab.agents.includes(lane.id as AgentId) && agentPhase(lane.id as AgentId, (performance.now() - collab.at) / 1000) === 'run';
      for (const id of sim.step(simDt / n, dtReal / n)) onReset(id);
    }
    if (collab) {
      const el = (performance.now() - collab.at) / 1000, d = collab.agents.filter(id => agentPhase(id, el) === 'done').length;
      stage.dataset.agents = collab.agents.map(id => `${id}:${agentPhase(id, el)}`).join(' ');
      if (d !== collabDone && el < collabEnd(collab.agents)) { collabDone = d; strip(); }
    }
    if (sim.t >= nextRefresh) { nextRefresh = (Math.floor(sim.t / REFRESH) + 1) * REFRESH; void refresh(); }
    // Paused: once a big task or an agent's load has drained, QuotaDeck reads again so its window shows it too.
    const draining = sim.lanes.some(l => l.drop > 0 || l.agent);
    if (speed === 0 && wasDraining && !draining) void refresh();
    wasDraining = draining;
  }
  function onReset(id: LaneId) { resets++; stage.dataset.resets = String(resets); tm.sweep(sim.lanes.find(l => l.id === id)!, sim.t); }
  function frameLoop(now: number) {
    raf = 0;
    if (!visible || failed) return;
    const dtReal = lastReal ? Math.min(100, now - lastReal) : 16; lastReal = now;   // a hidden tab never jumps hours ahead
    advance(dtReal);
    paintClock();
    tm.draw(state(), now);
    raf = requestAnimationFrame(frameLoop);
  }
  const run = () => { if (!raf && visible && !failed) { lastReal = 0; raf = requestAnimationFrame(frameLoop); } };

  function setSpeed(v: number) {
    speed = v;
    root.querySelectorAll<HTMLButtonElement>('#qd-speeds [data-sp]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.sp) === v)));
    $('qd-clock').classList.toggle('fast', v === 600);
  }
  root.querySelectorAll<HTMLButtonElement>('#qd-speeds [data-sp]').forEach(b => { b.onclick = () => setSpeed(Number(b.dataset.sp)); });
  $('qd-task').onclick = () => { sim.bigTask(); tm.shock(sim.lanes[0], performance.now()); };
  $('qd-collab').onclick = () => { void bridge.api.runCollaboration({ task: T.collabTask, agents: ALL_AGENTS }).catch(() => {}); };

  /* ---------- start: load QuotaDeck's code, host its UI, run ---------- */
  function fail(why: string) {
    if (failed) return;
    failed = true; console.error('QuotaDeck demo:', why);
    // Only the screenshots remain: the heading and intro describe a window that is no longer there.
    root.querySelector<HTMLElement>('.qd-head')!.hidden = true;
    stage.hidden = true; $('qd-fallback').hidden = false; stage.dataset.state = 'failed';
  }
  window.__quotaDeckFailed = fail;
  async function start() {
    try {
      main = await loadQuotaDeck(async p => { const r = await fetch(QD_DIR + p); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.text(); }, clock);
      main.configureHistory(HISTORY_FILE);
      read = main.createProviderReader(Object.fromEntries(PROVIDER_IDS.map(id => [id, async () => sim.raw(id)])));
      if (reduced) {                                                       // a still frame with QuotaDeck's estimate already there
        setSpeed(0);
        for (let k = 0; k < 90; k++) { sim.step(REFRESH, 0); clock.now = sim.t; await refresh(); }
        nextRefresh = sim.t + REFRESH;
      } else { setSpeed(600); await refresh(); }
      window.__quotaDeckBridge = bridge.api;
      frame.src = frame.dataset.src!;
      stage.dataset.state = 'running';
      visible = true; run();
      new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible) run(); }).observe(stage);
    } catch (e) { fail((e as Error).message); }
  }
  frame.addEventListener('load', () => {
    // host.js sets window.quotaDeck before its first await; a missing host page or script leaves it unset.
    if (frame.getAttribute('src') && !(frame.contentWindow as (Window & { quotaDeck?: unknown }) | null)?.quotaDeck) { fail('host.html / host.js did not load'); return; }
    tm.layout();
    const w = frame.contentWindow!, d = frame.contentDocument!;
    w.addEventListener('pointerdown', () => { pointerDown = true; }, true);
    for (const t of ['pointerup', 'pointercancel']) w.addEventListener(t, () => { pointerDown = false; flushSoon(); }, true);
    d.addEventListener('focusout', flushSoon, true);
  });
  new ResizeObserver(() => { const k = Math.min(0.8, $('qd-window').clientWidth / 520); frame.style.transform = `scale(${k})`; $('qd-window').style.height = `${840 * k}px`; tm.layout(); }).observe($('qd-window'));
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); void start(); } }, { rootMargin: '200px' });
  io.observe(stage);
}
```

- [ ] **Step 5: 写 `src/components/QuotaLive.astro`**

```astro
---
import CodeLive from './CodeLive.astro';
import { QUOTA_TEXT } from '../scripts/qd-live-text';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const T = QUOTA_TEXT[lang];
---
<section class="quota-live" data-quota-live data-demo data-lang={lang} aria-labelledby="qd-title">
  <div class="wrap qd-head">
    <div class="section-head"><h2 id="qd-title">{T.title}</h2><span class="meta">{T.meta}</span></div>
    <p class="qd-intro">{T.intro}</p>
  </div>
  <div class="qd-stage night-zone" id="qd-stage" data-state="idle" data-resets="0" data-collab="idle" data-agents="">
    <div class="qd-top">
      <div class="qd-clockwrap">
        <div class="qd-clock fast" id="qd-clock" aria-hidden="true">09:00</div>
        <div class="qd-meta"><span class="qd-chip">{T.simClock} · <span id="qd-clock-text">09:00</span></span><span class="qd-day" id="qd-day"></span></div>
      </div>
      <div class="qd-ctl">
        <div class="qd-speeds" id="qd-speeds" role="group" aria-label={T.speedLabel}>
          <button type="button" class="qd-btn" data-sp="0" aria-pressed="false">{T.pause}</button>
          <button type="button" class="qd-btn" data-sp="1" aria-pressed="false">1×</button>
          <button type="button" class="qd-btn" data-sp="60" aria-pressed="false">60×</button>
          <button type="button" class="qd-btn" data-sp="600" aria-pressed="true">600×</button>
        </div>
        <button type="button" class="qd-btn red" id="qd-task">{T.bigTask}</button>
        <button type="button" class="qd-btn" id="qd-collab">{T.collab}</button>
      </div>
    </div>
    <div class="qd-body" id="qd-body">
      <div class="qd-appcol">
        <div class="qd-apphead">{T.appHead}</div>
        <div class="qd-window" id="qd-window"><iframe id="qd-frame" title={T.frameTitle} data-src="/assets/quotadeck/host.html" width="520" height="840"></iframe></div>
      </div>
      <div class="qd-tl"><canvas id="qd-tl" role="img" aria-label={T.tl.title}></canvas></div>
      <canvas class="qd-fx" id="qd-fx" aria-hidden="true"></canvas>
    </div>
    <p class="qd-eta" id="qd-eta"></p>   <!-- rewritten about ten times a second at 600×: not a live region -->
    <div class="qd-strip" id="qd-strip"><b id="qd-strip-k">{T.stripIdleK}</b><span id="qd-strip-v">{T.stripIdle}</span></div>
    <div class="qd-code"><CodeLive id="qd-code" file="public/assets/quotadeck/e9557c6/src/main/quota-history.cjs" first={50} last={61} title={T.codeTitle} meta={T.codeMeta} label={T.codeLabel} /></div>
    <p class="qd-note">{T.note}</p>
  </div>
  <p class="wrap qd-fallback" id="qd-fallback" hidden>{T.fallback}</p>
</section>
<script>
  import { initQuotaLive } from '../scripts/qd-live';
  document.querySelectorAll<HTMLElement>('[data-quota-live]').forEach(initQuotaLive);
</script>
<style>
  .quota-live { --qd-line: color-mix(in srgb, var(--night-fg) 14%, transparent); padding-bottom: 32px; overflow-x: clip; }
  .qd-intro { max-width: 60em; margin: 14px 0 18px; }
  .qd-stage { position: relative; max-width: 1600px; margin-inline: auto; overflow: hidden; }
  .qd-stage[hidden] { display: none; }
  .qd-top { display: flex; justify-content: space-between; align-items: center; gap: 12px 16px; flex-wrap: wrap; padding: 14px var(--gutter) 12px; border-bottom: 1px solid var(--qd-line); }
  .qd-clockwrap { display: flex; align-items: center; gap: 16px; }
  .qd-clock { display: inline-flex; font: 700 48px/1 var(--font-display); letter-spacing: .02em; color: var(--night-fg); }
  .qd-clock :global(.reel) { display: inline-block; height: 1em; overflow: hidden; }
  .qd-clock :global(.strip) { display: block; width: .55em; text-align: center; line-height: 1em; word-break: break-all; transition: transform .14s cubic-bezier(.2,.8,.2,1); }
  .qd-clock.fast :global(.reel:last-child) { -webkit-mask-image: linear-gradient(180deg, transparent, #000 26%, #000 74%, transparent); mask-image: linear-gradient(180deg, transparent, #000 26%, #000 74%, transparent); }
  .qd-clock.fast :global(.reel:last-child .strip) { filter: blur(1.6px); }
  .qd-meta { display: flex; flex-direction: column; gap: 6px; }
  .qd-chip { padding: 2px 8px; border: 1px solid var(--red); font: 600 12px Consolas, 'Cascadia Mono', monospace; letter-spacing: .06em; color: var(--night-fg); }
  .qd-day { font: 600 13px Consolas, monospace; color: var(--night-mute); letter-spacing: .06em; }
  .qd-ctl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .qd-speeds { display: flex; margin-right: 12px; }
  .qd-speeds .qd-btn { min-width: 56px; font-family: Consolas, monospace; }
  .qd-speeds .qd-btn + .qd-btn { margin-left: -1.5px; }
  .qd-btn { padding: 8px 14px; border: 1.5px solid var(--night-fg); background: transparent; color: var(--night-fg); font-weight: 700; font-size: 13px; cursor: pointer; }
  .qd-btn.red { border-color: var(--red); }
  .qd-btn[aria-pressed="true"], .qd-btn:hover:not(:disabled) { background: var(--night-fg); color: var(--night); }
  .qd-btn:disabled { opacity: .45; cursor: default; }
  .qd-body { position: relative; display: grid; grid-template-columns: 452px minmax(0, 1fr); min-height: 712px; }
  .qd-appcol { padding: 18px; border-right: 1px solid var(--qd-line); }
  .qd-apphead { margin-bottom: 8px; font-size: 12px; color: var(--night-mute); }
  .qd-window { position: relative; width: 100%; max-width: 416px; height: 672px; overflow: hidden; border-radius: 10px; box-shadow: 0 20px 50px color-mix(in srgb, var(--night) 70%, transparent); }
  .qd-window.hit { animation: qd-shake .38s cubic-bezier(.36,.07,.19,.97); }
  @keyframes qd-shake { 12% { transform: translate(-7px, 1px); } 28% { transform: translate(6px, -2px); } 44% { transform: translate(-5px, 2px); } 60% { transform: translate(4px, -1px); } 76% { transform: translate(-2px, 1px); } 100% { transform: none; } }
  .qd-window iframe { position: absolute; left: 0; top: 0; width: 520px; height: 840px; border: 0; transform-origin: 0 0; transform: scale(.8); background: var(--night); }
  .qd-tl { position: relative; min-width: 0; }
  .qd-tl canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
  .qd-fx { position: absolute; inset: 0; z-index: 3; display: block; width: 100%; height: 100%; pointer-events: none; }
  .qd-eta { min-height: 36px; padding: 8px var(--gutter); border-top: 1px solid var(--qd-line); font: 13px Consolas, 'Cascadia Mono', monospace; color: var(--night-fg); }
  .qd-strip { display: flex; align-items: center; gap: 14px; min-height: 40px; padding: 0 var(--gutter); border-top: 1px solid var(--qd-line); font-size: 13px; color: var(--night-mute); }
  .qd-strip b { font: 600 12px Consolas, monospace; letter-spacing: .04em; color: var(--night-mute); white-space: nowrap; }
  .qd-strip.run b, .qd-strip.done, .qd-strip.done b { color: var(--night-fg); }
  .qd-strip.done { background: color-mix(in srgb, var(--night-fg) 5%, transparent); }
  .qd-code { padding: 12px var(--gutter) 14px; border-top: 1px solid var(--qd-line); }
  .qd-note { padding: 10px var(--gutter) 12px; border-top: 1px solid var(--qd-line); font-size: 12px; color: var(--night-mute); }
  .qd-fallback { margin: 12px auto; }
  .qd-head[hidden] { display: none; }
  @media (max-width: 1000px) {
    .qd-body { grid-template-columns: minmax(0, 1fr); }
    .qd-appcol { display: flex; flex-direction: column; align-items: center; border-right: 0; border-bottom: 1px solid var(--qd-line); }
    .qd-tl { height: 380px; }
  }
  @media (max-width: 600px) {
    .qd-clock { font-size: 36px; }
    .qd-speeds { margin-right: 0; }
    .qd-tl { height: 320px; }
    .qd-strip { flex-wrap: wrap; padding-block: 8px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .qd-window.hit { animation: none; }
    .qd-clock :global(.strip) { transition: none; }
    .qd-clock.fast :global(.reel:last-child .strip) { filter: none; }
  }
</style>
```

- [ ] **Step 6: 页面接入与截图区标题**

`src/views/QuotaView.astro`：frontmatter 加 `import QuotaLive from '../components/QuotaLive.astro';`，`<QuotaShots slot="demo" lang={lang} />` 之前加 `<QuotaLive slot="demo" lang={lang} />`。

`src/components/QuotaShots.astro`：`const title = zh ? '在本机运行的界面' : 'The interface, running locally';` 改为 `const title = zh ? '桌面版真实截图' : 'The desktop app: real screenshots';`。

- [ ] **Step 7: 运行 QuotaDeck 页端到端测试**

Run: `npx playwright test tests/e2e/quota-live.spec.ts`
Expected: 桌面 18 passed、手机 1 passed（其余手机用例按设计跳过）。

- [ ] **Step 8: 与这一页相关的既有测试**

Run: `npx playwright test tests/e2e/phase2b.spec.ts tests/e2e/numbers.spec.ts tests/e2e/a11y.spec.ts tests/e2e/links.spec.ts tests/e2e/layout.spec.ts`
Expected: 全部通过（`[data-demo]` 被数字测试排除）。整页无障碍测试默认也会分析 iframe：QuotaDeck 原样界面的和纸配色（#887f70 在 #f2ede2 上约 3.4:1）是被展示的作品，不属于本站 tokens，会被报为严重对比度问题、而且要看 iframe 是否已渲染，时过时不过。所以先改 `tests/e2e/a11y.spec.ts`：把 `new AxeBuilder({ page }).analyze()` 改为 `new AxeBuilder({ page }).exclude('#qd-frame').analyze()`，上方加注释"QuotaDeck's tray UI is vendored unmodified at e9557c6 (exhibited work); its own palette is outside this site's tokens. The page chrome around it is still checked."，再运行上面的命令。

- [ ] **Step 9: 提交**

```bash
git add src/scripts/qd-live-text.ts src/scripts/qd-live.ts src/components/QuotaLive.astro src/views/QuotaView.astro src/components/QuotaShots.astro tests/e2e/quota-live.spec.ts tests/e2e/a11y.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "QuotaDeck page: the time machine — its real tray UI and quota-history on a simulated clock, big task, parallel run without invented answers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 验收

**Files:** 无新文件（截图放在 `.superpowers/`，不提交）。

- [ ] **Step 1: 全量单元测试** — Run: `npx vitest run`；Expected: 全部通过，记下总数。
- [ ] **Step 2: 全量端到端测试** — Run: `npx playwright test`；Expected: 全部通过，记下总数。有失败先按 superpowers:systematic-debugging 查根因，不放宽断言。
- [ ] **Step 3: 看效果**：用 Playwright（Edge）截 1440、1024、390 三种宽度，以及 600× 运行中、重置扫描、大任务冲击、四个 Agent 协作中、协作完成、减少动态效果、英文页；逐张查看：文字不重叠、真实窗口可读、时间轴标签不压线、耗尽倒计时与窗口里"按近期速度约 X 小时耗尽"一致。
- [ ] **Step 4: 性能抽查**：600× 运行与协作进行中各采 3 秒帧间隔，桌面平均 ≥ 50 fps。
- [ ] **Step 5: 独立审查**：派一位审查员（最强模型）对照规格第 3、5、6 节与本计划审整个分支本计划的改动，重点看 Review Focus 五条。
- [ ] **Step 6: 记录与交付**：Obsidian 收件箱新建 `YYYYMMDD-HHMMSS-Claude Code-作品集QuotaDeck时间机器上线.md`；`npm run build && npm run preview` 后替用户打开 `http://localhost:4321/projects/quota-deck/`。
