import type { Bi } from '../i18n';

type Card = { title: Bi; did: Bi };

/** Copy of the HRIS track (/hris/). Numbers come from the fact ledger only (tests/unit/hris-copy.test.ts).
 *  Every line is a draft awaiting the author's sign-off (docs/superpowers/reviews/2026-10-14-phase1-copy-for-signoff.md). */
export const HRIS = {
  route: '/hris/',
  name: { zh: '何彦钧', en: 'Yanjun He' },
  meta: {
    home: { title: { zh: '何彦钧 · HRIS 与人力数据', en: 'Yanjun He · HRIS & People Data' }, description: { zh: '员工主数据核查、档案补录工作流与 SQL 数据分析。', en: 'Employee master-data checks, a records backfill workflow and SQL analysis.' } },
    brief: { title: { zh: '一分钟了解我 · 何彦钧', en: 'In one minute · Yanjun He' }, description: { zh: '实习、教育、技能与到岗信息。', en: 'Internship, education, skills and availability.' } },
    projects: { title: { zh: '全部项目 · 何彦钧', en: 'All projects · Yanjun He' }, description: { zh: '档案补录工作流、人岗匹配、SQL 数据库、问卷研究与额度工具。', en: 'Records backfill, job matching, an SQL database, a survey study and a quota tool.' } },
    workbench: { title: { zh: '流程终端 · 何彦钧', en: 'Workflow terminal · Yanjun He' }, description: { zh: '用虚构档案走一遍补录流程的三个版本。', en: 'Walk fictional records through the three versions of the backfill workflow.' } },
  },
  /** The HR résumé (tools/resume-hr-*.html, printed by tools/print-resume.mjs); the AI site keeps its own. */
  resumeFile: { zh: '/downloads/resume/heyanjun-resume-hr-zh.pdf', en: '/downloads/resume/heyanjun-resume-hr-en.pdf' },
  nav: {
    label: { zh: 'HRIS 导航', en: 'HRIS navigation' },
    index: { zh: '主页', en: 'Index' },
    brief: { zh: '一分钟了解我', en: 'In one minute' },
    projects: { zh: '全部项目', en: 'All projects' },
    workbench: { zh: '流程终端', en: 'Workflow terminal' },
    resume: { zh: '下载简历', en: 'Résumé (PDF)' },
    themeDark: { zh: '深色', en: 'Dark' },
    themeLight: { zh: '浅色', en: 'Light' },
    otherLang: { zh: 'EN', en: '中文' },
  },
  intro: { top: { zh: '何彦钧 · HRIS 与人力数据', en: 'Yanjun He · HRIS & people data' }, lines: ['HR DATA', 'GOVERNANCE.'], skip: { zh: '跳过', en: 'Skip' } },
  hero: {
    title: { zh: '将非标人事流程，重构为', en: 'Turning non-standard HR processes into' },
    titleSoft: { zh: '可稽核的数据资产。', en: 'data you can audit.' },
    lead: { zh: '丹纳赫实习期间，核查约 2000 名员工的档案主数据；把档案补录工作流迭代三版，最终版基于 Copilot + Power Automate，在公司批准的环境中运行，并交接给 mentor。', en: 'During my internship at Danaher I reviewed master records for about 2000 employees and iterated the records backfill into three versions; the final one, on Copilot + Power Automate, ran in the company-approved environment and was handed over to my mentor.' },
    doorBrief: { code: '1:00', label: { zh: '一分钟了解我', en: 'Know me in a minute' } },
    doorWorkbench: { code: 'LIVE', label: { zh: '打开档案补录流程终端', en: 'Open the backfill workflow terminal' } },
  },
  topology: {
    figure: { zh: '图 · 档案治理示意', en: 'Figure · records governance (illustration)' },
    note: { zh: '示意，不是实际数据', en: 'Illustration, not real data' },
    governed: { zh: '治理后：按状态归入整齐的分组', en: 'Governed: sorted into tidy groups by status' },
    raw: { zh: '治理前：字段口径不一、状态分散', en: 'Before: inconsistent fields, scattered states' },
    toRaw: { zh: '看治理前', en: 'Show before' },
    toGoverned: { zh: '看治理后', en: 'Show governed' },
    legend: { verified: { zh: '核验通过', en: 'Verified' }, review: { zh: '人工复核', en: 'Manual review' }, missing: { zh: '缺件待补', en: 'Missing' } },
  },
  ledger: [
    { figure: '6,000+', caption: { zh: '实习公司 CDP 系统覆盖的员工数（系统规模）', en: 'Employees covered by the company’s CDP system (system scale)' } },
    { figure: '2000', caption: { zh: '本人核查的档案主数据，约数', en: 'Employee master records I reviewed, approximately' } },
    { figure: '3', caption: { zh: '档案补录工作流迭代的版本', en: 'Versions of the records backfill workflow' } },
    { figure: '8', caption: { zh: '校园外卖课程设计的业务表', en: 'Business tables in the campus delivery course project' } },
  ],
  skills: [
    { group: { zh: '数据与报表', en: 'Data & reporting' }, items: { zh: 'Excel（数据透视表、函数、图表）· SQL · Python（Pandas、NumPy）· 数据分析与可视化', en: 'Excel (pivot tables, functions, charts) · SQL · Python (Pandas, NumPy) · data analysis and visualisation' } },
    { group: { zh: '流程与 AI 工具', en: 'Workflow & AI tools' }, items: { zh: 'Microsoft 365 Copilot · Power Automate · SharePoint · ChatGPT · DeepSeek', en: 'Microsoft 365 Copilot · Power Automate · SharePoint · ChatGPT · DeepSeek' } },
    { group: { zh: '语言', en: 'Languages' }, items: { zh: 'CET-6 550 分', en: 'CET-6: 550' } },
  ],
  brief: {
    experience: { zh: '经历', en: 'Experience' },
    education: { zh: '教育', en: 'Education' },
    skills: { zh: '技能', en: 'Skills' },
    availability: { zh: '到岗', en: 'Availability' },
    /** Newest first; each internship with its own points. Clients and candidates are never named. */
    jobs: [
      { fact: 'F16' as const, points: [
        { zh: '支持招聘全流程：理解客户的岗位需求，改写职位标题与发布文案，在招聘平台上按 JD 搜索、筛选简历并主动联系候选人，做电话初筛、约面试并跟进结果。', en: 'Support the full recruiting cycle: understanding client roles, rewriting job titles and postings, searching and screening résumés against the JD on job platforms, reaching out to candidates, phone screening, and scheduling interviews and following up.' },
        { zh: '负责数据中心与智算中心方向的工程类岗位（电气、暖通、制冷等），把 JD 里的硬性条件整理成筛选卡和初筛必问题。', en: 'Work on engineering roles for data centres and AI computing centres (electrical, HVAC, cooling and more), turning each JD’s hard requirements into a screening card and must-ask phone-screen questions.' },
        { zh: '筛选前对照客户的禁猎名单，跳过限制范围内的候选人；客户与候选人信息不对外公开。', en: 'Check every candidate against the clients’ off-limits list before screening; client and candidate details are never shared publicly.' },
      ] },
      { fact: 'F5' as const, points: [
      { zh: '对接全国各区域 HR，跟进员工信息缺失与异常数据，推动档案补全。', en: 'Worked with regional HR teams across China to chase missing and inconsistent employee data until the records were complete.' },
      { zh: '核查约 2000 名员工的档案主数据；所在 CDP 系统覆盖 6,000+ 员工。', en: 'Reviewed master records for about 2000 employees, in a CDP system covering 6,000+ staff.' },
      { zh: '设计并使用档案补录工作流，迭代三版，最终版在公司批准的环境中运行并交接给 mentor。', en: 'Designed and used the records backfill workflow over three versions; the final one ran in the company-approved environment and was handed over to my mentor.' },
      { zh: '用 Excel 整理和分析合规数据，输出可视化报表。', en: 'Organised and analysed compliance data in Excel and produced visual reports.' },
      { zh: '因工作表现获得 HRBP 认可，被邀请延长实习。', en: 'Invited by the HRBP to extend the internship on the strength of my work.' },
      ] },
    ],
    toWorkbench: { zh: '打开档案补录流程终端 →', en: 'Open the backfill workflow terminal →' },
  },
  projects: {
    title: { zh: '全部项目', en: 'All projects' },
    lead: { zh: '先看档案补录这段真实交付，再看几个能在浏览器里运行的数据与工具项目。', en: 'Start with the records backfill delivered during the internship, then the data and tool projects that run in your browser.' },
  },
  cards: {
    'hris-workflow': { title: { zh: '员工电子档案补录与主数据治理', en: 'Employee Records Backfill & Master Data' }, did: { zh: '核查约 2000 名员工的档案主数据；把补录拆成主名单、查找档案、确认身份、提取候选、HR 审核、写回核对六步，最终版基于 Copilot + Power Automate 在公司环境运行', en: 'Reviewed master records for about 2000 employees and split the backfill into six steps (roster, find file, confirm identity, extract candidates, HR review, write back and verify); the final version ran at the company on Copilot + Power Automate' } },
    'ai-career': { title: { zh: '人岗匹配评估引擎', en: 'Job–Candidate Matching Engine' }, did: { zh: '从求职一侧做的人岗匹配：把职位要求与候选人事实逐条对照，每条判断都能追溯到事实；借助 AI 编程工具开发', en: 'Matching built from the job seeker’s side: each requirement is set against the candidate’s facts and every judgement traces back to one; built with AI coding tools' } },
    'campus-delivery': { title: { zh: '校园业务数据库建模与 SQL 分析', en: 'Campus Database Modelling & SQL Analysis' }, did: { zh: '个人负责的课程设计：8 张业务表、事务与复合外键；在同一套表上用 SQL 回答五个经营问题，分析页为合成数据', en: 'A course project I was responsible for: 8 business tables with transactions and composite keys, then five business questions answered in SQL on the same schema (the analysis uses synthetic data)' } },
    'ai-campus': { title: { zh: '问卷设计与数据清洗：AI 校园应用研究', en: 'Survey Design & Data Cleaning: AI on Campus' }, did: { zh: '项目组长：设计问卷、清洗数据并做交叉统计，获校级大学生创新创业项目一等奖', en: 'Team lead: survey design, data cleaning and cross-tab analysis; First Prize, university student innovation programme' } },
    'quota-deck': { title: { zh: 'QuotaDeck：多服务额度汇总工具', en: 'QuotaDeck: Quotas in One Place' }, did: { zh: '借助 AI 编程工具开发的 Windows 小工具：贴边浮条集中显示多家 AI 服务的额度，读不到的标为未知；Agent 做完一轮或等批准时提醒', en: 'A Windows tool built with AI coding tools: an edge strip shows quotas from several AI services, marks anything unreadable unknown, and tells you when an agent finishes a turn or waits for approval' } },
  } satisfies Record<string, Card>,
  footer: { note: { zh: '演示均为虚构或构造数据，不含任何公司真实资料与员工信息。', en: 'All demos use fictional or constructed data; no real company records or employee information.' } },
};
