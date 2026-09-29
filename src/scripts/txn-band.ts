import type { Bi, Lang } from '../i18n';
import { DELIVERY_ERRORS } from './tool-i18n';

export type Kind = 'place' | 'refund';
export type StepState = 'idle' | 'on' | 'fail';
export type Outcome = 'committed' | 'rolled-back' | 'rejected';
export interface Frame { at: number; states: StepState[]; result: Outcome | '' }

export const STEP_MS = 110;

/** The statements place() and refund() in delivery-core.mjs run, in their real order. */
export const STEPS: Record<Kind, Bi[]> = {
  place: [
    { zh: '创建订单', en: 'Create order' },
    { zh: '写明细 · 扣库存', en: 'Add items · deduct stock' },
    { zh: '登记支付', en: 'Record payment' },
    { zh: '生成配送', en: 'Create delivery' },
    { zh: '提交事务', en: 'Commit' },
  ],
  refund: [
    { zh: '找到订单', en: 'Find the order' },
    { zh: '写退款（校验状态与金额）', en: 'Write the refund (status and amount checked)' },
    { zh: '改状态 · 恢复库存', en: 'Mark refunded · restore stock' },
  ],
};

export const BAND_TEXT: Record<Lang, { committed: string; rolledBack: string; rejected: string; replay: string; refundTitle: string }> = {
  zh: { committed: '已提交', rolledBack: '已回滚：整笔事务撤销', rejected: '未进入事务：输入校验未通过', replay: '按事务里语句的实际顺序回放。', refundTitle: '取消退款的事务' },
  en: { committed: 'Committed', rolledBack: 'Rolled back: the whole transaction was undone', rejected: 'Never started: the input failed validation', replay: 'Replayed in the order the transaction runs its statements.', refundTitle: 'The refund transaction' },
};

const FAIL_AT: Record<Kind, Record<string, number>> = {
  place: { '份数须为 1–20 的整数': -1, 菜品不存在: 0, 价格快照不一致: 1, 库存不足: 1, 支付金额与明细不一致: 2 },
  refund: { 订单不存在: 0, 仅未送达订单可取消退款: 1, 退款金额不一致: 1 },
};

/** Which step raised an error (-1: rejected before the transaction began; null: cannot tell). Accepts the English translations too. */
export function failedStep(kind: Kind, message: string): number | null {
  const zh = DELIVERY_ERRORS.find(([z, en]) => typeof z === 'string' && en === message)?.[0];
  const key = typeof zh === 'string' ? zh : message;
  return key in FAIL_AT[kind] ? FAIL_AT[kind][key] : null;
}

/** Band states over time. failAt undefined = success. */
export function bandFrames(kind: Kind, failAt?: number | null): Frame[] {
  const n = STEPS[kind].length;
  const states = (fn: (j: number) => StepState) => Array.from({ length: n }, (_, j) => fn(j));
  if (failAt === undefined) {
    const lit = Array.from({ length: n }, (_, i): Frame => ({ at: i * STEP_MS, states: states(j => (j <= i ? 'on' : 'idle')), result: '' }));
    return [...lit, { at: n * STEP_MS, states: states(() => 'on'), result: 'committed' }];
  }
  if (failAt === null) return [{ at: 0, states: states(() => 'idle'), result: 'rolled-back' }];
  if (failAt < 0) return [{ at: 0, states: states(() => 'idle'), result: 'rejected' }];
  const f = Math.min(failAt, n - 1);
  const failed = (lit: number) => states(j => (j === f ? 'fail' : j < lit ? 'on' : 'idle'));
  const frames: Frame[] = [];
  for (let i = 0; i < f; i++) frames.push({ at: i * STEP_MS, states: states(j => (j <= i ? 'on' : 'idle')), result: '' });
  frames.push({ at: f * STEP_MS, states: failed(f), result: '' });
  for (let k = 1; k <= f; k++) frames.push({ at: (f + k) * STEP_MS, states: failed(f - k), result: '' });
  frames.push({ at: (2 * f + 1) * STEP_MS, states: failed(0), result: 'rolled-back' });
  return frames;
}

/** Replays a transaction on a band; a newer replay cancels an older one. Reduced motion shows the end state at once. */
export function playBand(band: HTMLElement, kind: Kind, failAt: number | null | undefined, lang: Lang): void {
  const items = [...band.querySelectorAll<HTMLElement>('[data-step]')];
  const result = band.querySelector<HTMLElement>('[data-band-result]')!;
  const T = BAND_TEXT[lang];
  const label: Record<Outcome, string> = { committed: T.committed, 'rolled-back': T.rolledBack, rejected: T.rejected };
  const run = String(Number(band.dataset.run ?? '0') + 1);
  band.dataset.run = run;
  band.hidden = false;
  const apply = (f: Frame) => {
    f.states.forEach((s, i) => { if (items[i]) items[i].dataset.state = s; });
    band.dataset.result = f.result;
    result.textContent = f.result ? label[f.result] : '';
  };
  const frames = bandFrames(kind, failAt);
  apply({ at: 0, states: frames[0].states.map(() => 'idle'), result: '' });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(frames[frames.length - 1]); return; }
  for (const f of frames) setTimeout(() => { if (band.dataset.run === run) apply(f); }, f.at);
}
