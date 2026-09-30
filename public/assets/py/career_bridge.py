"""Browser bridge for the public job-agent engine (vendored unmodified at 4397ded).

Builds the fictional candidate from the visitor's edits, runs the real matcher and application pack, and returns plain
JSON. It wraps _cap_breakdown only to read the raw total and the cap the engine applies; the engine's result is unchanged.
"""
import json
import time
from datetime import UTC, datetime

from job_agent.models.application import ResumeBundle
from job_agent.models.job_record import JobDetail
from job_agent.models.profile import ClaimStatus, ContactInfo, EvidenceFact, Skill
from job_agent.services import local_matcher
from job_agent.services.application_pack import ApplicationPackError, build_application_pack
from tests.helpers import sample_profile

MAX_JD = 20000
MAX_FACT = 200
MAX_ADDED = 20
FIXED = datetime(2026, 9, 12, tzinfo=UTC)
RANK = {ClaimStatus.DOCUMENTED: 2, ClaimStatus.USER_CONFIRMED: 1, ClaimStatus.NEEDS_CONFIRMATION: 0}
EDITABLE = ('user_confirmed', 'needs_confirmation')


def _problem(jd, candidate):
    if not jd.strip():
        return '职位描述不能为空。'
    if len(jd) > MAX_JD:
        return f'职位描述超过 {MAX_JD:,} 字。'
    days = candidate.get('days')
    if days is not None and (type(days) is not int or not 1 <= days <= 7):
        return '每周到岗天数应为 1–7。'
    added = candidate.get('added') or []
    if len(added) > MAX_ADDED:
        return f'新增经历最多 {MAX_ADDED} 条。'
    for item in added:
        statement = str(item.get('statement', '')).strip()
        if not statement:
            return '新增经历不能为空。'
        if len(statement) > MAX_FACT:
            return f'每条经历不超过 {MAX_FACT} 字。'
        if item.get('status') not in EDITABLE:
            return '经历状态只能是已确认或待确认。'
    return None


def build_profile(candidate):
    profile = sample_profile()
    profile.person.display_name = '示例候选人（虚构）'
    profile.person.contact = ContactInfo()
    profile.updated_at = FIXED
    for source in profile.source_documents:
        source.imported_at = FIXED
    profile.job_search.availability.days_per_week = candidate.get('days')
    experience = profile.experiences[0]
    removed = set(candidate.get('removed') or [])
    experience.facts = [f for f in experience.facts if f.id not in removed]
    for fact in experience.facts:
        status = (candidate.get('statuses') or {}).get(fact.id)
        if status in EDITABLE and fact.status != ClaimStatus.DOCUMENTED:
            fact.status = ClaimStatus(status)
    for n, item in enumerate(candidate.get('added') or [], 1):
        skills = [str(s).strip()[:30] for s in item.get('skills', []) if str(s).strip()][:5]
        fact = EvidenceFact(id=f'fact-visitor-{n}', statement=str(item['statement']).strip(), skills=skills, tools=skills,
                            status=ClaimStatus(item['status']))
        experience.facts.append(fact)
        for k, name in enumerate(skills):
            profile.skills.append(Skill(id=f'skill-visitor-{n}-{k}', name=name, evidence_fact_ids=[fact.id], status=fact.status))
    by_id = {f.id: f for f in experience.facts}
    kept = []
    for skill in profile.skills:
        facts = [by_id[i] for i in skill.evidence_fact_ids if i in by_id]
        if facts:
            skill.status = max((f.status for f in facts), key=RANK.get)
            kept.append(skill)
    profile.skills = kept
    return profile


def run(jd_json, candidate_json):
    jd, candidate = json.loads(jd_json), json.loads(candidate_json)
    problem = _problem(jd, candidate)
    if problem:
        return json.dumps({'error': problem}, ensure_ascii=False)
    started = time.perf_counter()
    profile = build_profile(candidate)
    capture = {}
    original = local_matcher._cap_breakdown

    def read_cap(breakdown, cap):
        capture['raw'], capture['cap'] = breakdown.total, cap
        return original(breakdown, cap)

    local_matcher._cap_breakdown = read_cap
    try:
        job = local_matcher.structure_job_locally(jd)
        result = local_matcher.match_job_locally(profile, job)
    finally:
        local_matcher._cap_breakdown = original
    stamp = FIXED.isoformat()
    detail = JobDetail(job_id=1, company=result.job.company, title=result.job.title, location=result.job.location, jd_text=jd,
                       status='saved', created_at=stamp, updated_at=stamp, first_seen_at=stamp, last_seen_at=stamp)
    try:
        pack = build_application_pack(profile, detail, result,
                                      ResumeBundle(status='needs_generation', note='演示未生成定向简历，需要本人审阅。'), generated_at=FIXED)
        pack_error = None
    except ApplicationPackError as error:
        pack, pack_error = None, str(error)
    education = profile.education[0] if profile.education else None
    availability = profile.job_search.availability
    return json.dumps({
        'ms': round((time.perf_counter() - started) * 1000, 1),
        'job': {'company': job.company, 'title': job.title},
        'requirements': [{'text': r.text, 'category': r.category, 'hardGate': r.hard_gate} for r in job.requirements],
        'evidence': [{'skill': e.requirement, 'status': str(e.status), 'factIds': list(e.profile_fact_ids)} for e in result.evidence],
        'gates': [{'requirement': g.requirement, 'status': str(g.status), 'factIds': list(g.profile_fact_ids), 'explanation': g.explanation}
                  for g in result.hard_gates],
        'profile': {
            'education': f'{education.degree} · {education.major}' if education else None,
            'days': availability.days_per_week,
            'months': availability.duration_months,
            'facts': [{'id': f.id, 'statement': f.statement, 'status': str(f.status)} for f in profile.experiences[0].facts],
        },
        'score': result.overall_score,
        'raw': capture.get('raw', result.overall_score),
        'cap': capture.get('cap'),
        'recommendation': str(result.recommendation),
        'pack': {'factIds': [e.fact_id for e in pack.evidence], 'blocks': sum(1 for x in pack.review_checklist if x.blocks_submission)} if pack else None,
        'packError': pack_error,
    }, ensure_ascii=False)
