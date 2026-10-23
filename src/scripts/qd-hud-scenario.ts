import type { Bi } from '../i18n';
import type { ApprovalRequest } from './qd-hud-load';

/** One afternoon in 90 s. Times are scenario milliseconds; every event is stamped base + t and fed to QuotaDeck's own
 *  session tracker, so what the HUD shows (bot faces, New reply, Waiting, Approve?) is QuotaDeck's logic, not ours. */
export const LOOP_MS = 90_000;
export const HINT_AFTER_MS = 20_000;
export const APPROVAL_ID = 'req-demo-1';
const APPROVAL_AT = 32_000;
const TOKENS_AT = 70_000;
const TOKEN_GROWTH = 240_000;

export type BeatId = 'start' | 'claude-done' | 'codex-start' | 'approval' | 'codex-done' | 'tokens' | 'loop';
export const BEATS: { at: number; id: BeatId; note: Bi }[] = [
  { at: 0, id: 'start', note: { zh: '0 s · Claude 开始一轮，图标变成在跑的 bot', en: '0 s · Claude starts a turn; its icon becomes the working bot' } },
  { at: 12_000, id: 'claude-done', note: { zh: '12 s · Claude 做完了一轮：笑脸 bot，伸出 New reply', en: '12 s · Claude finishes: smiling bot and a New reply capsule' } },
  { at: 20_000, id: 'codex-start', note: { zh: '20 s · Codex 开始；Claude 5 小时额度随消耗上升', en: "20 s · Codex starts; Claude's 5-hour quota climbs as it works" } },
  { at: APPROVAL_AT, id: 'approval', note: { zh: '32 s · Claude 请求批准一条命令，等你点', en: '32 s · Claude asks to run a command and waits for you' } },
  { at: 50_000, id: 'codex-done', note: { zh: '50 s · Codex 做完；Claude 的命令 30 秒没结果，显示 Waiting（推测）', en: "50 s · Codex finishes; Claude's command has run 30 s with no result: Waiting (an inference)" } },
  { at: TOKENS_AT, id: 'tokens', note: { zh: '70 s · Token 柱长出新的一格；DeepSeek 余额减少', en: '70 s · A new token bar grows; the DeepSeek balance drops' } },
  { at: LOOP_MS, id: 'loop', note: { zh: '90 s · 一轮结束，重新开始', en: '90 s · The afternoon ends and starts over' } },
];

type Vendor = 'claude' | 'codex';
type ScriptEvent = { t: number; vendor: Vendor; event: Record<string, unknown> };
const SCRIPT: ScriptEvent[] = [
  { t: 0, vendor: 'claude', event: { kind: 'meta', sessionId: 'A', source: 'claude-vscode' } },
  { t: 0, vendor: 'claude', event: { kind: 'title', sessionId: 'A', title: 'Build the iOS dashboard', custom: false } },
  { t: 0, vendor: 'claude', event: { kind: 'prompt', sessionId: 'A', text: 'Build the iOS dashboard' } },
  { t: 12_000, vendor: 'claude', event: { kind: 'turn-end', sessionId: 'A', text: 'The dashboard builds, and all 42 tests pass.', error: false, durationMs: 12_000, model: 'claude-fable-5-1' } },
  { t: 18_000, vendor: 'claude', event: { kind: 'prompt', sessionId: 'A', text: 'Run the build' } },
  { t: 20_000, vendor: 'claude', event: { kind: 'tool-call', sessionId: 'A', callId: 'c1', label: 'Bash: npm run build' } },
  { t: 20_000, vendor: 'codex', event: { kind: 'meta', sessionId: 'B', source: 'codex-desktop' } },
  { t: 20_000, vendor: 'codex', event: { kind: 'title', sessionId: 'B', title: 'Refactor the quota reader', custom: false } },
  { t: 20_000, vendor: 'codex', event: { kind: 'prompt', sessionId: 'B', text: 'Refactor the quota reader' } },
  { t: 50_000, vendor: 'codex', event: { kind: 'turn-end', sessionId: 'B', text: 'Refactor done; tests pass.', error: false, durationMs: 30_000 } },
];

/** Events with from < t <= to, stamped base + t; from = -1 includes the opening moment. */
export function eventsBetween(from: number, to: number, base: number): { vendor: Vendor; event: Record<string, unknown> }[] {
  return SCRIPT.filter(e => e.t > from && e.t <= to).map(e => ({ vendor: e.vendor, event: { ...e.event, at: base + e.t } }));
}

export function approvalsAt(t: number, base: number, decided: 'allow' | 'deny' | null): ApprovalRequest[] {
  if (t < APPROVAL_AT || decided) return [];
  return [{ id: APPROVAL_ID, vendor: 'claude', sessionId: 'C', tool: 'Bash', summary: 'npm test', at: base + APPROVAL_AT }];
}

const KEYFRAME_AT = [0, 20_000, 45_000, 70_000];
export function keyframeAt(t: number): number {
  return KEYFRAME_AT.reduce((last, at, i) => (t >= at ? i : last), 0);
}

export interface RawSeries { status: string; startAt: number; partial: boolean; buckets: number[]; stacks: number[][]; models: { id: string; name: string; total: number }[]; total: number }
export interface RawSeriesPair { claude: RawSeries; codex: RawSeries }
/** From 70 s the newest Claude bar grows by one turn's worth of tokens (Opus). */
export function tokensAt(t: number, raw: RawSeriesPair): RawSeriesPair {
  if (t < TOKENS_AT) return raw;
  const c = raw.claude, last = c.buckets.length - 1;
  const stacks = c.stacks.map((s, i) => (i === last ? [s[0] + TOKEN_GROWTH, ...s.slice(1)] : s));
  const models = c.models.map((m, i) => (i === 0 ? { ...m, total: m.total + TOKEN_GROWTH } : m));
  return { ...raw, claude: { ...c, stacks, models, buckets: c.buckets.map((b, i) => (i === last ? b + TOKEN_GROWTH : b)), total: c.total + TOKEN_GROWTH } };
}

export function noteAt(t: number): Bi {
  return BEATS.reduce((last, b) => (t >= b.at ? b : last), BEATS[0]).note;
}

export function hintAt(t: number, decided: 'allow' | 'deny' | null): boolean {
  return t >= APPROVAL_AT + HINT_AFTER_MS && decided === null;
}
