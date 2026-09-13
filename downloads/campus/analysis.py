"""2026 reconstruction utility; no historical survey data is bundled."""

import argparse
from collections import Counter
from datetime import date
import hashlib
import json
from pathlib import Path
from statistics import median


FIELDS = {
    'respondent_id', 'collected_on', 'consent', 'eligible', 'used_ai',
    'frequency', 'scenarios', 'helpfulness', 'verification',
}
SCENARIOS = ('study', 'campus', 'club', 'daily', 'career', 'other')
FREQUENCIES = ('1_3', '4_15', '16_30')


def parse_date(value):
    if not isinstance(value, str):
        raise ValueError('日期必须是 YYYY-MM-DD 字符串')
    parsed = date.fromisoformat(value)
    if parsed.isoformat() != value:
        raise ValueError('日期必须使用 YYYY-MM-DD 格式')
    return parsed


def validate(row, number):
    # Error messages never reproduce record contents or direct identifiers.
    prefix = f'第 {number} 条记录：'
    if not isinstance(row, dict) or set(row) != FIELDS:
        raise ValueError(prefix + '字段缺失或包含未许可字段，请核对数据字典')
    if not isinstance(row['respondent_id'], str) or not row['respondent_id'].strip():
        raise ValueError(prefix + '匿名 ID 不能为空')
    if row['respondent_id'] != row['respondent_id'].strip():
        raise ValueError(prefix + '匿名 ID 不应有首尾空格')
    try:
        parse_date(row['collected_on'])
    except ValueError:
        raise ValueError(prefix + '采集日期格式错误') from None
    if type(row['consent']) is not bool or type(row['eligible']) is not bool:
        raise ValueError(prefix + 'consent 和 eligible 必须是布尔值')
    if not row['consent'] or not row['eligible']:
        return
    if row['used_ai'] not in ('yes', 'no', 'unsure'):
        raise ValueError(prefix + 'used_ai 必须为 yes/no/unsure')
    if row['used_ai'] != 'yes':
        if any(row[key] is not None for key in ('frequency', 'scenarios', 'helpfulness', 'verification')):
            raise ValueError(prefix + '非明确使用者的跳转题必须为 null')
        return
    if row['frequency'] not in FREQUENCIES:
        raise ValueError(prefix + '使用频率无效')
    values = row['scenarios']
    if values is not None:
        if not isinstance(values, list) or not values or any(v not in SCENARIOS for v in values):
            raise ValueError(prefix + '场景必须是合法的非空数组，未答用 null')
        if len(set(values)) != len(values):
            raise ValueError(prefix + '场景不能重复')
    for key in ('helpfulness', 'verification'):
        value = row[key]
        if value is not None and (type(value) is not int or not 1 <= value <= 5):
            raise ValueError(prefix + key + ' 必须为 1–5 整数或 null')


def rating(rows, key):
    values = [r[key] for r in rows if r[key] is not None]
    counts = Counter(values)
    return {
        'answered_n': len(values), 'missing_n': len(rows) - len(values),
        'distribution': {str(v): counts[v] for v in range(1, 6)},
        'median': median(values) if values else None,
    }


def analyze(rows, period_start, period_end):
    start, end = parse_date(period_start), parse_date(period_end)
    if start > end:
        raise ValueError('开始日期不能晚于结束日期')
    if not isinstance(rows, list):
        raise ValueError('输入必须为 JSON 数组')
    for number, row in enumerate(rows, 1):
        validate(row, number)
    counts = Counter(r['respondent_id'] for r in rows)
    excluded = dict.fromkeys(('duplicate_id', 'no_consent', 'ineligible', 'outside_period'), 0)
    included = []
    for row in rows:
        if counts[row['respondent_id']] > 1:
            excluded['duplicate_id'] += 1
        elif not row['consent']:
            excluded['no_consent'] += 1
        elif not row['eligible']:
            excluded['ineligible'] += 1
        elif not start <= parse_date(row['collected_on']) <= end:
            excluded['outside_period'] += 1
        else:
            included.append(row)
    users = [r for r in included if r['used_ai'] == 'yes']
    answered = [r for r in users if r['scenarios'] is not None]
    scene_counts = Counter(s for r in answered for s in r['scenarios'])
    denominator = len(answered)
    return {
        'status': '可分析匿名输入；真实性需另行核验' if included else '没有可分析记录',
        'scope': '本次输入的实际采集窗口；不是恢复的 2024 年原始结果',
        'period_start': period_start, 'period_end': period_end,
        'input_n': len(rows), 'included_n': len(included),
        'excluded': excluded,
        'duplicate_id_groups': sum(n > 1 for n in counts.values()),
        'usage': {
            'counts': {key: sum(r['used_ai'] == key for r in included) for key in ('yes', 'no', 'unsure')},
            'denominator_n': len(included),
            'yes_share': len(users) / len(included) if included else None,
        },
        'scenarios': {
            'answered_n': denominator, 'missing_n': len(users) - denominator,
            'items': {key: {'n': scene_counts[key], 'share': scene_counts[key] / denominator if denominator else None} for key in SCENARIOS},
        },
        'helpfulness': rating(users, 'helpfulness'),
        'verification': rating(users, 'verification'),
        'frequency_groups': {
            key: {'n': sum(r['frequency'] == key for r in users),
                  'helpfulness': rating([r for r in users if r['frequency'] == key], 'helpfulness')}
            for key in FREQUENCIES
        },
        'limitations': ['便利样本不能直接推断全校或社会总体', '自报体验不等于客观效率或因果效果', '小样本分组公开前须审查再识别风险'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--period-start', required=True)
    parser.add_argument('--period-end', required=True)
    args = parser.parse_args()
    try:
        raw = args.input.read_bytes()
        rows = json.loads(raw.decode('utf-8-sig'))
        result = analyze(rows, args.period_start, args.period_end)
        result['input_sha256'] = hashlib.sha256(raw).hexdigest()
    except (OSError, UnicodeError):
        parser.exit(2, '无法读取输入，请检查路径、权限及 UTF-8 编码。\n')
    except json.JSONDecodeError:
        parser.exit(2, '输入不是有效 JSON。\n')
    except ValueError as exc:
        parser.exit(2, str(exc) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))


if __name__ == '__main__':
    main()
