import type { Lang } from '../i18n';
import type { TlText } from './qd-timeline';

export interface QuotaText {
  title: string; meta: string; intro: string; simClock: string; day: (n: number) => string; speedLabel: string; pause: string;
  bigTask: string; collab: string; collabTask: string; appHead: string; frameTitle: string;
  stripIdleK: string; stripIdle: string; stripRun: (done: number, all: number) => string; stripDone: (all: number) => string; disclaimer: string;
  eta: { sampling: (n: number) => string; stable: string; left: (burn: string, h: string) => string; noExhaust: (burn: string) => string; exhausted: string; source: string };
  codeTitle: string; codeMeta: string; codeLabel: string;
  code: { samples: (n: number) => string; broke: string; span: (n: number, min: number) => string; burn: (v: string) => string; hours: (v: string) => string; untilReset: (v: string) => string; shown: (v: string) => string; notShown: string; short: string };
  note: string; fallback: string; tl: TlText;
}

const ZH_TL: TlText = {
  title: '额度时间轴', sub: '5 小时窗口 · 到点重置为 100%', range: '← 过去 10 小时 · 未来 3 小时 →', dashes: '虚线：QuotaDeck 按采样算出的耗尽预测',
  night: '夜间', reset: '重置', nextReset: '下次重置', window: '近 1 小时采样窗口', now: '现在',
  resetTo: name => `${name} 重置 → 100%`, exhaust: h => `耗尽 T-${h}h`, noExhaust: '重置前不会耗尽', exhausted: '已耗尽 · 等待重置',
  status: { queue: '排队中', run: '运行中', done: '已完成' }, bigTask: '大任务', wbNote: '积分以网页快照为准',
};
const EN_TL: TlText = {
  title: 'Quota timeline', sub: '5-hour windows · reset to 100% on time', range: '← past 10 hours · next 3 hours →', dashes: 'dashed: QuotaDeck\'s exhaustion forecast from its samples',
  night: 'night', reset: 'reset', nextReset: 'next reset', window: 'last-hour sampling window', now: 'now',
  resetTo: name => `${name} reset → 100%`, exhaust: h => `empty T-${h}h`, noExhaust: 'will not run out before the reset', exhausted: 'exhausted · waiting for the reset',
  status: { queue: 'queued', run: 'running', done: 'done' }, bigTask: 'big task', wbNote: 'credits per the web snapshot',
};

export const QUOTA_TEXT: Record<Lang, QuotaText> = {
  zh: {
    title: '时间机器：QuotaDeck 在线运行', meta: '公开版 0.5.0-rc.5 · e9557c6 · 在你的浏览器里运行',
    intro: '左边是 QuotaDeck 托盘窗口的真实界面文件，原样运行；界面里的百分比、状态和重置倒计时由 QuotaDeck 自己的代码生成。右边是 13 小时的额度时间轴（过去 10 小时 + 未来 3 小时），模拟时钟可以快进：额度一路消耗、到点重置；QuotaDeck 每分钟刷新一次，Antigravity 的消耗速度和耗尽预测由它自己的 quota-history 算法用近 1 小时的样本算出。只有时钟和使用量是模拟的。',
    simClock: '模拟时钟', day: n => `第 ${n} 天 · 模拟时间`, speedLabel: '时钟速度', pause: '暂停',
    bigTask: '派一个大任务给 Codex', collab: '并行协作 · 4 个 Agent', collabTask: '网页演示：把一个产品需求分给 4 个 Agent',
    appHead: '演示数据 · 非真实额度 · QuotaDeck 真实界面', frameTitle: 'QuotaDeck 托盘窗口（真实界面，演示数据）',
    stripIdleK: '并行协作', stripIdle: '点上方"并行协作 · 4 个 Agent"，或在窗口的"协作"页勾选 Agent，看状态流程和额度变化。',
    stripRun: (d, a) => `协作中 · 已完成 ${d}/${a}`, stripDone: a => `✓ ${a}/${a} 已完成`,
    disclaimer: '网页演示：状态流程与额度变化为模拟，不调用真实 Agent，不生成回答。',
    eta: {
      sampling: n => `Antigravity：采样中 · 近 1 小时 ${n} 个样本`, stable: 'Antigravity：近 1 小时没有下降 · 当前稳定',
      left: (b, h) => `Antigravity：近 1 小时下降 ${b} 点/小时 · 约 ${h} 小时耗尽`, noExhaust: b => `Antigravity：近 1 小时下降 ${b} 点/小时 · 重置前不会耗尽`,
      exhausted: 'Antigravity：已耗尽 · 等待重置', source: '（QuotaDeck 自己的估算）',
    },
    codeTitle: 'quota-history.cjs · record()', codeMeta: '代码实况 · 源码第 50–61 行', codeLabel: '代码实况：QuotaDeck 的消耗速度与耗尽预测源码',
    code: {
      samples: n => `→ 近 1 小时 ${n} 个样本`, broke: '→ 重置后样本清空', span: (n, m) => `→ ${n} 个样本，跨 ${m} 分钟`,
      burn: v => `→ ${v} 点/小时`, hours: v => `→ ${v} h`, untilReset: v => `→ ${v} h`, shown: v => `→ 显示 ${v} h`, notShown: '→ 不显示：重置更早', short: '→ 样本不足：需 2 个且跨 5 分钟',
    },
    note: '左侧是公开仓库 e9557c6 的真实界面文件（MIT 许可）；界面数据由 QuotaDeck 的 providerToUi / toUiSnapshot 生成，消耗速度和耗尽预测由它的 quota-history 计算。只有时钟和使用量来自模拟；不读取你的电脑或任何账号。',
    fallback: '时间机器暂时无法启动（浏览器不支持或文件加载失败）。下面是桌面版的真实截图。',
    tl: ZH_TL,
  },
  en: {
    title: 'Time machine: QuotaDeck, live', meta: 'Public build 0.5.0-rc.5 · e9557c6 · running in your browser',
    intro: 'On the left, QuotaDeck\'s real tray-window files run unchanged; every percentage, status and reset countdown in it is produced by QuotaDeck\'s own code. On the right, a 13-hour quota timeline (10 hours back, 3 ahead) on a simulated clock you can fast-forward: quota drains and resets on time; QuotaDeck refreshes every minute, and its own quota-history algorithm turns the last hour of Antigravity samples into a burn rate and an exhaustion forecast. Only the clock and the usage are simulated.',
    simClock: 'Simulated clock', day: n => `Day ${n} · simulated time`, speedLabel: 'Clock speed', pause: 'Pause',
    bigTask: 'Give Codex a big task', collab: 'Parallel run · 4 agents', collabTask: 'Web demo: hand one product brief to 4 agents',
    appHead: 'Demo data, not real quota · QuotaDeck\'s real interface (in Chinese)', frameTitle: 'QuotaDeck tray window (real interface, demo data, in Chinese)',
    stripIdleK: 'Parallel run', stripIdle: 'Press "Parallel run · 4 agents", or pick agents on the window\'s 协作 tab, to watch the state flow and the quota.',
    stripRun: (d, a) => `running · ${d}/${a} done`, stripDone: a => `✓ ${a}/${a} done`,
    disclaimer: 'Web demo: the state flow and the quota changes are simulated; no real agent is called and no answer is generated.',
    eta: {
      sampling: n => `Antigravity: sampling · ${n} samples in the last hour`, stable: 'Antigravity: no drop in the last hour · steady',
      left: (b, h) => `Antigravity: down ${b} points/hour over the last hour · empty in about ${h} hours`, noExhaust: b => `Antigravity: down ${b} points/hour · will not run out before the reset`,
      exhausted: 'Antigravity: exhausted · waiting for the reset', source: '(QuotaDeck\'s own estimate)',
    },
    codeTitle: 'quota-history.cjs · record()', codeMeta: 'Live source · lines 50–61', codeLabel: 'Live source: QuotaDeck\'s burn-rate and exhaustion estimate',
    code: {
      samples: n => `→ ${n} samples in the last hour`, broke: '→ reset: samples cleared', span: (n, m) => `→ ${n} samples over ${m} min`,
      burn: v => `→ ${v} points/hour`, hours: v => `→ ${v} h`, untilReset: v => `→ ${v} h`, shown: v => `→ shown: ${v} h`, notShown: '→ not shown: the reset comes first', short: '→ too few samples: 2 over 5 minutes needed',
    },
    note: 'The window runs the real interface files of the public repository at e9557c6 (MIT licence); its data comes from QuotaDeck\'s providerToUi / toUiSnapshot, and the burn rate and forecast from its quota-history. Only the clock and the usage are simulated; nothing on your computer or in any account is read.',
    fallback: 'The time machine could not start (unsupported browser or a file failed to load). Below are real screenshots of the desktop app.',
    tl: EN_TL,
  },
};
