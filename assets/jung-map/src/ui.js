import { minimapPoint, spiralPoint } from './layout.js';

// 左侧列表、站名标签、情绪标签、小地图、站内按钮、键盘
export function createUI({ stations, controller }) {
  const nav = document.getElementById('nav'), labels = document.getElementById('labels'), emos = document.getElementById('emos');
  const mini = document.getElementById('mini'), ctrl = document.getElementById('ctrl'), hint = document.getElementById('hint');
  const mg = mini.getContext('2d');

  nav.innerHTML = stations.map((s, i) => `<button type="button" data-i="${i}">${String(i + 1).padStart(2, '0')}　${s.name_zh}</button>`).join('');
  nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) controller.goTo(Number(b.dataset.i)); });
  labels.innerHTML = stations.map((s, i) => `<div class="lbl" data-i="${i}">${s.name_zh}<small>${String(i + 1).padStart(2, '0')}</small></div>`).join('');
  emos.innerHTML = stations.map((s, i) => s.emotions.map((e, k) => `<div class="emo" data-i="${i}" data-k="${k}">${e}</div>`).join('')).join('');
  const lblEls = [...labels.children], emoEls = [...emos.children], navBtns = [...nav.querySelectorAll('button')];

  document.getElementById('btn-prev').addEventListener('click', () => controller.prev());
  document.getElementById('btn-next').addEventListener('click', () => controller.next());
  document.getElementById('btn-over').addEventListener('click', () => controller.overview());
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') controller.next();
    else if (e.key === 'ArrowLeft') controller.prev();
    else if (e.key === 'Escape') controller.overview();
  });

  const route = Array.from({ length: 80 }, (_, k) => minimapPoint(spiralPoint(k / 79)));
  const nodePts = stations.map((_, i) => minimapPoint(spiralPoint(i / (stations.length - 1))));
  const W = mini.width, H = mini.height;

  function drawMini(focus, visited) {
    mg.clearRect(0, 0, W, H);
    mg.strokeStyle = '#2a3f9c'; mg.lineWidth = 1.2; mg.beginPath();
    route.forEach((p, k) => (k ? mg.lineTo(p.x * W, p.y * H) : mg.moveTo(p.x * W, p.y * H))); mg.stroke();
    nodePts.forEach((p, i) => {
      mg.beginPath(); mg.arc(p.x * W, p.y * H, i === focus ? 5 : 3.2, 0, 7);
      mg.fillStyle = i === focus ? '#b5372c' : visited.has(i) ? '#c9ccd6' : '#4a5380'; mg.fill();
    });
  }

  return {
    update({ screen, emoScreen, focus, mode, visited, arrival }) {
      const overview = mode === 'overview';
      lblEls.forEach((el, i) => {
        const s = screen[i];
        el.style.display = s && s.visible ? 'block' : 'none';
        if (s) { el.style.left = `${s.x}px`; el.style.top = `${s.y + (i === lblEls.length - 1 ? -62 : 34)}px`; }  // 终点站的标签放在上方，避免与相邻站重叠
        el.style.opacity = overview ? '1' : '0';
      });
      emoEls.forEach(el => {
        const i = Number(el.dataset.i), k = Number(el.dataset.k), p = emoScreen[i] && emoScreen[i][k];
        const on = p && p.visible && focus === i;
        el.style.display = on ? 'block' : 'none';
        if (on) { el.style.left = `${p.x}px`; el.style.top = `${p.y}px`; el.style.opacity = String(arrival); }
      });
      navBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === focus)));
      ctrl.classList.toggle('on', focus >= 0 && mode === 'station');
      hint.classList.toggle('off', !overview);
      drawMini(focus, visited);
    },
    minimapPick(clientX, clientY) {
      const r = mini.getBoundingClientRect(), x = (clientX - r.left) / r.width, y = (clientY - r.top) / r.height;
      let best = -1, bd = 0.09;
      nodePts.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } });
      return best;
    },
    miniEl: mini,
  };
}
