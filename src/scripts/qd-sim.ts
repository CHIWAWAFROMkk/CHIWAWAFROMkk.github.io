/** The time machine's simulator: a clock, a usage model, a big task and the collaboration's state flow — the only
 *  invented parts of the QuotaDeck demo. It produces provider snapshots in the exact shape QuotaDeck's own connectors
 *  normalise to (the tests compare them with the real normalisers); everything after that is QuotaDeck's own code. */
export const H = 3_600_000, M = 60_000, D = 24 * H, WIN = 5 * H;
/** QuotaDeck refreshes every minute (src/main/main.cjs line 157). */
export const REFRESH = 60_000;
export const BIG_TASK = 24;
export const SPEEDS = [1, 60, 600] as const;
export const START = new Date(2026, 9, 5, 9, 0, 0).getTime();
/** The providers snapshot.cjs readAll() reads, in its order. */
export const PROVIDER_IDS = ['codex', 'claude', 'antigravity', 'deepseek', 'workbuddy'] as const;
export const DEMO_OUTPUT = '网页演示：状态流程与额度变化为模拟，没有调用真实 Agent，也没有生成任何回答。桌面版里，这里是该 Agent 的独立成果。';

export type LaneId = 'codex' | 'claude' | 'antigravity';
export interface Lane {
  id: LaneId; name: string; rem: number; burn: number; mean: number; amp: number; seed: number; past: number;
  reset: number; drop: number; agent: boolean; hist: { t: number; v: number }[];
}
export interface ResetMark { t: number; id: LaneId }
export interface Sim {
  t: number; lanes: Lane[]; marks: ResetMark[]; balance: number;
  /** Advances the simulated clock by dtSim (dtReal paces the big task and agent load); returns the lanes that reset. */
  step(dtSim: number, dtReal: number): LaneId[];
  bigTask(): void;
  raw(id: string): object;
}

const noise = (x: number, l: Lane) => l.mean + l.amp * (Math.sin(x / (37 * M) + l.seed) * 0.6 + Math.sin(x / (11 * M) + l.seed * 2) * 0.4);
const health = (p: number) => (p <= 10 ? 'critical' : p <= 30 ? 'low' : 'healthy');
const iso = (ms: number) => new Date(ms).toISOString();
const shared = (poolLabel: string) => (name: string) => ({ id: name, name, pool: 'shared', poolLabel });

/** Ten-plus hours of past usage for the timeline: earlier windows drain and reset; the current one ends on rem. */
function seedHistory(l: Lane, t: number) {
  const step = 2 * M, from = t - 13.5 * H, ws = l.reset - WIN, pts: { t: number; v: number }[] = [];
  let w = ws; while (w > from) w -= WIN;
  for (; w < ws; w += WIN) {
    let v = 100;
    for (let x = w; x < w + WIN; x += step) { if (x >= from) pts.push({ t: x, v }); v = Math.max(0, v - l.burn * l.past * noise(x, l) * step / H); }
  }
  const acc: [number, number][] = []; let a = 0;
  for (let x = ws; x < t; x += step) { acc.push([x, a]); a += noise(x, l) * step; }
  for (const [x, s] of acc) if (x >= from) pts.push({ t: x, v: 100 - (100 - l.rem) * s / a });
  pts.push({ t, v: l.rem });
  l.hist = pts;
}

export function createSim(start = START): Sim {
  const lane = (id: LaneId, name: string, rem: number, burn: number, mean: number, amp: number, seed: number, past: number, resetIn: number): Lane =>
    ({ id, name, rem, burn, mean, amp, seed, past, reset: start + resetIn, drop: 0, agent: false, hist: [] });
  const lanes = [
    lane('codex', 'Codex', 74, 12, 0.55, 0.45, 12, 1.7, 2.4 * H),
    lane('claude', 'Claude Code', 61, 8, 0.55, 0.45, 8, 1.9, 1.3 * H),
    lane('antigravity', 'Antigravity', 52, 24, 0.9, 0.1, 24, 1, 2.8 * H),
  ];
  lanes.forEach(l => seedHistory(l, start));
  const sim: Sim = {
    t: start, lanes, marks: [], balance: 42.6,
    step(dt, dtReal) {
      sim.t += dt;
      const t = sim.t, resets: LaneId[] = [];
      for (const l of lanes) {
        let d = l.burn * noise(t, l) * dt / H;
        if (l.drop > 0) { const k = Math.min(l.drop, BIG_TASK / 700 * dtReal); l.drop -= k; d += k; }
        if (l.agent) d += 5 * dtReal / 1000;                   // an agent at work: five points a second, at any speed
        l.rem = Math.max(0, l.rem - d);
        if (t >= l.reset) {
          l.hist.push({ t, v: l.rem }, { t, v: 100 });
          sim.marks.push({ t, id: l.id });
          l.rem = 100; l.reset += WIN; l.drop = 0; resets.push(l.id);
        }
        const last = l.hist[l.hist.length - 1];
        if (t - last.t >= 2 * M || Math.abs(l.rem - last.v) >= 1.5) l.hist.push({ t, v: l.rem });
        while (l.hist.length > 2 && l.hist[1].t < t - 13.5 * H) l.hist.shift();
      }
      while (sim.marks.length && sim.marks[0].t < t - 11 * H) sim.marks.shift();
      sim.balance = Math.max(0, sim.balance - 0.42 * dt / H);
      return resets;
    },
    bigTask() { lanes[0].drop += BIG_TASK; },
    raw(id) {
      const [codex, claude, agy] = lanes;
      switch (id) {
        case 'codex': return codexRaw(codex, sim.t);
        case 'claude': return claudeRaw(claude, sim.t);
        case 'antigravity': return antigravityRaw(agy, sim.t);
        case 'deepseek': return deepseekRaw(sim.balance, sim.t);
        case 'workbuddy': return workbuddyRaw(start);
        default: throw new Error(`未知数据源 ${id}`);
      }
    },
  };
  return sim;
}

export function codexRaw(l: Lane, now: number) {
  return {
    id: 'codex', name: 'Codex', status: health(l.rem), precision: 'provider-reported', source: 'Codex 官方额度窗口', updatedAt: iso(now),
    remainingPercent: l.rem, windows: [{ label: '5 小时', windowDurationMins: 300, remainingPercent: l.rem, resetsAt: iso(l.reset) }],
    models: ['演示模型 A', '演示模型 B', '演示模型 C'].map(shared('Codex 共享额度')),
  };
}

const CLAUDE_NOTE = '仅列 statusLine 当前会话观测到的模型，不代表完整可选目录。接收时间不是独立查询时间；超过 5 分钟标记旧数据。缺失额度可能尚未产生首个响应，或登录类型不提供订阅窗口。';
/** normalizeClaudeSnapshot(sanitizeClaudePayload(statusLine), now) for a fresh statusLine report of the 5-hour window. */
export function claudeRaw(l: Lane, now: number) {
  const used = 100 - l.rem, remaining = Math.max(0, 100 - used), resetsAt = iso(l.reset), name = 'Claude 订阅共享额度';
  const windows = [{ id: 'five_hour', label: '5 小时', remainingPercent: remaining, resetsAt }];
  return {
    id: 'claude', name: 'Claude Code', precision: 'provider-reported', status: health(remaining), updatedAt: iso(now),
    source: 'Claude Code 官方 statusLine', remainingPercent: remaining, windows,
    models: [{ id: 'demo', name: '演示模型（非真实数据）', pool: 'shared', poolLabel: name, windows, remainingPercent: remaining, source: 'Claude Code statusLine 当前会话观测' }],
    groups: [{ displayName: name, buckets: [{ bucketId: 'five_hour', label: '5 小时', window: '5h', remainingFraction: remaining / 100, resetTime: resetsAt }] }],
    quotaNote: '订阅窗口 · 当前会话观测', note: CLAUDE_NOTE,
  };
}

const AGY_NOTE = '同组模型共享额度；家族映射为本地兼容规则，未知模型不猜测归属。消耗速度是共享池采样估算，非单模型用量。';
/** normalizeAntigravitySnapshot for the "Gemini Models" pool with one 5-hour bucket and two Gemini-family models. */
export function antigravityRaw(l: Lane, now: number) {
  const fraction = l.rem / 100, resetTime = iso(l.reset), source = 'Antigravity 本机官方接口';
  const windows = [{ id: '5h', label: '5 小时', window: '5h', remainingPercent: fraction * 100, resetsAt: resetTime }];
  const models = [['gemini-demo-1', '演示模型 G1'], ['gemini-demo-2', '演示模型 G2']].map(([id, name]) => ({
    id, name, pool: 'shared', poolLabel: 'Gemini Models', source, windows, remainingPercent: fraction * 100,
    quotaLabel: `5 小时 ${(fraction * 100).toFixed(1)}%`,
  }));
  return {
    id: 'antigravity', name: 'Antigravity', status: health(fraction * 100), source, precision: 'provider-reported', updatedAt: iso(now),
    remainingPercent: fraction * 100,
    groups: [{ displayName: 'Gemini Models', description: undefined, buckets: [{ bucketId: '5h', window: '5h', remainingFraction: fraction, resetTime }] }],
    models, quotaNote: `${models.length} 个模型 · 1 个共享额度池`, note: AGY_NOTE,
  };
}

export function deepseekRaw(balance: number, now: number) {
  return {
    id: 'deepseek', name: 'DeepSeek', status: 'healthy', precision: 'provider-reported', updatedAt: iso(now),
    balances: [{ currency: 'CNY', total_balance: balance.toFixed(2) }], models: ['演示对话模型', '演示推理模型'].map(shared('DeepSeek 账户余额')),
  };
}
/** WorkBuddy is read from a web snapshot, here three hours old: QuotaDeck shows it as stale. */
export function workbuddyRaw(start: number) {
  return {
    id: 'workbuddy', name: 'WorkBuddy', status: 'healthy', precision: 'browser-snapshot', updatedAt: iso(start - 3 * H),
    remainingCredits: 1260, totalCredits: 2000,
    models: ([['演示模型 W1', 0.5], ['演示模型 W2', 1], ['演示模型 W3', 2]] as const).map(([name, consumeMultiplier]) => ({ id: name, name, pool: 'shared', consumeMultiplier })),
  };
}

/** Parallel collaboration, staggered in real time (queued → running → done). No agent is called. */
export const AGENT_FLOW = [
  { id: 'codex', name: 'Codex', start: 0.5, run: 2.6 },
  { id: 'claude', name: 'Claude Code', start: 0.9, run: 4.8 },
  { id: 'antigravity', name: 'Antigravity', start: 1.3, run: 3.3 },
  { id: 'workbuddy', name: 'WorkBuddy', start: 1.7, run: 2.2 },
] as const;
export type AgentId = (typeof AGENT_FLOW)[number]['id'];
export type AgentPhase = 'queue' | 'run' | 'done';
export function agentPhase(id: AgentId, elapsed: number): AgentPhase {
  const a = AGENT_FLOW.find(x => x.id === id)!;
  return elapsed < a.start ? 'queue' : elapsed < a.start + a.run ? 'run' : 'done';
}
export function collabEnd(agents: readonly AgentId[]): number {
  return Math.max(0, ...AGENT_FLOW.filter(a => agents.includes(a.id)).map(a => a.start + a.run));
}
/** What runCollaboration resolves to, in the orchestrator's shape (src/main/orchestrator.cjs runCollaboration). */
export function collabResult(task: string, agents: readonly AgentId[], completedAt: number) {
  return { task: task.trim(), completedAt: iso(completedAt), results: agents.map(id => ({ id, output: DEMO_OUTPUT, status: 'done' as const })) };
}
