# 第四批动效审查 — Codex

审查日期：2026-10-06。分支：`redesign`。基准提交：`6918655`。

初次审查在本地构建产物、Windows / Microsoft Edge 中复现 3 项问题。下面保留修复前的证据和重现步骤；当前修复与验证状态见文末。

沿用 Claude 方案和 `design-taste-frontend` 的既定风格要求，并用 `ecc-team` 分工检查调度生命周期、内容与数字、原生交互和影像页。本报告只列有代码依据或浏览器证据的问题。

## 1. [P2] 从往返缓存恢复页面后，未播放的段落标题一直隐藏

**代码位置：** `src/scripts/motion/arm.ts:42`；调用链为 `src/components/SectionReveals.astro:8–11` → `initSectionReveals` → `initHeadReveals` → `armOnScroll`。

`pagehide` 会执行 cleanup。新的 cleanup 断开 IntersectionObserver，却保留 `.m-armed` 的隐藏状态，也没有恢复页面时的重新绑定。页面命中浏览器往返缓存（bfcache）后，之前没滚到的标题因此永远收不到 `.m-in`。这不是动画还没结束：滚到标题并等待 1.8 秒后，它仍是 `opacity: 0`。

复现步骤：

1. 保持正常动态效果，打开 `/projects/campus-delivery/`，不要先滚到正文标题。
2. 在同一个标签页打开 `/privacy/`，再后退。
3. 确认 `pageshow.persisted === true`，滚到正文的“关系模型”。
4. 标题占位仍在，文字不显示。

实际记录：首次 `pageshow.persisted=false`，离开时 `pagehide.persisted=true`，返回时 `pageshow.persisted=true`。返回并滚动后，“关系模型”的 top 为约 631 px（视口高 900 px），class 仍是 `m-armed`，opacity 仍为 `0`。

**修复建议：** cleanup 时把已接管节点恢复为可读的完成态；或者完整处理 `pageshow` 恢复。若选重新初始化，要同时处理已有 `data-m-head` 标记，否则 `initHeadReveals` 会跳过节点。

**补测：** 真实的离开 → 后退 → `persisted=true` → 滚到未播放标题。Playwright 默认启动参数禁用 bfcache，本轮探针使用 `ignoreDefaultArgs: ['--disable-back-forward-cache']` 才能覆盖真实缓存恢复；不能只用刷新代替后退。缓存恢复事件依据：[MDN pageshow](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event)。

证据：[运行记录](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/bfcache-probe.json)、[截图](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/bfcache-hidden-heading.png)、[复现脚本](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/bfcache-probe.mjs)。

## 2. [P2] 脚本超过 2.5 秒才到达时，程序区会重新隐藏已显示的内容

**代码位置：** `src/components/ProjectMotion.astro:25`，以及 `src/scripts/motion/arm.ts:37–39`。

程序区传入 `fold: 0.8`，因此 top 处于视口底部 20% 内的区块仍会被加上 `.m-armed`。`armOnScroll` 没有检查 `motion-timeout`；摘要行在 `stage()` 中的迟到保护也不覆盖这里。已经显示的程序区会在迟到脚本执行时变透明，并等到进一步滚动才恢复，违背“已显示内容不重新隐藏”的约定。

复现步骤：

1. 将 `/projects/campus-delivery/` 的 `ProjectMotion.astro_*.js` 请求暂缓。
2. 等待根节点出现 `motion-timeout`，将 `#workbench` 的 top 放在约 `0.85 × innerHeight`。
3. 确认区块标题已显示，再放行脚本，不继续滚动。
4. 标题消失，脚本执行 1.9 秒后仍没有恢复。

实际记录：1440 × 900 视口，区块 top 约 765 px。放行前直接子元素 opacity 全为 `1`；放行后 class 变为 `wrap wb m-armed`，子元素 opacity 全为 `0`，根节点仍有 `motion-timeout`。前后截图清楚显示“查询真实执行，结果直接查看。”从可见变为消失。

**修复建议：** 迟到路径不要重新武装已进入视口的程序区。让程序区遵守与摘要行一致的可见性保护，保留首屏以下区块的滚动动画。

**补测：** 当前 `tests/e2e/motion-batch4.spec.ts:103–112` 的慢网检查只检查摘要与门的子元素，没有检查 `[data-m-boot]`，而且在 `DOMContentLoaded` 后取第一次快照，无法观察被暂缓模块执行前的状态。新用例应在 `waitUntil: 'commit'` 后等待安全期限，记录可见状态，随后手动放行脚本并复查。

证据：[运行记录的 late 字段](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/boundary-probes.json)、[放行前截图](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/late-boot-before.png)、[放行后截图](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/late-boot-after.png)、[复现脚本](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/boundary-probes.mjs)。

## 3. [P3] 窄桌面窗口中，键盘聚焦的项目预览图被右边界裁切

**代码位置：** `src/components/ProjectRow.astro:51–53`。

旧版 CSS 用 `clamp()` 限制预览图的水平位置；第四批改为 `translate(calc(var(--px, 58vw) + 24px), ...)`，位置限制仅在 `pointermove` 处理器中执行。用户没有移动鼠标、直接用键盘选中项目时，`--px` 不存在，300 px 宽的图片直接落在 `58vw + 24px`，窄窗口下超出右边界。`ProjectsView.astro:71` 的 `overflow-x: clip` 会裁掉图片。

复现步骤：

1. 使用鼠标/键盘桌面浏览器，将视口设为 640 × 900。
2. 打开 `/projects/`，不把鼠标移到项目行，使用键盘聚焦第二个项目。
3. 预览图右侧约 55 px 被裁掉。

实际记录：640 px 视口中，图片 left ≈ 395.2、right ≈ 695.2、width = 300、opacity = 1。320 px 桌面视口的 right ≈ 509.6，裁切更明显；800 px 视口下正常。文档 scrollWidth 始终等于视口宽度，因此这里是**图片裁切**，不是页面横向滚动。触屏条件下预览图本来就不显示，本条不把手机触控列为受影响场景。

**修复建议：** 在 CSS 最终变换中保留依据当前容器宽度的边界限制，覆盖无指针事件的键盘路径；超窄容器也应约束图片宽度。

**补测：** 桌面细指针 + 640 px 视口 + 无 pointermove + 键盘 focus，断言预览图的左右边界都在可视范围内。只断言 opacity 或鼠标跟随坐标无法发现这一问题。

证据：[运行记录的 preview 字段](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/boundary-probes.json)、[640 px 截图](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/preview-keyboard-640.png)。

## 本轮验证范围

- 重新执行第三、四批现有端到端测试：`npx playwright test tests/e2e/motion-batch3.spec.ts tests/e2e/motion-batch4.spec.ts --workers=2 --global-timeout=240000`。结果 **45 通过、5 跳过、0 失败**，构建成功。日志：[existing-motion.log](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/existing-motion.log)。
- 另外运行了上面的真实缓存恢复、暂缓模块加载和窄窗口键盘预览探针；现有专项测试通过不覆盖这些路径。
- 静态检查了摘要数字拆分、原生指针增强、影像页效果与生命周期。摘要原文拼接和当前数量识别未发现新的可确认错误。
- 交接中所述 **307 项单元测试、805 项全站端到端测试** 是上一轮结果；本轮没有重跑这两套全量测试，也没有把该数字作为本轮独立验证结果。

复现服务为当前本地构建产物 `http://localhost:4430`。证据文件保存在仓库内 `.superpowers/reviews/2026-10-06-motion-batch4-codex/`；这是本地审查材料，尚未提交。

## 修复更新（2026-10-06）

- `src/scripts/motion/arm.ts`：清理 IntersectionObserver 时移除被接管节点的 `.m-armed`，使往返缓存恢复后的未读标题立即可见；模块迟到且安全期限已过时，只武装仍完全在视口下方的节点。
- `src/components/ProjectRow.astro`：将预览图的水平位移约束在当前视口内，同时让极窄窗口中的图片缩到可用宽度。保留横向、纵向的平滑跟随。
- `tests/e2e/motion-batch4.spec.ts`：增加真实 bfcache 后退、迟到脚本、键盘聚焦和缩小窗口三条回归用例。前三项都在桌面 Edge 中通过；触屏本就没有悬停预览，相关用例按原产品行为跳过。
- 修复后验证：单元测试 **307 通过**；第四批专项 **18 通过、4 跳过、0 失败**；第三批影像页专项 **30 通过、4 跳过、0 失败**。两次专项端到端运行均完成构建。本轮没有重跑全站 805 项用例。
- 修复后截图：[640 px 键盘预览](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/preview-keyboard-640-fixed.png)、[320 px 键盘预览](../../../.superpowers/reviews/2026-10-06-motion-batch4-codex/preview-keyboard-320-fixed.png)。图片右边界分别为 624 / 296 px，均在视口内。

工作区仍在 `redesign` 分支，HEAD 为 `6918655`；修复代码与本报告是本地未提交内容，尚未上线。
