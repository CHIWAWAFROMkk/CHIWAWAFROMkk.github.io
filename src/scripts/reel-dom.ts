import { activeIndex, edgeSpeed } from './reel';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The cinema: curtains open when it scrolls into view; a pointer near the screen's left or right edge
 * slides the shots that way (faster nearer the edge); clips load and play only while on screen;
 * the toggle pauses all of them. Phones and keyboards use the track's native horizontal scrolling.
 */
export function initReel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-reel-track]');
  if (!track) return;
  const count = root.querySelector<HTMLElement>('[data-reel-count]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-reel-toggle]');
  const videos = [...root.querySelectorAll<HTMLVideoElement>('video[data-src]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const visible = new Set<HTMLVideoElement>();
  let paused = reduced;
  let speed = 0;
  let frame = 0;

  const showCount = () => {
    const run = track.scrollWidth - track.clientWidth;
    if (count) count.textContent = `${pad(activeIndex(run > 0 ? track.scrollLeft / run : 0, videos.length) + 1)} / ${pad(videos.length)}`;
  };

  const glide = () => {
    frame = 0;
    if (!speed) return;
    track.scrollLeft += speed;
    frame = requestAnimationFrame(glide);
  };
  const setSpeed = (s: number) => {
    speed = s;
    root.dataset.edge = s > 0 ? 'right' : s < 0 ? 'left' : '';
    // Scroll snapping would pull each small step straight back; suspend it while gliding.
    track.style.scrollSnapType = s ? 'none' : '';
    if (speed && !frame) frame = requestAnimationFrame(glide);
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

  const clips = new IntersectionObserver(
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
    { root: track, rootMargin: '0px 25% 0px 25%' },
  );
  videos.forEach(v => clips.observe(v));

  if (reduced) {
    root.classList.add('is-open');
    videos.forEach(v => (v.controls = true));
  } else {
    root.classList.add('is-closed');
    new IntersectionObserver((entries, io) => {
      if (!entries.some(e => e.isIntersecting)) return;
      root.classList.replace('is-closed', 'is-open');
      io.disconnect();
    }, { threshold: 0.35 }).observe(root);
  }

  if (finePointer && !reduced) {
    track.addEventListener('pointermove', e => {
      const r = track.getBoundingClientRect();
      setSpeed(edgeSpeed(e.clientX, r.left, r.width));
    });
    track.addEventListener('pointerleave', () => setSpeed(0));
  }

  toggle?.addEventListener('click', () => setPaused(!paused));
  track.addEventListener('scroll', showCount, { passive: true });
  setPaused(paused);
  showCount();
}
