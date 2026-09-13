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

// ── 6. Per-Page Distinct Data Ambient Canvas Engine ──
function getPageType() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('campus-delivery')) return 'delivery';
  if (path.includes('stock-data')) return 'csv';
  if (path.includes('ai-career')) return 'career';
  if (path.includes('ai-campus')) return 'campus';
  if (path.includes('hris-workflow')) return 'hris';
  return 'home';
}

function createMotifs(type) {
  switch (type) {
    case 'delivery':
      return `
<!-- 1. Relational Database Schema Network (8 Tables) -->
<div class="ambient-motif motif-pos-tr" data-speed="0.04">
  <svg viewBox="0 0 380 280" fill="none">
    <rect class="motif-fill" x="15" y="15" width="115" height="62" rx="8"/>
    <rect class="motif-mint" x="15" y="15" width="115" height="22" rx="8"/>
    <text class="motif-accent-text" x="25" y="30">ORDERS [8-REL]</text>
    <text x="25" y="52" font-size="9">PK id · total_cents</text>
    <text x="25" y="66" font-size="8" fill="#666">status: paid/deliv/ref</text>

    <rect class="motif-fill" x="235" y="15" width="125" height="62" rx="8"/>
    <rect x="235" y="15" width="125" height="22" rx="8" fill="#f0f0f0"/>
    <text x="245" y="30">STUDENTS</text>
    <text x="245" y="52" font-size="9">PK id · name · dorm</text>
    <text x="245" y="66" font-size="8" fill="#666">idx_orders_student</text>

    <rect class="motif-fill" x="15" y="180" width="115" height="60" rx="8"/>
    <rect x="15" y="180" width="115" height="22" rx="8" fill="#f0f0f0"/>
    <text x="25" y="195">MERCHANTS</text>
    <text x="25" y="218" font-size="9">PK id · name · menu</text>
    <text x="25" y="231" font-size="8" fill="#666">revenue_rank: TOP4</text>

    <rect class="motif-fill" x="235" y="180" width="125" height="60" rx="8"/>
    <rect class="motif-mint" x="235" y="180" width="125" height="22" rx="8"/>
    <text class="motif-accent-text" x="245" y="195">PAYMENTS</text>
    <text x="245" y="218" font-size="9">FK order_id · amount</text>
    <text x="245" y="231" font-size="8" fill="#666">CHECK(amount>0)</text>

    <!-- Connectors with Flow Lines -->
    <path d="M 130 46 L 235 46" class="ambient-flow-line"/>
    <path d="M 72 77 L 72 180" class="ambient-flow-line"/>
    <path d="M 130 210 L 235 210" class="ambient-flow-line"/>
    <circle cx="130" cy="46" r="4" fill="#059669"/>
    <circle cx="235" cy="46" r="4" fill="#059669"/>
    <circle cx="72" cy="180" r="4" fill="#059669"/>
    <polygon points="175,41 185,46 175,51" fill="#059669"/>
  </svg>
</div>

<!-- 2. SQL Query Execution Plan Tree (EXPLAIN QUERY PLAN) -->
<div class="ambient-motif motif-pos-ml" data-speed="-0.03">
  <svg viewBox="0 0 390 260" fill="none">
    <text x="15" y="22" font-size="12">QUERY PLAN TREE</text>
    <rect class="motif-fill" x="15" y="38" width="220" height="42" rx="6"/>
    <text x="25" y="56" font-size="10">SCAN TABLE orders</text>
    <text x="25" y="70" font-size="8" fill="#666">USING INDEX idx_orders_created</text>

    <line x1="60" y1="80" x2="60" y2="115"/>
    <path d="M 60 115 L 110 115" class="ambient-flow-line"/>
    <rect class="motif-fill" x="110" y="98" width="230" height="42" rx="6"/>
    <text x="120" y="116" font-size="10">SEARCH TABLE dishes</text>
    <text x="120" y="130" font-size="8" fill="#666">USING INTEGER PRIMARY KEY (rowid=?)</text>

    <line x1="60" y1="115" x2="60" y2="175"/>
    <path d="M 60 175 L 110 175" class="ambient-flow-line"/>
    <rect class="motif-mint" x="110" y="158" width="230" height="42" rx="6"/>
    <text class="motif-accent-text" x="120" y="176" font-size="10">AGGREGATE · GROUP BY m.id</text>
    <text class="motif-accent-text" x="120" y="190" font-size="8">SUM(payments) - SUM(refunds)</text>
    <circle cx="60" cy="115" r="3" fill="#111"/>
    <circle cx="60" cy="175" r="3" fill="#111"/>
  </svg>
</div>

<!-- 3. Transaction State Machine & Risk Guard -->
<div class="ambient-motif motif-pos-br" data-speed="0.05">
  <svg viewBox="0 0 350 240" fill="none">
    <text x="15" y="22">TRANSACTION STATE MACHINE</text>
    <rect class="motif-fill" x="15" y="45" width="85" height="36" rx="6"/>
    <text x="25" y="67" font-size="9">1. PLACED</text>

    <path d="M 100 63 L 135 63" class="ambient-flow-line"/>
    <rect class="motif-mint" x="135" y="45" width="85" height="36" rx="6"/>
    <text class="motif-accent-text" x="145" y="67" font-size="9">2. PAID</text>

    <path d="M 220 53 L 260 35" class="ambient-flow-line"/>
    <rect class="motif-fill" x="255" y="18" width="85" height="34" rx="6"/>
    <text x="265" y="39" font-size="9">DELIVERED</text>

    <path d="M 220 73 L 260 92" class="ambient-flow-line"/>
    <rect class="motif-fill" x="255" y="75" width="85" height="34" rx="6" stroke="#b91c1c"/>
    <text x="265" y="96" font-size="9" fill="#b91c1c">REFUNDED</text>

    <line x1="15" y1="140" x2="335" y2="140" stroke-dasharray="3 3"/>
    <text x="15" y="165" font-size="10">TRIGGER · RESERVE_STOCK: OK</text>
    <text x="15" y="185" font-size="10">CHECK: unit_price_cents > 0</text>
    <text x="15" y="205" font-size="10">ISOLATION: BEGIN IMMEDIATE</text>
  </svg>
</div>
`;

    case 'csv':
      return `
<!-- 1. Data Cleaning Funnel & Matrix (13 -> 10 Rows) -->
<div class="ambient-motif motif-pos-tr" data-speed="0.04">
  <svg viewBox="0 0 380 270" fill="none">
    <text x="15" y="22" font-size="12">DATA CLEANING AUDIT</text>
    <rect class="motif-fill" x="15" y="40" width="110" height="50" rx="6"/>
    <text x="25" y="60">RAW CSV</text>
    <text x="25" y="76" font-size="8" fill="#666">13 rows · 100%</text>

    <path d="M 125 65 L 165 65" class="ambient-flow-line"/>
    <rect class="motif-fill" x="165" y="40" width="100" height="50" rx="6"/>
    <text x="175" y="58" font-size="9" fill="#b91c1c">-1 DUP</text>
    <text x="175" y="74" font-size="9" fill="#b91c1c">-2 NULLS</text>

    <path d="M 265 65 L 300 65" class="ambient-flow-line"/>
    <rect class="motif-mint" x="300" y="40" width="70" height="50" rx="6"/>
    <text class="motif-accent-text" x="310" y="62">CLEAN</text>
    <text class="motif-accent-text" x="310" y="78" font-size="8">10 rows</text>

    <!-- Matrix points -->
    <g transform="translate(15, 120)">
      <text x="0" y="0" font-size="9">FIELD MATRIX (10 KEPT, 3 PRUNED)</text>
      <rect x="0" y="15" width="16" height="16" rx="3" class="motif-mint"/>
      <rect x="22" y="15" width="16" height="16" rx="3" class="motif-mint"/>
      <rect x="44" y="15" width="16" height="16" rx="3" class="motif-mint"/>
      <rect x="66" y="15" width="16" height="16" rx="3" class="motif-fill" stroke-dasharray="2 2"/>
      <rect x="88" y="15" width="16" height="16" rx="3" class="motif-mint"/>
      <rect x="110" y="15" width="16" height="16" rx="3" class="motif-mint"/>
      <rect x="132" y="15" width="16" height="16" rx="3" class="motif-mint"/>
      <rect x="154" y="15" width="16" height="16" rx="3" class="motif-fill" stroke-dasharray="2 2"/>
      <rect x="176" y="15" width="16" height="16" rx="3" class="motif-mint"/>
      <rect x="198" y="15" width="16" height="16" rx="3" class="motif-mint"/>
    </g>
  </svg>
</div>

<!-- 2. Gaussian Bell Curve & 7-Bin Histogram -->
<div class="ambient-motif motif-pos-ml" data-speed="-0.03">
  <svg viewBox="0 0 390 260" fill="none">
    <text x="20" y="24" font-size="12">GAUSSIAN DISTRIBUTION & BINS</text>
    <line x1="20" y1="210" x2="370" y2="210"/>
    <line x1="20" y1="40" x2="20" y2="210"/>

    <!-- Histogram Bins -->
    <rect class="motif-fill" x="40" y="165" width="34" height="45"/>
    <rect class="motif-fill" x="80" y="125" width="34" height="85"/>
    <rect class="motif-fill" x="120" y="70" width="34" height="140"/>
    <rect class="motif-mint" x="160" y="45" width="34" height="165"/>
    <rect class="motif-fill" x="200" y="75" width="34" height="135"/>
    <rect class="motif-fill" x="240" y="130" width="34" height="80"/>
    <rect class="motif-fill" x="280" y="170" width="34" height="40"/>

    <!-- Normal Curve Line -->
    <path d="M 25 206 C 95 206, 130 40, 177 40 C 224 40, 260 206, 335 206" stroke="#059669" stroke-width="2.5"/>
    <line x1="177" y1="40" x2="177" y2="210" stroke="#059669" stroke-dasharray="4 4"/>
    <text class="motif-accent-text" x="170" y="28">μ (MEAN)</text>
    <text x="235" y="226" font-size="9">+1σ</text>
    <text x="100" y="226" font-size="9">-1σ</text>
  </svg>
</div>

<!-- 3. Boxplot & IQR Interquartile Range -->
<div class="ambient-motif motif-pos-br" data-speed="0.05">
  <svg viewBox="0 0 350 230" fill="none">
    <text x="15" y="24">BOXPLOT & QUANTILES</text>
    <line x1="20" y1="80" x2="70" y2="80"/>
    <line x1="20" y1="65" x2="20" y2="95"/>
    <text x="15" y="112" font-size="8">MIN: 8.0</text>

    <rect class="motif-fill" x="70" y="55" width="90" height="50" rx="4"/>
    <rect class="motif-mint" x="160" y="55" width="90" height="50" rx="4"/>
    <line x1="160" y1="55" x2="160" y2="105" stroke-width="2"/>
    <text x="65" y="120" font-size="8">Q1 (25%): 10.0</text>
    <text class="motif-accent-text" x="145" y="44" font-size="9">MEDIAN: 16.0</text>
    <text x="235" y="120" font-size="8">Q3 (75%): 21.0</text>

    <line x1="250" y1="80" x2="310" y2="80"/>
    <line x1="310" y1="65" x2="310" y2="95"/>
    <text x="300" y="112" font-size="8">MAX: 22.0</text>

    <!-- Outliers dots -->
    <circle cx="335" cy="80" r="4" fill="#b91c1c"/>
    <text x="325" y="100" font-size="7" fill="#b91c1c">OUTLIER</text>
  </svg>
</div>
`;

    case 'career':
      return `
<!-- 1. Candidate Skill Radar (5 Dimensions) -->
<div class="ambient-motif motif-pos-tr" data-speed="0.04">
  <svg viewBox="0 0 380 270" fill="none">
    <text x="15" y="22" font-size="12">COMPETENCY RADAR (84/100)</text>
    <!-- Pentagon Web -->
    <polygon points="190,50 275,105 245,195 135,195 105,105" stroke-dasharray="3 3"/>
    <polygon points="190,75 245,115 225,175 155,175 135,115" stroke-dasharray="2 2"/>
    <!-- Radar Shape Filled -->
    <polygon points="190,58 265,110 220,185 145,170 115,110" class="motif-mint" stroke="#059669" stroke-width="2"/>
    <!-- Axis Labels -->
    <text class="motif-accent-text" x="165" y="42">SQL (92)</text>
    <text x="280" y="110">TABLEAU (80)</text>
    <text x="235" y="215">PYTHON (88)</text>
    <text x="95" y="215">BUSINESS (85)</text>
    <text x="45" y="110">COMM (78)</text>
  </svg>
</div>

<!-- 2. Evidence Inference DAG -->
<div class="ambient-motif motif-pos-ml" data-speed="-0.03">
  <svg viewBox="0 0 390 260" fill="none">
    <text x="15" y="22" font-size="12">EVIDENCE MATCH INFERENCE</text>
    <rect class="motif-fill" x="15" y="45" width="120" height="48" rx="6"/>
    <text x="25" y="65">JD REQS</text>
    <text x="25" y="78" font-size="8" fill="#666">Hard Criteria Filter</text>

    <path d="M 135 69 L 180 69" class="ambient-flow-line"/>
    <rect class="motif-fill" x="180" y="45" width="130" height="48" rx="6"/>
    <text x="190" y="65">FACT ANCHOR</text>
    <text x="190" y="78" font-size="8" fill="#666">Verified Candidate Doc</text>

    <path d="M 245 93 L 245 140" class="ambient-flow-line"/>
    <rect class="motif-mint" x="165" y="140" width="160" height="56" rx="8"/>
    <text class="motif-accent-text" x="175" y="162">DECISION: 84 / 100</text>
    <text class="motif-accent-text" x="175" y="180" font-size="9">HUMAN_AUDIT_REQUIRED: TRUE</text>
  </svg>
</div>

<!-- 3. Schema Validator Token Pipeline -->
<div class="ambient-motif motif-pos-br" data-speed="0.05">
  <svg viewBox="0 0 350 220" fill="none">
    <text x="15" y="24">PYDANTIC RUNTIME GUARD</text>
    <rect class="motif-fill" x="15" y="45" width="310" height="140" rx="8"/>
    <text x="30" y="72" font-size="10">model: ResumeMatchProfile</text>
    <text x="30" y="94" font-size="10" fill="#059669">✓ days_per_week: int = 4 (VALID)</text>
    <text x="30" y="116" font-size="10" fill="#059669">✓ sql_project_evidence: bool = True</text>
    <text x="30" y="138" font-size="10" fill="#b91c1c">⚠ tableau_claim: PENDING_CHECK</text>
    <text x="30" y="162" font-size="9" fill="#666">Tokens: 1,420 · Provider: Local SQLite</text>
  </svg>
</div>
`;

    case 'campus':
      return `
<!-- 1. AI Paradigms Timeline (2022-2025) -->
<div class="ambient-motif motif-pos-tr" data-speed="0.04">
  <svg viewBox="0 0 380 270" fill="none">
    <text x="15" y="24" font-size="12">AI PARADIGM EVOLUTION</text>
    <line x1="25" y1="70" x2="355" y2="70" stroke-width="2"/>
    <circle cx="45" cy="70" r="7" class="motif-fill"/>
    <text x="30" y="100" font-size="9">2022.11</text>
    <text x="30" y="114" font-size="8" fill="#666">ChatGPT (Text)</text>

    <circle cx="145" cy="70" r="7" class="motif-fill"/>
    <text x="130" y="100" font-size="9">2024.05</text>
    <text x="130" y="114" font-size="8" fill="#666">GPT-4o (Omni)</text>

    <circle cx="245" cy="70" r="7" class="motif-mint"/>
    <text class="motif-accent-text" x="230" y="100" font-size="9">2024.10</text>
    <text x="230" y="114" font-size="8" fill="#666">Computer Use</text>

    <circle cx="335" cy="70" r="7" class="motif-mint"/>
    <text class="motif-accent-text" x="315" y="100" font-size="9">2025→</text>
    <text x="315" y="114" font-size="8" fill="#666">Claude Code</text>

    <path d="M 25 70 L 355 70" class="ambient-flow-line"/>
  </svg>
</div>

<!-- 2. Survey Empirical Regression Scatter -->
<div class="ambient-motif motif-pos-ml" data-speed="-0.03">
  <svg viewBox="0 0 390 260" fill="none">
    <text x="20" y="24" font-size="12">SURVEY REGRESSION & SCATTER</text>
    <line x1="30" y1="210" x2="360" y2="210"/>
    <line x1="30" y1="40" x2="30" y2="210"/>

    <!-- Sample dots -->
    <circle cx="70" cy="180" r="4" class="motif-fill"/>
    <circle cx="110" cy="165" r="4" class="motif-fill"/>
    <circle cx="150" cy="130" r="4" class="motif-mint"/>
    <circle cx="180" cy="140" r="4" class="motif-fill"/>
    <circle cx="210" cy="105" r="4" class="motif-mint"/>
    <circle cx="250" cy="85" r="4" class="motif-fill"/>
    <circle cx="290" cy="65" r="4" class="motif-mint"/>
    <circle cx="330" cy="55" r="4" class="motif-fill"/>

    <!-- Regression Line -->
    <line x1="40" y1="200" x2="350" y2="50" stroke="#059669" stroke-width="2"/>
    <text class="motif-accent-text" x="250" y="42">R² = 0.84 (p < .001)</text>
    <text x="320" y="226" font-size="9">AI Perceived Help</text>
    <text x="35" y="32" font-size="9">Task Quality</text>
  </svg>
</div>

<!-- 3. 5-Stage Verification Protocol -->
<div class="ambient-motif motif-pos-br" data-speed="0.05">
  <svg viewBox="0 0 350 230" fill="none">
    <text x="15" y="24">5-STAGE VERIFICATION MODEL</text>
    <rect class="motif-fill" x="15" y="45" width="150" height="34" rx="6"/>
    <text x="25" y="66" font-size="9">1. TASK DEFINITION</text>

    <rect class="motif-fill" x="180" y="45" width="150" height="34" rx="6"/>
    <text x="190" y="66" font-size="9">2. TRUSTED INPUT</text>

    <rect class="motif-fill" x="15" y="95" width="150" height="34" rx="6"/>
    <text x="25" y="116" font-size="9">3. AI GENERATION</text>

    <rect class="motif-fill" x="180" y="95" width="150" height="34" rx="6"/>
    <text x="190" y="116" font-size="9">4. HUMAN AUDIT</text>

    <rect class="motif-mint" x="90" y="150" width="170" height="40" rx="8"/>
    <text class="motif-accent-text" x="105" y="174" font-size="10">5. INDEPENDENT ACCEPT</text>
  </svg>
</div>
`;

    case 'hris':
      return `
<!-- 1. Master Data Alignment Pipeline (6000 CDP) -->
<div class="ambient-motif motif-pos-tr" data-speed="0.04">
  <svg viewBox="0 0 380 270" fill="none">
    <text x="15" y="24" font-size="12">CDP MASTER DATA PIPELINE</text>
    <rect class="motif-fill" x="15" y="45" width="130" height="52" rx="6"/>
    <text x="25" y="66">ROSTER (Excel)</text>
    <text x="25" y="82" font-size="8" fill="#666">6,000 Employees Scope</text>

    <path d="M 145 71 L 195 71" class="ambient-flow-line"/>
    <rect class="motif-fill" x="195" y="45" width="150" height="52" rx="6"/>
    <text x="205" y="66">PDF PARSE / OCR</text>
    <text x="205" y="82" font-size="8" fill="#666">DeepSeek / GPT API</text>

    <path d="M 270 97 L 270 145" class="ambient-flow-line"/>
    <rect class="motif-mint" x="180" y="145" width="180" height="56" rx="8"/>
    <text class="motif-accent-text" x="195" y="168">SHAREPOINT LIST</text>
    <text class="motif-accent-text" x="195" y="186" font-size="9">Verified Writeback (3,000)</text>
  </svg>
</div>

<!-- 2. Exception Routing Flow -->
<div class="ambient-motif motif-pos-ml" data-speed="-0.03">
  <svg viewBox="0 0 390 260" fill="none">
    <text x="15" y="24" font-size="12">EXCEPTION ROUTING RULES</text>
    <rect class="motif-fill" x="15" y="50" width="120" height="42" rx="6"/>
    <text x="25" y="74">CANDIDATE</text>

    <path d="M 135 65 L 180 40"/>
    <rect class="motif-mint" x="180" y="20" width="180" height="38" rx="6"/>
    <text class="motif-accent-text" x="190" y="42">VERIFIED: AUTO-WRITE</text>

    <path d="M 135 71 L 180 71"/>
    <rect class="motif-fill" x="180" y="65" width="180" height="38" rx="6" stroke="#b91c1c"/>
    <text x="190" y="88" font-size="9" fill="#b91c1c">CONFLICT: HR REVIEW</text>

    <path d="M 135 77 L 180 115"/>
    <rect class="motif-fill" x="180" y="115" width="180" height="38" rx="6"/>
    <text x="190" y="138" font-size="9" fill="#666">NO PDF: RE-COLLECT</text>
  </svg>
</div>

<!-- 3. Power Automate Workflow State -->
<div class="ambient-motif motif-pos-br" data-speed="0.05">
  <svg viewBox="0 0 350 230" fill="none">
    <text x="15" y="24">POWER AUTOMATE FLOW</text>
    <rect class="motif-fill" x="15" y="45" width="310" height="135" rx="8"/>
    <text x="30" y="75" font-size="10">TRIGGER: Recurrence / Daily Batch</text>
    <text x="30" y="98" font-size="10">CONNECTOR: SharePoint Online</text>
    <text x="30" y="121" font-size="10" fill="#059669">AUDIT TRAIL: Page & Version Preserved</text>
    <text x="30" y="144" font-size="10">SECURITY: Tenant Boundary Enforced</text>
  </svg>
</div>
`;

    case 'home':
    default:
      return `
<!-- 1. General Schema Topology (Campus Delivery & SQL) -->
<div class="ambient-motif motif-pos-tr" data-speed="0.035">
  <svg viewBox="0 0 380 270" fill="none">
    <rect class="motif-fill" x="15" y="15" width="115" height="56" rx="8"/>
    <rect class="motif-mint" x="15" y="15" width="115" height="20" rx="8"/>
    <text class="motif-accent-text" x="25" y="29">ORDERS</text>
    <text x="25" y="52" font-size="8">PK id · total_cents</text>

    <rect class="motif-fill" x="235" y="15" width="125" height="56" rx="8"/>
    <text x="245" y="38">STUDENTS</text>
    <text x="245" y="54" font-size="8">PK id · dorm</text>

    <rect class="motif-fill" x="15" y="160" width="115" height="56" rx="8"/>
    <text x="25" y="185">MERCHANTS</text>
    <text x="25" y="201" font-size="8">PK id · net_rev</text>

    <rect class="motif-fill" x="235" y="160" width="125" height="56" rx="8"/>
    <rect class="motif-mint" x="235" y="160" width="125" height="20" rx="8"/>
    <text class="motif-accent-text" x="245" y="174">PAYMENTS</text>
    <text x="245" y="198" font-size="8">FK order_id</text>

    <path d="M 130 43 L 235 43" class="ambient-flow-line"/>
    <path d="M 72 71 L 72 160" class="ambient-flow-line"/>
    <path d="M 130 188 L 235 188" class="ambient-flow-line"/>
    <circle cx="130" cy="43" r="3" fill="#059669"/>
    <circle cx="235" cy="43" r="3" fill="#059669"/>
  </svg>
</div>

<!-- 2. Gaussian Distribution Curve (CSV Lab) -->
<div class="ambient-motif motif-pos-ml" data-speed="-0.025">
  <svg viewBox="0 0 390 250" fill="none">
    <text x="20" y="24" font-size="12">DESCRIPTIVE STATISTICS</text>
    <line x1="20" y1="200" x2="360" y2="200"/>
    <rect class="motif-fill" x="45" y="155" width="30" height="45"/>
    <rect class="motif-fill" x="85" y="115" width="30" height="85"/>
    <rect class="motif-fill" x="125" y="65" width="30" height="135"/>
    <rect class="motif-mint" x="165" y="40" width="30" height="160"/>
    <rect class="motif-fill" x="205" y="70" width="30" height="130"/>
    <rect class="motif-fill" x="245" y="125" width="30" height="75"/>
    <rect class="motif-fill" x="285" y="165" width="30" height="35"/>
    <path d="M 25 196 C 95 196, 130 36, 180 36 C 230 36, 265 196, 335 196" stroke="#059669" stroke-width="2.5"/>
    <text class="motif-accent-text" x="172" y="24">μ (MEAN)</text>
  </svg>
</div>

<!-- 3. AI Agent Decision Flow (Job Agent / HRIS) -->
<div class="ambient-motif motif-pos-br" data-speed="0.045">
  <svg viewBox="0 0 350 230" fill="none">
    <text x="15" y="24">AI AGENT REASONING PIPELINE</text>
    <rect class="motif-fill" x="15" y="45" width="90" height="42" rx="6"/>
    <text x="25" y="70">RAW DOCS</text>

    <path d="M 105 66 L 150 66" class="ambient-flow-line"/>
    <rect class="motif-fill" x="150" y="45" width="100" height="42" rx="6"/>
    <text x="160" y="70">EVAL ENGINE</text>

    <path d="M 250 66 L 285 66" class="ambient-flow-line"/>
    <rect class="motif-mint" x="285" y="45" width="55" height="42" rx="6"/>
    <text class="motif-accent-text" x="292" y="70">84/100</text>

    <line x1="15" y1="125" x2="335" y2="125" stroke-dasharray="3 3"/>
    <text x="15" y="152" font-size="9">EVIDENCE ANCHOR: VERIFIED</text>
    <text x="15" y="172" font-size="9">HUMAN AUDIT FLAG: ACTIVE</text>
  </svg>
</div>
`;
  }
}

const pageType = getPageType();
const ambientCanvas = document.createElement('div');
ambientCanvas.className = 'data-ambient-canvas';
ambientCanvas.setAttribute('aria-hidden', 'true');
ambientCanvas.innerHTML = createMotifs(pageType);
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
