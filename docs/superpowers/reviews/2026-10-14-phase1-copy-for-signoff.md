# 第一期待确认文案（2026-10-14）

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
