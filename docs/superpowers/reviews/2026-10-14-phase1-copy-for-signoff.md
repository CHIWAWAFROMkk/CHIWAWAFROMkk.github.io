# 第一期待确认文案（2026-10-14）

> **状态（2026-10-15）**：用户回复"确认文案"，第 1–32 条统一确认。确认前 Claude 按《求职与经历档案》逐条核对，改了两处超出档案的写法（第 29 条第 3、5 项：Copilot 不再写成"Copilot（AI Builder）"；"资料存于 SharePoint"改为"另用 SharePoint、AI Builder"）。
> 第 3、30、31 条的"手写件一律人工复核"：档案原无此句，用户 2026-10-15 确认属实，保留（已记入共享记忆收件箱，待补进经历档案）。
> HRIS 站的详情页标题由用户交给 Claude 决定：HRIS 站上统一用卡片标题（如"人岗匹配评估引擎"），主站保持原标题。

以下文字由 Claude 起草或改写，**确认前不上线**。原文从代码中直接提取，与网站上显示的一字不差。逐条在"确认 / 修改为"后面填写即可。

另有一项显示上的取舍需要你看：手机上首页的执行轨迹图压成了 56px 高的细条、不显示步骤名，这样两扇入口门都能留在第一屏。截图见 `test-results/phase1/phone-full_.png`。

### 1. 一句话介绍（F1，`src/data/facts.ts`）

- 中文：设计并验收 AI 工作流与工具：实习中把员工档案补录做成在公司环境运行的 AI 工作流；课余借助 AI 编程工具，把产品想法做成能在浏览器里运行的原型。
- English: I design and sign off AI workflows and tools: during my internship I turned employee-records backfill into an AI workflow that ran at the company, and on my own time I use AI coding tools to turn product ideas into prototypes that run in the browser.
- 说明：首页和一分钟概览顶部都显示这一句。
- 确认 / 修改为：___

### 2. 个人求职 Agent · 方案取舍（`SITE.pages.career.summary.tradeoff`）

- 中文：公开演示用确定性的规则匹配：同样的输入总得到同样的分数，每条判断都能追溯到一条事实，访客改了输入可以当场复核。
- English: The public demo uses deterministic rule matching: the same input always gives the same score, every judgement traces back to a fact, and a visitor who changes the input can check the result on the spot.
- 确认 / 修改为：___

### 3. 员工档案补录 AI 工作流 · 方案取舍（`SITE.pages.hris.summary.tradeoff`）

- 中文：模型只提供候选值，写入由人工审核决定；手写件最容易出错，一律进入人工复核。
- English: The model only proposes values and a person decides what is written; handwritten files are the most error-prone, so every one goes to manual review.
- 确认 / 修改为：___

### 4. QuotaDeck · 方案取舍（`SITE.pages.quota.summary.tradeoff`）

- 中文：读不到额度时显示"未知"，不当作用完；估算、过期快照和断连都标明来源，刷新失败时保留上次成功的数据和时间，不假装刚同步。
- English: A quota that cannot be read shows as "unknown", not as used up; estimates, stale snapshots and disconnects are labelled with their source, and a failed refresh keeps the last good data and its time instead of pretending to be fresh.
- 确认 / 修改为：___

### 5. 校园外卖：SQL 工作台与经营分析 · 方案取舍（`SITE.pages.campus.summary.tradeoff`）

- 中文：先把一笔订单拆成相互约束的表，再用事务保证下单、支付、配送、退款要么全部写入、要么全部回滚；经营分析用固定种子生成的合成数据，只说明方法，不代表真实经营。
- English: An order is split into tables that constrain each other, and transactions make ordering, payment, delivery and refunds all land or all roll back; the analysis uses seeded synthetic data and shows a method, not real trading.
- 确认 / 修改为：___

### 6. AI 校园应用研究 · 方案取舍（`SITE.pages.aiCampus.summary.tradeoff`）

- 中文：当年的原研究与后来的浏览器重建分开写：重建只复现分析方法，构造样本都有标注，不当作当年的调查结果。
- English: The original study and its later browser rebuild are kept apart: the rebuild only reproduces the method, and its constructed samples are labelled and never presented as survey results.
- 说明：原草稿写了"2024 年 / 2026 年"，单独的年份不在事实台账里，改成了"当年 / 后来"。
- 确认 / 修改为：___

### 7. 个人求职 Agent · 下一步（`SITE.pages.career.summary.next`）

- 中文：下一步：把大模型的语义判断接入公开演示，与规则结果并排展示并标明来源。
- English: Next: bring a language model’s semantic judgement into the public demo, shown beside the rule result with its source labelled.
- 说明：这是对迭代方向的表态，对应 spec 第三期；近期不打算做的话可以删掉。
- 确认 / 修改为：___

### 8. 项目卡 · 员工档案补录 AI 工作流 · 标题（`SITE.projects`）

- 中文：员工档案补录 AI 工作流
- English: HR Records Backfill — AI Workflow
- 确认 / 修改为：___

### 9. 项目卡 · 员工档案补录 AI 工作流 · 简介（`SITE.projects`）

- 中文：核查约 2000 名员工的档案主数据；把补录迭代成三版 AI 工作流，最终版基于 Copilot + Power Automate，在公司批准的环境中运行
- English: Reviewed master records for about 2000 employees and iterated the backfill into an AI workflow over three versions; the final one, on Copilot + Power Automate, ran in the company-approved environment
- 确认 / 修改为：___

### 10. 项目卡 · 员工档案补录 AI 工作流 · 状态（`SITE.projects`）

- 中文：已结束 · 最终版已在公司环境运行
- English: Finished · final version ran at the company
- 确认 / 修改为：___

### 11. 项目卡 · 校园外卖 · 标题（`SITE.projects`）

- 中文：校园外卖：SQL 工作台与经营分析
- English: Campus Delivery: SQL Lab & Insights
- 确认 / 修改为：___

### 12. 项目卡 · 校园外卖 · 简介（`SITE.projects`）

- 中文：个人负责的课程设计：8 张业务表、事务与复合外键；在同一套表上扩展一个学期的合成数据，回答五个经营问题。浏览器里的工作台与分析页借助 AI 编程工具开发
- English: A course project I was responsible for: 8 business tables with transactions and composite keys, extended with a synthetic term of orders to answer five business questions. The in-browser lab and the analysis were built with AI coding tools
- 确认 / 修改为：___

### 13. 项目卡 · 校园外卖 · 状态（`SITE.projects`）

- 中文：课程设计 · 分析页为合成数据
- English: Course project · analysis uses synthetic data
- 确认 / 修改为：___

### 14. 开场词 WORKFLOW

- 中文说明：Agent 工作流
- English: Agent workflows
- 确认 / 修改为：___

### 15. 开场词 PRODUCT

- 中文说明：AI 产品
- English: AI products
- 确认 / 修改为：___

### 16. 开场词 FILM

- 中文说明：AIGC 影像
- English: AIGC film
- 确认 / 修改为：___

### 17. 首页标题（`SITE.pages.home.title`）

- 中文：何彦钧 · AI 产品 · Agent 工作流 · AIGC 影像
- English: Yanjun He · AI Products · Agent Workflows · AIGC Film
- 确认 / 修改为：___

### 18. 首页描述（`SITE.pages.home.description`）

- 中文：何彦钧的作品集：实习中落地的员工档案补录 AI 工作流，能在浏览器里运行的求职 Agent 与 QuotaDeck，以及 AIGC 影像作品。可以一分钟了解，也可以查看项目过程与在线演示。
- English: Portfolio of Yanjun He: an employee-records AI workflow delivered during an internship, a job agent and QuotaDeck that run in your browser, and AIGC film work. Take the one-minute overview or dig into the projects and live demos.
- 确认 / 修改为：___

### 19. 项目页导语（`SITE.pages.projects.lead`）

- 中文：AI 产品与工作流是主要作品，每个项目都能打开看过程与取舍，或在浏览器里亲手运行；AIGC 影像与互动作品单列在后。
- English: AI products and workflows are the main work: open any project for the process and trade-offs, or run it in your browser. AIGC film and interactive work follow.
- 确认 / 修改为：___

### 20. 摘要第一栏标签（`SITE.summaryLabels.task`）

- 中文：问题与场景
- English: Problem & context
- 说明：原计划叫"痛点与场景"；"痛"字不在网站的中文字体子集里，这台电脑上没有字体源文件、无法重新生成子集，所以暂用"问题与场景"。
- 确认 / 修改为：___

## 第二期（HRIS 站，`/hris/`）

以下是第二期新增的文字，同样**确认前不上线**。编号接第一期往下排。HRIS 站不进搜索引擎、不在主站露出入口，但发出去的链接任何人都能打开，所以同样要你逐字确认。

另有一项显示上的取舍需要你看：深色主题下，项目页里嵌着的演示仍放在浅色纸底面板上（与第一期设计一致）；但"流程终端"整页就是演示，所以它跟随深色主题，不再整页变成浅色。截图见 `test-results/phase2/desktop-dark_hris_workbench_.png`。

### 21. 首屏标题（`HRIS.hero.title` + `HRIS.hero.titleSoft`）

- 1）中文：将非标人事流程，重构为
  English: Turning non-standard HR processes into
- 2）中文：可稽核的数据资产。
  English: data you can audit.
- 说明：第一行粗体，第二行细体灰色；中文在逗号后换行。
- 确认 / 修改为：___

### 22. 首屏导语（`HRIS.hero.lead`）

- 中文：丹纳赫实习期间，核查约 2000 名员工的档案主数据；把档案补录工作流迭代三版，最终版基于 Copilot + Power Automate，在公司批准的环境中运行，并交接给 mentor。
- English: During my internship at Danaher I reviewed master records for about 2000 employees and iterated the records backfill into three versions; the final one, on Copilot + Power Automate, ran in the company-approved environment and was handed over to my mentor.
- 确认 / 修改为：___

### 23. 首页数字条四条说明（`HRIS.ledger`）

- 1）中文：6,000+ — 实习公司 CDP 系统覆盖的员工数（系统规模）
  English: 6,000+ — Employees covered by the company’s CDP system (system scale)
- 2）中文：2000 — 本人核查的档案主数据，约数
  English: 2000 — Employee master records I reviewed, approximately
- 3）中文：3 — 档案补录工作流迭代的版本
  English: 3 — Versions of the records backfill workflow
- 4）中文：8 — 校园外卖课程设计的业务表
  English: 8 — Business tables in the campus delivery course project
- 说明：6,000+ 的主语是系统；约 2000 是本人核查的范围。
- 确认 / 修改为：___

### 24. 技能三组（`HRIS.skills`）

- 1）中文：数据与报表：Excel（数据透视表、函数、图表）· SQL · Python（Pandas、NumPy）· 数据分析与可视化
  English: Data & reporting: Excel (pivot tables, functions, charts) · SQL · Python (Pandas, NumPy) · data analysis and visualisation
- 2）中文：流程与 AI 工具：Microsoft 365 Copilot · Power Automate · SharePoint · ChatGPT · DeepSeek
  English: Workflow & AI tools: Microsoft 365 Copilot · Power Automate · SharePoint · ChatGPT · DeepSeek
- 3）中文：语言：CET-6 550 分
  English: Languages: CET-6: 550
- 确认 / 修改为：___

### 25. 一分钟版·实习要点五条（`HRIS.brief.points`）

- 1）中文：对接全国各区域 HR，跟进员工信息缺失与异常数据，推动档案补全。
  English: Worked with regional HR teams across China to chase missing and inconsistent employee data until the records were complete.
- 2）中文：核查约 2000 名员工的档案主数据；所在 CDP 系统覆盖 6,000+ 员工。
  English: Reviewed master records for about 2000 employees, in a CDP system covering 6,000+ staff.
- 3）中文：设计并使用档案补录工作流，迭代三版，最终版在公司批准的环境中运行并交接给 mentor。
  English: Designed and used the records backfill workflow over three versions; the final one ran in the company-approved environment and was handed over to my mentor.
- 4）中文：用 Excel 整理和分析合规数据，输出可视化报表。
  English: Organised and analysed compliance data in Excel and produced visual reports.
- 5）中文：因工作表现获得 HRBP 认可，被邀请延长实习。
  English: Invited by the HRBP to extend the internship on the strength of my work.
- 说明：来源：经历档案 4.1；"被邀请延长实习"按档案只写半句，不写是否延长、延长多久。
- 确认 / 修改为：___

### 26. 全部项目五张卡（`HRIS.cards`）

- 1）中文：员工电子档案补录与主数据治理 — 核查约 2000 名员工的档案主数据；把补录拆成主名单、查找档案、确认身份、提取候选、HR 审核、写回核对六步，最终版基于 Copilot + Power Automate 在公司环境运行
  English: Employee Records Backfill & Master Data — Reviewed master records for about 2000 employees and split the backfill into six steps (roster, find file, confirm identity, extract candidates, HR review, write back and verify); the final version ran at the company on Copilot + Power Automate
- 2）中文：人岗匹配评估引擎 — 从求职一侧做的人岗匹配：把职位要求与候选人事实逐条对照，每条判断都能追溯到事实；借助 AI 编程工具开发
  English: Job–Candidate Matching Engine — Matching built from the job seeker’s side: each requirement is set against the candidate’s facts and every judgement traces back to one; built with AI coding tools
- 3）中文：校园业务数据库建模与 SQL 分析 — 个人负责的课程设计：8 张业务表、事务与复合外键；在同一套表上用 SQL 回答五个经营问题，分析页为合成数据
  English: Campus Database Modelling & SQL Analysis — A course project I was responsible for: 8 business tables with transactions and composite keys, then five business questions answered in SQL on the same schema (the analysis uses synthetic data)
- 4）中文：问卷设计与数据清洗：AI 校园应用研究 — 项目组长：设计问卷、清洗数据并做交叉统计，获校级大学生创新创业项目一等奖
  English: Survey Design & Data Cleaning: AI on Campus — Team lead: survey design, data cleaning and cross-tab analysis; First Prize, university student innovation programme
- 5）中文：QuotaDeck：多服务额度汇总工具 — 借助 AI 编程工具开发的桌面工具：把多家 AI 服务的额度集中到一处，读不到的数据标为未知
  English: QuotaDeck: Quotas in One Place — A desktop tool built with AI coding tools: quotas from several AI services in one place, with anything unreadable marked unknown
- 确认 / 修改为：___

### 27. 流程终端·第一版（`VERSIONS.v1`）

- 1）中文：个人实践原型
  English: Personal prototype
- 2）中文：OpenClaw 调用 DeepSeek、ChatGPT 提取字段
  English: OpenClaw calls DeepSeek and ChatGPT to extract fields
- 3）中文：模型只给候选，写入由人工决定
  English: The model only proposes; a person decides what is written
- 说明：第一条是这一版的性质，其余是做法。
- 确认 / 修改为：___

### 28. 流程终端·第二版（`VERSIONS.v2`）

- 1）中文：个人实践
  English: Personal practice
- 2）中文：本地 OCR 识别扫描件
  English: Local OCR reads the scans
- 3）中文：DeepSeek 从识别结果里提取字段
  English: DeepSeek extracts fields from the OCR text
- 4）中文：模型只给候选，写入由人工决定
  English: The model only proposes; a person decides what is written
- 说明：第一条是这一版的性质，其余是做法。
- 确认 / 修改为：___

### 29. 流程终端·最终版（`VERSIONS.final`）

- 1）中文：在公司批准的环境中运行，已交接给 mentor
  English: Ran in the company-approved environment; handed over to my mentor
- 2）中文：Power Automate 按工号查找文件并返回工号
  English: Power Automate finds each file by employee ID and returns the ID
- 3）中文：Copilot 识别图像中的字段
  English: Copilot reads the fields in the image
- 4）中文：分流：通过的自动录入，其余转人工复核
  English: Routing: passed records are entered automatically; the rest go to manual review
- 5）中文：Excel 作为数据载体，另用 SharePoint、AI Builder
  English: Excel holds the data; SharePoint and AI Builder are also used
- 说明：第一条是这一版的性质，其余是做法。
- 确认 / 修改为：___

### 30. 流程终端·分流与复核规则（`ROUTING`）

- 1）中文：无法识别、识别不清、字段缺失 → 转人工复核
  English: Unreadable, unclear or missing fields → manual review
- 2）中文：手写件最容易出错 → 一律人工复核
  English: Handwritten forms are the most error-prone → always manual review
- 3）中文：核验完成 → 自动录入
  English: Verified → entered automatically
- 4）中文：每满 100 份 → 这 100 份全部人工核对一次，不是抽查
  English: Every 100 files → all 100 are checked by hand, not sampled
- 确认 / 修改为：___

### 31. 流程终端·手写件案例（`DEMO-006`，虚构）

- 1）中文：资料是手写填写的登记表，字迹可以辨认。
  English: The record is a handwritten form; the writing is legible.
- 2）中文：候选字段已提取，但手写件一律转人工复核，不自动录入。
  English: Candidate fields are extracted, but handwritten forms always go to manual review and are never entered automatically.
- 3）中文：HR 对照原件逐项核对后再录入。
  English: HR checks each field against the original before entry.
- 4）中文：花名册第 6 行：DEMO-006 员工己
  English: Roster row 6: DEMO-006 Employee F
- 5）中文：找到 DEMO-006_员工己.pdf（手写登记表扫描件）
  English: Found DEMO-006_EmployeeF.pdf (scan of a handwritten form)
- 6）中文：工号、姓名与文件内容一致
  English: ID and name match the document
- 7）中文：候选：住址、紧急联系人（手写）
  English: Candidates: address, emergency contact (handwritten)
- 8）中文：手写件 → 转人工复核
  English: Handwritten → manual review
- 确认 / 修改为：___

### 32. 事实台账 F15（`src/data/facts.ts`）

- 中文：每满 100 份全部人工核对一次
- English: every 100 files are all re-checked by hand
- 说明：流程终端的"每满 100 份"一条引用这里。
- 确认 / 修改为：___

## 第三期（QuotaDeck 0.7.0：贴边 HUD 与新完整版）

以下是 QuotaDeck 更新后新写或改写的文字，**确认前不上线**。编号接第二期往下排。事实只取自 QuotaDeck 0.7.0（175d31c）的 README 与共享记忆里的 QuotaDeck 记录；不写已删掉或不确定的功能（并行分工、托盘大窗口、模型库）。

分工按记录写：GPT 写后端，Claude 写前端与审查；批准卡片由 DeepSeek 按 Claude 写的计划实现、Claude 审查；批准流程在真实 Claude Code 会话里的验收是 Claude 做的，所以"我的工作"里不写验收批准流程。

字体限制下的用词：网站的中文字体子集没有"刘、胶、囊、晕、翅、游、戏"等字，这台电脑也无法重新生成子集，所以"刘海"写作"顶部黑块（Notch）"，"光晕"写作"外圈的光"，"游戏模式"写作"按 Ctrl+Alt+H 或在托盘菜单里勾选对应的开关"。

**Claude 精修（2026-10-23）**，改动如下，其余条目逐句核对后保持原样：
- 第 45 条（正文）：改正一处事实。游戏模式期间来的提醒是"先留着，HUD 回来后照常出现"（按 0.7.0 README），原中文写成"照常出现"，意思反了。补上 README 里的一句老实话："很长的命令（比如编译）也会被标成 Waiting"。开头一段拆成短句。英文表格里 "The token" 改成 "The sign-in token"，免得和 Token 柱混淆。
- 第 37 条：标签"Electron 界面原样运行"改为"桌面 HUD 原样运行"，访客不一定知道 Electron。
- 第 41 条：英文图注里的 "capsule" 改为 "block"，和中文"一块黑色"、正文一致。
- 第 42 条：中文副标题"前端原样运行"改为"界面文件原样运行"，和英文、其他几处说法一致。
- 第 43 条第 6 行写的"Token 柱长出新的一格"，以前只在第一轮成立，从第二轮起看不到变化。演示已修好，现在每一轮都会长出新的一格（有 e2e 测试）。

另有两项内容要你看：项目页正文 `src/copy/projects/quota-deck.{zh,en}.md` 整篇重写（第 45 条只列要点）；完整版的演示在 `/projects/quota-deck/live/`。

### 33. 卡片简介（`SITE.projects` quota-deck `did`）

- 中文：借助 AI 编程工具开发的 Windows 小工具：屏幕边上一条浮条看多家 AI 服务的额度；Claude Code、Codex 做完一轮或等批准时，在浮条上提醒
- English: A Windows tool built with AI coding tools: a strip on the screen edge shows several AI services' quotas, and tells you when Claude Code or Codex finishes a turn or waits for approval
- 确认 / 修改为：___

### 34. HRIS 站卡片简介（`HRIS.cards['quota-deck'].did`）

- 中文：借助 AI 编程工具开发的 Windows 小工具：贴边浮条集中显示多家 AI 服务的额度，读不到的标为未知；Agent 做完一轮或等批准时提醒
- English: A Windows tool built with AI coding tools: an edge strip shows quotas from several AI services, marks anything unreadable unknown, and tells you when an agent finishes a turn or waits for approval
- 确认 / 修改为：___

### 35. 项目页描述（`SITE.pages.quota.description`）

- 中文：QuotaDeck：Windows 桌面上的 AI 额度 HUD。贴边浮条看各家额度，Claude Code、Codex 做完一轮或等批准时提醒你。MIT 开源。
- English: QuotaDeck: an AI quota HUD for the Windows desktop. An edge strip shows each service's quota and tells you when Claude Code or Codex finishes a turn or waits for approval. MIT licensed.
- 确认 / 修改为：___

### 36. 项目页摘要（`SITE.pages.quota.summary`：问题、取舍、我的工作、工具、证据、状态）

- 1）中文：额度分散在不同 Agent 和 API 里，同一个账户余额在十几个模型下重复出现；离开电脑一阵子回来，也不知道哪个 Agent 做完了、哪个在等批准。
  English: Quotas are scattered across agents and APIs, and one account balance shows up under a dozen models; step away for a while and you cannot tell which agent is done and which is waiting for approval.
- 2）中文：读不到额度时显示"未知"，不当作用完；估算、过期快照和断连都标明来源，刷新失败时保留上次成功的数据和时间，不假装刚同步。
  English: A quota that cannot be read shows as "unknown", not as used up; estimates, stale snapshots and disconnects are labelled with their source, and a failed refresh keeps the last good data and its time instead of pretending to be fresh.
- 3）中文：选定方向与范围：界面照 Agent HUD 复刻，提醒只读会话日志、不改 Agent 配置；定下额度的呈现规则（额度池与模型分开，读不到不当作用完）和提醒规则（做完了、等待、批准）；验收界面与连接。
  English: Chose the direction and the scope: the interface copies Agent HUD, and reminders only read session logs without changing any agent's settings; set the quota display rules (pools apart from models, unreadable is not used up) and the reminder rules (done, waiting, approval); signed off the interface and the connections.
- 4）中文：代码借助 AI 编程工具编写：GPT 写后端，Claude 写前端并审查合并；批准卡片由 DeepSeek 按 Claude 写的计划实现、Claude 审查。Electron 与 Node.js，读取数据放在主进程，界面只通过受限接口拿数据。
  English: The code was written with AI coding tools: GPT wrote the back end, Claude wrote the front end and reviewed and merged; the approval cards were implemented by DeepSeek from Claude's plan and reviewed by Claude. Electron and Node.js, with data reads in the main process and the interface getting data only through a restricted bridge.
- 5）中文：本页的桌面版截图（合成数据）与完整版、公开源码与自动检查；批准卡片在真实的 Claude Code 会话里验收过。
  English: The desktop screenshots on this page (synthetic data) and the live edition, the public source and its automated checks; approval cards were signed off in a real Claude Code session.
- 6）中文：个人项目，MIT 开源；0.7.0 已发布，仍在开发。截图与完整版均为合成数据。
  English: Personal project, MIT licensed; 0.7.0 is out and work continues. The screenshots and the live edition use synthetic data.
- 说明：取舍一栏沿用原文。"我的工作"写明界面照 Agent HUD 复刻。
- 确认 / 修改为：___

### 37. 完整版导语与描述（`SITE.pages.quotaLive` lead、description、tags）

- 1）中文：真实的 HUD 前端，模拟的一个下午。
  English: The real HUD, a simulated afternoon.
- 2）中文：QuotaDeck 完整版：桌面 HUD 的真实界面文件在浏览器里运行，一分半钟走完一个下午；做完了提醒、批准请求和等待都由 QuotaDeck 自己的代码算出，批准按钮只影响演示。
  English: The live edition of QuotaDeck: the desktop HUD's real interface files run in your browser through an afternoon in a minute and a half; done reminders, approval requests and waits are all worked out by QuotaDeck's own code, and the approval buttons only change the demo.
- 3）中文：完整版 · 在浏览器里运行
  English: Live edition · runs in your browser
- 4）中文：桌面 HUD 原样运行
  English: The desktop HUD, unchanged
- 确认 / 修改为：___

### 38. 完整版摘要（`SITE.pages.quotaLive.summary`）

- 1）中文：让访客不装软件，也能看到 QuotaDeck 在桌面上怎样提醒：哪个 Agent 做完了、哪个在等批准。
  English: Let visitors see, without installing anything, how QuotaDeck tells you on the desktop which agent is done and which is waiting for approval.
- 2）中文：定下演示边界：界面文件与会话状态逻辑原样运行，只有时钟和数据是模拟的；批准与拒绝只改演示状态，不执行任何命令。
  English: Set the demo's limits: the interface files and the session logic run unchanged, only the clock and the data are simulated; allowing and denying only change the demo, and no command ever runs.
- 3）中文：借助 AI 编程工具开发；QuotaDeck 的界面与四个纯逻辑模块原样在页面里运行，加载器只放行这四个模块，读本机或联网的代码一概不加载。
  English: Built with AI coding tools; QuotaDeck's interface and four pure logic modules run unchanged in the page, and the loader allows only those four, so no code that reads the computer or the network is loaded.
- 4）中文：本页的演示、逐文件校验值清单与测试；下方的桌面版截图。
  English: The demo on this page, the per-file checksum manifest and tests; the desktop screenshots below.
- 5）中文：完整版 · 在浏览器里运行；不读取你的电脑或任何账号。
  English: Live edition · runs in your browser; nothing on your computer or in any account is read.
- 说明：状态一栏沿用原文。
- 确认 / 修改为：___

### 39. 完整版入口（`EDITIONS.quota` teaser 与正文）

- 1）中文：看 HUD 怎样提醒你：做完了、等批准 →
  English: See how the HUD tells you: done, waiting for approval →
- 2）中文：QuotaDeck 的真实界面文件原样运行，一分半钟走完一个下午：Agent 做完一轮、请求批准、等待，你随时可以点开卡片、批准或拒绝。只有时钟和数据是模拟的。
  English: QuotaDeck's real interface files run unchanged through an afternoon in a minute and a half: an agent finishes a turn, asks for approval, waits, and you can open a card, allow or deny at any time. Only the clock and the data are simulated.
- 3）中文：浮条与卡片是公开仓库固定版本的真实界面文件；会话状态和额度换算由 QuotaDeck 自己的代码算出。不读取你的电脑或任何账号，批准与拒绝只改演示状态、不执行任何命令。演示不可用时，下方有桌面版截图。
  English: The strip and the cards are the real interface files of a pinned commit of the public repository; session states and quota figures are worked out by QuotaDeck's own code. Nothing on your computer or in any account is read, and allowing or denying only changes the demo; no command runs. If the demo cannot start, the desktop screenshots below still show the interface.
- 确认 / 修改为：___

### 40. ~~首页 / 一分钟概览的 QuotaDeck 截图说明（`SITE.shots`）~~ 已撤回

- 2026-10-23 按你的要求，QuotaDeck 不在首页和一分钟概览的截图里单独露面，这条文字随之删除，无需确认。以下保留原文备查。

- 1）中文：QuotaDeck 的 HUD：Claude 做完一轮后的提醒卡片与贴边浮条
  English: QuotaDeck's HUD: Claude's done reminder card beside the edge strip
- 2）中文：QuotaDeck 的真实 HUD 在网页里运行：做完了的提醒与批准请求
  English: QuotaDeck's real HUD running in the browser: done reminders and approval requests
- 确认 / 修改为：___

### 41. 桌面版截图图注（`QuotaShots`）

- 1）中文：贴边浮条：每家一个额度环，数字是已用比例，余额类写余额
  English: Edge strip: one ring per service; the number is the share used, or the balance for prepaid ones
- 2）中文：额度卡片：5 小时与每周窗口、重置时间，以及过去一天的 Token 柱
  English: Quota card: 5-hour and weekly windows, reset times, and the past day of token bars
- 3）中文：做完了提醒：Claude Code 一轮结束后留在 HUD 上，直到看过为止
  English: Done reminder: when a Claude Code turn ends, it stays on the HUD until you have seen it
- 4）中文：批准卡片：Claude Code 请求执行命令时，直接在 HUD 上允许或拒绝
  English: Approval card: when Claude Code asks to run a command, allow or deny it on the HUD
- 5）中文：顶部黑块（Notch）：屏幕顶部正中的一块黑色，外圈的光按额度着色，卡片挂在下方
  English: Notch: a black block at the top centre; its glow takes the quota colours, and cards hang below it
- 说明：五张图由 QuotaDeck 自带的桌面测试在合成数据上截取。
- 确认 / 修改为：___

### 42. 完整版舞台文字（`QD_HUD_TEXT`）

- 1）中文：一个下午，在网页里跑真实的 HUD
  English: One afternoon, the real HUD in your browser
- 2）中文：QuotaDeck 0.7.0 · 界面文件原样运行
  English: QuotaDeck 0.7.0 · interface files unchanged
- 3）中文：下面的浮条就是 QuotaDeck 的真实界面文件；会话状态、额度换算也由它自己的代码算出。只有时钟和数据是模拟的：90 秒走完一个下午，你随时可以点开卡片、批准或拒绝。
  English: The strip below is QuotaDeck’s real interface; its session states and quota figures come from its own code. Only the clock and the data are simulated: an afternoon in 90 seconds, and you can open a card, allow or deny at any time.
- 4）中文：模拟数据 · 批准按钮只影响演示，不执行任何命令
  English: Simulated data · the approval buttons only change the demo; no command runs
- 5）中文：界面复刻自 Agent HUD（jazzenchen/agent-hud-open，Apache-2.0）；QuotaDeck 为 MIT 开源，字体 Inter（OFL）、图标 Lobe Icons（MIT）。
  English: The interface copies Agent HUD (jazzenchen/agent-hud-open, Apache-2.0); QuotaDeck is MIT licensed, with the Inter font (OFL) and Lobe Icons (MIT).
- 6）中文：贴边浮条
  English: Edge strip
- 7）中文：顶部黑块
  English: Notch
- 8）中文：可以点浮条上的 Claude 图标，再点 Allow once 或 Deny 试试。
  English: Try clicking Claude on the strip, then Allow once or Deny.
- 9）中文：已允许。在桌面上，Claude Code 会接着执行这条命令；演示里不执行任何命令。
  English: Allowed. On a desktop Claude Code would now run the command; the demo runs nothing.
- 10）中文：已拒绝。在桌面上，这条命令不会执行；演示里本来也不执行任何命令。
  English: Denied. On a desktop the command would not run; the demo runs nothing anyway.
- 11）中文：在真实桌面上，这里会打开对应的 Claude Code 或 Codex 会话。
  English: On a real desktop this opens the matching Claude Code or Codex session.
- 12）中文：这一项在桌面版里设置。
  English: This is set up in the desktop app.
- 13）中文：演示没能加载。下面是同一组界面的截图。
  English: The demo could not load. Screenshots of the same interface follow.
- 14）中文：这个演示需要 JavaScript。下面是同一组界面的截图。
  English: This demo needs JavaScript. Screenshots of the same interface follow.
- 确认 / 修改为：___

### 43. 完整版剧本说明行（`BEATS`）

- 1）中文：0 s · Claude 开始一轮，图标变成在跑的 bot
  English: 0 s · Claude starts a turn; its icon becomes the working bot
- 2）中文：12 s · Claude 做完了一轮：笑脸 bot，伸出 New reply
  English: 12 s · Claude finishes: smiling bot and a New reply capsule
- 3）中文：20 s · Codex 开始；Claude 5 小时额度随消耗上升
  English: 20 s · Codex starts; Claude's 5-hour quota climbs as it works
- 4）中文：32 s · Claude 请求批准一条命令，等你点
  English: 32 s · Claude asks to run a command and waits for you
- 5）中文：50 s · Codex 做完；Claude 的命令 30 秒没结果，显示 Waiting（推测）
  English: 50 s · Codex finishes; Claude's command has run 30 s with no result: Waiting (an inference)
- 6）中文：70 s · Token 柱长出新的一格；DeepSeek 余额减少
  English: 70 s · A new token bar grows; the DeepSeek balance drops
- 7）中文：90 s · 一轮结束，重新开始
  English: 90 s · The afternoon ends and starts over
- 说明：剧本里的会话标题（Build the iOS dashboard 等）与额度数字是合成数据，沿用 QuotaDeck 冒烟测试。
- 确认 / 修改为：___

### 44. 隐私页里关于 QuotaDeck 的两句（`src/copy/privacy.{zh,en}.md`）

- 1）中文：QuotaDeck 完整版运行真实的 HUD 界面文件，但额度、会话和批准请求全部是模拟数据。
  English: the full QuotaDeck edition runs the real HUD interface files, but every quota, session and approval request in it is simulated.
- 2）中文：QuotaDeck 演示不读取你的电脑或任何账号；批准按钮只影响演示，不执行任何命令，也不调用真实的 AI Agent。
  English: The QuotaDeck demo reads nothing from your computer or any account; its approval buttons only change the demo, run no command and call no real AI agent.
- 确认 / 修改为：___

### 45. 项目页正文要点（`src/copy/projects/quota-deck.{zh,en}.md`）

- 开头：贴边浮条看额度；Claude Code、Codex 做完一轮或等批准时提醒。
- 写明"界面照 Agent HUD 简约形态复刻，外观不是我设计的；我做的是选方向与范围、定规则、验收"。
- 分节：贴边浮条、做完了提醒（写明 `Waiting` 是推测，很长的命令也会被标出来）、批准卡片（默认不接入，接入前备份，可一键断开）、顶部黑块（0.7.0 加入）与手动的 Ctrl+Alt+H 隐藏开关（藏起来时来的提醒和批准请求先留着，HUD 回来后照常出现）。
- 连接表更新 Claude Code 一行：只读本机登录信息请求官方用量接口，读不到时用 statusLine；登录凭证只留在主进程。
- 删掉：并行分工、模型库、倍率计算示例、托盘窗口、候选版字样。
- 实现与验证：GPT 写后端、Claude 写前端与审查；批准卡片由 DeepSeek 按 Claude 的计划实现、Claude 审查，并在真实 Claude Code 会话里验收（允许后执行、拒绝后不执行）。
- 确认 / 修改为：___
