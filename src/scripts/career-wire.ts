import type { Lang } from '../i18n';

/** What career_bridge.run returns (see public/assets/py/career_bridge.py). */
export interface EngineResult {
  ms: number;
  job: { company: string; title: string };
  requirements: { text: string; category: string; hardGate: boolean }[];
  evidence: { skill: string; status: 'matched' | 'gap' | 'unknown'; factIds: string[] }[];
  gates: { requirement: string; status: 'passes' | 'fails' | 'unknown'; factIds: string[]; explanation: string }[];
  profile: { education: string | null; days: number | null; months: number | null; facts: { id: string; statement: string; status: string }[] };
  score: number; raw: number; cap: number | null; recommendation: string;
  pack: { factIds: string[]; blocks: number } | null;
  packError: string | null;
}
export type Tone = 'ok' | 'gap' | 'unknown' | 'fail' | 'none';
export interface CircuitNode { id: string; label: string; sub: string; tone: Tone }
export interface Wire { req: number; target: string | null; tone: Tone }
export interface CircuitModel { reqs: CircuitNode[]; targets: CircuitNode[]; wires: Wire[]; materials: string[]; packError: string | null }
export interface CapStep { line: number; mode: 'flash' | 'on'; tone: '' | 'red' | 'soft' }

type Names = (g: string[], raw: number, cap: number | null) => string;
const L: Record<Lang, {
  gate: string; skill: string; none: string; self: string; status: Record<string, string>; fact: Record<string, string>;
  noEducation: string; days: (d: number) => string; noDays: string; months: (m: number) => string; noMonths: string;
  fail: Names; capped: Names; under: Names; free: (raw: number) => string; pack: (n: number) => string; noPack: (e: string) => string; sep: string;
}> = {
  zh: {
    gate: '硬门槛', skill: '技能', none: '未评估', self: '本人填写',
    status: { passes: '满足', fails: '不满足', unknown: '待确认' },
    fact: { documented: '有文档依据', user_confirmed: '已确认', needs_confirmation: '待确认' },
    noEducation: '学历未填写', days: d => `每周可到岗 ${d} 天`, noDays: '到岗天数未填写',
    months: m => `可连续实习 ${m} 个月`, noMonths: '实习时长未填写',
    fail: (g, raw, cap) => `硬门槛不满足（${g.join('、')}），原始分 ${raw}，总分被限制在 ${cap}。`,
    capped: (g, raw, cap) => `有待确认的硬门槛（${g.join('、')}），原始分 ${raw}，总分被限制在 ${cap}。`,
    under: (g, raw, cap) => `有待确认的硬门槛（${g.join('、')}），原始分 ${raw} 未超过上限 ${cap}。`,
    free: raw => `没有不满足或待确认的硬门槛，总分 ${raw} 不设上限。`,
    pack: n => `${n} 条已确认的事实进入材料。`, noPack: e => `引擎未生成材料：${e}`, sep: '',
  },
  en: {
    gate: 'Hard requirement', skill: 'Skill', none: 'Not assessed', self: 'entered by the candidate',
    status: { passes: 'Meets', fails: 'Does not meet', unknown: 'To confirm' },
    fact: { documented: 'Documented', user_confirmed: 'Confirmed', needs_confirmation: 'To confirm' },
    noEducation: 'Education not given', days: d => `${d} days a week`, noDays: 'Availability not given',
    months: m => `${m} months of internship`, noMonths: 'Internship length not given',
    fail: (g, raw, cap) => `Hard requirement not met (${g.join(', ')}): raw ${raw}, capped at ${cap}.`,
    capped: (g, raw, cap) => `Hard requirement to confirm (${g.join(', ')}): raw ${raw}, capped at ${cap}.`,
    under: (g, raw, cap) => `Hard requirement to confirm (${g.join(', ')}): raw ${raw} stays under the ${cap} cap.`,
    free: raw => `No hard requirement failed or unconfirmed: ${raw}, uncapped.`,
    pack: n => `${n} confirmed fact${n === 1 ? '' : 's'} ${n === 1 ? 'enters' : 'enter'} the materials.`,
    noPack: e => `The engine produced no materials: ${e}`, sep: ' ',
  },
};
const GATE_TONE: Record<string, Tone> = { passes: 'ok', fails: 'fail', unknown: 'unknown' };
const EVIDENCE_TONE: Record<string, Tone> = { matched: 'ok', gap: 'gap', unknown: 'unknown' };
const WORST: Tone[] = ['fail', 'gap', 'unknown', 'ok'];
const worst = (tones: Tone[]): Tone => WORST.find(t => tones.includes(t)) ?? 'none';

export function wire(r: EngineResult, lang: Lang): CircuitModel {
  const T = L[lang], facts = r.profile.facts, known = new Set(facts.map(f => f.id));
  const targets: CircuitNode[] = [
    { id: 'field-education', label: r.profile.education ?? T.noEducation, sub: `education · ${T.self}`, tone: 'none' },
    { id: 'field-days', label: r.profile.days ? T.days(r.profile.days) : T.noDays, sub: `availability · ${T.self}`, tone: 'none' },
    { id: 'field-months', label: r.profile.months ? T.months(r.profile.months) : T.noMonths, sub: `availability · ${T.self}`, tone: 'none' },
    ...facts.map(f => ({ id: f.id, label: f.statement.replace(/。$/, ''), sub: `${f.id} · ${T.fact[f.status] ?? f.status}`, tone: 'none' as Tone })),
  ];
  const reqs: CircuitNode[] = [], wires: Wire[] = [];
  r.requirements.forEach((q, i) => {
    const gate = r.gates.find(g => g.requirement === q.text);
    const text = q.text.toLowerCase();
    const evidence = r.evidence.filter(e => text.includes(e.skill.toLowerCase()));
    const tone: Tone = gate ? GATE_TONE[gate.status] : evidence.length ? worst(evidence.map(e => EVIDENCE_TONE[e.status])) : 'none';
    const sub = gate ? `${T.gate} · ${T.status[gate.status]}` : evidence.length ? `${T.skill} · ${evidence.map(e => e.skill).join(' · ')}` : T.none;
    reqs.push({ id: `req-${i + 1}`, label: q.text, sub, tone });
    const ids = [...new Set([...(gate?.factIds ?? []), ...evidence.flatMap(e => e.factIds)])].filter(id => known.has(id));
    const field = q.category === 'education' ? 'field-education' : q.category === 'availability' ? (q.text.includes('月') ? 'field-months' : 'field-days') : null;
    for (const target of ids.length ? ids : [field]) wires.push({ req: i, target, tone });
  });
  for (const t of targets) {
    const tones = wires.filter(w => w.target === t.id).map(w => w.tone);
    t.tone = tones.includes('ok') ? 'ok' : worst(tones);
  }
  return { reqs, targets, wires, materials: (r.pack?.factIds ?? []).filter(id => known.has(id)), packError: r.packError };
}

export function capInfo(r: EngineResult): { slam: boolean; tone: 'fail' | 'unknown' | null; steps: CapStep[] } {
  const fails = r.gates.some(g => g.status === 'fails'), unknown = r.gates.some(g => g.status === 'unknown');
  const steps: CapStep[] = fails
    ? [{ line: 697, mode: 'on', tone: 'red' }, { line: 698, mode: 'on', tone: 'red' }]
    : unknown
      ? [{ line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'on', tone: 'soft' }, { line: 700, mode: 'on', tone: 'soft' }]
      : [{ line: 697, mode: 'flash', tone: '' }, { line: 699, mode: 'flash', tone: '' }];
  return { slam: r.cap !== null && r.raw > r.cap, tone: fails ? 'fail' : unknown ? 'unknown' : null, steps: [...steps, { line: 702, mode: 'on', tone: '' }] };
}

export function observation(r: EngineResult, lang: Lang): string {
  const T = L[lang];
  const failed = r.gates.filter(g => g.status === 'fails').map(g => g.requirement);
  const unknown = r.gates.filter(g => g.status === 'unknown').map(g => g.requirement);
  const head = failed.length ? T.fail(failed, r.raw, r.cap)
    : unknown.length ? (r.cap !== null && r.raw > r.cap ? T.capped(unknown, r.raw, r.cap) : T.under(unknown, r.raw, r.cap))
      : T.free(r.raw);
  return head + T.sep + (r.pack ? T.pack(r.pack.factIds.length) : T.noPack(r.packError ?? ''));
}
