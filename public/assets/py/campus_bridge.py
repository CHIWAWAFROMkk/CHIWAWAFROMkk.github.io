"""Browser bridge for the study's analysis program, loaded unchanged from the files the page offers for download.

analyze_traced() runs analysis.analyze() once as it is, for its time, and once under sys.settrace, counting how often
each line of the exclusion loop (lines 87-97) runs and which branch every row takes; the two results must be equal.
run_tests() runs a unittest module and pushes each test's start and outcome to the page as it happens. constructed()
makes labelled demo rows from fixed seeds; they are never survey data.
"""
import importlib
import json
import random
import sys
import time
import traceback
import unittest
from datetime import date, timedelta

import analysis

FIRST, LAST = 87, 97
BRANCHES = (89, 91, 93, 95, 97)
# kind: seed, ID prefix, clean rows, duplicate-ID pairs, no consent, not eligible, outside the collection window
PLANS = {
    'sample': (36, 'C', 26, 3, 2, 1, 1),
    'stress': (2000, 'S', 1720, 40, 60, 40, 100),
}
SEPTEMBER, AUGUST, OCTOBER = date(2026, 9, 1), date(2026, 8, 1), date(2026, 10, 1)


def analyze_traced(rows_json, start_json, end_json):
    rows, start, end = json.loads(rows_json), json.loads(start_json), json.loads(end_json)
    code = analysis.analyze.__code__
    lines, branches = {}, []

    def on_line(frame, event, arg):
        if event == 'line' and FIRST <= frame.f_lineno <= LAST:
            lines[frame.f_lineno] = lines.get(frame.f_lineno, 0) + 1
            if frame.f_lineno in BRANCHES:
                branches.append(frame.f_lineno)
        return on_line

    def on_call(frame, event, arg):
        return on_line if frame.f_code is code else None

    try:
        started = time.perf_counter()
        plain = analysis.analyze(rows, start, end)
        ms = (time.perf_counter() - started) * 1000
    except ValueError as exc:
        return json.dumps({'error': 'invalid', 'message': str(exc)}, ensure_ascii=False)
    started = time.perf_counter()
    sys.settrace(on_call)
    try:
        result = analysis.analyze(rows, start, end)
    finally:
        sys.settrace(None)
    traced_ms = (time.perf_counter() - started) * 1000
    if result != plain:
        raise RuntimeError('tracing changed the result')
    return json.dumps({'result': result, 'lines': {str(n): c for n, c in sorted(lines.items())}, 'branches': branches,
                       'ms': ms, 'traced_ms': traced_ms}, ensure_ascii=False, allow_nan=False)


def _answer(rng, respondent_id, consent=True, eligible=True, inside=True):
    if inside:
        day = SEPTEMBER + timedelta(days=rng.randrange(30))
    else:
        day = rng.choice((AUGUST + timedelta(days=rng.randrange(31)), OCTOBER + timedelta(days=rng.randrange(15))))
    row = {'respondent_id': respondent_id, 'collected_on': day.isoformat(), 'consent': consent, 'eligible': eligible,
           'used_ai': None, 'frequency': None, 'scenarios': None, 'helpfulness': None, 'verification': None}
    if not (consent and eligible):
        return row  # Q1 or Q2 "no" ends the questionnaire
    row['used_ai'] = rng.choices(('yes', 'no', 'unsure'), (70, 18, 12))[0]
    if row['used_ai'] != 'yes':
        return row  # Q4-Q7 apply only to Q3 "yes"
    row['frequency'] = rng.choices(analysis.FREQUENCIES, (35, 45, 20))[0]
    if rng.random() >= 0.09:
        picked = [s for s, p in zip(analysis.SCENARIOS, (0.78, 0.34, 0.22, 0.41, 0.29, 0.08)) if rng.random() < p]
        row['scenarios'] = picked or ['study']
    if rng.random() >= 0.08:
        row['helpfulness'] = rng.choices((1, 2, 3, 4, 5), (5, 12, 28, 37, 18))[0]
    if rng.random() >= 0.1:
        row['verification'] = rng.choices((1, 2, 3, 4, 5), (6, 18, 34, 28, 14))[0]
    return row


def constructed(kind_json):
    seed, prefix, clean, pairs, no_consent, ineligible, outside = PLANS[json.loads(kind_json)]
    rng, rows, serial = random.Random(seed), [], iter(range(1, 10000))

    def new_id():
        return f'{prefix}-{next(serial):04d}'

    rows += [_answer(rng, new_id()) for _ in range(clean)]
    for _ in range(pairs):
        twin = new_id()
        rows += [_answer(rng, twin), _answer(rng, twin)]
    rows += [_answer(rng, new_id(), consent=False) for _ in range(no_consent)]
    rows += [_answer(rng, new_id(), eligible=False) for _ in range(ineligible)]
    rows += [_answer(rng, new_id(), inside=False) for _ in range(outside)]
    rng.shuffle(rows)
    return json.dumps(rows, ensure_ascii=False)


class _Stream(unittest.TestResult):
    """Pushes each test's start and outcome as it happens. A test's outcome is its first problem, or ok."""

    def __init__(self, emit):
        super().__init__()
        self._emit, self._status, self._message = emit, None, None

    def _note(self, status, err=None):
        if self._status in (None, 'ok'):
            self._status = status
            self._message = None if err is None else ''.join(traceback.format_exception_only(err[0], err[1])).strip()

    def startTest(self, test):
        super().startTest(test)
        self._status, self._message = None, None
        self._emit(json.dumps({'kind': 'start', 'name': test._testMethodName}))

    def stopTest(self, test):
        super().stopTest(test)
        self._emit(json.dumps({'kind': self._status or 'ok', 'name': test._testMethodName, 'message': self._message},
                              ensure_ascii=False))

    def addSuccess(self, test):
        super().addSuccess(test)
        self._note('ok')

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self._note('fail', err)

    def addError(self, test, err):
        super().addError(test, err)
        self._note('error', err)

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self._note('skip')

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err is not None:
            self._note('fail' if issubclass(err[0], test.failureException) else 'error', err)


def run_tests(module_json, emit):
    suite = unittest.defaultTestLoader.loadTestsFromModule(importlib.import_module(json.loads(module_json)))
    result = _Stream(emit)
    started = time.perf_counter()
    suite.run(result)
    ms = (time.perf_counter() - started) * 1000
    return json.dumps({'run': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
                       'ok': result.wasSuccessful(), 'ms': ms})
