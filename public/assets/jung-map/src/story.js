const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let sections = [];
let last = '';

// 文字面板：静态版里是依次排开的 7 段（含该站全部画面），地图里只显示当前聚焦的一站
export function buildStory(stations, imageNames = []) {
  const root = document.getElementById('story');
  root.innerHTML = stations.map((s, i) => {
    const imgs = s.keyframes.filter(k => imageNames.includes(k))
      .map(k => `<img src="./assets/${k}.webp" alt="${esc(s.name_zh)}的画面（${k}）" loading="lazy">`).join('');
    const kind = s.kind === 'jung-concept' ? '荣格概念' : '叙事主题';
    const src = s.source_verified || s.kind !== 'jung-concept' ? s.source : `${s.source}（出处待对原文核对）`;   // 叙事主题没有荣格原书出处，不需要核对
    return `<section class="station" data-i="${i}" aria-label="${esc(s.name_zh)}">
      ${imgs}<p class="kind">${String(i + 1).padStart(2, '0')} · ${kind}</p>
      <h2>${esc(s.name_zh)}</h2><p class="en" lang="en">${esc(s.name_en)}</p>
      <p class="concept">${esc(s.jung_concept)}</p>
      ${s.my_take ? `<p class="take">${esc(s.my_take)}</p>` : ''}
      ${s.suggestion ? `<p class="try">${esc(s.suggestion)}</p>` : ''}
      <p class="src">出处：${esc(src)}</p></section>`;
  }).join('');
  sections = [...root.querySelectorAll('.station')];
  last = '';
}

// index 为 -1 表示全图（全部隐去）；weight 是聚焦度 0..1
export function updateStory({ index, weight }) {
  const key = `${index}:${weight.toFixed(2)}`;
  if (key === last) return;
  last = key;
  sections.forEach((el, i) => {
    const on = i === index;
    el.style.opacity = on ? String(Math.max(0, (weight - 0.35) / 0.65)) : '0';
    el.style.pointerEvents = on && weight > 0.7 ? 'auto' : 'none';
  });
}
