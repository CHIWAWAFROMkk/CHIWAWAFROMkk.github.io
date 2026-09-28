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
