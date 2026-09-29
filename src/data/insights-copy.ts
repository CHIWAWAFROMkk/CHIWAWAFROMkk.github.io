import type { Bi } from '../i18n';

export interface Chapter { q: Bi; a: Bi; note?: Bi; recs?: Bi[] }

/** Copy for the insights page. {key} placeholders are filled from deriveFacts(); no number is ever typed here. */
export const INSIGHTS_COPY = {
  hero: {
    big: { zh: '{orders} 笔订单', en: '{orders} orders' },
    sub: {
      zh: '一个学期 · {weeks} 周 · {students} 名同学 · {merchants} 家商家 · 合成数据',
      en: 'One term · {weeks} weeks · {students} students · {merchants} merchants · synthetic data',
    },
  },
  storyTitle: { zh: '五个经营问题', en: 'Five business questions' },
  chapters: [
    {
      q: { zh: '什么时候最忙？', en: 'When is it busiest?' },
      a: {
        zh: '午餐 {lunchStart}–{lunchEnd} 贡献了 {lunchShare} 的订单，晚餐 {dinnerStart}–{dinnerEnd} 再占 {dinnerShare}。最忙的一格是{busiestDow} {busiestHour}，整个学期累计 {busiestCount} 单。',
        en: 'Lunch, {lunchStart}–{lunchEnd}, brings in {lunchShare} of orders; dinner, {dinnerStart}–{dinnerEnd}, another {dinnerShare}. The busiest cell is {busiestDow} at {busiestHour}: {busiestCount} orders over the term.',
      },
      note: { zh: '口径：订单数按下单时间统计，含已退款订单。', en: 'Definition: orders counted by order time, refunded orders included.' },
    },
    {
      q: { zh: '钱从哪里来？', en: 'Where does the money come from?' },
      a: {
        zh: '{merchants} 家商家里，前三家拿走了 {top3Share} 的净收款；累计到 {paretoLine} 只需要 {merchantsFor80} 家。',
        en: 'Of {merchants} merchants, the top three take {top3Share} of net revenue; {merchantsFor80} are enough to reach {paretoLine}.',
      },
      note: {
        zh: '口径：净收款 = 支付 − 退款；按订单粒度连接支付与退款，避免一对多连接让金额翻倍。',
        en: 'Definition: net revenue = payments − refunds, joined per order so a one-to-many join cannot double the amounts.',
      },
    },
    {
      q: { zh: '学生会回来吗？', en: 'Do students come back?' },
      a: {
        zh: '开学头两周第一次下单的同学，四周后仍有 {freshRetention} 在下单；之后才加入的同学只有 {laterRetention}，相差 {retentionGap} 个百分点。',
        en: 'Of students whose first order came in the first two weeks, {freshRetention} are still ordering four weeks later; for later joiners it is {laterRetention} — a gap of {retentionGap} points.',
      },
      note: {
        zh: '口径：首次下单所在周为一组；之后某周有至少一笔未退款订单，即算该周留存。',
        en: "Definition: a cohort is the week of a student's first order; a student counts as retained in any week with at least one order that was not refunded.",
      },
    },
    {
      q: { zh: '送得够快吗？', en: 'Is delivery fast enough?' },
      a: {
        zh: '{farArea}平均 {farMinutes}送达，比{nearArea}慢 {gapMinutes}；{farArea}有 {farOver45} 的订单超过 {slowLine}，其他宿舍区合计只有 {restOver45}。',
        en: '{farArea}: {farMinutes} on average, {gapMinutes} slower than the {nearArea}. {farOver45} of its orders take over {slowLine}; everywhere else, {restOver45}.',
      },
      note: { zh: '口径：时长 = 送达时间 − 下单时间，只计已送达订单。', en: 'Definition: time = delivered − ordered, delivered orders only.' },
    },
    {
      q: { zh: '为什么退款？', en: 'Why do orders get refunded?' },
      a: {
        zh: '整体退款率 {refundPct}，第一大原因是"{topReason}"，占 {topReasonShare}。高峰时段的取消率是 {peakCancel}，是平时（{calmCancel}）的 {cancelRatio} 倍。',
        en: 'The refund rate is {refundPct}; the top reason, "{topReason}", accounts for {topReasonShare}. At peak hours {peakCancel} of orders are cancelled — {cancelRatio} times the off-peak {calmCancel}.',
      },
      note: {
        zh: '口径：退款率 = 退款订单 ÷ 全部订单；按课程设计的规则，只有未送达的订单可以退款。',
        en: "Definition: refund rate = refunded orders ÷ all orders; under the course project's rules only undelivered orders can be refunded.",
      },
    },
    {
      q: { zh: '如果我是运营', en: 'If I ran operations' },
      a: { zh: '以下是根据前五章提出的建议，是判断，不是数据结论。', en: 'Suggestions drawn from the five chapters — judgments, not findings.' },
      recs: [
        {
          zh: '高峰前备货、排班：午餐和晚餐这四个小时贡献了 {peakShare} 的订单，出餐和骑手都应向这四个小时倾斜。',
          en: 'Stock and staff for the peaks: the four lunch and dinner hours bring in {peakShare} of orders, so kitchens and riders should lean into them.',
        },
        {
          zh: '给{farArea}加派骑手或设自提点：平均 {farMinutes}送达，{farOver45} 的订单超过 {slowLine}，而"{topReason}"正是退款的第一原因。',
          en: 'Add riders or a pickup point for the {farArea}: {farMinutes} on average and {farOver45} of orders over {slowLine} — and "{topReason}" is the top refund reason.',
        },
        {
          zh: '把新生券集中在开学头两周：这段时间加入的同学，四周后的留存高出 {retentionGap} 个百分点。',
          en: 'Spend new-student coupons in the first two weeks: students who join then are {retentionGap} points more likely to still be ordering four weeks on.',
        },
      ],
    },
  ] as Chapter[],
  tables: {
    view: { zh: '查看数据', en: 'Show the data' },
    day: { zh: '星期', en: 'Day' },
    merchant: { zh: '商家', en: 'Merchant' },
    orders: { zh: '订单', en: 'Orders' },
    net: { zh: '净收款', en: 'Net revenue' },
    cohort: { zh: '首单周', en: 'First-order week' },
    area: { zh: '宿舍区', en: 'Dorm area' },
    delivered: { zh: '已送达', en: 'Delivered' },
    avg: { zh: '平均分钟', en: 'Avg minutes' },
    over45: { zh: '超过 45 分钟', en: 'Over 45 min' },
    reason: { zh: '原因', en: 'Reason' },
    refunds: { zh: '退款单', en: 'Refunds' },
  },
};
