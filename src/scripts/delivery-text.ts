import type { Lang } from '../i18n';

export interface DeliveryText {
  idle: string; loading: string; running: string; loadTimeout: string; runTimeout: string; engineError: string;
  stopped: string; busy: string; reload: string; noSqlFile: string;
  rows: (n: number, ms: number, truncated: boolean) => string;
  status: Record<'paid' | 'delivered' | 'refunded', string>;
  dishOption: (merchant: string, name: string, yuan: string, stock: number) => string;
  student: (n: string) => string;
  total: (yuan: string) => string; totalInvalid: string;
  placed: (id: number) => string; placeFailed: (msg: string) => string;
  refunded: (id: number) => string; refundButton: string; reset: string;
  orderLine: (id: number, merchant: string, yuan: string) => string;
}

export const DELIVERY_TEXT: Record<Lang, DeliveryText> = {
  zh: {
    idle: '滚动到这里时载入 SQLite（约 700 KB）。',
    loading: '正在载入 SQLite…', running: '正在执行 SQL…',
    loadTimeout: '数据库加载超时，请刷新重试。', runTimeout: '运行已停止：超过 3 秒限制。',
    engineError: '运行引擎出错，已保留上次成功提交的数据。', stopped: '已停止运行。',
    busy: '请等待当前操作完成', reload: ' 请刷新页面重试。', noSqlFile: '请下载建表与数据 SQL。',
    rows: (n, ms, t) => `${n} 行 · ${ms} ms${t ? ' · 已截取前 500 行' : ''}${n === 0 ? ' · 查询成功，无匹配记录' : ''}`,
    status: { paid: '已支付 · 未送达', delivered: '已送达', refunded: '已退款' },
    dishOption: (m, name, y, s) => `${m} / ${name} · ¥${y} · 库存 ${s}`,
    student: n => `同学 ${n}`,
    total: y => `订单金额 ¥${y}`, totalInvalid: '请输入 1–20 份',
    placed: id => `订单 #${id} 已提交；明细、支付、配送记录及库存同步更新。`, placeFailed: m => `下单未提交：${m}`,
    refunded: id => `订单 #${id} 已全额退款，库存已恢复。`, refundButton: '取消退款', reset: '已恢复初始演示订单。',
    orderLine: (id, m, y) => `#${id} ${m} · ¥${y}`,
  },
  en: {
    idle: 'SQLite (about 700 KB) loads when you scroll here.',
    loading: 'Loading SQLite…', running: 'Running SQL…',
    loadTimeout: 'The database took too long to load — please refresh.', runTimeout: 'Stopped: the 3-second limit was reached.',
    engineError: 'The engine failed; the last committed data is kept.', stopped: 'Stopped.',
    busy: 'Please wait for the current operation to finish', reload: ' Please refresh the page.', noSqlFile: 'Download the schema and data SQL instead.',
    rows: (n, ms, t) => `${n} ${n === 1 ? 'row' : 'rows'} · ${ms} ms${t ? ' · first 500 rows shown' : ''}${n === 0 ? ' · query succeeded, no matching records' : ''}`,
    status: { paid: 'paid · not delivered', delivered: 'delivered', refunded: 'refunded' },
    dishOption: (m, name, y, s) => `${m} / ${name} · ¥${y} · stock ${s}`,
    student: n => `同学 ${n}`,
    total: y => `Order total ¥${y}`, totalInvalid: 'Enter 1–20 portions',
    placed: id => `Order #${id} placed; items, payment, delivery and stock updated together.`, placeFailed: m => `Order not placed: ${m}`,
    refunded: id => `Order #${id} refunded in full; stock restored.`, refundButton: 'Cancel & refund', reset: 'Initial demo orders restored.',
    orderLine: (id, m, y) => `#${id} ${m} · ¥${y}`,
  },
};
