Experience, job requirements and conditions still to confirm are laid side by side, so it is clear why the materials say what they say and what still needs checking.

## What the project solves

It links roles, job descriptions, real experience, tailored materials and application feedback in one local workbench — fewer stray file versions, and a basis for every recommendation and every edit to the materials.

![How evidence enters the materials (diagram in Chinese)](/assets/editorial/career-evidence.svg)

Confirmed facts go into matching and drafts; unverified experience stays on the check list. The final content is always reviewed by the candidate.

### The workflow as built (public release 0.8.5)

1. **Profile and résumé import**: the profile stores each fact's ID, source and confirmation status; with no profile yet, the app first guides you to build one. Reads TXT, Markdown, DOCX and PDF résumés.
2. **Finding and saving roles**: import by hand or connect a search provider (Bocha, Brave); candidates are checked first, then de-duplicated into SQLite. A failed import leaves no half-saved record.
3. **The "Today" workbench**: one role worth pushing forward and one main action at a time, with salary, commute, deadline and the reasons for the recommendation; the other roles fold into a queue. Editing the profile re-scores the matches automatically without touching existing application statuses.
4. **Analysis and materials**: structures the job description, explains the match score, picks confirmed evidence, and drafts a role-specific résumé and application materials.
5. **Human review and application prep**: once the draft is approved, it opens the job page and the dedicated résumé. Browser assistance is still experimental: it stops at the first anomaly, the candidate clicks every button, and the candidate submits.
6. **Feedback and preparation**: log application progress, record notices in a calendar, and manage commute filters, résumé polishing and mock interviews.

## Tools and key decisions

### Python + Pydantic + SQLite

Python runs the workflow, Pydantic validates structure and fact references, and SQLite stores roles and status. pywebview wraps the local web workbench as a Windows desktop window; the desktop release is packaged with PyInstaller, so users need no Python — unzip and double-click.

File parsing uses python-docx and pypdf; document output uses python-docx and ReportLab. Each Windows user's profile, keys and role database live in their own local folder, so passing the release on never carries anyone's data with it.

### Replaceable analysis and search services

The local rules run offline; AI analysis is an optional provider — local Codex, OpenAI or a compatible API. Search and maps are configured separately; without them, manual import and the local baseline still work.

The example on this page calls only the public release's local matching and materials functions — no personal API, search or map service.

## What the example proves

### Fact status really changes the output

The unconfirmed Tableau experience stays out of the match evidence and the materials. Only after the fictional candidate confirms it does its fact ID appear in the materials.

### Hard requirements outrank the overall score

Three days a week fails the job's four-day requirement, so the public release caps the total at 59. If availability is missing it stays unknown — never quietly counted as met.

### Known limits

Even with SQL project evidence, the local rules may still flag "must be proficient in SQL" for a human check: having evidence and being proficient are different questions. The scoring has not been calibrated against real hiring outcomes, and it makes no claim to raise interview rates.

### This is not a full cloud agent

This is an interactive replay of six real function outputs; it cannot take an arbitrary job description and call the desktop program. The full application runs on the candidate's own computer; this page reads no private database and does not mean every external service was verified here.

## How to run it, and the evidence

### See it without installing anything

1. Keep "4 days / not yet confirmed" and look at the SQL evidence and the Tableau gap.
2. Switch to "3 days" and check the failed hard requirement and the 59-point cap.
3. Confirm the example Tableau experience and watch the facts used in the materials go from 1 to 2.
4. Open the draft and the human review checklist, then download the current example.

### Recompute it from the same source

Install Python 3.12/3.13, install the public project's dependencies in an isolated environment, check out the pinned version below and run the export script. The script uses only synthetic test data and never reads .env, a private profile or a role database.

```
git checkout 4397ded9c603e7e26d3dc241eb910ce3ad0a749a
.venv\Scripts\python.exe export-job-agent-demo.py . demo.json
```

- [Download the script](/downloads/export-job-agent-demo.py) · [The six outputs with source hashes](/assets/job-agent-demo.json)
- [Public repository](https://github.com/CHIWAWAFROMkk/personal-job-agent) · [The pinned source version](https://github.com/CHIWAWAFROMkk/personal-job-agent/tree/4397ded9c603e7e26d3dc241eb910ce3ad0a749a) · [Matching logic](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/src/job_agent/services/local_matcher.py) · [Materials logic](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/src/job_agent/services/application_pack.py) · [Privacy boundary](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/PRIVACY.md) · [Changelog](https://github.com/CHIWAWAFROMkk/personal-job-agent/blob/4397ded9c603e7e26d3dc241eb910ce3ad0a749a/CHANGELOG.md)

The public source and the Windows installer may not be the same version; this page follows the pinned source and the results shipped with it.
