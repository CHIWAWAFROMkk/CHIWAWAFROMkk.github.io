# QuotaDeck 新完整版（贴边 HUD）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/projects/quota-deck/live/` 换成在浏览器里运行 QuotaDeck 0.6.0 真实 HUD 前端的演示：自动播放一个"下午"的剧本，访客可以随时插手；同时把 QuotaDeck 的简易版页面、卡片、截图和文案换成新版本。

**Architecture:** QuotaDeck 974c61d 的 HUD 前端文件与四个纯逻辑模块原样搬进 `public/assets/quotadeck/974c61d/`。作品集提供 `window.hud` 桥接，前端照常运行；会话状态与界面数据由页面里求值的 `session-tracker.cjs`、`hud-view.cjs`、`hud-geometry.cjs` 算出。剧本是纯函数，按模拟时钟产生事件，驱动器把它们喂给真实的状态机。

**Tech Stack:** Astro 7、TypeScript、Vitest、Playwright（msedge）。不新增依赖。

**Spec:** `docs/superpowers/specs/2026-10-22-quotadeck-hud-live-design.md`

## Global Constraints

- 不新增依赖；不改 `package.json` 的依赖列表。
- 搬来的文件**逐字节一致**，SHA-256 写入清单并由测试校验；文件从 QuotaDeck 的 git 对象库读（`git show <commit>:<path>`），不读工作区。
- 固定提交：`974c61d268ae7c1852370c6c8f9cd046d7a9d0f7`（QuotaDeck 0.6.0，刘海已合并）。
- 页面不读访客机器、不发对外请求：加载器只放行清单里的四个 `.cjs`，任何其他 `require` 都报错"网页演示没有提供模块"。
- 批准 / 拒绝只改演示状态，不执行任何命令；页面明示"模拟数据 · 批准按钮只影响演示，不执行任何命令"。
- 署名：界面复刻自 Agent HUD（jazzenchen/agent-hud-open，Apache-2.0）；QuotaDeck MIT；随附 `LICENSE`、`assets/fonts/LICENSE-inter.txt`（OFL 1.1）、`assets/logos/LICENSE-lobe-icons.txt`（MIT）。
- 文案红线沿用前两期：不写独立 / solo / independent / 100% / 闭环 / 持续运行；新文案追加到 `docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md`，用户确认前不上线。
- 中英双语；HRIS 站的同名页面通过 `track` 自动跟随，链接留在 `/hris/` 内。
- 动效四档：`off` 不自动播放（"下一步"逐步推进），`gentle` 只保留淡入淡出；没有脚本时显示截图。
- 提交用 `git -c user.name=yoshi -c user.email=todoranmully529@gmail.com commit`，结尾 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`；不推送。
- **上线前置条件**（不属于本计划的任务）：QuotaDeck 的 974c61d 需要推送到 GitHub，清单里的仓库链接才能打开；推送与否由用户决定。

## Review Focus

1. 访客切到别的标签页再回来：模拟时钟暂停，回来后不会一次涌出一串事件。
2. 一轮结束、剧本重开后，访客才点旧的 Allow / Deny：请求已经不在了，点击被忽略，页面不报错。
3. 360 px 手机：桌面框等比缩小，打开的卡片完整可读，没有横向滚动。
4. 关闭动效：不自动播放，"下一步"能走完全部节拍；iframe 里 HUD 自己的动画也停。
5. 搬来的文件加载失败（404、断网）：显示截图后备，舞台不留白。

---

## File Structure

| 文件 | 职责 |
|---|---|
| `tools/quotadeck-vendor.mjs`（重写） | 从 QuotaDeck git 对象库复制 HUD 文件与纯逻辑模块，写清单；用 QuotaDeck 自己的 `providerToUi` 生成剧本关键帧 |
| `public/assets/quotadeck/974c61d/**` | 搬来的文件 + `manifest.json` |
| `src/data/qd-hud-fixture.json` | 关键帧：四份 `ui`（`buildHudItems` 的输入）与 Token 原始序列，由工具生成 |
| `src/scripts/qd-hud-load.ts` | 在页面里求值四个 `.cjs`，导出 `QD_HUD_COMMIT`、`QD_HUD_DIR`、`loadHudMain` |
| `src/scripts/qd-hud-scenario.ts` | 纯函数剧本：节拍、事件、关键帧、提示 |
| `src/scripts/qd-hud-bridge.ts` | `window.hud` 的网页版 |
| `src/scripts/qd-hud-live.ts` | 驱动器：时钟、暂停 / 重开 / 下一步、推送、布局、后备 |
| `src/scripts/qd-hud-text.ts` | 中英文案 `QD_HUD_TEXT` |
| `public/assets/quotadeck/hud-host.html`、`hud-host.js`、`hud-host-off.css`、`hud-host-gentle.css` | iframe 宿主（作品集自己的文件，不进清单） |
| `src/components/QuotaHudLive.astro` | 舞台、控制条、说明行、署名、后备 |
| `src/components/QuotaShots.astro`（改） | 换成新 HUD 截图，简易版与完整版后备共用 |

保留不动：`src/scripts/qd-sim.ts` 与 `PlateQuota`（简易版的"额度池"图版仍然成立，它们不依赖 e9557c6）。

---

### Task 1: 搬运 974c61d 并生成剧本关键帧

**Files:**
- Modify: `tools/quotadeck-vendor.mjs`
- Create: `public/assets/quotadeck/974c61d/**`、`src/data/qd-hud-fixture.json`
- Test: `tests/unit/quotadeck-hud-vendor.test.ts`

**Interfaces:**
- Produces：清单 `public/assets/quotadeck/974c61d/manifest.json` = `{ repository, commit, version: '0.6.0', files: [{ path, bytes, sha256 }] }`；`qd-hud-fixture.json` = `{ commit, base: number /* ms, 2026-10-22T14:00:00+08:00 */, keyframes: [{ at: number /* 剧本毫秒 */, ui: { providers: [...] } }], tokens: { claude: RawSeries, codex: RawSeries } }`，`RawSeries` 即 `buildHudTokens` 的输入（`status, startAt, partial, stacks, buckets, models, total`）。

- [ ] **Step 1: 写失败的测试** `tests/unit/quotadeck-hud-vendor.test.ts`
  - `it('pinned to 974c61d, version 0.6.0')`：清单 `commit === '974c61d268ae7c1852370c6c8f9cd046d7a9d0f7'`、`version === '0.6.0'`、`repository === 'https://github.com/CHIWAWAFROMkk/quota-deck'`。
  - `it('carries exactly the HUD, its four pure modules, fonts, logos and licences')`：`files.map(f => f.path)` 等于 FILES（见 Step 3）。
  - `it('every file matches its SHA-256 and size')`：同旧测试写法。
  - `it('the renderer loads only files that are vendored')`：解析 `src/renderer/hud.html` 的 `<script src>` 与 `<link href>`，每个都在清单里；`hud.css` 里的 `url(...)` 与 `hud-dom.js` 里的 logo 路径解析后都在清单里。
  - `it('the fixture comes from the same commit and has four keyframes')`：`fixture.commit` 同上；`keyframes.map(k => k.at)` 为 `[0, 20000, 45000, 70000]`；每帧 `ui.providers.map(p => p.id)` 为 `['codex','claude','antigravity','workbuddy','deepseek']`。
  - `it('no fixture string carries a personal path or markup')`：`JSON.stringify(fixture)` 不含 `yoshi`、`<`。
- [ ] **Step 2: 跑测试确认失败**：`npx vitest run tests/unit/quotadeck-hud-vendor.test.ts` → FAIL（清单不存在）。
- [ ] **Step 3: 重写 `tools/quotadeck-vendor.mjs`**，沿用旧版结构（检查 `HEAD === COMMIT`、`git show` 读字节、写清单），另加：检查 `git -C root status --porcelain src/main` 为空。
  - `COMMIT = '974c61d268ae7c1852370c6c8f9cd046d7a9d0f7'`
  - FILES（顺序即清单顺序）：`src/renderer/hud.html`、`chart.css`、`hud.css`、`hud-metrics.js`、`hud-dom.js`、`hud-bots.js`、`hud-strip.js`、`hud-notch-metrics.js`、`hud-notch.js`、`hud-chart.js`、`hud-card.js`、`hud-settings.js`、`hud.js`（均在 `src/renderer/` 下）；`src/main/hud-view.cjs`、`session-tracker.cjs`、`hud-geometry.cjs`、`model-names.cjs`；`assets/fonts/inter-latin-wght-normal.woff2`、`assets/fonts/LICENSE-inter.txt`；`assets/logos/{codex,claude,antigravity,workbuddy,deepseek}.svg`、`assets/logos/LICENSE-lobe-icons.txt`；`LICENSE`。
  - 关键帧：在 Node 里 `require(root/src/main/snapshot.cjs).providerToUi` 与 `claude-oauth.cjs` 的 `parseUsage`（两者都是纯转换，不读凭证），输入沿用 QuotaDeck 冒烟测试的合成值，`now = base + at`：Codex 5h 剩 51%（重置 +150 分）、周剩 70%；Claude `five_hour.utilization` 依次 12 / 48 / 73 / 73，`seven_day` 79，`seven_day_opus` 60，`max_20x`，消耗速率 `[6.3, 1.4, 0.8]`；Antigravity 剩 0.91；WorkBuddy 660 / 1000；DeepSeek 余额 `8.85` / `8.85` / `8.85` / `8.61` CNY，`models: []`（不要冒烟里那条用来测转义的标记）。
  - Token：Claude 96 格，同冒烟的 `stacks` 规则，模型 `Opus 5.5`、`Fable 5.1`；Codex `status: 'unsupported'`。`startAt` 用 `token-ledger.cjs` 的 `windowStart(base)`。
  - 写 `src/data/qd-hud-fixture.json`（两空格缩进）。删掉 `package.json` 里的 `quotadeck:shots` 脚本行（`quotadeck:vendor` 保留）。
- [ ] **Step 4: 运行工具**：`QUOTADECK_ROOT="C:/Users/yoshi/Documents/ChatGPT/额度显示器" npm run quotadeck:vendor` → 输出 `26 files → public/assets/quotadeck/974c61d`。
- [ ] **Step 5: 跑测试**：同 Step 2 → PASS。
- [ ] **Step 6: 提交**：`git add tools/quotadeck-vendor.mjs package.json public/assets/quotadeck/974c61d src/data/qd-hud-fixture.json tests/unit/quotadeck-hud-vendor.test.ts`，信息 `QuotaDeck 974c61d vendored: HUD renderer, four pure modules, fonts, logos and licences; scenario keyframes from its own providerToUi`。

### Task 2: 页面内加载器

**Files:**
- Create: `src/scripts/qd-hud-load.ts`
- Test: `tests/unit/qd-hud-load.test.ts`

**Interfaces:**
- Consumes：Task 1 的文件与清单。
- Produces：`QD_HUD_COMMIT: string`、`QD_HUD_DIR = '/assets/quotadeck/974c61d/'`、`QD_HUD_MAIN = ['src/main/model-names.cjs','src/main/hud-view.cjs','src/main/session-tracker.cjs','src/main/hud-geometry.cjs']`；`loadHudMain(fetchText: (path: string) => Promise<string>): Promise<HudMain>`，`HudMain = { view: { buildHudItems(ui, now): Item[]; buildHudTokens(raw): Tokens }; tracker: { createSessionTracker(o: { startedAt: number }): Tracker }; geometry: { layoutHud(o): Layout; layoutNotch(o): Layout; normalizeHudSettings(s): Settings } }`。`Tracker = { ingest(vendor, event): void; setApprovals(list): void; snapshot(now: number): Sessions; dismiss(ids: string[]): void }`。

- [ ] **Step 1: 写失败的测试**：用 `readFile('public' + QD_HUD_DIR + path)` 作 `fetchText`。
  - `buildHudItems(fixture.keyframes[0].ui, base).map(i => i.id)` 为五家顺序；Claude 的 `ring.level === 'warn'`（周 79%）。
  - `createSessionTracker({ startedAt: base })` 依次 `ingest('claude', meta{source:'claude-vscode'})`、`prompt`、`turn-end{error:false}` 后，`snapshot(now).alerts[0].kind === 'reply'`。
  - 一个 `require('node:fs')` 的模块源码（测试里手写的第五个文件名）被拒绝，报错含"网页演示没有提供模块"。
- [ ] **Step 2: 跑测试确认失败**：`npx vitest run tests/unit/qd-hud-load.test.ts`。
- [ ] **Step 3: 实现**：求值方式与旧 `qd-load.ts` 相同（`new Function('require','module','exports', src + sourceURL)`、模块缓存），`require` 只解析 `./<name>.cjs` 到 `QD_HUD_MAIN` 中的文件。不注入 `Date`、`process`。
- [ ] **Step 4: 跑测试** → PASS。
- [ ] **Step 5: 提交**：`QuotaDeck HUD loader: four vendored pure modules evaluated in the page, nothing else resolvable`。

### Task 3: 剧本

**Files:**
- Create: `src/scripts/qd-hud-scenario.ts`
- Test: `tests/unit/qd-hud-scenario.test.ts`

**Interfaces:**
- Consumes：`HudMain`（测试里用真实加载器 + 真实 tracker）。
- Produces：
  - `LOOP_MS = 90_000`、`HINT_AFTER_MS = 20_000`、`APPROVAL_ID = 'req-demo-1'`
  - `BEATS: { at: number; id: BeatId; note: Bi }[]`，`BeatId = 'start' | 'claude-done' | 'codex-start' | 'approval' | 'codex-done' | 'tokens' | 'loop'`，`at` 依次 `0, 12000, 20000, 32000, 50000, 70000, 90000`。
  - `eventsBetween(from: number, to: number, base: number): { vendor: 'claude' | 'codex'; event: object }[]`（半开区间 `(from, to]`，`from = -1` 含 0 时刻）。
  - `approvalsAt(t: number, base: number, decided: 'allow' | 'deny' | null): ApprovalRequest[]`
  - `keyframeAt(t: number): number`（关键帧下标）、`tokensAt(t: number, raw: RawSeriesPair): RawSeriesPair`，`RawSeriesPair = { claude: RawSeries; codex: RawSeries }`（70 s 起 Claude 最后一格加 240000）
  - `noteAt(t: number): Bi`、`hintAt(t: number, decided): boolean`（`t >= 32000 + HINT_AFTER_MS && decided === null`）

剧本事件（时间均为剧本毫秒，事件 `at = base + t`）：
- Claude 会话 A：0 `meta{source:'claude-vscode'}`、`title{title:'Build the iOS dashboard'}`、`prompt`；12000 `turn-end{text:'The dashboard builds, and all 42 tests pass.', error:false, model:'claude-fable-5-1'}`；18000 `prompt{text:'Run the build'}`；20000 `tool-call{callId:'c1', label:'Bash: npm run build'}`（不给结果 → 50 s 出现 Waiting）。
- Codex 会话 B：20000 `meta{source:'codex-desktop'}`、`title{title:'Refactor the quota reader'}`、`prompt`；50000 `turn-end{text:'Refactor done; tests pass.', error:false}`。
- 批准：32000 起 `[{ id: APPROVAL_ID, vendor:'claude', sessionId:'C', tool:'Bash', summary:'npm test', at: base+32000 }]`，`decided` 非空后为空。

- [ ] **Step 1: 写失败的测试**（真实 tracker，按 1 s 步长喂 `eventsBetween`，在给定时刻取 `snapshot(base + t)`）：
  - 12.5 s：Claude `phase === 'done'`，有 `kind:'reply'` 提醒。
  - 32.5 s（未决定）：有 `kind:'approval'`，id `approval:req-demo-1`。
  - 32.5 s 决定 `allow` 后：没有 approval 提醒。
  - 50.5 s：Claude 有 `kind:'waiting'`（会话 A），Codex 有 `kind:'reply'`。
  - `keyframeAt(0) === 0`、`keyframeAt(20000) === 1`、`keyframeAt(44999) === 1`、`keyframeAt(70000) === 3`。
  - `hintAt(52000, null) === true`、`hintAt(52000, 'deny') === false`、`hintAt(51999, null) === false`。
  - `eventsBetween(-1, LOOP_MS, base)` 中所有 `at` 都在 `[base, base + LOOP_MS]`。
- [ ] **Step 2: 跑测试确认失败**：`npx vitest run tests/unit/qd-hud-scenario.test.ts`。
- [ ] **Step 3: 实现**：事件表写成常量数组，函数按时间过滤；`BEATS` 的中英文说明照下表：

| id | 中文 | English |
|---|---|---|
| start | 0 s · Claude 开始一轮，图标变成在跑的 bot | 0 s · Claude starts a turn; its icon becomes the working bot |
| claude-done | 12 s · Claude 做完了一轮：笑脸 bot，伸出 New reply | 12 s · Claude finishes: smiling bot and a New reply capsule |
| codex-start | 20 s · Codex 开始；Claude 5 小时额度随消耗上涨 | 20 s · Codex starts; Claude's 5-hour quota climbs as it works |
| approval | 32 s · Claude 请求批准一条命令，等你点 | 32 s · Claude asks to run a command and waits for you |
| codex-done | 50 s · Codex 做完；Claude 的命令 30 秒没结果，显示 Waiting（推测） | 50 s · Codex finishes; Claude's command has run 30 s with no result: Waiting (an inference) |
| tokens | 70 s · Token 柱长出新的一格；DeepSeek 余额减少 | 70 s · A new token bar grows; the DeepSeek balance drops |
| loop | 90 s · 一轮结束，重新开始 | 90 s · The afternoon ends and starts over |

- [ ] **Step 4: 跑测试** → PASS。
- [ ] **Step 5: 提交**：`QuotaDeck demo scenario: one afternoon in 90 s, fed to the real session tracker`。

### Task 4: `window.hud` 桥接

**Files:**
- Create: `src/scripts/qd-hud-bridge.ts`
- Test: `tests/unit/qd-hud-bridge.test.ts`

**Interfaces:**
- Produces：`createHudBridge(o: BridgeOptions): HudBridge`。
  - `BridgeOptions = { initial(): HudInitial; normalizeSettings(s): Settings; onSettings(next: Settings): void; onApprove(id: string, decision: 'allow' | 'deny'): void; onDismiss(ids: string[]): void; onReturn(id: string): void; onOpenStats(): void; onAction(name: string): void }`
  - `HudInitial = { items, tokens, sessions, gaming: false, layout, settings }`
  - `HudBridge` 含 preload-hud 的全部方法（`initial, refresh, action, setSettings, openStats, hits, drag, card, strips, onState, onTokens, onLayout, onSettings, onSessions, onGaming, dismiss, returnTo, approve`），外加 `push: { state(items), tokens(t), sessions(s), settings(s), layout(l) }`。
  - `action(name)` 返回 `{ status: 'unavailable' }` 并调用 `onAction`；`returnTo` 返回 `false` 并调用 `onReturn`；`approve` 对不在当前会话里的 id 不调用 `onApprove`、返回 `false`。

- [ ] **Step 1: 写失败的测试**：
  - 订阅后 `push.state(x)` 送达，调用返回的取消函数后不再送达。
  - `setSettings({ size: 30 })` 返回 `normalizeSettings` 合并后的结果，并 `push.settings` 给订阅者。
  - `approve('approval:req-demo-1','allow')` 在当前会话含该提醒时调用 `onApprove('req-demo-1','allow')`（去掉 `approval:` 前缀）；当前会话不含时不调用、返回 `false`（Review Focus 2）。
  - `hits/drag/card/strips` 不抛错、无副作用。
- [ ] **Step 2: 跑测试确认失败**：`npx vitest run tests/unit/qd-hud-bridge.test.ts`。
- [ ] **Step 3: 实现**：桥接记住最近一次 `push.sessions` 的值，用来判断批准 id 是否还在。
- [ ] **Step 4: 跑测试** → PASS。
- [ ] **Step 5: 提交**：`QuotaDeck window.hud for the browser: pushes, settings, approvals that only change the demo`。

### Task 5: 舞台、宿主与驱动器

**Files:**
- Create: `public/assets/quotadeck/hud-host.html`、`hud-host.js`、`hud-host-off.css`、`hud-host-gentle.css`、`src/scripts/qd-hud-live.ts`、`src/scripts/qd-hud-text.ts`、`src/components/QuotaHudLive.astro`
- Modify: `src/views/LiveView.astro`（`which === 'quota'` 时渲染 `QuotaHudLive` 与 `QuotaShots`，不再渲染 `QuotaLive`）
- Test: `tests/e2e/quota-hud.spec.ts`

**Interfaces:**
- Consumes：Task 2–4。
- Produces：`initQuotaHudLive(root: HTMLElement): void`；DOM：`#qd-stage[data-state="idle"|"running"|"paused"|"stepping"|"failed"]`、`#qd-frame`（iframe）、`[data-qd-note]`、`[data-qd-hint]`、`[data-qd-log]`、`[data-qd-play]`（暂停 / 继续）、`[data-qd-restart]`、`[data-qd-step]`（仅 `off` 档可见）、`[data-qd-style="strip"|"notch"]`、`#qd-fallback`（内含 `QuotaShots`）、`[data-demo]` 包住舞台。`QD_HUD_TEXT` 含：`badge`、`credit`、`pause`、`resume`、`restart`、`step`、`styleStrip`、`styleNotch`、`hint`、`allowed`、`denied`、`returnNote`、`statsNote`、`unavailable`、`failed`，中英文各一份。

要点：
- **宿主**：`hud-host.html` 用 `<base href="974c61d/src/renderer/">`，CSP `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'`。`hud-host.js`（绝对路径加载）先设 `window.hud = parent.__qdHud`（没有就写"QuotaDeck 网页演示需要在作品集页面里打开"并停止），`fetch('hud.html')` 解析后导入其 `<link rel="stylesheet">` 与正文（不导入 `<script>`、`<meta>`），按 `parent.__qdTier` 追加 `/assets/quotadeck/hud-host-off.css` 或 `-gentle.css`，再按 hud.html 的顺序逐个加载脚本（上一个 `onload` 后再加下一个）。任一资源失败调用 `parent.__qdFailed(reason)`。
- **`hud-host-off.css`**：`*, *::before, *::after { animation: none !important; transition: none !important; }`；**`hud-host-gentle.css`**：`*, *::before, *::after { animation: none !important; transition-property: opacity !important; }`。
- **桌面框**：逻辑尺寸在视口宽 ≥ 900 px 时为 960 × 600，否则为 520 × 720；iframe 按逻辑尺寸渲染，外层用 `transform: scale(容器宽 / 逻辑宽)`，容器高度随之设定。布局：`geometry.layoutHud({ workArea: { x:0, y:0, width, height }, edge: 'right', offset: 0.5 })`（`offset` 等参数名照 `hud-geometry.cjs:58` 的签名），刘海用 `layoutNotch({ workArea })`；两者都补 `dragging: false`。
- **时钟**：`requestAnimationFrame` 推进剧本时间；页面隐藏（`visibilitychange`）或舞台离开视口（`IntersectionObserver`）时暂停，回来时从暂停处继续，不补跑（Review Focus 1）。每帧：`eventsBetween(prev, now)` 喂 tracker → `tracker.setApprovals(approvalsAt(...))` → `push.sessions(tracker.snapshot(base + t))`；关键帧变化时 `push.state(view.buildHudItems(ui, base + t))`；70 s 时 `push.tokens(view.buildHudTokens(tokensAt(...)))`。到 `LOOP_MS` 新建 tracker、`decided = null`、重新 `initial` 推送。
- **设置页**（与 spec §6 的差别）：设置页由搬来的 `hud-settings.js` 原样渲染，网页不能在不改它的前提下把"接入"几行置灰；改为点击这些按钮时 `onAction` 返回 `unavailable`，`[data-qd-log]` 写 `QD_HUD_TEXT.unavailable`（"这一项在桌面版里设置"）。
- **插手**：`onApprove` 记下决定并在 `[data-qd-log]` 写 `allowed` / `denied`；`onReturn` 写 `returnNote`；`onOpenStats` 在舞台旁显示 `stats.png` 截图与 `statsNote`；`onAction` 写 `unavailable`。
- **档位**：`currentTier() === 'off'` 时 `data-state="stepping"`，不自动走；`[data-qd-step]` 每按一次跳到下一个 `BEATS.at`。
- **失败**：加载器或宿主报错 → `data-state="failed"`，隐藏舞台，显示 `#qd-fallback`（Review Focus 5）。没有脚本时 `#qd-fallback` 默认可见，舞台默认隐藏（`<noscript>` 不可用于 Astro 岛时用 `html.motion-ok`/脚本类名切换，照旧 `QuotaLive` 的做法）。

- [ ] **Step 1: 写失败的端到端测试** `tests/e2e/quota-hud.spec.ts`（`page.clock` 控制时间，或在页面上暴露 `window.__qdSeek(ms)` 仅在 `?qdtest` 时可用——二选一，选 `page.clock`）：
  - 打开 `/projects/quota-deck/live/`，滚到舞台：`#qd-stage` 变为 `running`；iframe 里 `#strip` 可见，五个圆环。
  - 推进到 12.5 s：iframe 里出现文字 `New reply`；`[data-qd-note]` 含 `claude-done` 的中文说明。
  - 推进到 32.5 s：iframe 里出现 `Approve?`；点 `Allow once` 后 approval 卡片消失，`[data-qd-log]` 含 `QD_HUD_TEXT.allowed.zh`。
  - 推进到 52.5 s 且未操作：`[data-qd-hint]` 可见。
  - 点 `[data-qd-play]` 暂停后再推进 5 s，`[data-qd-note]` 不变。
  - `[data-qd-style="notch"]` 后 iframe 里 `#notch` 可见、`#strip` 隐藏。
  - 动效关闭：`data-state="stepping"`，按 `[data-qd-step]` 6 次后 `[data-qd-note]` 为 `loop` 说明（Review Focus 4）；iframe 的 `document.styleSheets` 含 `hud-host-off.css`。
  - 拦截 `**/974c61d/src/renderer/hud.js` 返回 404：`#qd-fallback` 可见，舞台隐藏（Review Focus 5）。
  - 不开脚本：`#qd-fallback` 可见。
  - 整页只请求本站资源（监听 `request`，host 都是 `localhost`）。
  - 手机（390 与 360 宽，用 `page.setViewportSize`）：无横向滚动；打开 Claude 卡片后卡片的 `getBoundingClientRect()` 完全在视口内（Review Focus 3）。
  - HRIS：`/hris/projects/quota-deck/live/` 同样 `running`，返回链接指向 `/hris/projects/quota-deck/`。
- [ ] **Step 2: 跑测试确认失败**：`npx playwright test tests/e2e/quota-hud.spec.ts` → FAIL。
- [ ] **Step 3: 实现** 上述文件；`LiveView.astro` 换组件。
- [ ] **Step 4: 跑测试** → PASS；另跑 `npx playwright test tests/e2e/editions.spec.ts tests/e2e/hris-detail.spec.ts` → PASS（`editions.spec` 的选择器如需改为新 id，在本任务改并说明）。
- [ ] **Step 5: 截图检查**：桌面浅 / 深、手机 390；刘海模式一张。看不清或溢出就修。
- [ ] **Step 6: 提交**：`QuotaDeck live edition: the real HUD in a desktop frame, a 90 s afternoon you can step into`。

### Task 6: 删除旧完整版

**Files:**
- Delete：`src/scripts/qd-live.ts`、`qd-bridge.ts`、`qd-timeline.ts`、`qd-live-text.ts`、`qd-load.ts`；`src/components/QuotaLive.astro`；`public/assets/quotadeck/e9557c6/`、`public/assets/quotadeck/host.html`、`host.js`；`tools/quotadeck/`；`tests/unit/qd-load.test.ts`、`qd-bridge.test.ts`、`qd-timeline.test.ts`、`quotadeck-vendor.test.ts`；`tests/e2e/quota-live.spec.ts`；`.superpowers/qd-*.mjs`、`qd-live.bak`（未入库，直接删）。
- Modify：`tests/unit/effects.test.ts`（删 `TM_FX` 用例）；`tests/unit/qd-sim.test.ts`（删依赖 `qd-load` / e9557c6 的用例，保留 `createSim` 的）；`src/data/live-size.ts`（`'quota'` = `QD_HUD_DIR` 目录大小 + `hud-host.*` 四个文件）；`tests/unit/live-size.test.ts`（`'quota'` 断言改为上式）；`tests/e2e/a11y.spec.ts`（排除项改为 `#qd-frame`，若新 iframe 沿用此 id 则不改）；`tests/e2e/editions.spec.ts`（`HEAVY` 正则仍为 `/assets/quotadeck/`）；`tools/live-shots.mjs:13`（quota 等 `#qd-stage[data-state="running"]` 后再等 13 s，截到 `New reply`）。

- [ ] **Step 1: 改测试**：`live-size.test.ts` 的 `'quota'` 期望值按新公式计算 → 跑 `npx vitest run tests/unit/live-size.test.ts` → FAIL。
- [ ] **Step 2: 删除与修改** 上列文件；`grep -rn "qd-load\|qd-live\|qd-bridge\|qd-timeline\|e9557c6\|QuotaLive" src tests tools` 无结果。
- [ ] **Step 3: 重新生成预览截图**：`npm run build` 后 `node tools/live-shots.mjs quota`（参数照该工具现有用法），更新 `public/media/live-previews/quota.jpg`、`quota-crop.jpg` 与 manifest。
- [ ] **Step 4: 全量**：`npm test` 与 `npx playwright test tests/e2e/quota-hud.spec.ts tests/e2e/editions.spec.ts tests/e2e/live-preview.spec.ts tests/e2e/cards.spec.ts tests/e2e/a11y.spec.ts tests/e2e/phase2b.spec.ts tests/e2e/plates.spec.ts` → PASS。
- [ ] **Step 5: 提交**：`Remove the old QuotaDeck live edition (tray window at e9557c6, simulated timeline)`。

### Task 7: 简易版、卡片、截图与文案

**Files:**
- Modify：`src/components/QuotaShots.astro`、`tests/unit/quota-shots.test.ts`、`src/data/site.ts`（项目条目 `did`；`pages.quota` 的 `lead`、`description`、`summary`；`pages.quotaLive` 全部；首页概览 `shots.items` 的 quota 条目 `alt` / `caption`）、`src/data/editions.ts`（quota 的 `teaser`、`body`）、`src/data/hris.ts`（`cards['quota-deck'].did`）、`src/copy/projects/quota-deck.{zh,en}.md`（若提到托盘窗口、并行协作或时间轴）、`docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md`
- Create：`public/media/quota-deck/hud/{strip,card,reply,approval,notch}.png`（来自 `portfolio-site/work/qd-materials/974c61d/`：`hud-strip`、`hud-card-quota`、`hud-reply-card`、`hud-approval`、`hud-notch-card`；裁到非透明区域外加 24 px，压缩后每张 ≤ 250 KB，保留透明）
- Delete：`public/media/quota-deck/{quota,models,collab}.png`

- [ ] **Step 1: 改测试**：`quota-shots.test.ts` 期望五张新图存在、尺寸与 `QuotaShots` 里写的 `width/height` 一致；`claims.test.ts` 不改（会自动覆盖新文案）→ 跑测试 FAIL。
- [ ] **Step 2: 生成截图** 并改 `QuotaShots.astro`（五张图，图注说明"合成数据"，最后一行署名 Agent HUD）。
- [ ] **Step 3: 起草文案**（中英，事实只取自 QuotaDeck README 与经历档案）：
  - 卡片 `did`：「借助 AI 编程工具开发的 Windows 小工具：屏幕边上一条浮条看五家 AI 服务的额度；Claude Code、Codex 做完一轮或等批准时，在浮条上提醒」。
  - `pages.quota.summary`：任务、取舍（保留"读不到写 –，不当作用完"）、我的工作（选方向与范围、定提醒与批准的规则、验收；界面照 Agent HUD 复刻）、工具协作（GPT 写后端、Claude 写前端与审查）、证据（本页截图与完整版；源码 MIT）、状态（「个人项目，MIT 开源；0.6.0 已发布，仍在开发。截图与完整版均为合成数据。」）。
  - `pages.quotaLive`：标题「QuotaDeck（完整版）」不变；导语「真实的 HUD 前端，模拟的一个下午。」；摘要五栏按 spec §3–§4 写。
  - `editions` 的 quota `teaser`：「看 HUD 怎样提醒你：做完了、等批准 →」，`body` 说明运行方式与"批准只影响演示"。
  - 首页概览截图图注：「QuotaDeck 的真实 HUD 在网页里运行：做完了的提醒与批准请求」。
- [ ] **Step 4: 追加待确认清单**：`## 第三期（QuotaDeck 新版）`，逐条列出上面改过的字段，格式同前两期（中文、English、确认 / 修改为：___）。
- [ ] **Step 5: 跑** `npm test` 与 `npx playwright test tests/e2e/phase2b.spec.ts tests/e2e/numbers.spec.ts tests/e2e/hris-detail.spec.ts` → PASS。
- [ ] **Step 6: 提交**：`QuotaDeck copy and screenshots for 0.6.0: edge HUD, done reminders, approvals (drafts for sign-off)`。

### Task 8: 全量验证

- [ ] **Step 1**：`npm test && npm run e2e` → 全部通过，记录数量。
- [ ] **Step 2**：截图检查：项目页与完整版，中英、浅深、桌面 / 手机，HRIS 一张；用 Read 逐张看。
- [ ] **Step 3**：在共享记忆收件箱写一条记录（提交范围、测试数、待确认文案条目、上线前置条件：QuotaDeck 推送）。
- [ ] **Step 4**：汇报，不推送、不发布。
