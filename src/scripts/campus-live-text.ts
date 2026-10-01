import type { Lang } from '../i18n';
import type { BootText } from './py-boot-view';
import type { PipeText } from './campus-pipeline';
import { WINDOW, GATE_KEYS, type Analysis, type TestSummary } from './campus-flow';

const fmt = (n: number) => n.toLocaleString('en-US');
const excludedTotal = (a: Analysis) => Object.values(a.excluded).reduce((s, n) => s + n, 0);
const keyCounts = (a: Analysis) => GATE_KEYS.map(k => `${k} ${fmt(a.excluded[k])}`).join(' · ');
/** unittest's own summary, the same in both languages, split as the approved prototype shows it: the big result line,
 *  and the measured time on the command line. */
export function summaryLine(s: TestSummary): string {
  const bad = [s.failures ? `failures=${s.failures}` : '', s.errors ? `errors=${s.errors}` : ''].filter(Boolean).join(', ');
  return `Ran ${s.run} tests · ${s.ok ? 'OK' : `FAILED (${bad})`}`;
}
export const ranLine = (s: TestSummary) => `Ran ${s.run} tests in ${(s.ms / 1000).toFixed(3)}s`;

export interface CampusText extends BootText {
  title: string; meta: string; intro: string; chip: (py: string) => string; start: (mb: string) => string; startNote: string; booting: string;
  id: string; date: string; q1: string; q2: string; q3: string; used: [string, string][]; q4: string; freq: [string, string][];
  q5: string; scenes: string[]; q6: string; help: [string, string][]; q7: string; verify: [string, string][];
  hintEnded: string; hintYes: string; hintNotYes: string;
  submit: string; sample: string; stress: string; clear: string; privacy: string;
  computing: string; engineError: (m: string) => string; tag: string; timing: (n: number, ms: number, traced: number) => string;
  incLabel: string; yesLabel: string; yesNote: string; counts: (c: { yes: string; no: string; unsure: string }) => string;
  sceneLabel: string; sceneDen: (d: string, m: string) => string; helpLabel: string; median: string;
  ledger: (a: Analysis) => string; invalidTitle: string; invalidNote: string; statusLabel: string; replaying: string; lightNote: string;
  codeTitle: string; codeMeta: string; codeLabel: string; codeNote: string;
  testsTitle: (n: number) => string; run: (n: number) => string; cmd: string;
  fallback: string; download: string; retry: string; pipe: PipeText;
}

export const CAMPUS_TEXT: Record<Lang, CampusText> = {
  zh: {
    title: '在线程序：问卷清洗与统计', meta: 'analysis.py · 只用 Python 标准库 · 在你的浏览器里运行',
    intro: '这是研究公开的统计程序 analysis.py——就是下文"本地运行"里提供下载的那一份，原样在你的浏览器里运行（通过 WebAssembly）。每份回答是一个光点，按程序的顺序穿过四道排除关卡：被拦下的落进对应的桶，通过的填进"纳入"点阵；每个光点走哪条路，取自程序逐行执行时的真实记录。你可以按问卷填一份，也可以载入构造样本，或做 2,000 份的压力测试。',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `启动程序（约 ${mb} MB）`,
    startNote: '手机或省流量模式下，点了才会下载运行时。', booting: '正在启动 Python 运行时…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `下载并启动 Python 运行时 · Python ${detail}`, packages: `安装 ${detail}`, sources: `载入研究程序与测试 · ${detail} 个模块` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `程序就绪 · Python ${py} · ${s.toFixed(2)} s`,
    hexTitle: 'SHA-256 · 正在载入的文件',
    id: '匿名 ID', date: `填写日期（窗口 ${WINDOW.start} 至 ${WINDOW.end}）`,
    q1: '同意参加本次调查', q2: '已满 18 岁且在校就读大学', q3: '过去 30 天主动用过 AI 工具',
    used: [['yes', '是'], ['no', '否'], ['unsure', '不确定']],
    q4: '使用天数', freq: [['1_3', '1–3 天'], ['4_15', '4–15 天'], ['16_30', '16–30 天']],
    q5: '使用场景（多选，可不选）', scenes: ['学习', '校园事务', '社团活动', '日常规划', '求职', '其他'],
    q6: '有多大帮助', help: [['1', '1 完全没帮助'], ['2', '2 帮助较小'], ['3', '3 一般'], ['4', '4 比较有帮助'], ['5', '5 非常有帮助'], ['', '跳过（记为缺失）']],
    q7: '多久查验一次重要事实', verify: [['1', '1 从不'], ['2', '2 很少'], ['3', '3 有时'], ['4', '4 经常'], ['5', '5 每次'], ['', '跳过（记为缺失）']],
    hintEnded: 'Q1 或 Q2 选了"否"：问卷到此结束，这一份会在对应关卡被排除。',
    hintYes: '场景一个都不选 = 未答（null），不计入场景的分母；Q6、Q7 跳过记为缺失。',
    hintNotYes: 'Q3 选"否"或"不确定"：Q4–Q7 不适用，只计入使用比例的分母。',
    submit: '提交这一份', sample: '载入构造样本（36 份）', stress: '压力测试：2,000 份', clear: '清空',
    privacy: '全部计算在你的浏览器里完成，不上传任何内容。',
    computing: 'analyze() 运行中…', engineError: m => `程序出错：${m}`, tag: '构造样本 · 不是 2024 年调查结果',
    timing: (n, ms, traced) => `analyze() · ${fmt(n)} 条 · ${ms.toFixed(1)} ms · 逐行跟踪 ${traced.toFixed(1)} ms`,
    incLabel: '纳入 / 输入', yesLabel: '主动使用比例', yesNote: '分母：纳入人数',
    counts: c => `是 ${c.yes} · 否 ${c.no} · 不确定 ${c.unsure}`,
    sceneLabel: '场景', sceneDen: (d, m) => `分母：答了场景题的使用者 ${d} · 未答 ${m}`,
    helpLabel: '有多大帮助（1–5）', median: '中位数',
    ledger: a => `input_n ${fmt(a.input_n)} = included_n ${fmt(a.included_n)} + 排除 ${fmt(excludedTotal(a))}（${keyCounts(a)}）· 重复 ID ${fmt(a.duplicate_id_groups)} 组`,
    invalidTitle: '校验失败', invalidNote: '这是程序自己的报错：整份输入被拒绝，这一份没有加入，上一轮结果保持不变。',
    statusLabel: 'analyze() 返回的状态（程序原话）：',
    replaying: '回放中：analyze() 已经算完，统计栏在回放结束时落定为它的输出。',
    lightNote: '手机上每 5 份回答画 1 个光点，其余直接落进桶或点阵；计数和统计不变。',
    codeTitle: 'analysis.py · analyze()', codeMeta: '代码实况 · 源码第 87–97 行', codeLabel: '代码实况：排除关卡的源码与逐行执行次数',
    codeNote: '右侧是每行的真实执行次数，底色深浅 = 到达该行的记录占比。每次提交，analyze() 都会重新检查全部记录；动画只回放新加入的、以及结论变了的记录。',
    testsTitle: n => `test_analysis.py · ${n} 项单元测试`, run: n => `运行 ${n} 项测试`, cmd: '$ python -m unittest -v test_analysis',
    fallback: '在线程序暂时无法启动（浏览器不支持、网络中断或超时）。下面的五段式框架不受影响；也可以下载程序在本地运行：',
    download: '下载 analysis.py', retry: '重新启动',
    pipe: {
      gates: ['重复 ID', '未同意', '不符合人群', '采集窗口外'], conds: ['counts[id] > 1', 'not consent', 'not eligible', 'not start≤d≤end'],
      keys: GATE_KEYS, included: '纳入', append: 'included.append(row)', loop: 'for row in rows', you: '你的回答',
      legend: ['是', '否', '不确定'], q3: '= Q3',
    },
  },
  en: {
    title: 'Live program: survey cleaning and statistics', meta: 'analysis.py · Python standard library only · running in your browser',
    intro: 'This is the study\'s published statistics program, analysis.py — the very file offered for download under "Run it locally" below — running unchanged in your browser through WebAssembly. Each answer is a point of light that passes the four exclusion gates in the program\'s order: excluded answers drop into their bin, included ones fill the "included" matrix, and the path of every point comes from the program\'s own line-by-line trace. Fill in the questionnaire, load the constructed sample, or run a 2,000-answer stress test.',
    chip: py => `PYTHON ${py} · WEBASSEMBLY`, start: mb => `Start the program (about ${mb} MB)`,
    startNote: 'On phones and in data-saver mode the runtime downloads only when you tap.', booting: 'Starting the Python runtime…',
    bootLine: (step, t, mb, ms, detail) => `[${t.toFixed(2)}s] ${{ runtime: `Download and start the Python runtime · Python ${detail}`, packages: `Install ${detail}`, sources: `Load the study's program and tests · ${detail} modules` }[step]} · ${mb.toFixed(1)} MB · ${Math.round(ms)} ms`,
    bootReady: (py, s) => `Program ready · Python ${py} · ${s.toFixed(2)} s`,
    hexTitle: 'SHA-256 · files being loaded',
    id: 'Anonymous ID', date: `Date filled in (window ${WINDOW.start} to ${WINDOW.end})`,
    q1: 'Agrees to take part', q2: 'Aged 18+ and enrolled at a university', q3: 'Actively used an AI tool in the past 30 days',
    used: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']],
    q4: 'Days of use', freq: [['1_3', '1–3 days'], ['4_15', '4–15 days'], ['16_30', '16–30 days']],
    q5: 'Where (tick any, or none)', scenes: ['Study', 'Campus admin', 'Clubs', 'Daily planning', 'Careers', 'Other'],
    q6: 'How helpful', help: [['1', '1 Not at all'], ['2', '2 A little'], ['3', '3 Somewhat'], ['4', '4 Quite'], ['5', '5 Very'], ['', 'Skip (missing)']],
    q7: 'How often you check key facts', verify: [['1', '1 Never'], ['2', '2 Rarely'], ['3', '3 Sometimes'], ['4', '4 Often'], ['5', '5 Every time'], ['', 'Skip (missing)']],
    hintEnded: 'Q1 or Q2 is "no": the questionnaire ends here, and this answer is excluded at the matching gate.',
    hintYes: 'No place ticked = Q5 skipped (null), outside the scenario denominator; a skipped Q6 or Q7 counts as missing.',
    hintNotYes: 'Q3 is "no" or "not sure": Q4–Q7 do not apply; the answer counts only in the usage denominator.',
    submit: 'Submit this answer', sample: 'Load the constructed sample (36)', stress: 'Stress test: 2,000 answers', clear: 'Clear',
    privacy: 'Everything is computed in your browser; nothing is uploaded.',
    computing: 'analyze() running…', engineError: m => `Program error: ${m}`, tag: 'Constructed sample · not the 2024 survey',
    timing: (n, ms, traced) => `analyze() · ${fmt(n)} rows · ${ms.toFixed(1)} ms · traced ${traced.toFixed(1)} ms`,
    incLabel: 'Included / input', yesLabel: 'Active use', yesNote: 'denominator: included',
    counts: c => `yes ${c.yes} · no ${c.no} · not sure ${c.unsure}`,
    sceneLabel: 'Where', sceneDen: (d, m) => `denominator: users who answered ${d} · skipped ${m}`,
    helpLabel: 'How helpful (1–5)', median: 'median',
    ledger: a => `input_n ${fmt(a.input_n)} = included_n ${fmt(a.included_n)} + excluded ${fmt(excludedTotal(a))} (${keyCounts(a)}) · ${fmt(a.duplicate_id_groups)} duplicate-ID groups`,
    invalidTitle: 'Validation failed', invalidNote: 'The program\'s own error, in its own words (Chinese): the whole input is rejected, this answer was not added, and the previous result stands.',
    statusLabel: 'analyze() status, in the program\'s own words (Chinese):',
    replaying: 'Replaying: analyze() has already finished; the panel settles on its output when the replay ends.',
    lightNote: 'On phones one point of light stands for five answers; the rest land at once. The counts and statistics are unchanged.',
    codeTitle: 'analysis.py · analyze()', codeMeta: 'Live source · lines 87–97', codeLabel: 'Live source: the exclusion gates and how often each line ran',
    codeNote: 'On the right, how often each line really ran; the shading is the share of rows that reached the line. Every submission makes analyze() re-check all rows; the animation replays only new rows and rows whose outcome changed.',
    testsTitle: n => `test_analysis.py · ${n} unit tests`, run: n => `Run the ${n} tests`, cmd: '$ python -m unittest -v test_analysis',
    fallback: 'The live program could not start (unsupported browser, network error or timeout). The framework below is unaffected, and you can run the program locally:',
    download: 'download analysis.py', retry: 'Start again',
    pipe: {
      gates: ['Duplicate ID', 'No consent', 'Not eligible', 'Outside window'], conds: ['counts[id] > 1', 'not consent', 'not eligible', 'not start≤d≤end'],
      keys: GATE_KEYS, included: 'Included', append: 'included.append(row)', loop: 'for row in rows', you: 'Your answer',
      legend: ['yes', 'no', 'not sure'], q3: '= Q3',
    },
  },
};
