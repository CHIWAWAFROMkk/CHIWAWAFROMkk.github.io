import type { Lang } from '../i18n';

/** The fictional job description of the public replay (identical to public/downloads/export-job-agent-demo.py). */
export const DEMO_JD = `公司：示例科技（虚构）
岗位：AI运营实习生
地点：上海

岗位职责：
- 负责 AI 产品运营和用户数据分析。
岗位要求：
- 本科及以上学历；
- 每周至少 4 天，连续实习 3 个月；
- 必须熟练使用 SQL；
- Tableau 经验加分。`;

/** The fictional candidate's facts before the first run (the engine reports them after every run). */
export const DEMO_FACTS = [
  { id: 'fact-sql-analysis', statement: '使用 SQL 清洗业务数据并输出周度分析。', status: 'documented' },
  { id: 'fact-pending-tableau', statement: '独立搭建 Tableau 仪表盘。', status: 'needs_confirmation' },
];

type Step = 'runtime' | 'packages' | 'sources';
export interface LiveText {
  title: string; meta: string; intro: string; chip: (py: string) => string; start: (mb: string) => string; startNote: string;
  booting: string; bootLine: (step: Step, t: number, mb: number, ms: number, detail: string) => string; bootReady: (py: string, s: number) => string;
  jdLabel: string; jdEdit: string; jdDone: string; jdHint: string; candLabel: string; daysLabel: string; daysUnknown: string; day: (d: number) => string;
  statusLabel: string; statusOptions: [string, string][]; documented: string; remove: string;
  addLabel: string; addStatement: string; addSkills: string; addBtn: string; addEmpty: string;
  recompute: string; computing: string; engineError: (m: string) => string;
  score: string; raw: (n: number) => string; facts: string; ceilFail: (cap: number) => string; ceilUnknown: (cap: number) => string; latency: (ms: number) => string;
  codeTitle: string; codeMeta: string; codeLabel: string;
  fallback: string; retry: string; toReplay: string; toLive: string; privacy: string;
}

export const LIVE_TEXT: Record<Lang, LiveText> = {
  zh: {
    title: '在线引擎：求职 Agent 匹配', meta: '公开版 0.8.5 · 4397ded · 在你的浏览器里运行',
    intro: '职位描述和虚构候选人都可以改；改完由真实的 Python 引擎当场重算——它通过 WebAssembly 在你的浏览器里运行，输入不会离开你的电脑。分数先滚到引擎算出的原始分，再被引擎自己的封顶规则压下来；右下角"代码实况"亮起的就是刚刚执行的那几行源码。',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `启动引擎（约 ${mb} MB）`,
    startNote: '手机或省流量模式下，点了才会下载运行时。', booting: '正在启动引擎…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `下载并启动 Python 运行时 · Python ${detail}`, packages: `安装 ${detail}`, sources: `导入 job_agent · ${detail} 个模块` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `引擎就绪 · Python ${py} · ${s.toFixed(2)} s`,
    jdLabel: '职位描述', jdEdit: '编辑职位描述', jdDone: '完成并计算', jdHint: '可以粘贴任意职位描述；引擎按中文职位描述设计。',
    candLabel: '虚构候选人', daysLabel: '每周可到岗', daysUnknown: '未填写', day: d => `${d} 天`,
    statusLabel: '确认状态', statusOptions: [['user_confirmed', '已确认'], ['needs_confirmation', '待确认']], documented: '有文档依据', remove: '删除',
    addLabel: '新增一条经历', addStatement: '经历（不超过 200 字）', addSkills: '涉及的技能，用逗号分隔', addBtn: '加入', addEmpty: '请先写下这条经历。',
    recompute: '重新计算', computing: '引擎计算中…', engineError: m => `引擎出错：${m}`,
    score: '规则匹配分 / 100', raw: n => `原始分 ${n}`, facts: '入选材料的事实',
    ceilFail: cap => `硬门槛不满足 · 上限 ${cap}`, ceilUnknown: cap => `存在待确认门槛 · 上限 ${cap}`, latency: ms => `引擎计算 ${ms.toFixed(1)} ms`,
    codeTitle: 'local_matcher.py · match_job_locally()', codeMeta: '代码实况 · 源码第 697–702 行', codeLabel: '代码实况：引擎封顶逻辑的源码',
    fallback: '在线引擎暂时无法启动（浏览器不支持、网络中断或超时）。下面是同一引擎预先算好的六组回放。', retry: '重新启动引擎',
    toReplay: '改看六组固定回放', toLive: '回到在线引擎', privacy: '全部计算在你的浏览器里完成，不上传任何内容。',
  },
  en: {
    title: 'Live engine: job agent matching', meta: 'Public build 0.8.5 · 4397ded · running in your browser',
    intro: 'Edit the job description and the fictional candidate; the real Python engine recomputes on the spot — it runs in your browser through WebAssembly, and nothing you type leaves your computer. The score rolls to the raw total the engine computed, then the engine\'s own cap rule presses it down; the "live source" panel lights the lines that just ran.',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `Start the engine (about ${mb} MB)`,
    startNote: 'On phones and in data-saver mode the runtime downloads only when you tap.', booting: 'Starting the engine…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `Download and start the Python runtime · Python ${detail}`, packages: `Install ${detail}`, sources: `Import job_agent · ${detail} modules` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `Engine ready · Python ${py} · ${s.toFixed(2)} s`,
    jdLabel: 'Job description', jdEdit: 'Edit the job description', jdDone: 'Done — compute', jdHint: 'Paste any job description. The engine is designed for Chinese postings; the demo data stays in Chinese.',
    candLabel: 'Fictional candidate', daysLabel: 'Days available per week', daysUnknown: 'Not given', day: d => `${d} days`,
    statusLabel: 'Confirmation', statusOptions: [['user_confirmed', 'Confirmed'], ['needs_confirmation', 'To confirm']], documented: 'Documented', remove: 'Remove',
    addLabel: 'Add an experience', addStatement: 'Experience (up to 200 characters)', addSkills: 'Skills involved, comma-separated', addBtn: 'Add', addEmpty: 'Write the experience first.',
    recompute: 'Recompute', computing: 'Engine computing…', engineError: m => `Engine error: ${m}`,
    score: 'Rule-based match / 100', raw: n => `raw ${n}`, facts: 'Facts used in the materials',
    ceilFail: cap => `Hard requirement failed · cap ${cap}`, ceilUnknown: cap => `Hard requirement to confirm · cap ${cap}`, latency: ms => `engine ${ms.toFixed(1)} ms`,
    codeTitle: 'local_matcher.py · match_job_locally()', codeMeta: 'Live source · lines 697–702', codeLabel: 'Live source: the engine\'s cap logic',
    fallback: 'The live engine could not start (unsupported browser, network error or timeout). Below are six replays computed by the same engine.', retry: 'Start the engine again',
    toReplay: 'Show the six fixed replays instead', toLive: 'Back to the live engine', privacy: 'Everything is computed in your browser; nothing is uploaded.',
  },
};
