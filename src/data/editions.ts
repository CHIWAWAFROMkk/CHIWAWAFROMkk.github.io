import type { Bi } from '../i18n';

export type EditionId = 'career' | 'campus' | 'quota';
export interface Edition {
  slug: string; page: 'careerLive' | 'campusLive' | 'quotaLive';
  teaser: { kicker: Bi; title: Bi; sub: Bi };
  back: Bi;
  body: { h2: Bi; p: Bi };
}
const KICKER: Bi = { zh: '完整版', en: 'Live edition' };

/** The simple project pages load instantly; each one leads to a full edition where the real program runs. */
export const EDITIONS: Record<EditionId, Edition> = {
  career: {
    slug: 'ai-career', page: 'careerLive',
    teaser: {
      kicker: KICKER,
      title: { zh: '在浏览器里运行真实的匹配引擎 →', en: 'Run the real matching engine in your browser →' },
      sub: { zh: '公开版引擎通过 WebAssembly 在你的浏览器里运行：改职位描述和候选人条件，当场重算，分数和证据画成电路。需要下载十几兆的运行时。', en: 'The public engine runs in your browser through WebAssembly: edit the job description and the candidate, and it recomputes on the spot, drawing the score and the evidence as a circuit. Downloads a runtime of about a dozen megabytes.' },
    },
    back: { zh: '← 回到简易版：个人求职 Agent', en: '← Back to the simple page: Personal Job Agent' },
    body: {
      h2: { zh: '这一页在运行什么', en: 'What runs on this page' },
      p: { zh: '演示区里是公开仓库固定版本的求职引擎，原样复制、逐个文件核对校验值，由 Pyodide 在你的浏览器里运行。输入只在本机计算，不上传。运行时不可用时，演示区会换成同一引擎预先算好的回放。', en: 'The demo runs the job agent engine from a pinned commit of the public repository, copied unchanged and checked file by file, inside your browser through Pyodide. Your input is computed locally and never uploaded. If the runtime cannot start, the demo area shows replays computed by the same engine.' },
    },
  },
  campus: {
    slug: 'ai-campus', page: 'campusLive',
    teaser: {
      kicker: KICKER,
      title: { zh: '运行研究自己的统计程序 →', en: 'Run the study\'s own statistics program →' },
      sub: { zh: '可下载的 analysis.py 原样在浏览器里运行：按问卷填一份、做压力测试、跑单元测试，粒子流水线按程序的真实分支回放。需要下载十来兆的运行时。', en: 'The downloadable analysis.py runs unchanged in your browser: fill in the questionnaire, run a stress test or the unit tests, and watch a particle pipeline replay the program\'s real branches. Downloads a runtime of about ten megabytes.' },
    },
    back: { zh: '← 回到简易版：AI 校园应用研究', en: '← Back to the simple page: AI on Campus' },
    body: {
      h2: { zh: '这一页在运行什么', en: 'What runs on this page' },
      p: { zh: '演示区运行的是研究公开的统计程序和它的测试，与简易版"本地运行"一节提供下载的是同一份文件。构造样本都有标注，不是调查结果；输入只在本机计算，不上传。', en: 'The demo runs the study\'s published statistics program and its tests — the very files offered for download on the simple page. Constructed samples are labelled and are not survey results; your input is computed locally and never uploaded.' },
    },
  },
  quota: {
    slug: 'quota-deck', page: 'quotaLive',
    teaser: {
      kicker: KICKER,
      title: { zh: '看 HUD 怎样提醒你：做完了、等批准 →', en: 'See how the HUD tells you: done, waiting for approval →' },
      sub: { zh: 'QuotaDeck 的真实界面文件原样运行，一分半钟走完一个下午：Agent 做完一轮、请求批准、等待，你随时可以点开卡片、批准或拒绝。只有时钟和数据是模拟的。', en: 'QuotaDeck\'s real interface files run unchanged through an afternoon in a minute and a half: an agent finishes a turn, asks for approval, waits, and you can open a card, allow or deny at any time. Only the clock and the data are simulated.' },
    },
    back: { zh: '← 回到简易版：QuotaDeck', en: '← Back to the simple page: QuotaDeck' },
    body: {
      h2: { zh: '这一页在运行什么', en: 'What runs on this page' },
      p: { zh: '浮条与卡片是公开仓库固定版本的真实界面文件；会话状态和额度换算由 QuotaDeck 自己的代码算出。不读取你的电脑或任何账号，批准与拒绝只改演示状态、不执行任何命令。演示不可用时，下方有桌面版截图。', en: 'The strip and the cards are the real interface files of a pinned commit of the public repository; session states and quota figures are worked out by QuotaDeck\'s own code. Nothing on your computer or in any account is read, and allowing or denying only changes the demo; no command runs. If the demo cannot start, the desktop screenshots below still show the interface.' },
    },
  },
};
