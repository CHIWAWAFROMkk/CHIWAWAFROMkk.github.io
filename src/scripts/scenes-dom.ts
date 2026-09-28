import { pickScene } from './scenes';

/** Switches the diagram's scene as the section headings pass 40% of the viewport height. */
export function initScenes(figure: HTMLElement, headings: HTMLElement[], count: number): void {
  let frame = 0;
  let shown = 0;
  const update = () => {
    frame = 0;
    const n = pickScene(headings.map(h => h.getBoundingClientRect().top), innerHeight * 0.4, count);
    if (n === shown) return;
    shown = n;
    figure.dataset.scene = String(n);
    for (let i = 1; i <= count; i++) figure.classList.toggle(`s-${i}`, i <= n);
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}
