import type { Bi } from '../i18n';

const b = (zh: string, en: string): Bi => ({ zh, en });

export type ActKey = 'dock' | 'love' | 'betrayal' | 'standoff';
/** A storyboard still in /media/mais-je-taime/; `tag` tells first and end frames apart. */
export interface Frame { file: string; tag?: Bi; note: Bi }
export interface FilmShot { id: string; file: string; title: Bi; made: Bi; clip: Bi; act: ActKey; frames: Frame[]; revision?: string }
export interface Revision { key: string; title: Bi; rule: Bi; drafts: { file: string; note: Bi }[]; final: { file: string; note: Bi } }
export interface Reject { file: string; title: Bi; note: Bi }

const FIRST = b('首帧', 'first frame');
const LAST = b('尾帧', 'end frame');

/** All 23 generated shots in story order. Text from the storyboard page on the live site (origin/main 90cd241). */
export const FILM_SHOTS: readonly FilmShot[] = [
  { id: 'S01', file: 's01', act: 'dock', revision: 's01', title: b('握枪的手', 'The hand on the gun'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('戒指全程在左手无名指，枪口滴水，手先握紧再放松', 'The ring stays on the left ring finger throughout; water drips from the muzzle; the hand tightens, then relaxes'),
    frames: [{ file: 's01', note: b('局部揭示：她的左手握枪，无名指上是对戒', 'Partial reveal: her left hand holds the gun, the ring on her ring finger') }] },
  { id: 'S02', file: 's02', act: 'dock', title: b('警员停步', 'The officers stop'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('三人始终背对镜头，POLICE 字样清楚，走两步后停住', 'All three keep their backs to the camera, POLICE clearly legible; two steps, then they stop'),
    frames: [{ file: 's02', note: b('他人反应：只拍赶到的警员', 'Reaction shot: only the arriving officers') }] },
  { id: 'S03', file: 's03', act: 'dock', revision: 's03', title: b('高空垂直下降', 'Vertical drop from above'), made: b('可灵 · 第 2 次通过', 'Kling · passed on take 2'),
    clip: b('程序逐帧测得全程旋转不超过 0.03°，笔直推近到尾帧', 'Measured frame by frame: rotation never exceeds 0.03°; a straight push to the end frame'),
    frames: [
      { file: 's03', tag: FIRST, note: b('首尾帧驱动，笔直下降到正上方俯视', 'Driven by first and end frames: a straight descent to a top-down view') },
      { file: 's03-end', tag: LAST, note: b('直接从首帧中心裁切放大，保证镜头只推近、不旋转；尾帧与 S04 对齐硬切', 'Cropped and enlarged from the centre of the first frame, so the camera only pushes in and never rotates; it lines up for a hard cut to S04') },
    ] },
  { id: 'S04', file: 's04', act: 'love', title: b('舞池红裙', 'Red dress on the dance floor'), made: b('即梦 · 第 2 次通过', 'Jimeng · passed on take 2'),
    clip: b('改成原地慢摇后，她全程可见；红色只在裙子上', 'Changed to a slow sway on the spot, she stays visible throughout; the red is only on the dress'),
    frames: [{ file: 's04', note: b('视觉匹配剪辑：雨水里的红变成展开的裙摆', 'Match cut: the red in the rain becomes the opening skirt') }] },
  { id: 'S05a', file: 's05a', act: 'love', title: b('隔着人群对视', 'Eyes meet across the crowd'), made: b('即梦 · 第 5 次通过', 'Jimeng · passed on take 5'),
    clip: b('前景客人挡住视线，他探身绕过去继续看她；她全程冷淡平视', 'A guest in the foreground blocks the view; he leans around to keep looking; her gaze stays cool and level'),
    frames: [{ file: 's05a', note: b('前景遮挡', 'Foreground occlusion') }] },
  { id: 'S05b', file: 's05b', act: 'love', title: b('手下的眼神', "The henchman's look"), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('推近，他放低酒杯、眯眼皱眉，从漫不经心变成怀疑', 'Push in: he lowers his glass, narrows his eyes and frowns — idle to suspicious'),
    frames: [{ file: 's05b', note: b('他人反应，为 S11 埋线', 'Reaction shot, setting up S11') }] },
  { id: 'S06', file: 's06', act: 'love', title: b('共撑一把伞', 'Sharing one umbrella'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('伞越倾越偏向她，他整个人露在雨里，她把头靠过去', 'The umbrella tilts further toward her, leaving him in the rain; she leans her head on him'),
    frames: [{ file: 's06', note: b('碎片蒙太奇：伞偏向她', 'Fragment montage: the umbrella leans her way') }] },
  { id: 'S07', file: 's07', act: 'love', revision: 's07', title: b('天台分烟', 'Sharing a cigarette on the roof'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('接烟、吸一口、转头吐烟；原片火光出现后偏暖黄，后期去色', 'Takes it, draws, turns to exhale; the flame warmed the colour, so it was desaturated in post'),
    frames: [{ file: 's07', note: b('碎片蒙太奇', 'Fragment montage') }] },
  { id: 'S08', file: 's08', act: 'love', revision: 's08', title: b('描他的枪疤', 'Tracing his bullet scar'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('指尖描一圈、按一下，最后整只手掌盖住；此时她手上还没有戒指', 'A fingertip circles it, presses once, then her whole palm covers it; no ring on her hand yet'),
    frames: [{ file: 's08', note: b('碎片蒙太奇；此时她手上还没有戒指', 'Fragment montage; no ring on her hand yet') }] },
  { id: 'S09', file: 's09', act: 'love', title: b('戴上对戒', 'Putting on the rings'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('三只手各连袖子、始终两枚戒指；戒指推到指根，他的左手托住她', 'Three hands, each traced to its sleeve, always two rings; the ring slides home as his left hand holds hers'),
    frames: [{ file: 's09', note: b('她无名指上的戒指从这一刻开始出现', 'From this moment the ring is on her finger') }] },
  { id: 'S10', file: 's10', act: 'betrayal', title: b('百叶窗与耳麦', 'Blinds and an earpiece'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('手指按一下耳麦，眼神瞬间变冷，低声说了一句', 'A finger touches the earpiece, her eyes turn cold, a few low words'),
    frames: [{ file: 's10', note: b('卧底身份的显性揭示', 'The open reveal: she is undercover') }] },
  { id: 'S11', file: 's11', act: 'betrayal', title: b('照片甩在桌上', 'Photos thrown on the table'), made: b('即梦 · 第 1 次通过', 'Jimeng · passed on take 1'),
    clip: b('照片推向焦外的他，手下前倾压低，一言不发地盯着对面', 'The photos slide toward him, out of focus; the henchman leans in low and stares without a word'),
    frames: [{ file: 's11', note: b('他人反应：焦外的他', 'Reaction shot: him, out of focus') }] },
  { id: 'S12', file: 's12', act: 'betrayal', title: b('他攥紧的手', 'His clenched fist'), made: b('可灵 · 截取前 2.3 秒', 'Kling · first 2.3 s used'),
    clip: b('手指一根根收拢成拳；后段青筋被夸大成肉瘤，只用前半段', 'Fingers close one by one; later the veins swell into lumps, so only the first part is used'),
    frames: [{ file: 's12', note: b('局部揭示，与 S19 呼应', 'Partial reveal, echoed by S19') }] },
  { id: 'S13', file: 's13', act: 'betrayal', title: b('一颗颗退出子弹', 'Ejecting the bullets one by one'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('桌上的子弹 2→3→4→5 逐颗增加，剪辑时让落桌卡在拍子上', 'The bullets on the table go 2→3→4→5; in the edit each one lands on the beat'),
    frames: [{ file: 's13', note: b('伏笔：子弹落桌卡在拍子上', 'Foreshadowing: the bullets land on the beat') }] },
  { id: 'S14a', file: 's14a', act: 'standoff', title: b('她的眼', 'Her eyes'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('雨水顺着睫毛落下，下眼睑微颤', 'Rain runs off her lashes; her lower lid trembles'),
    frames: [{ file: 's14a', note: b('逐拍推近', 'Pushing in beat by beat') }] },
  { id: 'S14b', file: 's14b', act: 'standoff', title: b('他的眼', 'His eyes'), made: b('可灵 · 截取前 1.3 秒', 'Kling · first 1.3 s used'),
    clip: b('后段笑纹被画成满眼皱纹，只用前半段', 'Later the laugh lines turn into wrinkles everywhere, so only the first part is used'),
    frames: [{ file: 's14b', note: b('右眉断口与右颧骨旧疤是同一道刀伤', 'The break in his right eyebrow and the scar on his right cheekbone are one knife wound') }] },
  { id: 'S14c', file: 's14c', act: 'standoff', revision: 's14c', title: b('扣扳机', 'The trigger'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('食指压下扳机，托枪的左手戴着戒指；枪声在剪辑里加', 'The index finger presses the trigger; the supporting left hand wears the ring; the gunshot is added in the edit'),
    frames: [{ file: 's14c', note: b('右手扣扳机，左手托枪戴戒', 'Right hand on the trigger, ringed left hand under the gun') }] },
  { id: 'S15', file: 's15', act: 'standoff', revision: 's15', title: b('屏息', 'Holding breath'), made: b('可灵 · 截取前 2.2 秒', 'Kling · first 2.2 s used'),
    clip: b('无声地说了三个字，不露牙；后段变成坏笑，不用', 'He silently mouths three words, teeth hidden; later it turns into a smirk, which is cut'),
    frames: [{ file: 's15', note: b('他在笑', 'He is smiling') }] },
  { id: 'S16', file: 's16', act: 'standoff', title: b('枪响，他倒下', 'The shot; he falls'), made: b('即梦 · 第 9 次暂定', 'Jimeng · take 9, provisional'),
    clip: b('可灵 5 次、即梦 3 次后暂定；闪光帧换成白黑帧，干站段加速', 'Provisional after five Kling and three Jimeng takes; the flash became one white and one black frame, and the idle standing was sped up'),
    frames: [{ file: 's16', note: b('音画同步；中弹用白一帧、黑一帧卡枪声', 'Sound and picture in sync: one white and one black frame hit the gunshot') }] },
  { id: 'S17', file: 's17', act: 'standoff', revision: 's17', title: b('她扑过去', 'She rushes to him'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('左手托着他的下巴，戒指在左手无名指；额头贴着额头', 'Her left hand cradles his chin, the ring on her left ring finger; forehead to forehead'),
    frames: [{ file: 's17', note: b('左手托着他的下巴，戒指在左手无名指', 'Her left hand cradles his chin; the ring is on her left ring finger') }] },
  { id: 'S18', file: 's18', act: 'standoff', revision: 's18', title: b('空弹匣', 'The empty magazine'), made: b('可灵 · 第 1 次通过', 'Kling · passed on take 1'),
    clip: b('弹匣全程是空的，她把开口转向自己又看了一遍', 'The magazine is empty throughout; she turns the opening toward herself and looks again'),
    frames: [{ file: 's18', note: b('反转：音乐骤然塌下', 'The reversal: the music suddenly collapses') }] },
  { id: 'S19', file: 's19', act: 'standoff', revision: 's19', title: b('掰开他的手', 'Opening his hand'), made: b('即梦 · 首尾帧', 'Jimeng · first and end frames'),
    clip: b('可灵三次手指都假，重画尾帧成自然微蜷后改用即梦；断指唯一露出的地方', 'Three Kling takes all had fake-looking fingers; with the end frame redrawn to a natural curl it moved to Jimeng; the only place the missing fingertip shows'),
    frames: [
      { file: 's19', tag: FIRST, note: b('首尾帧：手心朝上攥拳，和尾帧同一朝向', 'A palm-up fist, facing the same way as the end frame') },
      { file: 's19-end', tag: LAST, note: b('手心里是他的那枚对戒；断指唯一露出的地方', 'His ring lies in his palm; the only place the missing fingertip shows') },
    ] },
  { id: 'S20', file: 's20', act: 'standoff', revision: 's20', title: b('垂直上升', 'Vertical rise'), made: b('可灵 + 后期', 'Kling + post'),
    clip: b('可灵固定机位只负责雨和涟漪，上升由后期缓动拉远完成，保证不旋转', 'Kling, locked off, provides only the rain and ripples; the rise is an eased pull-out in post, so it never rotates'),
    frames: [{ file: 's20', note: b('与 S03 呼应，血迹压小压暗', 'Echoes S03; the blood made smaller and darker') }] },
];

export const ACTS: readonly { key: ActKey; title: Bi; look: Bi }[] = [
  { key: 'dock', title: b('现在 · 雨夜码头', 'Now · the dock in the rain'), look: b('冷蓝彩色，昏黄路灯；结局先行', 'Cold blue colour under sodium lamps; the ending comes first') },
  { key: 'love', title: b('过去 · 相爱', 'Then · in love'), look: b('黑白，只有舞会红裙保留红色', 'Black and white; only the red dress at the ball keeps its colour') },
  { key: 'betrayal', title: b('过去 · 背叛', 'Then · betrayal'), look: b('黑白，光影更硬', 'Black and white, harder light') },
  { key: 'standoff', title: b('现在 · 对峙与反转', 'Now · standoff and reversal'), look: b('回到冷蓝码头，枪响在 0:44，反转在 0:52', 'Back on the cold blue dock: the shot at 0:44, the reversal at 0:52') },
];

const d = (file: string, zh: string, en: string) => ({ file, note: b(zh, en) });

export const REVISIONS: readonly Revision[] = [
  { key: 's01', title: b('S01 握枪的手', 'S01 The hand on the gun'), rule: b('戒指必须在左手无名指', 'The ring must be on the left ring finger'),
    drafts: [d('draft/s01-a', '握枪的是右手。', 'The right hand holds the gun.')],
    final: d('s01', '水平镜像成左手，戒指随之到左手无名指。', 'Mirrored into a left hand, which takes the ring to the left ring finger.') },
  { key: 's03', title: b('S03 尾帧', 'S03 end frame'), rule: b('首尾帧必须同一机位、同一方向', 'First and end frames need the same camera position and direction'),
    drafts: [
      d('draft/s03e-a', '比首帧转了约 30°，可灵只能边转边变形去凑。', 'Rotated about 30° from the first frame; Kling could only warp while turning to match.'),
      d('draft/s03e-b', '方向对了，地面钢板格子和路灯对不上，视频里地面会漂。', 'Direction right, but the deck plates and lamps did not line up, so the ground would drift.'),
    ],
    final: d('s03-end', '直接从首帧中心裁切放大 2 倍，和首帧像素级一致。', 'Cropped from the centre of the first frame and enlarged 2×, pixel-consistent with it.') },
  { key: 's07', title: b('S07 天台分烟', 'S07 Sharing a cigarette'), rule: b('伤疤跨镜头一致', 'Scars stay consistent across shots'),
    drafts: [d('draft/s07-a', '他露出右脸，却没有右眉断口和颧骨旧疤。', 'His right side shows, but without the broken eyebrow and cheekbone scar.')],
    final: d('s07', '补上同一道刀伤。', 'The same knife wound added.') },
  { key: 's08', title: b('S08 描枪疤', 'S08 Tracing the scar'), rule: b('道具时间线', 'The prop timeline'),
    drafts: [d('draft/s08-a', 'S09 才戴戒指，这里她已经戴上了。', 'She only puts the ring on in S09, but here she already wears it.')],
    final: d('s08', '去掉戒指。', 'Ring removed.') },
  { key: 's14c', title: b('S14c 扣扳机', 'S14c The trigger'), rule: b('动作要真的在做', 'The action must really happen'),
    drafts: [
      d('draft/s14c-a', '食指搭在枪身外侧，没有扣扳机。', 'The index finger rests along the frame, off the trigger.'),
      d('draft/s14c-b', '扣上了，但露出了脸，和 S14a 重复。', 'On the trigger now, but her face shows, repeating S14a.'),
    ],
    final: d('s14c', '只拍手和枪：右手食指压扳机，左手托枪戴戒。', 'Hands and gun only: right index finger on the trigger, ringed left hand under the gun.') },
  { key: 's15', title: b('S15 屏息', 'S15 Holding breath'), rule: b('伤疤要看得见', 'The scar must be visible'),
    drafts: [
      d('draft/s15-a', '右颧骨的旧疤几乎看不见。', 'The scar on the right cheekbone is barely visible.'),
      d('draft/s15-b', '修了一次，还是太淡。', 'Fixed once, still too faint.'),
    ],
    final: d('s15', '右眉断口和颧骨旧疤清楚可见。', 'The broken eyebrow and the cheekbone scar are clearly visible.') },
  { key: 's17', title: b('S17 她扑过去', 'S17 She rushes to him'), rule: b('每只手都要追到它的肩膀', 'Every hand must trace back to its shoulder'),
    drafts: [
      d('draft/s17-a', '他的脸不像标准脸；她胸口那只手粗得像男人的手。', 'His face does not match the reference; the hand on her chest is as thick as a man’s.'),
      d('draft/s17-b', '手改细了，但这只手是从他大衣里伸出来的，接不到她的胳膊。', 'The hand is slimmer, but it comes out of his coat and cannot reach her arm.'),
      d('draft/s17-c', '把胸口的手藏掉，他的两条胳膊也跟着不见了。', 'Hiding the hand on the chest made both of his arms disappear too.'),
      d('draft/s17-d', '构图终于对了，戒指却戴在她的右手上。', 'The composition is finally right, but the ring is on her right hand.'),
    ],
    final: d('s17', '左手托他下巴、戴戒指；右手放在他胸口。', 'Left hand under his chin, wearing the ring; right hand on his chest.') },
  { key: 's18', title: b('S18 空弹匣', 'S18 The empty magazine'), rule: b('看得出是空的，戒指在对的手', 'Visibly empty, ring on the correct hand'),
    drafts: [
      d('draft/s18-a', '戒指戴在中指；只露出弹匣底座，看不出是空的。', 'Ring on the middle finger; only the base of the magazine shows, so it cannot read as empty.'),
      d('draft/s18-b', '开口朝上看得出空了，但她的主观视角里戴戒指的是右手。', 'Opening up and visibly empty — but in her point of view the ring is on the right hand.'),
    ],
    final: d('s18', '左手拿空弹匣、左手无名指戴戒，右手拿枪。', 'Left hand holds the empty magazine, ring on its ring finger; right hand holds the gun.') },
  { key: 's19', title: b('S19 首帧', 'S19 first frame'), rule: b('为视频动作服务', 'Serve the motion in the video'),
    drafts: [
      d('draft/s19-a', '手背朝上，尾帧却是手心朝上，视频得先翻手再掰开，手指容易乱。', 'Back of the hand up while the end frame is palm up: the video would have to turn the hand before opening it, and the fingers fall apart.'),
      d('draft/s19-b', '改成手心朝上，但蜷起的手指多画了一根。', 'Palm up now, but the curled fingers gained one too many.'),
    ],
    final: d('s19', '手心朝上、五根手指，和尾帧同一朝向。', 'Palm up, five fingers, facing the same way as the end frame.') },
  { key: 's20', title: b('S20 垂直上升', 'S20 Vertical rise'), rule: b('平台审核', 'Platform review'),
    drafts: [d('draft/s20-a', '血迹太大太红，视频平台可能不过审。', 'Too much blood, too red: the video platforms might reject it.')],
    final: d('s20', '血迹缩到三分之一，压暗。', 'The blood cut to a third and darkened.') },
];

export const REJECTS: readonly Reject[] = [
  { file: 'fail-s16k2', title: b('S16 · 可灵第 2 次', 'S16 · Kling take 2'), note: b('枪凭空消失、手往前伸、咧嘴大笑，站很久后突然倒下，背景集装箱变橙', 'The gun vanishes, the hand reaches out, a wide grin, a long stand and a sudden fall; the containers behind turn orange') },
  { file: 'fail-s16', title: b('S16 · 可灵第 4 次', 'S16 · Kling take 4'), note: b('提示词堆了一串强动作词：画面飞进子弹、胸口冒火花、嘴张成 O 形', 'A prompt stacked with strong action words: bullets fly into frame, sparks from the chest, mouth in an O') },
  { file: 'fail-s04', title: b('S04 · 即梦第 1 次', 'S04 · Jimeng take 1'), note: b('俯拍转圈时她的身体融进裙摆，画面上只剩他一个人站在红裙中间', 'In the overhead spin her body melts into the skirt, leaving only him standing in a pool of red') },
  { file: 'fail-s05a', title: b('S05a · 即梦第 2 次', 'S05a · Jimeng take 2'), note: b('同时要求横移、视差和前景有人走过，模型从第一帧起重新构图，人和脸全换了', 'Asked for a truck, parallax and a passer-by at once, the model recomposed from the first frame and replaced every person and face') },
  { file: 'fail-s19', title: b('S19 · 可灵第 1 次', 'S19 · Kling take 1'), note: b('要求手指"一根一根"掰开，模型连画五次形变，拳头上长出一圈圈褶子', 'Asked to open the fingers "one by one", the model warped five times over and grew rings of folds on the fist') },
];

export const FILM_TEXT = {
  red: {
    h: b('全片只有一种红。', 'One red in the whole film.'),
    p: b('现在是冷蓝的雨夜码头，过去一律黑白，只有舞会那条红裙是红色。S03 高空俯拍的尾帧硬切到 S04，雨水里的红变成展开的裙摆。', 'The present is a cold blue dock in the rain; the past is all black and white, except the red dress at the ball. S03’s overhead end frame hard-cuts to S04, and the red in the rain becomes the opening skirt.'),
    credit: b('AI 生成首帧 · 剧本、分镜与逐张审图为本人完成', 'First frames generated by AI · script, storyboard and frame-by-frame review by me'),
    alt: b('正上方俯视的舞池，红裙在黑白人群中央展开', 'The dance floor from directly above: a red dress opening amid a black-and-white crowd'),
  },
  rules: {
    h: b('先定规则，再出图', 'Rules first, then pictures'),
    bgm: b('BGM 选用《Mais je t\'aime》，先把人声分轨、剪出 60 秒和 30 秒两版，再按卡点写分镜：人声进入 0:12，枪响 0:44，音乐塌下的反转 0:52。', 'The music is “Mais je t’aime”. I split out the vocals, cut 60- and 30-second versions, then wrote the storyboard to the beats: vocals enter at 0:12, the shot at 0:44, the reversal as the music collapses at 0:52.'),
    items: [
      { h: b('人物设定', 'Characters'), p: b('他：42 岁，蓝眼、棕色卷发，右眉断口与右颧骨旧疤是同一道刀伤，左手小指缺一节（全片只在结尾摊开手心时露出一次），爱笑。她：27 岁，黑长直，眼神冷。', 'He: 42, blue eyes, curly brown hair; the break in his right eyebrow and the scar on his right cheekbone are one knife wound; the tip of his left little finger is missing (seen once, when his palm opens at the end); he smiles easily. She: 27, long straight black hair, cold eyes.') },
      { h: b('道具连续性', 'Prop continuity'), p: b('两枚同款素圈银戒。她戴在左手无名指；S08 时还没有戒指，S09 戴上；他死前摘下，攥在左手手心。', 'Two identical plain silver rings. Hers is on her left ring finger: not yet in S08, on from S09. He takes his off before he dies and holds it in his left palm.') },
      { h: b('审图', 'Review'), p: b('每张首帧都放大核对：每只手顺着袖子追到是谁的哪只手，再看戒指戴在哪根手指、手指数量、伤疤位置和时间线。25 张定稿里有 14 个镜头返修过，最多的 S17 改了 5 版。', 'Every first frame was checked zoomed in: each hand followed up its sleeve to whose hand it is, then which finger wears the ring, how many fingers, where the scars are, and the timeline. Of 25 final frames, 14 shots were revised; S17 took five versions.') },
      { h: b('图生视频', 'Image to video'), p: b('每段生成 5 秒，按剧本时间码截取。提示词按秒写动作，写清每只手、每个道具的去向和被挡住的背景；平台没有负面提示词框，所以只写想要的画面。人物动作即梦明显比可灵听话，后续默认用即梦。AI 视频原生偏慢，剪辑时按每个镜头的时长变速（倍数见剪辑台）；即梦会给黑白画面染上暖色，回忆镜头统一后期去色。', 'Each clip was generated at 5 seconds and trimmed to the script’s timecode. Prompts set out the action second by second — where every hand and prop goes, what background is hidden; the platforms have no negative-prompt box, so they describe only what should be seen. Jimeng followed character action far better than Kling and became the default. AI video runs slow, so each clip was retimed to its slot in the edit (speeds on the edit desk); Jimeng also warmed black-and-white frames, so the flashback was desaturated in post.') },
    ],
  },
  acts: b('四幕分镜', 'The storyboard in four acts'),
  notInCut: b('未用于成片', 'Not in the cut'),
  revisions: {
    h: b('返修记录', 'Revision log'),
    meta: b('废稿 → 定稿，每一版被打回的原因', 'Draft → final, and why each version was sent back'),
    lede: b('AI 出图最常见的错不是画得不好看，而是逻辑不对：手接不到胳膊、戒指戴错手指、道具在时间线上提前出现、首尾帧方向对不上。下面是有代表性的 10 个镜头。', 'The commonest AI image errors are not ugliness but logic: hands that do not reach an arm, a ring on the wrong finger, a prop appearing too early, first and end frames facing different ways. Ten representative shots.'),
  },
  draft: b('废稿', 'Draft'),
  final: b('定稿', 'Final'),
  rejects: { h: b('废片', 'Rejected takes'), meta: b('失败的生成视频', 'Failed generations') },
} as const;

export const DESK = {
  h: b('剪辑台', 'The edit desk'),
  lede: b('成片下面的三条轨道都取自成片和剪辑脚本：画面颜色每 0.1 秒取一次平均色；镜头按剪辑表的真实起止时间排开，块上是变速倍数；音轨是成片声音的峰值。点镜头跳到那一刻，方向键逐镜切换。', 'The three tracks under the film come from the film itself and its edit script: the picture’s average colour every 0.1 s; the shots at their real in and out times from the edit list, each with its speed; the soundtrack’s peaks. Click a shot to jump there; arrow keys step through shots.'),
  caption: b('成片 · 60 秒 · BGM《Mais je t\'aime》，带声音播放', 'The film · 60 s · music: “Mais je t’aime”, plays with sound'),
  tracks: { colour: b('画面颜色', 'Picture'), shots: b('镜头', 'Shots'), sound: b('音轨', 'Sound') },
  beats: { vocal: b('人声', 'Vocals'), shot: b('枪响', 'Gunshot'), turn: b('反转', 'Reversal') },
  black: b('黑场 · 枪声先响', 'Black · the shot is heard first'),
  title: b('片名', 'Title'),
  legend: { gray: b('灰色：剪辑时去色', 'Grey: desaturated in the edit'), dissolve: b('叠化', 'Dissolve'), dip: b('闪黑', 'Dip to black') },
  s02: b('S02 警员停步出片了，但没有用在成片里：S01 延长到 0:07，占了它的位置。', 'S02, The officers stop, was generated but not used: S01 runs on to 0:07 in its place.'),
  viewS02: b('看 S02', 'View S02'),
  card: {
    inCut: b('成片中', 'In the film'), speed: b('变速', 'Speed'), source: b('截取素材', 'Source used'), unit: b(' 秒', ' s'),
    notInCut: b('未用于成片', 'Not in the cut'), prev: b('上一镜', 'Previous shot'), next: b('下一镜', 'Next shot'), revision: b('看这个镜头的返修记录', 'See this shot’s revisions'),
  },
} as const;
