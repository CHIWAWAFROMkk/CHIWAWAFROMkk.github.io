# 2B 技术力 · 计划一：共用 Python 运行时 + 求职 Agent 在线引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 求职 Agent 页的演示区换成真实运行的引擎：Pyodide 在浏览器里运行公开仓库 4397ded 的匹配引擎，访客可改职位描述和候选人条件，结果以"证据电路"动效呈现；运行时不可用时退回现有六组回放。

**Architecture:** Pyodide 0.29.5 与所需 wheel 自托管在 `public/assets/vendor/pyodide/0.29.5/`；一个经典 Web Worker（`public/assets/py-worker.js`）与 Node 单元测试共用 `public/assets/py-core.mjs` 启动运行时、挂载源码、调用桥接函数。站点自写的 `career_bridge.py` 调用原样复制的引擎并返回 JSON；`career-wire.ts` 把结果变成电路模型（纯函数），`career-circuit.ts` 负责 SVG 与画布动效，`career-live.ts` 串起启动、编辑、计算、分数撞击与代码实况。

**Tech Stack:** Astro 7、TypeScript、Pyodide 0.29.5（Python 3.13.2，pydantic 2.12.5）、Vitest（Node 里直接跑 Pyodide）、Playwright（Edge）。

**Spec:** `docs/superpowers/specs/2026-09-30-2b-live-tech-design.md`（第 1、2、5、6、7 节；本计划为第 7 节表中的"计划一"）。视觉参考：`.superpowers/proto-v2/p1.html`（第二版原型，用户已选"对，按这个做"）。

## Global Constraints

- 工作目录 `C:\Users\yoshi\Documents\ChatGPT\项目培训\portfolio-site\work\github-pages-redesign`，分支 `redesign`；不推送、不合并、不部署。
- 提交：`git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`。只 `git add` 明确列出的路径（`.superpowers/` 未被忽略，不能带进提交）。不用裸 `git stash`。
- Pyodide 固定 0.29.5（Python 3.13.2）；随附 wheel：pydantic、pydantic-core、typing-extensions、annotated-types、typing-inspection、sqlite3（引擎经 `job_repository` 导入 `sqlite3`，已实测必需）。
- 求职引擎固定 `4397ded9c603e7e26d3dc241eb910ce3ad0a749a`，原样复制，不修改；站点只自写 `career_bridge.py`。
- 输入限制：职位描述 ≤ 20,000 字；新增经历每条 ≤ 200 字、最多 20 条；超限给提示，不调用引擎。
- 访客输入只在本机浏览器计算，不上传；页面写明。
- 演示区根元素带 `data-demo`（数字测试排除）；演示区里的数字都来自引擎或实测。
- 颜色只用 tokens 变量（`--paper --ink --mute --red --red-text --night --night-fg --night-mute`），画布颜色也从这些变量读取；夜色底上的小字只用 `--night-fg`、`--night-mute`（红色只用于线条、底色、标记框，不用于小字，保证对比度）。
- 动效：闪光不透明度 ≤ 0.35，没有整屏白闪；震动 ≤ 8px、≤ 400ms；关键时刻 ≥ 50 fps。减少动态效果时直接显示终态。
- 手机（窄屏或粗指针）与省流量时不自动下载运行时，显示"启动引擎（约 N MB）"按钮；N 来自清单实测。
- 60 秒内运行时未就绪、WebAssembly 不可用、Worker 创建失败：退回六组回放并给出重试。
- 英文页界面英文；引擎数据保持中文，并注明引擎按中文职位描述设计。

## Review Focus

1. **删掉唯一一条已确认的经历**：引擎拒绝生成材料（"Profile 中没有可用于投递材料的已确认事实。"），页面照实显示这句、电路照常画出，不崩溃 → Task 2 `pack error is returned, not raised`；Task 7 `removing the only confirmed fact shows the engine's refusal`。
2. **职位描述为空或超长、或解析不出要求**：给出可读提示，保留上一次的电路，不崩溃 → Task 2 `rejects empty and oversized input`；Task 7 `an empty job description explains itself`。
3. **运行时下载被拦截或超时**：退回六组回放并可重试 → Task 3 `boot times out`；Task 7 `blocked runtime falls back to the replay`。
4. **计算或动画进行中又连续改动**：最终显示与最后一次输入一致，旧结果不覆盖新结果 → Task 7 `rapid edits land on the last input`。
5. **手机或省流量**：进入页面不下载 14 MB 运行时，点按钮后才下载 → Task 7 `phones wait for the start button`。

---

## 文件结构

```
package.json                                   devDependency pyodide@0.29.5；脚本 py:vendor、job-agent:vendor
tools/py-vendor.mjs                            复制 Pyodide 核心、下载并校验 wheel、写清单
tools/job-agent-vendor.mjs                     从公开仓库检出复制引擎（核对提交号）、写清单
public/assets/vendor/pyodide/0.29.5/           Pyodide 核心 + 6 个 wheel + manifest.json（生成）
public/assets/py/job-agent/4397ded/            引擎 16 个模块 + tests/helpers.py + LICENSE + manifest.json（生成）
public/assets/py/career_bridge.py              站点自写的桥接
public/assets/py-core.mjs                      Worker 与 Node 测试共用：启动、挂载、调用
public/assets/py-worker.js                     浏览器 Worker：启动、按清单挂载、应答调用、报告实测进度
src/scripts/py-runtime.ts                      页面侧运行时客户端：消息、超时、错误
src/scripts/career-wire.ts                     引擎结果 → 电路模型（纯函数）、封顶信息、结论
src/scripts/career-circuit.ts                  电路排布（纯函数）+ SVG/画布渲染与动效
src/scripts/code-live.ts                       代码实况的高亮接口
src/components/CodeLive.astro                  构建时从真实文件读取源码行并渲染代码实况
src/scripts/career-live-text.ts                中英文案 + 范例职位描述
src/scripts/career-live.ts                     控制器：启动时机、冷启动、编辑、计算、撞击、降级
src/components/CareerLive.astro                演示区标记与样式；内含六组回放作为备用
src/views/CareerView.astro                     演示区换成 CareerLive
src/scripts/odometer-dom.ts                    spinOdometer 增加可选时长参数
tests/unit/py-vendor.test.ts, job-agent-vendor.test.ts, py-node.ts, career-bridge.test.ts,
  py-runtime.test.ts, career-wire.test.ts, career-circuit.test.ts, code-live.test.ts
tests/e2e/career-live.spec.ts；tests/e2e/career.spec.ts（回放测试改走 ?engine=replay）
```

---

### Task 1: 自托管 Pyodide 0.29.5

**Files:**
- Create: `tools/py-vendor.mjs`, `public/assets/vendor/pyodide/0.29.5/*`（生成）
- Modify: `package.json`
- Test: `tests/unit/py-vendor.test.ts`

**Interfaces:**
- Produces: 目录 `/assets/vendor/pyodide/0.29.5/`，含 `pyodide.mjs`、`pyodide.asm.js`、`pyodide.asm.wasm`、`python_stdlib.zip`、`pyodide-lock.json`、6 个 wheel、`manifest.json`（`{ version, python, packages: ['pydantic','sqlite3'], files: [{ name, bytes, sha256, source, package? }] }`）。

- [ ] **Step 1: 写失败的测试**

`tests/unit/py-vendor.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = 'public/assets/vendor/pyodide/0.29.5';
const manifest = () => JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));

describe('self-hosted Pyodide', () => {
  it('is 0.29.5 on Python 3.13', () => {
    expect(manifest().version).toBe('0.29.5');
    expect(manifest().python).toMatch(/^3\.13\./);
  });
  it('every listed file is present with the recorded SHA-256', () => {
    for (const f of manifest().files) {
      expect(createHash('sha256').update(readFileSync(`${DIR}/${f.name}`)).digest('hex'), f.name).toBe(f.sha256);
    }
  });
  it('ships exactly the wheels the engine imports', () => {
    const wheels = manifest().files.map((f: { package?: string }) => f.package).filter(Boolean).sort();
    expect(wheels).toEqual(['annotated-types', 'pydantic', 'pydantic-core', 'sqlite3', 'typing-extensions', 'typing-inspection']);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/py-vendor.test.ts`
Expected: FAIL（`ENOENT … manifest.json`）。

- [ ] **Step 3: 下载脚本**

`tools/py-vendor.mjs`：

```js
// npm run py:vendor — copies the pinned Pyodide core from node_modules and downloads the wheels the live demos use,
// checking each wheel against the SHA-256 in Pyodide's own lock file. Writes manifest.json next to them.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = '0.29.5';
const CORE = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
const WHEELS = ['pydantic', 'pydantic-core', 'typing-extensions', 'annotated-types', 'typing-inspection', 'sqlite3'];
const src = 'node_modules/pyodide', out = `public/assets/vendor/pyodide/${VERSION}`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const installed = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8')).version;
if (installed !== VERSION) throw Error(`node_modules/pyodide is ${installed}, expected ${VERSION}`);
mkdirSync(out, { recursive: true });
const files = [];
for (const name of CORE) {
  copyFileSync(join(src, name), join(out, name));
  const bytes = readFileSync(join(out, name));
  files.push({ name, bytes: bytes.length, sha256: sha(bytes), source: `npm:pyodide@${VERSION}/${name}` });
}
const lock = JSON.parse(readFileSync(join(out, 'pyodide-lock.json'), 'utf8'));
for (const pkg of WHEELS) {
  const entry = lock.packages[pkg];
  const url = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/${entry.file_name}`;
  const res = await fetch(url);
  if (!res.ok) throw Error(`${url}: ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (sha(bytes) !== entry.sha256) throw Error(`${entry.file_name}: SHA-256 differs from pyodide-lock.json`);
  writeFileSync(join(out, entry.file_name), bytes);
  files.push({ name: entry.file_name, bytes: bytes.length, sha256: entry.sha256, source: url, package: pkg });
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ version: VERSION, python: lock.info.python, packages: ['pydantic', 'sqlite3'], files }, null, 2) + '\n');
console.log(`${files.length} files, ${(files.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1)} MB`);
```

`package.json`：`devDependencies` 加 `"pyodide": "0.29.5"`（精确版本）；`scripts` 在 `"quotadeck:shots"` 后加 `"py:vendor": "node tools/py-vendor.mjs"`。然后：

```bash
npm install
npm run py:vendor
```

Expected: 打印 `11 files, 14.x MB`。

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/py-vendor.test.ts`
Expected: PASS（3 个测试）。

- [ ] **Step 5: 提交**

```bash
git add tools/py-vendor.mjs package.json package-lock.json public/assets/vendor/pyodide tests/unit/py-vendor.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Self-host Pyodide 0.29.5 with the wheels the job agent engine needs, pinned by SHA-256" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 引擎复制、桥接与 Node 里的真实引擎测试

**Files:**
- Create: `tools/job-agent-vendor.mjs`, `public/assets/py/job-agent/4397ded/*`（生成）, `public/assets/py/career_bridge.py`, `public/assets/py-core.mjs`, `src/scripts/career-live-text.ts`（本任务只放 `DEMO_JD`，Task 7 补全文案）
- Modify: `package.json`（脚本 `job-agent:vendor`）
- Test: `tests/unit/job-agent-vendor.test.ts`, `tests/unit/py-node.ts`, `tests/unit/career-bridge.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `/assets/vendor/pyodide/0.29.5/`。
- Produces:
  - `py-core.mjs`：`PYODIDE = '/assets/vendor/pyodide/0.29.5/'`；`PACKAGES = ['pydantic', 'sqlite3']`；`boot(loadPyodide, indexURL, onStep?) → Promise<PyodideAPI>`（onStep(step: 'runtime' | 'packages', info: { ms, python? })）；`mount(py, files: {path, bytes}[])`；`call(py, module, fn, args: unknown[]) → unknown`（参数逐个 JSON 序列化传给 Python，Python 返回 JSON 字符串）。
  - `career_bridge.run(jd_json, candidate_json) → str(JSON)`。candidate：`{ days: number|null, statuses?: {[factId]: 'user_confirmed'|'needs_confirmation'}, removed?: string[], added?: {statement, skills: string[], status}[] }`。返回 `EngineResult`（字段见 Task 4）或 `{ error: string }`。
  - `DEMO_JD`（`career-live-text.ts`）：与 `public/downloads/export-job-agent-demo.py` 中的 JD 逐字相同。

- [ ] **Step 1: 写失败的测试**

`tests/unit/job-agent-vendor.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = 'public/assets/py/job-agent/4397ded';
const manifest = () => JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));

describe('vendored job agent engine', () => {
  it('is pinned to the public commit', () => {
    expect(manifest().commit).toBe('4397ded9c603e7e26d3dc241eb910ce3ad0a749a');
  });
  it('every file matches its recorded SHA-256', () => {
    for (const f of manifest().files) expect(createHash('sha256').update(readFileSync(`${DIR}/${f.path}`)).digest('hex'), f.path).toBe(f.sha256);
  });
  it('carries the 16 engine modules, the fictional candidate and the licence', () => {
    const paths = manifest().files.map((f: { path: string }) => f.path);
    expect(paths.filter((p: string) => p.startsWith('job_agent/'))).toHaveLength(16);
    expect(paths).toContain('tests/helpers.py');
    expect(paths).toContain('LICENSE');
  });
  it('the cap lines the page quotes are still at 697-702', () => {
    const lines = readFileSync(`${DIR}/job_agent/services/local_matcher.py`, 'utf8').split('\n');
    expect(lines[697]).toContain('_cap_breakdown(breakdown, 59)');
    expect(lines[699]).toContain('_cap_breakdown(breakdown, 84)');
    expect(lines[701]).toContain('score = breakdown.total');
  });
});
```

`tests/unit/py-node.ts`（测试辅助，不是测试文件）：

```ts
// Boots the self-hosted Pyodide in Node with the vendored engine and the site's bridges mounted — the same
// files, loaded by the same py-core.mjs, as the browser worker.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as core from '../../public/assets/py-core.mjs';

const VENDOR = resolve('public/assets/vendor/pyodide/0.29.5').replace(/\\/g, '/') + '/';
const ENGINE = 'public/assets/py/job-agent/4397ded';
let booted: Promise<any> | null = null;

export function bootNode(): Promise<any> {
  booted ??= (async () => {
    const { loadPyodide } = await import(pathToFileURL(VENDOR + 'pyodide.mjs').href);
    const py = await core.boot(loadPyodide, VENDOR);
    const manifest = JSON.parse(readFileSync(`${ENGINE}/manifest.json`, 'utf8'));
    core.mount(py, manifest.files.filter((f: { path: string }) => f.path.endsWith('.py'))
      .map((f: { path: string }) => ({ path: f.path, bytes: readFileSync(`${ENGINE}/${f.path}`) })));
    core.mount(py, [{ path: 'career_bridge.py', bytes: readFileSync('public/assets/py/career_bridge.py') }]);
    return py;
  })();
  return booted;
}
```

`tests/unit/career-bridge.test.ts`：

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { call } from '../../public/assets/py-core.mjs';
import { bootNode } from './py-node';
import { DEMO_JD } from '../../src/scripts/career-live-text';

let py: any;
beforeAll(async () => { py = await bootNode(); }, 120_000);
const run = (jd: string, candidate: object): any => call(py, 'career_bridge', 'run', [jd, candidate]);
const TABLEAU = { 'fact-pending-tableau': 'user_confirmed' };

describe('career bridge running the real engine under Pyodide', () => {
  it('four days: the unknown SQL requirement caps the raw 86 at 84', () => {
    const r = run(DEMO_JD, { days: 4 });
    expect([r.raw, r.cap, r.score]).toEqual([86, 84, 84]);
    expect(r.gates.find((g: any) => g.requirement === '必须熟练使用 SQL').status).toBe('unknown');
    expect(r.pack.factIds).toEqual(['fact-sql-analysis']);
  });
  it('three days: the failed hard requirement caps the raw 81 at 59', () => {
    const r = run(DEMO_JD, { days: 3 });
    expect([r.raw, r.cap, r.score]).toEqual([81, 59, 59]);
    expect(r.gates.find((g: any) => g.requirement === '每周至少 4 天').status).toBe('fails');
  });
  it('confirming Tableau puts a second fact into the materials; the cap still holds', () => {
    const r = run(DEMO_JD, { days: 4, statuses: TABLEAU });
    expect([r.raw, r.cap, r.score]).toEqual([95, 84, 84]);
    expect(r.pack.factIds).toEqual(['fact-sql-analysis', 'fact-pending-tableau']);
  });
  it('unknown availability: raw 83 stays under the 84 cap', () => {
    const r = run(DEMO_JD, { days: null });
    expect([r.raw, r.cap, r.score]).toEqual([83, 84, 83]);
  });
  it('an added fact is matched by skill and enters the materials', () => {
    const jd = '岗位：数据分析实习生\n岗位要求：\n- 熟练使用 Python 和 SQL；\n- 每周至少 3 天；\n- 有数据可视化经验（Power BI 或 Tableau）；\n- 良好的沟通能力。';
    const r = run(jd, { days: 4, added: [{ statement: '用 Python 和 pandas 做过销售数据清洗与可视化', skills: ['Python', 'pandas'], status: 'user_confirmed' }] });
    expect(r.cap).toBeNull();
    expect(r.evidence.find((e: any) => e.skill === 'Python').factIds).toEqual(['fact-visitor-1']);
    expect(r.pack.factIds).toContain('fact-visitor-1');
    expect(r.requirements.map((q: any) => q.category)).toEqual(['tool', 'availability', 'experience', 'other']);
  });
  it('pack error is returned, not raised, when no confirmed fact is left', () => {
    const r = run(DEMO_JD, { days: 4, removed: ['fact-sql-analysis'] });
    expect(r.pack).toBeNull();
    expect(r.packError).toBe('Profile 中没有可用于投递材料的已确认事实。');
    expect(r.score).toBe(45);
  });
  it('rejects empty and oversized input without running the engine', () => {
    expect(run('   ', { days: 4 }).error).toBe('职位描述不能为空。');
    expect(run('字'.repeat(20001), { days: 4 }).error).toBe('职位描述超过 20,000 字。');
    expect(run(DEMO_JD, { days: 9 }).error).toBe('每周到岗天数应为 1–7。');
    expect(run(DEMO_JD, { days: 4, added: [{ statement: '经'.repeat(201), skills: [], status: 'user_confirmed' }] }).error).toBe('每条经历不超过 200 字。');
    expect(run(DEMO_JD, { days: 4, added: Array.from({ length: 21 }, () => ({ statement: '一条', skills: [], status: 'user_confirmed' })) }).error).toBe('新增经历最多 20 条。');
  });
  it('reports the fictional candidate the circuit draws', () => {
    const r = run(DEMO_JD, { days: 4 });
    expect(r.profile).toEqual({ education: '本科 · 信息管理', days: 4, months: 6, facts: [
      { id: 'fact-sql-analysis', statement: '使用 SQL 清洗业务数据并输出周度分析。', status: 'documented' },
      { id: 'fact-pending-tableau', statement: '独立搭建 Tableau 仪表盘。', status: 'needs_confirmation' },
    ] });
    expect(r.ms).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/job-agent-vendor.test.ts tests/unit/career-bridge.test.ts`
Expected: FAIL（找不到 `manifest.json`、`py-core.mjs`、`career-live-text`）。

- [ ] **Step 3: 复制脚本并生成引擎目录**

`tools/job-agent-vendor.mjs`：

```js
// npm run job-agent:vendor — copies the matching engine, unmodified, from a checkout of the public repository pinned to
// one commit. Usage: JOB_AGENT_ROOT=<personal-job-agent checkout> npm run job-agent:vendor
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const COMMIT = '4397ded9c603e7e26d3dc241eb910ce3ad0a749a';
const MODULES = ['__init__', 'constants', 'models/__init__', 'models/application', 'models/application_tracking', 'models/base',
  'models/commute', 'models/interview_debrief', 'models/job', 'models/job_record', 'models/profile', 'services/__init__',
  'services/application_pack', 'services/job_repository', 'services/local_matcher', 'services/tracking_parser'];
const COPY = [...MODULES.map(m => [`src/job_agent/${m}.py`, `job_agent/${m}.py`]), ['tests/helpers.py', 'tests/helpers.py'], ['LICENSE', 'LICENSE']];

const root = process.env.JOB_AGENT_ROOT;
if (!root) { console.error('Set JOB_AGENT_ROOT to a checkout of https://github.com/CHIWAWAFROMkk/personal-job-agent'); process.exit(1); }
const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== COMMIT) { console.error(`The checkout is at ${head}; run: git -C "${root}" checkout ${COMMIT}`); process.exit(1); }
const out = `public/assets/py/job-agent/${COMMIT.slice(0, 7)}`;
const files = COPY.map(([from, to]) => {
  const bytes = readFileSync(join(root, from));
  mkdirSync(dirname(join(out, to)), { recursive: true });
  writeFileSync(join(out, to), bytes);
  return { path: to, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ repository: 'https://github.com/CHIWAWAFROMkk/personal-job-agent', commit: COMMIT, files }, null, 2) + '\n');
console.log(`${files.length} files → ${out}`);
```

`package.json` 的 `scripts` 加 `"job-agent:vendor": "node tools/job-agent-vendor.mjs"`。公开仓库检出（只读克隆到会话临时目录；已存在则只切换提交）：

```bash
S=<会话临时目录>
[ -d "$S/pja" ] || git clone -q https://github.com/CHIWAWAFROMkk/personal-job-agent "$S/pja"
git -C "$S/pja" checkout -q 4397ded9c603e7e26d3dc241eb910ce3ad0a749a
JOB_AGENT_ROOT="$S/pja" npm run job-agent:vendor
```

Expected: `18 files → public/assets/py/job-agent/4397ded`。

- [ ] **Step 4: 共用核心**

`public/assets/py-core.mjs`：

```js
// Shared by the browser worker (py-worker.js) and the Node unit tests: boots Pyodide, loads the packages the engine
// imports, mounts Python sources, and calls bridge functions that take and return JSON strings.
export const PYODIDE = '/assets/vendor/pyodide/0.29.5/';
export const PACKAGES = ['pydantic', 'sqlite3'];
const HOME = '/home/pyodide/';

export async function boot(loadPyodide, indexURL, onStep = () => {}) {
  let t = performance.now();
  const py = await loadPyodide({ indexURL });
  onStep('runtime', { ms: performance.now() - t, python: py.runPython('import sys; sys.version.split()[0]') });
  t = performance.now();
  await py.loadPackage(PACKAGES, { messageCallback: () => {}, errorCallback: () => {} });
  onStep('packages', { ms: performance.now() - t });
  return py;
}

/** Writes files under the Python working directory, which is on sys.path. */
export function mount(py, files) {
  for (const { path, bytes } of files) {
    const full = HOME + path;
    py.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
    py.FS.writeFile(full, bytes);
  }
}

export function call(py, module, fn, args) {
  const f = py.pyimport(module)[fn];
  try { return JSON.parse(f(...args.map(a => JSON.stringify(a)))); }
  finally { f.destroy?.(); }
}
```

- [ ] **Step 5: 桥接**

`public/assets/py/career_bridge.py`：

```python
"""Browser bridge for the public job-agent engine (vendored unmodified at 4397ded).

Builds the fictional candidate from the visitor's edits, runs the real matcher and application pack, and returns plain
JSON. It wraps _cap_breakdown only to read the raw total and the cap the engine applies; the engine's result is unchanged.
"""
import json
import time
from datetime import UTC, datetime

from job_agent.models.application import ResumeBundle
from job_agent.models.job_record import JobDetail
from job_agent.models.profile import ClaimStatus, ContactInfo, EvidenceFact, Skill
from job_agent.services import local_matcher
from job_agent.services.application_pack import ApplicationPackError, build_application_pack
from tests.helpers import sample_profile

MAX_JD = 20000
MAX_FACT = 200
MAX_ADDED = 20
FIXED = datetime(2026, 9, 12, tzinfo=UTC)
RANK = {ClaimStatus.DOCUMENTED: 2, ClaimStatus.USER_CONFIRMED: 1, ClaimStatus.NEEDS_CONFIRMATION: 0}
EDITABLE = ('user_confirmed', 'needs_confirmation')


def _problem(jd, candidate):
    if not jd.strip():
        return '职位描述不能为空。'
    if len(jd) > MAX_JD:
        return f'职位描述超过 {MAX_JD:,} 字。'
    days = candidate.get('days')
    if days is not None and (type(days) is not int or not 1 <= days <= 7):
        return '每周到岗天数应为 1–7。'
    added = candidate.get('added') or []
    if len(added) > MAX_ADDED:
        return f'新增经历最多 {MAX_ADDED} 条。'
    for item in added:
        statement = str(item.get('statement', '')).strip()
        if not statement:
            return '新增经历不能为空。'
        if len(statement) > MAX_FACT:
            return f'每条经历不超过 {MAX_FACT} 字。'
        if item.get('status') not in EDITABLE:
            return '经历状态只能是已确认或待确认。'
    return None


def build_profile(candidate):
    profile = sample_profile()
    profile.person.display_name = '示例候选人（虚构）'
    profile.person.contact = ContactInfo()
    profile.updated_at = FIXED
    for source in profile.source_documents:
        source.imported_at = FIXED
    profile.job_search.availability.days_per_week = candidate.get('days')
    experience = profile.experiences[0]
    removed = set(candidate.get('removed') or [])
    experience.facts = [f for f in experience.facts if f.id not in removed]
    for fact in experience.facts:
        status = (candidate.get('statuses') or {}).get(fact.id)
        if status in EDITABLE and fact.status != ClaimStatus.DOCUMENTED:
            fact.status = ClaimStatus(status)
    for n, item in enumerate(candidate.get('added') or [], 1):
        skills = [str(s).strip()[:30] for s in item.get('skills', []) if str(s).strip()][:5]
        fact = EvidenceFact(id=f'fact-visitor-{n}', statement=str(item['statement']).strip(), skills=skills, tools=skills,
                            status=ClaimStatus(item['status']))
        experience.facts.append(fact)
        for k, name in enumerate(skills):
            profile.skills.append(Skill(id=f'skill-visitor-{n}-{k}', name=name, evidence_fact_ids=[fact.id], status=fact.status))
    by_id = {f.id: f for f in experience.facts}
    kept = []
    for skill in profile.skills:
        facts = [by_id[i] for i in skill.evidence_fact_ids if i in by_id]
        if facts:
            skill.status = max((f.status for f in facts), key=RANK.get)
            kept.append(skill)
    profile.skills = kept
    return profile


def run(jd_json, candidate_json):
    jd, candidate = json.loads(jd_json), json.loads(candidate_json)
    problem = _problem(jd, candidate)
    if problem:
        return json.dumps({'error': problem}, ensure_ascii=False)
    started = time.perf_counter()
    profile = build_profile(candidate)
    capture = {}
    original = local_matcher._cap_breakdown

    def read_cap(breakdown, cap):
        capture['raw'], capture['cap'] = breakdown.total, cap
        return original(breakdown, cap)

    local_matcher._cap_breakdown = read_cap
    try:
        job = local_matcher.structure_job_locally(jd)
        result = local_matcher.match_job_locally(profile, job)
    finally:
        local_matcher._cap_breakdown = original
    stamp = FIXED.isoformat()
    detail = JobDetail(job_id=1, company=result.job.company, title=result.job.title, location=result.job.location, jd_text=jd,
                       status='saved', created_at=stamp, updated_at=stamp, first_seen_at=stamp, last_seen_at=stamp)
    try:
        pack = build_application_pack(profile, detail, result,
                                      ResumeBundle(status='needs_generation', note='演示未生成定向简历，需要本人审阅。'), generated_at=FIXED)
        pack_error = None
    except ApplicationPackError as error:
        pack, pack_error = None, str(error)
    education = profile.education[0] if profile.education else None
    availability = profile.job_search.availability
    return json.dumps({
        'ms': round((time.perf_counter() - started) * 1000, 1),
        'job': {'company': job.company, 'title': job.title},
        'requirements': [{'text': r.text, 'category': r.category, 'hardGate': r.hard_gate} for r in job.requirements],
        'evidence': [{'skill': e.requirement, 'status': str(e.status), 'factIds': list(e.profile_fact_ids)} for e in result.evidence],
        'gates': [{'requirement': g.requirement, 'status': str(g.status), 'factIds': list(g.profile_fact_ids), 'explanation': g.explanation}
                  for g in result.hard_gates],
        'profile': {
            'education': f'{education.degree} · {education.major}' if education else None,
            'days': availability.days_per_week,
            'months': availability.duration_months,
            'facts': [{'id': f.id, 'statement': f.statement, 'status': str(f.status)} for f in profile.experiences[0].facts],
        },
        'score': result.overall_score,
        'raw': capture.get('raw', result.overall_score),
        'cap': capture.get('cap'),
        'recommendation': str(result.recommendation),
        'pack': {'factIds': [e.fact_id for e in pack.evidence], 'blocks': sum(1 for x in pack.review_checklist if x.blocks_submission)} if pack else None,
        'packError': pack_error,
    }, ensure_ascii=False)
```

`src/scripts/career-live-text.ts`（本任务先只写这一段，Task 7 在其后追加）：

```ts
/** The fictional job description of the public replay (identical to public/downloads/export-job-agent-demo.py). */
export const DEMO_JD = `公司：示例科技（虚构）
岗位：AI运营实习生
地点：上海

岗位职责：
- 负责 AI 产品运营和用户数据分析。
岗位要求：
- 本科及以上学历；
- 每周至少 4 天，连续实习 3 个月；
- 必须熟练使用 SQL；
- Tableau 经验加分。`;
```

- [ ] **Step 6: 运行，确认通过**

Run: `npx vitest run tests/unit/job-agent-vendor.test.ts tests/unit/career-bridge.test.ts`
Expected: PASS（4 + 8 个测试）。若 Python 的 `tests` 包导入失败（隐式命名空间包在 Pyodide 里不可用），在 `mount` 的调用方为 `tests/__init__.py` 写入空文件并记 Ruling；不要修改复制来的文件。

- [ ] **Step 7: 提交**

```bash
git add tools/job-agent-vendor.mjs package.json public/assets/py public/assets/py-core.mjs src/scripts/career-live-text.ts tests/unit/job-agent-vendor.test.ts tests/unit/py-node.ts tests/unit/career-bridge.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Job agent engine 4397ded vendored unmodified, with a JSON bridge tested under real Pyodide" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 浏览器 Worker 与运行时客户端

**Files:**
- Create: `public/assets/py-worker.js`, `src/scripts/py-runtime.ts`
- Test: `tests/unit/py-runtime.test.ts`

**Interfaces:**
- Consumes: `py-core.mjs`（Task 2）。
- Produces:
  - Worker 消息：页面发 `{ type: 'boot', bundles: string[], files: string[], imports: string[] }`、`{ type: 'call', id, module, fn, args }`；Worker 回 `{ type: 'progress', step: 'runtime'|'packages'|'sources', ms, bytes, detail, modules? }`、`{ type: 'ready', python, pyodide, ms }`、`{ type: 'result', id, value, ms }`、`{ type: 'error', id|null, message }`。
  - `py-runtime.ts`：`BOOT_TIMEOUT = 60_000`；`createPyRuntime(o: PyRuntimeOptions): PyRuntime`；`PyRuntime = { boot(onProgress): Promise<PyReady>; call<T>(module, fn, args): Promise<{ value: T; ms: number }>; dispose(): void }`；类型 `PyProgress { step; ms; bytes; detail; modules? }`、`PyReady { python; pyodide; ms }`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/py-runtime.test.ts`：

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPyRuntime, BOOT_TIMEOUT } from '../../src/scripts/py-runtime';

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  sent: any[] = [];
  terminated = false;
  postMessage(m: unknown) { this.sent.push(m); }
  emit(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
  terminate() { this.terminated = true; }
}
const OPTS = { bundles: ['/assets/py/job-agent/4397ded/'], files: ['/assets/py/career_bridge.py'], imports: ['career_bridge'] };
function setup() {
  const w = new FakeWorker();
  const rt = createPyRuntime({ ...OPTS, makeWorker: () => w as unknown as Worker });
  return { w, rt };
}
afterEach(() => { vi.useRealTimers(); });

describe('py runtime client', () => {
  it('sends the boot request, forwards measured progress and resolves on ready', async () => {
    const { w, rt } = setup();
    const seen: string[] = [];
    const ready = rt.boot(p => seen.push(`${p.step}:${p.bytes}`));
    expect(w.sent[0]).toEqual({ type: 'boot', ...OPTS });
    w.emit({ type: 'progress', step: 'runtime', ms: 900, bytes: 11_000_000, detail: '3.13.2' });
    w.emit({ type: 'progress', step: 'packages', ms: 400, bytes: 2_500_000, detail: 'pydantic · sqlite3' });
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1500 });
    await expect(ready).resolves.toEqual({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1500 });
    expect(seen).toEqual(['runtime:11000000', 'packages:2500000']);
  });
  it('boot times out after the limit and terminates the worker', async () => {
    vi.useFakeTimers();
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    vi.advanceTimersByTime(BOOT_TIMEOUT + 1);
    await expect(ready).rejects.toThrow('timeout');
    expect(w.terminated).toBe(true);
  });
  it('a worker error during boot rejects it', async () => {
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    w.emit({ type: 'error', id: null, message: 'HTTP 404' });
    await expect(ready).rejects.toThrow('HTTP 404');
  });
  it('a worker that cannot be created rejects boot', async () => {
    const rt = createPyRuntime({ ...OPTS, makeWorker: () => { throw new Error('blocked'); } });
    await expect(rt.boot(() => {})).rejects.toThrow('blocked');
  });
  it('calls resolve by id even when answers arrive out of order; an error rejects only its call', async () => {
    const { w, rt } = setup();
    const ready = rt.boot(() => {});
    w.emit({ type: 'ready', python: '3.13.2', pyodide: '0.29.5', ms: 1 });
    await ready;
    const a = rt.call('career_bridge', 'run', ['jd', { days: 4 }]);
    const b = rt.call('career_bridge', 'run', ['jd', { days: 3 }]);
    const [ida, idb] = w.sent.slice(1).map(m => m.id);
    w.emit({ type: 'result', id: idb, value: { score: 59 }, ms: 2 });
    w.emit({ type: 'error', id: ida, message: 'ValueError: boom' });
    await expect(b).resolves.toEqual({ value: { score: 59 }, ms: 2 });
    await expect(a).rejects.toThrow('ValueError: boom');
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/py-runtime.test.ts`
Expected: FAIL（找不到模块 `py-runtime`）。

- [ ] **Step 3: Worker 与客户端**

`public/assets/py-worker.js`：

```js
// Python runtime worker for the live demos: boots the self-hosted Pyodide, mounts the Python sources the page names,
// and answers calls. Progress numbers are measured (Resource Timing, performance.now), never estimated.
addEventListener('unhandledrejection', e => e.preventDefault());
let py, core, seen = 0;
const transferred = () => {
  const total = performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0), 0);
  const delta = total - seen; seen = total; return delta;
};
const lastLine = e => String((e && e.message) || e).trim().split('\n').filter(Boolean).pop();
async function bytesOf(url) {
  const r = await fetch(url);
  if (!r.ok) throw Error(`${url}: HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
onmessage = async ({ data: m }) => {
  try {
    if (m.type === 'boot') {
      const t0 = performance.now();
      core = await import('./py-core.mjs');
      const { loadPyodide } = await import(core.PYODIDE + 'pyodide.mjs');
      transferred();
      py = await core.boot(loadPyodide, core.PYODIDE, (step, info) =>
        postMessage({ type: 'progress', step, ms: info.ms, bytes: transferred(), detail: info.python || core.PACKAGES.join(' · ') }));
      const t = performance.now(), modules = [];
      for (const bundle of m.bundles) {
        const manifest = await (await fetch(bundle + 'manifest.json')).json();
        const files = manifest.files.filter(f => f.path.endsWith('.py'));
        core.mount(py, await Promise.all(files.map(async f => ({ path: f.path, bytes: await bytesOf(bundle + f.path) }))));
        modules.push(...files.map(f => f.path.replace(/\.py$/, '').replace(/\//g, '.').replace(/\.__init__$/, '')));
      }
      for (const url of m.files) core.mount(py, [{ path: url.slice(url.lastIndexOf('/') + 1), bytes: await bytesOf(url) }]);
      for (const name of m.imports) py.pyimport(name);
      postMessage({ type: 'progress', step: 'sources', ms: performance.now() - t, bytes: transferred(), detail: String(modules.length), modules });
      postMessage({ type: 'ready', python: py.runPython('import sys; sys.version.split()[0]'), pyodide: py.version, ms: performance.now() - t0 });
    } else if (m.type === 'call') {
      if (!py) throw Error('运行时尚未就绪');
      const t = performance.now();
      const value = core.call(py, m.module, m.fn, m.args);
      postMessage({ type: 'result', id: m.id, value, ms: performance.now() - t });
    }
  } catch (e) {
    postMessage({ type: 'error', id: m.id ?? null, message: lastLine(e) });
  }
};
```

`src/scripts/py-runtime.ts`：

```ts
/** Page-side client of public/assets/py-worker.js: one worker per page, a boot timeout, and calls matched by id. */
export interface PyProgress { step: 'runtime' | 'packages' | 'sources'; ms: number; bytes: number; detail: string; modules?: string[] }
export interface PyReady { python: string; pyodide: string; ms: number }
export interface PyRuntimeOptions {
  bundles: string[]; files: string[]; imports: string[];
  workerUrl?: string; timeoutMs?: number; callTimeoutMs?: number;
  makeWorker?: (url: string) => Worker;
}
export interface PyRuntime {
  boot(onProgress: (p: PyProgress) => void): Promise<PyReady>;
  call<T>(module: string, fn: string, args: unknown[]): Promise<{ value: T; ms: number }>;
  dispose(): void;
}

export const BOOT_TIMEOUT = 60_000;

export function createPyRuntime(o: PyRuntimeOptions): PyRuntime {
  let worker: Worker | null = null, seq = 0;
  let booting: { resolve: (r: PyReady) => void; reject: (e: Error) => void; progress: (p: PyProgress) => void } | null = null;
  const pending = new Map<number, { resolve: (v: { value: any; ms: number }) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  const fail = (e: Error) => {
    booting?.reject(e); booting = null;
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(e); }
    pending.clear();
  };
  const onMessage = ({ data: m }: MessageEvent) => {
    if (m.type === 'progress') booting?.progress(m);
    else if (m.type === 'ready') { booting?.resolve(m); booting = null; }
    else if ((m.type === 'result' || m.type === 'error') && m.id != null) {
      const p = pending.get(m.id);
      if (!p) return;
      pending.delete(m.id); clearTimeout(p.timer);
      if (m.type === 'result') p.resolve({ value: m.value, ms: m.ms }); else p.reject(new Error(m.message));
    } else if (m.type === 'error') fail(new Error(m.message));
  };
  return {
    boot(progress) {
      return new Promise<PyReady>((resolve, reject) => {
        const timer = setTimeout(() => { fail(new Error('timeout')); worker?.terminate(); worker = null; }, o.timeoutMs ?? BOOT_TIMEOUT);
        booting = { progress, resolve: r => { clearTimeout(timer); resolve(r); }, reject: e => { clearTimeout(timer); reject(e); } };
        try {
          if (typeof WebAssembly !== 'object') throw new Error('no-webassembly');
          worker = (o.makeWorker ?? (u => new Worker(u)))(o.workerUrl ?? '/assets/py-worker.js');
          worker.onmessage = onMessage;
          worker.onerror = e => { e.preventDefault(); fail(new Error(e.message || 'worker-error')); };
          worker.postMessage({ type: 'boot', bundles: o.bundles, files: o.files, imports: o.imports });
        } catch (e) { fail(e instanceof Error ? e : new Error(String(e))); }
      });
    },
    call<T>(module: string, fn: string, args: unknown[]) {
      return new Promise<{ value: T; ms: number }>((resolve, reject) => {
        if (!worker) { reject(new Error('not-ready')); return; }
        const id = ++seq;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout')); }, o.callTimeoutMs ?? 15_000);
        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ type: 'call', id, module, fn, args });
      });
    },
    dispose() { fail(new Error('disposed')); worker?.terminate(); worker = null; },
  };
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/py-runtime.test.ts`
Expected: PASS（5 个测试）。

- [ ] **Step 5: 提交**

```bash
git add public/assets/py-worker.js src/scripts/py-runtime.ts tests/unit/py-runtime.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Python runtime worker and page client: measured progress, boot timeout, calls matched by id" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 引擎结果 → 电路模型

**Files:**
- Create: `src/scripts/career-wire.ts`
- Test: `tests/unit/career-wire.test.ts`

**Interfaces:**
- Consumes: 桥接返回的 JSON（Task 2 的 `run` 输出）。
- Produces:
  - `EngineResult`（桥接输出的类型）；`Tone = 'ok' | 'gap' | 'unknown' | 'fail' | 'none'`；`CircuitNode { id; label; sub; tone }`；`Wire { req: number; target: string | null; tone }`；`CircuitModel { reqs; targets; wires; materials: string[]; packError: string | null }`；`CapStep { line; mode: 'flash' | 'on'; tone: '' | 'red' | 'soft' }`。
  - `wire(r: EngineResult, lang: Lang): CircuitModel`；`capInfo(r): { slam: boolean; tone: 'fail' | 'unknown' | null; steps: CapStep[] }`；`observation(r, lang): string`。
  - 规则：要求 i 的状态 = 同名硬门槛的状态（passes→ok，fails→fail，unknown→unknown）；没有硬门槛时取要求原文里出现的技能证据中最差的（gap > unknown > ok）；两者都没有 → none（未评估）。连线目标 = 硬门槛与技能证据里的事实 id（去重、只保留档案中存在的）；没有事实时，education 连学历、availability 连到岗天数或实习时长（原文含"月"）；再没有 → 空目标（短桩）。右列固定先放三个档案字段，再放全部经历事实；节点被任一 ok 连线到达即点亮，否则取到达它的最差状态。

- [ ] **Step 1: 写失败的测试**

`tests/unit/career-wire.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { wire, capInfo, observation, type EngineResult } from '../../src/scripts/career-wire';

const SQL = { id: 'fact-sql-analysis', statement: '使用 SQL 清洗业务数据并输出周度分析。', status: 'documented' };
const TAB = { id: 'fact-pending-tableau', statement: '独立搭建 Tableau 仪表盘。', status: 'needs_confirmation' };
const REQS = [
  { text: '本科及以上学历', category: 'education', hardGate: true },
  { text: '每周至少 4 天', category: 'availability', hardGate: true },
  { text: '连续实习 3 个月', category: 'availability', hardGate: true },
  { text: '必须熟练使用 SQL', category: 'tool', hardGate: true },
  { text: 'Tableau 经验加分', category: 'experience', hardGate: false },
];
const gate = (requirement: string, status: 'passes' | 'fails' | 'unknown') => ({ requirement, status, factIds: [] as string[], explanation: '' });
function demo(days: number | null, over: Partial<EngineResult> = {}): EngineResult {
  return {
    ms: 1.5, job: { company: '示例科技（虚构）', title: 'AI运营实习生' }, requirements: REQS,
    evidence: [{ skill: 'SQL', status: 'matched', factIds: ['fact-sql-analysis'] }, { skill: 'Tableau', status: 'gap', factIds: [] }],
    gates: [gate('本科及以上学历', 'passes'), gate('每周至少 4 天', days === 3 ? 'fails' : days === null ? 'unknown' : 'passes'),
      gate('连续实习 3 个月', 'passes'), gate('必须熟练使用 SQL', 'unknown')],
    profile: { education: '本科 · 信息管理', days, months: 6, facts: [SQL, TAB] },
    score: days === 3 ? 59 : days === null ? 83 : 84, raw: days === 3 ? 81 : days === null ? 83 : 86, cap: days === 3 ? 59 : 84,
    recommendation: 'recommend', pack: { factIds: ['fact-sql-analysis'], blocks: 5 }, packError: null, ...over,
  };
}
const JD2: EngineResult = {
  ms: 2.1, job: { company: '未识别', title: '数据分析实习生' },
  requirements: [
    { text: '熟练使用 Python 和 SQL', category: 'tool', hardGate: false },
    { text: '每周至少 3 天', category: 'availability', hardGate: true },
    { text: '有数据可视化经验（Power BI 或 Tableau）', category: 'experience', hardGate: false },
    { text: '良好的沟通能力', category: 'other', hardGate: false },
  ],
  evidence: [
    { skill: 'SQL', status: 'matched', factIds: ['fact-sql-analysis'] }, { skill: 'Python', status: 'matched', factIds: ['fact-visitor-1'] },
    { skill: 'Power BI', status: 'gap', factIds: [] }, { skill: 'Tableau', status: 'gap', factIds: [] }, { skill: '数据可视化', status: 'gap', factIds: [] },
  ],
  gates: [gate('每周至少 3 天', 'passes')],
  profile: { education: '本科 · 信息管理', days: 4, months: 6, facts: [SQL, TAB, { id: 'fact-visitor-1', statement: '用 Python 和 pandas 做过销售数据清洗与可视化', status: 'user_confirmed' }] },
  score: 68, raw: 68, cap: null, recommendation: 'try', pack: { factIds: ['fact-sql-analysis', 'fact-visitor-1'], blocks: 4 }, packError: null,
};
const pairs = (r: EngineResult) => wire(r, 'zh').wires.map(w => [w.req, w.target, w.tone]);
const REFUSED = { pack: null, packError: 'Profile 中没有可用于投递材料的已确认事实。' };

describe('career wire', () => {
  it('connects each requirement to what the engine actually used', () => {
    expect(pairs(demo(4))).toEqual([
      [0, 'field-education', 'ok'], [1, 'field-days', 'ok'], [2, 'field-months', 'ok'], [3, 'fact-sql-analysis', 'unknown'], [4, null, 'gap'],
    ]);
  });
  it('three days turns the availability wire into a failure and relabels the field', () => {
    const m = wire(demo(3), 'zh');
    expect(m.wires[1]).toEqual({ req: 1, target: 'field-days', tone: 'fail' });
    expect(m.targets.find(t => t.id === 'field-days')!.label).toBe('每周可到岗 3 天');
    expect(m.reqs[1].sub).toBe('硬门槛 · 不满足');
  });
  it('a skill requirement can reach several facts; an unassessed one gets a dim stub', () => {
    expect(pairs(JD2)).toEqual([
      [0, 'fact-sql-analysis', 'ok'], [0, 'fact-visitor-1', 'ok'], [1, 'field-days', 'ok'], [2, null, 'gap'], [3, null, 'none'],
    ]);
    expect(wire(JD2, 'zh').reqs[3].sub).toBe('未评估');
    expect(wire(JD2, 'zh').reqs[0].sub).toBe('技能 · SQL · Python');
  });
  it('lists the three profile fields first, then every fact, lit when an ok wire reaches it', () => {
    const t = wire(demo(4), 'zh').targets;
    expect(t.map(x => x.id)).toEqual(['field-education', 'field-days', 'field-months', 'fact-sql-analysis', 'fact-pending-tableau']);
    expect(t.map(x => x.tone)).toEqual(['ok', 'ok', 'ok', 'unknown', 'none']);
    expect(t[3]).toMatchObject({ label: '使用 SQL 清洗业务数据并输出周度分析', sub: 'fact-sql-analysis · 有文档依据' });
  });
  it('materials keep only facts that exist; a refusal is carried through', () => {
    expect(wire(demo(4), 'zh').materials).toEqual(['fact-sql-analysis']);
    const refused = wire(demo(4, REFUSED), 'zh');
    expect(refused.materials).toEqual([]);
    expect(refused.packError).toContain('没有可用于投递材料');
  });
  it('capInfo says when the score slams and which source lines ran', () => {
    expect(capInfo(demo(4))).toEqual({ slam: true, tone: 'unknown', steps: [
      { line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'on', tone: 'soft' }, { line: 700, mode: 'on', tone: 'soft' }, { line: 702, mode: 'on', tone: '' }] });
    expect(capInfo(demo(3)).steps.map(s => [s.line, s.tone])).toEqual([[697, 'red'], [698, 'red'], [702, '']]);
    expect(capInfo(demo(3)).tone).toBe('fail');
    expect(capInfo(demo(null)).slam).toBe(false);
    expect(capInfo(JD2)).toEqual({ slam: false, tone: null, steps: [{ line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'flash', tone: '' }, { line: 702, mode: 'on', tone: '' }] });
  });
  it('observation explains the cap and the materials from the result', () => {
    expect(observation(demo(3), 'zh')).toBe('硬门槛不满足（每周至少 4 天），原始分 81，总分被限制在 59。1 条已确认的事实进入材料。');
    expect(observation(demo(4), 'zh')).toBe('有待确认的硬门槛（必须熟练使用 SQL），原始分 86，总分被限制在 84。1 条已确认的事实进入材料。');
    expect(observation(demo(null), 'zh')).toBe('有待确认的硬门槛（每周至少 4 天、必须熟练使用 SQL），原始分 83 未超过上限 84。1 条已确认的事实进入材料。');
    expect(observation(JD2, 'zh')).toBe('没有不满足或待确认的硬门槛，总分 68 不设上限。2 条已确认的事实进入材料。');
    expect(observation(demo(4, REFUSED), 'zh')).toContain('引擎未生成材料：Profile 中没有可用于投递材料的已确认事实。');
  });
  it('English labels', () => {
    const m = wire(demo(4), 'en');
    expect(m.reqs[0].sub).toBe('Hard requirement · Meets');
    expect(m.targets[1].label).toBe('4 days a week');
    expect(observation(demo(3), 'en')).toBe('Hard requirement not met (每周至少 4 天): raw 81, capped at 59. 1 confirmed fact enters the materials.');
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/career-wire.test.ts`
Expected: FAIL（找不到模块）。

- [ ] **Step 3: 实现**

`src/scripts/career-wire.ts`：

```ts
import type { Lang } from '../i18n';

/** What career_bridge.run returns (see public/assets/py/career_bridge.py). */
export interface EngineResult {
  ms: number;
  job: { company: string; title: string };
  requirements: { text: string; category: string; hardGate: boolean }[];
  evidence: { skill: string; status: 'matched' | 'gap' | 'unknown'; factIds: string[] }[];
  gates: { requirement: string; status: 'passes' | 'fails' | 'unknown'; factIds: string[]; explanation: string }[];
  profile: { education: string | null; days: number | null; months: number | null; facts: { id: string; statement: string; status: string }[] };
  score: number; raw: number; cap: number | null; recommendation: string;
  pack: { factIds: string[]; blocks: number } | null;
  packError: string | null;
}
export type Tone = 'ok' | 'gap' | 'unknown' | 'fail' | 'none';
export interface CircuitNode { id: string; label: string; sub: string; tone: Tone }
export interface Wire { req: number; target: string | null; tone: Tone }
export interface CircuitModel { reqs: CircuitNode[]; targets: CircuitNode[]; wires: Wire[]; materials: string[]; packError: string | null }
export interface CapStep { line: number; mode: 'flash' | 'on'; tone: '' | 'red' | 'soft' }

type Names = (g: string[], raw: number, cap: number | null) => string;
const L: Record<Lang, {
  gate: string; skill: string; none: string; self: string; status: Record<string, string>; fact: Record<string, string>;
  noEducation: string; days: (d: number) => string; noDays: string; months: (m: number) => string; noMonths: string;
  fail: Names; capped: Names; under: Names; free: (raw: number) => string; pack: (n: number) => string; noPack: (e: string) => string; sep: string;
}> = {
  zh: {
    gate: '硬门槛', skill: '技能', none: '未评估', self: '本人填写',
    status: { passes: '满足', fails: '不满足', unknown: '待确认' },
    fact: { documented: '有文档依据', user_confirmed: '已确认', needs_confirmation: '待确认' },
    noEducation: '学历未填写', days: d => `每周可到岗 ${d} 天`, noDays: '到岗天数未填写',
    months: m => `可连续实习 ${m} 个月`, noMonths: '实习时长未填写',
    fail: (g, raw, cap) => `硬门槛不满足（${g.join('、')}），原始分 ${raw}，总分被限制在 ${cap}。`,
    capped: (g, raw, cap) => `有待确认的硬门槛（${g.join('、')}），原始分 ${raw}，总分被限制在 ${cap}。`,
    under: (g, raw, cap) => `有待确认的硬门槛（${g.join('、')}），原始分 ${raw} 未超过上限 ${cap}。`,
    free: raw => `没有不满足或待确认的硬门槛，总分 ${raw} 不设上限。`,
    pack: n => `${n} 条已确认的事实进入材料。`, noPack: e => `引擎未生成材料：${e}`, sep: '',
  },
  en: {
    gate: 'Hard requirement', skill: 'Skill', none: 'Not assessed', self: 'entered by the candidate',
    status: { passes: 'Meets', fails: 'Does not meet', unknown: 'To confirm' },
    fact: { documented: 'Documented', user_confirmed: 'Confirmed', needs_confirmation: 'To confirm' },
    noEducation: 'Education not given', days: d => `${d} days a week`, noDays: 'Availability not given',
    months: m => `${m} months of internship`, noMonths: 'Internship length not given',
    fail: (g, raw, cap) => `Hard requirement not met (${g.join(', ')}): raw ${raw}, capped at ${cap}.`,
    capped: (g, raw, cap) => `Hard requirement to confirm (${g.join(', ')}): raw ${raw}, capped at ${cap}.`,
    under: (g, raw, cap) => `Hard requirement to confirm (${g.join(', ')}): raw ${raw} stays under the ${cap} cap.`,
    free: raw => `No hard requirement failed or unconfirmed: ${raw}, uncapped.`,
    pack: n => `${n} confirmed fact${n === 1 ? '' : 's'} ${n === 1 ? 'enters' : 'enter'} the materials.`,
    noPack: e => `The engine produced no materials: ${e}`, sep: ' ',
  },
};
const GATE_TONE: Record<string, Tone> = { passes: 'ok', fails: 'fail', unknown: 'unknown' };
const EVIDENCE_TONE: Record<string, Tone> = { matched: 'ok', gap: 'gap', unknown: 'unknown' };
const WORST: Tone[] = ['fail', 'gap', 'unknown', 'ok'];
const worst = (tones: Tone[]): Tone => WORST.find(t => tones.includes(t)) ?? 'none';

export function wire(r: EngineResult, lang: Lang): CircuitModel {
  const T = L[lang], facts = r.profile.facts, known = new Set(facts.map(f => f.id));
  const targets: CircuitNode[] = [
    { id: 'field-education', label: r.profile.education ?? T.noEducation, sub: `education · ${T.self}`, tone: 'none' },
    { id: 'field-days', label: r.profile.days ? T.days(r.profile.days) : T.noDays, sub: `availability · ${T.self}`, tone: 'none' },
    { id: 'field-months', label: r.profile.months ? T.months(r.profile.months) : T.noMonths, sub: `availability · ${T.self}`, tone: 'none' },
    ...facts.map(f => ({ id: f.id, label: f.statement.replace(/。$/, ''), sub: `${f.id} · ${T.fact[f.status] ?? f.status}`, tone: 'none' as Tone })),
  ];
  const reqs: CircuitNode[] = [], wires: Wire[] = [];
  r.requirements.forEach((q, i) => {
    const gate = r.gates.find(g => g.requirement === q.text);
    const text = q.text.toLowerCase();
    const evidence = r.evidence.filter(e => text.includes(e.skill.toLowerCase()));
    const tone: Tone = gate ? GATE_TONE[gate.status] : evidence.length ? worst(evidence.map(e => EVIDENCE_TONE[e.status])) : 'none';
    const sub = gate ? `${T.gate} · ${T.status[gate.status]}` : evidence.length ? `${T.skill} · ${evidence.map(e => e.skill).join(' · ')}` : T.none;
    reqs.push({ id: `req-${i + 1}`, label: q.text, sub, tone });
    const ids = [...new Set([...(gate?.factIds ?? []), ...evidence.flatMap(e => e.factIds)])].filter(id => known.has(id));
    const field = q.category === 'education' ? 'field-education' : q.category === 'availability' ? (q.text.includes('月') ? 'field-months' : 'field-days') : null;
    for (const target of ids.length ? ids : [field]) wires.push({ req: i, target, tone });
  });
  for (const t of targets) {
    const tones = wires.filter(w => w.target === t.id).map(w => w.tone);
    t.tone = tones.includes('ok') ? 'ok' : worst(tones);
  }
  return { reqs, targets, wires, materials: (r.pack?.factIds ?? []).filter(id => known.has(id)), packError: r.packError };
}

export function capInfo(r: EngineResult): { slam: boolean; tone: 'fail' | 'unknown' | null; steps: CapStep[] } {
  const fails = r.gates.some(g => g.status === 'fails'), unknown = r.gates.some(g => g.status === 'unknown');
  const steps: CapStep[] = fails
    ? [{ line: 697, mode: 'on', tone: 'red' }, { line: 698, mode: 'on', tone: 'red' }]
    : unknown
      ? [{ line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'on', tone: 'soft' }, { line: 700, mode: 'on', tone: 'soft' }]
      : [{ line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'flash', tone: '' }];
  return { slam: r.cap !== null && r.raw > r.cap, tone: fails ? 'fail' : unknown ? 'unknown' : null, steps: [...steps, { line: 702, mode: 'on', tone: '' }] };
}

export function observation(r: EngineResult, lang: Lang): string {
  const T = L[lang];
  const failed = r.gates.filter(g => g.status === 'fails').map(g => g.requirement);
  const unknown = r.gates.filter(g => g.status === 'unknown').map(g => g.requirement);
  const head = failed.length ? T.fail(failed, r.raw, r.cap)
    : unknown.length ? (r.cap !== null && r.raw > r.cap ? T.capped(unknown, r.raw, r.cap) : T.under(unknown, r.raw, r.cap))
      : T.free(r.raw);
  return head + T.sep + (r.pack ? T.pack(r.pack.factIds.length) : T.noPack(r.packError ?? ''));
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/career-wire.test.ts`
Expected: PASS（8 个测试）。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/career-wire.ts tests/unit/career-wire.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Career wire: map the engine's gates, skill evidence and profile onto a circuit model" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 证据电路的排布与渲染

**Files:**
- Create: `src/scripts/career-circuit.ts`
- Test: `tests/unit/career-circuit.test.ts`

**Interfaces:**
- Consumes: `CircuitModel`、`Tone`（Task 4）。
- Produces:
  - 纯函数 `layoutWide(m: CircuitModel): Placed`（viewBox 宽 1000；左列要求 x=20、右列目标 x=718、宽 262；目标行错开半行；每条连线独占一个竖向走线道 x ∈ [330, 670]；行数 > 8 时行距 70、否则 96）与 `layoutStack(m, width): Placed`（窄屏：要求卡片占满宽度，其连接的目标卡片缩进 28px 排在下方，竖线相连；无目标时画短桩）。
  - `Placed { mode: 'wide' | 'stack'; width; height; reqBoxes: Box[]; targetBoxes: { id; box: Box; group: number | null }[]; traces: Trace[]; material: Box; materialTraces: { d; target }[] }`；`Trace { d; req; target: string | null; tone: Tone; vias: [number, number][]; mark: [number, number] | null; stub: boolean }`；`Box { x; y; w; h }`。
  - `createCircuit(host: HTMLElement, lang: Lang): CircuitView`；`CircuitView { render(m, { draw, hideReqs }): Promise<void>; reveal(req): void; reqRect(req): DOMRect | null; charge(target): Promise<void>; flowMaterials(): Promise<void>; burst(): void; destroy(): void }`。宿主宽度 ≥ 720px 用宽排布，否则用窄排布。

- [ ] **Step 1: 写失败的测试**

`tests/unit/career-circuit.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { layoutWide, layoutStack } from '../../src/scripts/career-circuit';
import type { CircuitModel, Tone } from '../../src/scripts/career-wire';

const node = (id: string, tone: Tone = 'ok') => ({ id, label: id, sub: '', tone });
function model(reqs: number, wires: [number, string | null, Tone][], targets = ['field-education', 'field-days', 'field-months', 'fact-a', 'fact-b'], materials = ['fact-a']): CircuitModel {
  return { reqs: Array.from({ length: reqs }, (_, i) => node(`req-${i + 1}`)), targets: targets.map(t => node(t)), wires: wires.map(([req, target, tone]) => ({ req, target, tone })), materials, packError: null };
}
const DEMO = model(5, [[0, 'field-education', 'ok'], [1, 'field-days', 'fail'], [2, 'field-months', 'ok'], [3, 'fact-a', 'unknown'], [4, null, 'gap']]);
const nums = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);
const overlaps = (a: { y: number; h: number }, b: { y: number; h: number }) => a.y < b.y + b.h && b.y < a.y + a.h;

describe('wide circuit layout', () => {
  const p = layoutWide(DEMO);
  it('each trace leaves its requirement at the centre of the right edge and enters its target at the left edge', () => {
    for (const t of p.traces) {
      const r = p.reqBoxes[t.req], n = nums(t.d);
      expect(n.slice(0, 2)).toEqual([282, r.y + r.h / 2]);
      if (t.target) {
        const b = p.targetBoxes.find(x => x.id === t.target)!.box;
        expect(t.d.endsWith('H 718')).toBe(true);
        expect(nums(t.d).at(-2)).toBe(b.y + b.h / 2);
      }
    }
  });
  it('gives every trace its own vertical lane', () => {
    const lanes = p.traces.map(t => nums(t.d)[2]);
    expect(new Set(lanes).size).toBe(lanes.length);
    for (const x of lanes) { expect(x).toBeGreaterThanOrEqual(320); expect(x).toBeLessThanOrEqual(680); }
  });
  it('a missing target becomes a marked stub; failures and gaps carry a mark, ok does not', () => {
    const stub = p.traces[4];
    expect(stub).toMatchObject({ target: null, stub: true, tone: 'gap' });
    expect(stub.mark).not.toBeNull();
    expect(p.traces[0].mark).toBeNull();
    expect(p.traces[1].mark).not.toBeNull();
  });
  it('boxes in a column never overlap and targets sit half a row lower', () => {
    for (let i = 1; i < p.reqBoxes.length; i++) expect(overlaps(p.reqBoxes[i - 1], p.reqBoxes[i])).toBe(false);
    for (let i = 1; i < p.targetBoxes.length; i++) expect(overlaps(p.targetBoxes[i - 1].box, p.targetBoxes[i].box)).toBe(false);
    expect(p.targetBoxes[0].box.y - p.reqBoxes[0].y).toBe(48);
  });
  it('materials traces run from each fact into the materials box, which fits inside the height', () => {
    expect(p.materialTraces).toHaveLength(1);
    expect(nums(p.materialTraces[0].d).at(-2)).toBe(p.material.y + p.material.h / 2);
    expect(p.material.y + p.material.h).toBeLessThanOrEqual(p.height);
  });
  it('compresses rows when there are more than eight', () => {
    const big = layoutWide(model(10, Array.from({ length: 10 }, (_, i) => [i, null, 'none'] as [number, null, Tone])));
    expect(big.reqBoxes[1].y - big.reqBoxes[0].y).toBe(70);
  });
});

describe('stacked circuit layout for narrow screens', () => {
  const p = layoutStack(DEMO, 358);
  it('keeps every box inside the width', () => {
    for (const b of [...p.reqBoxes, ...p.targetBoxes.map(t => t.box), p.material]) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(358);
    }
  });
  it('places each target under its requirement and never overlaps', () => {
    const all = [...p.reqBoxes, ...p.targetBoxes.map(t => t.box), p.material].sort((a, b) => a.y - b.y);
    for (let i = 1; i < all.length; i++) expect(overlaps(all[i - 1], all[i])).toBe(false);
    for (const t of p.targetBoxes) expect(t.box.y).toBeGreaterThan(p.reqBoxes[t.group!].y);
  });
  it('draws a stub for a requirement without a target', () => {
    expect(p.traces.find(t => t.req === 4)).toMatchObject({ target: null, stub: true });
    expect(p.height).toBeGreaterThan(p.material.y);
  });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx vitest run tests/unit/career-circuit.test.ts`
Expected: FAIL（找不到模块）。

- [ ] **Step 3: 实现**

`src/scripts/career-circuit.ts`：

```ts
import type { CircuitModel, Tone } from './career-wire';
import type { Lang } from '../i18n';

export interface Box { x: number; y: number; w: number; h: number }
export interface Trace { d: string; req: number; target: string | null; tone: Tone; vias: [number, number][]; mark: [number, number] | null; stub: boolean }
export interface Placed {
  mode: 'wide' | 'stack'; width: number; height: number;
  reqBoxes: Box[]; targetBoxes: { id: string; box: Box; group: number | null }[];
  traces: Trace[]; material: Box; materialTraces: { d: string; target: string }[];
}

const LEFT = 20, RIGHT = 718, COL = 262, TOP = 50, LANE_FROM = 330, LANE_TO = 670;

function orthogonal(y1: number, y2: number, xb: number): string {
  if (Math.abs(y1 - y2) < 1) return `M ${LEFT + COL} ${y1} H ${RIGHT}`;
  const r = 10, s = y2 > y1 ? 1 : -1;
  return `M ${LEFT + COL} ${y1} H ${xb - r} Q ${xb} ${y1} ${xb} ${y1 + s * r} V ${y2 - s * r} Q ${xb} ${y2} ${xb + r} ${y2} H ${RIGHT}`;
}

export function layoutWide(m: CircuitModel): Placed {
  const row = Math.max(m.reqs.length, m.targets.length) > 8 ? 70 : 96, h = row > 80 ? 60 : 50;
  const reqBoxes = m.reqs.map((_, i) => ({ x: LEFT, y: TOP + i * row, w: COL, h }));
  const targetBoxes = m.targets.map((t, j) => ({ id: t.id, box: { x: RIGHT, y: TOP + row / 2 + j * row, w: COL, h }, group: null }));
  const gap = m.wires.length > 1 ? Math.min(46, (LANE_TO - LANE_FROM) / (m.wires.length - 1)) : 0;
  const traces: Trace[] = m.wires.map((w, k) => {
    const a = reqBoxes[w.req], y1 = a.y + h / 2, xb = LANE_FROM + k * gap;
    const b = w.target ? targetBoxes.find(t => t.id === w.target)?.box : undefined;
    if (!b) return { d: `M ${LEFT + COL} ${y1} H ${xb}`, req: w.req, target: null, tone: w.tone, vias: [], mark: [xb, y1], stub: true };
    const y2 = b.y + h / 2, straight = Math.abs(y1 - y2) < 1;
    return {
      d: orthogonal(y1, y2, xb), req: w.req, target: w.target, tone: w.tone, stub: false,
      vias: straight ? [] : [[xb, y1], [xb, y2]],
      mark: w.tone === 'ok' ? null : straight ? [(LEFT + COL + RIGHT) / 2, y1] : [xb, (y1 + y2) / 2],
    };
  });
  const last = targetBoxes.at(-1)?.box;
  const material = { x: RIGHT, y: (last ? last.y + last.h : TOP) + 24, w: COL, h: 46 };
  const materialTraces = m.materials.map((id, k) => {
    const b = targetBoxes.find(t => t.id === id)!.box, x = RIGHT + COL + 6 + (k % 3) * 5;
    return { d: `M ${RIGHT + COL} ${b.y + h / 2} H ${x} V ${material.y + material.h / 2} H ${RIGHT + COL}`, target: id };
  });
  const bottom = Math.max(reqBoxes.length ? reqBoxes[reqBoxes.length - 1].y + h : 0, material.y + material.h);
  return { mode: 'wide', width: 1000, height: bottom + 24, reqBoxes, targetBoxes, traces, material, materialTraces };
}

export function layoutStack(m: CircuitModel, width: number): Placed {
  const h = 54, indent = 28, spine = 14;
  let y = 8;
  const reqBoxes: Box[] = [], targetBoxes: Placed['targetBoxes'] = [], traces: Trace[] = [];
  m.reqs.forEach((_, i) => {
    const a = { x: 0, y, w: width, h };
    reqBoxes.push(a); y += h + 10;
    for (const w of m.wires.filter(x => x.req === i)) {
      if (!w.target) {
        traces.push({ d: `M ${spine} ${a.y + h} V ${y + 12}`, req: i, target: null, tone: w.tone, vias: [], mark: [spine, y + 12], stub: true });
        y += 28; continue;
      }
      const b = { x: indent, y, w: width - indent, h }, cy = b.y + h / 2;
      targetBoxes.push({ id: w.target, box: b, group: i });
      traces.push({ d: `M ${spine} ${a.y + h} V ${cy} H ${indent}`, req: i, target: w.target, tone: w.tone, vias: [[spine, cy]], mark: w.tone === 'ok' ? null : [spine, (a.y + h + cy) / 2], stub: false });
      y += h + 10;
    }
    y += 14;
  });
  const material = { x: 0, y, w: width, h: 46 };
  return { mode: 'stack', width, height: y + 46 + 8, reqBoxes, targetBoxes, traces, material, materialTraces: [] };
}

/* ---------------- rendering ---------------- */

export interface CircuitView {
  render(m: CircuitModel, o: { draw: boolean; hideReqs: boolean }): Promise<void>;
  reveal(req: number): void;
  reqRect(req: number): DOMRect | null;
  charge(target: string): Promise<void>;
  flowMaterials(): Promise<void>;
  burst(): void;
  destroy(): void;
}

const NS = 'http://www.w3.org/2000/svg';
const MARK: Record<Tone, string> = { ok: '', fail: '×', gap: '×', unknown: '?', none: '∅' };
const TEXT = { zh: { reqs: 'JD 要求 · structure_job_locally()', facts: '候选人 · profile', material: '材料草稿', pack: 'build_application_pack()' },
  en: { reqs: 'JD requirements · structure_job_locally()', facts: 'Candidate · profile', material: 'Draft materials', pack: 'build_application_pack()' } };

interface Sampled { pts: Float32Array; len: number; tone: Tone; u: Float32Array; v: Float32Array; surge: number; material: boolean }

export function createCircuit(host: HTMLElement, lang: Lang): CircuitView {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('role', 'img');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.append(svg, canvas);
  const g2 = canvas.getContext('2d')!;
  const css = getComputedStyle(host);
  const color = (name: string, a: number) => {
    const hex = css.getPropertyValue(name).trim().replace('#', '');
    const n = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };
  let placed: Placed | null = null, model: CircuitModel | null = null;
  let sampled: Sampled[] = [], sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  let arcs: [number, number][][] = [], arcAt = 0, sparkAt = 0, raf = 0, last = 0, visible = false, run = 0;
  const reqEls: SVGGElement[] = [], targetEls = new Map<string, SVGGElement>();
  let materialLayer: SVGGElement | null = null, materialBox: SVGGElement | null = null;

  const mk = <K extends keyof SVGElementTagNameMap>(tag: K, a: Record<string, string | number>, parent: Element) => {
    const e = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
    for (const k in a) e.setAttribute(k, String(a[k]));
    parent.append(e); return e;
  };
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  function box(parent: Element, b: Box, label: string, sub: string, cls: string) {
    const g = mk('g', { class: `cnode ${cls}`, transform: `translate(${b.x},${b.y})` }, parent);
    mk('rect', { class: 'cbox', width: b.w, height: b.h, rx: 2 }, g);
    const chars = Math.floor((b.w - 28) / 15);
    const t = mk('text', { x: 14, y: b.h > 50 ? 25 : 21, class: 'cnt' }, g); t.textContent = clip(label, chars);
    mk('title', {}, g).textContent = `${label} — ${sub}`;
    const s = mk('text', { x: 14, y: b.h > 50 ? 45 : 39, class: 'cns' }, g); s.textContent = clip(sub, Math.floor((b.w - 28) / 7.4));
    return g;
  }
  function sample(p: SVGPathElement, tone: Tone, material: boolean): Sampled {
    const len = p.getTotalLength(), pts: number[] = [];
    for (let d = 0; d <= len; d += 3) { const q = p.getPointAtLength(d); pts.push(q.x, q.y); }
    const n = tone === 'ok' ? 12 : tone === 'unknown' ? 2 : 0, u = new Float32Array(n), v = new Float32Array(n);
    for (let k = 0; k < n; k++) { u[k] = Math.random(); v[k] = tone === 'ok' ? 110 + Math.random() * 110 : 38; }
    return { pts: new Float32Array(pts), len, tone, u, v, surge: 0, material };
  }
  const at = (s: Sampled, u: number): [number, number] => {
    const n = s.pts.length / 2, i = Math.max(0, Math.min(n - 1, Math.round(u * (n - 1))));
    return [s.pts[2 * i], s.pts[2 * i + 1]];
  };
  function drawIn(p: SVGPathElement, delay: number) {
    const len = p.getTotalLength();
    p.style.strokeDasharray = String(len); p.style.strokeDashoffset = String(len);
    return p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 460, delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished
      .then(() => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.getAnimations().forEach(a => a.cancel()); });
  }
  function burstAt(x: number, y: number, n: number) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 180;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, life: .35 + Math.random() * .4 });
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (!visible || !placed) return;
    const rect = svg.getBoundingClientRect(), dpr = devicePixelRatio || 1, cw = Math.round(rect.width), ch = Math.round(rect.height);
    if (!cw) return;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) { canvas.width = cw * dpr; canvas.height = ch * dpr; canvas.style.width = `${cw}px`; canvas.style.height = `${ch}px`; }
    const s = cw / placed.width;
    g2.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    g2.clearRect(0, 0, placed.width, placed.height);
    g2.globalCompositeOperation = 'lighter';
    for (const tr of sampled) {
      if (tr.tone === 'gap') {
        if (Math.random() < .05) {
          const u0 = Math.random() * .8; g2.strokeStyle = color('--red', .35); g2.lineWidth = 3; g2.beginPath();
          for (let u = u0; u < u0 + .12; u += .02) { const [x, y] = at(tr, u); u === u0 ? g2.moveTo(x, y) : g2.lineTo(x, y); }
          g2.stroke();
        }
        continue;
      }
      const boost = tr.surge && now - tr.surge < 1300 ? 3.2 : 1, dim = tr.tone === 'unknown';
      for (let k = 0; k < tr.u.length; k++) {
        tr.u[k] = (tr.u[k] + tr.v[k] * boost * dt / tr.len) % 1;
        const [hx, hy] = at(tr, tr.u[k]);
        g2.fillStyle = color(dim ? '--night-mute' : boost > 1 ? '--red' : '--night-fg', dim ? .06 : boost > 1 ? .16 : .1);
        g2.beginPath(); g2.arc(hx, hy, 6.5, 0, 6.3); g2.fill();
        for (let j = 0; j < 7; j++) {
          const u = tr.u[k] - j * 6 / tr.len; if (u < 0) break;
          const [x, y] = at(tr, u);
          g2.fillStyle = color(dim ? '--night-mute' : '--night-fg', (dim ? .3 : boost > 1 ? .6 : .55) * (1 - j / 7));
          g2.beginPath(); g2.arc(x, y, 2.7 - j * .28, 0, 6.3); g2.fill();
        }
      }
    }
    const fails = sampled.filter(t => t.tone === 'fail');
    if (fails.length) {
      if (now - arcAt > 60) {
        arcAt = now; arcs = [];
        for (const f of fails) for (let a = 0; a < 2; a++) {
          const c = .5 + (Math.random() - .5) * .3, [x1, y1] = at(f, Math.max(0, c - .07)), [x2, y2] = at(f, Math.min(1, c + .07));
          const pts: [number, number][] = [[x1, y1]], nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny) || 1;
          for (let k = 1; k < 10; k++) { const t = k / 10, j = (Math.random() - .5) * 18; pts.push([x1 + (x2 - x1) * t + nx / nl * j, y1 + (y2 - y1) * t + ny / nl * j]); }
          pts.push([x2, y2]); arcs.push(pts);
        }
      }
      for (const pts of arcs) for (const [w, c] of [[2.4, color('--red', .5)], [.9, color('--night-fg', .4)]] as [number, string][]) {
        g2.strokeStyle = c; g2.lineWidth = w; g2.beginPath();
        pts.forEach(([x, y], k) => (k ? g2.lineTo(x, y) : g2.moveTo(x, y))); g2.stroke();
      }
      if (now - sparkAt > 480) { sparkAt = now; for (const f of fails) { const [x, y] = at(f, .5); burstAt(x, y, 6); } }
    }
    for (let k = sparks.length - 1; k >= 0; k--) {
      const p = sparks[k]; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) { sparks.splice(k, 1); continue; }
      g2.strokeStyle = color('--red', Math.min(.7, p.life)); g2.lineWidth = 1.3;
      g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(p.x - p.vx * .025, p.y - p.vy * .025); g2.stroke();
    }
    g2.globalCompositeOperation = 'source-over';
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(host);
  if (!reduced) raf = requestAnimationFrame(frame);

  return {
    async render(m, o) {
      const id = ++run;
      model = m;
      placed = host.clientWidth >= 720 ? layoutWide(m) : layoutStack(m, Math.max(280, host.clientWidth));
      svg.replaceChildren(); sampled = []; sparks = []; reqEls.length = 0; targetEls.clear();
      svg.setAttribute('viewBox', `0 0 ${placed.width} ${placed.height}`);
      svg.setAttribute('aria-label', m.reqs.map((q, i) => `${q.label}: ${q.sub}`).join('；'));
      if (placed.mode === 'wide') {
        mk('text', { x: LEFT, y: 30, class: 'chd' }, svg).textContent = TEXT[lang].reqs;
        mk('text', { x: RIGHT, y: 30, class: 'chd' }, svg).textContent = TEXT[lang].facts;
      }
      const traceLayer = mk('g', {}, svg);
      materialLayer = mk('g', {}, svg);
      placed.reqBoxes.forEach((b, i) => reqEls.push(box(svg, b, m.reqs[i].label, m.reqs[i].sub, `tone-${m.reqs[i].tone}${o.hideReqs ? ' hide' : ''}`)));
      for (const t of placed.targetBoxes) {
        const n = m.targets.find(x => x.id === t.id)!;
        const g = box(svg, t.box, n.label, n.sub, `tone-${n.tone}`);
        if (!targetEls.has(t.id)) targetEls.set(t.id, g);
      }
      materialBox = box(svg, placed.material, TEXT[lang].material, m.packError ?? TEXT[lang].pack, m.packError ? 'tone-fail' : 'tone-none');
      const paths = placed.traces.map((t, k) => {
        const p = mk('path', { d: t.d, class: `ctr tone-${t.tone}` }, traceLayer);
        return { p, t, delay: 320 + k * 110 };
      });
      await Promise.all(paths.map(async ({ p, t, delay }) => {
        if (o.draw && !reduced) await drawIn(p, delay);
        if (id !== run) return;
        for (const [x, y] of t.vias) mk('circle', { cx: x, cy: y, r: 3.5, class: 'cvia' }, traceLayer);
        if (t.mark && MARK[t.tone]) mk('text', { x: t.mark[0] - 5, y: t.mark[1] + 5, class: 'cmark' }, traceLayer).textContent = MARK[t.tone];
        sampled.push(sample(p, t.tone, false));
        if (t.tone === 'fail' && t.mark) burstAt(t.mark[0], t.mark[1], 24);
      }));
    },
    reveal(req) { const g = reqEls[req]; if (!g) return; g.classList.remove('hide'); g.classList.add('flash'); },
    reqRect(req) { return reqEls[req]?.getBoundingClientRect() ?? null; },
    async charge(target) {
      const g = targetEls.get(target); if (!g || reduced) return;
      const rect = g.querySelector('rect')!;
      const c = mk('rect', { class: 'ccharge', width: rect.getAttribute('width')!, height: rect.getAttribute('height')! }, g);
      await c.animate([{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: .8 }, { transform: 'scaleX(1)', opacity: 0 }],
        { duration: 680, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished;
      c.remove();
    },
    async flowMaterials() {
      if (!placed || !model || !materialLayer) return;
      const id = run;
      await Promise.all(placed.materialTraces.map(async (t, k) => {
        const p = mk('path', { d: t.d, class: 'ctr tone-ok' }, materialLayer!);
        if (!reduced) await drawIn(p, k * 160);
        if (id !== run) return;
        const s = sample(p, 'ok', true); s.surge = performance.now(); sampled.push(s);
      }));
      if (id === run) materialBox?.classList.add(model.packError ? 'tone-fail' : 'tone-ok', 'flash');
    },
    burst() { for (const t of placed?.traces ?? []) if (t.tone === 'fail' && t.mark) burstAt(t.mark[0], t.mark[1], 40); },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); svg.remove(); canvas.remove(); },
  };
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `npx vitest run tests/unit/career-circuit.test.ts`
Expected: PASS（9 个测试）。渲染部分由 Task 6 的端到端测试覆盖。

- [ ] **Step 5: 提交**

```bash
git add src/scripts/career-circuit.ts tests/unit/career-circuit.test.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Evidence circuit: wide and stacked layouts, SVG traces and canvas electrons, arcs and sparks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 在线引擎演示区（页面、控制器、代码实况、降级）

**Files:**
- Create: `src/components/CodeLive.astro`, `src/scripts/code-live.ts`, `src/components/CareerLive.astro`, `src/scripts/career-live.ts`, `tests/e2e/career-live.spec.ts`
- Modify: `src/scripts/career-live-text.ts`（追加文案）, `src/scripts/odometer-dom.ts`（`spinOdometer` 加可选时长）, `src/views/CareerView.astro`, `tests/e2e/career.spec.ts`（回放测试走 `?engine=replay`）

**Interfaces:**
- Consumes: `createPyRuntime`（Task 3）、`wire` / `capInfo` / `observation` / `EngineResult`（Task 4）、`createCircuit`（Task 5）、`DEMO_JD`（Task 2）、`spinOdometer` / `setOdometerText`（`odometer-dom.ts`）。
- Produces:
  - `spinOdometer(el, final, delay = 0, from?, ms = 850)`：`ms` 为第一位滚轮的时长，后续每位按比例延长（850 时与原来完全一致）。
  - `CodeLive.astro` props `{ id, file, first, last, title, meta, label }`，构建时读取 `file` 的第 first–last 行；`codeLive(el): { flash(n, tone?), on(n, tone?), reset(), count(n, text), heat(n, h) }`，tone 为 `'' | 'red' | 'soft'`。
  - `initCareerLive(root: HTMLElement)`；页面结构 id：`cl-stage`、`cl-chip`（就绪后加 `live` 类）、`cl-status`、`cl-lat`、`cl-start`、`cl-start-btn`、`cl-boot`、`cl-jd-view`、`cl-jd-input`、`cl-jd-toggle`、`cl-cand`、`cl-days`、`cl-facts`、`cl-add-*`、`cl-rerun`、`cl-circuit`、`cl-score`、`cl-raw`、`cl-ceil`、`cl-facts-n`、`cl-code`、`cl-obs`、`cl-toggle-replay`、`cl-replay`、`cl-fallback-note`、`cl-retry`。
  - URL 参数 `?engine=replay`：不启动引擎，直接显示六组回放（也用于回放的端到端测试）。

- [ ] **Step 1: 写失败的端到端测试**

`tests/e2e/career-live.spec.ts`：

```ts
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { noHorizontalOverflow } from './helpers';

const PATH = '/projects/ai-career/';
const JD2 = '岗位：数据分析实习生\n岗位要求：\n- 熟练使用 Python 和 SQL；\n- 每周至少 3 天；\n- 有数据可视化经验（Power BI 或 Tableau）；\n- 良好的沟通能力。';
test.describe.configure({ timeout: 120_000 });

async function live(page: Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('#cl-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cl-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cl-score')).toHaveText('84', { timeout: 20_000 });
  await expect(page.locator('#cl-obs')).not.toBeEmpty({ timeout: 10_000 });
}
const desktopOnly = (isMobile: boolean) => test.skip(isMobile, 'desktop flow; phones are covered by the start-button test');

test('the real engine boots in the browser and caps the demo at 84', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#cl-chip')).toHaveText(/^PYTHON 3\.13\.\d+ · WEBASSEMBLY$/);
  await expect(page.locator('#cl-raw')).toHaveText('原始分 86');
  await expect(page.locator('#cl-ceil')).toContainText('上限 84');
  await expect(page.locator('#cl-code .cl-l[data-n="700"]')).toHaveClass(/on/);
  await expect(page.locator('#cl-obs')).toHaveText('有待确认的硬门槛（必须熟练使用 SQL），原始分 86，总分被限制在 84。1 条已确认的事实进入材料。');
  await expect(page.locator('#cl-boot-log')).toContainText('MB');
  await expect(page.locator('#cl-lat')).toContainText('ms');
});

test('the live source lines are the vendored engine, verbatim', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(PATH);
  const file = readFileSync('public/assets/py/job-agent/4397ded/job_agent/services/local_matcher.py', 'utf8').replace(/\r\n/g, '\n').split('\n').slice(696, 702);
  await expect(page.locator('#cl-code .cl-src')).toHaveText(file);
});

test('three days slams the score down to 59 and lights line 698', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-days').selectOption('3');
  await expect(page.locator('#cl-score')).toHaveText('59', { timeout: 15_000 });
  await expect(page.locator('#cl-raw')).toHaveText('原始分 81');
  await expect(page.locator('#cl-code .cl-l[data-n="698"]')).toHaveClass(/on/);
  await expect(page.locator('#cl-obs')).toContainText('硬门槛不满足（每周至少 4 天）');
});

test('confirming Tableau puts a second fact into the materials', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-facts select[data-id="fact-pending-tableau"]').selectOption('user_confirmed');
  await expect(page.locator('#cl-facts-n')).toHaveText('2', { timeout: 15_000 });
  await expect(page.locator('#cl-raw')).toHaveText('原始分 95');
  await expect(page.locator('#cl-score')).toHaveText('84');
});

test('a pasted job description is parsed by the engine', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill(JD2);
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-obs')).toContainText('不设上限', { timeout: 20_000 });
  await expect(page.locator('#cl-circuit svg')).toHaveAttribute('aria-label', /良好的沟通能力: 未评估/);
  await expect(page.locator('#cl-jd-view mark')).toHaveCount(4);
});

test('an added fact is part of the next result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('.cl-add summary').click();
  await page.locator('#cl-add-text').fill('用 Python 做过销售数据清洗');
  await page.locator('#cl-add-skills').fill('Python, pandas');
  await page.locator('#cl-add-status').selectOption('user_confirmed');
  await page.locator('#cl-add-btn').click();
  await expect(page.locator('#cl-facts li')).toHaveCount(3, { timeout: 15_000 });
  await expect(page.locator('#cl-circuit')).toContainText('用 Python 做过销售数据清洗');
});

test('removing the only confirmed fact shows the engine\'s refusal', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-facts li').first().getByRole('button').click();
  await expect(page.locator('#cl-obs')).toContainText('引擎未生成材料：Profile 中没有可用于投递材料的已确认事实。', { timeout: 15_000 });
  await expect(page.locator('#cl-score')).toHaveText('45');
  await expect(page.locator('#cl-facts-n')).toHaveText('0');
});

test('an empty job description explains itself and keeps the last result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill('   ');
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-status')).toHaveText('职位描述不能为空。');
  await expect(page.locator('#cl-score')).toHaveText('84');
});

test('rapid edits land on the last input', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  for (const v of ['3', '4', '3', '5', '3']) await page.locator('#cl-days').selectOption(v);
  await expect(page.locator('#cl-score')).toHaveText('59', { timeout: 15_000 });
  await page.waitForTimeout(2500);
  await expect(page.locator('#cl-score')).toHaveText('59');
  await expect(page.locator('#cl-obs')).toContainText('原始分 81');
});

test('blocked runtime falls back to the replay, with a retry', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.route('**/pyodide.asm.wasm', r => r.abort());
  await page.goto(PATH);
  await page.locator('#cl-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cl-replay')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#cl-fallback-note')).toBeVisible();
  await expect(page.locator('#cl-retry')).toBeVisible();
  await expect(page.locator('#agent-results')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#cl-stage')).toBeHidden();
});

test('the replay can be chosen by hand and left again', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(`${PATH}?engine=replay`);
  await expect(page.locator('#cl-replay')).toBeVisible();
  await expect(page.locator('#cl-fallback-note')).toBeHidden();
  await page.locator('#cl-toggle-replay').click();
  await expect(page.locator('#cl-stage')).toBeVisible();
  await expect(page.locator('#cl-chip')).toHaveClass(/live/, { timeout: 90_000 });
});

test('reduced motion shows the final state without the boot show', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await live(page);
  await expect(page.locator('#cl-boot')).toBeHidden();
  await expect(page.locator('#cl-code .cl-l[data-n="702"] .cl-cnt')).toHaveText('score = 84');
});

test('English page: English interface, Chinese engine data', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page, '/en');
  await expect(page.locator('#cl-title')).toHaveText('Live engine: job agent matching');
  await expect(page.locator('#cl-obs')).toHaveText('Hard requirement to confirm (必须熟练使用 SQL): raw 86, capped at 84. 1 confirmed fact enters the materials.');
  await expect(page.locator('#cl-raw')).toHaveText('raw 86');
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('phones wait for the start button before downloading the runtime', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone flow');
  const wasm: string[] = [];
  page.on('request', r => { if (r.url().endsWith('.wasm')) wasm.push(r.url()); });
  await page.goto(PATH);
  await page.locator('#cl-stage').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  expect(wasm).toEqual([]);
  await expect(page.locator('#cl-start-btn')).toContainText('MB');
  await page.locator('#cl-start-btn').click();
  await expect(page.locator('#cl-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cl-score')).toHaveText('84', { timeout: 20_000 });
  expect(await noHorizontalOverflow(page)).toBe(true);
});
```

`tests/e2e/career.spec.ts`：把 `const PATH = '/projects/ai-career/';` 改为 `const PATH = '/projects/ai-career/?engine=replay';`（六组回放的测试不变，走手动选择回放的路径）。

Run: `npx playwright test tests/e2e/career-live.spec.ts --project=desktop`
Expected: FAIL（`#cl-stage` 不存在）。

- [ ] **Step 2: 计数器时长参数**

`src/scripts/odometer-dom.ts`：把签名改为 `export function spinOdometer(el: HTMLElement, final: string, delay = 0, from?: string, ms = 850): void {`，并把动画参数里的 `{ duration: 850 + d * 160, delay: delay + d * 40, ...` 改为 `{ duration: ms + d * (ms * 160 / 850), delay: delay + d * 40, ...`（默认值时与原来完全相同）。

Run: `npx playwright test tests/e2e/data-motion.spec.ts tests/e2e/insights.spec.ts --project=desktop`
Expected: PASS（原有计数器行为不变）。

- [ ] **Step 3: 代码实况组件**

`src/components/CodeLive.astro`：

```astro
---
import { readFileSync } from 'node:fs';
interface Props { id: string; file: string; first: number; last: number; title: string; meta: string; label: string }
const { id, file, first, last, title, meta, label } = Astro.props;
// Read at build time from the real file, so the page can only ever show the source verbatim.
const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n').slice(first - 1, last);
---
<div class="codelive" id={id} role="region" aria-label={label} tabindex="0">
  <div class="cl-h"><span>{title}</span><em>{meta}</em></div>
  {lines.map((s, i) => (
    <div class="cl-l" data-n={first + i}><span class="cl-no" aria-hidden="true">{first + i}</span><span class="cl-src">{s}</span><span class="cl-cnt"></span></div>
  ))}
</div>
<style>
  .codelive { font: 12.5px/1.8 Consolas, 'Cascadia Mono', monospace; color: var(--night-mute); border: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); padding: 6px 0 8px; overflow-x: auto; }
  .cl-h { display: flex; justify-content: space-between; gap: 12px; padding: 0 12px 6px; margin-bottom: 4px; color: var(--night-fg); font-size: 11.5px; border-bottom: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); }
  .cl-h em { font-style: normal; color: var(--night-mute); }
  .cl-l { position: relative; display: grid; grid-template-columns: 46px max-content auto; white-space: pre; padding-right: 12px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--red) calc(var(--heat, 0) * 38%), transparent), transparent 75%); }
  .cl-no { text-align: right; padding-right: 12px; color: color-mix(in srgb, var(--night-mute) 60%, transparent); }
  .cl-src, .cl-cnt { position: relative; z-index: 1; }
  .cl-cnt { padding-left: 16px; color: var(--night-fg); }
  .cl-l.on { color: var(--night-fg); }
  .cl-l.on.red { background: color-mix(in srgb, var(--red) 26%, transparent); }
  .cl-l.on.soft { background: color-mix(in srgb, var(--night-fg) 10%, transparent); }
  .cl-l.flash::before { content: ''; position: absolute; inset: 0; background: color-mix(in srgb, var(--night-fg) 16%, transparent); animation: cl-flash .9s ease-out forwards; }
  .cl-l.flash.red::before { background: color-mix(in srgb, var(--red) 34%, transparent); }
  @keyframes cl-flash { from { opacity: 1; } to { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .cl-l.flash::before { animation: none; opacity: 0; } }
</style>
```

`src/scripts/code-live.ts`：

```ts
/** Highlights lines of a CodeLive block as the program they show runs. */
export type CodeTone = '' | 'red' | 'soft';
export interface CodeLive {
  flash(n: number, tone?: CodeTone): void;
  on(n: number, tone?: CodeTone): void;
  reset(): void;
  count(n: number, text: string): void;
  heat(n: number, h: number): void;
}

export function codeLive(el: HTMLElement): CodeLive {
  const line = (n: number) => el.querySelector<HTMLElement>(`.cl-l[data-n="${n}"]`);
  return {
    flash(n, tone = '') {
      const l = line(n); if (!l) return;
      l.classList.remove('flash'); void l.offsetWidth; l.classList.add('flash');
      if (tone) l.classList.add(tone);
    },
    on(n, tone = '') { const l = line(n); if (!l) return; l.classList.add('on'); if (tone) l.classList.add(tone); },
    reset() {
      el.querySelectorAll<HTMLElement>('.cl-l').forEach(l => {
        l.className = 'cl-l'; l.style.removeProperty('--heat'); l.querySelector('.cl-cnt')!.textContent = '';
      });
    },
    count(n, text) { const c = line(n)?.querySelector('.cl-cnt'); if (c) c.textContent = text; },
    heat(n, h) { line(n)?.style.setProperty('--heat', String(Math.max(0, Math.min(1, h)))); },
  };
}
```

- [ ] **Step 4: 文案**

在 `src/scripts/career-live-text.ts` 文件开头加一行 `import type { Lang } from '../i18n';`，并在 `DEMO_JD` 之后追加：

```ts
/** The fictional candidate's facts before the first run (the engine reports them after every run). */
export const DEMO_FACTS = [
  { id: 'fact-sql-analysis', statement: '使用 SQL 清洗业务数据并输出周度分析。', status: 'documented' },
  { id: 'fact-pending-tableau', statement: '独立搭建 Tableau 仪表盘。', status: 'needs_confirmation' },
];

type Step = 'runtime' | 'packages' | 'sources';
export interface LiveText {
  title: string; meta: string; intro: string; chip: (py: string) => string; start: (mb: string) => string; startNote: string;
  booting: string; bootLine: (step: Step, t: number, mb: number, ms: number, detail: string) => string; bootReady: (py: string, s: number) => string;
  jdLabel: string; jdEdit: string; jdDone: string; jdHint: string; candLabel: string; daysLabel: string; daysUnknown: string; day: (d: number) => string;
  statusLabel: string; statusOptions: [string, string][]; documented: string; remove: string;
  addLabel: string; addStatement: string; addSkills: string; addBtn: string; addEmpty: string;
  recompute: string; computing: string; engineError: (m: string) => string;
  score: string; raw: (n: number) => string; facts: string; ceilFail: (cap: number) => string; ceilUnknown: (cap: number) => string; latency: (ms: number) => string;
  codeTitle: string; codeMeta: string; codeLabel: string;
  fallback: string; retry: string; toReplay: string; toLive: string; privacy: string;
}

export const LIVE_TEXT: Record<Lang, LiveText> = {
  zh: {
    title: '在线引擎：求职 Agent 匹配', meta: '公开版 0.8.5 · 4397ded · 在你的浏览器里运行',
    intro: '职位描述和虚构候选人都可以改；改完由真实的 Python 引擎当场重算——它通过 WebAssembly 在你的浏览器里运行，输入不会离开你的电脑。分数先滚到引擎算出的原始分，再被引擎自己的封顶规则压下来；右下角"代码实况"亮起的就是刚刚执行的那几行源码。',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `启动引擎（约 ${mb} MB）`,
    startNote: '手机或省流量模式下，点了才会下载运行时。', booting: '正在启动引擎…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `下载并启动 Python 运行时 · Python ${detail}`, packages: `安装 ${detail}`, sources: `导入 job_agent · ${detail} 个模块` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `引擎就绪 · Python ${py} · ${s.toFixed(2)} s`,
    jdLabel: '职位描述', jdEdit: '编辑职位描述', jdDone: '完成并计算', jdHint: '可以粘贴任意职位描述；引擎按中文职位描述设计。',
    candLabel: '虚构候选人', daysLabel: '每周可到岗', daysUnknown: '未填写', day: d => `${d} 天`,
    statusLabel: '确认状态', statusOptions: [['user_confirmed', '已确认'], ['needs_confirmation', '待确认']], documented: '有文档依据', remove: '删除',
    addLabel: '新增一条经历', addStatement: '经历（不超过 200 字）', addSkills: '涉及的技能，用逗号分隔', addBtn: '加入', addEmpty: '请先写下这条经历。',
    recompute: '重新计算', computing: '引擎计算中…', engineError: m => `引擎出错：${m}`,
    score: '规则匹配分 / 100', raw: n => `原始分 ${n}`, facts: '入选材料的事实',
    ceilFail: cap => `硬门槛不满足 · 上限 ${cap}`, ceilUnknown: cap => `存在待确认门槛 · 上限 ${cap}`, latency: ms => `引擎计算 ${ms.toFixed(1)} ms`,
    codeTitle: 'local_matcher.py · match_job_locally()', codeMeta: '代码实况 · 源码第 697–702 行', codeLabel: '代码实况：引擎封顶逻辑的源码',
    fallback: '在线引擎暂时无法启动（浏览器不支持、网络中断或超时）。下面是同一引擎预先算好的六组回放。', retry: '重新启动引擎',
    toReplay: '改看六组固定回放', toLive: '回到在线引擎', privacy: '全部计算在你的浏览器里完成，不上传任何内容。',
  },
  en: {
    title: 'Live engine: job agent matching', meta: 'Public build 0.8.5 · 4397ded · running in your browser',
    intro: 'Edit the job description and the fictional candidate; the real Python engine recomputes on the spot — it runs in your browser through WebAssembly, and nothing you type leaves your computer. The score rolls to the raw total the engine computed, then the engine\'s own cap rule presses it down; the "live source" panel lights the lines that just ran.',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `Start the engine (about ${mb} MB)`,
    startNote: 'On phones and in data-saver mode the runtime downloads only when you tap.', booting: 'Starting the engine…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `Download and start the Python runtime · Python ${detail}`, packages: `Install ${detail}`, sources: `Import job_agent · ${detail} modules` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `Engine ready · Python ${py} · ${s.toFixed(2)} s`,
    jdLabel: 'Job description', jdEdit: 'Edit the job description', jdDone: 'Done — compute', jdHint: 'Paste any job description. The engine is designed for Chinese postings; the demo data stays in Chinese.',
    candLabel: 'Fictional candidate', daysLabel: 'Days available per week', daysUnknown: 'Not given', day: d => `${d} days`,
    statusLabel: 'Confirmation', statusOptions: [['user_confirmed', 'Confirmed'], ['needs_confirmation', 'To confirm']], documented: 'Documented', remove: 'Remove',
    addLabel: 'Add an experience', addStatement: 'Experience (up to 200 characters)', addSkills: 'Skills involved, comma-separated', addBtn: 'Add', addEmpty: 'Write the experience first.',
    recompute: 'Recompute', computing: 'Engine computing…', engineError: m => `Engine error: ${m}`,
    score: 'Rule-based match / 100', raw: n => `raw ${n}`, facts: 'Facts used in the materials',
    ceilFail: cap => `Hard requirement failed · cap ${cap}`, ceilUnknown: cap => `Hard requirement to confirm · cap ${cap}`, latency: ms => `engine ${ms.toFixed(1)} ms`,
    codeTitle: 'local_matcher.py · match_job_locally()', codeMeta: 'Live source · lines 697–702', codeLabel: 'Live source: the engine\'s cap logic',
    fallback: 'The live engine could not start (unsupported browser, network error or timeout). Below are six replays computed by the same engine.', retry: 'Start the engine again',
    toReplay: 'Show the six fixed replays instead', toLive: 'Back to the live engine', privacy: 'Everything is computed in your browser; nothing is uploaded.',
  },
};
```

- [ ] **Step 5: 控制器**

`src/scripts/career-live.ts`：

```ts
import { createPyRuntime, type PyRuntime, type PyProgress, type PyReady } from './py-runtime';
import { wire, capInfo, observation, type EngineResult } from './career-wire';
import { createCircuit } from './career-circuit';
import { codeLive } from './code-live';
import { spinOdometer, setOdometerText } from './odometer-dom';
import { LIVE_TEXT, DEMO_JD, DEMO_FACTS } from './career-live-text';

type Status = 'user_confirmed' | 'needs_confirmation';
interface Candidate { days: number | null; statuses: Record<string, Status>; removed: string[]; added: { statement: string; skills: string[]; status: Status }[] }
type Answer = EngineResult | { error: string };
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));

export function initCareerLive(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh', T = LIVE_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const light = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData || matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  const stage = $('cl-stage'), code = codeLive($('cl-code')), circuit = createCircuit($('cl-circuit'), lang);
  const cand: Candidate = { days: 4, statuses: {}, removed: [], added: [] };
  let jd = DEMO_JD, runtime: PyRuntime | null = null, ready = false, seq = 0, debounce = 0, charge: string | null = null, factKey = '';

  const say = (text: string, bad = false) => { const s = $('cl-status'); s.textContent = text; s.classList.toggle('bad', bad); };
  const lock = (on: boolean) => {
    $<HTMLFieldSetElement>('cl-cand').disabled = on;
    $<HTMLButtonElement>('cl-rerun').disabled = on;
    $<HTMLButtonElement>('cl-jd-toggle').disabled = on;
  };

  /* ---------- replay fallback ---------- */
  function showReplay(failed: boolean) {
    stage.hidden = true; $('cl-replay').hidden = false; $('cl-fallback-note').hidden = !failed;
    $('cl-toggle-replay').textContent = T.toLive;
  }
  function showLive() {
    stage.hidden = false; $('cl-replay').hidden = true; $('cl-toggle-replay').textContent = T.toReplay;
    if (!runtime) { if (light) $('cl-start').hidden = false; else void start(); }
  }
  $('cl-toggle-replay').onclick = () => (stage.hidden ? showLive() : showReplay(false));
  $('cl-retry').onclick = () => { runtime?.dispose(); runtime = null; ready = false; showLive(); };

  /* ---------- boot: every number shown is measured ---------- */
  function bootView() {
    const box = $('cl-boot'), log = $('cl-boot-log'), hex = $('cl-boot-hex'), mods = $('cl-boot-mods');
    box.hidden = reduced; log.replaceChildren(); mods.replaceChildren(); hex.textContent = '';
    const t0 = performance.now(), rows: string[] = [];
    let addr = 0, modules: string[] = [];
    const hx = reduced ? 0 : window.setInterval(() => {
      const bytes = Array.from({ length: 16 }, () => ((Math.random() * 256) | 0).toString(16).padStart(2, '0'));
      rows.push(`${addr.toString(16).padStart(8, '0')}  ${bytes.slice(0, 8).join(' ')}  ${bytes.slice(8).join(' ')}`);
      addr += 0x10000; if (rows.length > 24) rows.shift(); hex.textContent = rows.join('\n');
    }, 35);
    return {
      step(p: PyProgress) {
        const d = document.createElement('div');
        d.textContent = T.bootLine(p.step, (performance.now() - t0) / 1000, p.bytes / 1048576, p.ms, p.detail);
        log.append(d);
        if (p.modules) modules = p.modules;
      },
      async done(r: PyReady) {
        clearInterval(hx);
        if (!reduced) {
          for (const m of modules) { const c = document.createElement('span'); c.className = 'cl-mod'; c.textContent = m; mods.append(c); }
          const chips = [...mods.children] as HTMLElement[];
          for (const c of chips) { c.classList.add('in'); await wait(30); }
          await wait(250);
          const t = $('cl-chip').getBoundingClientRect(), tx = t.left + t.width / 2, ty = t.top + t.height / 2;
          await Promise.all(chips.map((c, i) => {
            const b = c.getBoundingClientRect();
            return c.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${tx - b.left - b.width / 2}px, ${ty - b.top - b.height / 2}px) scale(.15)`, opacity: 0 }],
              { duration: 500, delay: i * 20, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
          }));
        }
        const d = document.createElement('div'); d.className = 'ready'; d.textContent = T.bootReady(r.python, r.ms / 1000); log.append(d);
        if (!reduced) await wait(300);
        box.hidden = true;
      },
      hide() { clearInterval(hx); box.hidden = true; },
    };
  }

  async function start() {
    $('cl-start').hidden = true; lock(true); say(T.booting);
    runtime = createPyRuntime({ bundles: ['/assets/py/job-agent/4397ded/'], files: ['/assets/py/career_bridge.py'], imports: ['career_bridge'] });
    const view = bootView();
    try {
      const r = await runtime.boot(p => view.step(p));
      await view.done(r);
      ready = true; lock(false); say('');
      const chip = $('cl-chip'); chip.textContent = T.chip(r.python); chip.classList.add('live');
      await compute(true);
    } catch (e) {
      console.error(e); view.hide(); runtime?.dispose(); runtime = null; ready = false; say('');
      showReplay(true);
    }
  }

  /* ---------- one engine call ---------- */
  async function compute(parse: boolean) {
    if (!ready || !runtime) return;
    const id = ++seq;
    say(T.computing);
    let answer: Answer;
    try { answer = (await runtime.call<Answer>('career_bridge', 'run', [jd, cand])).value; }
    catch (e) { if (id === seq) say(T.engineError((e as Error).message), true); return; }
    if (id !== seq) return;                      // a newer edit has already asked again
    if ('error' in answer) { say(answer.error, true); return; }
    say('');
    await show(answer, parse, id);
  }
  const schedule = () => { clearTimeout(debounce); debounce = window.setTimeout(() => void compute(false), 600); };

  function markJD(r: EngineResult) {
    let html = '', pos = 0, from = 0;
    r.requirements.forEach((q, i) => {
      const at = jd.indexOf(q.text, from);
      if (at < 0) return;
      html += esc(jd.slice(pos, at)) + `<mark data-i="${i}">${esc(q.text)}</mark>`;
      pos = from = at + q.text.length;
    });
    $('cl-jd-view').innerHTML = html + esc(jd.slice(pos));
  }

  async function flyReqs(r: EngineResult, id: number) {
    const view = $('cl-jd-view'), scan = $('cl-scan'), panel = view.getBoundingClientRect();
    scan.hidden = false;
    void scan.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${view.clientHeight}px)` }], { duration: 1000, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
      .finished.then(() => { scan.hidden = true; });
    await Promise.all(r.requirements.map(async (q, i) => {
      await wait(180 + i * 150);
      if (id !== seq) return;
      const mark = view.querySelector<HTMLElement>(`mark[data-i="${i}"]`);
      mark?.classList.add('hit');
      const from = mark?.getBoundingClientRect() ?? panel, to = circuit.reqRect(i);
      if (!to) { circuit.reveal(i); return; }
      const f = document.createElement('div'); f.className = 'cl-fly'; f.textContent = q.text;
      f.style.left = `${from.left}px`; f.style.top = `${from.top}px`; root.append(f);
      const dx = to.left + 12 - from.left, dy = to.top + 10 - from.top;
      await f.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px)`, opacity: .95, offset: .85 }, { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }],
        { duration: 620, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
      f.remove(); circuit.reveal(i);
    }));
  }

  function ceiling(tone: 'fail' | 'unknown', cap: number) {
    const c = $('cl-ceil');
    $('cl-ceil-t').textContent = tone === 'fail' ? T.ceilFail(cap) : T.ceilUnknown(cap);
    c.className = `cl-ceil ${tone === 'fail' ? 'fail' : 'soft'}`; void c.offsetWidth; c.classList.add('down');
  }
  function slamFx(tone: 'fail' | 'unknown') {
    stage.animate([{ transform: 'none' }, { transform: 'translate(-7px,2px)' }, { transform: 'translate(6px,-2px)' }, { transform: 'translate(-4px,1px)' }, { transform: 'translate(2px,0)' }, { transform: 'none' }], { duration: 380 });
    const v = $('cl-vig'); v.className = `cl-vig ${tone === 'fail' ? 'fail' : 'soft'}`;
    v.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 0 }], { duration: 700 });
    const s = $('cl-score'); s.classList.remove('squash'); void s.offsetWidth; s.classList.add('squash');
    if (tone === 'fail') circuit.burst();
  }

  async function score(r: EngineResult, id: number) {
    const cap = capInfo(r), el = $('cl-score'), before = el.textContent || '0';
    const last = cap.steps[cap.steps.length - 1], branch = cap.steps.slice(0, -1);
    const apply = (s: (typeof cap.steps)[number]) => (s.mode === 'on' ? code.on(s.line, s.tone) : code.flash(s.line, s.tone));
    $('cl-raw').textContent = T.raw(r.raw);
    if (reduced) {
      setOdometerText(el, String(r.score));
      if (cap.slam && cap.tone) ceiling(cap.tone, r.cap!);
      branch.forEach(apply); code.on(last.line); code.count(last.line, `score = ${r.score}`);
      return;
    }
    code.flash(697);
    if (cap.slam && cap.tone) {
      spinOdometer(el, String(r.raw), 0, before);
      await wait(1100); if (id !== seq) return;
      ceiling(cap.tone, r.cap!); slamFx(cap.tone);
      branch.forEach(apply);
      code.count(cap.tone === 'fail' ? 698 : 700, `→ ${r.cap}`);
      spinOdometer(el, String(r.score), 0, String(r.raw), 260);
      await wait(420);
    } else {
      branch.forEach(apply);
      spinOdometer(el, String(r.score), 0, before);
      await wait(1100);
    }
    if (id !== seq) return;
    code.on(last.line); code.count(last.line, `score = ${r.score}`);
  }

  async function show(r: EngineResult, parse: boolean, id: number) {
    const model = wire(r, lang);
    $('cl-lat').textContent = T.latency(r.ms);
    renderFacts(r.profile.facts);
    markJD(r);
    code.reset(); $('cl-ceil').className = 'cl-ceil'; $('cl-obs').textContent = '';
    const fly = parse && !reduced;
    const drawn = circuit.render(model, { draw: !reduced, hideReqs: fly });
    if (fly) await flyReqs(r, id);
    await drawn; if (id !== seq) return;
    if (charge && model.materials.includes(charge)) await circuit.charge(charge);
    charge = null;
    await circuit.flowMaterials(); if (id !== seq) return;
    const n = $('cl-facts-n');
    if (reduced) setOdometerText(n, String(model.materials.length)); else spinOdometer(n, String(model.materials.length), 0, n.textContent || '0');
    await score(r, id); if (id !== seq) return;
    $('cl-obs').textContent = observation(r, lang);
  }

  /* ---------- the candidate editor ---------- */
  function renderFacts(facts: { id: string; statement: string; status: string }[]) {
    const list = $('cl-facts'), key = facts.map(f => f.id).join('|');
    if (key === factKey) {
      for (const f of facts) { const s = list.querySelector<HTMLSelectElement>(`select[data-id="${f.id}"]`); if (s && s.value !== f.status) s.value = f.status; }
      return;
    }
    factKey = key;
    list.replaceChildren(...facts.map(f => {
      const li = document.createElement('li');
      const text = document.createElement('span'); text.className = 'cl-fact'; text.textContent = f.statement;
      const idEl = document.createElement('small'); idEl.textContent = f.id;
      li.append(text, idEl);
      const visitor = f.id.startsWith('fact-visitor-'), index = Number(f.id.split('-').pop()) - 1;
      if (f.status === 'documented') {
        const b = document.createElement('span'); b.className = 'cl-doc'; b.textContent = T.documented; li.append(b);
      } else {
        const s = document.createElement('select'); s.dataset.id = f.id; s.setAttribute('aria-label', `${T.statusLabel}：${f.statement}`);
        for (const [v, t] of T.statusOptions) s.add(new Option(t, v, false, v === f.status));
        s.onchange = () => {
          const v = s.value as Status;
          if (visitor) cand.added[index].status = v; else cand.statuses[f.id] = v;
          if (v === 'user_confirmed') charge = f.id;
          schedule();
        };
        li.append(s);
      }
      const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'cl-link'; rm.textContent = T.remove;
      rm.setAttribute('aria-label', `${T.remove}：${f.statement}`);
      rm.onclick = () => { if (visitor) cand.added.splice(index, 1); else cand.removed.push(f.id); factKey = ''; schedule(); };
      li.append(rm);
      return li;
    }));
  }
  $<HTMLSelectElement>('cl-days').onchange = e => { const v = (e.target as HTMLSelectElement).value; cand.days = v ? Number(v) : null; schedule(); };
  $('cl-add-btn').onclick = () => {
    const text = $<HTMLInputElement>('cl-add-text'), skills = $<HTMLInputElement>('cl-add-skills');
    const statement = text.value.trim();
    if (!statement) { say(T.addEmpty, true); return; }
    cand.added.push({ statement, skills: skills.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean), status: $<HTMLSelectElement>('cl-add-status').value as Status });
    text.value = ''; skills.value = ''; factKey = ''; schedule();
  };
  $('cl-jd-toggle').onclick = () => {
    const input = $<HTMLTextAreaElement>('cl-jd-input'), view = $('cl-jd-view'), btn = $('cl-jd-toggle');
    if (input.hidden) { input.value = jd; input.hidden = false; view.hidden = true; btn.textContent = T.jdDone; input.focus(); return; }
    jd = input.value; input.hidden = true; view.hidden = false; view.textContent = jd; btn.textContent = T.jdEdit;
    void compute(true);
  };
  $('cl-rerun').onclick = () => void compute(true);

  /* ---------- when to start ---------- */
  renderFacts(DEMO_FACTS);
  lock(true);
  if (new URLSearchParams(location.search).get('engine') === 'replay') { showReplay(false); return; }
  if (light) { $('cl-start').hidden = false; $('cl-start-btn').onclick = () => void start(); return; }
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); void start(); } }, { threshold: 0.2 });
  io.observe(stage);
}
```

- [ ] **Step 6: 演示区组件并接入页面**

`src/components/CareerLive.astro`：

```astro
---
import { readFileSync } from 'node:fs';
import CodeLive from './CodeLive.astro';
import CareerDemo from './CareerDemo.astro';
import { LIVE_TEXT, DEMO_JD } from '../scripts/career-live-text';
import type { Lang } from '../i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const T = LIVE_TEXT[lang];
const bytes = (p: string) => JSON.parse(readFileSync(p, 'utf8')).files.reduce((s: number, f: { bytes: number }) => s + f.bytes, 0);
const mb = ((bytes('public/assets/vendor/pyodide/0.29.5/manifest.json') + bytes('public/assets/py/job-agent/4397ded/manifest.json')) / 1048576).toFixed(1);
---
<section class="career-live" data-career-live data-demo data-lang={lang} aria-labelledby="cl-title">
  <div class="wrap">
    <div class="section-head"><h2 id="cl-title">{T.title}</h2><span class="meta">{T.meta}</span></div>
    <p class="cl-intro">{T.intro}</p>
  </div>
  <div class="cl-stage night-zone" id="cl-stage">
    <div class="cl-top">
      <span class="cl-chip" id="cl-chip">PYTHON · WEBASSEMBLY</span>
      <span class="cl-status" id="cl-status" role="status" aria-live="polite"></span>
      <span class="cl-lat" id="cl-lat"></span>
    </div>
    <div class="cl-start" id="cl-start" hidden><button type="button" class="cl-btn" id="cl-start-btn">{T.start(mb)}</button><p>{T.startNote}</p></div>
    <div class="cl-main">
      <div class="cl-side">
        <div class="cl-jd">
          <div class="cl-h"><span id="cl-jd-label">{T.jdLabel}</span><button type="button" class="cl-link" id="cl-jd-toggle">{T.jdEdit}</button></div>
          <div class="cl-jd-view" id="cl-jd-view" tabindex="0" role="region" aria-labelledby="cl-jd-label">{DEMO_JD}</div>
          <textarea id="cl-jd-input" aria-labelledby="cl-jd-label" maxlength="20000" rows="12" hidden></textarea>
          <p class="cl-hint">{T.jdHint}</p>
          <div class="cl-scan" id="cl-scan" hidden></div>
        </div>
        <fieldset class="cl-cand" id="cl-cand">
          <legend>{T.candLabel}</legend>
          <label>{T.daysLabel}
            <select id="cl-days">
              {[1, 2, 3, 4, 5, 6, 7].map(d => <option value={String(d)} selected={d === 4}>{T.day(d)}</option>)}
              <option value="">{T.daysUnknown}</option>
            </select>
          </label>
          <ul class="cl-facts" id="cl-facts"></ul>
          <details class="cl-add">
            <summary>{T.addLabel}</summary>
            <label>{T.addStatement}<input id="cl-add-text" maxlength="200" /></label>
            <label>{T.addSkills}<input id="cl-add-skills" /></label>
            <label>{T.statusLabel}<select id="cl-add-status">{T.statusOptions.map(([v, t]) => <option value={v}>{t}</option>)}</select></label>
            <button type="button" class="cl-btn" id="cl-add-btn">{T.addBtn}</button>
          </details>
        </fieldset>
        <button type="button" class="cl-btn" id="cl-rerun">{T.recompute}</button>
        <p class="cl-hint">{T.privacy}</p>
      </div>
      <div class="cl-circuit" id="cl-circuit">
        <div class="cl-boot" id="cl-boot" hidden>
          <pre class="cl-boot-hex" id="cl-boot-hex" aria-hidden="true"></pre>
          <div><div class="cl-boot-log" id="cl-boot-log"></div><div class="cl-boot-mods" id="cl-boot-mods" aria-hidden="true"></div></div>
        </div>
      </div>
    </div>
    <div class="cl-bottom">
      <div class="cl-kpi">
        <div class="cl-kl">{T.score}</div>
        <div class="cl-kv" id="cl-score">0</div>
        <div class="cl-raw" id="cl-raw"></div>
        <div class="cl-ceil" id="cl-ceil"><span id="cl-ceil-t"></span></div>
      </div>
      <div class="cl-kpi"><div class="cl-kl">{T.facts}</div><div class="cl-kv" id="cl-facts-n">0</div></div>
      <div class="cl-codewrap">
        <CodeLive id="cl-code" file="public/assets/py/job-agent/4397ded/job_agent/services/local_matcher.py" first={697} last={702} title={T.codeTitle} meta={T.codeMeta} label={T.codeLabel} />
        <p class="cl-obs" id="cl-obs"></p>
      </div>
    </div>
    <div class="cl-vig" id="cl-vig"></div>
  </div>
  <div class="wrap cl-switch"><button type="button" class="cl-link" id="cl-toggle-replay">{T.toReplay}</button></div>
  <div class="cl-replay" id="cl-replay" hidden>
    <p class="wrap cl-fallback-note" id="cl-fallback-note" hidden>{T.fallback} <button type="button" class="cl-link" id="cl-retry">{T.retry}</button></p>
    <CareerDemo lang={lang} />
  </div>
</section>
<script>
  import { initCareerLive } from '../scripts/career-live';
  document.querySelectorAll<HTMLElement>('[data-career-live]').forEach(initCareerLive);
</script>
<style>
  .career-live { padding-bottom: 32px; }
  .cl-intro { max-width: 60em; margin: 14px 0 18px; }
  .cl-stage { position: relative; max-width: 1600px; margin-inline: auto; overflow: hidden; }
  .cl-top { display: flex; align-items: center; gap: 16px; padding: 12px var(--gutter); border-bottom: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); flex-wrap: wrap; }
  .cl-chip { padding: 2px 8px; border: 1px solid color-mix(in srgb, var(--night-fg) 25%, transparent); font: 600 12px Consolas, 'Cascadia Mono', monospace; letter-spacing: .06em; color: var(--night-mute); }
  .cl-chip.live { color: var(--night-fg); border-color: var(--red); }
  .cl-status { font-size: 13px; color: var(--night-mute); }
  .cl-status.bad { color: var(--night-fg); padding: 2px 8px; background: color-mix(in srgb, var(--red) 30%, transparent); }
  .cl-lat { margin-left: auto; font: 12px Consolas, 'Cascadia Mono', monospace; color: var(--night-mute); }
  .cl-start { padding: 28px var(--gutter); }
  .cl-start p { margin-top: 8px; color: var(--night-mute); font-size: 13px; }
  .cl-main { display: grid; grid-template-columns: 330px minmax(0, 1fr); border-bottom: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); }
  .cl-side { display: flex; flex-direction: column; gap: 14px; padding: 14px 18px; border-right: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); }
  .cl-jd { position: relative; }
  .cl-h { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font: 600 12px Consolas, 'Cascadia Mono', monospace; color: var(--night-mute); margin-bottom: 8px; }
  .cl-jd-view { max-height: 300px; overflow: auto; white-space: pre-wrap; font-size: 13px; line-height: 2; color: var(--night-fg); }
  .cl-jd-view :global(mark) { background: transparent; color: inherit; box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--red) 60%, transparent); transition: background .25s; }
  .cl-jd-view :global(mark.hit) { background: color-mix(in srgb, var(--red) 28%, transparent); }
  .cl-jd textarea { width: 100%; min-height: 240px; background: var(--night); color: var(--night-fg); border: 1.5px solid color-mix(in srgb, var(--night-fg) 30%, transparent); font: 13px/1.8 var(--font-body); padding: 8px; }
  .cl-scan { position: absolute; left: 0; right: 0; top: 24px; height: 36px; pointer-events: none; border-bottom: 1px solid color-mix(in srgb, var(--night-fg) 45%, transparent);
    background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--night-fg) 22%, transparent)); }
  .cl-hint { font-size: 12px; color: var(--night-mute); }
  .cl-cand { border: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); padding: 10px 12px; margin: 0; min-width: 0; }
  .cl-cand legend { padding: 0 4px; font-weight: 700; }
  .cl-cand label { display: grid; gap: 4px; font-size: 13px; margin-bottom: 8px; }
  .cl-cand select, .cl-cand input { background: var(--night); color: var(--night-fg); border: 1.5px solid color-mix(in srgb, var(--night-fg) 30%, transparent); font: inherit; font-size: 14px; padding: 6px 8px; border-radius: 0; }
  .cl-facts { list-style: none; margin: 4px 0 8px; padding: 0; display: grid; gap: 8px; }
  .cl-facts :global(li) { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; padding: 8px 0; border-top: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); font-size: 13px; }
  .cl-facts :global(small) { grid-column: 1; color: var(--night-mute); font: 11px Consolas, monospace; }
  .cl-facts :global(.cl-doc) { color: var(--night-mute); font-size: 12px; }
  .cl-facts :global(select) { background: var(--night); color: var(--night-fg); border: 1px solid color-mix(in srgb, var(--night-fg) 30%, transparent); font-size: 12px; }
  .cl-add summary { cursor: pointer; font-size: 13px; }
  .cl-btn { justify-self: start; padding: 8px 14px; border: 1.5px solid var(--night-fg); background: transparent; color: var(--night-fg); font-weight: 700; cursor: pointer; }
  .cl-btn:hover:not(:disabled) { background: var(--night-fg); color: var(--night); }
  .cl-btn:disabled { opacity: .45; cursor: default; }
  .cl-link { padding: 0; border: 0; background: none; color: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; font: inherit; font-size: 12.5px; }
  .cl-circuit { position: relative; min-height: 420px; }
  .cl-circuit :global(svg) { display: block; width: 100%; height: auto; }
  .cl-circuit :global(canvas) { position: absolute; left: 0; top: 0; pointer-events: none; }
  .cl-circuit :global(.cbox) { fill: color-mix(in srgb, var(--night-fg) 3%, transparent); stroke: color-mix(in srgb, var(--night-fg) 16%, transparent); stroke-width: 1.2; transition: stroke .3s, fill .3s; }
  .cl-circuit :global(.cnode) { transition: opacity .3s; }
  .cl-circuit :global(.cnode.hide) { opacity: 0; }
  .cl-circuit :global(.cnode.tone-ok .cbox) { stroke: color-mix(in srgb, var(--night-fg) 70%, transparent); fill: color-mix(in srgb, var(--night-fg) 7%, transparent); }
  .cl-circuit :global(.cnode.tone-fail .cbox) { stroke: var(--red); fill: color-mix(in srgb, var(--red) 12%, transparent); }
  .cl-circuit :global(.cnode.tone-unknown .cbox), .cl-circuit :global(.cnode.tone-gap .cbox) { stroke: var(--night-mute); stroke-dasharray: 4 4; }
  .cl-circuit :global(.cnode.flash .cbox) { animation: cl-nodeflash .6s ease-out; }
  @keyframes cl-nodeflash { 0% { fill: color-mix(in srgb, var(--night-fg) 26%, transparent); } }
  .cl-circuit :global(.cnt) { fill: var(--night-fg); font: 600 15px var(--font-body); }
  .cl-circuit :global(.cns) { fill: var(--night-mute); font: 11.5px Consolas, monospace; }
  .cl-circuit :global(.chd) { fill: var(--night-mute); font: 600 11.5px Consolas, monospace; letter-spacing: .08em; }
  .cl-circuit :global(.ctr) { fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .cl-circuit :global(.ctr.tone-ok) { stroke: color-mix(in srgb, var(--night-fg) 50%, transparent); }
  .cl-circuit :global(.ctr.tone-fail) { stroke: var(--red); stroke-width: 2.4; }
  .cl-circuit :global(.ctr.tone-gap) { stroke: color-mix(in srgb, var(--red) 45%, transparent); stroke-dasharray: 6 7; }
  .cl-circuit :global(.ctr.tone-unknown) { stroke: var(--night-mute); stroke-dasharray: 6 7; }
  .cl-circuit :global(.ctr.tone-none) { stroke: color-mix(in srgb, var(--night-mute) 50%, transparent); stroke-dasharray: 2 5; }
  .cl-circuit :global(.cvia) { fill: var(--night); stroke: color-mix(in srgb, var(--night-fg) 45%, transparent); stroke-width: 1.5; }
  .cl-circuit :global(.cmark) { fill: var(--night-fg); font: 700 15px Consolas, monospace; }
  .cl-circuit :global(.ccharge) { fill: color-mix(in srgb, var(--night-fg) 18%, transparent); transform-box: fill-box; transform-origin: left center; }
  .cl-boot { position: absolute; inset: 0; z-index: 3; display: grid; grid-template-columns: 1fr 1.3fr; gap: 28px; padding: 22px 26px; background: var(--night); font: 12.5px/1.8 Consolas, 'Cascadia Mono', monospace; color: var(--night-mute); }
  .cl-boot-hex { margin: 0; overflow: hidden; font-size: 11.5px; line-height: 1.6; color: color-mix(in srgb, var(--night-mute) 60%, transparent); -webkit-mask-image: linear-gradient(180deg, transparent, #000 25%, #000 80%, transparent); mask-image: linear-gradient(180deg, transparent, #000 25%, #000 80%, transparent); }
  .cl-boot-log :global(.ready) { color: var(--night-fg); font-weight: 600; }
  .cl-boot-mods { display: grid; grid-template-columns: repeat(3, max-content); gap: 6px 8px; margin-top: 16px; }
  .cl-boot-mods :global(.cl-mod) { padding: 2px 7px; border: 1px solid color-mix(in srgb, var(--night-fg) 25%, transparent); color: var(--night-fg); font-size: 11px; opacity: 0; transform: scale(.6); }
  .cl-boot-mods :global(.cl-mod.in) { opacity: 1; transform: none; transition: opacity .2s, transform .25s cubic-bezier(.2,.8,.2,1.3); }
  .cl-bottom { display: grid; grid-template-columns: 240px 190px minmax(0, 1fr); }
  .cl-kpi { position: relative; padding: 12px 18px 16px; border-right: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); overflow: hidden; }
  .cl-kl { font-size: 12px; color: var(--night-mute); }
  .cl-kv { font: 700 88px/1 var(--font-display); margin-top: 12px; transform-origin: left bottom; }
  .cl-kv.squash { animation: cl-squash .36s cubic-bezier(.2,.8,.2,1); }
  @keyframes cl-squash { 0% { transform: scaleY(.8); } 60% { transform: scaleY(1.04); } 100% { transform: none; } }
  .cl-raw { margin-top: 6px; font: 12px Consolas, monospace; color: var(--night-mute); min-height: 18px; }
  .cl-ceil { position: absolute; left: 0; right: 0; top: 40px; height: 5px; background: var(--night-fg); opacity: 0; transform: translateY(-60px); }
  .cl-ceil.fail { background: var(--red); }
  .cl-ceil span { position: absolute; right: 12px; top: 10px; font: 600 11.5px Consolas, monospace; white-space: nowrap; color: var(--night-fg); }
  .cl-ceil.down { animation: cl-drop .2s cubic-bezier(.55,0,.9,.4) forwards; }
  @keyframes cl-drop { 0% { opacity: 1; transform: translateY(-60px); } 80% { opacity: 1; transform: translateY(3px) scaleY(1.8); } 100% { opacity: 1; transform: none; } }
  .cl-codewrap { display: flex; flex-direction: column; gap: 10px; padding: 12px 18px 14px; min-width: 0; }
  .cl-obs { font-size: 13px; color: var(--night-fg); min-height: 22px; }
  .cl-vig { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--red) 30%, transparent)); }
  .cl-vig.soft { background: radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--night-fg) 18%, transparent)); }
  .career-live :global(.cl-fly) { position: fixed; z-index: 20; pointer-events: none; padding: 1px 4px; white-space: nowrap; font: 600 13px var(--font-body); color: var(--night-fg); background: color-mix(in srgb, var(--red) 35%, var(--night)); border: 1px solid var(--red); }
  .cl-switch { padding-top: 12px; }
  .cl-fallback-note { margin: 12px auto; }
  @media (max-width: 800px) {
    .cl-main { grid-template-columns: minmax(0, 1fr); }
    .cl-side { border-right: 0; border-bottom: 1px solid color-mix(in srgb, var(--night-fg) 14%, transparent); }
    .cl-boot { grid-template-columns: minmax(0, 1fr); }
    .cl-boot-hex { display: none; }
    .cl-bottom { grid-template-columns: 1fr 1fr; }
    .cl-codewrap { grid-column: 1 / -1; }
    .cl-kv { font-size: 64px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cl-ceil.down { animation: none; opacity: 1; transform: none; }
    .cl-kv.squash { animation: none; }
  }
</style>
```

`src/views/CareerView.astro`：把 `import CareerDemo from '../components/CareerDemo.astro';` 换成 `import CareerLive from '../components/CareerLive.astro';`，把 `<CareerDemo slot="demo" lang={lang} />` 换成 `<CareerLive slot="demo" lang={lang} />`。

- [ ] **Step 7: 运行，确认通过**

Run: `npx playwright test tests/e2e/career-live.spec.ts tests/e2e/career.spec.ts tests/e2e/phase2b.spec.ts tests/e2e/a11y.spec.ts tests/e2e/numbers.spec.ts tests/e2e/layout.spec.ts`
Expected: 全部 PASS（按设备有意跳过的除外）。首次运行较慢属正常；若冷启动在测试机上超过 90 秒，查明原因（资源 404、MIME、Worker 报错），不要只放宽超时。

- [ ] **Step 8: 提交**

```bash
git add src/components/CodeLive.astro src/scripts/code-live.ts src/components/CareerLive.astro src/scripts/career-live.ts src/scripts/career-live-text.ts src/scripts/odometer-dom.ts src/views/CareerView.astro tests/e2e/career-live.spec.ts tests/e2e/career.spec.ts
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Job agent page: the real engine runs in the browser — editable input, evidence circuit, cap slam, live source, replay fallback" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 验收

- [ ] **Step 1: 全量测试**

Run: `npm test && npx playwright test`
Expected: 全部 PASS（按设备有意跳过的除外）。

- [ ] **Step 2: 看效果、量性能**

1. 用 Playwright 打开 `/projects/ai-career/`（桌面 1440×900）与 `/en/projects/ai-career/`，滚到演示区，截取：冷启动中、电路绘制中、4 天封顶 84 的撞击瞬间、改 3 天后电弧与 59、确认 Tableau 后的材料流。用 Read 逐张检查：没有重叠或裁切，亮度克制，代码实况亮起的行正确。
2. 在 3 天（有电弧和火花）的状态下，用 `requestAnimationFrame` 计数 2 秒测帧率，要求 ≥ 50 fps。
3. 手机（390×844）：点"启动引擎"，截取冷启动与纵向电路；确认页面不横向溢出。
4. 记录实测：首次冷启动耗时（测试服务器，冷缓存）、运行时总字节数。写进交付说明，请用户确认（规格第 9 节）。

发现问题就修，修完重跑 Step 1，并记 Ruling。

- [ ] **Step 3: 提交（仅当 Step 2 有修改）**

```bash
git add src tests
git -c user.name='CHIWAWA LING' -c user.email='19921552388@163.com' commit -m "Live career engine: acceptance fixes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
