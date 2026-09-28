## Why PDF extraction alone was not enough

The original approach started from the folder. But the file order did not match the Excel roster, and some employees had never uploaded anything. Even after reading every file, you still could not answer "who on the roster has not been handled yet?"

- **Going file by file only shows what exists.** The Nth file is not the Nth employee; if a file is missing, that employee can silently drop out of scope. And an empty value cannot tell you whether something was never uploaded, never filled in, or simply unreadable.
- **Going employee by employee covers the whole roster.** Fix the employee queue first, then look for each person's documents. Whether a file exists, whether identity is confirmed and whether a field is readable are judged separately, and results come out in the roster's original order.

## Corrections made along the way

1. **Visible does not mean in this batch.** After filtering by department, you still have to separate the people whose documents came in with the current batch. A trial run marked visible employees without a PDF as "/"; I flagged the scope error and limited processing to the employees covered by this batch. That split "find every gap" from "fill in this batch": a full check may record that a file is missing, but it may not write into official fields.
2. **A matching file name is not enough — check inside the file.** There were cases where the file name pointed to one person and the name on the certificate said another, and school names that needed a second look. So identity checks inside the file and cross-checks against certificates happen before anything is written. Degree, school and dates must come from one clearly identified education record.
3. **To go faster, read less, not more often.** Scanned PDFs have to be read page by page, and repeatedly locating, reading and saving in Excel adds waiting. I proposed narrowing what is read and handling each employee's documents together. The enterprise design adds a per-version file cache and a persistent queue as a result; write-back still keeps identity confirmation, review and read-back.
4. **Save first, then file away.** A document only counts as filed once the save succeeded and the read-back matched — otherwise a file can be moved while the table was never reliably updated. When extra documents arrive, they go back to the right employee rather than being written in folder order.

## How I made trade-offs

- **Ownership first, extraction volume second.** A name helps find a file but cannot decide on its own whose record it goes into. Same names, conflicting IDs and inconsistent documents go to a person; it is better to leave an exception open than to write someone else's data into the master table.
- **Turn empty values into actionable reasons.** No file means asking for a document; a missing field means asking for that field; a blurred scan means rescanning or reading it by hand. The status decides who acts next.
- **Model output is a candidate, not a write command.** Each extracted value keeps its source page, original text and file version. Existing values are never overwritten; empty fields are written only after HR confirms.

## From first version to enterprise design

| | First version (personal) | Enterprise design |
|---|---|---|
| Tools | OpenClaw calling the DeepSeek and GPT APIs | Microsoft 365: Excel, SharePoint, Power Automate, AI Builder |
| Focus | A first working version for extracting and backfilling record fields | Use company-approved storage, permissions and review; separate recognition, review and write-back |
| Output | Matching rules, four statuses, a review sheet and write-back conditions | Flow steps, table schemas, connectors, error handling and acceptance cases |

The enterprise design has four flows: **create tasks** (read the roster, fix the original order, one queue item per employee) → **match and extract** (employee ID, name, text recognition, identity check, candidates) → **review and write back** (HR confirms field by field; only empty cells are written; read back afterwards) → **summarise and resume** (recover interrupted tasks; output no-file, exception and done lists in the original order).

| File status | How it is decided | What happens |
|---|---|---|
| No file found | Search completed and no unresolved identity candidate remains | Goes on the no-file list; "/" is never used as a status |
| File found · field missing | Identity confirmed and legible, but the document lacks the field | The missing field is recorded |
| File found · unreadable | Ownership confirmed, but the content is blurred or unreadable | Page and problem noted; handed to a person |
| Done | Required fields have evidence; review and read-back complete | Source, reviewer and time recorded |

Files with the same name, duplicate IDs, conflicting versions or unknown ownership are marked "manual review" rather than forced into "no file".

## Limits and next steps

- The enterprise version is a design. Connector policy, service region, data retention, licensing and AI capacity must be set by the company's administrators, and it does not reuse the first version's external API path.
- Excel does not offer the concurrency-safe writes this flow would need, so write-back stays single-channel and sequential. Before a real batch, measure recognition time and review time on a small sample, then size the batches.
- Rollback works cell by cell: only cells written by this batch, and still holding the written value, are restored, so later manual edits are not overwritten by a whole-table backup.
- This public portfolio contains no real employee data; the demo on this page uses fictional records only.

## Download

- [Full design (Markdown, in Chinese)](/downloads/hris/HRIS方案.md): step-by-step setup of the four Power Automate flows, Excel and SharePoint schemas, connector list and acceptance cases.
