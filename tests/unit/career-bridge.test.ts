import { describe, it, expect, beforeAll } from 'vitest';
import { call } from '../../public/assets/py-core.mjs';
import { bootNode } from './py-node';
import { DEMO_JD } from '../../src/scripts/career-live-text';

let py: any;
beforeAll(async () => { py = await bootNode(); }, 120_000);
const run = (jd: string, candidate: object): any => call(py, 'career_bridge', 'run', [jd, candidate]);
const TABLEAU = { 'fact-pending-tableau': 'user_confirmed' };

describe('career bridge running the real engine under Pyodide', () => {
  it('four days: the unknown SQL requirement caps the raw 86 at 84', () => {
    const r = run(DEMO_JD, { days: 4 });
    expect([r.raw, r.cap, r.score]).toEqual([86, 84, 84]);
    expect(r.gates.find((g: any) => g.requirement === '必须熟练使用 SQL').status).toBe('unknown');
    expect(r.pack.factIds).toEqual(['fact-sql-analysis']);
  });
  it('three days: the failed hard requirement caps the raw 81 at 59', () => {
    const r = run(DEMO_JD, { days: 3 });
    expect([r.raw, r.cap, r.score]).toEqual([81, 59, 59]);
    expect(r.gates.find((g: any) => g.requirement === '每周至少 4 天').status).toBe('fails');
  });
  it('confirming Tableau puts a second fact into the materials; the cap still holds', () => {
    const r = run(DEMO_JD, { days: 4, statuses: TABLEAU });
    expect([r.raw, r.cap, r.score]).toEqual([95, 84, 84]);
    expect(r.pack.factIds).toEqual(['fact-sql-analysis', 'fact-pending-tableau']);
  });
  it('unknown availability: raw 83 stays under the 84 cap', () => {
    const r = run(DEMO_JD, { days: null });
    expect([r.raw, r.cap, r.score]).toEqual([83, 84, 83]);
  });
  it('an added fact is matched by skill and enters the materials', () => {
    const jd = '岗位：数据分析实习生\n岗位要求：\n- 熟练使用 Python 和 SQL；\n- 每周至少 3 天；\n- 有数据可视化经验（Power BI 或 Tableau）；\n- 良好的沟通能力。';
    const r = run(jd, { days: 4, added: [{ statement: '用 Python 和 pandas 做过销售数据清洗与可视化', skills: ['Python', 'pandas'], status: 'user_confirmed' }] });
    expect(r.cap).toBeNull();
    expect(r.evidence.find((e: any) => e.skill === 'Python').factIds).toEqual(['fact-visitor-1']);
    expect(r.pack.factIds).toContain('fact-visitor-1');
    expect(r.requirements.map((q: any) => q.category)).toEqual(['tool', 'availability', 'experience', 'other']);
  });
  it('pack error is returned, not raised, when no confirmed fact is left', () => {
    const r = run(DEMO_JD, { days: 4, removed: ['fact-sql-analysis'] });
    expect(r.pack).toBeNull();
    expect(r.packError).toBe('Profile 中没有可用于投递材料的已确认事实。');
    expect(r.score).toBe(45);
  });
  it('rejects empty and oversized input without running the engine', () => {
    expect(run('   ', { days: 4 }).error).toBe('职位描述不能为空。');
    expect(run('字'.repeat(20001), { days: 4 }).error).toBe('职位描述超过 20,000 字。');
    expect(run(DEMO_JD, { days: 9 }).error).toBe('每周到岗天数应为 1–7。');
    expect(run(DEMO_JD, { days: 4, added: [{ statement: '经'.repeat(201), skills: [], status: 'user_confirmed' }] }).error).toBe('每条经历不超过 200 字。');
    expect(run(DEMO_JD, { days: 4, added: Array.from({ length: 21 }, () => ({ statement: '一条', skills: [], status: 'user_confirmed' })) }).error).toBe('新增经历最多 20 条。');
  });
  it('reports the fictional candidate the circuit draws', () => {
    const r = run(DEMO_JD, { days: 4 });
    expect(r.profile).toEqual({ education: '本科 · 信息管理', days: 4, months: 6, facts: [
      { id: 'fact-sql-analysis', statement: '使用 SQL 清洗业务数据并输出周度分析。', status: 'documented' },
      { id: 'fact-pending-tableau', statement: '独立搭建 Tableau 仪表盘。', status: 'needs_confirmation' },
    ] });
    expect(r.ms).toBeGreaterThan(0);
  });
});
