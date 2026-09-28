import type { Bi } from '../i18n';

export type StepId = 'roster' | 'match' | 'identity' | 'extract' | 'review' | 'writeback';
export type Outcome = 'done' | 'missing-file' | 'missing-field' | 'unreadable' | 'manual-review';
export type StepState = 'passed' | 'stopped' | 'skipped';

/** trail: what the record card shows at each step the record reached (last line = where it stopped). */
export interface DemoCase { id: string; name: Bi; situation: Bi; stopsAt: StepId; outcome: Outcome; result: Bi; next: Bi; trail: Bi[] }

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
  stepsLabel: { zh: '流程进度：左右移动查看每一步', en: 'Process steps: move left or right to inspect each one' },
  cardLabel: { zh: '档案卡片', en: 'Record card' },
  skipped: { zh: '之后的步骤没有进行：记录停在上一步。', en: 'Later steps never ran — the record stopped at the step above.' },
};

export const CASES: DemoCase[] = [
  {
    id: 'DEMO-001', name: { zh: '员工甲', en: 'Employee A' }, stopsAt: 'writeback', outcome: 'done',
    situation: { zh: '主表里最高学历为空，紧急联系人关系已填"父亲"；档案第 2 页写着"最高学历：本科"，关系一栏写的是"母亲"。', en: 'In the master table, highest education is empty and the emergency-contact relation already says "father". Page 2 of the file says "highest education: bachelor" and gives the relation as "mother".' },
    result: { zh: '"本科"经 HR 确认后写入空白单元格并回读核对；关系字段与主表冲突，保留原值"父亲"，不因模型读到"母亲"就覆盖。', en: '"Bachelor" is written into the empty cell after HR confirms it, then read back. The relation conflicts with the master table, so the existing "father" stays — the model reading "mother" does not overwrite it.' },
    next: { zh: '冲突的关系字段单独交 HR 核对。', en: 'The conflicting relation goes to HR for a separate check.' },
    trail: [
      { zh: '花名册第 1 行：DEMO-001 员工甲', en: 'Roster row 1: DEMO-001 Employee A' },
      { zh: '找到 DEMO-001_员工甲.pdf', en: 'Found DEMO-001_EmployeeA.pdf' },
      { zh: '工号、姓名与文件内容一致', en: 'ID and name match the document' },
      { zh: '候选：学历「本科」（第 2 页）；关系「母亲」与主表「父亲」冲突', en: 'Candidates: education "bachelor" (page 2); relation "mother" conflicts with "father"' },
      { zh: 'HR 确认学历；关系字段转人工核对', en: 'HR approves education; the relation goes to a manual check' },
      { zh: '「本科」写入空白单元格，回读一致', en: '"Bachelor" written to the empty cell; read-back matches' },
    ],
  },
  {
    id: 'DEMO-002', name: { zh: '员工乙', en: 'Employee B' }, stopsAt: 'match', outcome: 'missing-file',
    situation: { zh: '按工号和姓名查找完成后，没有任何对应档案。', en: 'After searching by employee ID and name, no matching file exists.' },
    result: { zh: '进入无档案名单，不用"/"代替状态。', en: 'Goes on the no-file list; a "/" is never used in place of a status.' },
    next: { zh: '联系员工或区域 HR 补交资料。', en: 'Ask the employee or regional HR to submit the document.' },
    trail: [
      { zh: '花名册第 2 行：DEMO-002 员工乙', en: 'Roster row 2: DEMO-002 Employee B' },
      { zh: '按工号和姓名都没有找到档案', en: 'No file found by ID or by name' },
    ],
  },
  {
    id: 'DEMO-003', name: { zh: '员工丙', en: 'Employee C' }, stopsAt: 'extract', outcome: 'missing-field',
    situation: { zh: '身份明确、资料清晰，但档案里没有填写教育结束时间。', en: 'Identity is clear and the file is legible, but it does not give an education end date.' },
    result: { zh: '记录具体缺失的字段，其他字段的候选照常进入审核。', en: 'The missing field is recorded by name; candidates for other fields still go to review.' },
    next: { zh: '定向补充这一个字段。', en: 'Request just that one field.' },
    trail: [
      { zh: '花名册第 3 行：DEMO-003 员工丙', en: 'Roster row 3: DEMO-003 Employee C' },
      { zh: '找到 DEMO-003_员工丙.pdf', en: 'Found DEMO-003_EmployeeC.pdf' },
      { zh: '工号、姓名与文件内容一致', en: 'ID and name match the document' },
      { zh: '档案里没有填写教育结束时间', en: 'The document gives no education end date' },
    ],
  },
  {
    id: 'DEMO-004', name: { zh: '员工丁', en: 'Employee D' }, stopsAt: 'extract', outcome: 'unreadable',
    situation: { zh: '身份明确，但电话号码所在区域扫描模糊。', en: 'Identity is clear, but the phone number area of the scan is blurred.' },
    result: { zh: '标明页码与识别问题，不猜电话号码。', en: 'The page and the problem are noted; the phone number is never guessed.' },
    next: { zh: '人工阅读原件或重新扫描。', en: 'A person reads the original, or it is rescanned.' },
    trail: [
      { zh: '花名册第 4 行：DEMO-004 员工丁', en: 'Roster row 4: DEMO-004 Employee D' },
      { zh: '找到 DEMO-004_员工丁.pdf', en: 'Found DEMO-004_EmployeeD.pdf' },
      { zh: '工号、姓名与文件内容一致', en: 'ID and name match the document' },
      { zh: '电话号码区域扫描模糊，无法识别', en: 'The phone number area is blurred and unreadable' },
    ],
  },
  {
    id: 'DEMO-005', name: { zh: '员工戊', en: 'Employee E' }, stopsAt: 'identity', outcome: 'manual-review',
    situation: { zh: '文件名里的姓名相同，但工号不一致。', en: 'The name in the file name matches, but the employee ID does not.' },
    result: { zh: '暂停补录，不强行归入无档案，也不写入任何字段。', en: 'The backfill pauses: the record is neither marked "no file" nor written to.' },
    next: { zh: '人工确认档案归属。', en: 'A person confirms who the file belongs to.' },
    trail: [
      { zh: '花名册第 5 行：DEMO-005 员工戊', en: 'Roster row 5: DEMO-005 Employee E' },
      { zh: '找到文件名为「员工戊」的档案', en: 'Found a file named "Employee E"' },
      { zh: '文件内工号与花名册不一致，归属不明', en: 'The ID inside the file differs from the roster — ownership unclear' },
    ],
  },
];

/** Step index under a pointer at clientX over a bar spanning [left, left + width). */
export function stepFromPointer(x: number, left: number, width: number, count: number): number {
  const i = Math.floor(((x - left) / width) * count);
  return Math.min(count - 1, Math.max(0, i));
}

export function trace(c: DemoCase): { id: StepId; state: StepState }[] {
  const stop = STEPS.findIndex(s => s.id === c.stopsAt);
  return STEPS.map((s, i) => ({
    id: s.id,
    state: i < stop ? 'passed' : i === stop ? (c.outcome === 'done' ? 'passed' : 'stopped') : 'skipped',
  }));
}
