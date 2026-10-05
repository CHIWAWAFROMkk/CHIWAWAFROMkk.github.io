# React Bits + GSAP · 第二批交接

日期：2026-10-05。范围：项目、完整版、方法、洞察与隐私页面。本机实现与验收完成；未提交、推送或部署。

## 依据与技能

- 原方案：`docs/superpowers/specs/2026-10-05-react-bits-gsap-motion-design.md`。
- 执行计划：`docs/superpowers/plans/2026-10-05-react-bits-gsap-batch2.md`。
- 与 Claude 一致使用 `design-taste-frontend`（本机 `C:/Users/yoshi/.codex/skills/taste-skill/SKILL.md`），保留既有排版、色彩、字体与文案，动效保持克制。
- 使用 Superpowers 的 writing-plans、subagent-driven-development、test-driven-development、requesting-code-review、verification-before-completion。按用户约定使用 PowerShell、保留当前 diff 与验证材料，不执行自动提交或工作树清理。

## 本批结果

当前实际为六个数据项目，原规范“五个”计数已过时。覆盖以下 12 种页面的中英文，共 24 条路由：

| 页面 | 中文路径（英文增加 `/en` 前缀） |
|---|---|
| HRIS 流程 | `/projects/hris-workflow/` |
| 校园外卖 SQL | `/projects/campus-delivery/` |
| CSV 分析 | `/projects/stock-data/` |
| CSV 方法 | `/projects/stock-data/method/` |
| 校园外卖洞察 | `/projects/campus-delivery/insights/` |
| 求职 Agent | `/projects/ai-career/` |
| 求职 Agent 完整版 | `/projects/ai-career/live/` |
| QuotaDeck | `/projects/quota-deck/` |
| QuotaDeck 完整版 | `/projects/quota-deck/live/` |
| 校园研究 | `/projects/ai-campus/` |
| 校园研究完整版 | `/projects/ai-campus/live/` |
| 隐私 | `/privacy/` |

1. 标题使用 SplitText，导语使用 ScrollReveal。中文逐字，混排中的 SQL、Agent 等英文保持完整词组；英文逐词。拆分改变原文、空格、文本框尺寸或产生过宽词组时，回退为整段动画。
2. 正文 h2 使用同源 GSAP 逻辑直接揭示原节点，保留 Markdown、id、链接、子节点与观察器身份。h2 整体由淡到实、轻微旋转归正；导语仍可逐单元揭示。
3. 屏下内容在接近视口 200px 时准备。洞察页长开场之后的标题使用独立等待期限；加载期间已进入视口的文字保持可读，避免重新隐藏。
4. 完成后恢复原始文本和样式；减少动态时不拆分、不创建触发器，运行中切换也清理。关闭或阻断脚本仍有完整静态文字。
5. CampusView 既有动效实际作用于 h3 与首段，和本批 h2 无重叠，因此保留。Film/Jung 显式关闭本批公共布局动效，留到第三批。

## 浏览器验收发现与修复

- 手机中文标题原先在动画中把 SQL 拆成 `S / QL`，虽然整体高度没有改变，断行仍不正确。新增实际浏览器回归测试，确认失败后修复混合语种拆分。
- GSAP 的 `specialChars` 还会处理无空格拼接的单词数组，不能直接传宽泛的拉丁字符正则。实现仅在逐字模式传入原文中提取的词组；纯英文不传，纯中文无匹配时也不传。拆分后再核对原文，防止上游算法改变空格。第一批英文标题和 320px 断行均纳入回归。
- 英文手机洞察页原有数字递增和驾驶舱加载状态会改变行宽/高度。完整滚动 CLS 曾达到 0.1615–0.1655；阻断新增 GSAP 后仍可复现。修复仅涉及展示尺寸预留，不改变数字、SQL、筛选或统计程序。修复后同一浏览器诊断为 **0.000500875**，无控制台异常。
- Astro 会提升条件组件的脚本，因此 SectionReveals 先查找实际作用域，存在才动态导入；影像页不会因此下载 GSAP/React。

## 体积核算

GSAP 独立块只含库与注册，应用的 reveal helper、令牌和 React 组件计入 70 KiB 预算。React 运行时统一分块，SplitText/ScrollReveal 共享文本组件块，避免重复块压缩开销。另设应用加 GSAP 合计 125 KiB 上限。

验收使用真实页面请求，再递归解析岛入口和渲染器依赖，防止通过改块名漏计。最终 24 路由首屏应用图为 **70,717–70,799 B（约 69.1 KiB）**，GSAP 为 **50,070 B（约 48.9 KiB）**，两者约 118.0 KiB。完整逐路由记录为 `captures/budgets.json`。

这里的 70 KiB 指 React 运行时与岛组件，不是页面全部 JavaScript；原有业务程序、Astro 启动和原生 h2 加载脚本另计。第一批六条路由的实际首屏预算也继续接受回归检查，不能把概览页所有屏外岛的完整依赖图当作首屏请求。

实现参考：[Rolldown 分块配置](https://rolldown.rs/reference/OutputOptions.codeSplitting)、[Vite 构建配置](https://vite.dev/config/build-options#build-rolldownoptions)、[GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)及已安装源码/类型。React Bits 来源固定提交和许可继续保存在 `src/components/rb/` 文件头与 LICENSE.md。

## 验证材料与复核入口

- 单元测试 **307/307 通过**，53 个测试文件，日志 `unit-final.log`。
- 修复后的专项测试 **7 通过、1 项手机重复预算检查按条件跳过**，含双语洞察页、混排词组和 24 路由脚本预算，日志 `cls-fixed-targeted.log`。
- 英文分词边界修正后的专项 **25 通过、7 项重复预算检查按条件跳过**，含第一批标题、320px 英文、混排文字及首屏预算，日志 `latin-boundaries-targeted.log`。
- 独立代码审查与修复后的窄范围复核均未留下 P1/P2 问题；核对了原 h2 节点、减少动态清理、标题等待、数字样式恢复、状态区域读屏和真实依赖计数。
- 最终全站端到端 **758 通过、218 按条件跳过、0 失败**，共 976 个实例，耗时 11.7 分钟。命令 `npx playwright test --workers=2 --global-timeout=900000`，日志 `full-e2e-final.log`。跳过包括既有桌面/手机限定用例与重复手机预算检查。
- 24 条路由在 390px/1920px 完整滚动中均 CLS < 0.1，无横向溢出；运行中切换减少动态后，实际 ScrollTrigger 数量归零。静态正文、原 h2 id/节点/子节点保持一致。
- 关闭 JS、阻断脚本、初始减少动态均覆盖 24 条路由；第一批慢激活、触屏与磁吸/光斑约束持续通过。相关 320px 英文长词和混排文字用例通过。
- `git diff --check` 已通过。

本地预览：

- `http://localhost:4420/projects/hris-workflow/`
- `http://localhost:4420/projects/campus-delivery/`
- `http://localhost:4420/en/projects/campus-delivery/insights/`
- `http://localhost:4420/privacy/`

截图与日志：`.superpowers/sdd/2026-10-05-react-bits-gsap-batch2-codex/`。其中 `captures/` 按宽度、路由、title/body 命名，覆盖 390px 与 1920px，共 96 张路由截图。已抽查手机与宽屏的长标题、混排、洞察、正文和隐私页面。`cls-baseline*` / `cls-blocked-motion*` 是修复前诊断证据，不代表最终状态；`cls-fixed.json` 是修复后记录。`full-e2e.log` 为中途定位英文分词问题而停止的早期运行，最终以 `full-e2e-final.log` 为准。

效果录像：`captures/batch2-1920-motion-preview.webm` 与 `captures/batch2-390-motion-preview.webm`，分别约 1.45 MB 与 1.13 MB。录像包含校园 SQL 标题与滚动揭示、洞察页后置标题；洞察页最终静态截图已等待导语揭示结束后重拍。预览服务 4420 已重新核对 HTTP 200。

Claude 复核时重点看：390px 混排标题在动画中是否连贯；1920px 长英文标题、正文节奏；洞察页长开场后的标题；完整滚动是否挤动正文；系统减少动态和关闭 JavaScript 后可读性。真实程序沿用原实现，并纳入全站回归。

当前工作树仍为 `redesign`，基础 HEAD `a18dc39`，包含上一批未提交成果。本批不发布；第三批影像页的噪点、按钮磁吸与标题尚未实施。
