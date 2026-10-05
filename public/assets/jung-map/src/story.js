import { T, pick } from './i18n.js';

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let sections = [];
let last = '';

// 文字面板：静态版里是依次排开的 7 段（含该站全部画面），地图里只显示当前聚焦的一站
export function buildStory(stations, imageNames = []) {
  const root = document.getElementById('story');
  root.innerHTML = stations.map((s, i) => {
    const imgs = s.keyframes.filter(k => imageNames.includes(k))
      .map(k => `<img src="./assets/${k}.webp" alt="${esc(T.imgAlt(pick(s, 'name_zh'), k))}" loading="lazy">`).join('');
    const kind = s.kind === 'jung-concept' ? T.concept : T.theme;
    const source = pick(s, 'source');
    const src = s.source_verified || s.kind !== 'jung-concept' ? source : `${source}${T.pending}`;   // 叙事主题没有荣格原书出处，不需要核对
    const name = pick(s, 'name_zh'), take = s.my_take ? pick(s, 'my_take') : '', tryIt = s.suggestion ? pick(s, 'suggestion') : '';
    return `<section class="station" data-i="${i}" aria-label="${esc(name)}">
      ${imgs}<p class="kind">${String(i + 1).padStart(2, '0')} · ${kind}</p>
      <h2>${esc(name)}</h2>${name === s.name_en ? '' : `<p class="en" lang="en">${esc(s.name_en)}</p>`}
      <p class="concept">${esc(pick(s, 'jung_concept'))}</p>
      ${take ? `<p class="take" data-label="${esc(T.take)}">${esc(take)}</p>` : ''}
      ${tryIt ? `<p class="try">${esc(tryIt)}</p>` : ''}
      <p class="src">${esc(T.source)}${esc(src)}</p></section>`;
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
