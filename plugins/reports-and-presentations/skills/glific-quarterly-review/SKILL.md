---
name: glific-quarterly-review
description: >
  Creates the Glific Quarterly Review slide deck (.pptx) for a given quarter.
  Use this skill whenever the user asks to create, generate, build, or prepare
  a Glific quarterly review, quarterly deck, quarterly slides, or quarterly report —
  even if they just say "make the Q1 deck" or "generate the quarterly review for Q2".
  The skill maps the quarter to its constituent months (e.g. Q1 2026-27 = April, May, June),
  confirms this with the user, pulls KPI data directly from the KPI tracker spreadsheet
  for each month and aggregates them as YTD, and generates a fully formatted 6-slide PPTX
  using Glific brand colors (green/yellow palette, Heebo font).
  Trigger whenever the user mentions: quarterly review, Glific quarterly, Q1/Q2/Q3/Q4 deck,
  or any combination of Glific + a quarter label or fiscal year.
---

# Glific Quarterly Review Skill

Generates the Glific Quarterly Review deck (title slide + 5 content slides) for any given
quarter of the Glific fiscal year (April–March). KPIs are pulled **directly from the KPI
tracker spreadsheet** for each available month in the quarter and aggregated as YTD.
Narrative bullet content is pulled from the monthly PPTX review decks in Google Drive.

## Fiscal Year & Quarter Mapping

Glific's fiscal year runs April → March:

| Quarter | Months | FY Example |
|---------|--------|------------|
| Q1 | April, May, June | Q1 2026-27 = Apr–Jun 2026 |
| Q2 | July, August, September | Q2 2026-27 = Jul–Sep 2026 |
| Q3 | October, November, December | Q3 2026-27 = Oct–Dec 2026 |
| Q4 | January, February, March | Q4 2026-27 = Jan–Mar 2027 |

## Slide Structure

| # | Title | Left Panel | Right Panel |
|---|-------|------------|-------------|
| T | Title slide | — | "Glific Quarterly Review / Q[N] YYYY-YY" |
| 1 | Glific Overall Update | Goal KPIs (YTD) | Highlights + Lowlights |
| 2 | Biz Dev & Marketing | Biz Dev KPIs (YTD) | This Quarter + Next Quarter |
| 3 | CS - Consulting | CS Consulting KPIs (YTD) | Q Updates (top 4 engagements only, no Next Quarter) |
| 4 | CS - Support | CS Support KPIs (Q total) | Documentation Updates + Next Quarter |
| 5 | Platform | Platform KPIs (Q total) | This Quarter (summarised) + Next Quarter |

## Data Sources

| Data | Source | File ID |
|------|--------|---------|
| All left-panel KPIs | KPI Tracker spreadsheet | `1qMr_lDsn00CYp9-iHsT5-7Jr-ZRek2p4RBSJdlJUveQ` gid=1733984597 |
| Narrative bullets (right panels) | Monthly PPTX decks in Drive | folder `1MFXFiek0HVq6NEqwfGyaT72gJITNl4e8` |
| CS Consulting org updates | CS/Product Tracker sheet | `1hNk_495eGBlBrlLSm4mGDpYRqsIj1aKAM7OuYFULMQk` gid=625816466 |
| Incidents count | Drive incidents folder | `1OKOHucGLae9FMFbifHLZveCHlKer_trv` |

---

## Step-by-Step Workflow

### Step 0 — Parse & confirm the quarter

Extract the **quarter** (Q1–Q4) and **fiscal year** (e.g. 2026-27) from the user's request.
Derive the three calendar months and the calendar year(s) involved. If the fiscal year is
omitted, infer it from today's date (Glific FY starts in April).

**Confirm with the user before doing any data fetching:**
> "This is Q[N] [FY], covering [Month1], [Month2], and [Month3] [Year]. Shall I proceed?"

### Step 1 — Set up working directory

```bash
mkdir -p /tmp/glific-q-deck
cd /tmp/glific-q-deck
[ -d node_modules/pptxgenjs ] || (npm init -y && npm install pptxgenjs)
```

### Step 2 — Pull KPIs from the KPI Tracker spreadsheet

This is the **primary KPI source** for all left-panel values. Read it once and extract
data for all three quarter months in a single pass.

```
mcp__4f39b92b-af20-4540-a74e-39576272b2ba__read_file_content
  fileId: 1qMr_lDsn00CYp9-iHsT5-7Jr-ZRek2p4RBSJdlJUveQ
```

The sheet has KPI row labels in the leftmost column and month names as column headers
(e.g. "April", "May", "June"). For each of the three quarter months:
- Find the column whose header matches the month name (case-insensitive)
- Extract the values for every KPI row listed below

**KPIs to extract per month:**

*Slide 1 — Overall:*
- Sustainability % (or Revenue/Expense ratio — whichever row is labelled)
- Total Revenue
- Total Expense
- Total Active Bots (end-of-month snapshot)
- New Bot Accounts (month count)
- Active Contacts
- Messages Exchanged
- Grants Applied

*Slide 2 — Biz Dev:*
- SaaS Revenue
- New Bots (month)
- MQLs
- SQLs

*Slide 3 — CS Consulting:*
- Consulting Revenue
- % of Annual Target (or calculate: cumulative consulting ÷ annual target)
- Churn count
- Active Consulting Org Names (comma-separated list)

*Slide 4 — CS Support:*
- # of P0 Issues
- P0 Average Resolution Time
- # of P1 Issues
- P1 Average Resolution Time
- # of Incidents

*Slide 5 — Platform:*
- Deployments / Week
- Uptime %
- Escaped Bugs (label may be "Critical Bugs" or "Escaped Bugs")

Save the raw per-month values in a working dict before aggregation.

### Step 3 — Aggregate KPIs across available months

For each KPI, apply the correct aggregation rule:

**Cumulative (SUM) — add monthly values:**
| KPI | Notes |
|-----|-------|
| Total Revenue | Sum all months |
| SaaS Revenue | Sum all months |
| Consulting Revenue | Sum all months |
| Total Expense | Sum all months |
| New Bot Accounts | Sum all months |
| MQLs | Sum all months |
| SQLs | Sum all months |
| # of P0 Issues | Sum; format as "N (X Apr, Y May, Z Jun)" if breakdown useful |
| # of P1 Issues | Sum; same format |
| # of Incidents | Sum; format with per-month breakdown |
| Escaped Bugs | Sum; format with per-month breakdown |
| Deployments/Week | Average across available months (sum ÷ count), then annotate: "2.1 avg (Apr: 2, May: 2.2)" |
| Messages Exchanged | Sum (or use latest if only cumulative YTD is tracked) |

**Snapshot (LATEST) — use the most recent available month's value:**
| KPI | Notes |
|-----|-------|
| Sustainability % | Most recent month |
| Total Active Bots | Most recent month; mark highlight:true |
| Active Contacts | Most recent month |
| Active Consulting Org Names | Most recent month (current active list) |
| Uptime % | Most recent month |
| P0 / P1 Resolution Time | Most recent month's average |
| % of Annual Target | Recalculate: (cumulative consulting revenue ÷ annual target) × 100 |

**Missing months**: Never fabricate values. If a month's data is blank or the month's deck
doesn't exist, use only the available months and note the gap:
- On cumulative KPIs: label as "Q1 YTD (Apr + May only)" if June is missing
- On the title slide: "Data covers April & May 2026 — June pending"

**Formatting rules:**
- Revenue: `Rs XX,XX,XXX` (Indian comma format, e.g. `Rs 23,73,332`)
- Percentages: one decimal place (e.g. `65.5%`)
- Missing/unavailable: `"—"` (en-dash, not hyphen)

### Step 4 — Pull narrative content from monthly PPTX decks

The right-panel bullet content (Highlights, Lowlights, This Quarter bullets) comes from
the existing monthly review decks in Drive, not from the spreadsheet.

**Locate the decks:**
```
mcp__4f39b92b-af20-4540-a74e-39576272b2ba__search_files
  query: name contains 'glific_monthly_review_' and '1MFXFiek0HVq6NEqwfGyaT72gJITNl4e8' in parents
```
Match filenames case-insensitively against the quarter's months. Skip missing months.

**Download and parse each deck:**
```
mcp__4f39b92b-af20-4540-a74e-39576272b2ba__download_file_content  fileId: <id>
```
```bash
pip install python-pptx --break-system-packages -q
python3 << 'EOF'
from pptx import Presentation, json
path = "/tmp/monthly_deck.pptx"
prs = Presentation(path)
slides = []
for i, slide in enumerate(prs.slides):
    texts = []
    for shape in slide.shapes:
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                t = para.text.strip()
                if t:
                    texts.append(t)
    slides.append({"slide": i, "texts": texts})
print(json.dumps(slides, indent=2))
EOF
```

**What to extract per slide from each monthly deck:**
- Slide 1: highlights + lowlights bullets (or "Updates" if older format)
- Slide 2: "This Month" bullets; "Next Month" bullets
- Slide 3: consulting org update bullets
- Slide 4: documentation update bullets
- Slide 5: platform "Monthly Updates" bullets; "Next Month" bullets

**Consulting updates fallback**: If monthly decks don't have consulting org detail, read the
CS/Product Tracker sheet (`1hNk_495eGBlBrlLSm4mGDpYRqsIj1aKAM7OuYFULMQk`) for the quarter
months' columns.

### Step 5 — Synthesise quarterly narrative content

Build the right-panel bullets for each slide:

**Slide 1 — Highlights / Lowlights:**
- Distil from all available months' updates into the **4 most significant** highlights and
  **4 most significant** lowlights for the quarter overall. Avoid repetition across months.

**Slide 2 — Biz Dev This Quarter (max 5 bullets):**
- Merge "This Month" bullets from all available months into one coherent quarterly narrative.
- Do NOT list month-by-month — synthesise into themes (Onboarding, Marketing, Pipeline, Process).
- Next Quarter: set to `null` unless the user provides content.

**Slide 3 — CS Consulting Quarterly Updates (top 4 only):**
- Highlight the 4 most impactful consulting engagements across the quarter.
- Format: `"OrgName: key work done — key outcome"`
- Do NOT include hours, do NOT include all orgs, do NOT add a Next Quarter section.

**Slide 4 — CS Support Documentation Updates:**
- Merge all doc update bullets from available months; club related changes.
- Next Quarter: set to `null` unless user provides content.

**Slide 5 — Platform This Quarter (max 5 bullets):**
- Synthesise across months into theme-level bullets (not month-by-month).
- Next Quarter: set to `null` unless user provides content.

### Step 6 — Compile deck_data.json

Write `/tmp/glific-q-deck/deck_data.json` using all gathered data:

```json
{
  "quarter": "Q1",
  "fiscalYear": "2026-27",
  "months": ["April", "May"],
  "missingMonths": ["June"],
  "coverageNote": "Data covers April & May 2026 — June pending",

  "overall": {
    "kpis": [
      { "label": "Sustainability Q1 YTD",   "value": "65.5%" },
      { "label": "Total Revenue Q1 YTD",    "value": "Rs 37,22,512" },
      { "label": "Total Expense Q1 YTD",    "value": "Rs 56,81,094" },
      { "label": "Total Active Bots",        "value": "147", "highlight": true },
      { "label": "New Bot Accounts Q1",      "value": "5" },
      { "label": "Active Contacts (FY)",     "value": "56,307" },
      { "label": "Messages Exchanged YTD",   "value": null },
      { "label": "Grants Applied to YTD",    "value": "$0" }
    ],
    "highlights": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
    "lowlights":  ["bullet 1", "bullet 2", "bullet 3", "bullet 4"]
  },

  "bizdev": {
    "kpis": [
      { "label": "SaaS Revenue Q1 YTD", "value": "Rs 23,73,332", "highlight": true },
      { "label": "New Bots Q1",          "value": "5" },
      { "label": "MQLs",                 "value": "4+" },
      { "label": "SQLs",                 "value": "2+" }
    ],
    "thisQuarter": ["bullet 1", "..."],
    "nextQuarter": null
  },

  "csConsulting": {
    "kpis": [
      { "label": "Consulting Revenue Q1 YTD", "value": "Rs 12,78,547", "highlight": true },
      { "label": "% of Annual Target",         "value": "20.5% of Rs 62.5L" },
      { "label": "Churn Q1",                   "value": "16 (9 Apr, 7 May)" },
      { "label": "Active Consulting Orgs",      "value": "ATECF, FMCH, Antara, ..." }
    ],
    "quarterUpdates": ["OrgA: work done", "OrgB: work done", "OrgC: work done", "OrgD: work done"]
  },

  "csSupport": {
    "kpis": [
      { "label": "# of P0 Issues",     "value": "2 (0 Apr, 2 May)" },
      { "label": "P0 Resolution Time",  "value": "4.3 days (May avg)" },
      { "label": "# of P1 Issues",     "value": "14 (1 Apr, 13 May)" },
      { "label": "P1 Resolution Time",  "value": "1-2 days" },
      { "label": "# of Incidents",     "value": "2 (May; 0 in April)" }
    ],
    "docUpdates": ["bullet 1", "..."],
    "nextQuarter": null
  },

  "platformOps": {
    "kpis": [
      { "label": "Deployments / Week", "value": "2.1 avg (Apr: 2, May: 2.2)" },
      { "label": "Uptime",             "value": null },
      { "label": "Escaped Bugs",       "value": "10 (4 Apr + 6 May)" }
    ],
    "thisQuarter": ["bullet 1", "..."],
    "nextQuarter": null
  }
}
```

### Step 7 — Generate the PPTX

```bash
SKILL_DIR="<absolute path to this skill directory>"
cp "$SKILL_DIR/scripts/create_quarterly_deck.js" /tmp/glific-q-deck/
cd /tmp/glific-q-deck
node create_quarterly_deck.js deck_data.json "glific_quarterly_review_Q1_2026-27.pptx"
```

Output filename pattern: `glific_quarterly_review_Q[N]_[FY].pptx`

### Step 8 — QA

```bash
python3 -c "
from pptx import Presentation
prs = Presentation('/tmp/glific-q-deck/glific_quarterly_review_Q1_2026-27.pptx')
print(f'Slides: {len(prs.slides)}')
for i, s in enumerate(prs.slides):
    texts = [sh.text_frame.paragraphs[0].text for sh in s.shapes if sh.has_text_frame]
    print(f'Slide {i}: {texts[:5]}')
"
```

Confirm: 6 slides, quarter label on title, coverage note visible, no "TODO" text,
grey italic placeholder on all null `nextQuarter` sections.

### Step 9 — Deliver

Copy to the outputs folder and share via `mcp__cowork__present_files`.
Remind the user to drag the `.pptx` into Google Drive and open with Google Slides to edit.

---

## Aggregation Quick Reference

| KPI | Rule | Notes |
|-----|------|-------|
| Revenue (all types) | SUM | |
| Expenses | SUM | |
| New Bots | SUM | |
| MQLs / SQLs | SUM | |
| P0 / P1 counts | SUM | Show per-month breakdown: "14 (1 Apr, 13 May)" |
| Incidents | SUM | Show per-month breakdown |
| Escaped Bugs | SUM | Show per-month breakdown |
| Deployments/Week | AVG | `(sum of monthly avgs) ÷ months available` + per-month note |
| Active Bots | LATEST | End-of-quarter snapshot |
| Active Contacts | LATEST | End-of-quarter snapshot |
| Sustainability % | LATEST | Most recent month |
| Uptime | LATEST | Most recent month |
| P0/P1 Avg Resolution | LATEST | Most recent month |
| Active Consulting Orgs | LATEST | Current active list |
| % of Annual Target | CALCULATED | `(cumulative consulting revenue ÷ Rs 62.5L) × 100` |

---

## Known Issues & Gotchas

**Quarter vs month confusion**: Glific FY starts April. Always confirm the month mapping
before fetching. A user saying "Q1" might mean calendar Q1 (Jan–Mar) — clarify.

**Missing months**: Aggregate only available months. Never invent data. Label cumulative
KPIs as "Q1 YTD (Apr + May only)" and note the gap on the title slide.

**Consulting slide (Slide 3)**:
- Include only the top 4 most notable engagements, not all orgs
- No "Next Quarter" section on this slide
- No hours in org update bullets

**Slide 1 layout**: Uses Highlights + Lowlights (4 each) instead of a single updates list.

**KPI label naming**: Use "Q[N] YTD" on cumulative KPIs (e.g. "SaaS Revenue Q1 YTD").

**"Next Quarter" placeholder**: When `nextQuarter` is `null`, the script renders
"To be updated once [next quarter] data is available" in grey italic.

**Sustainability %**: Snapshot — use the most recent available month's value, never sum.

**hex colors in pptxgenjs**: Never use `#` prefix (`"063F24"` not `"#063F24"`).
