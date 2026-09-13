"""Artificial unit-test records only. Not participant data or research evidence."""

import unittest
from analysis import analyze


def record(identifier='TEST_ONLY_A', **changes):
    row = dict(respondent_id=identifier, collected_on='2026-09-12', consent=True,
               eligible=True, used_ai='yes', frequency='1_3', scenarios=['study', 'daily'],
               helpfulness=4, verification=5)
    row.update(changes)
    return row


def run(rows):
    return analyze(rows, '2026-09-01', '2026-09-30')


class AnalysisTests(unittest.TestCase):
    def test_empty_is_missing_not_zero(self):
        result = run([])
        self.assertIsNone(result['usage']['yes_share'])
        self.assertIsNone(result['helpfulness']['median'])
        self.assertEqual(result['status'], '没有可分析记录')

    def test_distinct_denominators_and_missing(self):
        rows = [record(), record('TEST_ONLY_B', scenarios=None, helpfulness=None),
                record('TEST_ONLY_C', used_ai='no', frequency=None, scenarios=None,
                       helpfulness=None, verification=None)]
        result = run(rows)
        self.assertEqual(result['usage']['yes_share'], 2 / 3)
        self.assertEqual(result['scenarios']['answered_n'], 1)
        self.assertEqual(result['scenarios']['items']['daily']['share'], 1)
        self.assertEqual(result['helpfulness']['missing_n'], 1)
        self.assertEqual(result['helpfulness']['median'], 4)

    def test_duplicate_ids_all_excluded(self):
        result = run([record(), record(helpfulness=1)])
        self.assertEqual(result['excluded']['duplicate_id'], 2)
        self.assertEqual(result['duplicate_id_groups'], 1)
        self.assertEqual(result['included_n'], 0)

    def test_exclusion_accounting(self):
        result = run([record(), record('B', consent=False), record('C', eligible=False),
                      record('D', collected_on='2024-04-01')])
        self.assertEqual(result['included_n'], 1)
        self.assertEqual(sum(result['excluded'].values()), 3)
        self.assertEqual(result['input_n'], result['included_n'] + sum(result['excluded'].values()))

    def test_invalid_values_fail(self):
        for changes in ({'helpfulness': True}, {'verification': 6}, {'scenarios': ['bad']},
                        {'scenarios': []}, {'scenarios': ['study', 'study']},
                        {'collected_on': '20260912'}, {'used_ai': 'no'},
                        {'frequency': None}, {'respondent_id': ' X '}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                run([record(**changes)])

    def test_unknown_private_field_rejected_without_echo(self):
        row = record()
        row['private_field'] = 'DO_NOT_PRINT'
        with self.assertRaises(ValueError) as caught:
            run([row])
        self.assertNotIn('DO_NOT_PRINT', str(caught.exception))

    def test_uncertain_not_used(self):
        result = run([record(used_ai='unsure', frequency=None, scenarios=None,
                             helpfulness=None, verification=None)])
        self.assertEqual(result['usage']['counts']['unsure'], 1)
        self.assertEqual(result['helpfulness']['answered_n'], 0)

    def test_period_inclusive(self):
        result = run([record(collected_on='2026-09-01'), record('B', collected_on='2026-09-30')])
        self.assertEqual(result['included_n'], 2)

    def test_reversed_window_rejected(self):
        with self.assertRaises(ValueError):
            analyze([], '2026-09-30', '2026-09-01')

    def test_even_median(self):
        result = run([record(helpfulness=2), record('B', helpfulness=5)])
        self.assertEqual(result['helpfulness']['median'], 3.5)


if __name__ == '__main__':
    unittest.main()
