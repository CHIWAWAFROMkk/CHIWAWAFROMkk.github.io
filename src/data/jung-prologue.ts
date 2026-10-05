import type { Bi } from '../i18n';

export interface PrologueFrame {
  src: string;
  /** The film's line on this picture; the shattering has none, as in the film. */
  quote?: { zh: string; en: string };
  alt: Bi;
}

/** The film's six keyframes in story order, served with the star map (no extra download). */
export const PROLOGUE_FRAMES: PrologueFrame[] = [
  { src: '/assets/jung-map/assets/K1.webp', alt: { zh: '一排戴面具的人形', en: 'A row of masked figures' },
    quote: { zh: '一种面具，为的是遮掩个体真实的本性。', en: 'A kind of mask … to conceal the true nature of the individual.' } },
  { src: '/assets/jung-map/assets/K2.webp', alt: { zh: '一只红色的眼睛', en: 'A red eye' },
    quote: { zh: '向外看的人在做梦，向内看的人才醒来。', en: 'Who looks outside, dreams; who looks inside, awakes.' } },
  { src: '/assets/jung-map/assets/K3.webp', alt: { zh: '被手与蛇缠住的红色头像', en: 'A red head held by hands and a snake' },
    quote: { zh: '情结，是可以反过来拥有我们的。', en: '… complexes can have us.' } },
  { src: '/assets/jung-map/assets/K4.webp', alt: { zh: '碎裂的面具', en: 'A shattering mask' } },
  { src: '/assets/jung-map/assets/K5.webp', alt: { zh: '影子从人形身后展开', en: 'A shadow spreading from a figure' },
    quote: { zh: '与自己的相遇，起初，是与自己的阴影相遇。', en: "The meeting with oneself is, at first, the meeting with one's own shadow." } },
  { src: '/assets/jung-map/assets/K6.webp', alt: { zh: '暗灯下回头的人形', en: 'A figure turning under a dim lamp' },
    quote: { zh: '向水镜里看的人，首先看见的是他自己的脸。', en: 'Whoever looks into the mirror of the water will see first of all his own face.' } },
];

export const PROLOGUE_TEXT = {
  label: { zh: '开场：短片的六个关键画面，由浏览器实时合成', en: 'Opening: the film’s six keyframes, composited live in your browser' } as Bi,
  kicker: { zh: '荣格 × 我', en: 'Jung × Me' } as Bi,
  sub: { zh: '七站星图：六个荣格概念，一个叙事主题，一条下潜的路线，最后落到“我”。', en: 'Seven stations — six Jungian concepts and one narrative theme — on one descending route, ending at “me”.' } as Bi,
  film: { zh: '看短片', en: 'Watch the film' } as Bi,
  map: { zh: '进入星图', en: 'Enter the star map' } as Bi,
  skip: { zh: '跳过开场', en: 'Skip the opening' } as Bi,
};
