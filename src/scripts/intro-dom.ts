import { FONT_WAIT_MS, INTRO_MS, markSeen, readSeen, shouldPlayIntro, withTimeout } from './intro';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function initIntro(overlay: HTMLElement, page: HTMLElement): Promise<void> {
  const html = document.documentElement;
  const store = storage();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = readSeen(store);
  const fontsReady = !seen && !reducedMotion && (await withTimeout(document.fonts.load('700 1em Barlow'), FONT_WAIT_MS));

  if (!shouldPlayIntro({ seen, reducedMotion, fontsReady })) {
    html.classList.remove('intro-pending');
    return;
  }

  markSeen(store);
  const skip = overlay.querySelector<HTMLButtonElement>('[data-intro-skip]');
  let timer = 0;

  const finish = () => {
    window.clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('is-playing');
    overlay.hidden = true;
    page.inert = false;
    html.classList.remove('intro-lock');
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') finish();
  };

  page.inert = true;
  html.classList.add('intro-lock');
  overlay.hidden = false;
  overlay.classList.add('is-playing');
  html.classList.remove('intro-pending');
  skip?.addEventListener('click', finish, { once: true });
  document.addEventListener('keydown', onKey);
  skip?.focus({ preventScroll: true });
  timer = window.setTimeout(finish, INTRO_MS);
}
