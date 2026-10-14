export const COLORS = {
  paper: '#f2f1ec',
  ink: '#0f0f0f',
  mute: '#6b6a64',
  red: '#e8380d',
  redText: '#c4300a',
  night: '#0a0908',
  nightFg: '#ece4d6',
  nightMute: '#a39c8f',
} as const;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 'paper:#f2f1ec;…' → '--paper:#f2f1ec;--red-text:#c4300a;…' for the <html> style attribute. */
export function cssVars(): string {
  return Object.entries(COLORS)
    .map(([k, v]) => `--${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
    .join(';');
}

/** fg laid over bg at the given opacity, as #rrggbb (used to check that decorative lines stay visible). */
export function blend(fg: string, bg: string, alpha: number): string {
  const ch = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const [f, b] = [ch(fg), ch(bg)];
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

export interface HrisPalette { paper: string; card: string; ink: string; mute: string; dim: string; accent: string; accentFill: string; onAccent: string; line: string; night: string; nightFg: string; nightMute: string }

/** The HRIS track's palette, taken from the V3 intro cover (user, 2026-10-15): near-black, warm white, two greys and one
 *  light cobalt. Dark is the default; light is the visitor's alternative. Status reads by tone, not by hue:
 *  verified = ink (solid), manual review = accent, missing = dim (hollow). */
export const HRIS_COLORS: { light: HrisPalette; dark: HrisPalette } = {
  dark: { paper: '#0b0c0e', card: '#111317', ink: '#f4f3ef', mute: '#9aa0a6', dim: '#6b7076', accent: '#8ab4f8', accentFill: '#8ab4f8', onAccent: '#0b0c0e', line: '#2a2e36', night: '#050607', nightFg: '#f4f3ef', nightMute: '#9aa0a6' },
  light: { paper: '#f4f3ef', card: '#faf9f6', ink: '#0b0c0e', mute: '#52555a', dim: '#84888e', accent: '#174ea6', accentFill: '#174ea6', onAccent: '#ffffff', line: '#c9c6bc', night: '#0b0c0e', nightFg: '#f4f3ef', nightMute: '#9aa0a6' },
};

const HRIS_FONTS = [
  `--font-body:system-ui,-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`,
  `--font-display:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif`,
  `--font-cjk-bold:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif`,
  `--font-mono:ui-monospace,"SFMono-Regular",Consolas,monospace`,
];

/** Both HRIS palettes as CSS on the site's own variable names, so shared components (cards, demos, prose) pick them up. */
export function hrisThemeCss(): string {
  const vars = (c: HrisPalette) => [
    `--paper:${c.paper}`, `--card:${c.card}`, `--ink:${c.ink}`, `--mute:${c.mute}`, `--dim:${c.dim}`, `--red:${c.accent}`, `--red-text:${c.accent}`,
    `--red-fill:${c.accentFill}`, `--on-accent:${c.onAccent}`, `--line:${c.line}`, `--night:${c.night}`,
    `--night-fg:${c.nightFg}`, `--night-mute:${c.nightMute}`, `--rule:1px solid ${c.ink}`, `--hair:1px solid ${c.line}`,
  ].join(';');
  return `html[data-track='hris']{${vars(HRIS_COLORS.dark)};${HRIS_FONTS.join(';')}}`
    + `html[data-track='hris'][data-theme='light']{${vars(HRIS_COLORS.light)}}`;
}
