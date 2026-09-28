import { activeIndex, reelProgress } from './reel';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Desktop: the section pins for one screen and vertical scrolling slides the track sideways.
 * Phones, reduced motion or no JS: the track is a native horizontal scroller.
 * Clips load and play only while on screen; the toggle pauses all of them.
 */
export function initReel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-reel-track]');
  if (!track) return;
  const count = root.querySelector<HTMLElement>('[data-reel-count]');
  const bar = root.querySelector<HTMLElement>('[data-reel-bar]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-reel-toggle]');
  const videos = [...root.querySelectorAll<HTMLVideoElement>('video[data-src]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 800px)');
  const visible = new Set<HTMLVideoElement>();
  let paused = reduced;
  let overflow = 0;
  let frame = 0;

  const show = (p: number) => {
    if (count) count.textContent = `${pad(activeIndex(p, videos.length) + 1)} / ${pad(videos.length)}`;
    if (bar) bar.style.transform = `scaleX(${p})`;
  };

  const update = () => {
    frame = 0;
    if (!root.classList.contains('is-pinned')) {
      const run = track.scrollWidth - track.clientWidth;
      return show(run > 0 ? track.scrollLeft / run : 0);
    }
    const top = root.getBoundingClientRect().top + window.scrollY;
    const p = reelProgress(window.scrollY, top, root.offsetHeight, window.innerHeight);
    track.style.transform = `translate3d(${-p * overflow}px,0,0)`;
    show(p);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  const layout = () => {
    const pin = desktop.matches && !reduced;
    root.classList.toggle('is-pinned', pin);
    track.style.transform = '';
    overflow = pin ? Math.max(0, track.scrollWidth - track.clientWidth) : 0;
    root.style.height = pin ? `${window.innerHeight + overflow}px` : '';
    update();
  };

  const setPaused = (value: boolean) => {
    paused = value;
    toggle?.setAttribute('aria-pressed', String(paused));
    if (toggle) toggle.textContent = paused ? toggle.dataset.play ?? '' : toggle.dataset.pause ?? '';
    for (const v of videos) {
      if (paused || !visible.has(v)) v.pause();
      else void v.play().catch(() => {});
    }
  };

  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          visible.add(v);
          if (!v.getAttribute('src')) v.src = v.dataset.src ?? '';
          if (!paused) void v.play().catch(() => {});
        } else {
          visible.delete(v);
          v.pause();
        }
      }
    },
    { rootMargin: '0px 25% 0px 25%' },
  );
  videos.forEach(v => io.observe(v));

  if (reduced) videos.forEach(v => (v.controls = true));
  toggle?.addEventListener('click', () => setPaused(!paused));
  setPaused(paused);
  addEventListener('scroll', schedule, { passive: true });
  track.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', layout);
  desktop.addEventListener('change', layout);
  layout();
}
