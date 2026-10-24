// npm run quotadeck:vendor — copies QuotaDeck's HUD renderer, its four pure main-process modules, fonts, logos and
// licences, unmodified, at one commit; then builds the demo's quota keyframes with QuotaDeck's own providerToUi.
// Everything is read from the git object store at COMMIT, never from the working tree, so a local edit or a newer
// checkout can never slip in; the keyframe code runs from a temporary extraction of src/main at COMMIT.
// Usage: QUOTADECK_ROOT=<any quota-deck clone that contains the commit below> npm run quotadeck:vendor
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const COMMIT = '175d31c2c8f579eebbf8f1928025e877d108904f';
const R = 'src/renderer/';
const FILES = [
  ...['hud.html', 'chart.css', 'hud.css', 'hud-metrics.js', 'hud-dom.js', 'hud-bots.js', 'hud-strip.js', 'hud-notch-metrics.js', 'hud-notch.js', 'hud-chart.js', 'hud-card.js', 'hud-settings.js', 'hud.js'].map(f => R + f),
  ...['hud-view.cjs', 'session-tracker.cjs', 'hud-geometry.cjs', 'model-names.cjs'].map(f => `src/main/${f}`),
  'assets/fonts/inter-latin-wght-normal.woff2', 'assets/fonts/LICENSE-inter.txt',
  ...['codex', 'claude', 'antigravity', 'workbuddy', 'deepseek'].map(id => `assets/logos/${id}.svg`), 'assets/logos/LICENSE-lobe-icons.txt',
  'LICENSE',
];

const root = process.env.QUOTADECK_ROOT;
if (!root) { console.error('Set QUOTADECK_ROOT to a checkout of https://github.com/CHIWAWAFROMkk/quota-deck'); process.exit(1); }
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
try { git('cat-file', '-e', `${COMMIT}^{commit}`); } catch { console.error(`${root} does not contain ${COMMIT}; fetch it first`); process.exit(1); }
const show = path => execFileSync('git', ['-C', root, 'show', `${COMMIT}:${path}`], { maxBuffer: 1 << 24 });
const version = JSON.parse(git('show', `${COMMIT}:package.json`)).version;

const out = `public/assets/quotadeck/${COMMIT.slice(0, 7)}`;
const files = FILES.map(path => {
  const bytes = show(path);
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), bytes);
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ repository: 'https://github.com/CHIWAWAFROMkk/quota-deck', commit: COMMIT, version, files }, null, 2) + '\n');
console.log(`${files.length} files → ${out}`);

// Keyframes: the synthetic values of QuotaDeck's desktop smoke, turned into what the HUD draws by QuotaDeck's own code.
const extracted = mkdtempSync(join(tmpdir(), 'quotadeck-'));
for (const path of ['package.json', ...git('ls-tree', '-r', '--name-only', COMMIT, 'src/main').split('\n')]) {
  mkdirSync(dirname(join(extracted, path)), { recursive: true });
  writeFileSync(join(extracted, path), show(path));
}
const require = createRequire(join(extracted, 'package.json'));
const { providerToUi } = require('./src/main/snapshot.cjs');
const { parseUsage } = require('./src/main/claude-oauth.cjs');
const { windowStart } = require('./src/main/token-ledger.cjs');
const BASE = Date.parse('2026-10-22T06:00:00Z'); // 14:00 in Shanghai
const KEYFRAMES = [{ at: 0, claude5h: 12, deepseek: '8.85' }, { at: 20000, claude5h: 48, deepseek: '8.85' }, { at: 45000, claude5h: 73, deepseek: '8.85' }, { at: 70000, claude5h: 73, deepseek: '8.61' }];

function providersAt(now, { claude5h, deepseek }) {
  const updatedAt = new Date(now).toISOString();
  const iso = minutes => new Date(now + minutes * 60000).toISOString();
  const claude = parseUsage({ five_hour: { utilization: claude5h, resets_at: iso(72.5) }, seven_day: { utilization: 79, resets_at: iso(4 * 1440 + 627) }, seven_day_opus: { utilization: 60, resets_at: iso(4 * 1440 + 627) } }, 'max_20x', now);
  [6.3, 1.4, 0.8].forEach((rate, i) => { claude.groups[0].buckets[i].burnPerHour = rate; });
  return [
    { id: 'codex', name: 'Codex', status: 'healthy', precision: 'provider-reported', planType: 'pro', updatedAt, remainingPercent: 51, windows: [{ label: '5h', remainingPercent: 51, windowDurationMins: 300, resetsAt: iso(150) }, { label: 'week', remainingPercent: 70, windowDurationMins: 10080, resetsAt: iso(3000) }], models: [] },
    claude,
    { id: 'antigravity', name: 'Antigravity', status: 'healthy', precision: 'provider-reported', updatedAt, remainingPercent: 91, groups: [{ displayName: 'Gemini', buckets: [{ label: '5 小时', window: '5h', remainingFraction: 0.91, resetTime: iso(200) }] }], models: [] },
    { id: 'workbuddy', name: 'WorkBuddy', status: 'healthy', precision: 'provider-reported', updatedAt, remainingCredits: 660, totalCredits: 1000, models: [] },
    { id: 'deepseek', name: 'DeepSeek', status: 'healthy', precision: 'provider-reported', updatedAt, balances: [{ currency: 'CNY', total_balance: deepseek }], models: [] },
  ].map(providerToUi);
}

const stacks = Array.from({ length: 96 }, (_, i) => (i % 9 < 6 ? [200000 + (i % 5) * 60000, i % 3 === 0 ? 90000 : 0] : [0, 0]));
const models = [{ id: 'claude-opus-5-5', name: 'Opus 5.5', total: 0 }, { id: 'claude-fable-5-1', name: 'Fable 5.1', total: 0 }];
models.forEach((m, i) => { m.total = stacks.reduce((sum, column) => sum + column[i], 0); });
const startAt = windowStart(BASE);
const buckets = stacks.map(([a, b]) => a + b);
const tokens = {
  claude: { status: 'ok', startAt, partial: false, stacks, buckets, models, total: buckets.reduce((a, b) => a + b, 0) },
  codex: { status: 'unsupported', startAt, partial: false, total: 0, buckets: new Array(96).fill(0), models: [], stacks: Array.from({ length: 96 }, () => []) },
};
const fixture = { commit: COMMIT, base: BASE, keyframes: KEYFRAMES.map(k => ({ at: k.at, ui: { providers: providersAt(BASE + k.at, k) } })), tokens };
writeFileSync('src/data/qd-hud-fixture.json', JSON.stringify(fixture, null, 2) + '\n');
console.log(`${fixture.keyframes.length} keyframes → src/data/qd-hud-fixture.json`);
rmSync(extracted, { recursive: true, force: true });
