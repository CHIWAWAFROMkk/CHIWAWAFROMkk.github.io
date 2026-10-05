# 全站动效升级 · 第二批（项目、完整版与隐私）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** 把已验收的标题、导语与分节动效推广到实际存在的所有数据项目、完整版、方法/进阶页与隐私页，共 24 条中英路由。

**Architecture:** 第一批 React Bits SplitText/ScrollReveal 继续负责标题和导语；Markdown 与演示组件的 h2 使用同源 GSAP reveal helper 的 DOM 适配，保留原始节点、属性和交互。进入屏幕前准备，一次揭示，离屏不动画；所有资源和媒体查询监听有清理。

**Tech Stack:** 现有 Astro7、React19、GSAP3、Vitest、Playwright/Edge；不新增依赖。

**Spec:** `docs/superpowers/specs/2026-10-05-react-bits-gsap-motion-design.md`

## Global Constraints

- 沿用现有内容、语义、字体、配色、图表、业务脚本与下载；不修改原始 Markdown 或程序。
- 统一 ease cubic-bezier(.2,.8,.2,1)，0.2/0.6/0.9秒，字40ms、行70ms、块90ms；只动 transform/opacity。
- 首屏完整文本预渲染；脚本失败2.5秒可读；晚到的激活不重新隐藏已可见文本。
- 减少动态不拆字/建触发器；运行中切换清理；每页滚动 CLS<0.1；首屏 React+组件<=70*1024字节gzip，GSAP单列。
- 不修改已有第一批成果；影像两页仍留给第三批，通过显式 opt-out 隔离公共布局变化。
- 本机预览与交接；保留工作区 diff，不提交、推送、部署或删除日志。

## Review Focus

1. Markdown h2 的 id/内联元素/链接与 hris 观察器仍完整可用。
2. 慢加载以及滚动已经越过的标题不得重新变淡，减少动态切换清理所有触发器。
3. Insights 长开场后的主标题需在接近屏幕时才准备，不能屏外播放或永久隐藏。
4. 390/320英文长标题拆分前后不剪裁/横溢，1920版心保持。
5. 第二批必须保护 CSV/SQL/Python/Quota 真实程序；影像页本批无新React运行时。

### Task 1: 共用 reveal 生命周期与静态正文适配

**Files:** `src/scripts/motion/reveal.ts`、`src/scripts/motion/sections.ts`、`src/components/SectionReveals.astro`、`src/components/rb/ScrollReveal.tsx`、`src/components/rb/SplitText.tsx`、相关单元测试。

**Interfaces:** `initSectionReveals(root: HTMLElement): () => void`；Scope selector `[data-section-reveals]`；跳过 `.sr`、`[aria-hidden="true"]`、已经由 `.scroll-reveal` 管理的标题；实际准备标题加 `data-section-motion`。SplitText 新增可选 `deferUntilVisible`，SSR 标记免除首屏隐藏规则，并采用本地可见性判断。

- [x] 写可行为验证的边界测试；复用第一批浏览器测试覆盖正常与降低动态。
- [x] 抽取 ScrollReveal 同源核心，React 与 DOM 调用同一生命周期，保留来源与许可；IO提前200px准备，进入屏幕单次播放，完成还原节点。
- [x] DOM适配不包整篇React、不改正文文字，不处理业务控件内部h2的动态数据。
- [x] deferred SplitText 支持 Insights 后置标题，已进入/越过视口则保留最终态；到期不重新隐藏。
- [x] 运行窄范围测试、报告接口和差异。

### Task 2: 各页面接线与旧动画去重

**Files:** `src/layouts/ProjectLayout.astro`、`src/views/PrivacyView.astro`、`src/views/MethodView.astro`、`src/views/InsightsView.astro`、`src/views/CampusView.astro`、`src/views/FilmView.astro`、`src/views/JungView.astro`、必要样式。

**Interfaces:** ProjectLayout `motion?: boolean` 默认true，`deferTitle?: boolean` 默认false；Film/Jung显式 `motion={false}`，Insights `deferTitle`。带动效的 `main` 标记 `data-section-reveals`；标题使用SplitText、导语使用ScrollReveal；SectionReveals加载实际DOM h2。

- [x] 父代理先运行未接线的第二批失败验收，再接线。
- [x] 保留标题外层Astro标签、全部id与子元素。
- [x] 已核实 CampusView 的旧 reveal 实际作用于 h3+首段，与本批 h2 无重叠，保留；其他真实程序不动。
- [x] 更新第一批“无React页面”保护用例到第三批影像页，原stock已属于本批。

### Task 3: 验收、独立审查与交接

**Files:** `tests/e2e/motion-batch2.spec.ts`、`tests/e2e/motion-batch1.spec.ts`、`docs/superpowers/reviews/2026-10-05-motion-batch2-handoff.md`。

- [x] 24路由标题/正文动效、JS失败/关闭、reduce真实触发器0、长开场、首屏预算、全页滚动CLS、无溢出。
- [x] 全量unit与全站e2e（2workers，15分钟上限，输出写日志）。
- [x] 390/1920全部路由截图，检查英文长词与窄屏；独立代码审查和必要修复。
- [x] 更新本机4420预览和交接说明，保留测试日志与图像供Claude复核。

## Preflight decisions

- 规范“五个数据项目”计数过时：当前实际六个数据项目，外加3完整版、方法、进阶、隐私，共12个双语页面，全部覆盖。
- 不逐项重写Markdown为React；使用React Bits揭示逻辑的DOM适配，维护原节点与语义。
- 第二批未点选磁吸或光斑新位置，保持规范组件位置表；不增加噪点（第三批）。
- 第一批未提交改动属于本次延续，原样保留；当前非main的redesign工作树继续使用。

## 验收中增加的展示层修复

- 英文手机洞察页全滚动 CLS 超标来自原有数字宽度变化与加载状态高度变化。只调整 `countup-dom.ts` 的临时空间预留与 `InsightsCockpit.astro` 的响应式状态占位；SQL、筛选、统计和数据不变。
- 混排标题保留原文中的完整英文词组。GSAP `specialChars` 仅在逐字模式传原始词表；拆分若改变原文或尺寸立即还原。新增动画期间的原文与词组断言。
- 全站回归发现旧英文标题用例失败后，先定位 GSAP 的跨词合并，再修复与专项验证；最终完整回归使用 `full-e2e-final.log`，先前失败日志保留作证据。
