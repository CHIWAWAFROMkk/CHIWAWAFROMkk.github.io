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
