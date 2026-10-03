import type { Bi } from '../i18n';

/** Texts for the Jung × Me page components (bilingual). Numbers are kept out of the page chrome: the prose carries them. */
export const JUNG_TEXT = {
  film: {
    h: { zh: '五个镜头，五句荣格。', en: 'Five shots, five lines from Jung.' } as Bi,
    meta: { zh: '短片 · 英文口播 · 中英字幕', en: 'Film · English voice-over · bilingual subtitles' } as Bi,
    label: { zh: '荣格主题短片，英文口播，字幕为荣格著作与书信的英译摘录和中文意译', en: 'Short film on Jung with English voice-over; subtitles are excerpts from English translations of Jung’s writings and letters, with Chinese paraphrase' } as Bi,
    note: { zh: '画面由 AI 生成关键帧，再由代码在 WebGL 中逐帧合成；口播为 AI 合成并经后期处理。字幕引文及出处见下方。', en: 'Keyframes are AI-generated and composited frame by frame in WebGL; the voice-over is AI-generated and post-processed. The quotations and their sources are listed below.' } as Bi,
  },
  map: {
    h: { zh: '一张能走的星图。', en: 'A star map you can travel.' } as Bi,
    meta: { zh: 'Three.js · 真实 WebGL · 鼠标与键盘均可操作', en: 'Three.js · real WebGL · mouse and keyboard' } as Bi,
    intro: { zh: '七个站点沿一条下潜的路线排开：人格面具、他者的凝视、投射、情结、阴影、阿尼玛与阿尼姆斯、自性，最后落到“我”。站点顺序是叙事安排，不是荣格的理论次序；页面是个人叙事，不是心理测评，也不输出任何分数或类型。', en: 'Seven stations along one descending route: persona, the gaze of the other, projection, complex, shadow, anima and animus, the self — and finally “me”. The order is a narrative choice, not Jung’s theoretical order. This is a personal story, not a psychological test, and it outputs no score or type.' } as Bi,
    frameTitle: { zh: '荣格星图（互动）', en: 'Jung star map (interactive)' } as Bi,
    posterAlt: { zh: '星图的起始画面：七个站点和一条螺旋路线', en: 'The map’s opening view: seven stations on a spiral route' } as Bi,
    load: { zh: '运行星图', en: 'Run the map' } as Bi,
    loadHint: { zh: '点击后才会加载，页面保持轻量', en: 'Loads on click, so the page stays light' } as Bi,
    open: { zh: '全屏打开星图', en: 'Open the map full screen' } as Bi,
    note: { zh: '地图在你的浏览器里运行，不上传任何数据，也不读取你的信息。', en: 'The map runs in your browser; it uploads nothing and reads nothing about you.' } as Bi,
  },
};
