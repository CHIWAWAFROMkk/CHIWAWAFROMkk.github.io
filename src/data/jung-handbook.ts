import type { Bi } from '../i18n';

export interface HandbookEntry {
  id: string;
  name: Bi;
  /** What the concept means (kept short; the sources are the Collected Works in R. F. C. Hull's translation). */
  concept: Bi;
  source: Bi;
  /** A personal response, abstract feelings only. Confirmed by the author as a whole on 2026-10-03. */
  mine: Bi;
  /** An optional small exercise. */
  try: Bi;
  /** Narrative themes have no Jungian source and are labelled as such. */
  narrative?: boolean;
}

export const HANDBOOK = {
  title: { zh: '自我探究手册', en: 'A self-inquiry handbook' } as Bi,
  intro: {
    zh: '手册和星图用的是同一份内容。每一站左边是荣格的概念和出处，右边是我对它的个人回应，以及一个可以自己试的小练习。这里只写抽象的感受，不含具体事件；它是个人叙事，不是心理测评，也不输出分数或类型。',
    en: 'The handbook uses the same content as the map. For each station: Jung’s concept and its source, then my own response and one small exercise you can try. Only abstract feelings are written here, with no specific events. It is a personal story, not a psychological test, and outputs no score or type.',
  } as Bi,
  labels: {
    concept: { zh: '荣格的概念', en: 'The concept' } as Bi,
    source: { zh: '出处', en: 'Source' } as Bi,
    mine: { zh: '我的回应', en: 'My response' } as Bi,
    try: { zh: '可以试试', en: 'Something to try' } as Bi,
    narrative: { zh: '叙事主题', en: 'Narrative theme' } as Bi,
    concept_tag: { zh: '荣格概念', en: 'Jungian concept' } as Bi,
  },
  entries: [
    {
      id: 'persona',
      name: { zh: '人格面具', en: 'Persona' },
      concept: { zh: 'Persona 指一个人在社会中呈现给他人的角色与形象，是集体心理的一部分，被体验为属于自己；它帮助人适应环境，但也可能被误当成全部的自己。', en: 'The persona is the role and image a person presents to others. It is part of the collective psyche, yet is experienced as one’s own. It helps us adapt to our surroundings, but can be mistaken for the whole self.' },
      source: { zh: '荣格《自我与无意识的关系》，CW 7，§§243–247（核心定义 §245；另见 §305）', en: 'Jung, “The Relations between the Ego and the Unconscious”, CW 7, §§243–247 (core definition §245; see also §305)' },
      mine: { zh: '我很在意自己呈现出的样子：外貌、能力与自律。', en: 'I care a great deal about how I come across: appearance, ability and self-discipline.' },
      try: { zh: '把“我想呈现的样子”和“我实际需要的东西”分开写下来看看。', en: 'Write down separately “the self I want to present” and “what I actually need”.' },
    },
    {
      id: 'gaze',
      name: { zh: '他者的凝视', en: 'The gaze of the other' },
      narrative: true,
      concept: { zh: '这一站是作品的叙事主题，不是荣格的专门术语。它借用的意思是：自我形象的形成离不开他人的目光与回应。“凝视”一词在思想史上更常与萨特、拉康相关。', en: 'This station is the work’s narrative theme, not a technical term of Jung’s. It borrows one idea: the image we form of ourselves cannot be separated from the gaze and the responses of others. In the history of ideas, “the gaze” is more often associated with Sartre and Lacan.' },
      source: { zh: '叙事主题，没有荣格原书出处；与萨特、拉康的“凝视”概念相近。', en: 'A narrative theme with no source in Jung’s writings; close to Sartre’s and Lacan’s idea of “the gaze”.' },
      mine: { zh: '我希望被认真看见，也希望在重要的关系里是特别的。', en: 'I want to be seen seriously, and to be someone special in the relationships that matter.' },
      try: { zh: '把“被认真对待”和“事事被优先”分开，直接说出自己的需要。', en: 'Separate “being treated seriously” from “always coming first”, and say what you need directly.' },
    },
    {
      id: 'projection',
      name: { zh: '投射', en: 'Projection' },
      concept: { zh: '投射是一种无意识的自动过程：个体自己的无意识内容被体验为外部对象或他人的属性，因而被“看”在别人身上。内容可以是不愿承认的特质，也可以是尚未意识到的渴望。', en: 'Projection is an unconscious, automatic process: a person’s own unconscious contents are experienced as properties of an outside object or another person, and so are “seen” in others. The content may be a trait one refuses to admit, or a longing not yet noticed.' },
      source: { zh: '荣格《心理类型》，CW 6，§783（定义章）；《埃翁》，CW 9ii，§17（另见 §16）', en: 'Jung, Psychological Types, CW 6, §783 (the definitions chapter); Aion, CW 9ii, §17 (see also §16)' },
      mine: { zh: '我会羡慕别人，也会反感别人，这些反应值得我留意。', en: 'I envy others, and I am put off by others; these reactions deserve my attention.' },
      try: { zh: '遇到强烈的羡慕或反感时，先问自己：这在说我的什么需要？', en: 'When envy or aversion is strong, first ask: what need of mine is this speaking about?' },
    },
    {
      id: 'complex',
      name: { zh: '情结', en: 'Complex' },
      concept: { zh: '情结是围绕某种强烈情绪聚集的一组观念与意象，带有相对的自主性，被触动时会比平时更快、更强地接管反应。', en: 'A complex is a cluster of ideas and images gathered around a strong emotion. It has a relative autonomy, and when touched it takes over the response faster and more strongly than usual.' },
      source: { zh: '荣格《情结理论综述》，CW 8，§§200–201（情结的定义见 §201；“情结可以拥有我们”见 §200）', en: 'Jung, “A Review of the Complex Theory”, CW 8, §§200–201 (the definition is at §201; “complexes can have us” is at §200)' },
      mine: { zh: '有些时刻我会强烈感到被忽视、被不公平对待、没有选择权，或付出没有回应。', en: 'There are moments when I feel strongly ignored, treated unfairly, without a choice, or that my effort gets no response.' },
      try: { zh: '感到情绪变强时先暂停、离开现场，平静后再沟通。', en: 'When the emotion grows strong, pause and step away; talk again once calm.' },
    },
    {
      id: 'shadow',
      name: { zh: '阴影', en: 'Shadow' },
      concept: { zh: '阴影是个体不愿承认、被压抑或尚未发展的那部分人格，不只包含令人不安的特质，也可能包含未被使用的力量。', en: 'The shadow is the part of the personality a person will not admit, has repressed, or has not yet developed. It holds not only unsettling traits but also unused strengths.' },
      source: { zh: '荣格《埃翁》，CW 9ii，§§13–16（核心 §14）；《原型与集体无意识》，CW 9i，§45', en: 'Jung, Aion, CW 9ii, §§13–16 (core: §14); “The Archetypes and the Collective Unconscious”, CW 9i, §45' },
      mine: { zh: '我身上有我想改变的部分，我不想假装它不存在。', en: 'There are parts of me I want to change, and I do not want to pretend they are not there.' },
      try: { zh: '把“我做过需要改变的事”和“我整个人没有成长”分开看。', en: 'Tell apart “I did something that needs to change” from “I as a whole person have not grown”.' },
    },
    {
      id: 'anima',
      name: { zh: '阿尼玛与阿尼姆斯', en: 'Anima and animus' },
      concept: { zh: '阿尼玛指男性心理中的内在女性形象，阿尼姆斯指女性心理中的内在男性形象，二者是意识与无意识之间的中介，常经由对异性的投射被体验。', en: 'The anima is the inner feminine figure in a man’s psyche, the animus the inner masculine figure in a woman’s. They mediate between the conscious and the unconscious, and are often experienced through projection onto the other sex.' },
      source: { zh: '荣格《原型与集体无意识》，CW 9i，§66（阿尼玛是生命本身的原型）；《埃翁》，CW 9ii，§§28–29（阿尼姆斯）', en: 'Jung, “The Archetypes and the Collective Unconscious”, CW 9i, §66 (the anima as the archetype of life itself); Aion, CW 9ii, §§28–29 (the animus)' },
      mine: { zh: '亲密关系对我很重要，我希望在其中被认真对待。', en: 'Intimate relationships matter to me; I hope to be taken seriously in them.' },
      try: { zh: '分清我对关系的期待，哪些来自对方这个人，哪些来自我心里的形象。', en: 'Tell apart which of my expectations of a relationship come from the person in front of me, and which from the image in my own mind.' },
    },
    {
      id: 'self',
      name: { zh: '自性', en: 'The self' },
      concept: { zh: '自性是心理的统摄性中心，是整体性的原型，涵盖意识与无意识的总和；它是个体化的目标，但这一过程贯穿一生，难以完全完成。', en: 'The self is the psyche’s overarching centre and the archetype of wholeness, embracing the sum of conscious and unconscious. It is the goal of individuation, a process that runs through a whole life and can hardly be completed.' },
      source: { zh: '荣格《埃翁》，CW 9ii，§9', en: 'Jung, Aion, CW 9ii, §9' },
      mine: { zh: '我也有不需要证明什么的舒服时刻：雨声、昏暗的灯、音乐，以及作品完成时的满足。', en: 'I also have moments of ease where I have nothing to prove: rain, a dim lamp, music, and the satisfaction of a finished piece.' },
      try: { zh: '给这些舒服的时刻留出固定的位置，让生活不只在追赶目标。', en: 'Give those moments of ease a fixed place, so that life is not only a chase after goals.' },
    },
  ] satisfies HandbookEntry[],
};
