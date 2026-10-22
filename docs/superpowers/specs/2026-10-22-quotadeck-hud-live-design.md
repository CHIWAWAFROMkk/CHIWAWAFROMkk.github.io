# QuotaDeck 新完整版：浏览器里跑贴边 HUD（设计）

日期：2026-10-22 · 状态：待用户审阅；**等 QuotaDeck 刘海（HUD 子项目 3）合并到 main 后再实现**

## 1. 背景与已确认的决定

QuotaDeck 0.6.0 把界面换成了贴边 HUD，照 Agent HUD（jazzenchen/agent-hud-open，Apache-2.0）的简约形态一比一复刻。原来的托盘大窗口、并行协作、模型库、额度时间轴和耗尽预测都删了；新增"做完了"提醒（bot 脸）和批准卡片。作品集里的 QuotaDeck 还停在 9 月的 e9557c6。

用户的决定：
- 2026-10-15：作品集里的 QuotaDeck 等它完结后再统一更新。
- 2026-10-21：先录素材（已录，见 `portfolio-site/work/qd-materials/README.md`，仓库外），等刘海做完再改；旧完整版换成新 HUD 的演示。
- 2026-10-22：演示方式为**自动播放，可随时插手**；**不做拖动吸附**，浮条固定在桌面框右边。

## 2. 范围

1. `/projects/quota-deck/live/` 的中英文版换成新演示。HRIS 站的同名页面通过 `track` 自动跟着换。
2. 同一次更新里，QuotaDeck 的卡片、项目页、首页概览截图和状态一起改。文案先起草，用户确认后才上线，与前两期相同。
3. 旧完整版的代码与测试整套删除：`qd-live`、`qd-sim`、`qd-timeline`、`qd-bridge`、`qd-load`、`qd-live-text`、`QuotaLive`、`QuotaShots`、`PlateQuota` 中属于旧版的部分，以及 `public/assets/quotadeck/e9557c6/`。
4. 刘海如果已合并，演示里也放刘海；剧本同时驱动它。

## 3. 怎么运行

和旧完整版的做法相同：**QuotaDeck 的真实文件原样搬进来**，作品集只补"桌面程序"那一半。

- **前端原样**：`src/renderer/hud.html`、`hud*.js`、`hud.css`（刘海相关文件一并）复制到 `public/assets/quotadeck/<提交前 7 位>/`，逐字节一致，测试校验 SHA-256。`host.html` 把 `hud.html` 的正文与样式装进 iframe，再加载它的脚本。
- **桥接**：HUD 前端只通过 `window.hud`（约 17 个方法）和主进程说话。作品集页面提供同名对象 `qd-hud-bridge.ts`：
  - `initial()` 返回条目、Token 柱、设置、会话和布局。
  - `onState` / `onTokens` / `onSessions` / `onSettings` / `onLayout` 由剧本推送。
  - `setSettings` 在内存里生效；尺寸、圆环、数字可以切换。
  - `approve(id, decision)` 只改演示状态：卡片消失，旁边写一句"已允许 / 已拒绝（演示里不执行任何命令）"。
  - `returnTo` 不跳转，提示"在真实桌面上会打开对应的 Claude Code 或 Codex 会话"。
  - `openStats` 弹出统计窗口的截图（素材里的 `stats.png`），注明是截图。
  - `hits`、`drag`、`card`、`strips` 只用于点击穿透和拖动，网页里是空操作。
- **主进程的纯逻辑原样跑在页面里**：`snapshot.cjs`（把服务商快照转成界面数据）、`hud-view.cjs`（圆环、明细、卡片行）、`session-tracker.cjs`（会话状态机：在跑、做完了、等批准）。沿用旧版 `qd-load` 的办法：CommonJS 在页面里求值，Node 模块换成浏览器替身。**任何读本机文件、凭证或联网的模块都不加载**；加载器只放行上面这几个文件。

## 4. 剧本：一个下午，约 90 秒一轮

模拟时钟快进，事件按时间推给真实的 `session-tracker`，界面变化全部由 QuotaDeck 自己的代码算出。

| 时刻 | 事件 | 访客看到 |
|---|---|---|
| 0 s | 五家额度（与冒烟测试同一组合成数）；Claude 开始一轮 | 浮条五个圆环，Claude 图标变成 working 的 bot |
| 12 s | Claude 一轮结束 | 笑脸 bot，伸出 `New reply` 胶囊 |
| 20 s | Codex 开始；Claude 5 小时额度随消耗上涨 | 圆环数字变化，过 70% 变黄 |
| 32 s | Claude 发来批准请求（`Bash: npm test`） | `Approve?` 胶囊；卡片有 Deny / Allow once |
| 32 s 起 | **等访客**；20 秒没操作，就出现一句提示"可以点 Allow once 或 Deny 试试" | 剧本里其他事件照常推进 |
| 50 s | Codex 一轮结束；Claude 某个工具调用超过 30 秒没结果 | Codex 笑脸；Claude `Waiting` |
| 70 s | Token 柱长出新的一格；DeepSeek 余额减少 | 卡片里的柱状图与余额 |
| 90 s | 一轮结束，回到开头 | 页面上有"重新开始"和"暂停" |

访客随时可以：悬停看明细、点开卡片、切换 `%` / `🔥` / `#`、关掉提醒、批准或拒绝、打开设置改尺寸和圆环。插手不会打断剧本：点开的卡片保持打开，后续事件照常推送。

## 5. 页面

- **桌面框**：页面中部一块 16:10 的"桌面"，深色壁纸，HUD 固定在右边缘（不吸附、不拖动）。下方有时钟进度、暂停 / 重新开始，以及事件说明行（例如"12 s · Claude 做完了一轮"），给不熟悉 Agent 的访客看懂发生了什么。
- **手机**：桌面框按宽度等比缩小，HUD 保持可点，卡片打开时放大到可读的尺寸。
- **标注**：框上方写"模拟数据 · 批准按钮只影响演示，不执行任何命令"；框下方写"界面复刻自 Agent HUD（jazzenchen/agent-hud-open，Apache-2.0）；QuotaDeck 为 MIT 开源"，并附两份 LICENSE。
- **没有脚本时**：显示素材截图（浮条、额度卡片、做完了提醒、批准卡片），配文字说明。
- **动效档位**：HUD 自己的动画在 iframe 里，作品集的全局动效规则管不到。所以由桥接把档位传进去：`off` 时剧本不自动播放，改为"下一步"按钮逐步推进，并给 iframe 注入一条"取消动画"的样式；`gentle` 时照常播放，同样注入只保留淡入淡出的样式。

## 6. 不做

- 拖动吸附（用户 2026-10-22 决定）。
- 需要真实桌面才有意义的设置：接入 Claude statusLine、WorkBuddy、审批钩子、DeepSeek 密钥。设置页里这几行置灰，注明"在桌面版里设置"。
- 游戏时安静（刘海子项目里的功能）：网页里无法演示，只在文案里提。
- 真实 Token 统计窗口：用截图代替。

## 7. 诚实与署名

- 文案写清分工：HUD 外观复刻自 Agent HUD；用户负责选方向与范围、五家额度读取、提醒与批准的规则、验收；GPT 写后端，Claude 写前端与审查。不说界面是自己设计的。
- 只说做到的：例如"Waiting 是推测（工具调用超过 30 秒没结果）"，这一点照 QuotaDeck README 写。
- 所有数字来自剧本里的合成数据，不写成真实使用量。

## 8. 测试

- 单元：搬进来的文件 SHA-256 与清单一致；加载器拒绝清单外的模块；剧本按时间推出的会话快照与预期一致（复用真实 `session-tracker`）；批准 / 拒绝只改演示状态。
- 端到端（桌面与手机）：
  - 打开后 12 秒内出现 `New reply`；32 秒出现 `Approve?`，点 Allow once 后卡片消失、说明行出现。
  - 暂停后时钟不动；`off` 档不自动播放，"下一步"能逐步走完。
  - 没有脚本时显示截图。
  - 页面不发出任何对外请求，只加载本站资源。
  - 无横向滚动；数字守卫（合成数字放在 `[data-demo]` 内）。
- 首次加载体积由 `live-size` 从发布文件重新计算，卡片显示新值。

## 9. 实现前要等的

- QuotaDeck 刘海合并到 main，确定要搬的提交号。
- 用同一套采集脚本补录刘海素材（`portfolio-site/work/qd-materials/capture/`）。
- 用户确认 QuotaDeck 新文案（实现时起草，追加到待确认清单）。
