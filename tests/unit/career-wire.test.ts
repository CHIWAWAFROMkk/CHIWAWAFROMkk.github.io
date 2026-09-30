import { describe, it, expect } from 'vitest';
import { wire, capInfo, observation, type EngineResult } from '../../src/scripts/career-wire';

const SQL = { id: 'fact-sql-analysis', statement: '使用 SQL 清洗业务数据并输出周度分析。', status: 'documented' };
const TAB = { id: 'fact-pending-tableau', statement: '独立搭建 Tableau 仪表盘。', status: 'needs_confirmation' };
const REQS = [
  { text: '本科及以上学历', category: 'education', hardGate: true },
  { text: '每周至少 4 天', category: 'availability', hardGate: true },
  { text: '连续实习 3 个月', category: 'availability', hardGate: true },
  { text: '必须熟练使用 SQL', category: 'tool', hardGate: true },
  { text: 'Tableau 经验加分', category: 'experience', hardGate: false },
];
const gate = (requirement: string, status: 'passes' | 'fails' | 'unknown') => ({ requirement, status, factIds: [] as string[], explanation: '' });
function demo(days: number | null, over: Partial<EngineResult> = {}): EngineResult {
  return {
    ms: 1.5, job: { company: '示例科技（虚构）', title: 'AI运营实习生' }, requirements: REQS,
    evidence: [{ skill: 'SQL', status: 'matched', factIds: ['fact-sql-analysis'] }, { skill: 'Tableau', status: 'gap', factIds: [] }],
    gates: [gate('本科及以上学历', 'passes'), gate('每周至少 4 天', days === 3 ? 'fails' : days === null ? 'unknown' : 'passes'),
      gate('连续实习 3 个月', 'passes'), gate('必须熟练使用 SQL', 'unknown')],
    profile: { education: '本科 · 信息管理', days, months: 6, facts: [SQL, TAB] },
    score: days === 3 ? 59 : days === null ? 83 : 84, raw: days === 3 ? 81 : days === null ? 83 : 86, cap: days === 3 ? 59 : 84,
    recommendation: 'recommend', pack: { factIds: ['fact-sql-analysis'], blocks: 5 }, packError: null, ...over,
  };
}
const JD2: EngineResult = {
  ms: 2.1, job: { company: '未识别', title: '数据分析实习生' },
  requirements: [
    { text: '熟练使用 Python 和 SQL', category: 'tool', hardGate: false },
    { text: '每周至少 3 天', category: 'availability', hardGate: true },
    { text: '有数据可视化经验（Power BI 或 Tableau）', category: 'experience', hardGate: false },
    { text: '良好的沟通能力', category: 'other', hardGate: false },
  ],
  evidence: [
    { skill: 'SQL', status: 'matched', factIds: ['fact-sql-analysis'] }, { skill: 'Python', status: 'matched', factIds: ['fact-visitor-1'] },
    { skill: 'Power BI', status: 'gap', factIds: [] }, { skill: 'Tableau', status: 'gap', factIds: [] }, { skill: '数据可视化', status: 'gap', factIds: [] },
  ],
  gates: [gate('每周至少 3 天', 'passes')],
  profile: { education: '本科 · 信息管理', days: 4, months: 6, facts: [SQL, TAB, { id: 'fact-visitor-1', statement: '用 Python 和 pandas 做过销售数据清洗与可视化', status: 'user_confirmed' }] },
  score: 68, raw: 68, cap: null, recommendation: 'try', pack: { factIds: ['fact-sql-analysis', 'fact-visitor-1'], blocks: 4 }, packError: null,
};
const pairs = (r: EngineResult) => wire(r, 'zh').wires.map(w => [w.req, w.target, w.tone]);
const REFUSED = { pack: null, packError: 'Profile 中没有可用于投递材料的已确认事实。' };

describe('career wire', () => {
  it('connects each requirement to what the engine actually used', () => {
    expect(pairs(demo(4))).toEqual([
      [0, 'field-education', 'ok'], [1, 'field-days', 'ok'], [2, 'field-months', 'ok'], [3, 'fact-sql-analysis', 'unknown'], [4, null, 'gap'],
    ]);
  });
  it('three days turns the availability wire into a failure and relabels the field', () => {
    const m = wire(demo(3), 'zh');
    expect(m.wires[1]).toEqual({ req: 1, target: 'field-days', tone: 'fail' });
    expect(m.targets.find(t => t.id === 'field-days')!.label).toBe('每周可到岗 3 天');
    expect(m.reqs[1].sub).toBe('硬门槛 · 不满足');
  });
  it('a skill requirement can reach several facts; an unassessed one gets a dim stub', () => {
    expect(pairs(JD2)).toEqual([
      [0, 'fact-sql-analysis', 'ok'], [0, 'fact-visitor-1', 'ok'], [1, 'field-days', 'ok'], [2, null, 'gap'], [3, null, 'none'],
    ]);
    expect(wire(JD2, 'zh').reqs[3].sub).toBe('未评估');
    expect(wire(JD2, 'zh').reqs[0].sub).toBe('技能 · SQL · Python');
  });
  it('lists the three profile fields first, then every fact, lit when an ok wire reaches it', () => {
    const t = wire(demo(4), 'zh').targets;
    expect(t.map(x => x.id)).toEqual(['field-education', 'field-days', 'field-months', 'fact-sql-analysis', 'fact-pending-tableau']);
    expect(t.map(x => x.tone)).toEqual(['ok', 'ok', 'ok', 'unknown', 'none']);
    expect(t[3]).toMatchObject({ label: '使用 SQL 清洗业务数据并输出周度分析', sub: 'fact-sql-analysis · 有文档依据' });
  });
  it('materials keep only facts that exist; a refusal is carried through', () => {
    expect(wire(demo(4), 'zh').materials).toEqual(['fact-sql-analysis']);
    const refused = wire(demo(4, REFUSED), 'zh');
    expect(refused.materials).toEqual([]);
    expect(refused.packError).toContain('没有可用于投递材料');
  });
  it('capInfo says when the score slams and which source lines ran', () => {
    expect(capInfo(demo(4))).toEqual({ slam: true, tone: 'unknown', steps: [
      { line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'on', tone: 'soft' }, { line: 700, mode: 'on', tone: 'soft' }, { line: 702, mode: 'on', tone: '' }] });
    expect(capInfo(demo(3)).steps.map(s => [s.line, s.tone])).toEqual([[697, 'red'], [698, 'red'], [702, '']]);
    expect(capInfo(demo(3)).tone).toBe('fail');
    expect(capInfo(demo(null)).slam).toBe(false);
    expect(capInfo(JD2)).toEqual({ slam: false, tone: null, steps: [{ line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'flash', tone: '' }, { line: 702, mode: 'on', tone: '' }] });
  });
  it('observation explains the cap and the materials from the result', () => {
    expect(observation(demo(3), 'zh')).toBe('硬门槛不满足（每周至少 4 天），原始分 81，总分被限制在 59。1 条已确认的事实进入材料。');
    expect(observation(demo(4), 'zh')).toBe('有待确认的硬门槛（必须熟练使用 SQL），原始分 86，总分被限制在 84。1 条已确认的事实进入材料。');
    expect(observation(demo(null), 'zh')).toBe('有待确认的硬门槛（每周至少 4 天、必须熟练使用 SQL），原始分 83 未超过上限 84。1 条已确认的事实进入材料。');
    expect(observation(JD2, 'zh')).toBe('没有不满足或待确认的硬门槛，总分 68 不设上限。2 条已确认的事实进入材料。');
    expect(observation(demo(4, REFUSED), 'zh')).toContain('引擎未生成材料：Profile 中没有可用于投递材料的已确认事实。');
  });
  it('English labels', () => {
    const m = wire(demo(4), 'en');
    expect(m.reqs[0].sub).toBe('Hard requirement · Meets');
    expect(m.targets[1].label).toBe('4 days a week');
    expect(observation(demo(3), 'en')).toBe('Hard requirement not met (每周至少 4 天): raw 81, capped at 59. 1 confirmed fact enters the materials.');
  });
});
