# 2B 技术力 · 计划二：AI 校园研究页"清洗流水线" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 校园研究页的演示区换成真实运行的研究统计程序：Pyodide 在浏览器里原样运行网站提供下载的 `analysis.py` 和 `test_analysis.py`，访客按问卷填写、载入构造样本或做 2,000 份压力测试；每份回答化作一个粒子，按程序逐行执行时记录下的真实分支穿过四道排除关卡；10 项单元测试在浏览器里逐条运行。运行时不可用时隐藏流水线、说明原因，五段式框架照常显示。

**Architecture:** 沿用计划一的运行时（`py-core.mjs` + `py-worker.js` + `py-runtime.ts`），补两项能力：每页自己指定要装的 Pyodide 包（校园页不装包，少下 2.4 MB），以及规格里的 `event` 逐条推送消息。站点自写的 `campus_bridge.py` 用 `sys.settrace` 只跟踪 `analysis.analyze` 这一帧，返回原始输出、第 87–97 行的执行次数和每行记录走进的分支。`campus-flow.ts` 是纯函数（分支 → 关卡、回放模型、表单 → 记录、统计栏数据）；`campus-pipeline.ts` 把第二版原型 `p3.html` 的双画布粒子系统移植成由真实分支驱动的模块；`campus-live.ts` 串起启动、表单、计算、回放、代码实况和测试流。冷启动遮罩从求职页抽成共用组件。

**Tech Stack:** Astro 7、TypeScript、Pyodide 0.29.5（Python 3.13.2，只用标准库）、Canvas 2D、Vitest（Node 里直接跑 Pyodide）、Playwright（Edge）。

**Spec:** `docs/superpowers/specs/2026-09-30-2b-live-tech-design.md`（第 1、4、5、6、7 节；本计划为第 7 节表中的"计划二"）。视觉参考：`.superpowers/proto-v2/p3.html`（第二版原型，用户已选"对，按这个做"）。计划一：`docs/superpowers/plans/2026-09-30-2b-live-career.md`（运行时与求职页的现状以代码为准）。

## 计划中替用户做的决定（交付时请用户确认）

1. 表单在问卷 Q1–Q7 之外多两栏"匿名 ID"和"填写日期"。这样四道关卡（重复 ID、未同意、不符合人群、采集窗口外）和"校验失败"访客都能亲手触发。
2. 采集窗口固定为 2026-09-01 至 2026-09-30，填写日期默认 2026-09-15。
3. 运行时就绪后自动载入 36 份构造样本，访客一进来就能看到流水线在跑；10 项测试要点按钮才运行。
4. 程序每次都重新检查全部记录，动画只回放新加入的、以及结论变了的记录，页面上写明这一点。
5. 颜色只用现有变量：原型里的琥珀色和绿色不再使用。"不确定"用空心方格表示，测试通过用白色对勾，失败用红框。
6. 校园页不加载 pydantic 和 sqlite3，下载量约 11.7 MB（求职页是 14.3 MB）。
7. 冷启动遮罩抽成共用组件，求职页一起换用。附带变化：求职页冷启动日志里的模块数从 17 变成 18（`career_bridge` 也计入了），日志文案同步改为"导入引擎源码与本站桥接"。
8. 测试格子按 unittest 实际运行的顺序排列（按方法名排序），和原型里的文件顺序不同。
9. 代码实况的"热度"改为"到达该行的记录占比"，原型用的是"最近执行频率"。改后静止时也有意义，减少动态效果时同样适用。
10. 原型的统计栏会边回放边滚动；本计划改为回放期间统计栏和账目行变暗、注明"回放中"，回放结束时一次落定为程序算出的数字。代码实况的行计数仍然实时上涨。
11. 手机上（窄屏、粗指针或省流量）每 5 份回答画 1 个光点，其余回答直接落进桶或点阵；计数与数据不变，页面上写明。规格第 5 节要求手机"降低粒子数"。
12. 测试区结尾按规格与原型：大字"Ran 10 tests · OK"，命令行那一栏显示实测耗时"Ran 10 tests in 0.00Xs"。

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；不推送、不合并、不部署。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。只 `git add` 明确列出的路径（`.superpowers/` 未被忽略，不能带进提交）。不用裸 `git stash`。
- 研究程序只用网站已提供下载的 `public/downloads/campus/analysis.py` 和 `test_analysis.py`，同一份文件、不另做副本、不修改。站点只自写 `public/assets/py/campus_bridge.py`。
- Pyodide 固定 0.29.5（Python 3.13.2）；校园页不装任何包。
- `analyze()` 的调用窗口固定为 `2026-09-01` 至 `2026-09-30`（`WINDOW`）。
- 构造数据：36 份样本（26 份正常、3 对重复 ID、2 份未同意、1 份不符合人群、1 份采集窗口外）；2,000 份压力测试（1,720 份正常、40 对重复 ID、60 份未同意、40 份不符合人群、100 份采集窗口外），都在 Python 里用固定种子生成，都标"构造样本 · 不是 2024 年调查结果"。
- 统计栏、账目行、代码实况的每个数字都取自 `analyze()` 的输出或 `sys.settrace` 的真实计数；动画只决定何时显示，结束时一律以真实值落定。
- 访客输入只在本机浏览器计算，不上传；页面写明。
- 演示区根元素带 `data-demo`（数字测试排除）。
- 颜色只用 tokens 变量（`--paper --ink --mute --red --red-text --night --night-fg --night-mute`），画布颜色也从这些变量读取（可以由它们混合）；夜色底上的小字只用 `--night-fg`、`--night-mute`，红色只用于线条、底色、边框和标记。
- 动效：闪光不透明度 ≤ 0.35，没有整屏白闪；震动 ≤ 8px、≤ 400ms；关键时刻 ≥ 50 fps。减少动态效果时直接显示终态（数据照常计算）。
- 手机（窄屏或粗指针）与省流量时不自动下载运行时，显示"启动程序（约 N MB）"按钮；N 在构建时由实际要下载的文件大小相加得出。
- 60 秒内运行时未就绪、WebAssembly 不可用、Worker 创建失败：隐藏流水线，说明原因，给重试按钮和下载链接；五段式框架照常显示。
- 英文页界面英文；程序自己的报错（中文）原样显示，并注明是程序原话。

## Review Focus

1. **动画进行中访客又提交或点压力测试**：最终的统计栏、账目行和代码实况与最后一次被程序接受的结果一致，旧动画不会把旧数字写回来 → Task 6 `rapid submits settle on the last result`。
2. **非法输入**（匿名 ID 带首尾空格、清空填写日期）：显示程序原话的"校验失败"，数据集不变，上一轮结果照常显示完整；动画中途输入非法内容时，上一轮动画照常落定 → Task 2 `invalid input comes back as the program's own message`；Task 6 `invalid input shows the program's own validation failure`、`an invalid answer during the animation leaves the previous result to finish`。
3. **同一个匿名 ID 提交两次**：程序把两条都按重复 ID 排除（纳入人数反而减 1），页面照实显示 → Task 6 `the same ID twice: the program excludes both`。
4. **清空后没有任何数据**：比例和中位数显示"—"，不显示 0%；程序状态显示"没有可分析记录" → Task 3 `no data: shares and the median are missing, not zero`；Task 6 `clearing leaves no data`。
5. **运行时下载被拦截**：隐藏流水线、说明原因、可重试，五段式框架照常；页面不下载任何 `.whl` → Task 6 `blocked runtime hides the pipeline, says why, and a retry boots it`、`the page loads no Python packages`。

---

## 文件结构

```
public/assets/py-core.mjs                 改：boot 接受 packages（空数组就不装包）；call 可传 emit 做逐条推送
public/assets/py-worker.js                改：按页面给的 packages 启动；单独文件也计入模块；call 带 stream 时转发 event
src/scripts/py-runtime.ts                 改：options.packages；call(module, fn, args, onEvent?)；处理 event 消息
src/scripts/career-live.ts                改：显式 packages；冷启动改用共用视图
src/components/CareerLive.astro           改：冷启动遮罩改用 PyBoot
src/components/PyBoot.astro               新：共用冷启动遮罩（标记 + 样式）
src/scripts/py-boot-view.ts               新：共用冷启动视图（字节流、日志、模块标签收拢）
public/assets/py/campus_bridge.py         新：analyze_traced / constructed / run_tests
src/scripts/campus-flow.ts                新：常量、类型、纯函数（回放模型、表单、统计栏）
src/scripts/campus-pipeline.ts            新：双画布粒子流水线（原型 p3 的移植，由真实分支驱动）
src/scripts/campus-live-text.ts           新：中英文案
src/scripts/campus-live.ts                新：控制器
src/components/CampusLive.astro           新：演示区标记与样式
src/views/AiCampusView.astro              改：演示区 = CampusLive + CampusFramework
tests/unit/py-node.ts                     改：新增 bootCampus()
tests/unit/py-runtime.test.ts             改：packages 与 event 的测试
tests/unit/campus-bridge.test.ts          新
tests/unit/campus-flow.test.ts            新
tests/unit/campus-pipeline.test.ts        新
tests/e2e/campus-live.spec.ts             新
```

---

### Task 1: 运行时：每页指定包 + 逐条推送事件

**Files:**
- Modify: `public/assets/py-core.mjs`
- Modify: `public/assets/py-worker.js`
- Modify: `src/scripts/py-runtime.ts`
- Modify: `src/scripts/career-live.ts:95`
- Modify: `src/scripts/career-live-text.ts:44`、`:73`（冷启动日志的 sources 文案）
- Test: `tests/unit/py-runtime.test.ts`

**Interfaces:**
- Consumes: 计划一的 `createPyRuntime`、`core.boot`、`core.call`。
- Produces:
  - `core.boot(loadPyodide, indexURL, onStep?, packages = PACKAGES)`：`packages` 为空数组时不调用 `loadPackage`，也不报告 `packages` 这一步。
  - `core.call(py, module, fn, args, emit?)`：有 `emit` 时，Python 函数多收到最后一个参数（一个可调用对象），每调用一次传一个 JSON 字符串；`emit` 收到的是解析后的对象。
  - Worker 消息：`boot { bundles, files, imports, packages? }`；`call { id, module, fn, args, stream }`；新增 `event { id, data }`。`files` 里的每个文件也计入 `progress.modules`（去掉 `.py`）。
  - `PyRuntimeOptions.packages?: string[]`；`PyRuntime.call<T>(module, fn, args, onEvent?: (data: unknown) => void)`。

- [ ] **Step 1: 写失败的测试**

在 `tests/unit/py-runtime.test.ts` 的 `describe` 末尾加两条：

```ts
  it('names the packages a page needs in the boot request', async () => {
    const w = new FakeWorker();
    const rt = createPyRuntime({ ...OPTS, packages: [], makeWorker: () => w as unknown as Worker });
    const ready = rt.boot(() => {});
    expect(w.sent[0]).toEqual({ type: 'boot', ...OPTS, packages: [] });
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1 });
    await ready;
  });
  it('streams each pushed event to the call that asked for it, before its result', async () => {
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1 });
    await ready;
    const seen: unknown[] = [];
    const a = rt.call('campus_bridge', 'run_tests', ['test_analysis'], e => seen.push(e));
    const b = rt.call('campus_bridge', 'constructed', ['sample']);
    const [ma, mb] = w.sent.slice(1);
    expect([ma.stream, mb.stream]).toEqual([true, false]);
    w.emit({ type: 'event', id: ma.id, data: { kind: 'start', name: 'test_a' } });
    w.emit({ type: 'event', id: mb.id, data: { kind: 'stray' } });
    w.emit({ type: 'event', id: ma.id, data: { kind: 'ok', name: 'test_a' } });
    w.emit({ type: 'result', id: ma.id, value: { run: 1 }, ms: 1 });
    await expect(a).resolves.toEqual({ value: { run: 1 }, ms: 1 });
    expect(seen).toEqual([{ kind: 'start', name: 'test_a' }, { kind: 'ok', name: 'test_a' }]);
    w.emit({ type: 'result', id: mb.id, value: [], ms: 1 });
    await expect(b).resolves.toEqual({ value: [], ms: 1 });
  });
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/py-runtime.test.ts`
Expected: 新的两条 FAIL（boot 消息里没有 `packages`；`stream` 为 undefined；`seen` 为空）。

- [ ] **Step 3: 实现 `py-runtime.ts`**

`PyRuntimeOptions` 里 `bundles` 那一行后面加：

```ts
  /** Pyodide packages to install; left out, the worker installs its default (pydantic, sqlite3). */
  packages?: string[];
```

`PyRuntime.call` 改为：

```ts
  /** With onEvent the bridge function streams: onEvent gets each event it pushes, in order, before the call resolves. */
  call<T>(module: string, fn: string, args: unknown[], onEvent?: (data: unknown) => void): Promise<{ value: T; ms: number }>;
```

`const pending = new Map<...>()` 改为具名类型：

```ts
interface Pending { resolve: (v: { value: any; ms: number }) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout>; onEvent?: (data: unknown) => void }
```

（放在 `createPyRuntime` 上方），函数里 `const pending = new Map<number, Pending>();`。

`onMessage` 在 `ready` 分支之后加一支：

```ts
    else if (m.type === 'event') pending.get(m.id)?.onEvent?.(m.data);
```

boot 里的 `postMessage` 改为：

```ts
          worker.postMessage({ type: 'boot', bundles: o.bundles, files: o.files, imports: o.imports, packages: o.packages });
```

`call` 改为：

```ts
    call<T>(module: string, fn: string, args: unknown[], onEvent?: (data: unknown) => void) {
      return new Promise<{ value: T; ms: number }>((resolve, reject) => {
        if (!worker) { reject(new Error('not-ready')); return; }
        const id = ++seq;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout')); }, o.callTimeoutMs ?? 15_000);
        pending.set(id, { resolve, reject, timer, onEvent });
        worker.postMessage({ type: 'call', id, module, fn, args, stream: !!onEvent });
      });
    },
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/py-runtime.test.ts`
Expected: 7 passed。

- [ ] **Step 5: 实现 `py-core.mjs`**

文件头注释第一行改为 `// Shared by the browser worker (py-worker.js) and the Node unit tests: boots Pyodide, installs the packages a page asks`，第二行 `// for, mounts Python sources, and calls bridge functions that take and return JSON strings.`。

`boot` 改为：

```js
export async function boot(loadPyodide, indexURL, onStep = () => {}, packages = PACKAGES) {
  let t = performance.now();
  const py = await loadPyodide({ indexURL });
  onStep('runtime', { ms: performance.now() - t, python: py.runPython('import sys; sys.version.split()[0]') });
  if (packages.length) {
    t = performance.now();
    await py.loadPackage(packages, { messageCallback: () => {}, errorCallback: () => {} });
    onStep('packages', { ms: performance.now() - t });
  }
  return py;
}
```

`call` 改为：

```js
/** Calls module.fn with every argument as a JSON string and parses the JSON it returns. With emit, a streaming bridge
 *  function also gets a callback, which it calls with one JSON string per event; emit receives each event parsed. */
export function call(py, module, fn, args, emit) {
  const f = py.pyimport(module)[fn];
  const json = args.map(a => JSON.stringify(a));
  try { return JSON.parse(emit ? f(...json, s => emit(JSON.parse(s))) : f(...json)); }
  finally { f.destroy?.(); }
}
```

- [ ] **Step 6: 实现 `py-worker.js`**

boot 分支里，`core = await import('./py-core.mjs');` 之后加一行：

```js
      const packages = m.packages ?? core.PACKAGES;
```

`core.boot(...)` 那一句改为：

```js
      py = await core.boot(loadPyodide, core.PYODIDE, (step, info) =>
        postMessage({ type: 'progress', step, ms: info.ms, bytes: transferred(), detail: info.python || packages.join(' · ') }), packages);
```

`for (const url of m.files) ...` 那一行改为：

```js
      for (const url of m.files) {
        const name = url.slice(url.lastIndexOf('/') + 1);
        core.mount(py, [{ path: name, bytes: await bytesOf(url) }]);
        modules.push(name.replace(/\.py$/, ''));
      }
```

call 分支里 `const value = core.call(py, m.module, m.fn, m.args);` 改为：

```js
      const value = core.call(py, m.module, m.fn, m.args, m.stream ? data => postMessage({ type: 'event', id: m.id, data }) : undefined);
```

- [ ] **Step 7: 求职页显式声明它要的包**

`src/scripts/career-live.ts` 里 `createPyRuntime({ ... imports: ['career_bridge'] })` 改为：

```ts
    runtime = createPyRuntime({ bundles: ['/assets/py/job-agent/4397ded/'], files: ['/assets/py/career_bridge.py'], imports: ['career_bridge'], packages: ['pydantic', 'sqlite3'] });
```

Worker 现在把 `career_bridge` 也算进模块数（17 → 18），日志文案要如实说明。`src/scripts/career-live-text.ts` 第 44 行 `sources: \`导入引擎源码 · ${detail} 个模块\`` 改为：

```ts
sources: `导入引擎源码与本站桥接 · ${detail} 个模块`
```

第 73 行 `sources: \`Import the engine sources · ${detail} modules\`` 改为：

```ts
sources: `Import the engine sources and the site's bridge · ${detail} modules`
```

- [ ] **Step 8: 全部单元测试 + 求职页的启动与降级**

Run: `npx vitest run`
Expected: 全部通过（188 项：原 186 + 新 2）。

Run: `npx playwright test tests/e2e/career-live.spec.ts --project=desktop -g "boots in the browser|blocked runtime|byte stream|reduced motion"`
Expected: 4 passed。

- [ ] **Step 9: 提交**

```bash
git add public/assets/py-core.mjs public/assets/py-worker.js src/scripts/py-runtime.ts src/scripts/career-live.ts src/scripts/career-live-text.ts tests/unit/py-runtime.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Python runtime: each page names its packages; bridge functions can stream events to the page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 校园桥接与 Node 里的真实程序测试

**Files:**
- Create: `src/scripts/campus-flow.ts`（本任务只写常量与类型）
- Create: `public/assets/py/campus_bridge.py`
- Modify: `tests/unit/py-node.ts`
- Test: `tests/unit/campus-bridge.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `core.boot(..., packages)`、`core.call(..., emit)`、`core.mount`。
- Produces:
  - `campus-flow.ts`：`CAMPUS_RUNTIME`、`CORE_FILES`、`WINDOW`、`SCENARIOS`、`FREQUENCIES`、`GATE_KEYS`；类型 `Scenario`、`Frequency`、`GateKey`、`Row`、`Rating`、`Analysis`、`Traced`、`Invalid`、`TestEvent`、`TestSummary`。
  - `campus_bridge.analyze_traced(rows_json, start_json, end_json)` → `Traced` 或 `{"error": "invalid", "message": <ValueError 原文>}`。
  - `campus_bridge.constructed(kind_json)`（`"sample"` / `"stress"`）→ `Row[]`。
  - `campus_bridge.run_tests(module_json, emit)` → `TestSummary`；每条测试推送 `{"kind": "start", "name"}`，结束时推送 `{"kind": "ok"|"fail"|"error"|"skip", "name", "message"}`。
  - `tests/unit/py-node.ts`：`bootCampus(): Promise<any>`（不装包，挂载 `CAMPUS_RUNTIME.files`，导入 `campus_bridge`）。

- [ ] **Step 1: 写 `src/scripts/campus-flow.ts`（常量与类型）**

```ts
/** The AI-on-campus live demo: the study's own program running in the browser. Constants and types shared by the page,
 *  the pipeline and the tests; the functions further down are pure. */

/** What the page's Python runtime loads: no packages (analysis.py uses only the standard library), the study's program
 *  and tests from the very URLs the page offers for download, and the site's bridge. */
export const CAMPUS_RUNTIME = {
  bundles: [] as string[],
  files: ['/downloads/campus/analysis.py', '/downloads/campus/test_analysis.py', '/assets/py/campus_bridge.py'],
  imports: ['campus_bridge'],
  packages: [] as string[],
};
/** The Pyodide core files a runtime without packages downloads (their sizes and hashes are in the vendored manifest). */
export const CORE_FILES = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
/** The collection window of every analyze() call; the constructed rows and the form's default date fall inside it. */
export const WINDOW = { start: '2026-09-01', end: '2026-09-30' } as const;
export const SCENARIOS = ['study', 'campus', 'club', 'daily', 'career', 'other'] as const;
export const FREQUENCIES = ['1_3', '4_15', '16_30'] as const;
export const GATE_KEYS = ['duplicate_id', 'no_consent', 'ineligible', 'outside_period'] as const;
export type Scenario = (typeof SCENARIOS)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type GateKey = (typeof GATE_KEYS)[number];

/** One questionnaire answer in analysis.py's input format (public/downloads/campus/questionnaire.md). */
export interface Row {
  respondent_id: string; collected_on: string; consent: boolean; eligible: boolean;
  used_ai: 'yes' | 'no' | 'unsure' | null; frequency: Frequency | null; scenarios: Scenario[] | null;
  helpfulness: number | null; verification: number | null;
}
export interface Rating { answered_n: number; missing_n: number; distribution: Record<'1' | '2' | '3' | '4' | '5', number>; median: number | null }
/** analyze()'s output, exactly as the program returns it. */
export interface Analysis {
  status: string; scope: string; period_start: string; period_end: string;
  input_n: number; included_n: number; excluded: Record<GateKey, number>; duplicate_id_groups: number;
  usage: { counts: { yes: number; no: number; unsure: number }; denominator_n: number; yes_share: number | null };
  scenarios: { answered_n: number; missing_n: number; items: Record<Scenario, { n: number; share: number | null }> };
  helpfulness: Rating; verification: Rating;
  frequency_groups: Record<Frequency, { n: number; helpfulness: Rating }>;
  limitations: string[];
}
/** campus_bridge.analyze_traced: the result, how often each of lines 87–97 ran, the branch line each row took, times. */
export interface Traced { result: Analysis; lines: Record<string, number>; branches: number[]; ms: number; traced_ms: number }
/** analyze() refused the input: its ValueError message, verbatim. */
export interface Invalid { error: 'invalid'; message: string }
export interface TestEvent { kind: 'start' | 'ok' | 'fail' | 'error' | 'skip'; name: string; message?: string | null }
export interface TestSummary { run: number; failures: number; errors: number; ok: boolean; ms: number }
```

- [ ] **Step 2: `tests/unit/py-node.ts` 增加 `bootCampus`**

整个文件改为：

```ts
// Boots the self-hosted Pyodide in Node with the same files, loaded by the same py-core.mjs, as the browser worker:
// bootNode() for the job agent page (vendored engine + career bridge), bootCampus() for the campus page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as core from '../../public/assets/py-core.mjs';
import { CAMPUS_RUNTIME } from '../../src/scripts/campus-flow';

const VENDOR = resolve('public/assets/vendor/pyodide/0.29.5').replace(/\\/g, '/') + '/';
const ENGINE = 'public/assets/py/job-agent/4397ded';
let booted: Promise<any> | null = null, campus: Promise<any> | null = null;

async function load(packages?: string[]): Promise<any> {
  const { loadPyodide } = await import(pathToFileURL(VENDOR + 'pyodide.mjs').href);
  return core.boot(loadPyodide, VENDOR, () => {}, packages);
}

export function bootNode(): Promise<any> {
  booted ??= (async () => {
    const py = await load();
    const manifest = JSON.parse(readFileSync(`${ENGINE}/manifest.json`, 'utf8'));
    core.mount(py, manifest.files.filter((f: { path: string }) => f.path.endsWith('.py'))
      .map((f: { path: string }) => ({ path: f.path, bytes: readFileSync(`${ENGINE}/${f.path}`) })));
    core.mount(py, [{ path: 'career_bridge.py', bytes: readFileSync('public/assets/py/career_bridge.py') }]);
    return py;
  })();
  return booted;
}

/** The campus page's runtime: no packages, and the very files the page names (served from public/). */
export function bootCampus(): Promise<any> {
  campus ??= (async () => {
    const py = await load(CAMPUS_RUNTIME.packages);
    core.mount(py, CAMPUS_RUNTIME.files.map(u => ({ path: u.slice(u.lastIndexOf('/') + 1), bytes: readFileSync(`public${u}`) })));
    for (const name of CAMPUS_RUNTIME.imports) py.pyimport(name);
    return py;
  })();
  return campus;
}
```

- [ ] **Step 3: 写失败的测试 `tests/unit/campus-bridge.test.ts`**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { call, mount } from '../../public/assets/py-core.mjs';
import { bootCampus } from './py-node';
import { WINDOW, type Row, type Traced, type Invalid, type TestEvent, type TestSummary } from '../../src/scripts/campus-flow';

let py: any;
beforeAll(async () => { py = await bootCampus(); }, 120_000);
const traced = (rows: unknown[]): Traced | Invalid => call(py, 'campus_bridge', 'analyze_traced', [rows, WINDOW.start, WINDOW.end]);
const made = (kind: 'sample' | 'stress'): Row[] => call(py, 'campus_bridge', 'constructed', [kind]);
const ok = (rows: unknown[]): Traced => { const t = traced(rows); if ('error' in t) throw new Error(t.message); return t; };
/** analyze() called directly, without the bridge and without tracing. */
function plain(rows: unknown[]) {
  py.globals.set('rows_json', JSON.stringify(rows));
  return JSON.parse(py.runPython(`import json, analysis\njson.dumps(analysis.analyze(json.loads(rows_json), '${WINDOW.start}', '${WINDOW.end}'), ensure_ascii=False)`));
}
const ROW: Row = { respondent_id: 'TEST_ONLY_A', collected_on: '2026-09-12', consent: true, eligible: true, used_ai: 'yes', frequency: '1_3', scenarios: ['study'], helpfulness: 4, verification: 5 };

describe('campus bridge running analysis.py under Pyodide', () => {
  it('the constructed sample: 36 rows, 26 included, every exclusion present', () => {
    const t = ok(made('sample'));
    expect([t.result.input_n, t.result.included_n]).toEqual([36, 26]);
    expect(t.result.excluded).toEqual({ duplicate_id: 6, no_consent: 2, ineligible: 1, outside_period: 1 });
  });
  it('the stress set: 2,000 rows from a fixed seed, the same every time', () => {
    const a = made('stress');
    expect(a).toHaveLength(2000);
    expect(made('stress')).toEqual(a);
    const t = ok(a);
    expect(t.result.included_n).toBe(1720);
    expect(t.result.excluded).toEqual({ duplicate_id: 80, no_consent: 60, ineligible: 40, outside_period: 100 });
  });
  it('tracing changes nothing: the result equals a plain analyze() call', () => {
    const rows = made('stress');
    expect(ok(rows).result).toEqual(plain(rows));
  });
  it('counts every line of the loop; the header runs once more than there are rows', () => {
    const t = ok(made('stress'));
    expect(t.lines).toEqual({ 87: 2001, 88: 2000, 89: 80, 90: 1920, 91: 60, 92: 1860, 93: 40, 94: 1820, 95: 100, 97: 1720 });
    expect(t.ms).toBeGreaterThan(0);
    expect(t.traced_ms).toBeGreaterThan(0);
  });
  it('records the branch each row takes, in row order', () => {
    const rows = made('sample'), t = ok(rows);
    expect(t.branches).toHaveLength(36);
    const seen = new Map<string, number>();
    for (const r of rows) seen.set(r.respondent_id, (seen.get(r.respondent_id) ?? 0) + 1);
    rows.forEach((r, i) => {
      const expected = seen.get(r.respondent_id)! > 1 ? 89 : !r.consent ? 91 : !r.eligible ? 93
        : r.collected_on < WINDOW.start || r.collected_on > WINDOW.end ? 95 : 97;
      expect(t.branches[i], r.respondent_id).toBe(expected);
    });
  });
  it('invalid input comes back as the program\'s own message', () => {
    expect(traced([{ ...ROW, respondent_id: ' X ' }])).toEqual({ error: 'invalid', message: '第 1 条记录：匿名 ID 不应有首尾空格' });
    expect(traced([ROW, { ...ROW, respondent_id: 'B', collected_on: '' }])).toEqual({ error: 'invalid', message: '第 2 条记录：采集日期格式错误' });
  });
  it('an empty input is analysed, not refused', () => {
    const t = ok([]);
    expect(t.result.status).toBe('没有可分析记录');
    expect(t.result.usage.yes_share).toBeNull();
    expect(t.lines).toEqual({ 87: 1 });
    expect(t.branches).toEqual([]);
  });
  it('runs the study\'s ten tests and pushes each start and outcome as it happens', () => {
    const events: TestEvent[] = [];
    const s: TestSummary = call(py, 'campus_bridge', 'run_tests', ['test_analysis'], (e: TestEvent) => events.push(e));
    expect([s.run, s.failures, s.errors, s.ok]).toEqual([10, 0, 0, true]);
    expect(s.ms).toBeGreaterThan(0);
    expect(events).toHaveLength(20);
    const names = [...readFileSync('public/downloads/campus/test_analysis.py', 'utf8').matchAll(/^\s+def (test_\w+)\(/gm)].map(m => m[1]).sort();
    expect(events.filter(e => e.kind === 'start').map(e => e.name)).toEqual(names);
    events.forEach((e, i) => expect(e.kind).toBe(i % 2 ? 'ok' : 'start'));
  });
  it('a failing run is reported as it happened: failures, errors and failed subtests', () => {
    const src = [
      'import unittest', '', '',
      'class Demo(unittest.TestCase):',
      '    def test_a_passes(self):', '        self.assertTrue(True)', '',
      '    def test_b_fails(self):', '        self.assertEqual(1, 2)', '',
      '    def test_c_errors(self):', "        raise RuntimeError('boom')", '',
      '    def test_d_subtests(self):', '        for n in (1, 2, 3):', '            with self.subTest(n=n):', '                self.assertEqual(n, 1)', '',
    ].join('\n');
    mount(py, [{ path: 'test_demo_fail.py', bytes: new TextEncoder().encode(src) }]);
    const events: TestEvent[] = [];
    const s: TestSummary = call(py, 'campus_bridge', 'run_tests', ['test_demo_fail'], (e: TestEvent) => events.push(e));
    expect(events.filter(e => e.kind !== 'start').map(e => [e.name, e.kind, e.message ?? null])).toEqual([
      ['test_a_passes', 'ok', null], ['test_b_fails', 'fail', 'AssertionError: 1 != 2'],
      ['test_c_errors', 'error', 'RuntimeError: boom'], ['test_d_subtests', 'fail', 'AssertionError: 2 != 1'],
    ]);
    expect([s.run, s.failures, s.errors, s.ok]).toEqual([4, 3, 1, false]);
  });
});
```

- [ ] **Step 4: 运行，确认失败**

Run: `npx vitest run tests/unit/campus-bridge.test.ts`
Expected: FAIL，`ModuleNotFoundError: No module named 'campus_bridge'`（Worker 与 Node 都按 `CAMPUS_RUNTIME.files` 挂载，桥接文件还不存在时 `readFileSync` 直接报 `ENOENT`，同样算失败）。

- [ ] **Step 5: 写 `public/assets/py/campus_bridge.py`**

```python
"""Browser bridge for the study's analysis program, loaded unchanged from the files the page offers for download.

analyze_traced() runs analysis.analyze() once as it is, for its time, and once under sys.settrace, counting how often
each line of the exclusion loop (lines 87-97) runs and which branch every row takes; the two results must be equal.
run_tests() runs a unittest module and pushes each test's start and outcome to the page as it happens. constructed()
makes labelled demo rows from fixed seeds; they are never survey data.
"""
import importlib
import json
import random
import sys
import time
import traceback
import unittest
from datetime import date, timedelta

import analysis

FIRST, LAST = 87, 97
BRANCHES = (89, 91, 93, 95, 97)
# kind: seed, ID prefix, clean rows, duplicate-ID pairs, no consent, not eligible, outside the collection window
PLANS = {
    'sample': (36, 'C', 26, 3, 2, 1, 1),
    'stress': (2000, 'S', 1720, 40, 60, 40, 100),
}
SEPTEMBER, AUGUST, OCTOBER = date(2026, 9, 1), date(2026, 8, 1), date(2026, 10, 1)


def analyze_traced(rows_json, start_json, end_json):
    rows, start, end = json.loads(rows_json), json.loads(start_json), json.loads(end_json)
    code = analysis.analyze.__code__
    lines, branches = {}, []

    def on_line(frame, event, arg):
        if event == 'line' and FIRST <= frame.f_lineno <= LAST:
            lines[frame.f_lineno] = lines.get(frame.f_lineno, 0) + 1
            if frame.f_lineno in BRANCHES:
                branches.append(frame.f_lineno)
        return on_line

    def on_call(frame, event, arg):
        return on_line if frame.f_code is code else None

    try:
        started = time.perf_counter()
        plain = analysis.analyze(rows, start, end)
        ms = (time.perf_counter() - started) * 1000
    except ValueError as exc:
        return json.dumps({'error': 'invalid', 'message': str(exc)}, ensure_ascii=False)
    started = time.perf_counter()
    sys.settrace(on_call)
    try:
        result = analysis.analyze(rows, start, end)
    finally:
        sys.settrace(None)
    traced_ms = (time.perf_counter() - started) * 1000
    if result != plain:
        raise RuntimeError('tracing changed the result')
    return json.dumps({'result': result, 'lines': {str(n): c for n, c in sorted(lines.items())}, 'branches': branches,
                       'ms': ms, 'traced_ms': traced_ms}, ensure_ascii=False, allow_nan=False)


def _answer(rng, respondent_id, consent=True, eligible=True, inside=True):
    if inside:
        day = SEPTEMBER + timedelta(days=rng.randrange(30))
    else:
        day = rng.choice((AUGUST + timedelta(days=rng.randrange(31)), OCTOBER + timedelta(days=rng.randrange(15))))
    row = {'respondent_id': respondent_id, 'collected_on': day.isoformat(), 'consent': consent, 'eligible': eligible,
           'used_ai': None, 'frequency': None, 'scenarios': None, 'helpfulness': None, 'verification': None}
    if not (consent and eligible):
        return row  # Q1 or Q2 "no" ends the questionnaire
    row['used_ai'] = rng.choices(('yes', 'no', 'unsure'), (70, 18, 12))[0]
    if row['used_ai'] != 'yes':
        return row  # Q4-Q7 apply only to Q3 "yes"
    row['frequency'] = rng.choices(analysis.FREQUENCIES, (35, 45, 20))[0]
    if rng.random() >= 0.09:
        picked = [s for s, p in zip(analysis.SCENARIOS, (0.78, 0.34, 0.22, 0.41, 0.29, 0.08)) if rng.random() < p]
        row['scenarios'] = picked or ['study']
    if rng.random() >= 0.08:
        row['helpfulness'] = rng.choices((1, 2, 3, 4, 5), (5, 12, 28, 37, 18))[0]
    if rng.random() >= 0.1:
        row['verification'] = rng.choices((1, 2, 3, 4, 5), (6, 18, 34, 28, 14))[0]
    return row


def constructed(kind_json):
    seed, prefix, clean, pairs, no_consent, ineligible, outside = PLANS[json.loads(kind_json)]
    rng, rows, serial = random.Random(seed), [], iter(range(1, 10000))

    def new_id():
        return f'{prefix}-{next(serial):04d}'

    rows += [_answer(rng, new_id()) for _ in range(clean)]
    for _ in range(pairs):
        twin = new_id()
        rows += [_answer(rng, twin), _answer(rng, twin)]
    rows += [_answer(rng, new_id(), consent=False) for _ in range(no_consent)]
    rows += [_answer(rng, new_id(), eligible=False) for _ in range(ineligible)]
    rows += [_answer(rng, new_id(), inside=False) for _ in range(outside)]
    rng.shuffle(rows)
    return json.dumps(rows, ensure_ascii=False)


class _Stream(unittest.TestResult):
    """Pushes each test's start and outcome as it happens. A test's outcome is its first problem, or ok."""

    def __init__(self, emit):
        super().__init__()
        self._emit, self._status, self._message = emit, None, None

    def _note(self, status, err=None):
        if self._status in (None, 'ok'):
            self._status = status
            self._message = None if err is None else ''.join(traceback.format_exception_only(err[0], err[1])).strip()

    def startTest(self, test):
        super().startTest(test)
        self._status, self._message = None, None
        self._emit(json.dumps({'kind': 'start', 'name': test._testMethodName}))

    def stopTest(self, test):
        super().stopTest(test)
        self._emit(json.dumps({'kind': self._status or 'ok', 'name': test._testMethodName, 'message': self._message},
                              ensure_ascii=False))

    def addSuccess(self, test):
        super().addSuccess(test)
        self._note('ok')

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self._note('fail', err)

    def addError(self, test, err):
        super().addError(test, err)
        self._note('error', err)

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self._note('skip')

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err is not None:
            self._note('fail' if issubclass(err[0], test.failureException) else 'error', err)


def run_tests(module_json, emit):
    suite = unittest.defaultTestLoader.loadTestsFromModule(importlib.import_module(json.loads(module_json)))
    result = _Stream(emit)
    started = time.perf_counter()
    suite.run(result)
    ms = (time.perf_counter() - started) * 1000
    return json.dumps({'run': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
                       'ok': result.wasSuccessful(), 'ms': ms})
```

- [ ] **Step 6: 运行，确认通过**

Run: `npx vitest run tests/unit/campus-bridge.test.ts`
Expected: 9 passed。如果 `ms` 那两条断言偶尔因计时器精度为 0 而失败：Pyodide 的 `time.perf_counter` 精度在 Node 里是微秒级，2,000 行不会为 0；不要放宽断言，先检查是不是跑到了空输入。

- [ ] **Step 7: 求职页的 Node 测试仍然通过**

Run: `npx vitest run tests/unit/career-bridge.test.ts`
Expected: 10 passed（`bootNode` 行为不变）。

- [ ] **Step 8: 提交**

```bash
git add src/scripts/campus-flow.ts public/assets/py/campus_bridge.py tests/unit/py-node.ts tests/unit/campus-bridge.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Campus bridge: trace analyze() line by line, constructed rows from fixed seeds, stream the study's tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 回放模型、表单与统计栏（纯函数）

**Files:**
- Modify: `src/scripts/campus-flow.ts`（在文件末尾追加）
- Test: `tests/unit/campus-flow.test.ts`

**Interfaces:**
- Consumes: Task 2 的常量、类型与 `bootCampus`。
- Produces:
  - `type Gate = 0 | 1 | 2 | 3 | -1`（记录停在第几道关卡；-1 为纳入）；`GATE_LINES = [89, 91, 93, 95]`、`INCLUDED_LINE = 97`。
  - `gateOf(line: number): Gate`；`linesOf(g: Gate): number[]`（一条记录在循环体内执行的行，不含 87）；`tally(gates: Gate[]): Record<number, number>`（含 `87: n + 1`）。
  - `baseline(trace: Record<string, number>, gates: Gate[], animate: number[]): Record<number, number>`：真实计数减去将被回放的记录的贡献。
  - `interface FormState { id; date; consent; eligible; used: 'yes'|'no'|'unsure'; frequency: Frequency; scenarios: Scenario[]; helpfulness: number|null; verification: number|null }`；`rowFromForm(f: FormState): Row`；`nextId(rows: Row[]): string`。
  - `interface Flow { gates: Gate[]; used: (0|1|2)[]; cells: number[]; excluded: [number, number, number, number] }`；`flowOf(rows: Row[], branches: number[]): Flow`；`toAnimate(prev: Gate[], next: Gate[]): number[]`。
  - `interface StatsView {...}`；`statsView(a: Analysis): StatsView`。
  - `testNames(src: string): string[]`。

- [ ] **Step 1: 写失败的测试 `tests/unit/campus-flow.test.ts`**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { call } from '../../public/assets/py-core.mjs';
import { bootCampus } from './py-node';
import {
  CAMPUS_RUNTIME, CORE_FILES, WINDOW, gateOf, linesOf, tally, baseline, rowFromForm, nextId, flowOf, toAnimate, statsView, testNames,
  type Gate, type Row, type Traced, type Invalid, type FormState,
} from '../../src/scripts/campus-flow';

let py: any;
beforeAll(async () => { py = await bootCampus(); }, 120_000);
const traced = (rows: unknown[]): Traced | Invalid => call(py, 'campus_bridge', 'analyze_traced', [rows, WINDOW.start, WINDOW.end]);
const ok = (rows: unknown[]): Traced => { const t = traced(rows); if ('error' in t) throw new Error(t.message); return t; };
const made = (kind: 'sample' | 'stress'): Row[] => call(py, 'campus_bridge', 'constructed', [kind]);
const numeric = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [Number(k), v]));
const FORM: FormState = { id: 'V001', date: '2026-09-15', consent: true, eligible: true, used: 'yes', frequency: '4_15', scenarios: ['study', 'daily'], helpfulness: 4, verification: 3 };

describe('the replay model', () => {
  it('names the lines one row runs through for each branch', () => {
    expect(([0, 1, 2, 3, -1] as Gate[]).map(linesOf)).toEqual([[88, 89], [88, 90, 91], [88, 90, 92, 93], [88, 90, 92, 94, 95], [88, 90, 92, 94, 97]]);
    expect([89, 91, 93, 95, 97].map(gateOf)).toEqual([0, 1, 2, 3, -1]);
    expect(() => gateOf(96)).toThrow();
  });
  it('reproduces the real trace of the stress set from its branches alone', () => {
    const rows = made('stress'), t = ok(rows);
    expect(tally(flowOf(rows, t.branches).gates)).toEqual(numeric(t.lines));
  });
  it('the baseline plus the replayed rows is the trace', () => {
    const rows = made('sample'), t = ok(rows), gates = flowOf(rows, t.branches).gates, animate = [0, 5, 17, 35];
    const b = baseline(t.lines, gates, animate);
    b[87] += animate.length;
    for (const i of animate) for (const n of linesOf(gates[i])) b[n] += 1;
    expect(b).toEqual(numeric(t.lines));
  });
  it('animates new rows and rows whose branch changed', () => {
    expect(toAnimate([0, -1], [0, 0, -1])).toEqual([1, 2]);
    expect(toAnimate([], [-1, 2])).toEqual([0, 1]);
    expect(toAnimate([-1, 3], [-1, 3])).toEqual([]);
  });
  it('lays included rows into cells in row order and counts each gate', () => {
    const rows = made('sample'), t = ok(rows), f = flowOf(rows, t.branches);
    expect(f.cells).toHaveLength(26);
    expect(f.excluded).toEqual([6, 2, 1, 1]);
    expect(f.cells.every((row, k) => f.gates[row] === -1 && (k === 0 || row > f.cells[k - 1]))).toBe(true);
    expect(() => flowOf(rows, t.branches.slice(1))).toThrow();
  });
});

describe('the questionnaire form', () => {
  it('Q1 or Q2 "no" ends the survey; Q4–Q7 apply only to Q3 "yes"; no scenario ticked is null', () => {
    expect(rowFromForm(FORM)).toEqual({ respondent_id: 'V001', collected_on: '2026-09-15', consent: true, eligible: true, used_ai: 'yes', frequency: '4_15', scenarios: ['study', 'daily'], helpfulness: 4, verification: 3 });
    expect(rowFromForm({ ...FORM, consent: false })).toMatchObject({ consent: false, used_ai: null, frequency: null, scenarios: null, helpfulness: null, verification: null });
    expect(rowFromForm({ ...FORM, used: 'unsure' })).toMatchObject({ used_ai: 'unsure', frequency: null, scenarios: null, helpfulness: null, verification: null });
    expect(rowFromForm({ ...FORM, scenarios: [], helpfulness: null })).toMatchObject({ scenarios: null, helpfulness: null });
  });
  it('every answer the form can build is one analysis.py accepts; the ID goes in untouched', () => {
    const forms: FormState[] = [FORM, { ...FORM, id: 'V002', consent: false }, { ...FORM, id: 'V003', eligible: false }, { ...FORM, id: 'V004', used: 'no' },
      { ...FORM, id: 'V005', used: 'unsure' }, { ...FORM, id: 'V006', scenarios: [], helpfulness: null, verification: null }, { ...FORM, id: 'V007', date: '2026-10-01' }];
    const t = ok(forms.map(rowFromForm));
    expect(t.result.input_n).toBe(7);
    expect(t.result.excluded).toEqual({ duplicate_id: 0, no_consent: 1, ineligible: 1, outside_period: 1 });
    expect(traced([rowFromForm({ ...FORM, id: ' V001' })])).toEqual({ error: 'invalid', message: '第 1 条记录：匿名 ID 不应有首尾空格' });
  });
  it('suggests the first unused visitor ID', () => {
    const r = (id: string) => rowFromForm({ ...FORM, id });
    expect(nextId([])).toBe('V001');
    expect(nextId([r('V001'), r('V002')])).toBe('V003');
    expect(nextId([r('V002')])).toBe('V001');
  });
});

describe('the statistics panel', () => {
  it('reads every figure from analyze()\'s output', () => {
    const v = statsView(ok([rowFromForm(FORM), rowFromForm({ ...FORM, id: 'V002', scenarios: [], helpfulness: null }), rowFromForm({ ...FORM, id: 'V003', used: 'no' })]).result);
    expect([v.included, v.input, v.yes]).toEqual(['3', '3', '66.7%']);
    expect(v.counts).toEqual({ yes: '2', no: '1', unsure: '0' });
    expect([v.sceneDen, v.sceneMissing]).toEqual(['1', '1']);
    expect(v.scenes.find(s => s.key === 'daily')).toEqual({ key: 'daily', share: 1, text: '100%' });
    expect(v.scenes.find(s => s.key === 'club')).toEqual({ key: 'club', share: 0, text: '0%' });
    expect(v.help).toEqual({ dist: [0, 0, 0, 1, 0], median: 4, medianText: '4', answered: '1', missing: '1' });
  });
  it('no data: shares and the median are missing, not zero', () => {
    const v = statsView(ok([]).result);
    expect([v.included, v.input, v.yes, v.help.medianText]).toEqual(['0', '0', '—', '—']);
    expect(v.scenes.every(s => s.text === '—' && s.share === 0)).toBe(true);
  });
  it('an even count gives the mean of the middle two, to one decimal', () => {
    const v = statsView(ok([rowFromForm({ ...FORM, helpfulness: 2 }), rowFromForm({ ...FORM, id: 'V002', helpfulness: 5 })]).result);
    expect([v.help.median, v.help.medianText]).toEqual([3.5, '3.5']);
  });
  it('large counts are grouped with commas', () => {
    const v = statsView(ok(made('stress')).result);
    expect([v.included, v.input]).toEqual(['1,720', '2,000']);
  });
});

describe('what the page loads and shows', () => {
  it('the runtime loads the study\'s downloads themselves, not copies, and no packages', () => {
    expect(CAMPUS_RUNTIME.files.slice(0, 2)).toEqual(['/downloads/campus/analysis.py', '/downloads/campus/test_analysis.py']);
    for (const u of CAMPUS_RUNTIME.files) expect(existsSync(`public${u}`), u).toBe(true);
    const body = readFileSync('src/copy/projects/ai-campus.zh.md', 'utf8');
    expect(body).toContain('(/downloads/campus/analysis.py)');
    expect(body).toContain('(/downloads/campus/test_analysis.py)');
    expect(CAMPUS_RUNTIME.packages).toEqual([]);
  });
  it('the core files the page counts are in the vendored manifest', () => {
    const names = JSON.parse(readFileSync('public/assets/vendor/pyodide/0.29.5/manifest.json', 'utf8')).files.map((f: { name: string }) => f.name);
    for (const f of CORE_FILES) expect(names).toContain(f);
  });
  it('the live source window is still the exclusion loop (lines 87–97)', () => {
    const lines = readFileSync('public/downloads/campus/analysis.py', 'utf8').split('\n');
    expect(lines[86].trim()).toBe('for row in rows:');
    expect(lines[88].trim()).toBe("excluded['duplicate_id'] += 1");
    expect(lines[96].trim()).toBe('included.append(row)');
  });
  it('lists the tests in the order unittest runs them', () => {
    const names = testNames(readFileSync('public/downloads/campus/test_analysis.py', 'utf8'));
    expect(names).toHaveLength(10);
    expect(names[0]).toBe('test_distinct_denominators_and_missing');
    expect([...names].sort()).toEqual(names);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/campus-flow.test.ts`
Expected: FAIL，`gateOf is not a function`（及同类）。

- [ ] **Step 3: 在 `src/scripts/campus-flow.ts` 末尾追加实现**

```ts
/* ---------- pure functions ---------- */

/** The exclusion gate a row stops at (0 duplicate ID · 1 no consent · 2 not eligible · 3 outside the window), or -1
 *  when it is included. */
export type Gate = 0 | 1 | 2 | 3 | -1;
export const GATE_LINES = [89, 91, 93, 95] as const;
export const INCLUDED_LINE = 97;

export function gateOf(line: number): Gate {
  const g = (GATE_LINES as readonly number[]).indexOf(line);
  if (g >= 0) return g as Gate;
  if (line === INCLUDED_LINE) return -1;
  throw new Error(`not a branch line: ${line}`);
}
/** Lines 88–97 one row runs through: each test up to the branch it takes, then that branch (the loop header, line 87,
 *  is counted apart; Python reports no line event for the bare `else:` on line 96). */
export function linesOf(g: Gate): number[] {
  const tests = g < 0 ? 4 : g + 1;
  const out = Array.from({ length: tests }, (_, k) => 88 + 2 * k);
  out.push(g === -1 ? INCLUDED_LINE : GATE_LINES[g]);          // === narrows the union; < 0 would not
  return out;
}
/** The line counts a complete run of the loop over these rows gives; the header runs once more than there are rows. */
export function tally(gates: Gate[]): Record<number, number> {
  const out: Record<number, number> = { 87: gates.length + 1 };
  for (const g of gates) for (const n of linesOf(g)) out[n] = (out[n] ?? 0) + 1;
  return out;
}
/** The counts to show before the replay starts: the real trace minus what the replayed rows will add as they pass. */
export function baseline(trace: Record<string, number>, gates: Gate[], animate: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [n, c] of Object.entries(trace)) out[Number(n)] = c;
  out[87] -= animate.length;
  for (const i of animate) for (const n of linesOf(gates[i])) out[n] -= 1;
  return out;
}

export interface FormState {
  id: string; date: string; consent: boolean; eligible: boolean;
  used: 'yes' | 'no' | 'unsure'; frequency: Frequency; scenarios: Scenario[];
  helpfulness: number | null; verification: number | null;
}
/** One answer as analysis.py expects it: Q1 or Q2 "no" ends the questionnaire, Q4–Q7 apply only to Q3 "yes", and no
 *  scenario ticked means Q5 was skipped. Nothing is corrected here — the program itself decides what is valid. */
export function rowFromForm(f: FormState): Row {
  const answered = f.consent && f.eligible, yes = answered && f.used === 'yes';
  return {
    respondent_id: f.id, collected_on: f.date, consent: f.consent, eligible: f.eligible,
    used_ai: answered ? f.used : null,
    frequency: yes ? f.frequency : null,
    scenarios: yes && f.scenarios.length ? [...f.scenarios] : null,
    helpfulness: yes ? f.helpfulness : null,
    verification: yes ? f.verification : null,
  };
}
/** The first visitor ID (V001, V002, …) not yet in the data. */
export function nextId(rows: Row[]): string {
  const used = new Set(rows.map(r => r.respondent_id));
  for (let n = 1; ; n++) { const id = `V${String(n).padStart(3, '0')}`; if (!used.has(id)) return id; }
}

/** Where every row of a data set went, as the pipeline draws it. */
export interface Flow {
  gates: Gate[];
  /** Q3 of each row: 0 yes · 1 no · 2 unsure (rows that never answered Q3 count as 0; they are never drawn as cells). */
  used: (0 | 1 | 2)[];
  /** The row index behind each lit cell of the included matrix, in row order. */
  cells: number[];
  excluded: [number, number, number, number];
}
export function flowOf(rows: Row[], branches: number[]): Flow {
  if (branches.length !== rows.length) throw new Error(`${branches.length} branches for ${rows.length} rows`);
  const gates = branches.map(gateOf), cells: number[] = [], excluded: Flow['excluded'] = [0, 0, 0, 0];
  gates.forEach((g, i) => { if (g === -1) cells.push(i); else excluded[g]++; });
  const used = rows.map(r => (r.used_ai === 'no' ? 1 : r.used_ai === 'unsure' ? 2 : 0) as 0 | 1 | 2);
  return { gates, used, cells, excluded };
}
/** Rows to replay: the new ones, and those whose branch changed (the program re-checks every row on every run). */
export function toAnimate(prev: Gate[], next: Gate[]): number[] {
  const out: number[] = [];
  next.forEach((g, i) => { if (i >= prev.length || prev[i] !== g) out.push(i); });
  return out;
}

export interface StatsView {
  included: string; input: string; yes: string; counts: { yes: string; no: string; unsure: string };
  sceneDen: string; sceneMissing: string; scenes: { key: Scenario; share: number; text: string }[];
  help: { dist: number[]; median: number | null; medianText: string; answered: string; missing: string };
}
const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (v: number | null, digits: number) => (v === null ? '—' : `${(v * 100).toFixed(digits)}%`);
/** Every figure of the statistics panel, read from analyze()'s output; a share with no denominator stays "—". */
export function statsView(a: Analysis): StatsView {
  const m = a.helpfulness.median;
  return {
    included: fmt(a.included_n), input: fmt(a.input_n), yes: pct(a.usage.yes_share, 1),
    counts: { yes: fmt(a.usage.counts.yes), no: fmt(a.usage.counts.no), unsure: fmt(a.usage.counts.unsure) },
    sceneDen: fmt(a.scenarios.answered_n), sceneMissing: fmt(a.scenarios.missing_n),
    scenes: SCENARIOS.map(key => ({ key, share: a.scenarios.items[key].share ?? 0, text: pct(a.scenarios.items[key].share, 0) })),
    help: {
      dist: (['1', '2', '3', '4', '5'] as const).map(v => a.helpfulness.distribution[v]),
      median: m, medianText: m === null ? '—' : Number.isInteger(m) ? String(m) : m.toFixed(1),
      answered: fmt(a.helpfulness.answered_n), missing: fmt(a.helpfulness.missing_n),
    },
  };
}
/** The test methods of a unittest file in the order unittest runs them (sorted by name). */
export function testNames(src: string): string[] {
  return [...src.matchAll(/^\s+def (test_\w+)\(/gm)].map(m => m[1]).sort();
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/campus-flow.test.ts`
Expected: 16 passed。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/campus-flow.ts tests/unit/campus-flow.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Campus flow: replay model checked against the real trace, questionnaire rows, statistics panel" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 共用冷启动遮罩（求职页换用）

**Files:**
- Create: `src/components/PyBoot.astro`
- Create: `src/scripts/py-boot-view.ts`
- Modify: `src/components/CareerLive.astro:55-58`（遮罩标记）、`:148-154`、`:178-179`（遮罩样式）
- Modify: `src/scripts/career-live.ts:48-91`（删除本地 `bootView`）、`:96`（改用共用视图）

**Interfaces:**
- Consumes: `PyProgress`、`PyReady`（py-runtime.ts）。
- Produces:
  - `<PyBoot prefix="xx" />`：生成 `#xx-boot`、`#xx-boot-hex`、`#xx-boot-log`、`#xx-boot-mods`（求职页用 `cl`，id 与现在一致，现有测试不用改）。遮罩绝对定位铺满最近的定位祖先。
  - `interface BootText { hexTitle; bootLine(step, t, mb, ms, detail); bootReady(py, s) }`；`interface BootFile { name: string; sha256: string }`。
  - `bootView(o: { root; prefix; text: BootText; chip: HTMLElement; reduced: boolean; shown: () => boolean; files: () => Promise<BootFile[]> }): { step(p); done(r): Promise<void>; hide() }`。

- [ ] **Step 1: 写 `src/components/PyBoot.astro`**

```astro
---
/** The cold-boot overlay shared by the live demos: the SHA-256 of each file being loaded, measured log lines, module chips
 *  that fly into the page's chip when the runtime is ready. Driven by src/scripts/py-boot-view.ts. */
interface Props { prefix: string }
const { prefix } = Astro.props;
---
<div class="pb" id={`${prefix}-boot`} hidden>
  <pre class="pb-hex" id={`${prefix}-boot-hex`} aria-hidden="true"></pre>
  <div><div class="pb-log" id={`${prefix}-boot-log`}></div><div class="pb-mods" id={`${prefix}-boot-mods`} aria-hidden="true"></div></div>
</div>
<style>
  .pb { position: absolute; inset: 0; z-index: 3; display: grid; grid-template-columns: 1fr 1.3fr; gap: 28px; padding: 22px 26px; background: var(--night); font: 12.5px/1.8 Consolas, 'Cascadia Mono', monospace; color: var(--night-mute); }
  .pb[hidden] { display: none; }
  .pb-hex { margin: 0; overflow: hidden; font-size: 11.5px; line-height: 1.6; color: color-mix(in srgb, var(--night-mute) 60%, transparent); -webkit-mask-image: linear-gradient(180deg, transparent, #000 25%, #000 80%, transparent); mask-image: linear-gradient(180deg, transparent, #000 25%, #000 80%, transparent); }
  .pb-log :global(.ready) { color: var(--night-fg); font-weight: 600; }
  .pb-mods { display: grid; grid-template-columns: repeat(3, max-content); gap: 6px 8px; margin-top: 16px; }
  .pb-mods :global(.pb-mod) { padding: 2px 7px; border: 1px solid color-mix(in srgb, var(--night-fg) 25%, transparent); color: var(--night-fg); font-size: 11px; opacity: 0; transform: scale(.6); }
  .pb-mods :global(.pb-mod.in) { opacity: 1; transform: none; transition: opacity .2s, transform .25s cubic-bezier(.2,.8,.2,1.3); }
  @media (max-width: 800px) {
    .pb { grid-template-columns: minmax(0, 1fr); }
    .pb-hex { display: none; }
  }
</style>
```

- [ ] **Step 2: 写 `src/scripts/py-boot-view.ts`**

```ts
import type { PyProgress, PyReady } from './py-runtime';

/** The words a page gives its boot overlay. */
export interface BootText {
  hexTitle: string;
  bootLine: (step: PyProgress['step'], t: number, mb: number, ms: number, detail: string) => string;
  bootReady: (py: string, s: number) => string;
}
/** A file the runtime loads, with the SHA-256 its manifest (or the build) recorded. */
export interface BootFile { name: string; sha256: string }
export interface BootView { step(p: PyProgress): void; done(r: PyReady): Promise<void>; hide(): void }
export interface BootViewOptions {
  root: HTMLElement; prefix: string; text: BootText; chip: HTMLElement; reduced: boolean;
  /** False while the page shows something else (a replay, a fallback): the module chips then skip their flight. */
  shown: () => boolean;
  files: () => Promise<BootFile[]>;
}
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Drives a PyBoot overlay. Every number it shows is measured by the worker or read from a manifest. */
export function bootView(o: BootViewOptions): BootView {
  const $ = (suffix: string) => o.root.querySelector<HTMLElement>(`#${o.prefix}-boot${suffix}`)!;
  const box = $(''), log = $('-log'), hex = $('-hex'), mods = $('-mods');
  box.hidden = o.reduced; log.replaceChildren(); mods.replaceChildren(); hex.textContent = '';
  const t0 = performance.now(), shown: string[] = [];
  let lines: string[] = [], at = 0, modules: string[] = [];
  // The byte stream is the SHA-256 of each file being loaded.
  void o.files().then(fs => {
    lines = fs.map(f => `${f.sha256.slice(0, 8)} ${f.sha256.slice(8, 16)} ${f.sha256.slice(16, 24)} ${f.sha256.slice(24, 32)}  ${f.name}`);
  }).catch(() => {});
  const hx = window.setInterval(() => {
    if (!lines.length) return;
    shown.push(lines[at++ % lines.length]); if (shown.length > 40) shown.shift();
    hex.textContent = `${o.text.hexTitle}\n${shown.join('\n')}`;
  }, 60);
  return {
    step(p) {
      const d = document.createElement('div');
      d.textContent = o.text.bootLine(p.step, (performance.now() - t0) / 1000, p.bytes / 1048576, p.ms, p.detail);
      log.append(d);
      if (p.modules) modules = p.modules;
    },
    async done(r) {
      clearInterval(hx);
      if (!o.reduced && o.shown()) {
        for (const m of modules) { const c = document.createElement('span'); c.className = 'pb-mod'; c.textContent = m; mods.append(c); }
        const chips = [...mods.children] as HTMLElement[];
        for (const c of chips) { c.classList.add('in'); await wait(30); }
        await wait(250);
        const t = o.chip.getBoundingClientRect(), tx = t.left + t.width / 2, ty = t.top + t.height / 2;
        await Promise.all(chips.map((c, i) => {
          const b = c.getBoundingClientRect();
          return c.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${tx - b.left - b.width / 2}px, ${ty - b.top - b.height / 2}px) scale(.15)`, opacity: 0 }],
            { duration: 500, delay: i * 20, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
        }));
      }
      const d = document.createElement('div'); d.className = 'ready'; d.textContent = o.text.bootReady(r.python, r.ms / 1000); log.append(d);
      if (!o.reduced) await wait(300);
      box.hidden = true;
    },
    hide() { clearInterval(hx); box.hidden = true; },
  };
}
```

- [ ] **Step 3: 求职页换用**

`src/components/CareerLive.astro`：
- frontmatter 加 `import PyBoot from './PyBoot.astro';`。
- 第 55–58 行的 `<div class="cl-boot" id="cl-boot" hidden> … </div>` 整块换成 `<PyBoot prefix="cl" />`。
- 删除样式里以 `.cl-boot`、`.cl-boot-hex`、`.cl-boot-log`、`.cl-boot-mods` 开头的 7 条规则（第 148–154 行），以及 `@media (max-width: 800px)` 里的 `.cl-boot { … }` 和 `.cl-boot-hex { … }` 两行。

`src/scripts/career-live.ts`：
- 顶部加 `import { bootView } from './py-boot-view';`。
- 删除 `/* ---------- boot: every number shown is measured or read from the manifests ---------- */` 注释和整个本地 `function bootView() { … }`（第 48–91 行）。
- `start()` 里 `const view = bootView();` 改为：

```ts
    const view = bootView({
      root, prefix: 'cl', text: T, chip: $('cl-chip'), reduced, shown: () => !stage.hidden,
      files: () => Promise.all(MANIFESTS.map(u => fetch(u).then(r => r.json()))).then(ms =>
        ms.flatMap(m => m.files.map((f: { name?: string; path?: string; sha256: string }) => ({ name: f.name ?? f.path ?? '', sha256: f.sha256 })))),
    });
```

- [ ] **Step 4: 求职页的冷启动相关测试**

Run: `npx playwright test tests/e2e/career-live.spec.ts --project=desktop -g "boots in the browser|byte stream|reduced motion|replay during boot|blocked runtime"`
Expected: 5 passed。

Run: `npx vitest run`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/components/PyBoot.astro src/scripts/py-boot-view.ts src/components/CareerLive.astro src/scripts/career-live.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Shared cold-boot overlay for the live demos; the job agent page uses it" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 粒子流水线（原型 p3 的移植，由真实分支驱动）

**Files:**
- Create: `src/scripts/campus-pipeline.ts`
- Test: `tests/unit/campus-pipeline.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `Flow`。
- Produces:
  - `interface PipeText { gates: readonly string[]; conds: readonly string[]; keys: readonly string[]; included: string; append: string; loop: string; you: string; legend: readonly string[]; q3: string }`（各 4 / 4 / 4 / 3 项）。
  - `interface PipeOptions { reduced: boolean; light: boolean; hit: (line: number) => void }`：粒子经过哪一行，就用那一行的行号调用 `hit`（生成时 87；到第 g 道关卡时 88+2g；被拦下时 89+2g；通过第 4 道时 97）。`light`（手机/省流量）时每 5 份回答画 1 个光点，其余回答一次性报告同样的行号并立即落定。
  - `interface PlayOptions { storm: boolean; special: number | null }`。
  - `createPipeline(host, text, o): { play(flow, rows, opt): Promise<boolean>; show(flow): void }`。`play` 被新的 `play`/`show` 取代时返回 false；页面不在视口内时跳过动画直接落定、返回 true。
  - `matrixPitch(aw, ah, n): { pitch: number; cols: number }`（纯函数）。

- [ ] **Step 1: 写失败的测试 `tests/unit/campus-pipeline.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { matrixPitch } from '../../src/scripts/campus-pipeline';

describe('the included matrix', () => {
  it('fits every cell inside the area, at most 24 px apart', () => {
    for (const [aw, ah, n] of [[420, 310, 24], [420, 310, 1720], [110, 200, 1720], [300, 180, 2036], [60, 40, 5]]) {
      const { pitch, cols } = matrixPitch(aw, ah, n);
      expect(pitch).toBeLessThanOrEqual(24);
      expect(cols * pitch).toBeLessThanOrEqual(aw + 1e-6);
      expect(Math.ceil(n / cols) * pitch).toBeLessThanOrEqual(ah + 1e-6);
    }
  });
  it('uses the full pitch when there are few cells', () => {
    expect(matrixPitch(420, 310, 24)).toEqual({ pitch: 24, cols: 17 });
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/campus-pipeline.test.ts`
Expected: FAIL，找不到模块 `campus-pipeline`。

- [ ] **Step 3: 写 `src/scripts/campus-pipeline.ts`**

对照 `.superpowers/proto-v2/p3.html` 第 358–714 行的原型。与原型的区别：每个粒子走哪条路取自 `flow.gates`（程序的真实分支），不再自己判断；统计、代码计数不在这里算；颜色只从 tokens 读取；窄屏（宽度 < 560，或宽屏间距下相邻关卡名、条件文字会相碰时——按实测字宽判断，中文约 < 622 px、英文约 < 700 px）字号缩小、关卡名上下错开、省略条件与桶下的字段名；"for row in rows"标签放在关卡上方；图例先量宽度，放不下就整体左移；`light` 时不留拖尾、火花减少、结束不震动；页面离开视口时直接落定。

```ts
import type { Flow } from './campus-flow';

/** Canvas labels, per language. Gates follow analysis.py's order of exclusion. */
export interface PipeText {
  gates: readonly string[]; conds: readonly string[]; keys: readonly string[];
  included: string; append: string; loop: string; you: string; legend: readonly string[]; q3: string;
}
/** hit(n) is called with each source line a replayed row passes, in the order the program ran them. */
export interface PipeOptions { reduced: boolean; light: boolean; hit: (line: number) => void }
export interface PlayOptions { storm: boolean; special: number | null }
export interface Pipeline {
  /** Replays rows (indices into flow) through the gates; every other row is drawn where flow puts it from the start.
   *  Resolves true once they have settled, false when a newer play or show took over. */
  play(flow: Flow, rows: number[], o: PlayOptions): Promise<boolean>;
  /** Draws flow's final state at once. */
  show(flow: Flow): void;
}

/** The largest square pitch (at most 24 px) at which n cells fit into an aw × ah area. */
export function matrixPitch(aw: number, ah: number, n: number): { pitch: number; cols: number } {
  let p = Math.min(24, Math.sqrt((aw * ah) / Math.max(1, n)));
  for (let k = 0; k < 400; k++) {
    const cols = Math.max(1, Math.floor(aw / p));
    if (Math.ceil(n / cols) * p <= ah) return { pitch: p, cols };
    p *= 0.97;
  }
  return { pitch: p, cols: Math.max(1, Math.floor(aw / p)) };
}

const PMAX = 4096, SMAX = 1600, TMAX = 1024, TAU = Math.PI * 2, LIGHT_STRIDE = 5;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const fmt = (n: number) => n.toLocaleString('en-US');
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

export function createPipeline(host: HTMLElement, text: PipeText, o: PipeOptions): Pipeline {
  const STRIDE = o.light ? LIGHT_STRIDE : 1;
  const base = document.createElement('canvas'), top = document.createElement('canvas');
  for (const c of [base, top]) { c.setAttribute('aria-hidden', 'true'); host.append(c); }
  const gB = base.getContext('2d')!, gF = top.getContext('2d')!;

  /* ---------- colours and fonts: tokens only ---------- */
  const css = getComputedStyle(host);
  const tok = (name: string) => {
    const h = css.getPropertyValue(name).trim().replace('#', '');
    const n = parseInt(h.length === 3 ? [...h].map(c => c + c).join('') : h, 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const FG = tok('--night-fg'), MUTE = tok('--night-mute'), RED = tok('--red');
  const SOFT = RED.map((v, i) => Math.round(v + (FG[i] - v) * 0.35));          // red, lifted towards the foreground
  const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const DISP = css.getPropertyValue('--font-display').trim() || 'sans-serif';
  const BODY = css.getPropertyValue('--font-body').trim() || 'sans-serif';
  const MONO = "Consolas, 'Cascadia Mono', monospace";
  const sprite = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d')!); return c;
  };
  const radial = (size: number, stops: [number, string][]) => sprite(size, size, g => {
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([at, col]) => gr.addColorStop(at, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  });
  const linear = (w: number, h: number, across: boolean, stops: [number, string][]) => sprite(w, h, g => {
    const gr = across ? g.createLinearGradient(0, 0, w, 0) : g.createLinearGradient(0, 0, 0, h);
    stops.forEach(([at, col]) => gr.addColorStop(at, col)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const SPR = {
    dot: radial(16, [[0, rgba(FG, .85)], [.16, rgba(FG, .85)], [.3, rgba(FG, .45)], [.6, rgba(FG, .12)], [1, rgba(FG, 0)]]),
    red: radial(16, [[0, rgba(SOFT, .9)], [.2, rgba(RED, .75)], [.55, rgba(RED, .2)], [1, rgba(RED, 0)]]),
    big: radial(44, [[0, rgba(FG, 1)], [.1, rgba(SOFT, .9)], [.35, rgba(RED, .35)], [1, rgba(RED, 0)]]),
    gate: linear(64, 4, true, [[0, rgba(RED, 0)], [.42, rgba(RED, .28)], [.5, rgba(SOFT, .6)], [.58, rgba(RED, .28)], [1, rgba(RED, 0)]]),
    shim: linear(4, 40, false, [[0, rgba(SOFT, 0)], [.5, rgba(FG, .9)], [1, rgba(SOFT, 0)]]),
    glow: radial(24, [[0, rgba(SOFT, .7)], [.45, rgba(RED, .25)], [1, rgba(RED, 0)]]),
  };

  /* ---------- geometry ---------- */
  let W = 0, H = 0, narrow = false, laneY = 124, gTop = 0, gBot = 0, binBot = 0, binMaxH = 0, binW = 48;
  let mx0 = 0, mx1 = 0, my0 = 0, my1 = 0, pitch = 18, cols = 1, cellS = 12, mxOff = 0;
  let laneGrad: CanvasGradient | null = null, barGrad: CanvasGradient | null = null;
  const GX = new Float32Array(4);
  const cellX = (k: number) => mxOff + (k % cols) * pitch + pitch / 2;
  const cellY = (k: number) => my1 - (Math.floor(k / cols) + 0.5) * pitch;

  /* ---------- what is drawn: the flow shown, which cells are lit, how full each bin is ---------- */
  let flow: Flow | null = null, cellOf = new Int32Array(0), lit = new Uint8Array(0), litAt = new Float64Array(0);
  const landed = new Float64Array(4), binH = new Float32Array(4), binPulse = new Float32Array(4), heat = new Float32Array(4);
  let binScale = 10, matPulse = 0;

  /* ---------- particles, sparks, pass ticks, rings (structure of arrays: no per-particle objects) ---------- */
  const px = new Float32Array(PMAX), py = new Float32Array(PMAX), pvx = new Float32Array(PMAX), pvy = new Float32Array(PMAX);
  const psx = new Float32Array(PMAX), psy = new Float32Array(PMAX), poff = new Float32Array(PMAX), pwob = new Float32Array(PMAX), pbx = new Float32Array(PMAX);
  const pt0 = new Float64Array(PMAX), prow = new Int32Array(PMAX), pst = new Uint8Array(PMAX), pg = new Uint8Array(PMAX);
  let np = 0, nLane = 0;
  const kill = (i: number) => {
    np--; if (i === np) return; const s = np;
    px[i] = px[s]; py[i] = py[s]; pvx[i] = pvx[s]; pvy[i] = pvy[s]; psx[i] = psx[s]; psy[i] = psy[s]; poff[i] = poff[s]; pwob[i] = pwob[s];
    pbx[i] = pbx[s]; pt0[i] = pt0[s]; prow[i] = prow[s]; pst[i] = pst[s]; pg[i] = pg[s];
  };
  const sx = new Float32Array(SMAX), sy = new Float32Array(SMAX), svx = new Float32Array(SMAX), svy = new Float32Array(SMAX), sl = new Float32Array(SMAX), sm = new Float32Array(SMAX), sc = new Uint8Array(SMAX);
  let ns = 0;
  const tg = new Uint8Array(TMAX), ty = new Float32Array(TMAX), tt = new Float64Array(TMAX).fill(-1e9);
  let tHead = 0;
  const rings: { x: number; y: number; r0: number; r1: number; dur: number; col: number[]; t0: number }[] = [];
  const burst = (x: number, y: number, n: number) => {
    for (let k = 0; k < n && ns < SMAX; k++) {
      const a = Math.random() * TAU, v = 90 + Math.random() * 210;
      sx[ns] = x; sy[ns] = y; svx[ns] = Math.cos(a) * v - 50; svy[ns] = Math.sin(a) * v - 40;
      sl[ns] = sm[ns] = 0.26 + Math.random() * 0.3; sc[ns] = Math.random() < 0.55 ? 0 : 1; ns++;
    }
  };
  const ring = (x: number, y: number, r0: number, r1: number, dur: number, col: number[], now: number) => { if (rings.length < 8) rings.push({ x, y, r0, r1, dur, col, t0: now }); };

  /* ---------- the replay ---------- */
  let queue: number[] = [], qi = 0, emitAcc = 0, storm = false, special: number | null = null, runT0 = 0;
  let done: ((settled: boolean) => void) | null = null;
  const finish = (v: boolean) => { const d = done; done = null; d?.(v); };

  function setFlow(f: Flow) {
    flow = f;
    cellOf = new Int32Array(f.gates.length).fill(-1);
    f.cells.forEach((row, k) => { cellOf[row] = k; });
    lit = new Uint8Array(f.cells.length); litAt = new Float64Array(f.cells.length);
    relayoutMatrix();
  }
  /** The exact final state: every bin at the program's count, every included cell lit. */
  function snap() {
    if (!flow) return;
    for (let g = 0; g < 4; g++) landed[g] = flow.excluded[g];
    lit.fill(1);
  }
  const binTarget = () => { let mx = 0; for (let g = 0; g < 4; g++) mx = Math.max(mx, landed[g]); return Math.max(10, Math.ceil((mx * 1.25) / 5) * 5); };
  function settleBins() { binScale = binTarget(); for (let g = 0; g < 4; g++) binH[g] = (landed[g] / binScale) * binMaxH; }

  function relayoutMatrix() {
    const aw = mx1 - mx0, ah = my1 - my0;
    if (aw <= 0 || ah <= 0) return;
    ({ pitch, cols } = matrixPitch(aw, ah, Math.max(flow?.cells.length ?? 0, 24)));
    cellS = Math.max(2, pitch * 0.72); mxOff = mx0 + (aw - cols * pitch) / 2;
  }
  function layout() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    for (const c of [base, top]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    gB.setTransform(dpr, 0, 0, dpr, 0, 0); gF.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Narrow when the wide layout's neighbouring gate names or conditions would touch (measured, so it holds for both
    // languages and whatever font the visitor has; about < 622 px in Chinese and < 700 px in English).
    const crowded = (font: string, labels: readonly string[]) => {
      gB.font = font; const w = labels.map(t => gB.measureText(t).width), gap = W * 0.135;
      return w.some((v, k) => k > 0 && (v + w[k - 1]) / 2 + 6 > gap);
    };
    narrow = W < 560 || crowded(`600 12.5px ${BODY}`, text.gates) || crowded(`10.5px ${MONO}`, text.conds);
    laneY = narrow ? 96 : 124; gTop = laneY - (narrow ? 44 : 60); gBot = laneY + (narrow ? 42 : 56);
    const g0 = W * 0.13, gs = W * (narrow ? 0.13 : 0.135);
    for (let i = 0; i < 4; i++) GX[i] = g0 + gs * i;
    binBot = H - 30; binMaxH = Math.max(20, binBot - (gBot + 40)); binW = Math.min(54, gs * 0.46);
    mx0 = GX[3] + gs * 0.74; mx1 = W - 14; my0 = narrow ? 50 : 58; my1 = H - 30;
    laneGrad = gB.createLinearGradient(0, 0, GX[3] + 70, 0);
    laneGrad.addColorStop(0, rgba(FG, 0)); laneGrad.addColorStop(.08, rgba(FG, .045)); laneGrad.addColorStop(.9, rgba(FG, .03)); laneGrad.addColorStop(1, rgba(FG, 0));
    barGrad = gB.createLinearGradient(0, binBot - binMaxH, 0, binBot);
    barGrad.addColorStop(0, rgba(RED, .78)); barGrad.addColorStop(1, rgba(RED, .26));
    relayoutMatrix(); settleBins();
  }

  /* ---------- simulation ---------- */
  function spawn(row: number) {
    const i = np++, me = row === special;
    px[i] = -4 - Math.random() * 16;
    poff[i] = me ? 0 : clamp(gauss() * (storm ? 9 : 5), -24, 24);
    py[i] = laneY + poff[i]; pwob[i] = Math.random() * TAU;
    pvx[i] = me ? 210 : storm ? 470 + Math.random() * 200 : 330 + Math.random() * 40;
    pst[i] = 0; pg[i] = 0; prow[i] = row;
    o.hit(87);                                                          // for row in rows
  }
  function emit(dt: number, now: number) {
    if (qi >= queue.length) return;
    emitAcc += (storm ? 380 * clamp((now - runT0) / 600, 0.2, 1) : 30) * dt;
    if (!storm && np === 0 && emitAcc < 1) emitAcc = 1;                // no idle wait before the first row
    while (emitAcc >= 1 && qi < queue.length && np < PMAX) {
      emitAcc -= 1;
      const row = queue[qi++];
      // Phones: one point of light per STRIDE answers; the rest report their lines and land at once, so the data is unchanged.
      if (STRIDE > 1 && row !== special && qi % STRIDE) pass(row, now); else spawn(row);
    }
  }
  /** A replayed row drawn without a particle: it runs through its lines in the program's order and lands straight away. */
  function pass(row: number, now: number) {
    const g = flow!.gates[row];
    o.hit(87);
    for (let k = 0; k <= (g === -1 ? 3 : g); k++) o.hit(88 + 2 * k);
    if (g === -1) { o.hit(97); const k = cellOf[row]; if (k >= 0) { lit[k] = 1; litAt[k] = now; } }
    else { o.hit(89 + 2 * g); landed[g]++; }
  }
  function update(dt: number, now: number) {
    nLane = 0;
    for (let i = 0; i < np; i++) {
      const s = pst[i];
      if (s === 0) {                                                    // travelling the lane
        px[i] += pvx[i] * dt; py[i] = laneY + poff[i] + Math.sin(now * .005 + pwob[i]) * 1.6; nLane++;
        const g = pg[i];
        if (px[i] < GX[g]) continue;
        o.hit(88 + 2 * g);                                              // the test at this gate
        if (flow!.gates[prow[i]] === g) {                               // the program excluded this row here
          o.hit(89 + 2 * g);
          pst[i] = 1; px[i] = GX[g]; pvx[i] = (Math.random() - .5) * 60; pvy[i] = -50 - Math.random() * 90;
          pbx[i] = (Math.random() - .5) * (binW - 12);
          heat[g] = Math.min(1, heat[g] + .45);
          burst(GX[g], py[i], o.light ? 1 : 3 + ((Math.random() * 3) | 0));
        } else {
          tg[tHead] = g; ty[tHead] = py[i]; tt[tHead] = now; tHead = (tHead + 1) % TMAX;
          if (g === 3) {                                                // included.append(row)
            o.hit(97);
            pst[i] = 2; psx[i] = px[i]; psy[i] = py[i]; pt0[i] = now;
            pvx[i] = prow[i] === special ? 900 : storm ? 520 : 680;     // flight time (ms)
          } else pg[i] = g + 1;
        }
      } else if (s === 1) {                                             // falling into the bin
        const g = pg[i];
        pvy[i] += 1500 * dt; py[i] += pvy[i] * dt; px[i] += (GX[g] + pbx[i] - px[i]) * Math.min(1, dt * 7);
        if (py[i] >= binBot - binH[g] - 2) { landed[g]++; binPulse[g] = 1; kill(i); i--; }
      } else {                                                          // flying into its cell of the included matrix
        const k = cellOf[prow[i]], t = (now - pt0[i]) / pvx[i];
        if (t >= 1 || k < 0) { if (k >= 0) { lit[k] = 1; litAt[k] = now; } kill(i); i--; continue; }
        const e = 1 - Math.pow(1 - t, 2.4);
        px[i] = psx[i] + (cellX(k) - psx[i]) * e; py[i] = psy[i] + (cellY(k) - psy[i]) * e - Math.sin(Math.PI * t) * 30;
      }
    }
    for (let j = 0; j < ns; j++) {
      sl[j] -= dt;
      if (sl[j] <= 0) { ns--; sx[j] = sx[ns]; sy[j] = sy[ns]; svx[j] = svx[ns]; svy[j] = svy[ns]; sl[j] = sl[ns]; sm[j] = sm[ns]; sc[j] = sc[ns]; j--; continue; }
      const d = 1 - 2.6 * dt; svx[j] *= d; svy[j] = svy[j] * d + 460 * dt; sx[j] += svx[j] * dt; sy[j] += svy[j] * dt;
    }
    binScale += (binTarget() - binScale) * Math.min(1, dt * 4);
    const kd = Math.exp(-dt * 5.5), kp = Math.exp(-dt * 4);
    for (let g = 0; g < 4; g++) { binH[g] += ((landed[g] / binScale) * binMaxH - binH[g]) * Math.min(1, dt * 10); heat[g] *= kd; binPulse[g] *= kp; }
    matPulse *= Math.exp(-dt * 2.2);
  }

  /* ---------- drawing: the base layer (cleared every frame) ---------- */
  function drawBase(now: number) {
    const g = gB;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    g.fillStyle = laneGrad!; g.fillRect(0, laneY - 26, GX[3] + 70, 52);
    g.strokeStyle = rgba(FG, .1); g.lineWidth = 1; g.setLineDash([2, 6]);
    g.beginPath(); g.moveTo(0, laneY - 26.5); g.lineTo(GX[3] + 40, laneY - 26.5); g.moveTo(0, laneY + 26.5); g.lineTo(GX[3] + 40, laneY + 26.5); g.stroke();
    g.strokeStyle = rgba(RED, .2); g.beginPath();
    for (let k = 0; k < 4; k++) { g.moveTo(GX[k] + .5, gBot + 6); g.lineTo(GX[k] + .5, binBot - binMaxH - 30); }
    g.stroke(); g.setLineDash([]);
    g.textAlign = 'left'; g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.loop, 8, gTop - 8);   // above the gates, never across one
    for (let k = 0; k < 4; k++) drawGate(g, k, now);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(FG, 1);               // the laser reads each passing row
    for (let j = 0; j < TMAX; j++) {
      const age = now - tt[j]; if (age > 170 || age < 0) continue;
      g.globalAlpha = .42 * (1 - age / 170); g.fillRect(GX[tg[j]] - 8, ty[j] - .5, 16, 1);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 4; k++) drawBin(g, k);
    drawMatrix(g, now);
    if (special !== null) for (let i = 0; i < np; i++) {                              // label the visitor's own answer
      if (prow[i] !== special) continue;
      g.strokeStyle = rgba(SOFT, .8); g.lineWidth = 1.2;
      g.beginPath(); g.arc(px[i], py[i], 9 + Math.sin(now * .012) * 1.5, 0, TAU); g.stroke();
      g.font = `600 12px ${BODY}`; g.fillStyle = rgba(FG, 1); g.textAlign = 'center'; g.fillText(text.you, px[i], py[i] - 16);
    }
  }
  function drawGate(g: CanvasRenderingContext2D, k: number, now: number) {
    const x = GX[k], h = heat[k], y0 = gTop, hh = gBot - gTop;
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = .5 + h * .5; g.drawImage(SPR.gate, x - 22 - h * 10, y0, 44 + h * 20, hh);
    if (h > .02) { g.globalAlpha = h * .32; g.drawImage(SPR.gate, x - 46, y0 - 6, 92, hh + 12); }      // exclusion flash ≤ .32
    g.globalAlpha = .6 + h * .4; g.fillStyle = rgba(SOFT, 1); g.fillRect(x - .75 - h * .8, y0, 1.5 + h * 1.6, hh);
    const p1 = (now * .00055 + k * .27) % 1, p2 = 1 - ((now * .00037 + k * .41) % 1);
    g.globalAlpha = .8; g.drawImage(SPR.shim, x - 2, y0 + p1 * hh - 20, 4, 40);
    g.globalAlpha = .45; g.drawImage(SPR.shim, x - 1.5, y0 + p2 * hh - 12, 3, 24);
    g.globalAlpha = .14 + h * .2; g.fillStyle = rgba(SOFT, 1);
    for (let j = 0; j < 7; j++) { const yy = y0 + ((j / 7 + now * .00022 + k * .05) % 1) * hh; g.fillRect(x - 7, yy, 14, 1); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = rgba(FG, .5); g.fillRect(x - 7, y0 - 4, 14, 3); g.fillRect(x - 7, gBot + 1, 14, 3);
    g.textAlign = 'center';
    g.font = `600 ${narrow ? 10.5 : 12.5}px ${BODY}`; g.fillStyle = rgba(FG, h > .3 ? 1 : .9);
    g.fillText(text.gates[k], x, narrow ? (k % 2 ? 32 : 18) : 24);
    if (!narrow) { g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.conds[k], x, 40); }
  }
  function drawBin(g: CanvasRenderingContext2D, k: number) {
    const x = GX[k], bw = binW, y = binBot - binH[k], p = binPulse[k];
    g.fillStyle = rgba(FG, .035); g.fillRect(x - bw / 2, binBot - binMaxH, bw, binMaxH);
    g.fillStyle = rgba(FG, .18); g.fillRect(x - bw / 2 - 4, binBot, bw + 8, 1);
    if (binH[k] > .5) { g.fillStyle = barGrad!; g.fillRect(x - bw / 2, y, bw, binH[k]); }
    g.globalAlpha = .45 + p * .5; g.fillStyle = rgba(SOFT, 1); g.fillRect(x - bw / 2, y - 1, bw, 2); g.globalAlpha = 1;
    if (p > .05) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = p * .35; g.drawImage(SPR.glow, x - bw / 2 - 6, y - 10, bw + 12, 20); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    const n = Math.round(landed[k]);
    g.textAlign = 'center'; g.font = `700 ${narrow ? 18 : 24}px ${DISP}`; g.fillStyle = rgba(FG, n ? 1 : .35);
    g.fillText(fmt(n), x, y - 8);
    if (!narrow) { g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.keys[k], x, binBot + 16); }
  }
  function drawMatrix(g: CanvasRenderingContext2D, now: number) {
    g.textAlign = 'left';
    g.font = `600 ${narrow ? 11 : 12.5}px ${BODY}`; g.fillStyle = rgba(FG, 1); g.fillText(text.included, mx0, narrow ? 18 : 24);
    if (!narrow) { g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.append, mx0, 40); }
    const a = mx0 - 7, b = my0 - 7, c = mx1 + 7, d = my1 + 5, L = 12;                   // corner brackets
    g.strokeStyle = rgba(matPulse > .02 ? SOFT : FG, 1); g.globalAlpha = .3 + matPulse * .6; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(a, b + L); g.lineTo(a, b); g.lineTo(a + L, b); g.moveTo(c - L, b); g.lineTo(c, b); g.lineTo(c, b + L);
    g.moveTo(a, d - L); g.lineTo(a, d); g.lineTo(a + L, d); g.moveTo(c - L, d); g.lineTo(c, d); g.lineTo(c, d - L);
    g.stroke(); g.globalAlpha = 1;
    const cells = flow?.cells ?? [], n = Math.max(cells.length, 24), s = cellS, h2 = s / 2;
    g.beginPath();                                                                      // empty slots
    for (let k = 0; k < n; k++) if (!lit[k]) g.rect(cellX(k) - h2, cellY(k) - h2, s, s);
    g.fillStyle = rgba(FG, .07); g.fill();
    for (const u of [0, 1]) {                                                           // Q3 yes solid, no muted
      g.beginPath();
      for (let k = 0; k < cells.length; k++) if (lit[k] && flow!.used[cells[k]] === u) g.rect(cellX(k) - h2, cellY(k) - h2, s, s);
      g.fillStyle = u === 0 ? rgba(FG, .8) : rgba(MUTE, .5); g.fill();
    }
    g.beginPath();                                                                      // unsure: an outline
    for (let k = 0; k < cells.length; k++) if (lit[k] && flow!.used[cells[k]] === 2) g.rect(cellX(k) - h2 + .75, cellY(k) - h2 + .75, s - 1.5, s - 1.5);
    g.strokeStyle = rgba(FG, .75); g.lineWidth = 1.5; g.stroke();
    g.globalCompositeOperation = 'lighter';                                             // freshly lit cells glow and fade
    for (let k = 0; k < cells.length; k++) {
      if (!lit[k] || !litAt[k]) continue;
      const age = now - litAt[k]; if (age > 650 || age < 0) continue;
      g.globalAlpha = .35 * (1 - age / 650); g.drawImage(SPR.glow, cellX(k) - s - 3, cellY(k) - s - 3, 2 * s + 6, 2 * s + 6);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (special !== null && cellOf[special] >= 0 && lit[cellOf[special]]) {
      const k = cellOf[special]; g.strokeStyle = rgba(SOFT, 1); g.lineWidth = 1.5; g.strokeRect(cellX(k) - h2 - 2.5, cellY(k) - h2 - 2.5, s + 5, s + 5);
    }
    g.font = `10.5px ${MONO}`; let lw = g.measureText(text.q3).width;                   // legend: measured, kept inside the canvas
    g.font = `11px ${BODY}`; for (const t of text.legend) lw += 21 + g.measureText(t).width;
    let lx = Math.min(mx0, W - 6 - lw); const ly = my1 + 19;
    text.legend.forEach((t, u) => {
      if (u === 2) { g.strokeStyle = rgba(FG, .75); g.lineWidth = 1.2; g.strokeRect(lx + .6, ly - 7.4, 5.8, 5.8); }
      else { g.fillStyle = u === 0 ? rgba(FG, .8) : rgba(MUTE, .5); g.fillRect(lx, ly - 8, 7, 7); }
      g.fillStyle = rgba(MUTE, 1); g.fillText(t, lx + 11, ly); lx += 21 + g.measureText(t).width;
    });
    g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.q3, lx, ly);
  }

  /* ---------- drawing: the effects layer (translucent clear → trails; additive) ---------- */
  function drawFx(now: number) {
    const g = gF;
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.fillStyle = o.light ? '#000' : 'rgba(0,0,0,.3)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = .55 * clamp(Math.sqrt(50 / Math.max(50, nLane)), .26, 1);          // a dense storm dims each particle
    for (let i = 0; i < np; i++) if (pst[i] !== 1) g.drawImage(SPR.dot, px[i] - 8, py[i] - 8);
    g.globalAlpha = .5;
    for (let i = 0; i < np; i++) if (pst[i] === 1) g.drawImage(SPR.red, px[i] - 6, py[i] - 6, 12, 12);
    if (special !== null) { g.globalAlpha = .35; for (let i = 0; i < np; i++) if (prow[i] === special) g.drawImage(SPR.big, px[i] - 22, py[i] - 22); }
    g.lineWidth = 1.3; g.lineCap = 'round';
    for (let j = 0; j < ns; j++) {
      g.globalAlpha = .6 * (sl[j] / sm[j]); g.strokeStyle = rgba(sc[j] ? SOFT : FG, 1);
      g.beginPath(); g.moveTo(sx[j], sy[j]); g.lineTo(sx[j] - svx[j] * .028, sy[j] - svy[j] * .028); g.stroke();
    }
    for (let k = rings.length - 1; k >= 0; k--) {
      const r = rings[k], t = (now - r.t0) / r.dur;
      if (t >= 1) { rings.splice(k, 1); continue; }
      g.globalAlpha = .35 * (1 - t); g.strokeStyle = rgba(r.col, 1); g.lineWidth = 1 + 5 * (1 - t);
      g.beginPath(); g.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - t, 3)), 0, TAU); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  /* ---------- shake (≤ 8 px, ≤ 400 ms) ---------- */
  let shT0 = 0, shDur = 0, shAmp = 0;
  const shake = (amp: number, dur: number) => { shT0 = performance.now(); shDur = Math.min(400, dur); shAmp = Math.min(8, amp); };
  function shakeStep(now: number) {
    if (!shDur) return;
    const t = (now - shT0) / shDur;
    if (t >= 1) { host.style.transform = ''; shDur = 0; return; }
    const a = shAmp * (1 - t) * (1 - t);
    host.style.transform = `translate(${((Math.random() * 2 - 1) * a).toFixed(1)}px,${((Math.random() * 2 - 1) * a * .6).toFixed(1)}px)`;
  }

  /* ---------- the frame loop: runs only while visible and motion is allowed ---------- */
  let raf = 0, last = 0, visible = false;
  function settle(now: number) {
    snap();
    const cx = (mx0 + mx1) / 2, cy = (my0 + my1) / 2, n = queue.length;
    if (n >= 200) { ring(cx, cy, 20, 250, 950, SOFT, now); ring(cx, cy, 10, 160, 700, FG, now); matPulse = 1; if (!o.light) shake(6, 340); }
    else if (n > 1) { ring(cx, cy, 10, 120, 700, SOFT, now); matPulse = .6; }
    finish(true);
  }
  function frame(now: number) {
    raf = 0;
    if (!visible || o.reduced) return;
    if (!W) layout();
    if (W) {
      const dt = clamp((now - last) / 1000 || .016, .001, .033); last = now;
      emit(dt, now); update(dt, now); drawBase(now); drawFx(now); shakeStep(now);
      if (done && qi >= queue.length && np === 0) settle(now);
    }
    raf = requestAnimationFrame(frame);
  }
  const run = () => { if (!raf && visible && !o.reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  /** One static frame (reduced motion, off screen, or after a resize while idle). */
  function still() {
    if (!W) layout();
    if (!W) return;
    const now = performance.now();
    drawBase(now); gF.clearRect(0, 0, W, H);
  }

  new IntersectionObserver(es => {
    visible = es.some(e => e.isIntersecting);
    if (visible) run();
    else if (done) { np = 0; qi = queue.length; snap(); settleBins(); finish(true); }     // off screen: skip to the result
  }).observe(host);
  new ResizeObserver(() => { layout(); if (!raf) still(); }).observe(host);
  layout(); still();

  return {
    play(f, rows, opt) {
      finish(false);
      setFlow(f);
      np = 0; queue = rows.slice(); qi = 0; emitAcc = 0; storm = opt.storm; special = opt.special; runT0 = performance.now();
      if (o.reduced || !visible) { qi = queue.length; snap(); settleBins(); still(); return Promise.resolve(true); }
      const replayed = new Set(rows);
      for (let g = 0; g < 4; g++) landed[g] = f.excluded[g];
      for (const r of rows) if (f.gates[r] >= 0) landed[f.gates[r]]--;
      f.cells.forEach((row, k) => { lit[k] = replayed.has(row) ? 0 : 1; });
      if (storm) { ring(0, laneY, 6, 190, 800, SOFT, runT0); shake(4, 260); }
      run();
      return new Promise<boolean>(res => { done = res; });
    },
    show(f) {
      finish(false);
      setFlow(f);
      np = 0; queue = []; qi = 0; special = null;
      snap(); settleBins();
      if (!raf) still();
    },
  };
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/campus-pipeline.test.ts`
Expected: 2 passed。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/campus-pipeline.ts tests/unit/campus-pipeline.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Campus pipeline: the prototype's particle lanes, gates and matrix, driven by the program's real branches" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 在线程序演示区（页面、文案、控制器、端到端测试）

**Files:**
- Create: `src/scripts/campus-live-text.ts`
- Create: `src/scripts/campus-live.ts`
- Create: `src/components/CampusLive.astro`
- Modify: `src/views/AiCampusView.astro`
- Test: `tests/e2e/campus-live.spec.ts`

**Interfaces:**
- Consumes: Task 1 `createPyRuntime`（`packages`、`onEvent`）；Task 2/3 的 `campus-flow.ts` 全部导出；Task 4 `PyBoot`、`bootView`；Task 5 `createPipeline`；已有的 `CodeLive`/`codeLive`、`spinOdometer`/`setOdometerText`。
- Produces（端到端测试依赖的 DOM）：`#cm-stage[data-state=idle|booting|running|done|failed]`、`#cm-chip`、`#cm-tag`、`#cm-status`、`#cm-timing`、`#cm-start-btn`、`#cm-id`、`#cm-date`、`#cm-q1`…`#cm-q7`、`input[name=cm-q5]`、`#cm-add`（提交）、`#cm-sample`、`#cm-stress`、`#cm-clear`、`#cm-inc`、`#cm-all`、`#cm-yes-share`、`#cm-counts`、`#cm-den`、`#cm-scenes li`、`#cm-med`、`#cm-pstatus`（含"程序原话"标签）、`#cm-program-status`、`#cm-ledger`、`#cm-invalid`、`#cm-invalid-msg`、`#cm-code .cl-l[data-n]`、`#cm-run`、`#cm-grid [data-test][data-status]`、`#cm-cmd`、`#cm-slam`、`#cm-fallback`、`#cm-retry`、`#cm-boot`。

- [ ] **Step 1: 写端到端测试 `tests/e2e/campus-live.spec.ts`**

```ts
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { noHorizontalOverflow } from './helpers';

const PATH = '/projects/ai-campus/';
test.describe.configure({ timeout: 120_000 });
const desktopOnly = (isMobile: boolean) => test.skip(isMobile, 'desktop flow; phones are covered by the start-button test');

/** Opens the page and waits for the runtime and for the constructed sample to settle. */
async function live(page: Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('#cm-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cm-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cm-all')).toHaveText('36', { timeout: 20_000 });
  await expect(page.locator('#cm-stage')).toHaveAttribute('data-state', 'done', { timeout: 20_000 });
}
const count = (page: Page, n: number) => page.locator(`#cm-code .cl-l[data-n="${n}"] .cl-cnt`);
const submit = (page: Page) => page.locator('#cm-add').click();

test('the study\'s own program boots in the browser and cleans the constructed sample', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#cm-chip')).toHaveText(/^PYTHON 3\.13\.\d+ · WEBASSEMBLY$/);
  await expect(page.locator('#cm-tag')).toBeVisible();
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(page.locator('#cm-ledger')).toContainText('duplicate_id 6');
  await expect(page.locator('#cm-ledger')).toContainText('outside_period 1');
  await expect(page.locator('#cm-timing')).toContainText('ms');
  await expect(count(page, 87)).toHaveText('×37');
  await expect(count(page, 97)).toHaveText('×26');
  await expect(page.locator('#cm-boot-log')).toContainText('MB');
});

test('the live source lines are analysis.py lines 87–97, verbatim', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(PATH);
  const file = readFileSync('public/downloads/campus/analysis.py', 'utf8').replace(/\r\n/g, '\n').split('\n').slice(86, 97);
  await expect(page.locator('#cm-code .cl-src')).toHaveText(file);
});

test('the stress test counts 2,000 rows exactly as analyze() does', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-stress').click();
  await expect(page.locator('#cm-all')).toHaveText('2,000', { timeout: 30_000 });
  await expect(page.locator('#cm-inc')).toHaveText('1,720');
  await expect(count(page, 87)).toHaveText('×2,001');
  await expect(count(page, 88)).toHaveText('×2,000');
  await expect(count(page, 89)).toHaveText('×80');
  await expect(count(page, 97)).toHaveText('×1,720');
  await expect(page.locator('#cm-ledger')).toContainText('outside_period 100');
  await expect(page.locator('#cm-timing')).toContainText('2,000');
  await expect(page.locator('#cm-stage')).toHaveAttribute('data-state', 'done');
  // settled: the exclusion lines show their shading (a few per cent of rows), not the solid red of the replay
  await expect(page.locator('#cm-code .cl-l[data-n="89"]')).not.toHaveClass(/\bred\b/);
});

test('a visitor answer is analysed with the rest', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('27');
  await expect(page.locator('#cm-id')).toHaveValue('V002');
  await expect(count(page, 97)).toHaveText('×27');
});

test('submitting again during the replay uses the next ID', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await submit(page);                          // waits for the form to be enabled again, while the first replay still runs
  await expect(page.locator('#cm-all')).toHaveText('38', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('28');
  await expect(page.locator('#cm-ledger')).toContainText('duplicate_id 6');
  await expect(page.locator('#cm-id')).toHaveValue('V003');
});

test('the same ID twice: the program excludes both', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await expect(page.locator('#cm-inc')).toHaveText('27', { timeout: 15_000 });
  await page.locator('#cm-id').fill('V001');
  await submit(page);
  await expect(page.locator('#cm-all')).toHaveText('38', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(page.locator('#cm-ledger')).toContainText('duplicate_id 8');
});

test('no consent ends the survey and is excluded at its gate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-q1').uncheck();
  await expect(page.locator('#cm-q3')).toBeDisabled();
  await submit(page);
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(page.locator('#cm-ledger')).toContainText('no_consent 3');
});

test('invalid input shows the program\'s own validation failure and keeps the last result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-id').fill(' X ');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toBeVisible();
  await expect(page.locator('#cm-invalid-msg')).toHaveText('第 37 条记录：匿名 ID 不应有首尾空格');
  await expect(page.locator('#cm-all')).toHaveText('36');
  await page.locator('#cm-id').fill('V001');
  await page.locator('#cm-date').fill('');
  await submit(page);
  await expect(page.locator('#cm-invalid-msg')).toHaveText('第 37 条记录：采集日期格式错误');
  await page.locator('#cm-date').fill('2026-09-20');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toBeHidden();
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
});

test('an invalid answer during the animation leaves the previous result to finish', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await page.locator('#cm-id').fill(' X ');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toBeVisible();
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-stage')).toHaveAttribute('data-state', 'done');
});

test('rapid submits settle on the last result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await page.locator('#cm-stress').click();
  await expect(page.locator('#cm-all')).toHaveText('2,000', { timeout: 30_000 });
  await expect(page.locator('#cm-inc')).toHaveText('1,720');
  await page.waitForTimeout(2500);
  await expect(page.locator('#cm-all')).toHaveText('2,000');
  await expect(count(page, 88)).toHaveText('×2,000');
});

test('the ten tests run in the browser and pass', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-run').click();
  await expect(page.locator('#cm-grid [data-status="ok"]')).toHaveCount(10, { timeout: 15_000 });
  await expect(page.locator('#cm-slam')).toHaveText('Ran 10 tests · OK');
  await expect(page.locator('#cm-cmd')).toHaveText(/^Ran 10 tests in \d+\.\d{3}s$/);
});

test('clearing leaves no data: shares are missing, not zero', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-clear').click();
  await expect(page.locator('#cm-all')).toHaveText('0', { timeout: 15_000 });
  await expect(page.locator('#cm-yes-share')).toHaveText('—');
  await expect(page.locator('#cm-med')).toHaveText('—');
  await expect(page.locator('#cm-program-status')).toHaveText('没有可分析记录');
  await expect(page.locator('#cm-tag')).toBeHidden();
  await expect(page.locator('#cm-sample')).toBeEnabled();
});

test('blocked runtime hides the pipeline, says why, and a retry boots it', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.route('**/pyodide.asm.wasm', r => r.abort());
  await page.goto(PATH);
  await page.locator('#cm-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cm-fallback')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#cm-retry')).toBeVisible();
  await expect(page.locator('#cm-stage')).toBeHidden();
  await expect(page.locator('.framework li[data-step]')).toHaveCount(5);
  await expect(page.locator('.framework')).toBeVisible();
  await page.unroute('**/pyodide.asm.wasm');
  await page.locator('#cm-retry').click();
  await expect(page.locator('#cm-fallback')).toBeHidden();
  await expect(page.locator('#cm-stage')).toBeVisible();
  await expect(page.locator('#cm-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cm-all')).toHaveText('36', { timeout: 20_000 });
});

test('the page loads no Python packages it does not need', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  const urls: string[] = [];
  page.on('request', r => urls.push(r.url()));
  await live(page);
  expect(urls.filter(u => u.endsWith('.whl'))).toEqual([]);
  expect(urls.some(u => u.endsWith('/downloads/campus/analysis.py'))).toBe(true);
  expect(urls.some(u => u.endsWith('/downloads/campus/test_analysis.py'))).toBe(true);
});

test('reduced motion shows the final state without the boot show', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await live(page);
  await expect(page.locator('#cm-boot')).toBeHidden();
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(count(page, 97)).toHaveText('×26');
  await page.locator('#cm-run').click();
  await expect(page.locator('#cm-grid [data-status="ok"]')).toHaveCount(10, { timeout: 10_000 });
});

test('English page: English interface; the program\'s own messages stay in Chinese', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page, '/en');
  await expect(page.locator('#cm-title')).toHaveText('Live program: survey cleaning and statistics');
  await expect(page.locator('#cm-add')).toHaveText('Submit this answer');
  await page.locator('#cm-id').fill(' X ');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toContainText('Validation failed');
  await expect(page.locator('#cm-invalid-msg')).toHaveText('第 37 条记录：匿名 ID 不应有首尾空格');
  await expect(page.locator('#cm-pstatus')).toContainText('(Chinese)');
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('phones wait for the start button before downloading the runtime', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone flow');
  const wasm: string[] = [];
  page.on('request', r => { if (r.url().endsWith('.wasm')) wasm.push(r.url()); });
  await page.goto(PATH);
  await page.locator('#cm-stage').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  expect(wasm).toEqual([]);
  await expect(page.locator('#cm-start-btn')).toContainText('MB');
  await page.locator('#cm-start-btn').click();
  await expect(page.locator('#cm-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cm-all')).toHaveText('36', { timeout: 20_000 });
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('once the program runs, the live stage has no serious accessibility issue', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const { violations } = await new AxeBuilder({ page }).include('#cm-stage').analyze();
  const bad = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx playwright test tests/e2e/campus-live.spec.ts --project=desktop -g "boots in the browser"`
Expected: FAIL（找不到 `#cm-stage`）。

- [ ] **Step 3: 写 `src/scripts/campus-live-text.ts`**

```ts
import type { Lang } from '../i18n';
import type { BootText } from './py-boot-view';
import type { PipeText } from './campus-pipeline';
import { WINDOW, GATE_KEYS, type Analysis, type TestSummary } from './campus-flow';

const fmt = (n: number) => n.toLocaleString('en-US');
const excludedTotal = (a: Analysis) => Object.values(a.excluded).reduce((s, n) => s + n, 0);
const keyCounts = (a: Analysis) => GATE_KEYS.map(k => `${k} ${fmt(a.excluded[k])}`).join(' · ');
/** unittest's own summary, the same in both languages, split as the approved prototype shows it: the big result line,
 *  and the measured time on the command line. */
export function summaryLine(s: TestSummary): string {
  const bad = [s.failures ? `failures=${s.failures}` : '', s.errors ? `errors=${s.errors}` : ''].filter(Boolean).join(', ');
  return `Ran ${s.run} tests · ${s.ok ? 'OK' : `FAILED (${bad})`}`;
}
export const ranLine = (s: TestSummary) => `Ran ${s.run} tests in ${(s.ms / 1000).toFixed(3)}s`;

export interface CampusText extends BootText {
  title: string; meta: string; intro: string; chip: (py: string) => string; start: (mb: string) => string; startNote: string; booting: string;
  id: string; date: string; q1: string; q2: string; q3: string; used: [string, string][]; q4: string; freq: [string, string][];
  q5: string; scenes: string[]; q6: string; help: [string, string][]; q7: string; verify: [string, string][];
  hintEnded: string; hintYes: string; hintNotYes: string;
  submit: string; sample: string; stress: string; clear: string; privacy: string;
  computing: string; engineError: (m: string) => string; tag: string; timing: (n: number, ms: number, traced: number) => string;
  incLabel: string; yesLabel: string; yesNote: string; counts: (c: { yes: string; no: string; unsure: string }) => string;
  sceneLabel: string; sceneDen: (d: string, m: string) => string; helpLabel: string; median: string;
  ledger: (a: Analysis) => string; invalidTitle: string; invalidNote: string; statusLabel: string; replaying: string; lightNote: string;
  codeTitle: string; codeMeta: string; codeLabel: string; codeNote: string;
  testsTitle: (n: number) => string; run: (n: number) => string; cmd: string;
  fallback: string; download: string; retry: string; pipe: PipeText;
}

export const CAMPUS_TEXT: Record<Lang, CampusText> = {
  zh: {
    title: '在线程序：问卷清洗与统计', meta: 'analysis.py · 只用 Python 标准库 · 在你的浏览器里运行',
    intro: '这是研究公开的统计程序 analysis.py——就是下文"本地运行"里提供下载的那一份，原样在你的浏览器里运行（通过 WebAssembly）。每份回答是一个光点，按程序的顺序穿过四道排除关卡：被拦下的落进对应的桶，通过的填进"纳入"点阵；每个光点走哪条路，取自程序逐行执行时的真实记录。你可以按问卷填一份，也可以载入构造样本，或做 2,000 份的压力测试。',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `启动程序（约 ${mb} MB）`,
    startNote: '手机或省流量模式下，点了才会下载运行时。', booting: '正在启动 Python 运行时…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `下载并启动 Python 运行时 · Python ${detail}`, packages: `安装 ${detail}`, sources: `载入研究程序与测试 · ${detail} 个模块` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `程序就绪 · Python ${py} · ${s.toFixed(2)} s`,
    hexTitle: 'SHA-256 · 正在载入的文件',
    id: '匿名 ID', date: `填写日期（窗口 ${WINDOW.start} 至 ${WINDOW.end}）`,
    q1: '同意参加本次调查', q2: '已满 18 岁且在校就读大学', q3: '过去 30 天主动用过 AI 工具',
    used: [['yes', '是'], ['no', '否'], ['unsure', '不确定']],
    q4: '使用天数', freq: [['1_3', '1–3 天'], ['4_15', '4–15 天'], ['16_30', '16–30 天']],
    q5: '使用场景（多选，可不选）', scenes: ['学习', '校园事务', '社团活动', '日常规划', '求职', '其他'],
    q6: '有多大帮助', help: [['1', '1 完全没帮助'], ['2', '2 帮助较小'], ['3', '3 一般'], ['4', '4 比较有帮助'], ['5', '5 非常有帮助'], ['', '跳过（记为缺失）']],
    q7: '多久查验一次重要事实', verify: [['1', '1 从不'], ['2', '2 很少'], ['3', '3 有时'], ['4', '4 经常'], ['5', '5 每次'], ['', '跳过（记为缺失）']],
    hintEnded: 'Q1 或 Q2 选了"否"：问卷到此结束，这一份会在对应关卡被排除。',
    hintYes: '场景一个都不选 = 未答（null），不计入场景的分母；Q6、Q7 跳过记为缺失。',
    hintNotYes: 'Q3 选"否"或"不确定"：Q4–Q7 不适用，只计入使用比例的分母。',
    submit: '提交这一份', sample: '载入构造样本（36 份）', stress: '压力测试：2,000 份', clear: '清空',
    privacy: '全部计算在你的浏览器里完成，不上传任何内容。',
    computing: 'analyze() 运行中…', engineError: m => `程序出错：${m}`, tag: '构造样本 · 不是 2024 年调查结果',
    timing: (n, ms, traced) => `analyze() · ${fmt(n)} 条 · ${ms.toFixed(1)} ms · 逐行跟踪 ${traced.toFixed(1)} ms`,
    incLabel: '纳入 / 输入', yesLabel: '主动使用比例', yesNote: '分母：纳入人数',
    counts: c => `是 ${c.yes} · 否 ${c.no} · 不确定 ${c.unsure}`,
    sceneLabel: '场景', sceneDen: (d, m) => `分母：答了场景题的使用者 ${d} · 未答 ${m}`,
    helpLabel: '有多大帮助（1–5）', median: '中位数',
    ledger: a => `input_n ${fmt(a.input_n)} = included_n ${fmt(a.included_n)} + 排除 ${fmt(excludedTotal(a))}（${keyCounts(a)}）· 重复 ID ${fmt(a.duplicate_id_groups)} 组`,
    invalidTitle: '校验失败', invalidNote: '这是程序自己的报错：整份输入被拒绝，这一份没有加入，上一轮结果保持不变。',
    statusLabel: 'analyze() 返回的状态（程序原话）：',
    replaying: '回放中：analyze() 已经算完，统计栏在回放结束时落定为它的输出。',
    lightNote: '手机上每 5 份回答画 1 个光点，其余直接落进桶或点阵；计数和统计不变。',
    codeTitle: 'analysis.py · analyze()', codeMeta: '代码实况 · 源码第 87–97 行', codeLabel: '代码实况：排除关卡的源码与逐行执行次数',
    codeNote: '右侧是每行的真实执行次数，底色深浅 = 到达该行的记录占比。每次提交，analyze() 都会重新检查全部记录；动画只回放新加入的、以及结论变了的记录。',
    testsTitle: n => `test_analysis.py · ${n} 项单元测试`, run: n => `运行 ${n} 项测试`, cmd: '$ python -m unittest -v test_analysis',
    fallback: '在线程序暂时无法启动（浏览器不支持、网络中断或超时）。下面的五段式框架不受影响；也可以下载程序在本地运行：',
    download: '下载 analysis.py', retry: '重新启动',
    pipe: {
      gates: ['重复 ID', '未同意', '不符合人群', '采集窗口外'], conds: ['counts[id] > 1', 'not consent', 'not eligible', 'not start≤d≤end'],
      keys: GATE_KEYS, included: '纳入', append: 'included.append(row)', loop: 'for row in rows', you: '你的回答',
      legend: ['是', '否', '不确定'], q3: '= Q3',
    },
  },
  en: {
    title: 'Live program: survey cleaning and statistics', meta: 'analysis.py · Python standard library only · running in your browser',
    intro: 'This is the study\'s published statistics program, analysis.py — the very file offered for download under "Run it locally" below — running unchanged in your browser through WebAssembly. Each answer is a point of light that passes the four exclusion gates in the program\'s order: excluded answers drop into their bin, included ones fill the "included" matrix, and the path of every point comes from the program\'s own line-by-line trace. Fill in the questionnaire, load the constructed sample, or run a 2,000-answer stress test.',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `Start the program (about ${mb} MB)`,
    startNote: 'On phones and in data-saver mode the runtime downloads only when you tap.', booting: 'Starting the Python runtime…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `Download and start the Python runtime · Python ${detail}`, packages: `Install ${detail}`, sources: `Load the study's program and tests · ${detail} modules` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `Program ready · Python ${py} · ${s.toFixed(2)} s`,
    hexTitle: 'SHA-256 · files being loaded',
    id: 'Anonymous ID', date: `Date filled in (window ${WINDOW.start} to ${WINDOW.end})`,
    q1: 'Agrees to take part', q2: 'Aged 18+ and enrolled at a university', q3: 'Actively used an AI tool in the past 30 days',
    used: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']],
    q4: 'Days of use', freq: [['1_3', '1–3 days'], ['4_15', '4–15 days'], ['16_30', '16–30 days']],
    q5: 'Where (tick any, or none)', scenes: ['Study', 'Campus admin', 'Clubs', 'Daily planning', 'Careers', 'Other'],
    q6: 'How helpful', help: [['1', '1 Not at all'], ['2', '2 A little'], ['3', '3 Somewhat'], ['4', '4 Quite'], ['5', '5 Very'], ['', 'Skip (missing)']],
    q7: 'How often you check key facts', verify: [['1', '1 Never'], ['2', '2 Rarely'], ['3', '3 Sometimes'], ['4', '4 Often'], ['5', '5 Every time'], ['', 'Skip (missing)']],
    hintEnded: 'Q1 or Q2 is "no": the questionnaire ends here, and this answer is excluded at the matching gate.',
    hintYes: 'No place ticked = Q5 skipped (null), outside the scenario denominator; a skipped Q6 or Q7 counts as missing.',
    hintNotYes: 'Q3 is "no" or "not sure": Q4–Q7 do not apply; the answer counts only in the usage denominator.',
    submit: 'Submit this answer', sample: 'Load the constructed sample (36)', stress: 'Stress test: 2,000 answers', clear: 'Clear',
    privacy: 'Everything is computed in your browser; nothing is uploaded.',
    computing: 'analyze() running…', engineError: m => `Program error: ${m}`, tag: 'Constructed sample · not the 2024 survey',
    timing: (n, ms, traced) => `analyze() · ${fmt(n)} rows · ${ms.toFixed(1)} ms · traced ${traced.toFixed(1)} ms`,
    incLabel: 'Included / input', yesLabel: 'Active use', yesNote: 'denominator: included',
    counts: c => `yes ${c.yes} · no ${c.no} · not sure ${c.unsure}`,
    sceneLabel: 'Where', sceneDen: (d, m) => `denominator: users who answered ${d} · skipped ${m}`,
    helpLabel: 'How helpful (1–5)', median: 'median',
    ledger: a => `input_n ${fmt(a.input_n)} = included_n ${fmt(a.included_n)} + excluded ${fmt(excludedTotal(a))} (${keyCounts(a)}) · ${fmt(a.duplicate_id_groups)} duplicate-ID groups`,
    invalidTitle: 'Validation failed', invalidNote: 'The program\'s own error, in its own words (Chinese): the whole input is rejected, this answer was not added, and the previous result stands.',
    statusLabel: 'analyze() status, in the program\'s own words (Chinese):',
    replaying: 'Replaying: analyze() has already finished; the panel settles on its output when the replay ends.',
    lightNote: 'On phones one point of light stands for five answers; the rest land at once. The counts and statistics are unchanged.',
    codeTitle: 'analysis.py · analyze()', codeMeta: 'Live source · lines 87–97', codeLabel: 'Live source: the exclusion gates and how often each line ran',
    codeNote: 'On the right, how often each line really ran; the shading is the share of rows that reached the line. Every submission makes analyze() re-check all rows; the animation replays only new rows and rows whose outcome changed.',
    testsTitle: n => `test_analysis.py · ${n} unit tests`, run: n => `Run the ${n} tests`, cmd: '$ python -m unittest -v test_analysis',
    fallback: 'The live program could not start (unsupported browser, network error or timeout). The framework below is unaffected, and you can run the program locally:',
    download: 'download analysis.py', retry: 'Start again',
    pipe: {
      gates: ['Duplicate ID', 'No consent', 'Not eligible', 'Outside window'], conds: ['counts[id] > 1', 'not consent', 'not eligible', 'not start≤d≤end'],
      keys: GATE_KEYS, included: 'Included', append: 'included.append(row)', loop: 'for row in rows', you: 'Your answer',
      legend: ['yes', 'no', 'not sure'], q3: '= Q3',
    },
  },
};
```

- [ ] **Step 4: 写 `src/scripts/campus-live.ts`**

```ts
import { createPyRuntime, type PyRuntime } from './py-runtime';
import { bootView, type BootFile } from './py-boot-view';
import { codeLive, type CodeLive } from './code-live';
import { spinOdometer, setOdometerText } from './odometer-dom';
import { createPipeline } from './campus-pipeline';
import {
  CAMPUS_RUNTIME, WINDOW, GATE_LINES, rowFromForm, nextId, flowOf, toAnimate, baseline, statsView,
  type Row, type Gate, type Traced, type Invalid, type TestEvent, type TestSummary, type FormState, type Analysis,
} from './campus-flow';
import { CAMPUS_TEXT, summaryLine, ranLine } from './campus-live-text';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const fmt = (n: number) => n.toLocaleString('en-US');
const EXCLUSION = new Set<number>(GATE_LINES);

/** The live source as a line profiler: counts rise as the replay passes each line and end on the real trace; the
 *  shading is the share of rows that reached the line. Exclusion lines flash red while rows are stopped there, but are
 *  never switched on with the solid red tone, which would cover the shading (CodeLive's `.on.red`). */
function profiler(code: CodeLive) {
  let counts = new Map<number, number>(), raf = 0;
  const flashed = new Map<number, number>();
  const paint = () => {
    raf = 0;
    const rows = Math.max(1, counts.get(88) ?? 0);
    for (let n = 87; n <= 97; n++) {
      const c = counts.get(n) ?? 0;
      code.count(n, c ? `×${fmt(c)}` : '');
      if (n > 87) code.heat(n, c / rows);
      if (c) code.on(n);
    }
  };
  const later = () => { if (!raf) raf = requestAnimationFrame(paint); };
  const load = (o: Record<string, number>) => new Map(Object.entries(o).map(([n, c]) => [Number(n), c]));
  return {
    start(base: Record<number, number>) { code.reset(); counts = load(base); later(); },
    hit(n: number) {
      counts.set(n, (counts.get(n) ?? 0) + 1); later();
      const t = performance.now();
      if (EXCLUSION.has(n) && t - (flashed.get(n) ?? 0) > 260) { flashed.set(n, t); code.flash(n, 'red'); }
    },
    // reset() clears the red a flash leaves behind; the next paint rewrites counts, shading and "on" in the same frame.
    settle(trace: Record<string, number>) { code.reset(); counts = load(trace); later(); },
  };
}

interface Run { replace?: boolean; special?: number | null; storm?: boolean; constructed?: boolean; sampleIn?: boolean }

export function initCampusLive(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh', T = CAMPUS_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const light = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData || matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const stage = $('cm-stage'), prof = profiler(codeLive($('cm-code')));
  const pipe = createPipeline($('cm-pipe'), T.pipe, { reduced, light, hit: n => prof.hit(n) });
  // rows is the data set analyze() last accepted and gates where each of its rows went; shown counts accepted results,
  // so an older replay never writes its numbers over a newer result.
  let runtime: PyRuntime | null = null, ready = false, busy = false, testing = false, seq = 0, shown = 0;
  let rows: Row[] = [], gates: Gate[] = [], constructed = false, sampleIn = false;

  const say = (text: string, bad = false) => { const s = $('cm-status'); s.textContent = text; s.classList.toggle('bad', bad); };
  const sync = () => {
    $<HTMLFieldSetElement>('cm-fields').disabled = !ready || busy;
    $<HTMLButtonElement>('cm-sample').disabled = sampleIn;
    $<HTMLButtonElement>('cm-run').disabled = !ready || testing;
  };

  /* ---------- the questionnaire ---------- */
  const num = (v: string) => (v === '' ? null : Number(v));
  const form = (): FormState => ({
    id: $<HTMLInputElement>('cm-id').value, date: $<HTMLInputElement>('cm-date').value,
    consent: $<HTMLInputElement>('cm-q1').checked, eligible: $<HTMLInputElement>('cm-q2').checked,
    used: $<HTMLSelectElement>('cm-q3').value as FormState['used'],
    frequency: $<HTMLSelectElement>('cm-q4').value as FormState['frequency'],
    scenarios: [...root.querySelectorAll<HTMLInputElement>('input[name="cm-q5"]:checked')].map(c => c.value as FormState['scenarios'][number]),
    helpfulness: num($<HTMLSelectElement>('cm-q6').value), verification: num($<HTMLSelectElement>('cm-q7').value),
  });
  function syncForm() {
    const f = form(), answered = f.consent && f.eligible;
    $<HTMLSelectElement>('cm-q3').disabled = !answered;
    $<HTMLFieldSetElement>('cm-yes').disabled = !answered || f.used !== 'yes';
    $('cm-hint').textContent = !answered ? T.hintEnded : f.used === 'yes' ? T.hintYes : T.hintNotYes;
  }
  for (const id of ['cm-q1', 'cm-q2', 'cm-q3']) $(id).addEventListener('change', syncForm);
  syncForm();

  /* ---------- one analyze() run: the numbers shown all come from its output ---------- */
  function invalid(message: string | null) { $('cm-invalid').hidden = message === null; $('cm-invalid-msg').textContent = message ?? ''; }
  function stats(a: Analysis) {
    const v = statsView(a);
    const put = (id: string, text: string) => {
      const el = $(id);
      if (reduced || el.textContent === text) setOdometerText(el, text); else spinOdometer(el, text, 0, el.textContent || '0');
    };
    put('cm-inc', v.included); put('cm-all', v.input); put('cm-yes-share', v.yes);
    $('cm-counts').textContent = T.counts(v.counts);
    $('cm-den').textContent = T.sceneDen(v.sceneDen, v.sceneMissing);
    root.querySelectorAll<HTMLElement>('#cm-scenes li').forEach((li, i) => {
      li.querySelector<HTMLElement>('i')!.style.transform = `scaleX(${v.scenes[i].share.toFixed(4)})`;
      li.querySelector('.cm-sp')!.textContent = v.scenes[i].text;
    });
    const top = Math.max(1, ...v.help.dist);
    root.querySelectorAll<HTMLElement>('#cm-hist .cm-hc').forEach((c, i) => {
      const f = v.help.dist[i] / top, b = c.querySelector<HTMLElement>('b')!;
      c.querySelector<HTMLElement>('i')!.style.transform = `scaleY(${f.toFixed(4)})`;
      b.textContent = v.help.dist[i] ? fmt(v.help.dist[i]) : ''; b.style.bottom = `calc(${(f * 100).toFixed(1)}% + 3px)`;
      c.classList.toggle('med', v.help.median === i + 1);
    });
    $('cm-med').textContent = v.help.medianText;
    const line = $('cm-medl');
    line.style.opacity = v.help.median === null ? '0' : '1';
    if (v.help.median !== null) line.style.left = `${(((v.help.median - 0.5) / 5) * 100).toFixed(2)}%`;
    $('cm-program-status').textContent = a.status; $('cm-pstatus').hidden = false;
  }
  async function analyze(next: Row[], o: Run = {}): Promise<boolean> {
    if (!ready || !runtime) return false;
    const req = ++seq;
    busy = true; sync(); say(T.computing);
    let answer: Traced | Invalid;
    try { answer = (await runtime.call<Traced | Invalid>('campus_bridge', 'analyze_traced', [next, WINDOW.start, WINDOW.end])).value; }
    catch (e) { if (req === seq) { busy = false; sync(); say(T.engineError((e as Error).message), true); } return false; }
    if (req !== seq) return false;
    busy = false; say('');
    if ('error' in answer) { sync(); invalid(answer.message); return false; }
    invalid(null);
    if (o.constructed !== undefined) constructed = o.constructed;
    if (o.sampleIn !== undefined) sampleIn = o.sampleIn;
    sync(); $('cm-tag').hidden = !constructed;
    const id = ++shown, flow = flowOf(next, answer.branches);
    const animate = reduced ? [] : toAnimate(o.replace ? [] : gates, flow.gates);
    rows = next; gates = flow.gates;
    // The ID moves on as soon as the program accepts the answer, in the same task that re-enables the form, so a second
    // submission during the replay can never reuse it.
    if (o.special != null) $<HTMLInputElement>('cm-id').value = nextId(next);
    stage.dataset.state = 'running';
    // Until the replay settles the panel still shows the previous result: dim it and say so, rather than mix two runs.
    $('cm-stats').classList.add('stale'); $('cm-ledger').textContent = T.replaying;
    $('cm-timing').textContent = T.timing(next.length, answer.ms, answer.traced_ms);
    prof.start(baseline(answer.lines, flow.gates, animate));
    const settled = animate.length ? await pipe.play(flow, animate, { storm: !!o.storm, special: o.special ?? null }) : (pipe.show(flow), true);
    if (settled && id === shown) {
      prof.settle(answer.lines); stats(answer.result); $('cm-stats').classList.remove('stale');
      $('cm-ledger').textContent = T.ledger(answer.result);
      stage.dataset.state = 'done';
    }
    return true;
  }
  async function construct(kind: 'sample' | 'stress'): Promise<Row[] | null> {
    if (!runtime) return null;
    busy = true; sync();
    try { return (await runtime.call<Row[]>('campus_bridge', 'constructed', [kind])).value; }
    catch (e) { say(T.engineError((e as Error).message), true); return null; }
    finally { busy = false; sync(); }
  }

  $<HTMLFormElement>('cm-form').addEventListener('submit', e => {
    e.preventDefault();
    const next = [...rows, rowFromForm(form())];
    void analyze(next, { special: next.length - 1 });
  });
  $('cm-sample').onclick = async () => { const made = await construct('sample'); if (made) await analyze([...rows, ...made], { constructed: true, sampleIn: true }); };
  $('cm-stress').onclick = async () => { const made = await construct('stress'); if (made) await analyze(made, { replace: true, storm: true, constructed: true, sampleIn: false }); };
  $('cm-clear').onclick = () => { $<HTMLInputElement>('cm-id').value = 'V001'; void analyze([], { replace: true, constructed: false, sampleIn: false }); };

  /* ---------- the study's tests, pushed one by one ---------- */
  async function runTests() {
    if (!ready || !runtime || testing) return;
    testing = true; sync();
    const cells = new Map([...root.querySelectorAll<HTMLElement>('#cm-grid [data-test]')].map(c => [c.dataset.test!, c]));
    cells.forEach(c => { c.dataset.status = ''; c.querySelector('.cm-ck')!.textContent = ''; });
    const slam = $('cm-slam'), box = $('cm-tests');
    slam.classList.remove('go'); slam.textContent = ''; box.classList.remove('shk', 'bad'); $('cm-cmd').textContent = T.cmd;
    const events: TestEvent[] = [];
    let summary: TestSummary | null = null;
    try { summary = (await runtime.call<TestSummary>('campus_bridge', 'run_tests', ['test_analysis'], e => events.push(e as TestEvent))).value; }
    catch (e) { say(T.engineError((e as Error).message), true); }
    for (const e of events) {                    // the order and outcomes are the runner's; only the pace is slowed to be seen
      const c = cells.get(e.name); if (!c) continue;
      c.dataset.status = e.kind === 'start' ? 'run' : e.kind;
      c.querySelector('.cm-ck')!.textContent = e.kind === 'ok' ? '✓' : e.kind === 'fail' || e.kind === 'error' ? '✗' : '';
      if (!reduced) await wait(e.kind === 'start' ? 60 : 30);
    }
    if (summary) {
      const failed = events.find(e => e.kind === 'fail' || e.kind === 'error');
      $('cm-cmd').textContent = failed ? `${failed.name}: ${failed.message ?? failed.kind}` : ranLine(summary);
      slam.textContent = summaryLine(summary); box.classList.toggle('bad', !summary.ok);
      void slam.offsetWidth; slam.classList.add('go');
      if (!reduced) { await wait(190); void box.offsetWidth; box.classList.add('shk'); }
    }
    testing = false; sync();
  }
  $('cm-run').onclick = () => void runTests();

  /* ---------- boot ---------- */
  async function start() {
    if (runtime) return;
    $('cm-start').hidden = true; stage.dataset.state = 'booting'; say(T.booting);
    runtime = createPyRuntime(CAMPUS_RUNTIME);
    const files = JSON.parse(stage.dataset.files || '[]') as BootFile[];
    const view = bootView({ root, prefix: 'cm', text: T, chip: $('cm-chip'), reduced, shown: () => !stage.hidden, files: () => Promise.resolve(files) });
    try {
      const r = await runtime.boot(p => view.step(p));
      await view.done(r);
      ready = true; say(''); sync();
      const chip = $('cm-chip'); chip.textContent = T.chip(r.python); chip.classList.add('live');
    } catch (e) {
      console.error(e); view.hide(); runtime?.dispose(); runtime = null; ready = false; say(''); sync();
      stage.hidden = true; $('cm-fallback').hidden = false; stage.dataset.state = 'failed';
      return;
    }
    const made = await construct('sample');
    if (made) await analyze(made, { constructed: true, sampleIn: true });
  }
  $('cm-retry').onclick = () => { $('cm-fallback').hidden = true; stage.hidden = false; void start(); };

  /* ---------- when to start ---------- */
  sync();
  $('cm-light').hidden = !light || reduced;
  if (light) { $('cm-start').hidden = false; $('cm-start-btn').onclick = () => void start(); return; }
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); void start(); } }, { threshold: 0.2 });
  io.observe(stage);
}
```

- [ ] **Step 5: 写 `src/components/CampusLive.astro`**

```astro
---
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import CodeLive from './CodeLive.astro';
import PyBoot from './PyBoot.astro';
import { CAMPUS_TEXT } from '../scripts/campus-live-text';
import { CAMPUS_RUNTIME, CORE_FILES, SCENARIOS, testNames } from '../scripts/campus-flow';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const T = CAMPUS_TEXT[lang];
// Everything the runtime downloads, read at build time: the Pyodide core from its manifest, and the three Python files,
// hashed here. The sum is the size on the start button; the hashes feed the boot byte stream.
type Entry = { name: string; sha256: string; bytes: number };
const manifest = JSON.parse(readFileSync('public/assets/vendor/pyodide/0.29.5/manifest.json', 'utf8')) as { files: Entry[] };
const core = manifest.files.filter(f => CORE_FILES.includes(f.name)).map(({ name, sha256, bytes }) => ({ name, sha256, bytes }));
const own = CAMPUS_RUNTIME.files.map(u => {
  const b = readFileSync(`public${u}`);
  return { name: u.slice(u.lastIndexOf('/') + 1), sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
});
const files = [...core, ...own];
const mb = (files.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1);
const tests = testNames(readFileSync('public/downloads/campus/test_analysis.py', 'utf8'));
---
<section class="campus-live" data-campus-live data-demo data-lang={lang} aria-labelledby="cm-title">
  <div class="wrap">
    <div class="section-head"><h2 id="cm-title">{T.title}</h2><span class="meta">{T.meta}</span></div>
    <p class="cm-intro">{T.intro}</p>
  </div>
  <div class="cm-stage night-zone" id="cm-stage" data-state="idle" data-files={JSON.stringify(files.map(({ name, sha256 }) => ({ name, sha256 })))}>
    <div class="cm-top">
      <span class="cm-chip" id="cm-chip">PYTHON · WEBASSEMBLY</span>
      <span class="cm-tag" id="cm-tag" hidden>{T.tag}</span>
      <span class="cm-status" id="cm-status" role="status" aria-live="polite"></span>
      <span class="cm-timing" id="cm-timing"></span>
    </div>
    <div class="cm-start" id="cm-start" hidden><button type="button" class="cm-btn" id="cm-start-btn">{T.start(mb)}</button><p>{T.startNote}</p></div>
    <div class="cm-main">
      <form class="cm-form" id="cm-form" novalidate>
        <fieldset class="cm-fields" id="cm-fields" disabled>
          <legend class="sr">{T.title}</legend>
          <div class="cm-pair">
            <label>{T.id}<input id="cm-id" value="V001" maxlength="40" autocomplete="off" spellcheck="false" /></label>
            <label>{T.date}<input id="cm-date" type="date" value="2026-09-15" /></label>
          </div>
          <label class="cm-row"><input type="checkbox" id="cm-q1" checked /><span><b class="cm-qn">Q1</b>{T.q1}</span></label>
          <label class="cm-row"><input type="checkbox" id="cm-q2" checked /><span><b class="cm-qn">Q2</b>{T.q2}</span></label>
          <label><span><b class="cm-qn">Q3</b>{T.q3}</span><select id="cm-q3">{T.used.map(([v, t]) => <option value={v}>{t}</option>)}</select></label>
          <fieldset class="cm-yes" id="cm-yes">
            <legend class="sr">Q4–Q7</legend>
            <label><span><b class="cm-qn">Q4</b>{T.q4}</span><select id="cm-q4">{T.freq.map(([v, t]) => <option value={v} selected={v === '4_15'}>{t}</option>)}</select></label>
            <fieldset class="cm-q5"><legend><b class="cm-qn">Q5</b>{T.q5}</legend>
              <div class="cm-chk">{SCENARIOS.map((k, i) => <label><input type="checkbox" name="cm-q5" value={k} checked={k === 'study' || k === 'daily'} />{T.scenes[i]}</label>)}</div>
            </fieldset>
            <label><span><b class="cm-qn">Q6</b>{T.q6}</span><select id="cm-q6">{T.help.map(([v, t]) => <option value={v} selected={v === '4'}>{t}</option>)}</select></label>
            <label><span><b class="cm-qn">Q7</b>{T.q7}</span><select id="cm-q7">{T.verify.map(([v, t]) => <option value={v} selected={v === '3'}>{t}</option>)}</select></label>
          </fieldset>
          <p class="cm-hint" id="cm-hint"></p>
          <div class="cm-btns">
            <button type="submit" class="cm-btn" id="cm-add">{T.submit}</button>
            <button type="button" class="cm-btn red" id="cm-sample">{T.sample}</button>
            <button type="button" class="cm-btn red" id="cm-stress">{T.stress}</button>
            <button type="button" class="cm-link" id="cm-clear">{T.clear}</button>
          </div>
        </fieldset>
        <p class="cm-hint">{T.privacy}</p>
      </form>
      <div class="cm-pipe" id="cm-pipe"><PyBoot prefix="cm" /></div>
      <div class="cm-stats" id="cm-stats">
        <div>
          <div class="cm-lab"><span>{T.incLabel}</span><span class="cm-note">included_n / input_n</span></div>
          <div class="cm-kpi"><span class="cm-inc" id="cm-inc">0</span><span class="cm-sl">/</span><span class="cm-all" id="cm-all">0</span></div>
        </div>
        <div>
          <div class="cm-lab"><span>{T.yesLabel}</span><span class="cm-note">{T.yesNote}</span></div>
          <div class="cm-yesrow"><span class="cm-yesv" id="cm-yes-share">—</span><span class="cm-usub" id="cm-counts"></span></div>
        </div>
        <div>
          <div class="cm-lab"><span>{T.sceneLabel}</span><span class="cm-note" id="cm-den"></span></div>
          <ul class="cm-scenes" id="cm-scenes">{SCENARIOS.map((k, i) => <li data-k={k}><span>{T.scenes[i]}</span><span class="cm-st"><i></i></span><span class="cm-sp">—</span></li>)}</ul>
        </div>
        <div>
          <div class="cm-lab"><span>{T.helpLabel}</span><span class="cm-note">{T.median} <b class="cm-medv" id="cm-med">—</b></span></div>
          <div class="cm-hist" id="cm-hist"><div class="cm-medl" id="cm-medl"></div>{[1, 2, 3, 4, 5].map(v => <div class="cm-hc" data-v={v}><i></i><b></b><em>{v}</em></div>)}</div>
        </div>
        <p class="cm-pstatus" id="cm-pstatus" hidden>{T.statusLabel} <span id="cm-program-status" lang="zh-CN"></span></p>
      </div>
    </div>
    <p class="cm-ledger" id="cm-ledger"></p>
    <p class="cm-hint cm-lightnote" id="cm-light" hidden>{T.lightNote}</p>
    <div class="cm-invalid" id="cm-invalid" role="alert" hidden><strong>{T.invalidTitle}</strong> <span id="cm-invalid-msg" lang="zh-CN"></span><small>{T.invalidNote}</small></div>
    <div class="cm-bottom">
      <div class="cm-codewrap">
        <CodeLive id="cm-code" file="public/downloads/campus/analysis.py" first={87} last={97} title={T.codeTitle} meta={T.codeMeta} label={T.codeLabel} />
        <p class="cm-hint">{T.codeNote}</p>
      </div>
      <div class="cm-tests" id="cm-tests">
        <div class="cm-th"><span>{T.testsTitle(tests.length)}</span><button type="button" class="cm-btn" id="cm-run" disabled>{T.run(tests.length)}</button></div>
        <div class="cm-grid" id="cm-grid">
          {tests.map((t, i) => <div class="cm-cell" data-test={t} data-status=""><span class="cm-ci">{String(i + 1).padStart(2, '0')}</span><span class="cm-cn">{t}</span><span class="cm-ck" aria-hidden="true"></span></div>)}
        </div>
        <div class="cm-tf"><span class="cm-cmd" id="cm-cmd">{T.cmd}</span><div class="cm-slam" id="cm-slam" role="status"></div></div>
        <div class="cm-tflash"></div>
      </div>
    </div>
  </div>
  <p class="wrap cm-fallback" id="cm-fallback" hidden>{T.fallback} <a href="/downloads/campus/analysis.py">{T.download}</a> · <button type="button" class="cm-link" id="cm-retry">{T.retry}</button></p>
</section>
<script>
  import { initCampusLive } from '../scripts/campus-live';
  document.querySelectorAll<HTMLElement>('[data-campus-live]').forEach(initCampusLive);
</script>
<style>
  .campus-live { --cm-line: color-mix(in srgb, var(--night-fg) 14%, transparent); padding-bottom: 32px; overflow-x: clip; }
  .cm-intro { max-width: 60em; margin: 14px 0 18px; }
  .cm-stage { position: relative; max-width: 1600px; margin-inline: auto; overflow: hidden; }
  .cm-stage[hidden] { display: none; }
  .cm-top { display: flex; align-items: center; gap: 10px 16px; flex-wrap: wrap; padding: 12px var(--gutter); border-bottom: 1px solid var(--cm-line); }
  .cm-chip, .cm-tag { padding: 2px 8px; border: 1px solid color-mix(in srgb, var(--night-fg) 25%, transparent); font: 600 12px Consolas, 'Cascadia Mono', monospace; letter-spacing: .06em; color: var(--night-mute); }
  .cm-chip.live { color: var(--night-fg); border-color: var(--red); }
  .cm-tag { font-family: var(--font-body); letter-spacing: 0; color: var(--night-fg); border-color: color-mix(in srgb, var(--red) 60%, transparent); }
  .cm-tag[hidden] { display: none; }
  .cm-status { font-size: 13px; color: var(--night-mute); }
  .cm-status.bad { color: var(--night-fg); padding: 2px 8px; background: color-mix(in srgb, var(--red) 30%, transparent); }
  .cm-timing { margin-left: auto; font: 12px Consolas, 'Cascadia Mono', monospace; color: var(--night-mute); }
  .cm-start { padding: 28px var(--gutter); }
  .cm-start p { margin-top: 8px; color: var(--night-mute); font-size: 13px; }
  .cm-main { display: grid; grid-template-columns: 260px minmax(0, 1fr) 290px; border-bottom: 1px solid var(--cm-line); }
  .cm-form { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 14px 16px 12px; border-right: 1px solid var(--cm-line); font-size: 12.5px; line-height: 1.5; color: var(--night-mute); }
  .cm-fields, .cm-yes, .cm-q5 { display: flex; flex-direction: column; gap: 8px; min-width: 0; margin: 0; padding: 0; border: 0; }
  .cm-fields:disabled, .cm-yes:disabled { opacity: .45; }
  .cm-form label { display: grid; gap: 3px; color: var(--night-fg); }
  .cm-form .cm-row { display: flex; align-items: flex-start; gap: 7px; cursor: pointer; }
  .cm-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .cm-qn { margin-right: 6px; font: 600 11.5px Consolas, monospace; color: var(--night-mute); }
  .cm-form input:not([type=checkbox]), .cm-form select { width: 100%; padding: 5px 7px; border: 1.5px solid color-mix(in srgb, var(--night-fg) 30%, transparent); border-radius: 0; background: var(--night); color: var(--night-fg); font: inherit; font-size: 13px; color-scheme: dark; }
  .cm-form input[type=checkbox] { margin: 3px 0 0; accent-color: var(--red); }
  .cm-q5 legend { padding: 0; color: var(--night-fg); }
  .cm-chk { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; }
  .cm-form .cm-chk label { display: flex; align-items: center; gap: 5px; cursor: pointer; white-space: nowrap; }
  .cm-hint { font-size: 12px; line-height: 1.5; color: var(--night-mute); }
  .cm-btns { display: grid; gap: 6px; margin-top: 4px; }
  .cm-btn { padding: 7px 12px; border: 1.5px solid var(--night-fg); background: transparent; color: var(--night-fg); font-weight: 700; font-size: 13px; text-align: center; cursor: pointer; }
  .cm-btn.red { border-color: var(--red); }
  .cm-btn:hover:not(:disabled) { background: var(--night-fg); color: var(--night); }
  .cm-btn:disabled { opacity: .45; cursor: default; }
  .cm-link { justify-self: start; padding: 0; border: 0; background: none; color: inherit; font: inherit; font-size: 12.5px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .cm-pipe { position: relative; min-width: 0; min-height: 440px; }   /* no clipping: the boot chips fly out to #cm-chip */
  .cm-pipe :global(canvas) { position: absolute; inset: 0; display: block; width: 100%; height: 100%; pointer-events: none; }
  .cm-stats { display: flex; flex-direction: column; gap: 12px; min-width: 0; padding: 14px 18px 12px; border-left: 1px solid var(--cm-line); font-size: 12px; }
  .cm-lab { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; line-height: 1.4; color: var(--night-mute); }
  .cm-note { font-size: 11px; text-align: right; }
  .cm-kpi { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
  .cm-inc { font: 700 52px/1 var(--font-display); }
  .cm-sl { font: 600 30px/1 var(--font-display); color: var(--night-mute); }
  .cm-all { font: 700 30px/1 var(--font-display); color: var(--night-mute); }
  .cm-yesrow { display: flex; align-items: baseline; gap: 10px; margin-top: 4px; }
  .cm-yesv { font: 700 34px/1 var(--font-display); }
  .cm-usub { font: 11px/1.35 Consolas, monospace; color: var(--night-mute); }
  .cm-scenes { display: grid; gap: 4px; margin: 4px 0 0; padding: 0; list-style: none; }
  .cm-scenes li { display: grid; grid-template-columns: 76px 1fr 38px; gap: 8px; align-items: center; }
  .cm-scenes li > span:first-child { color: var(--night-fg); white-space: nowrap; }
  .cm-st { position: relative; height: 7px; overflow: hidden; background: color-mix(in srgb, var(--night-fg) 7%, transparent); }
  .cm-st i { position: absolute; inset: 0; background: var(--night-fg); transform: scaleX(0); transform-origin: 0 50%; transition: transform .45s cubic-bezier(.2,.8,.2,1); }
  .cm-sp { font: 11.5px Consolas, monospace; color: var(--night-mute); text-align: right; }
  .cm-hist { position: relative; display: flex; align-items: flex-end; gap: 6px; height: 58px; margin: 16px 0 18px; }
  .cm-hc { position: relative; flex: 1; height: 100%; }
  .cm-hc i { position: absolute; inset: 0; background: color-mix(in srgb, var(--night-fg) 70%, transparent); transform: scaleY(0); transform-origin: 50% 100%; transition: transform .45s cubic-bezier(.2,.8,.2,1); }
  .cm-hc.med i { background: var(--red); }
  .cm-hc em { position: absolute; left: 0; right: 0; bottom: -16px; font: 11px/1 Consolas, monospace; font-style: normal; color: var(--night-mute); text-align: center; }
  .cm-hc b { position: absolute; left: 0; right: 0; bottom: 2px; font: 600 10.5px/1 Consolas, monospace; color: var(--night-fg); text-align: center; transition: bottom .45s cubic-bezier(.2,.8,.2,1); }
  .cm-medl { position: absolute; top: -12px; bottom: -3px; z-index: 1; width: 0; border-left: 1.5px dashed var(--red); opacity: 0; pointer-events: none; transition: left .45s cubic-bezier(.2,.8,.2,1), opacity .3s; }
  .cm-medv { font: 600 12px Consolas, monospace; color: var(--night-fg); }
  .cm-pstatus { margin-top: auto; font-size: 11.5px; color: var(--night-mute); }
  .cm-stats.stale > * { opacity: .5; transition: opacity .2s; }
  .cm-lightnote { padding: 6px var(--gutter) 0; }
  .cm-ledger { min-height: 34px; padding: 8px var(--gutter); border-bottom: 1px solid var(--cm-line); font: 12px Consolas, 'Cascadia Mono', monospace; color: var(--night-mute); overflow-wrap: anywhere; }
  .cm-invalid { margin: 10px var(--gutter) 0; padding: 10px 14px; border: 1.5px solid var(--red); background: color-mix(in srgb, var(--red) 18%, transparent); color: var(--night-fg); font-size: 13px; }
  .cm-invalid[hidden] { display: none; }
  .cm-invalid small { display: block; margin-top: 4px; font-size: 12px; color: var(--night-mute); }
  .cm-bottom { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 560px); gap: 16px; padding: 14px 16px; }
  .cm-codewrap { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .cm-tests { position: relative; display: flex; flex-direction: column; gap: 8px; padding: 8px 12px; border: 1px solid var(--cm-line); overflow: hidden; }
  .cm-th { display: flex; align-items: center; justify-content: space-between; gap: 10px; font: 11.5px Consolas, monospace; color: var(--night-fg); }
  .cm-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .cm-cell { position: relative; min-height: 86px; padding: 5px 7px; border: 1px solid var(--cm-line); font: 10.5px/1.36 Consolas, monospace; color: var(--night-mute); overflow: hidden; overflow-wrap: anywhere; transition: border-color .2s, color .2s, background-color .25s; }
  .cm-ci { display: block; margin-bottom: 4px; font: 700 15px/1 var(--font-display); }
  .cm-ck { position: absolute; top: 2px; right: 6px; font: 700 16px/1.2 var(--font-body); color: var(--night-fg); }
  .cm-cell[data-status="run"] { border-color: var(--red); color: var(--night-fg); }
  .cm-cell[data-status="run"]::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 45%; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--red) 30%, transparent), transparent); animation: cm-scan .16s linear forwards; }
  .cm-cell[data-status="ok"] { border-color: color-mix(in srgb, var(--night-fg) 55%, transparent); background: color-mix(in srgb, var(--night-fg) 5%, transparent); color: var(--night-fg); }
  .cm-cell[data-status="fail"], .cm-cell[data-status="error"] { border-color: var(--red); background: color-mix(in srgb, var(--red) 16%, transparent); color: var(--night-fg); }
  @keyframes cm-scan { from { transform: translateX(-100%); } to { transform: translateX(230%); } }
  .cm-tf { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; font: 11.5px Consolas, monospace; color: var(--night-mute); }
  .cm-cmd { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cm-slam { font: 700 26px/1 var(--font-display); color: var(--night-fg); white-space: nowrap; opacity: 0; transform-origin: 70% 50%; }
  .cm-slam.go { animation: cm-slam .42s cubic-bezier(.2,1.3,.4,1) forwards; }
  @keyframes cm-slam { 0% { opacity: 0; transform: scale(2.3); filter: blur(5px); } 50% { opacity: 1; transform: scale(.95); filter: blur(0); } 100% { opacity: 1; transform: none; } }
  .cm-tflash { position: absolute; inset: 0; background: var(--night-fg); opacity: 0; pointer-events: none; }
  .cm-tests.bad .cm-tflash { background: var(--red); }
  .cm-tests.shk { animation: cm-shake .34s linear; }
  .cm-tests.shk .cm-tflash { animation: cm-tflash .55s ease-out; }
  @keyframes cm-shake { 0% { transform: none; } 14% { transform: translate(-6px, 2px); } 30% { transform: translate(5px, -2px); } 46% { transform: translate(-3px, 1px); } 62% { transform: translate(2px, -1px); } 80% { transform: translate(-1px, 0); } 100% { transform: none; } }
  @keyframes cm-tflash { 0% { opacity: .2; } 100% { opacity: 0; } }
  .cm-fallback { margin: 12px auto; }
  @media (max-width: 1100px) {
    .cm-main { grid-template-columns: 250px minmax(0, 1fr); }
    .cm-stats { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-left: 0; border-top: 1px solid var(--cm-line); }
    .cm-bottom { grid-template-columns: minmax(0, 1fr); }
  }
  @media (max-width: 800px) {
    .cm-main { grid-template-columns: minmax(0, 1fr); }
    .cm-form { border-right: 0; border-bottom: 1px solid var(--cm-line); }
    .cm-pipe { min-height: 320px; }
    .cm-stats { grid-template-columns: minmax(0, 1fr); }
    .cm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cm-cell { min-height: 64px; }
    .cm-tf { flex-wrap: wrap; }
    .cm-slam { font-size: 20px; white-space: normal; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cm-slam.go { animation: none; opacity: 1; }
    .cm-tests.shk, .cm-tests.shk .cm-tflash, .cm-cell[data-status="run"]::after { animation: none; }
    .cm-st i, .cm-hc i, .cm-hc b, .cm-medl { transition: none; }
  }
</style>
```

- [ ] **Step 6: 页面接入 `src/views/AiCampusView.astro`**

frontmatter 加 `import CampusLive from '../components/CampusLive.astro';`，`ProjectLayout` 的内容改为：

```astro
  <CampusLive slot="demo" lang={lang} />
  <CampusFramework slot="demo" lang={lang} />
  <Body />
```

- [ ] **Step 7: 运行校园页端到端测试**

Run: `npx playwright test tests/e2e/campus-live.spec.ts`
Expected: 桌面 17 passed、手机 1 passed（其余手机用例按设计跳过）。

- [ ] **Step 8: 与这一页相关的既有测试**

Run: `npx playwright test tests/e2e/phase2b.spec.ts tests/e2e/numbers.spec.ts tests/e2e/a11y.spec.ts tests/e2e/links.spec.ts tests/e2e/layout.spec.ts`
Expected: 全部通过（`[data-demo]` 被数字测试排除；新链接 `/downloads/campus/analysis.py` 可访问）。

- [ ] **Step 9: 提交**

```bash
git add src/scripts/campus-live-text.ts src/scripts/campus-live.ts src/components/CampusLive.astro src/views/AiCampusView.astro tests/e2e/campus-live.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "AI campus page: the study's own program runs in the browser — questionnaire, particle pipeline on the real trace, line profiler, streamed tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 验收

**Files:** 无新文件（截图放在 `.superpowers/`，不提交）。

- [ ] **Step 1: 全量单元测试**

Run: `npx vitest run`
Expected: 全部通过；记下总数（约 188 + 9 + 16 + 2）。

- [ ] **Step 2: 全量端到端测试**

Run: `npx playwright test`
Expected: 全部通过；记下总数。有失败先按 superpowers:systematic-debugging 查根因，不放宽断言。

- [ ] **Step 3: 看效果（桌面 1440、手机 390、减少动态效果）**

在 `.superpowers/` 写一次性脚本，用 Playwright（Edge）打开 `http://localhost:4399/projects/ai-campus/`（先 `npm run build && node tools/serve-dist.mjs 4399`），分别截：冷启动中、样本落定后、压力测试进行中、压力测试落定后、10 项测试通过后、校验失败时；手机宽度截落定后与测试区；减少动态效果截一张。逐张查看：文字不重叠、不溢出；关卡名、桶数字、点阵图例可读；闪光不刺眼；统计栏数字与账目行一致。发现问题回到对应任务修，修完重跑相关测试。

- [ ] **Step 4: 性能抽查**

在压力测试进行中，用 `performance.now()` 在页面里采 3 秒帧间隔（`requestAnimationFrame` 回调），桌面平均帧率应 ≥ 50 fps；低于就先减少 `drawMatrix` 每帧的发光循环（只扫最近点亮的格子），再测。

- [ ] **Step 5: 独立审查**

派一位审查员（最强模型）对照规格第 4、5、6 节与本计划审整个分支自 `cf6a3ab` 以来的改动，重点看 Review Focus 五条；确认的问题修掉并补测试，暂缓的列出理由。

- [ ] **Step 6: 记录与交付**

在 Obsidian 收件箱 `C:\Users\yoshi\Documents\ChatGPT\长期记忆\00-收件箱\` 新建一份 `YYYYMMDD-HHMMSS-Claude Code-作品集校园研究页真实程序上线.md`：用户的决定、做了什么（提交号、测试数、实测体积与启动时间）、替用户做的决定、待确认事项。然后用 `npm run build && npm run preview` 启动预览并替用户打开 `http://localhost:4321/projects/ai-campus/`。
