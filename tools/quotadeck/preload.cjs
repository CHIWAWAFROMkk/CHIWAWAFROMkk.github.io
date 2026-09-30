// Demo data only: every number and model name here is invented, and the header says so.
const { contextBridge } = require('electron');
const path = require('node:path');
const root = process.env.QUOTADECK_ROOT;
const { providerToUi } = require(path.join(root, 'src/main/snapshot.cjs'));
const { sanitizeClaudePayload, normalizeClaudeSnapshot } = require(path.join(root, 'src/main/claude-client.cjs'));
const { normalizeAntigravitySnapshot } = require(path.join(root, 'src/main/antigravity-client.cjs'));

const now = Date.now();
const iso = new Date(now - 4 * 60000).toISOString();
const inHours = h => new Date(now + h * 3600000).toISOString();
const claude = normalizeClaudeSnapshot(sanitizeClaudePayload({
  model: { id: 'demo', display_name: '演示模型（非真实数据）' },
  rate_limits: { five_hour: { used_percentage: 38, resets_at: now / 1000 + 2.5 * 3600 }, seven_day: { used_percentage: 54, resets_at: now / 1000 + 3 * 86400 } },
}, now), now);
const antigravity = {
  ...normalizeAntigravitySnapshot({ groups: [{ displayName: '演示模型组', buckets: [
    { bucketId: '5h', window: '5h', remainingFraction: 0.71, resetTime: inHours(3) },
    { bucketId: 'weekly', window: 'weekly', remainingFraction: 0.88, resetTime: inHours(96) },
  ] }] }, [{ id: 'demo-g1', name: '演示模型 G1' }, { id: 'demo-g2', name: '演示模型 G2' }]),
  status: 'healthy', updatedAt: iso,
};
const shared = label => name => ({ id: name, name, pool: 'shared', poolLabel: label });
const data = {
  lastUpdated: '12:00',
  globalStatus: '演示数据 · 非真实额度',
  agents: { codex: true, claude: true, workbuddy: true, antigravity: true },
  providers: [
    { id: 'codex', name: 'Codex', status: 'healthy', precision: 'provider-reported', updatedAt: iso, remainingPercent: 62,
      windows: [{ label: '5 小时窗口', remainingPercent: 62, resetsAt: inHours(2) }, { label: '每周窗口', remainingPercent: 81, resetsAt: inHours(72) }],
      models: ['演示模型 A', '演示模型 B', '演示模型 C'].map(shared('Codex 共享额度')) },
    claude,
    antigravity,
    { id: 'deepseek', name: 'DeepSeek', status: 'healthy', precision: 'provider-reported', updatedAt: iso, balances: [{ currency: 'CNY', total_balance: '42.00' }],
      models: ['演示对话模型', '演示推理模型'].map(shared('DeepSeek 账户余额')) },
    { id: 'workbuddy', name: 'WorkBuddy', status: 'healthy', precision: 'browser-snapshot', updatedAt: iso, remainingCredits: 1260, totalCredits: 2000,
      models: [['演示模型 W1', 0.5], ['演示模型 W2', 1], ['演示模型 W3', 2]].map(([name, consumeMultiplier]) => ({ id: name, name, pool: 'shared', consumeMultiplier })) },
  ].map(providerToUi),
};
contextBridge.exposeInMainWorld('quotaDeck', { onSnapshot() {}, refreshAll: async () => data, openClaudeHelp: async () => ({ status: 'opened' }) });
