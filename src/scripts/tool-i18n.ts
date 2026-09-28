import type { Lang } from '../i18n';

/** [Chinese message or pattern, English text]; patterns may use $1… for captured numbers. */
export type ErrorRule = [string | RegExp, string];

export const CSV_ERRORS: ErrorRule[] = [
  ['文件超过 2 MB，请先拆分数据。', 'The file is over 2 MB — split it first.'],
  ['文件超过 2 MB，请先拆分。原有结果未改变。', 'The file is over 2 MB — split it first. The previous result is unchanged.'],
  ['没有数据。请上传 CSV，或粘贴包含表头的数据。', 'No data. Upload a CSV or paste data with a header row.'],
  ['不支持的分隔符。', 'Unsupported delimiter.'],
  ['最多支持 20,000 行数据。', 'At most 20,000 data rows are supported.'],
  ['引号格式不正确。含分隔符的内容请用双引号包围。', 'Malformed quotes. Wrap values that contain the delimiter in double quotes.'],
  ['存在未闭合的双引号，请检查 CSV。', 'A double quote is never closed — check the CSV.'],
  ['需要表头，且最多支持 100 列。', 'A header row is required, with at most 100 columns.'],
  ['表头不能为空或重复，请修改后再导入。', 'Headers must be non-empty and unique.'],
  ['只有表头，没有数据行。', 'Only a header row — no data rows.'],
  [/^第 (\d+) 条数据记录的列数与表头不一致，请检查分隔符或缺失的逗号。$/, 'Record $1 has a different number of columns from the header — check the delimiter or a missing comma.'],
];

export const DELIVERY_ERRORS: ErrorRule[] = [
  ['份数须为 1–20 的整数', 'Quantity must be a whole number from 1 to 20'],
  ['菜品不存在', 'That dish does not exist'],
  ['订单不存在', 'That order does not exist'],
  ['数据库尚未载入', 'The database has not loaded yet'],
  ['请输入 1–12000 字符的 SQL', 'Enter 1–12,000 characters of SQL'],
  ['一次最多执行 10 条语句', 'At most 10 statements per run'],
  // Raised by triggers in delivery-schema.sql
  ['价格快照不一致', 'The price snapshot does not match the dish price'],
  ['库存不足', 'Not enough stock'],
  ['支付金额与明细不一致', 'The payment does not match the order items'],
  ['仅未送达订单可取消退款', 'Only undelivered orders can be cancelled and refunded'],
  ['退款金额不一致', 'The refund amount does not match the order'],
];

export function localizeError(message: string, lang: Lang, rules: ErrorRule[]): string {
  if (lang === 'zh') return message;
  for (const [pattern, en] of rules) {
    if (typeof pattern === 'string' ? pattern === message : pattern.test(message)) {
      return typeof pattern === 'string' ? en : message.replace(pattern, en);
    }
  }
  return message;
}
