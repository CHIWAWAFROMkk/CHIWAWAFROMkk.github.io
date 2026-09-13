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

// 6. Data Ambient Canvas Motifs (Subtle background engineering vectors representing project motifs)
const ambientCanvas = document.createElement('div');
ambientCanvas.className = 'data-ambient-canvas';
ambientCanvas.setAttribute('aria-hidden', 'true');
ambientCanvas.innerHTML = `
<div class="ambient-motif motif-schema" data-speed="0.035">
  <svg viewBox="0 0 340 250" fill="none" stroke-width="1.2">
    <!-- Relational Schema Network (Campus Delivery SQL) -->
    <rect x="20" y="20" width="100" height="52" rx="6" fill="#fff" fill-opacity="0.6"/>
    <text x="30" y="42">ORDERS</text>
    <line x1="20" y1="50" x2="120" y2="50"/>
    <text x="30" y="64" font-size="8" fill-opacity="0.7">PK id · total_cents</text>

    <rect x="200" y="20" width="110" height="52" rx="6" fill="#fff" fill-opacity="0.6"/>
    <text x="210" y="42">STUDENTS</text>
    <line x1="200" y1="50" x2="310" y2="50"/>
    <text x="210" y="64" font-size="8" fill-opacity="0.7">PK id · name · dorm</text>

    <rect x="20" y="160" width="110" height="52" rx="6" fill="#fff" fill-opacity="0.6"/>
    <text x="30" y="182">MERCHANTS</text>
    <line x1="20" y1="190" x2="130" y2="190"/>
    <text x="30" y="204" font-size="8" fill-opacity="0.7">PK id · name</text>

    <rect x="200" y="160" width="110" height="52" rx="6" fill="#fff" fill-opacity="0.6"/>
    <text x="210" y="182">PAYMENTS</text>
    <line x1="200" y1="190" x2="310" y2="190"/>
    <text x="210" y="204" font-size="8" fill-opacity="0.7">FK order_id · paid</text>

    <!-- Connectors -->
    <path d="M 120 46 C 160 46, 160 46, 200 46" class="ambient-flow-line"/>
    <path d="M 70 72 C 70 110, 70 120, 70 160" class="ambient-flow-line"/>
    <path d="M 120 186 C 160 186, 160 186, 200 186" class="ambient-flow-line"/>
    <circle cx="120" cy="46" r="3" fill="currentColor"/>
    <circle cx="200" cy="46" r="3" fill="currentColor"/>
    <circle cx="70" cy="160" r="3" fill="currentColor"/>
  </svg>
</div>

<div class="ambient-motif motif-curve" data-speed="-0.025">
  <svg viewBox="0 0 360 220" fill="none" stroke-width="1.2">
    <!-- Gaussian Distribution & Histogram Ribbon (CSV Lab & Stats) -->
    <line x1="20" y1="190" x2="340" y2="190"/>
    <line x1="20" y1="20" x2="20" y2="190"/>
    <!-- Histogram Bars -->
    <rect x="45" y="150" width="28" height="40" stroke-dasharray="2 2"/>
    <rect x="80" y="115" width="28" height="75" stroke-dasharray="2 2"/>
    <rect x="115" y="65" width="28" height="125" stroke-dasharray="2 2"/>
    <rect x="150" y="40" width="28" height="150" stroke-dasharray="2 2" fill="currentColor" fill-opacity="0.08"/>
    <rect x="185" y="70" width="28" height="120" stroke-dasharray="2 2"/>
    <rect x="220" y="125" width="28" height="65" stroke-dasharray="2 2"/>
    <rect x="255" y="160" width="28" height="30" stroke-dasharray="2 2"/>
    <!-- Bell Curve -->
    <path d="M 25 186 C 90 186, 120 36, 164 36 C 208 36, 240 186, 315 186" stroke-width="2"/>
    <!-- Axis Labels -->
    <text x="158" y="24" font-size="9">μ (MEAN)</text>
    <text x="218" y="204" font-size="8">+1σ</text>
    <text x="96" y="204" font-size="8">-1σ</text>
    <line x1="164" y1="36" x2="164" y2="190" stroke-dasharray="3 3"/>
  </svg>
</div>

<div class="ambient-motif motif-matrix" data-speed="0.04">
  <svg viewBox="0 0 290 210" fill="none" stroke-width="1.2">
    <!-- Data Cleaning Matrix (CSV Lab / Audit Strip) -->
    <text x="20" y="24">DATA AUDIT · 13 -> 10</text>
    <g transform="translate(20, 36)">
      <rect x="0" y="0" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="24" y="0" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="48" y="0" width="18" height="18" rx="3" stroke-dasharray="2 2"/>
      <rect x="72" y="0" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="96" y="0" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="120" y="0" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.04"/>

      <rect x="0" y="24" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="24" y="24" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="48" y="24" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="72" y="24" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="96" y="24" width="18" height="18" rx="3" stroke-dasharray="2 2"/>
      <rect x="120" y="24" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>

      <rect x="0" y="48" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="24" y="48" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.04"/>
      <rect x="48" y="48" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="72" y="48" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="96" y="48" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>
      <rect x="120" y="48" width="18" height="18" rx="3" fill="currentColor" fill-opacity="0.15"/>

      <line x1="0" y1="80" x2="160" y2="80"/>
      <text x="0" y="98" font-size="8">DUP_CHECK: PASS</text>
      <text x="80" y="98" font-size="8">NULL_AUDIT: PASS</text>
    </g>
  </svg>
</div>

<div class="ambient-motif motif-pipeline" data-speed="-0.02">
  <svg viewBox="0 0 280 190" fill="none" stroke-width="1.2">
    <!-- AI Agent Decision & Pipeline Flow (Job Agent / HRIS) -->
    <text x="20" y="22">AGENT PIPELINE</text>
    <circle cx="40" cy="65" r="14" fill="currentColor" fill-opacity="0.08"/>
    <text x="32" y="68" font-size="8">IN</text>

    <path d="M 54 65 L 105 65" class="ambient-flow-line"/>

    <circle cx="120" cy="65" r="15" fill="currentColor" fill-opacity="0.08"/>
    <text x="108" y="68" font-size="8">RULES</text>

    <path d="M 135 65 C 160 65, 160 40, 185 40"/>
    <path d="M 135 65 C 160 65, 160 90, 185 90"/>

    <circle cx="200" cy="40" r="14" fill="currentColor" fill-opacity="0.08"/>
    <text x="190" y="43" font-size="7">SCORE</text>

    <circle cx="200" cy="90" r="14" fill="currentColor" fill-opacity="0.08"/>
    <text x="188" y="93" font-size="7">AUDIT</text>

    <path d="M 214 40 L 250 40"/>
    <path d="M 214 90 L 250 90"/>
    <text x="235" y="32" font-size="8">84/100</text>
    <text x="235" y="82" font-size="8">PASS</text>
  </svg>
</div>
`;
document.body.prepend(ambientCanvas);

// Parallax scrolling for ambient motifs
if (!reduced.matches) {
  const motifs = ambientCanvas.querySelectorAll('.ambient-motif');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    motifs.forEach(m => {
      const speed = parseFloat(m.dataset.speed || 0);
      m.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
    });
  }, { passive: true });
}

reduced.addEventListener('change', () => {
  if (reduced.matches) active.forEach(a => a.cancel());
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) active.forEach(a => a.cancel());
});
