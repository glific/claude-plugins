---
name: glific-monthly-review
description: >
  Creates the Glific Monthly Review slide deck (.pptx) for a given month.
  Use this skill whenever the user asks to create, generate, build, or prepare
  a Glific monthly review, monthly deck, monthly slides, or monthly report -
  even if they just say "make the deck for March" or "generate last month's review".
  The skill pulls live data from Google Sheets (KPIs, CS consulting, Biz Dev)
  and GitHub, then generates a fully formatted 6-slide PPTX (title + 5 content slides).
  Trigger whenever the user mentions: Glific deck, monthly review, monthly slides,
  Glific report, or any combination of Glific + a month name.
---

# Glific Monthly Review Skill

Generates the Glific Monthly Review deck (title slide + 5 content slides) for any given
month, pulling live data from Google Sheets, the Glific blog, and GitHub.

## Slide Structure

| # | Title | Left Panel | Right Panel |
|---|-------|------------|-------------|
| T | Title slide | - | "Glific Monthly Review / [Month Year]" |
| 1 | Glific Overall Update | Goal KPIs | Monthly Updates (0-3 bullets synthesised from other slides) |
| 2 | Biz Dev & Marketing | Biz Dev KPIs (no churn) | Monthly Updates + Next Month |
| 3 | Customer Success - Consulting | CS KPIs incl. Churn | Monthly Updates only (no Next Month) |
| 4 | Customer Success - Support | CS Support KPIs | Documentation Updates |
| 5 | Platform | Platform KPIs | Monthly Updates + Next Month (Epic-level, not tickets) |

## Data Sources Quick Reference

| Slide | Source | File ID / URL |
|-------|--------|---------------|
| All KPIs (left panels) | KPI Tracker sheet | `1qMr_lDsn00CYp9-iHsT5-7Jr-ZRek2p4RBSJdlJUveQ` gid=1733984597 |
| Slide 2 KPIs - new bots, onboardings | Biz Dev / Sales Tracker | `1vRH8T_1FPWec9nyhzILYBgypjEoATaugsIcnKlN18jU` |
| Slide 2 right - this month bullets | Glific Sales 2026-27 (current quarter tab) | `1JwTCsh5r_DhQlTj4EAxxkSNN2V6SqfVNoizqRc20B0E` |
| Slide 2 right - next month bullets | Glific Sales 2026-27 (next quarter tab) | same file |
| Slide 3 right | CS/Product Tracker sheet | `1hNk_495eGBlBrlLSm4mGDpYRqsIj1aKAM7OuYFULMQk` gid=625816466 |
| Slide 4 KPI - Incidents count + dates | Google Drive folder | `https://drive.google.com/drive/folders/1OKOHucGLae9FMFbifHLZveCHlKer_trv` |
| Slide 4 right | GitHub Docs PRs | `https://github.com/glific/docs/pulls` |
| Slide 5 right (updates) - PRIMARY | Glific blog post | `https://glific.org/{month-slug}-{year}-bug-fixes-enhancements-documentation-updates/` |
| Slide 5 right (updates) - gap-fill | GitHub backend + frontend PRs | `github.com/glific/glific/pulls` + `github.com/glific/glific-frontend/pulls` |
| Slide 5 right (next month) | GitHub Project Board - Roadmap view | `https://github.com/orgs/glific/projects/8/views/16` |

Read `references/data-sources.md` for exact column names and extraction details.

---

## Step-by-Step Workflow

### Step 0 - Parse the month

Extract **month name** (e.g. "May") and **year** (e.g. "2026") from the user's request.
If the year is omitted, infer from today's date. The target month is usually the *previous*
calendar month - confirm if ambiguous.

Determine:
- **target_month**: the month being reported on (e.g. "May")
- **next_month**: the following calendar month (e.g. "June")
- **current_quarter_tab**: the sheet tab name covering that month
  - Apr-Jun 2026 -> "Quarter 1 (April to June 2026)"
  - Jul-Sep 2026 -> "Quarter 2 (July to Sept 2026)"
  - Oct-Dec 2026 -> "Quarter 3 ..." (and so on)
- **next_quarter_tab**: the tab one quarter ahead

### Step 1 - Set up working directory

```bash
mkdir -p /tmp/glific-deck-work
cd /tmp/glific-deck-work
[ -d node_modules/pptxgenjs ] || (npm init -y && npm install pptxgenjs)
```

### Step 2 - Gather all data

Read `references/data-sources.md` before starting for exact column names and row labels.

#### 2a. KPI Tracker - all left-panel KPIs (Slides 1-5)
- Tool: `mcp__4f39b92b-af20-4540-a74e-39576272b2ba__read_file_content`
- fileId: `1qMr_lDsn00CYp9-iHsT5-7Jr-ZRek2p4RBSJdlJUveQ`
- Find the column whose header matches the target month name (case-insensitive)
- Extract values for every KPI listed in data-sources.md sections 1-5
- Churn rate actual goes to `csConsulting.kpis[Churn (Month)]` (not bizdev)

#### 2b. Biz Dev / Sales Tracker - new bots, pipeline (Slide 2 KPIs)

fileId: `1vRH8T_1FPWec9nyhzILYBgypjEoATaugsIcnKlN18jU`

This file is large (230K+ chars) and will auto-save to a temp file on read. Use bash to parse:

```bash
python3 -c "
import json
path = '/path/from/error/message.txt'
with open(path) as f: data = json.loads(f.read())
content = data['fileContent']
lines = [l for l in content.split('\n') if any(k in l.lower() for k in
    ['onboard','trial','mql','sql','mdql','new bot','converted','handed over',
     'active','suspended','may','june','launchpad','regular saas','quarterly','annual','monthly'])]
print('\n'.join(lines[:300]))
"
```

**What to extract:**

From the **"Annual Onboardings (April 26 to March 27)"** tab:
- Find rows where the Month column = target month
- Extract: org names, subscription type (M/Q/A), onboarding route (Launchpad / Regular SaaS), status
- Count = `bizdev.kpis[New Bots (Month)]`; running YTD total = `bizdev.kpis[New Bots YTD]`
- Do NOT extract churn here - churn belongs on Slide 3 (CS Consulting)

From the **"Trial Accounts Leads"** tab:
- Find rows whose Date column falls in the target month (e.g. "1st May", "9th May", etc.)
- Count by Lead Status: MQL, SQL, MDQL
- Extract org names for SQLs (most progressed leads)
- `bizdev.kpis[MQLs]`, `bizdev.kpis[SQLs]`

#### 2b2. Glific Sales 2026-27 - Biz Dev narrative (Slide 2 right panel)

fileId: `1JwTCsh5r_DhQlTj4EAxxkSNN2V6SqfVNoizqRc20B0E`
Tool: `mcp__4f39b92b-af20-4540-a74e-39576272b2ba__read_file_content`

This file is small (~10KB) and should return in full.

Read the **current quarter tab** (e.g. "Quarter 1 (April to June 2026)" for Apr-Jun months).
Each row has: Area, Initiative, Description, Owner, Priority, Deadline, Key monthly milestone,
KPI/Success Metric, Status.

**For "This Month" bullets** (`bizdev.thisMonth`):
- Filter rows where Status = "Closed" or "In-progress"
- For Closed: note what completed this month (use Key monthly milestone + description)
- For In-progress: note what is actively happening
- Organise into 2-4 bullets covering Acquisition, Marketing, and Process initiatives
- Also include concrete onboarding facts from step 2b (e.g. "3 new bots onboarded",
  "Launchpad cohort ran", "win-back campaign launched")

**For "Next Month" bullets** (`bizdev.nextMonth`):
- From the current quarter tab: filter rows where Status = "To Do" - these are coming up
- From the **next quarter tab**: look at P0/P1 initiatives marked for the next month
- Write 2-3 bullets: what campaigns, webinars, or acquisition initiatives are planned

**Tab name logic:**
- Month in Apr/May/Jun -> current tab = "Quarter 1 (April to June 2026)"
  next tab = "Quarter 2 (July to Sept 2026)"
- Month in Jul/Aug/Sep -> current tab = "Quarter 2 (July to Sept 2026)"
  next tab = next quarter tab if it exists

#### 2c. CS/Product Tracker - Slide 3 right panel (Monthly Updates ONLY)

- Tool: `mcp__4f39b92b-af20-4540-a74e-39576272b2ba__read_file_content`
- fileId: `1hNk_495eGBlBrlLSm4mGDpYRqsIj1aKAM7OuYFULMQk`
- Find the target month column and extract per-org updates (org name and key work)
- Format as: **"OrgName: brief description of work"** - do NOT include hours
- Slide 3 has no "Next Month" section - do not extract or generate next month content
- Save as `csConsulting.thisMonth` only

#### 2d. Incidents - Slide 4 left panel (count + named list)

- Use `mcp__4f39b92b-af20-4540-a74e-39576272b2ba__search_files` with query:
  `parentId = '1OKOHucGLae9FMFbifHLZveCHlKer_trv'`
- For each document, extract the **date from the file title** (not createdTime).
  File titles follow the pattern `YYYYMMDD-Description`, e.g. `20260511-TTS Failures`.
  Parse the leading 8 digits: YYYY=year, MM=month, DD=day.
- Exclude: the blank template doc ("Template" in title) and any .xlsx error-log files
- Count documents whose **title date** (YYYYMMDD prefix) falls in the target month (YYYY-MM)
  -> `csSupport.kpis[# of Incidents]`
- List each incident as: `"Description — [Month Day]"` using the date from the title
  e.g. `20260511-TTS Failures` -> `"TTS Failures — May 11"`
  -> `csSupport.incidents` (used for the bullet list in the left panel)

Note: A document may be *created* in the target month but have an earlier title date
(e.g. an April incident reported late). Use the title date for both the count and the display.

#### 2e. GitHub Docs PRs - Slide 4 right panel
- Use Claude in Chrome (web_fetch returns empty for GitHub)
- Navigate to:
  `https://github.com/glific/docs/pulls?q=is%3Apr+is%3Amerged+merged%3AYYYY-MM-01..YYYY-MM-31`
  (substitute actual year/month, e.g. 2026-05-01..2026-05-31)
- Extract PR titles; write 2-4 bullets clubbing related changes -> `csSupport.docUpdates`

#### 2f. Glific Blog Post - Slide 5 Monthly Updates (PRIMARY source)

The Glific team publishes a monthly release blog that groups all platform changes into
plain, user-facing themes. Always start here for Slide 5.

Construct the URL:
  `https://glific.org/{month-lower}-{year}-bug-fixes-enhancements-documentation-updates/`
  e.g. May 2026 -> `https://glific.org/may-2026-bug-fixes-enhancements-documentation-updates/`

- Try `mcp__workspace__web_fetch` first; if it returns a JS-only shell (no article body),
  fall back to Claude in Chrome (navigate + get_page_text)
- Extract "Bugs Fixed", "Enhancements Done", and "Documentation Update" sections
- Condense into 3-5 theme-level bullets (not one bullet per sub-point)
- Save as `platformOps.monthlyUpdates`

If the blog returns 404: post not yet published. Fall back to step 2g for all content.

#### 2g. GitHub Backend + Frontend PRs - Slide 5 Monthly Updates (GAP-FILL only)

Only fetch GitHub PRs if the blog returned 404 or is missing a significant feature.

Use Claude in Chrome:
- `https://github.com/glific/glific/pulls?q=is%3Apr+is%3Amerged+merged%3AYYYY-MM-01..YYYY-MM-31`
- `https://github.com/glific/glific-frontend/pulls?q=is%3Apr+is%3Amerged+merged%3AYYYY-MM-01..YYYY-MM-31`

Write bullets only for themes NOT already covered by the blog. Keep total to 3-5 bullets.

#### 2h. GitHub Project Board - Slide 5 Next Month (ROADMAP EPICS, not individual tickets)

Slide 5 next month content must be presented at the **Epic level** (roadmap view), not as
individual tickets. Individual ticket details are used only to add specifics to each Epic bullet.

**Step 1 - Get active Epics from the Roadmap view:**
- Use Claude in Chrome; navigate to `https://github.com/orgs/glific/projects/8/views/16`
  (Roadmap view - shows Epics on a timeline)
- Identify Epics whose timeline bar extends into or starts in next_month
- Note each Epic's title and issue number

**Step 2 - Get sprint details from the Weekly plan:**
- Navigate to the "Weekly plan" tab (views/8)
- The current sprint shows individual tickets grouped by Epic
- For each active Epic, note the P0/P1 tickets currently In Progress or To Do
- Use these ticket titles to understand *what specifically* is happening within the Epic

**Step 3 - Write Epic-level bullets for `platformOps.nextMonth`:**
- One bullet per relevant Epic (3-5 bullets total)
- Format: `"[Epic Name]: <what the epic delivers> — <1-2 specific things from the sprint tickets>"`
- Keep it outcome-focused, not ticket-list style
- Example: "[Multi-phone WA Groups]: Building full multi-phone architecture — non-destructive
  contact sync, inbound phone lookup, and Maytapi sender with failover (Phases 2-4 in sprint)"

### Step 3 - Compile deck_data.json

Create `/tmp/glific-deck-work/deck_data.json`. Use `null` for missing values (renders as "-").
Set `"highlight": true` on the most important KPI per section.

```json
{
  "month": "May",
  "year": "2026",
  "overall": {
    "kpis": [
      { "label": "Sustainability YTD",           "value": null },
      { "label": "Total Revenue YTD",            "value": null },
      { "label": "Total Expense YTD",            "value": null },
      { "label": "Total Active Bots YTD",        "value": null },
      { "label": "Total Active Contacts YTD",    "value": null, "highlight": true },
      { "label": "Total Messages Exchanged YTD", "value": null },
      { "label": "Grants Applied to YTD",        "value": null }
    ],
    "updates": [
      "0-3 bullets: most impactful highlights synthesised from slides 2-5"
    ]
  },
  "bizdev": {
    "kpis": [
      { "label": "SaaS Revenue (Month)",   "value": null },
      { "label": "New Bots (Month)",        "value": null, "highlight": true },
      { "label": "New Bots YTD",            "value": null },
      { "label": "MQLs",                    "value": null },
      { "label": "SQLs",                    "value": null }
    ],
    "thisMonth": [
      "Acquisition/onboarding bullet from step 2b + 2b2 Closed/In-progress initiatives",
      "Marketing activity bullet (webinar, campaign) from step 2b2",
      "Pipeline/sales activity bullet from trial leads data"
    ],
    "nextMonth": [
      "Upcoming initiative from Sales 2026-27 To Do items or next quarter tab"
    ]
  },
  "csConsulting": {
    "kpis": [
      { "label": "Consulting Revenue (Month)", "value": null, "highlight": true },
      { "label": "Consulting Revenue YTD",     "value": null },
      { "label": "Churn (Month)",              "value": null },
      { "label": "Consulting Org Names",       "value": null }
    ],
    "thisMonth": [
      "OrgA: brief description of work (no hours)",
      "OrgB: brief description of work (no hours)"
    ]
  },
  "csSupport": {
    "kpis": [
      { "label": "# of P0 Issues",     "value": "0" },
      { "label": "P0 Resolution Time",  "value": null },
      { "label": "# of P1 Issues",     "value": null },
      { "label": "P1 Resolution Time",  "value": null },
      { "label": "# of Incidents",     "value": null,
        "labelHyperlink": "https://drive.google.com/drive/folders/1OKOHucGLae9FMFbifHLZveCHlKer_trv" }
    ],
    "incidents": [
      "Description - Month Day (from file title date)"
    ],
    "docUpdates": [
      "2-4 bullets summarising merged GitHub docs PRs, clubbing related changes"
    ]
  },
  "platformOps": {
    "kpis": [
      { "label": "Deployments / Week", "value": null },
      { "label": "Uptime",             "value": null },
      { "label": "Critical Bugs",      "value": null }
    ],
    "monthlyUpdates": [
      "from Glific blog (primary): theme-grouped bullet",
      "from GitHub PRs only if blog is missing something significant"
    ],
    "nextMonth": [
      "[Epic Name]: what the epic delivers - specific sprint details from tickets"
    ]
  }
}
```

### Step 4 - Generate the PPTX

```bash
SKILL_DIR="<absolute path to this skill's directory>"
cp "$SKILL_DIR/scripts/create_deck.js" /tmp/glific-deck-work/
cd /tmp/glific-deck-work
node create_deck.js deck_data.json "glific_monthly_review_${MONTH}_${YEAR}.pptx"
```

### Step 5 - QA

```bash
python -m markitdown /tmp/glific-deck-work/glific_monthly_review_*.pptx
```

Verify: 6 slides present, correct month/year on every slide, no "TODO" text,
values on correct slides, no hours in Slide 3 org updates, no Next Month on Slide 3.

### Step 6 - Deliver

Copy to the user's outputs folder and share via `mcp__cowork__present_files`.
Remind them to drag the `.pptx` into Google Drive and open with Google Slides to edit.

---

## Known Issues & Gotchas

**Churn KPI placement**: Churn belongs on Slide 3 (CS Consulting), NOT Slide 2 (Biz Dev).
Extract churn from the KPI tracker and place it in `csConsulting.kpis`, not `bizdev.kpis`.

**Slide 3 format rules**:
- Org update bullets must NOT include hours (no "(N hrs)" in the text)
- Slide 3 has NO "Next Month" section - do not generate `csConsulting.nextMonth`

**Incident dates from file titles**: The incidents Drive folder uses filenames with a YYYYMMDD
prefix (e.g. `20260511-TTS Failures`). Always parse the date from the title, not from
`createdTime`. A document created in May may have an April title date if the incident
happened in April but was documented late - use the title date for both counting and display.

**Slide 5 next month - Epics not tickets**: Write one bullet per Epic, not per ticket.
Use the Roadmap view (views/16) to identify which Epics are targeting next month, then
use the Weekly plan (views/8) sprint tickets to add specifics within each Epic bullet.

**Biz Dev sheet size**: File `1vRH8T...` exceeds token limit and auto-saves to a temp file.
The error message contains the path. Use the bash/Python snippet in step 2b to read it.

**Glific Sales 2026-27 sheet**: Small file (~10KB), reads in full without issues.
Tab names follow the pattern "Quarter N (Month to Month Year)" - match against target month.

**Blog URL pattern**: `{month-lower}-{year}-bug-fixes-enhancements-documentation-updates`
Full lowercase month name: `may-2026`, `april-2026`, etc.
If 404, post not yet published - fall back to GitHub PRs (step 2g) for all Slide 5 content.

**GitHub pages are client-rendered**: `web_fetch` returns empty for all GitHub URLs.
Always use Claude in Chrome for GitHub data.

**GitHub project board**: "Current Iteration" view no longer exists. Use "Weekly plan"
tab (views/8) for sprint details and Roadmap view (views/16) for Epic-level next month.

**hex colors**: Never use `#` prefix in pptxgenjs hex strings (`"028090"` not `"#028090"`).

**Slide 1 updates**: Synthesise 0-3 bullets from the other slides - most impactful outcomes.
Do not fetch a separate data source for this.

**Onboarding tab name**: For 2026-27, the tab is "Annual Onboardings (April 26 to March 27)".
