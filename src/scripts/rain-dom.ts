import { sampleTargets, makeDots, dotAt, DURATION } from './rain';

/** Plays the opening rain once. Any click, wheel, key or touch ends it; reduced motion or no canvas skips it. */
export function initRain(hero: HTMLElement): void {
  const canvas = hero.querySelector('canvas');
  const target = hero.querySelector<HTMLElement>('[data-rain-target]');
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    canvas?.remove();
    hero.classList.remove('is-raining');
    hero.classList.add('is-done');
  };
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();

  const box = hero.getBoundingClientRect();
  const num = target.querySelector<HTMLElement>('.inum') ?? target;
  const nb = num.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(box.width * dpr);
  canvas.height = Math.ceil(box.height * dpr);
  ctx.scale(dpr, dpr);

  // Rasterise the number where it sits, then aim one dot at every sampled pixel.
  const off = document.createElement('canvas');
  off.width = Math.ceil(box.width);
  off.height = Math.ceil(box.height);
  const o = off.getContext('2d');
  if (!o) return finish();
  const cs = getComputedStyle(num);
  o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  o.textBaseline = 'top';
  o.fillText(num.textContent ?? '', nb.left - box.left, nb.top - box.top);
  const targets = sampleTargets(o.getImageData(0, 0, off.width, off.height).data, off.width, off.height, innerWidth < 800 ? 900 : 2400);
  if (!targets.length) return finish();
  const dots = makeDots(targets, box.width, box.height);
  const red = getComputedStyle(hero).getPropertyValue('--red').trim() || '#e8380d';

  hero.classList.add('is-raining');
  for (const ev of ['pointerdown', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, finish, { once: true, passive: true });
  let start = 0;
  const frame = (now: number) => {
    if (finished) return;
    if (!start) start = now;
    const t = now - start;
    ctx.clearRect(0, 0, box.width, box.height);
    ctx.fillStyle = red;
    for (const d of dots) { const [x, y] = dotAt(d, t); ctx.fillRect(x, y, 2, 2); }
    if (t >= DURATION) return finish();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
