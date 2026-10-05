// 界面语言：?lang=en 时用英文界面与英文内容（缺英文的字段退回中文）；默认中文
export const LANG = typeof location !== 'undefined' && new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';

const STRINGS = {
  zh: {
    title: '下潜：荣格与我',
    description: '一张向心理深处下潜的互动星图：人格面具、凝视、投射、情结、阴影、阿尼玛与自性。',
    loading: '正在铺开星图……',
    note: '个人叙事与可视化，不是心理测评，不输出分数或类型结论。',
    navLabel: '七站列表',
    mini: '小地图',
    ctrl: '站内导航',
    prev: '‹ 上一站', over: '返回全图', next: '下一站 ›',
    hint: '拖动旋转　·　滚轮缩放　·　点一站飞进去',
    noscript: '这个页面需要 JavaScript 才能显示内容。',
    concept: '荣格概念', theme: '叙事主题', source: '出处：', pending: '（出处待对原文核对）',
    take: '我的理解',
    imgAlt: (name, k) => `${name}的画面（${k}）`,
    fail3d: '三维视图暂时无法加载，已切换为静态阅读版。',
    failContent: '内容加载失败，请稍后重试。',
  },
  en: {
    title: 'Descent: Jung and Me',
    description: 'An interactive star map descending into the psyche: persona, gaze, projection, complex, shadow, anima and the self.',
    loading: 'Laying out the map…',
    note: 'A personal story and visualisation — not a psychological test; it outputs no score or type.',
    navLabel: 'Seven stations',
    mini: 'Minimap',
    ctrl: 'Station navigation',
    prev: '‹ Previous', over: 'Back to the map', next: 'Next ›',
    hint: 'Drag to rotate  ·  scroll to zoom  ·  click a station to fly in',
    noscript: 'This page needs JavaScript to show its content.',
    concept: 'Jungian concept', theme: 'Narrative theme', source: 'Source: ', pending: ' (citation still to be checked against the original)',
    take: 'My take',
    imgAlt: (name, k) => `${name} (${k})`,
    fail3d: 'The 3D view could not load; showing the static reading version instead.',
    failContent: 'The content could not load. Please try again later.',
  },
};

export const T = STRINGS[LANG];

/** A station's text field in the current language; falls back to Chinese when no English is given. */
export function pick(s, field) {
  if (LANG === 'en') {
    if (field === 'name_zh') return s.name_en || s.name_zh;
    const en = s[`${field}_en`];
    if (typeof en === 'string' && en.trim()) return en;
  }
  return s[field];
}

/** Puts the interface strings into the static page (title, buttons, hints, labels). */
export function applyStatic(doc = document) {
  doc.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
  doc.title = T.title;
  doc.querySelector('meta[name="description"]')?.setAttribute('content', T.description);
  const set = (sel, text) => { const el = doc.querySelector(sel); if (el) el.textContent = text; };
  set('h1.sr', T.title);
  set('#loading', T.loading);
  set('#note', T.note);
  set('#btn-prev', T.prev); set('#btn-over', T.over); set('#btn-next', T.next);
  set('#hint', T.hint);
  doc.getElementById('nav')?.setAttribute('aria-label', T.navLabel);
  doc.getElementById('mini')?.setAttribute('aria-label', T.mini);
  doc.getElementById('ctrl')?.setAttribute('aria-label', T.ctrl);
}
