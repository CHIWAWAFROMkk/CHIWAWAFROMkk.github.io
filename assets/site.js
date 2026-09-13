const hero = document.querySelector('.comp-frame');
const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches && matchMedia('(pointer: fine)').matches;

if (hero && motionOK) {
  let frame = 0;
  hero.addEventListener('pointermove', (event) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty('--mx', x.toFixed(3));
      hero.style.setProperty('--my', y.toFixed(3));
      frame = 0;
    });
  });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--mx', 0);
    hero.style.setProperty('--my', 0);
  });
}
