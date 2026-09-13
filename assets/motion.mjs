// Native, bounded feedback only. No scroll interception, cursor loops or motion dependency.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const active = new Set();

function acknowledge(element) {
  if (reduced.matches || !element.animate) return;
  element.getAnimations().forEach(a => a.cancel());
  const animation = element.animate(
    [{ backgroundColor: '#d1ffca' }, { backgroundColor: 'transparent' }],
    { duration: 380, easing: 'ease-out' }
  );
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => active.delete(animation));
}

for (const id of ['metrics', 'agent-score', 'agent-facts']) {
  const target = document.getElementById(id);
  if (!target) continue;
  let previous = target.textContent;
  new MutationObserver(() => {
    const current = target.textContent;
    if (current !== previous && previous.trim()) {
      if (id === 'metrics') target.querySelectorAll('strong').forEach(acknowledge);
      else acknowledge(target);
    }
    previous = current;
  }).observe(target, { childList: true, subtree: true, characterData: true });
}

// ── Unified Motion System ──
// 1. Reading Progress Bar
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.prepend(progressBar);

function updateProgress() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const progress = max > 0 ? (h.scrollTop / max) * 100 : 0;
  progressBar.style.width = progress.toFixed(1) + '%';
}

// 2. Sticky Nav Scrolled State
const navWrap = document.querySelector('.nav-wrap');
function updateNavScrolled() {
  if (!navWrap) return;
  if (window.scrollY > 24) {
    navWrap.classList.add('scrolled');
  } else {
    navWrap.classList.remove('scrolled');
  }
}

// 3. Scroll Spy for Anchor Navigation
const anchorLinks = Array.from(document.querySelectorAll('.anchor-nav a[href^="#"]'));
const spySections = anchorLinks
  .map(a => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    return el ? { link: a, section: el } : null;
  })
  .filter(Boolean);

function updateScrollSpy() {
  if (!spySections.length) return;
  const scrollPos = window.scrollY + 140;
  let activeEntry = null;
  for (const entry of spySections) {
    if (entry.section.offsetTop <= scrollPos) {
      activeEntry = entry;
    }
  }
  spySections.forEach(e => e.link.classList.remove('active'));
  if (activeEntry) {
    activeEntry.link.classList.add('active');
  }
}

window.addEventListener('scroll', () => {
  updateProgress();
  updateNavScrolled();
  updateScrollSpy();
}, { passive: true });
updateProgress();
updateNavScrolled();
updateScrollSpy();

// 4. Smooth Number Counter Animation
function animateCounter(el) {
  if (reduced.matches || el.dataset.animated) return;
  const raw = el.textContent.trim();
  const match = raw.match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) return;
  const prefix = match[1];
  const numStr = match[2].replace(/,/g, '');
  const suffix = match[3];
  const targetNum = parseFloat(numStr);
  if (isNaN(targetNum)) return;
  
  el.dataset.animated = 'true';
  const hasComma = match[2].includes(',');
  const decimals = (numStr.split('.')[1] || '').length;
  const duration = 850;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = targetNum * ease;
    let formatted = current.toFixed(decimals);
    if (hasComma) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }
    el.textContent = `${prefix}${formatted}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = raw;
    }
  }
  requestAnimationFrame(step);
}

// 5. Scroll Reveal Engine (IntersectionObserver)
if (!reduced.matches && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.card, .delivery-workbench, .delivery-analysis, .hero-object, .project-card, .kpi-card, .analysis-card, .analysis-finding, .flow, .section-head'
  );

  const containerStaggers = document.querySelectorAll('.grid, .analysis-kpi, .analysis-cards, .flow');
  containerStaggers.forEach(c => {
    Array.from(c.children).forEach((child, i) => {
      child.classList.add(`stagger-${Math.min(i + 1, 5)}`);
    });
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        if (entry.target.classList.contains('kpi-card')) {
          const val = entry.target.querySelector('.kpi-value');
          if (val) animateCounter(val);
        }
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealTargets.forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
}

reduced.addEventListener('change', () => {
  if (reduced.matches) active.forEach(a => a.cancel());
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) active.forEach(a => a.cancel());
});
