import type { Bi } from '../i18n';
import demo from '../../public/assets/job-agent-demo.json';
import { createSim, PROVIDER_IDS } from '../scripts/qd-sim';

const b = (zh: string, en: string): Bi => ({ zh, en });

/* ── Plate 01 · the job agent's verdicts on the replayed role, drawn as a red-pen markup ─────────────────────────────── */

export type Verdict = 'pass' | 'evidence' | 'unconfirmed' | 'open';
export interface CareerRow { jd: Bi; verdict: Verdict; note: Bi; fact?: { id: string; text: Bi } }

/** English for the fictional role's requirement lines (the fixture is Chinese). */
const JD_EN: Record<string, string> = {
  '本科及以上学历': "Bachelor's degree or above",
  '每周至少 4 天': 'At least 4 days a week',
  '连续实习 3 个月': 'Three months in a row',
  '必须熟练使用 SQL': 'Must be fluent in SQL',
  'Tableau 经验加分': 'Tableau experience a plus',
};
const FACT_EN: Record<string, string> = { 'fact-sql-analysis': 'Cleaned business data with SQL and wrote a weekly analysis.' };

/** The engine's own explanation for a passed gate, shortened to a margin note. */
const GATE_NOTE: Record<string, Bi> = {
  '本科及以上学历': b('学历已确认', 'Degree confirmed'),
  '每周至少 4 天': b('可到岗 4 天', 'Available 4 days'),
  '连续实习 3 个月': b('可实习 6 个月', 'Available 6 months'),
};

/** Replay "4 days, Tableau not confirmed" from the public engine (job-agent-demo.json). */
export function careerPlate(): { role: Bi; rows: CareerRow[]; score: number; commit: string } {
  const s = demo.scenarios.find(x => x.days === 4 && !x.tableauConfirmed)!;
  const m = s.match;
  const gate = new Map(m.hard_gates.map(g => [g.requirement, g.status]));
  const skillOf = (text: string) => m.evidence.find(e => text.includes(e.requirement));
  // The engine's advantages quote each confirmed fact as "[fact-id] text".
  const factText = (id: string) => m.advantages.find(a => a.startsWith(`[${id}] `))?.slice(id.length + 3) ?? '';
  const rows = m.job.requirements.map((r): CareerRow => {
    const jd = b(r.text, JD_EN[r.text] ?? r.text);
    const ev = skillOf(r.text);
    if (ev?.status === 'matched') {
      const id = ev.profile_fact_ids[0];
      const note = gate.get(r.text) === 'unknown'
        ? b('有已确认经历作证；"熟练"留给本人确认', 'A confirmed fact backs it; "fluent" is left to the candidate')
        : b('已确认经历作证', 'Backed by a confirmed fact');
      return { jd, verdict: 'evidence', note, fact: { id, text: b(factText(id), FACT_EN[id] ?? id) } };
    }
    if (ev?.status === 'gap') return { jd, verdict: 'unconfirmed', note: b('档案里待确认 → 不写进材料', 'Unconfirmed in the profile → kept out of the materials') };
    if (gate.get(r.text) === 'passes') return { jd, verdict: 'pass', note: GATE_NOTE[r.text] ?? b('通过', 'Passes') };
    return { jd, verdict: 'open', note: b('规则无法判断，留给本人确认', 'Rules cannot tell; left for the candidate to confirm') };
  });
  const role = b(`${m.job.company} · ${m.job.title}`, 'Example Tech (fictional) · AI Operations Intern');
  return { role, rows, score: m.overall_score, commit: demo.sourceCommit.slice(0, 7) };
}

/* ── Plate 02 · QuotaDeck: one reading per pool, models hung beneath ─────────────────────────────────────────────────── */

export interface Pool { provider: string; label: Bi; value: string; fill: number | null; models: Bi[] }

const NAME_EN: [RegExp, string][] = [
  [/^演示模型（非真实数据）$/, 'Demo model (not real data)'], [/^演示对话模型$/, 'Demo chat model'], [/^演示推理模型$/, 'Demo reasoning model'],
  [/^演示模型 /, 'Demo model '],
];
const en = (zh: string) => NAME_EN.reduce((s, [re, to]) => s.replace(re, to), zh);
const POOL_EN: Record<string, string> = {
  'Codex 共享额度': 'Codex shared quota', 'Claude 订阅共享额度': 'Claude subscription quota', 'Gemini Models': 'Gemini Models',
  'DeepSeek 账户余额': 'DeepSeek account balance', 'WorkBuddy 积分': 'WorkBuddy credits',
};

type Raw = { name: string; remainingPercent?: number; balances?: { total_balance: string }[]; remainingCredits?: number; totalCredits?: number;
  models: ({ name: string; poolLabel?: string } | string)[] };

/** The live page's simulator at its starting moment: the same raw readings QuotaDeck normalises there. */
export function quotaPlate(): { pools: Pool[]; perModel: { model: Bi; value: string }[] } {
  const sim = createSim();
  const pools = PROVIDER_IDS.map((id): Pool => {
    const r = sim.raw(id) as Raw;
    const names = r.models.map(x => (typeof x === 'string' ? x : x.name));
    const first = r.models[0];
    const poolZh = (typeof first === 'object' && first.poolLabel) || (id === 'deepseek' ? 'DeepSeek 账户余额' : id === 'workbuddy' ? 'WorkBuddy 积分' : `${r.name} 共享额度`);
    let value: string, fill: number | null;
    if (r.balances) { value = `¥${r.balances[0].total_balance}`; fill = null; }
    else if (r.totalCredits) { value = `${r.remainingCredits} / ${r.totalCredits}`; fill = Math.round((r.remainingCredits! / r.totalCredits) * 100) / 100; }
    else { value = `${Math.round(r.remainingPercent!)}%`; fill = Math.round(r.remainingPercent!) / 100; }
    return { provider: r.name, label: b(poolZh, POOL_EN[poolZh] ?? poolZh), value, fill, models: names.map(n => b(n, en(n))) };
  });
  return { pools, perModel: pools.flatMap(p => p.models.map(model => ({ model, value: p.value }))) };
}

/* ── Plate 03 · the four parts of a task's cost (the study's frame; a schematic, no measured data) ──────────────────── */

export const CAMPUS_PLATE = {
  seems: b('看起来', 'What it looks like'),
  counts: b('实际计入', 'What it costs'),
  generate: b('生成', 'Generate'),
  seconds: b('几秒就出答案', 'an answer in seconds'),
  stages: [
    { key: 'prep', label: b('输入准备', 'Preparing input'), weight: 3 },
    { key: 'wait', label: b('生成等待', 'Waiting on output'), weight: 1 },
    { key: 'revise', label: b('修订', 'Revising'), weight: 2 },
    { key: 'verify', label: b('核验', 'Verifying'), weight: 3 },
  ],
  verify: b('研究的重点：没有核验，就不算完成', "The study's focus: without verification the task is not done"),
  note: b('结构示意：各段长短只表示顺序与构成，不是实验数据', 'Schematic: segment lengths show order and make-up, not measured data'),
} as const;
