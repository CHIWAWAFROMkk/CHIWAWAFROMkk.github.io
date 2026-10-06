# 动效第三批与去 React：交接说明（供查 bug）

日期：2026-10-05 · 实现：Claude · 分支 `redesign`（未上线）

## 改了什么

| 提交 | 内容 |
|---|---|
| `d222258` | GPT 的第一、二批原样提交（React Bits + GSAP） |
| `09dad69` | 去掉 React：四个组件改为 `.astro` + 原生增强脚本，输出的 DOM 与原来一致；修两处原有的布局跳动 |
| （本次） | 第三批：两个影像页接入统一动效，加胶片颗粒、红裙显色、遮幅开幕、磁吸按钮 |

### 去 React
- `src/components/rb/{SplitText,ScrollReveal,Magnet,SpotlightCard}.astro`：服务端输出完整文字；脚本分别在 `src/scripts/motion/split-title.ts`、`reveal.ts`（原有）、`pointer.ts`。
- 依赖删除：`@astrojs/react`、`react`、`react-dom`、`@gsap/react`；`astro.config.mjs` 去掉 React 分包。
- 每页少约 69 KB（gzip）；站内自写动效脚本合计几 KB，GSAP 单独计算，约 49 KB。

### 两处原有的布局跳动（重复跑测试时暴露）
- 项目页标签行：网页字体到达后标签变宽、折行。现在 640 px 以下每个标签独占一行；`Base.astro` 预加载两个 26 KB 的英文字体子集。对照实验：React 版 24 次中跳 13 次，修复后多轮重复为 0 次。
- SQL 工作台：默认查询结果晚到，结果区从 1 px 长到 209 px。现在 `#sql-results:empty` 预留 209 px。

### 第三批（影像两页）
- `JungView` / `FilmView`：去掉 `motion={false}`；荣格页标题用 `deferTitle`，因为开场占满首屏。
- `src/components/FilmMotion.astro` + `src/scripts/motion/film-motion.ts`：
  - `data-fm="bloom"`（`FilmRed`，S04）：叠一张同图的灰度副本，进入视口后淡出，只有红裙最后显出红色。
  - `data-fm="letterbox"`（`JungFilm` 视频）：上下各 12.5% 的遮幅条，用 `scaleY` 收起。
  - 只有加载时位于首屏以下的元素才会进入起始状态（`fm-armed`），已在屏上的不会先藏起来再播。
- `base.css`：`body.night::before` 胶片颗粒，内联 SVG 噪声，`z-index:-1`，`opacity:0.06`，每秒约 12 帧跳动，减少动态模式下静止；`body.night` 加 `isolation: isolate`；`.night-zone` 在夜间页改为透明背景。
- `JungPrologue`：两个按钮外包 `Magnet`，位移不超过 6 px，触屏下不启用。

## 有意为之，不是 bug
- 标题拆字只持续约 0.9 秒，播完会还原成整段文字。测试用 `recordSplits`（`tests/e2e/motion-budget.ts`）在拆分发生的瞬间记录快照，不去抓 DOM 的中间状态。
- 已经在视口内的延迟标题（例如直接跳到某个位置）不再播放入场动画，这是 GPT 原设计的安全规则。
- 灰度副本和 `fm-still` 是同一个图片 URL，浏览器缓存后只下载一次。

## 建议重点检查
1. Safari/iOS：`body.night::before` 固定定位加上负 `z-index` 在 `isolation` 下的层级；遮幅条盖住 `<video>` 时，iOS 原生控件是否被挡（动画结束后 `scaleY(0)`）。
2. 用户在动画进行中切换系统"减少动态"：`film-motion.ts` 的 `settle()` 会直接显示最终状态。
3. 窄屏（320 px）下荣格开场的按钮被 `Magnet` 包裹后的换行。
4. 用 bfcache 返回页面后，磁吸和光斑是否重复绑定（`data-magnet-ready` / `data-spot-ready` 已做防重）。

## 验证
- `npx vitest run`：304 项通过。
- `npx playwright test`：790 项通过，222 项按设计跳过，0 项失败（Edge，桌面加手机两种视口）。
- 新增 `tests/e2e/motion-batch3.spec.ts`，30 项。

## 第四批：把第一、二批的动效做得看得见（Claude，同日）

针对"GPT 版效果太淡、只集中在首屏第一秒"：
- 共用调度 `src/scripts/motion/arm.ts`：`armOnScroll`（只给首屏以下的元素设起始状态 `.m-armed`，滚入后加 `.m-in`）和 `stage`（首屏编排；遮罩未退或已过 2.5 秒保险线时不再隐藏已可见内容）。
- 段落标题（`heads.ts`）：分隔线从左画出，标题和旁注从下方升起；`reveal.ts` 的导语改为逐字/词升起。
- 项目页摘要五行依次展开（线→标签→内容），"约 2000 名员工"这类数量从 0 数到实际值（`countable.ts` 只数"数字+量词"，年份、日期、百分比、小数不动；格式保持原样，不会经过"1,260"）。
- 首页两扇门在姓名之后依次升起（`Gate.astro`）。
- 项目页的程序区进入视口时，顶部红线扫过、内容分层升起（`ProjectMotion.astro`，仅浅色页）。
- 项目列表：编号数到位；悬停预览改为 transform 跟随鼠标的横纵两个方向（变量由 `--x` 改为 `--px`/`--py`）。
- 影像页的 `film-motion.ts` 改用同一套 `arm.ts`，class 统一为 `m-armed`/`m-in`。

测试：`tests/e2e/motion-batch4.spec.ts`（15 项）；`numbers.spec.ts` 与四处 axe 无障碍测试改为在"减少动态"下运行（它们检查内容，不应在淡入途中取色）；磁吸测试等入场动画结束后再取坐标。全量 805 通过、0 失败。

建议重点检查：`prefers-reduced-motion` 在页面打开后切换；慢网下 `ProjectMotion` 脚本在 2.5 秒后才到；`.p-row` 的 `::before` 画线在高分屏上的 1px 对齐；`countup-dom` 在窄屏遇到会换行的数字时保持静态（属原有保护）。
