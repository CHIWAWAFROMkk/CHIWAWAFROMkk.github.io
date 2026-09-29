import { heatmap, VIEW, type Rows } from '../../../scripts/morph';
import { COLORS } from '../../../data/tokens';
import data from '../../../data/insights.json';

/** The insights page's chapter-one heatmap, drawn at build time from the committed results, for the projects index preview. */
export function GET(): Response {
  const marks = heatmap((data.results.heatmap.values as Rows)).marks;
  const rects = marks.map(m => `<rect x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" width="${m.w.toFixed(1)}" height="${m.h.toFixed(1)}" fill="${COLORS.red}" fill-opacity="${m.a.toFixed(3)}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}"><rect width="${VIEW.w}" height="${VIEW.h}" fill="${COLORS.paper}"/>${rects}</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}
