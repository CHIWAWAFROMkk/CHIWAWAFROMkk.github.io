# 第一批动效实现与 Claude 复核交接

日期：2026-10-05。起点：`redesign` / `a18dc39`。改动保留在工作区，未提交、推送或部署。

依据：`../specs/2026-10-05-react-bits-gsap-motion-design.md` 与 `../plans/2026-10-05-react-bits-gsap-batch1.md`。

使用技能：`C:/Users/yoshi/.codex/skills/taste-skill/SKILL.md`（名称 `design-taste-frontend`），以及方案指定的 Superpowers 执行、独立审查和验证流程。保留现有字体、颜色、文字与版心，以字阶、空间和轻微动效补充表现。

## 本机看效果

- 首页：<http://localhost:4420/>
- 概览：<http://localhost:4420/brief/>
- 项目索引：<http://localhost:4420/projects/>
- 英文版分别为 `/en/`、`/en/brief/`、`/en/projects/`。
- 若预览进程已退出，在仓库运行 `node tools/serve-dist.mjs 4420`；代码修改后先运行 `npm run build`。
- 36 张截图、18 组控制台/加载记录、演示录像位于 `.superpowers/sdd/2026-10-05-react-bits-gsap-batch1-codex/captures/`。录像：`batch1-motion-preview.webm`。

## 已实现

- React 岛与 GSAP 共用令牌、插件注册。首屏标题 SplitText，分节标题 ScrollReveal。
- 首页门箭头、邮箱、简历 Magnet；项目行、索引影像条目 SpotlightCard。
- 时长 0.2 / 0.6 / 0.9 秒，统一缓动；磁吸径向总位移最多 6px。
- 中英标题分别按字、词拆分。动画结束恢复原始文字结构，避免拆分长期影响排版和选择。
- 首页开场结束后才播放标题。脚本失败 2.5 秒后文字可读，迟到的激活不再次隐藏已经出现的文字。
- 减少动态时不拆字、不创建 ScrollTrigger；运行中切换会清理动效。粗指针不启用磁吸、光斑。
- 标题 balance、正文 pretty、数字 tabular-nums、按钮按压反馈。使用独立 CSS scale，保留原有 transform。
- 上游 React Bits 固定到 `ca44b3f9ee180676a06d7de8ec6bea84cddff85b`，各组件列出来源和改造点，原始许可见 `src/components/rb/LICENSE.md`。

## 验证证据

- 构建通过；全量单元测试 306/306 通过。
- 新增浏览器验收首轮修正后 66 通过、6 重复体积项跳过；加强真实依赖图和实际 ScrollTrigger 检查的专项 14/14 通过。
- 全站浏览器回归：`npx playwright test --workers=2 --global-timeout=900000`，**702 通过、216 按条件跳过、0 失败**，耗时 8.9 分钟。跳过项包括原有桌面/手机限定场景，以及本批重复手机体积检查；总计 918 个测试实例。
- 320px 检查英文正在拆分时的文字边界；1920px 检查行号与标题左边界对齐。
- 6 条双语路径在完整滚动过程中 CLS < 0.1；禁用 JS、阻断脚本、延迟激活、触屏导航和减少动态均有浏览器测试。
- 截图采样 390 / 1440 / 1920px，18 个页面尺寸组合均无控制台错误和横向溢出。
- 首屏 React 运行时与组件约 69.3–69.7 KiB gzip，满足方案按 70×1024 字节定义的限制；**另有 GSAP 48.9 KiB gzip**，两者合计约 118.2–118.6 KiB，不能把 70 KiB 当作全部脚本体积。预算测试递归跟踪真实请求的岛组件与渲染器依赖，GSAP 单独记录。
- 未使用 React 的项目详情页验证无 React 岛或运行时请求。

## 对示例计划的明确调整

1. ScrollReveal 遵循设计稿的单次播放，替代示例代码的 scrub；代价是没有反向滚动回放。
2. 分节标题提前 200px 激活；超时且已在屏幕内时保留完整文字，防止弱网闪回。代价是弱网可能跳过该次装饰动效。
3. 去掉门箭头旧 8px 悬停位移，防止与磁吸叠加。代价是原悬停动作变轻。
4. 光斑改为固定渐变层的 transform，替代逐帧重绘渐变中心；测试跟随实际光层。外观保持原卡片布局。
5. 用 effect 与明确清理实现生命周期；按计划安装 `@gsap/react`，本批未额外引入其运行时代码。
6. PowerShell 执行替代技能中的 Bash 辅助脚本；紧密关联的基础设施与组件共同实现、页面独立接线，再做整体独立审查。进度记录手动保留。
7. 保留日志和截图供复核，不删除已有 `.superpowers` 内容；未照搬示例中的 Claude 署名提交，工作区供 Claude 直接看 diff。代价是尚无本批提交号。

独立审查发现并修复了迟到的分节标题激活问题；光斑测试定位也已修正。未留下已知待修的代码审查问题。

## Claude 复核建议

先看首页首次进入（可清除站点 `hyj-intro-seen`）、再次进入的标题节奏，门箭头和联系栏悬停，再看概览分节及索引滚动、影像光斑。最后在 390px 和系统“减少动态”下各看一次。

本次范围止于第一批。项目详情/实时演示页（第二批）与 Jung/影像详情（第三批）尚未实施，按原方案在本批视觉复核后继续。
