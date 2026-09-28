import type { Bi } from '../i18n';

export interface ProjectEntry {
  slug: string;
  line: 'data' | 'film';
  inBrief: boolean;
  href: string;
  title: Bi;
  did: Bi;
  status: Bi;
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
    stills: [
      { src: '/media/mais-je-taime/s04.webp', alt: { zh: '黑白舞池中央展开的红裙', en: 'A red dress unfurling at the centre of a black-and-white dance floor' } },
      { src: '/media/mais-je-taime/s06.webp', alt: { zh: '雨夜伞下相依的两人背影', en: 'Two figures under one umbrella on a rainy night' } },
      { src: '/media/mais-je-taime/s16.webp', alt: { zh: '雨夜码头，风衣男人握枪而立', en: 'A man in a trench coat holding a gun on a rainy dock' } },
      { src: '/media/mais-je-taime/s19-end.webp', alt: { zh: '雨中摊开的掌心里放着一枚戒指', en: 'A ring resting in an open palm in the rain' } },
    ],
  },
  projects: [
    project({ slug: 'hris-workflow', line: 'data', inBrief: true,
      title: { zh: '员工电子档案补录', en: 'HR Records Backfill' },
      did: { zh: '核查约 2000 名员工的档案主数据，并把补录流程拆成可审核的工作流', en: 'Reviewed master records for about 2000 employees and turned the backfill into a reviewable workflow' },
      status: { zh: '已结束 · 企业流程为方案设计', en: 'Finished · enterprise flow is a design' } }),
    project({ slug: 'campus-delivery', line: 'data', inBrief: true,
      title: { zh: '校园外卖 SQL 工作台', en: 'Campus Delivery SQL Lab' },
      did: { zh: '独立完成的课程设计：8 张业务表、事务与复合外键，可在浏览器里直接运行', en: 'Solo course project: 8 business tables with transactions and composite keys, runnable in the browser' },
      status: { zh: '课程设计 · 可在线运行', en: 'Course project · runs online' } }),
    project({ slug: 'ai-career', line: 'data', inBrief: true,
      title: { zh: '个人求职 Agent', en: 'Personal Job Agent' },
      did: { zh: '借助 AI 编程工具开发的求职辅助工具，每条匹配判断都能追溯到事实证据', en: 'A job-search helper built with AI coding tools; every match traces back to a fact' },
      status: { zh: '个人项目 · 2026.08 至今', en: 'Personal project · 2026.08 – present' } }),
    project({ slug: 'quota-deck', line: 'data', inBrief: true,
      title: { zh: 'QuotaDeck', en: 'QuotaDeck' },
      did: { zh: '借助 AI 编程工具开发的桌面小工具，集中查看多家 AI 服务的额度', en: 'A desktop tool, built with AI coding tools, that shows AI service quotas in one place' },
      status: { zh: '个人项目 · MIT 开源', en: 'Personal project · MIT licensed' } }),
    project({ slug: 'ai-campus', line: 'data', inBrief: true,
      title: { zh: 'AI 校园应用研究', en: 'AI on Campus — Study' },
      did: { zh: '项目组长：设计问卷、清洗数据并做交叉统计，获校级大学生创新创业项目一等奖', en: 'Team lead: survey design, data cleaning and cross-tab analysis; First Prize, university student innovation programme' },
      status: { zh: '大创项目 · 2024.03—2024.07', en: 'Student research · 2024.03—2024.07' } }),
    project({ slug: 'stock-data', line: 'data', inBrief: false,
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
