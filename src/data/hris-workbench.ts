import type { Bi } from '../i18n';
import { CASES, type DemoCase, type StepId } from '../scripts/hris-demo';

export interface Version { id: 'v1' | 'v2' | 'final'; label: Bi; nature: Bi; chain: Bi[]; tools: Partial<Record<StepId, Bi>> }

/** The three versions of the backfill workflow, as the experience ledger records them (档案 4.1). Steps whose tools the
 *  ledger does not record for a version are left unnamed rather than guessed. */
export const VERSIONS: Version[] = [
  { id: 'v1', label: { zh: '第一版', en: 'First version' }, nature: { zh: '个人实践原型', en: 'Personal prototype' },
    chain: [{ zh: 'OpenClaw 调用 DeepSeek、ChatGPT 提取字段', en: 'OpenClaw calls DeepSeek and ChatGPT to extract fields' }, { zh: '模型只给候选，写入由人工决定', en: 'The model only proposes; a person decides what is written' }],
    tools: { extract: { zh: 'OpenClaw · DeepSeek / ChatGPT', en: 'OpenClaw · DeepSeek / ChatGPT' }, review: { zh: '人工审核', en: 'Manual review' } } },
  { id: 'v2', label: { zh: '第二版', en: 'Second version' }, nature: { zh: '个人实践', en: 'Personal practice' },
    chain: [{ zh: '本地 OCR 识别扫描件', en: 'Local OCR reads the scans' }, { zh: 'DeepSeek 从识别结果里提取字段', en: 'DeepSeek extracts fields from the OCR text' }, { zh: '模型只给候选，写入由人工决定', en: 'The model only proposes; a person decides what is written' }],
    tools: { extract: { zh: '本地 OCR · DeepSeek', en: 'Local OCR · DeepSeek' }, review: { zh: '人工审核', en: 'Manual review' } } },
  { id: 'final', label: { zh: '最终版', en: 'Final version' }, nature: { zh: '在公司批准的环境中运行，已交接给 mentor', en: 'Ran in the company-approved environment; handed over to my mentor' },
    chain: [{ zh: 'Power Automate 按工号查找文件并返回工号', en: 'Power Automate finds each file by employee ID and returns the ID' }, { zh: 'Copilot（AI Builder）识别图像中的字段', en: 'Copilot (AI Builder) reads the fields in the image' }, { zh: '分流：通过的自动录入，其余转人工复核', en: 'Routing: passed records are entered automatically; the rest go to manual review' }, { zh: 'Excel 作为数据载体，资料存于 SharePoint', en: 'Excel holds the data; the files live in SharePoint' }],
    tools: { match: { zh: 'Power Automate', en: 'Power Automate' }, identity: { zh: 'Power Automate 返回工号', en: 'Power Automate returns the ID' }, extract: { zh: 'Copilot · AI Builder', en: 'Copilot · AI Builder' }, review: { zh: '人工复核', en: 'Manual review' }, writeback: { zh: 'Power Automate → Excel', en: 'Power Automate → Excel' } } },
];

/** The routing rules of the final version (档案 4.1). */
export const ROUTING: Bi[] = [
  { zh: '无法识别、识别不清、字段缺失 → 转人工复核', en: 'Unreadable, unclear or missing fields → manual review' },
  { zh: '手写件最容易出错 → 一律人工复核', en: 'Handwritten forms are the most error-prone → always manual review' },
  { zh: '核验完成 → 自动录入', en: 'Verified → entered automatically' },
  { zh: '每满 100 份 → 这 100 份全部人工核对一次，不是抽查', en: 'Every 100 files → all 100 are checked by hand, not sampled' },
];

const HANDWRITTEN: DemoCase = {
  id: 'DEMO-006', name: { zh: '员工己', en: 'Employee F' }, stopsAt: 'review', outcome: 'manual-review',
  situation: { zh: '资料是手写填写的登记表，字迹可以辨认。', en: 'The record is a handwritten form; the writing is legible.' },
  result: { zh: '候选字段已提取，但手写件一律转人工复核，不自动录入。', en: 'Candidate fields are extracted, but handwritten forms always go to manual review and are never entered automatically.' },
  next: { zh: 'HR 对照原件逐项核对后再录入。', en: 'HR checks each field against the original before entry.' },
  trail: [
    { zh: '花名册第 6 行：DEMO-006 员工己', en: 'Roster row 6: DEMO-006 Employee F' },
    { zh: '找到 DEMO-006_员工己.pdf（手写登记表扫描件）', en: 'Found DEMO-006_EmployeeF.pdf (scan of a handwritten form)' },
    { zh: '工号、姓名与文件内容一致', en: 'ID and name match the document' },
    { zh: '候选：住址、紧急联系人（手写）', en: 'Candidates: address, emergency contact (handwritten)' },
    { zh: '手写件 → 转人工复核', en: 'Handwritten → manual review' },
  ],
};

export const WB_CASES: DemoCase[] = [...CASES, HANDWRITTEN];

export const WB_TEXT = {
  title: { zh: '档案补录流程终端', en: 'Records backfill workflow terminal' },
  intro: { zh: '选一份虚构档案，看它在补录流程的哪一步通过、在哪一步停下；切换版本，看每一版用了哪些工具。', en: 'Pick a fictional record to see where it passes and where it stops; switch versions to see which tools each one used.' },
  records: { zh: '虚构档案', en: 'Fictional records' },
  versions: { zh: '版本', en: 'Version' },
  chain: { zh: '这一版的做法', en: 'How this version worked' },
  routing: { zh: '分流与复核规则（最终版）', en: 'Routing and review rules (final version)' },
  notRecorded: { zh: '这一版未单独记录', en: 'Not recorded for this version' },
  toProject: { zh: '看档案补录项目页 →', en: 'Open the records backfill project →' },
};
