import type { Bi } from '../i18n';

export type StepId = 'roster' | 'match' | 'identity' | 'extract' | 'review' | 'writeback';
export type Outcome = 'done' | 'missing-file' | 'missing-field' | 'unreadable' | 'manual-review';
export type StepState = 'passed' | 'stopped' | 'skipped';

export interface DemoCase { id: string; name: Bi; situation: Bi; stopsAt: StepId; outcome: Outcome; result: Bi; next: Bi }

export const STEPS: { id: StepId; label: Bi }[] = [
  { id: 'roster', label: { zh: '主名单', en: 'Roster' } },
  { id: 'match', label: { zh: '查找档案', en: 'Find file' } },
  { id: 'identity', label: { zh: '确认身份', en: 'Confirm identity' } },
  { id: 'extract', label: { zh: '提取候选', en: 'Extract candidates' } },
  { id: 'review', label: { zh: 'HR 审核', en: 'HR review' } },
  { id: 'writeback', label: { zh: '写回并核对', en: 'Write back & verify' } },
];

export const OUTCOME_LABEL: Record<Outcome, Bi> = {
  done: { zh: '已完成', en: 'Done' },
  'missing-file': { zh: '未找到电子档案', en: 'No file found' },
  'missing-field': { zh: '档案存在 · 信息缺失', en: 'File found · field missing' },
  unreadable: { zh: '档案存在 · 识别失败', en: 'File found · unreadable' },
  'manual-review': { zh: '处理状态：人工审核', en: 'Status: manual review' },
};

export const STATE_LABEL: Record<StepState, Bi> = {
  passed: { zh: '通过', en: 'passed' },
  stopped: { zh: '停在这里', en: 'stopped here' },
  skipped: { zh: '未进行', en: 'not reached' },
};

export const DEMO_TEXT = {
  title: { zh: '一条记录，怎样走完补录流程', en: 'How one record moves through the backfill' },
  badge: { zh: '模拟演示 · 全部为虚构数据', en: 'Simulated demo · fictional data only' },
  intro: { zh: '选一位虚构员工，看记录在哪一步通过、在哪一步停下，以及下一步交给谁。', en: 'Pick a fictional employee to see where the record passes, where it stops, and who acts next.' },
  casesLabel: { zh: '虚构员工', en: 'Fictional employees' },
  nextLabel: { zh: '下一步：', en: 'Next: ' },
};

export const CASES: DemoCase[] = [
  {
    id: 'DEMO-001', name: { zh: '员工甲', en: 'Employee A' }, stopsAt: 'writeback', outcome: 'done',
    situation: { zh: '主表里最高学历为空，紧急联系人关系已填"父亲"；档案第 2 页写着"最高学历：本科"，关系一栏写的是"母亲"。', en: 'In the master table, highest education is empty and the emergency-contact relation already says "father". Page 2 of the file says "highest education: bachelor" and gives the relation as "mother".' },
    result: { zh: '"本科"经 HR 确认后写入空白单元格并回读核对；关系字段与主表冲突，保留原值"父亲"，不因模型读到"母亲"就覆盖。', en: '"Bachelor" is written into the empty cell after HR confirms it, then read back. The relation conflicts with the master table, so the existing "father" stays — the model reading "mother" does not overwrite it.' },
    next: { zh: '冲突的关系字段单独交 HR 核对。', en: 'The conflicting relation goes to HR for a separate check.' },
  },
  {
    id: 'DEMO-002', name: { zh: '员工乙', en: 'Employee B' }, stopsAt: 'match', outcome: 'missing-file',
    situation: { zh: '按工号和姓名查找完成后，没有任何对应档案。', en: 'After searching by employee ID and name, no matching file exists.' },
    result: { zh: '进入无档案名单，不用"/"代替状态。', en: 'Goes on the no-file list; a "/" is never used in place of a status.' },
    next: { zh: '联系员工或区域 HR 补交资料。', en: 'Ask the employee or regional HR to submit the document.' },
  },
  {
    id: 'DEMO-003', name: { zh: '员工丙', en: 'Employee C' }, stopsAt: 'extract', outcome: 'missing-field',
    situation: { zh: '身份明确、资料清晰，但档案里没有填写教育结束时间。', en: 'Identity is clear and the file is legible, but it does not give an education end date.' },
    result: { zh: '记录具体缺失的字段，其他字段的候选照常进入审核。', en: 'The missing field is recorded by name; candidates for other fields still go to review.' },
    next: { zh: '定向补充这一个字段。', en: 'Request just that one field.' },
  },
  {
    id: 'DEMO-004', name: { zh: '员工丁', en: 'Employee D' }, stopsAt: 'extract', outcome: 'unreadable',
    situation: { zh: '身份明确，但电话号码所在区域扫描模糊。', en: 'Identity is clear, but the phone number area of the scan is blurred.' },
    result: { zh: '标明页码与识别问题，不猜电话号码。', en: 'The page and the problem are noted; the phone number is never guessed.' },
    next: { zh: '人工阅读原件或重新扫描。', en: 'A person reads the original, or it is rescanned.' },
  },
  {
    id: 'DEMO-005', name: { zh: '员工戊', en: 'Employee E' }, stopsAt: 'identity', outcome: 'manual-review',
    situation: { zh: '文件名里的姓名相同，但工号不一致。', en: 'The name in the file name matches, but the employee ID does not.' },
    result: { zh: '暂停补录，不强行归入无档案，也不写入任何字段。', en: 'The backfill pauses: the record is neither marked "no file" nor written to.' },
    next: { zh: '人工确认档案归属。', en: 'A person confirms who the file belongs to.' },
  },
];

export function trace(c: DemoCase): { id: StepId; state: StepState }[] {
  const stop = STEPS.findIndex(s => s.id === c.stopsAt);
  return STEPS.map((s, i) => ({
    id: s.id,
    state: i < stop ? 'passed' : i === stop ? (c.outcome === 'done' ? 'passed' : 'stopped') : 'skipped',
  }));
}
