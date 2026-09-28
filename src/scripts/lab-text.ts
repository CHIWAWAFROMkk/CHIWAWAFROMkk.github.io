import type { Lang } from '../i18n';

type Delim = ',' | ';' | '\t';

export interface LabText {
  metrics: [string, string, string, string];
  audit: (input: number, dup: number, missing: number, kept: number) => string;
  statKeys: [string, string, string, string, string, string, string];
  numericNote: (blank: number, bad: number) => string;
  sourceLabel: (name: string, cols: number, delimiter: string) => string;
  delimiters: Record<Delim, string>;
  sampleNote: string; fileNote: string; kept: string; utf8Error: string;
  exampleLoading: string; exampleError: string; pasteName: string; hashUnavailable: string;
  typeLabel: Record<'数值' | '文本', string>;
  binTitle: (lo: string, op: string, hi: string, n: number) => string;
  statsTitle: (name: string) => string;
  pageInfo: (a: number, b: number, n: number) => string;
  sortTitle: (h: string) => string;
  blankCell: string; jsonMethod: string; numberLocale: string;
}

export const LAB_TEXT: Record<Lang, LabText> = {
  zh: {
    metrics: ['当前数据行', '字段', '空白单元格', '输入中的重复行'],
    audit: (i, d, m, k) => `输入 ${i} 行 → 去重移除 ${d} 行 → 空值过滤移除 ${m} 行 → 保留 ${k} 行。重复行按完整原始单元格逐项相同判定，保留首次出现。`,
    statKeys: ['有效数值', '均值', '中位数', '最小值', '最大值', '样本标准差', 'IQR 异常候选'],
    numericNote: (blank, bad) => `本列 ${blank} 个空白、${bad} 个非数值未参与统计。编号与日期建议仅用于分组；数字型编号的数值统计没有业务含义。异常候选不会自动删除。`,
    sourceLabel: (name, cols, delim) => `${name} · ${cols} 列 · ${delim}分隔`,
    delimiters: { ',': '逗号', ';': '分号', '\t': '制表符' },
    sampleNote: '当前为人工构造的行情结构示例，不是真实市场数据。可上传自己的 CSV 替换。',
    fileNote: '已读取文件。计算在当前浏览器完成，数据不会上传到服务器。',
    kept: ' 原有分析结果已保留。',
    utf8Error: '文件不是有效的 UTF-8 文本。请另存为 CSV UTF-8 后重试；暂不支持 Excel 工作簿。',
    exampleLoading: '正在读取示例…',
    exampleError: '示例未能加载。请稍后重试，或粘贴自己的 CSV。',
    pasteName: '粘贴数据', hashUnavailable: '不可用',
    typeLabel: { '数值': '数值', '文本': '文本' },
    binTitle: (lo, op, hi, n) => `${lo} ${op} ${hi}：${n} 行`,
    statsTitle: name => `${name} · 数值分布`,
    pageInfo: (a, b, n) => `${a}–${b} / ${n} 行`,
    sortTitle: h => `按 ${h} 排序`,
    blankCell: '空白',
    jsonMethod: '空白不填补；数值严格解析；分位数线性插值；标准差 n-1；异常值用 1.5×IQR。表格搜索/排序不改变统计与导出。',
    numberLocale: 'zh-CN',
  },
  en: {
    metrics: ['Rows now', 'Columns', 'Blank cells', 'Duplicate rows in input'],
    audit: (i, d, m, k) => `Input ${i} rows → ${d} removed as duplicates → ${m} removed for blanks → ${k} kept. A duplicate means every original cell matches; the first occurrence is kept.`,
    statKeys: ['Valid numbers', 'Mean', 'Median', 'Min', 'Max', 'Sample std. dev.', 'IQR outlier candidates'],
    numericNote: (blank, bad) => `${blank} blank and ${bad} non-numeric values in this column were left out. Use IDs and dates only for grouping; numeric statistics on ID numbers mean nothing. Outlier candidates are never removed automatically.`,
    sourceLabel: (name, cols, delim) => `${name} · ${cols} columns · ${delim}-separated`,
    delimiters: { ',': 'comma', ';': 'semicolon', '\t': 'tab' },
    sampleNote: 'This is a hand-made sample shaped like market data, not real market data. Upload your own CSV to replace it.',
    fileNote: 'File read. Everything is computed in this browser; nothing is uploaded.',
    kept: ' The previous result is kept.',
    utf8Error: 'This file is not valid UTF-8 text. Save it as "CSV UTF-8" and try again; Excel workbooks are not supported yet.',
    exampleLoading: 'Loading the sample…',
    exampleError: 'The sample could not load. Try again later, or paste your own CSV.',
    pasteName: 'pasted data', hashUnavailable: 'unavailable',
    typeLabel: { '数值': 'number', '文本': 'text' },
    binTitle: (lo, op, hi, n) => `${lo} ${op} ${hi}: ${n} rows`,
    statsTitle: name => `${name} · distribution`,
    pageInfo: (a, b, n) => `${a}–${b} of ${n} rows`,
    sortTitle: h => `Sort by ${h}`,
    blankCell: 'blank',
    jsonMethod: 'Blanks are not filled; numbers are parsed strictly; quantiles use linear interpolation; standard deviation uses n−1; outliers use 1.5×IQR. Searching and sorting the table do not change statistics or exports.',
    numberLocale: 'en-US',
  },
};
