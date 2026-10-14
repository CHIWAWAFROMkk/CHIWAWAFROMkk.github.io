import { traceNodes, pointOnEdge, pulseAt, periodFor } from './agent-trace';
import { currentTier } from './motion/tier';
import { frameCap } from './frame-cap';
import { magnetOffset, MOTION } from './motion/tokens';

/** Runs the home page's agent trace: a pulse crosses the edges and ticks each step. Pauses off screen and in hidden tabs. */
export function initAgentTrace(root: HTMLElement): void {
  const tier = currentTier();
  if (tier === 'off') { root.classList.add('is-static'); return; }
  const svg = root.querySelector<SVGSVGElement>('svg')!;
  const edges = [...svg.querySelectorAll<SVGPathElement>('.trace__edge')];
  const nodes = [...svg.querySelectorAll<SVGGElement>('.trace__node')];
  const pulse = svg.querySelector<SVGCircleElement>('.trace__pulse')!;
  const pts = traceNodes(nodes.length);
  const period = periodFor(tier);
  const cap = frameCap(tier === 'lite' ? 30 : 60);
  const start = performance.now();
  let raf = 0, onScreen = true;

  const draw = (now: number) => {
    raf = requestAnimationFrame(draw);
    if (!cap(now)) return;
    const s = pulseAt(now - start, period, pts.length);
    edges.forEach((e, i) => e.classList.toggle('is-lit', s.edge === -1 || i < s.edge || (tier === 'gentle' && i === s.edge)));
    nodes.forEach((n, i) => n.classList.toggle('is-done', i < s.done));
    if (tier !== 'gentle' && s.edge >= 0) {
      const p = pointOnEdge(pts[s.edge], pts[s.edge + 1], s.progress);
      pulse.setAttribute('cx', p.x.toFixed(1));
      pulse.setAttribute('cy', p.y.toFixed(1));
      pulse.style.opacity = '1';
    } else {
      pulse.style.opacity = '0';
    }
  };
  const run = () => { if (!raf && onScreen && document.visibilityState === 'visible') raf = requestAnimationFrame(draw); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) run(); else stop(); }).observe(root);
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? run() : stop()));
  run();

  // The nearest step leans towards a fine pointer, at most MOTION.magnetMax px (full tier only).
  if (tier !== 'full' || !matchMedia('(pointer: fine)').matches) return;
  const area = root.parentElement ?? root;
  area.addEventListener('pointermove', e => {
    const m = svg.getScreenCTM();
    if (!m) return;
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    let best = -1, bestD = 120;
    pts.forEach((p, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bestD) { best = i; bestD = d; } });
    nodes.forEach((n, i) => {
      const o = i === best ? magnetOffset(q.x - pts[i].x, q.y - pts[i].y, 4, MOTION.magnetMax) : { x: 0, y: 0 };
      n.style.transform = `translate(${o.x}px, ${o.y}px)`;
    });
  });
  area.addEventListener('pointerleave', () => nodes.forEach(n => { n.style.transform = ''; }));
}
