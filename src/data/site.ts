import type { Bi } from '../i18n';

export interface ProjectEntry {
  slug: string;
  line: 'data' | 'film';
  inBrief: boolean;
  href: string;
  title: Bi;
  did: Bi;
  status: Bi;
  /** Illustration shown beside the row on the projects index (desktop hover / focus). */
  preview?: string;
}

const project = (p: Omit<ProjectEntry, 'href'>): ProjectEntry => ({ ...p, href: `/projects/${p.slug}/` });

export const SITE = {
  name: { zh: '何彦钧', en: 'Yanjun He' },
  tagline: { zh: '数据分析 · AI 应用 · AI 影像', en: 'Data · Applied AI · AI Film' },
  email: '2806660493@qq.com',
  resume: { zh: '/downloads/resume/heyanjun-resume-zh.pdf', en: '/downloads/resume/heyanjun-resume-en.pdf' },
  nav: {
    label: { zh: '主导航', en: 'Main' },
    skip: { zh: '跳到内容', en: 'Skip to content' },
    brief: { zh: '快速概览', en: 'Overview' },
    projects: { zh: '项目与演示', en: 'Projects & demos' },
    resume: { zh: '下载简历', en: 'Résumé (PDF)' },
    otherLang: { zh: 'English', en: '中文' },
  },
  gate: {
    label: { zh: '选择浏览方式', en: 'Choose how to browse' },
    brief: { index: '01', big: '1:00', href: '/brief/', title: { zh: '一分钟了解我', en: 'Know me in a minute' }, desc: { zh: '经历、项目、影像与联系方式', en: 'Experience, projects, film and contact' } },
    projects: { index: '02', big: 'ALL', href: '/projects/', title: { zh: '查看项目与演示', en: 'See projects & demos' }, desc: { zh: '过程与取舍、在线演示、源码下载', en: 'Process, live demos and source code' } },
  },
  intro: {
    skip: { zh: '跳过', en: 'Skip' },
    words: [
      { word: 'DATA', caption: { zh: 'HR 数据', en: 'HR data' } },
      { word: 'AI', caption: { zh: 'AI 应用', en: 'Applied AI' } },
      { word: 'FILM', caption: { zh: 'AI 影像', en: 'AI film' } },
    ],
  },
  contact: { heading: { zh: '聊聊？', en: "Let's talk." } },
  footer: { privacy: { zh: '隐私与使用说明', en: 'Privacy' } },
  brief: {
    experience: { zh: '经历', en: 'Experience' },
    education: { zh: '教育', en: 'Education' },
    projects: { zh: '项目', en: 'Projects' },
    film: { zh: '影像', en: 'Film' },
    status: { zh: '状态', en: 'Status' },
  },
  summaryLabels: {
    heading: { zh: '一分钟摘要', en: 'In one minute' },
    task: { zh: '任务', en: 'The task' },
    mine: { zh: '我的工作', en: 'What I did' },
    tools: { zh: '工具协作', en: 'Tools & AI' },
    evidence: { zh: '可查证成果', en: 'What you can check' },
    status: { zh: '当前状态', en: 'Status' },
  },
  pager: { label: { zh: '上一个 / 下一个项目', en: 'Previous / next project' } },
  film: {
    pause: { zh: '暂停视频', en: 'Pause videos' },
    play: { zh: '播放视频', en: 'Play videos' },
    hint: { zh: '把鼠标移到画面最右边，看后面的镜头', en: 'Move the pointer to the right edge to see more shots' },
    swipe: { zh: '左右滑动，看完所有镜头', en: 'Swipe sideways to see every shot' },
    /** The 12 shots already rendered as video; titles from the storyboard page. */
    clips: [
      { shot: 'S01', file: 's01', title: { zh: '握枪的手', en: 'The hand on the gun' } },
      { shot: 'S02', file: 's02', title: { zh: '警员停步', en: 'The officer stops' } },
      { shot: 'S03', file: 's03', title: { zh: '高空垂直下降', en: 'Vertical drop from above' } },
      { shot: 'S04', file: 's04', title: { zh: '舞池红裙', en: 'Red dress on the dance floor' } },
      { shot: 'S05a', file: 's05a', title: { zh: '隔着人群对视', en: 'Eyes meet across the crowd' } },
      { shot: 'S05b', file: 's05b', title: { zh: '手下的眼神', en: "The henchman's look" } },
      { shot: 'S06', file: 's06', title: { zh: '共撑一把伞', en: 'Sharing one umbrella' } },
      { shot: 'S07', file: 's07', title: { zh: '天台分烟', en: 'Sharing a cigarette on the roof' } },
      { shot: 'S08', file: 's08', title: { zh: '描他的枪疤', en: 'Tracing his bullet scar' } },
      { shot: 'S09', file: 's09', title: { zh: '戴上对戒', en: 'Putting on the rings' } },
      { shot: 'S10', file: 's10', title: { zh: '百叶窗与耳麦', en: 'Blinds and an earpiece' } },
      { shot: 'S16', file: 's16', title: { zh: '枪响，他倒下', en: 'The shot; he falls' } },
    ],
  },
  projects: [
    project({ slug: 'hris-workflow', line: 'data', preview: '/assets/editorial/hris-flow.svg', inBrief: true,
      title: { zh: '员工电子档案补录', en: 'HR Records Backfill' },
      did: { zh: '核查约 2000 名员工的档案主数据，并把补录流程拆成可审核的工作流', en: 'Reviewed master records for about 2000 employees and turned the backfill into a reviewable workflow' },
      status: { zh: '已结束 · 企业流程为方案设计', en: 'Finished · enterprise flow is a design' } }),
    project({ slug: 'campus-delivery', line: 'data', preview: '/assets/editorial/delivery-relations.svg', inBrief: true,
      title: { zh: '校园外卖 SQL 工作台', en: 'Campus Delivery SQL Lab' },
      did: { zh: '独立完成的课程设计：8 张业务表、事务与复合外键，可在浏览器里直接运行', en: 'Solo course project: 8 business tables with transactions and composite keys, runnable in the browser' },
      status: { zh: '课程设计 · 可在线运行', en: 'Course project · runs online' } }),
    project({ slug: 'campus-delivery/insights', line: 'data', preview: '/assets/previews/campus-insights.svg', inBrief: false,
      title: { zh: '校园外卖经营分析（进阶版）', en: 'Campus Delivery Insights (advanced)' },
      did: { zh: '在课程设计数据库上扩展出一个学期的合成数据：滚动读五个经营问题的答案，再在驾驶舱里自己筛选验证', en: 'A synthetic term built on the course-project database: scroll through five business questions, then filter the dashboard yourself' },
      status: { zh: '进阶版 · 借助 AI 编程工具开发 · 合成数据', en: 'Advanced · built with AI coding tools · synthetic data' } }),
    project({ slug: 'ai-career', line: 'data', preview: '/assets/editorial/career-evidence.svg', inBrief: true,
      title: { zh: '个人求职 Agent', en: 'Personal Job Agent' },
      did: { zh: '借助 AI 编程工具开发的求职辅助工具，每条匹配判断都能追溯到事实证据', en: 'A job-search helper built with AI coding tools; every match traces back to a fact' },
      status: { zh: '个人项目 · 2026.08 至今', en: 'Personal project · 2026.08 – present' } }),
    project({ slug: 'quota-deck', line: 'data', preview: '/assets/editorial/quota-pools.svg', inBrief: true,
      title: { zh: 'QuotaDeck', en: 'QuotaDeck' },
      did: { zh: '借助 AI 编程工具开发的桌面小工具，集中查看多家 AI 服务的额度', en: 'A desktop tool, built with AI coding tools, that shows AI service quotas in one place' },
      status: { zh: '个人项目 · MIT 开源', en: 'Personal project · MIT licensed' } }),
    project({ slug: 'ai-campus', line: 'data', preview: '/assets/editorial/campus-method.svg', inBrief: true,
      title: { zh: 'AI 校园应用研究', en: 'AI on Campus — Study' },
      did: { zh: '项目组长：设计问卷、清洗数据并做交叉统计，获校级大学生创新创业项目一等奖', en: 'Team lead: survey design, data cleaning and cross-tab analysis; First Prize, university student innovation programme' },
      status: { zh: '大创项目 · 2024.03—2024.07', en: 'Student research · 2024.03—2024.07' } }),
    project({ slug: 'stock-data', line: 'data', preview: '/assets/editorial/csv-process.svg', inBrief: false,
      title: { zh: 'CSV 数据分析工具', en: 'CSV Analysis Tool' },
      did: { zh: '上传表格即可检查缺失与重复、查看统计与分布', en: 'Upload a table to check gaps and duplicates and see its statistics' },
      status: { zh: '原型 · 构造样本', en: 'Prototype · synthetic sample' } }),
    project({ slug: 'mais-je-taime', line: 'film', inBrief: true,
      title: { zh: "Mais je t'aime", en: "Mais je t'aime" },
      did: { zh: 'AI 短片的分镜、人物与道具连续性设计，按 BGM 卡点', en: 'Storyboard, character and prop continuity for an AI short, cut to the beat' },
      status: { zh: '60 秒短片：计划 23 镜，已完成视频 12 镜 · 制作中', en: '60-second short: 23 shots planned, 12 rendered as video · in production' } }),
  ] satisfies ProjectEntry[],
  pages: {
    home: {
      title: { zh: '何彦钧 · 数据分析 · AI 应用 · AI 影像', en: 'Yanjun He · Data · Applied AI · AI Film' },
      description: { zh: '何彦钧的作品集：HR 数据实习、AI 工作流与工具项目、AI 短片分镜。可以一分钟了解，也可以查看项目过程与在线演示。', en: 'Portfolio of Yanjun He: HR data internship, AI workflow and tool projects, and an AI short-film storyboard. Take the one-minute overview or dig into the projects and live demos.' },
    },
    brief: {
      title: { zh: '快速概览 · 何彦钧', en: 'Overview · Yanjun He' },
      description: { zh: '一分钟了解何彦钧：到岗信息、实习经历、教育背景、项目与影像作品。', en: 'Yanjun He in one minute: availability, internship, education, projects and film work.' },
    },
    notFound: {
      title: { zh: '页面不存在', en: 'Page not found' },
      body: { zh: '这个页面不存在，或者还在制作中。', en: 'This page does not exist, or is still being built.' },
    },
    campus: {
      title: { zh: '校园外卖 SQL 工作台', en: 'Campus Delivery SQL Lab' },
      lead: { zh: '一笔订单背后，是一组相互约束的记录。', en: 'Behind every order is a set of records that keep each other honest.' },
      description: { zh: '校园外卖课程设计：8 张业务表、事务与复合外键，在浏览器里直接运行 SQL、下单和退款。', en: 'Campus delivery course project: 8 business tables, transactions and composite keys — run SQL, place orders and refunds in the browser.' },
      tags: [ { zh: '课程设计', en: 'Course project' }, { zh: 'SQLite · sql.js · Web Worker', en: 'SQLite · sql.js · Web Worker' } ],
      summary: {
        task: { zh: '用一个校园外卖场景，把下单、库存、支付、配送和退款设计成相互约束、可以查询的关系数据库，再用 SQL 做经营分析。', en: 'Model campus food delivery — ordering, stock, payment, delivery and refunds — as a relational database whose records constrain each other, then analyse it with SQL.' },
        mine: { zh: '独立完成：8 张业务表的建模、约束与触发器、下单与退款事务、业务查询和经营分析结论，并把数据库放进浏览器做成可操作的工作台。', en: 'On my own: modelled the 8 business tables, constraints and triggers, the order and refund transactions, the business queries and findings, and put the database in the browser as a working lab.' },
        tools: { zh: 'SQLite；sql.js（WebAssembly）让它在浏览器里运行，查询放在 Web Worker 里执行并有超时保护。', en: 'SQLite; sql.js (WebAssembly) runs it in the browser, with queries in a Web Worker behind a timeout.' },
        evidence: { zh: '本页的 SQL 工作台（可运行查询、下单、退款）、建表与数据 SQL、完整源码包。', en: 'The SQL lab on this page (run queries, place and refund orders), the schema and data SQL, and the full source package.' },
        status: { zh: '课程设计，已完成；演示数据为合成数据。', en: 'Course project, finished; the demo data is synthetic.' },
      },
    },
    insights: {
      title: { zh: '校园外卖经营分析（进阶版）', en: 'Campus Delivery Insights (advanced)' },
      lead: { zh: '同一套表结构，一个学期的订单，五个经营问题。', en: 'One schema, one term of orders, five business questions.' },
      description: { zh: '校园外卖课程设计的进阶版：一个学期的合成订单，用 SQL 回答五个经营问题；滚动看结论，驾驶舱里实时筛选。', en: 'The advanced edition of the campus delivery project: a synthetic term of orders, five business questions answered in SQL — scroll for the findings, then filter the live dashboard.' },
      tags: [ { zh: '进阶版 · 合成数据', en: 'Advanced · synthetic data' }, { zh: 'SQLite · sql.js · SVG', en: 'SQLite · sql.js · SVG' } ],
      summary: {
        task: { zh: '把课程设计的外卖数据库放大到一个学期，用 SQL 回答"什么时候最忙、钱从哪里来、学生会不会回来、送得够不够快、为什么退款"，再给出运营建议。', en: 'Scale the course-project delivery database to a full term and answer in SQL: when is it busiest, where does the money come from, do students come back, is delivery fast enough, why do orders get refunded — then suggest what operations should do.' },
        mine: { zh: '在课程设计数据库的基础上，提出五个经营问题、确定指标口径、审核每条结论；数据生成、图表和页面借助 AI 编程工具完成。', en: 'On top of my course-project database, I posed the five business questions, set the metric definitions and reviewed every conclusion; the data generator, charts and page were built with AI coding tools.' },
        tools: { zh: 'SQLite 与原有的表结构、约束和触发器；sql.js 在浏览器里执行同一批查询；图表为手写 SVG。', en: 'SQLite with the original schema, constraints and triggers; sql.js runs the same queries in the browser; hand-built SVG charts.' },
        evidence: { zh: '本页的滚动叙事与驾驶舱、全部 SQL、学期数据库与生成脚本。', en: 'The story and dashboard on this page, every query, the term database and the generator script.' },
        status: { zh: '进阶版 · 借助 AI 编程工具开发 · 合成数据；数据中的规律由生成脚本预设。', en: 'Advanced · built with AI coding tools · synthetic data; the patterns in the data are set by the generator.' },
      },
    },
    career: {
      title: { zh: '个人求职 Agent', en: 'Personal Job Agent' },
      lead: { zh: '每一份材料，都能回到一条证据。', en: 'Every line of every application traces back to a piece of evidence.' },
      description: { zh: '个人求职 Agent：岗位、真实经历与材料放进一个本地工作台，每条匹配判断都能追溯到事实证据。含公开版引擎的六组范例回放。', en: 'A personal job-search agent: roles, real experience and application materials in one local workbench, where every match traces back to a fact. Includes six replays from the public engine.' },
      tags: [ { zh: '个人项目 · 2026.08 至今', en: 'Personal project · 2026.08 – present' }, { zh: 'Python · Pydantic · SQLite', en: 'Python · Pydantic · SQLite' } ],
      summary: {
        task: { zh: '把岗位、职位描述、真实经历、定向材料和投递反馈串进一个本地工作台，减少文件版本混乱，让每次推荐和材料修改都有依据。', en: 'Bring roles, job descriptions, real experience, tailored materials and application feedback into one local workbench, so every recommendation and every edit to the materials has a basis.' },
        mine: { zh: '提出需求并定下规则：事实要有来源和确认状态，硬门槛优先于综合分，未确认的经历不进入材料；划定人工确认与本人提交的边界，并核对每组范例的输出。', en: 'Set the requirements and the rules: every fact needs a source and a confirmation status, hard requirements outrank the overall score, unconfirmed experience never enters the materials; drew the line where a person must confirm and submit, and checked the output of every replay.' },
        tools: { zh: '代码借助 AI 编程工具编写；Python + Pydantic + SQLite 实现流程，AI 分析是可选服务（本机 Codex、OpenAI 或兼容接口）。本页范例只调用本地规则，不调用大模型。', en: 'The code was written with AI coding tools; Python + Pydantic + SQLite run the workflow, and AI analysis is an optional service (local Codex, OpenAI or a compatible API). The replay on this page uses only the local rules — no language model.' },
        evidence: { zh: '本页的六组范例回放（公开版引擎真实计算）、固定版本源码、导出脚本与全部输入输出。', en: 'The six replays on this page (computed by the public engine), the pinned source, the export script and every input and output.' },
        status: { zh: '个人项目，持续开发；本页为固定版本的交互回放，不是在线服务，也不会投递。', en: 'Personal project, in active development; this page replays a pinned version — it is not a live service and never submits applications.' },
      },
    },
    quota: {
      title: { zh: 'QuotaDeck', en: 'QuotaDeck' },
      lead: { zh: '把注意力留给任务，把额度放在手边。', en: 'Keep your attention on the task and your quota at hand.' },
      description: { zh: 'QuotaDeck：Windows 桌面 AI 额度显示器，把分散在不同 Agent 和 API 里的额度、模型与并行分工放在一个托盘窗口里。MIT 开源。', en: 'QuotaDeck: a Windows tray app that gathers AI quotas, models and parallel task hand-off from different agents and APIs into one window. MIT licensed.' },
      tags: [ { zh: '个人项目 · MIT 开源', en: 'Personal project · MIT licensed' }, { zh: 'Electron · Node.js', en: 'Electron · Node.js' } ],
      summary: {
        task: { zh: '额度分散在不同 Agent 和 API 里；同一个账户余额在十几个模型下重复出现，容易误以为每个模型都有独立额度。', en: 'Quotas are scattered across agents and APIs, and one account balance shows up under a dozen models, suggesting each model has its own allowance.' },
        mine: { zh: '定下呈现规则：额度池、模型与计费关系分开，只展示服务商真实提供的信息；确定各服务的数据来源与边界，规划并行分工的角色，并验证连接与界面。', en: 'Set the display rules — pools, models and billing kept apart, showing only what each provider really reports; chose each service\'s data source and limits, planned the roles for parallel hand-off, and verified the connectors and the interface.' },
        tools: { zh: '代码借助 AI 编程工具编写；Electron 托盘窗口与 Node.js 连接器，读取数据和模型调用放在主进程，界面通过受限桥接请求操作。', en: 'The code was written with AI coding tools; an Electron tray window with Node.js connectors — data reads and model calls stay in the main process, and the interface acts through a restricted bridge.' },
        evidence: { zh: '本页的界面截图（本机运行，演示数据）、公开源码与自动检查。', en: 'Interface screenshots on this page (run locally, demo data), the public source and its automated checks.' },
        status: { zh: '个人项目，MIT 开源；当前为候选版，持续开发。截图不含真实额度。', en: 'Personal project, MIT licensed; currently a release candidate, in active development. The screenshots contain no real quota data.' },
      },
    },
    aiCampus: {
      title: { zh: 'AI 校园应用研究', en: 'AI on Campus — Study' },
      lead: { zh: '当 AI 可以写出答案，我们怎样判断任务真的完成了？', en: 'When AI can write the answer, how do we know the task is really done?' },
      description: { zh: 'AI 在校园生活与现实生活中的应用研究：文献综合、场景分析与五段式任务评估框架，附问卷、统计程序与证据台账。', en: 'A study of AI in campus and everyday life: literature synthesis, scenario analysis and a five-stage task evaluation framework, with the questionnaire, analysis program and evidence ledger.' },
      tags: [ { zh: '大创项目 · 2024.03—2024.07', en: 'Student research · 2024.03—2024.07' }, { zh: '校级大学生创新创业项目一等奖（项目组长）', en: 'First Prize, university student innovation programme (team lead)' } ],
      summary: {
        task: { zh: '从大学生活里的具体任务出发，研究 AI 在哪些场景可用，以及"感觉有帮助"是否意味着任务做得更好。', en: 'Start from concrete tasks in student life and ask where AI helps — and whether "it felt helpful" means the task was done better.' },
        mine: { zh: '项目组长：梳理文献、设计研究方案与问卷，编写数据校验与统计程序，提炼五段式任务评估框架。', en: 'Team lead: reviewed the literature, designed the study and questionnaire, wrote the data-checking and statistics program, and distilled the five-stage task evaluation framework.' },
        tools: { zh: 'Python 标准库校验字段、日期、枚举与评分并做统计，程序与测试一起公开；文献与产品发布信息来自公开资料。', en: 'The Python standard library checks fields, dates, categories and ratings and computes the statistics, published with its tests; literature and product-release facts come from public sources.' },
        evidence: { zh: '研究稿、文献证据台账、问卷与统计口径、分析程序与测试。', en: 'The research paper, the evidence ledger, the questionnaire with its definitions, and the analysis program with tests.' },
        status: { zh: '已完成，获校级一等奖；研究成果为文献综合与任务评估框架，公开版不含原始问卷数据。', en: 'Finished, awarded a university first prize; the outcome is a literature synthesis and an evaluation framework — the public version contains no raw survey data.' },
      },
    },
    stock: {
      title: { zh: 'CSV 数据分析工具', en: 'CSV Analysis Tool' },
      lead: { zh: '让一张表，讲清楚自己的来路。', en: 'Let a table explain where it came from.' },
      description: { zh: '上传或粘贴表格，检查缺失与重复，查看统计与分布，导出处理记录。数据只在浏览器中处理。', en: 'Upload or paste a table to check blanks and duplicates, see statistics and distributions, and export a processing record — all in the browser.' },
      tags: [ { zh: '原型 · 构造样本', en: 'Prototype · synthetic sample' }, { zh: 'JavaScript · CSV · 描述统计', en: 'JavaScript · CSV · descriptive statistics' } ],
      summary: {
        task: { zh: '把原股票行情项目里的数据检查思路，改造成任何人都能带入自己表格的轻量工具：检查缺失与重复、看分布、导出处理记录。', en: 'Turn the data checks from my earlier market-data project into a light tool anyone can use on their own table: find blanks and duplicates, see distributions, export a record of what was done.' },
        mine: { zh: '定义统计口径与处理规则（默认只诊断、不自动修复），实现解析、去重、统计与导出，并用构造样本做可手工核对的检查。', en: 'Defined the statistics and handling rules (diagnose by default, never auto-fix), implemented parsing, de-duplication, statistics and export, and checked it against a hand-verifiable sample.' },
        tools: { zh: '浏览器与命令行共用同一个计算模块；没有服务器端处理，也不调用 AI 分析接口。', en: 'The browser and the command line share one calculation module; no server-side processing and no AI analysis calls.' },
        evidence: { zh: '本页的工具、构造样本、源码包与检查脚本。', en: 'The tool on this page, the synthetic sample, the source package and the check script.' },
        status: { zh: '原型，使用构造样本；真实行情回测项目正在重做，完成后替换本页。', en: 'Prototype on a synthetic sample; the real market backtest is being rebuilt and will replace this page.' },
      },
    },
    projects: {
      title: { zh: '项目与演示', en: 'Projects & demos' },
      lead: { zh: '数据 × AI 工具是主要作品，每个项目都能打开看过程、亲手试；影像是独立的创作板块。', en: 'Data × AI tools are the main work — open any project to see the process and try it yourself. Film is a separate creative strand.' },
      description: { zh: '何彦钧的全部项目：HR 档案补录工作流、SQL 工作台、求职 Agent、QuotaDeck、AI 校园研究、CSV 工具，以及 AI 短片分镜。', en: "All of Yanjun He's projects: the HR records workflow, SQL lab, job agent, QuotaDeck, AI-on-campus study, CSV tool, and an AI short-film storyboard." },
      data: { zh: '数据 × AI 工具', en: 'Data × AI tools' },
      film: { zh: 'AI 影像', en: 'AI film' },
    },
    method: {
      title: { zh: '过程与运行 · CSV 数据分析工具', en: 'Method & results · CSV Analysis Tool' },
      heading: { zh: '一份分析，应该留下一条可复算的路径。', en: 'An analysis should leave a path you can recompute.' },
      description: { zh: 'CSV 数据分析工具的处理规则、构造样本的可核对结果和本地运行方法。', en: 'Handling rules of the CSV Analysis Tool, hand-checkable results on the synthetic sample, and how to run it locally.' },
    },
    hris: {
      description: { zh: '员工电子档案补录：先确定员工再找档案，AI 只给候选，人工审核后写回。含虚构数据的审核流程演示。', en: 'HR records backfill: find the employee first, then the document; AI only proposes, a person approves the write-back. Includes a demo on fictional data.' },
      title: { zh: '员工电子档案补录', en: 'HR Records Backfill' },
      lead: { zh: '让每一份档案资料，都回到正确的员工名下。', en: 'Getting every document back to the right employee.' },
      tags: [
        { zh: '丹纳赫 HR 实习', en: 'Danaher HR internship' },
        { zh: '2026.03—2026.06', en: '2026.03—2026.06' },
        { zh: 'Excel · OpenClaw · Microsoft 365', en: 'Excel · OpenClaw · Microsoft 365' },
      ],
      summary: {
        task: { zh: '中国区 CDP 系统中不少员工档案字段缺失，需要从 PDF 与图片档案中补全地址、紧急联系人、学历等字段，而且每份资料都必须归到正确的员工名下。', en: 'Many employee records in the China CDP system had empty fields. Addresses, emergency contacts and education had to be filled in from PDF and image files, and every file had to land on the right employee.' },
        mine: { zh: '核查约 2000 名员工的档案主数据；负责资料下载、范围确认、字段核对、异常处理与结果复查；把补录需求拆成主名单、匹配优先级、字段提取、异常分类和审核写回五个部分。', en: 'Reviewed master records for about 2000 employees; handled downloading files, scoping each batch, checking fields, resolving exceptions and re-checking results; broke the backfill into five parts: master roster, match priority, field extraction, exception types and reviewed write-back.' },
        tools: { zh: '初版由我用 OpenClaw 调用 DeepSeek 与 GPT API 做字段提取（个人实践）；Excel 用于核对；企业版方案基于 Microsoft 365。模型只提供候选，写入由人工审核决定。', en: 'My first version used OpenClaw to call the DeepSeek and GPT APIs for field extraction (personal practice); Excel for checking; the enterprise design runs on Microsoft 365. The model only proposes values — a person decides what gets written.' },
        evidence: { zh: '本页的审核流程演示（虚构数据）；可下载的完整方案文档。公司真实资料不公开。', en: 'The review demo on this page (fictional data) and the downloadable full design document. No real company records are published.' },
        status: { zh: '已结束：实习任务在离岗前完成；企业版流程为方案设计。', en: 'Finished: the internship task was completed before I left; the enterprise flow is a design.' },
      },
    },
  },
};
