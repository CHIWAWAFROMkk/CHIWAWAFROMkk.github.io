import { FONT_WAIT_MS, INTRO_MS, markSeen, readSeen, shouldPlayIntro, withTimeout } from './intro';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function initIntro(overlay: HTMLElement): Promise<void> {
  const html = document.documentElement;
  const store = storage();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = readSeen(store);
  const fontsReady = !seen && !reducedMotion && (await withTimeout(document.fonts.load('700 1em Barlow'), FONT_WAIT_MS));

  // The inline failsafe may already have uncovered the page; never cover it again once the visitor can use it.
  const stillCovered = html.classList.contains('intro-pending');
  if (!stillCovered || !shouldPlayIntro({ seen, reducedMotion, fontsReady })) {
    html.classList.remove('intro-pending');
    return;
  }

  markSeen(store);
  const skip = overlay.querySelector<HTMLButtonElement>('[data-intro-skip]');
  // Everything except the intro (page, skip link) is inert while it plays, so focus cannot land underneath.
  const underneath = [...document.body.children].filter((el): el is HTMLElement => el !== overlay && el instanceof HTMLElement);
  let timer = 0;

  const finish = () => {
    window.clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('is-playing');
    overlay.hidden = true;
    for (const el of underneath) el.inert = false;
    html.classList.remove('intro-lock');
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') finish();
  };

  for (const el of underneath) el.inert = true;
  html.classList.add('intro-lock');
  overlay.hidden = false;
  overlay.classList.add('is-playing');
  html.classList.remove('intro-pending');
  skip?.addEventListener('click', finish, { once: true });
  document.addEventListener('keydown', onKey);
  // Focus the overlay itself, not the skip button, so Enter/Space cannot skip by accident.
  overlay.focus({ preventScroll: true });
  timer = window.setTimeout(finish, INTRO_MS);
}
