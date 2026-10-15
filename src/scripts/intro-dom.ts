import { FONT_WAIT_MS, INTRO_GENTLE_MS, INTRO_MS, introMode, markSeen, readSeen, withTimeout } from './intro';
import { currentTier } from './motion/tier';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function initIntro(overlay: HTMLElement, opts: { key?: string; fullMs?: number; gentleMs?: number } = {}): Promise<void> {
  const html = document.documentElement;
  const store = storage();
  const tier = currentTier();
  const seen = readSeen(store, opts.key);
  const fontsReady = !seen && tier !== 'off' && (await withTimeout(document.fonts.load('700 1em Barlow'), FONT_WAIT_MS));
  const mode = introMode({ seen, tier, fontsReady });

  // The inline failsafe may already have uncovered the page; never cover it again once the visitor can use it.
  const stillCovered = html.classList.contains('intro-pending');
  if (!stillCovered || !mode) {
    html.classList.remove('intro-pending');
    return;
  }

  markSeen(store, opts.key);
  const skip = overlay.querySelector<HTMLButtonElement>('[data-intro-skip]');
  // Everything except the intro (page, skip link) is inert while it plays, so focus cannot land underneath.
  const underneath = [...document.body.children].filter((el): el is HTMLElement => el !== overlay && el instanceof HTMLElement);
  let timer = 0;

  const finish = () => {
    window.clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('is-playing', 'is-gentle');
    overlay.hidden = true;
    for (const el of underneath) el.inert = false;
    html.classList.remove('intro-lock');
    // The 2.5 s safety net restarts when the cover lifts, so the first screen's own motion is not cut short by the intro's time.
    html.classList.remove('motion-timeout');
    window.setTimeout(() => html.classList.add('motion-timeout'), 2500);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') finish();
  };

  for (const el of underneath) el.inert = true;
  html.classList.add('intro-lock');
  overlay.hidden = false;
  overlay.classList.add('is-playing');
  overlay.classList.toggle('is-gentle', mode === 'gentle');
  html.classList.remove('intro-pending');
  skip?.addEventListener('click', finish, { once: true });
  document.addEventListener('keydown', onKey);
  // Focus the overlay itself, not the skip button, so Enter/Space cannot skip by accident.
  overlay.focus({ preventScroll: true });
  timer = window.setTimeout(finish, mode === 'gentle' ? (opts.gentleMs ?? INTRO_GENTLE_MS) : (opts.fullMs ?? INTRO_MS));
}
