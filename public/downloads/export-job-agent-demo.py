"""Generate a public, synthetic replay using the original Job Agent code; no providers or private data."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from datetime import UTC, datetime

sys.dont_write_bytecode = True
parser = argparse.ArgumentParser()
parser.add_argument('repository', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
repo = args.repository.resolve()
sys.path.insert(0, str(repo / 'src'))
sys.path.insert(1, str(repo))
from job_agent.models.profile import ClaimStatus, ContactInfo
from job_agent.models.job_record import JobDetail
from job_agent.models.application import ResumeBundle
from job_agent.services.local_matcher import match_job_locally, structure_job_locally
from job_agent.services.application_pack import build_application_pack
from tests.helpers import sample_profile

JD = '''公司：示例科技（虚构）
岗位：AI运营实习生
地点：上海

岗位职责：
- 负责 AI 产品运营和用户数据分析。
岗位要求：
- 本科及以上学历；
- 每周至少 4 天，连续实习 3 个月；
- 必须熟练使用 SQL；
- Tableau 经验加分。'''
fixed = datetime(2026, 9, 12, tzinfo=UTC)
commit = subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip()
paths = ['src/job_agent/services/local_matcher.py', 'src/job_agent/services/application_pack.py', 'tests/helpers.py']
hashes = {path: hashlib.sha256((repo / path).read_bytes()).hexdigest() for path in paths}
scenarios = []
for days in [4, 3, None]:
    for confirmed in [False, True]:
        profile = sample_profile()
        profile.person.display_name = '示例候选人（虚构）'
        profile.person.contact = ContactInfo()
        profile.updated_at = fixed
        for source in profile.source_documents:
            source.imported_at = fixed
        profile.job_search.availability.days_per_week = days
        if confirmed:
            profile.experiences[0].facts[1].status = ClaimStatus.USER_CONFIRMED
            profile.skills[1].status = ClaimStatus.USER_CONFIRMED
        result = match_job_locally(profile, structure_job_locally(JD))
        result.generated_at = fixed
        job = JobDetail(job_id=1, company=result.job.company, title=result.job.title,
                        location=result.job.location, jd_text=JD, status='saved',
                        created_at=fixed.isoformat(), updated_at=fixed.isoformat(),
                        first_seen_at=fixed.isoformat(), last_seen_at=fixed.isoformat())
        pack = build_application_pack(profile, job, result,
            ResumeBundle(status='needs_generation', note='演示未生成定向简历，需要本人审阅。'), generated_at=fixed)
        assert sum(result.score_breakdown.model_dump().values()) == result.overall_score
        assert any(item.blocks_submission for item in pack.review_checklist)
        if days == 3:
            assert result.overall_score <= 59
        if not confirmed:
            assert all('fact-pending-tableau' not in e.profile_fact_ids for e in result.evidence)
            assert 'fact-pending-tableau' not in [e.fact_id for e in pack.evidence]
        scenarios.append({'id': f'{days or "unknown"}-{int(confirmed)}',
            'days': days, 'tableauConfirmed': confirmed,
            'profile': profile.model_dump(mode='json'),
            'match': result.model_dump(mode='json'),
            'pack': pack.model_dump(mode='json')})
payload = {'title': 'Job Agent synthetic replay', 'sourceCommit': commit,
           'sourceRepository': 'https://github.com/CHIWAWAFROMkk/personal-job-agent',
           'sourceHashes': hashes, 'engine': 'local-baseline', 'fixtureDate': fixed.isoformat(),
           'disclaimer': '虚构岗位与候选人，公开版 Python 引擎真实计算的固定条件回放；不是在线大模型，不会投递。',
           'jd': JD, 'scenarios': scenarios}
serialized = json.dumps(payload, ensure_ascii=False, indent=2)
assert 'private@example.com' not in serialized and '123456' not in serialized
assert 'C:\\' not in serialized and 'D:\\' not in serialized
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(serialized, encoding='utf-8')
print(json.dumps({'sourceCommit': commit, 'scenarios': [
    {'id': s['id'], 'score': s['match']['overall_score'], 'evidence': len(s['pack']['evidence'])}
    for s in scenarios]}, ensure_ascii=False))
