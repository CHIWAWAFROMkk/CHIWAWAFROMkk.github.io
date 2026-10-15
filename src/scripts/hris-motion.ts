import { spinOdometer } from './odometer-dom';
import { armOnScroll } from './motion/arm';
import { fullMotion } from './motion/tier';

/** HRIS motion that is not tied to one component: ledger counters, and structure lines that draw as rows scroll in. */
export function initHrisMotion(): void {
  const nums = [...document.querySelectorAll<HTMLElement>('[data-ledger-num]')];
  if (nums.length && fullMotion() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.disconnect();
        nums.forEach((el, i) => spinOdometer(el, el.textContent ?? '', i * 120));
      }
    }, { threshold: 0.4 });
    io.observe(nums[0]);
  }
  armOnScroll(document.querySelectorAll<HTMLElement>('.h-work, .hb-row, .p-hris .p-row'));
}
