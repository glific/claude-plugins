---
name: candidate-reviewer
description: >
  Evaluate and score job candidates against a job description, producing a detailed
  self-contained HTML scoring report a hiring manager can open in a browser.
  Use this skill whenever the user provides resumes (PDFs, text, or files) together
  with a job description (URL, text, or file) and asks anything about fit, ranking,
  shortlisting, scoring, comparing applicants, or who to interview — for any role type.
  Works for Engineering, Support, Product, Design, Engineering Management,
  Solutions/Sales, Marketing, and HR/Operations roles.
  Trigger on phrases like: "review these candidates", "score these resumes against
  the JD", "which candidates match this role", "compare applicants", "rank resumes",
  "shortlist for interviews", "evaluate against the job posting", "hiring report",
  "who should we interview", "screen these applicants". Also trigger when a user
  has a folder of resumes open and asks any question about match or recommendation.
---

# Candidate Review Skill

You produce a professional, structured HTML report that scores and ranks job
candidates against a job description. A hiring manager should be able to open it
in their browser and make shortlisting decisions immediately.

This skill covers all functions in an IT company: Engineering, Support, Product,
Design, Engineering Management, Solutions/Sales, Marketing, and HR/Operations.
The same structured workflow applies regardless of the role — dimensions and
criteria are always derived from the specific JD.

---

## Step 1 – Parse the Job Description

Accept any format:
- **URL** → fetch with `web_fetch`, extract the role requirements from the page
- **Text paste or file** → read directly

Extract and keep:
- Role title and seniority level
- Role **category** — see table below; this drives Step 3
- Primary required skills/knowledge areas ("must-haves")
- Secondary or preferred skills ("nice-to-haves")
- Years of experience required
- Key responsibilities (signals what *depth* matters most)
- Any stated transition pathways or equivalences (e.g., "we welcome Python devs learning Elixir")
- Compensation range if present
- Cultural or mission context (remote-first, startup, NGO, enterprise, etc.)

---

## Step 2 – Classify the Role

Before designing dimensions, identify which of the 8 categories the role falls into.
This determines what to look for in resumes and what dimensions to create.

| Category | Example roles |
|---|---|
| **Engineering** | Backend, Frontend, Full Stack, Mobile, DevOps/SRE, Data Engineer, ML Engineer, QA/SDET, Cloud/Platform, Technical Writer, DevRel |
| **Support** | Technical Support, Customer Support, IT Support, Implementation Engineer, Onboarding Specialist, Support Lead |
| **Product** | Product Manager, Product Owner, Business Analyst, Program Manager, Technical PM |
| **Design** | UX Designer, UI Designer, Product Designer, UX Researcher, Design Lead |
| **Engineering Management** | Engineering Manager, Tech Lead, Director of Engineering, VP Engineering, CTO |
| **Solutions/Sales** | Solutions Architect, Sales Engineer, Pre-Sales Engineer, Account Executive (technical), Customer Success Engineer |
| **Marketing** | Product Marketing Manager, Content Marketer, Digital Marketer, Growth Marketer, Brand Manager, Developer Advocate (marketing-facing), Demand Generation |
| **HR/Operations** | HR Business Partner, Recruiter, Technical Recruiter, People Operations, Office/Business Operations, Admin |

If the role doesn't fit cleanly into one category (e.g., a hybrid "Product + Data" or "Sales + Solutions"), treat it as a hybrid and combine criteria from both categories.

---

## Step 3 – Parse Each Resume

For each candidate, extract the information most relevant to the role category identified in Step 2. Focus your extraction on what the JD cares about.

**Universal extractions (all role types):**
- Total years of experience + career arc (progression over time)
- Most recent role title, scope, and company context
- Evidence of leadership, mentoring, or people management
- Domain or industry experience (B2B SaaS, fintech, e-commerce, NGO, etc.)
- Communication, writing, or presentation evidence (publications, talks, docs)

**Category-specific extractions:**

| Category | Additional things to extract |
|---|---|
| **Engineering** | Primary languages/frameworks (with recency), system design or architecture ownership, DB and infra experience, testing practices and automation, DevOps/CI-CD, open source or side projects |
| **Support** | Ticketing systems (Zendesk, Jira, Freshdesk), technical troubleshooting depth, CSAT/SLA metrics if mentioned, escalation handling, customer-facing communication quality, product knowledge breadth |
| **Product** | Product lifecycle ownership (0→1 vs scaling vs growth), data-driven decisions and metrics moved, roadmap ownership, stakeholder management and exec communication, discovery and user research |
| **Design** | Portfolio or work samples (presence/absence is a signal), UX research methods used, design tools (Figma, Sketch, etc.), design systems contributions, cross-functional collaboration with Eng and PM |
| **Engineering Management** | Team size managed and growth, hiring record, delivery track record, technical credibility retained, org/process improvements, budget or headcount ownership |
| **Solutions/Sales** | Technical pre-sales or demo experience, RFP and proposal ownership, customer-facing communication, product depth and breadth, deal size/industry context, collaboration with AEs and PMs |
| **Marketing** | Channels owned (SEO, paid, email, content, events), campaign performance metrics (CAC, pipeline, MQL), tools used (HubSpot, Marketo, GA, etc.), B2B vs B2C experience, content production volume/quality, GTM or launch experience |
| **HR/Operations** | Roles filled and time-to-hire metrics, HRBP scope (headcount supported, initiatives run), culture/DEI programs, HR tools (Workday, BambooHR, Greenhouse, etc.), operational processes built or improved |

If a skill or area is not mentioned in a resume, note it as *unstated* (not absent) — score conservatively but don't assume the worst.

---

## Step 4 – Design Scoring Dimensions

**Never hardcode dimensions.** Derive 7–9 dimensions from what the JD actually signals as important for this specific role. Name them specifically (e.g., "Django/FastAPI Depth" not "Tech Stack", "Product Roadmap Ownership" not "Product Skills") so the report is readable at a glance.

Assign weights that reflect importance — weights must sum to 100%.

**General weight guidance by criterion type:**

| Criterion type | Typical weight range |
|---|---|
| Core required skill / domain knowledge | 20–30% (highest; this is the role's primary capability) |
| Experience level / seniority match | 10–18% |
| Execution / delivery track record | 10–18% |
| Leadership, mentorship, or management scope | 8–14% |
| Cross-functional collaboration / communication | 7–12% |
| Secondary skills or tools | 5–10% each |
| Cultural / mission / domain fit | 3–7% |

**Category-specific dimension ideas** (use as inspiration — always derive from the actual JD, never copy blindly):

*Engineering:* Core Language/Framework, System Architecture, DB & Data Layer, Testing & Code Quality, DevOps/CI-CD, API Design, Seniority, Leadership/Mentorship

*Support:* Technical Troubleshooting Depth, Customer Communication, Ticket/Process Management, Product Knowledge, SLA/Metric Ownership, Escalation Handling, Seniority

*Product:* Product Roadmap Ownership, Data-Driven Decision Making, Stakeholder & Exec Communication, Discovery & User Research, Delivery & Execution, Cross-functional Leadership, Domain Fit

*Design:* Design Process & UX Research, Visual & Interaction Quality, Design Systems, Tool Proficiency (Figma etc.), Cross-functional Collaboration, Communication/Presentation, Seniority

*Engineering Management:* People Management & Hiring, Delivery Track Record, Technical Credibility, Process & Culture Building, Stakeholder Management, Org Scale/Scope

*Solutions/Sales:* Technical Product Depth, Customer-Facing Communication, Pre-Sales & Demo Ability, RFP/Proposal Quality, Industry/Domain Fit, AE/PM Collaboration

*Marketing:* Core Channel Expertise (SEO/Paid/Content/etc.), Campaign Performance & Metrics, Marketing Tools Proficiency, B2B/B2C Domain Fit, Content Quality & Volume, GTM & Launch Experience, Cross-functional Collaboration

*HR/Operations:* Recruiting or HR Domain Depth, Hiring Metrics & Speed, HRBP or Ops Scope, HR Tools Proficiency, Culture & People Initiatives, Process Design/Improvement, Communication & Influence

---

## Step 5 – Score Each Candidate (1–10 per dimension)

| Score | Meaning |
|---|---|
| 9–10 | Exceptional — direct, proven experience with strong evidence |
| 7–8 | Strong — solid evidence, minor gaps only |
| 5–6 | Partial — some evidence, meaningful gaps present |
| 3–4 | Weak — adjacent experience, significant gap |
| 1–2 | Very weak — minimal or indirect connection |
| 0 | Completely absent — wrong domain, zero evidence |

**Calibration rules:**
- Score based on *evidence in the resume*, not assumptions. Unstated = 3–4 max.
- If the JD has an explicit transition pathway (e.g., "Ruby/Python devs welcome"), score those candidates 5–7 on the core dimension — not 0.
- **Spread your scores.** If everyone clusters at 6–7, the report is meaningless. Give 10s to standout candidates and 1s to clear mismatches.
- Calculate weighted score: `Σ (score_i × weight_i / 100)` → result out of 10.

---

## Step 6 – Write Pros, Cons, and Verdicts

For each candidate write:
- **3–7 pros** — concrete, evidence-based strengths *specific to this role*
- **3–7 cons** — concrete gaps or risks *specific to this role*
- **1-sentence hiring note** — the key trade-off or recommendation in plain language
- **Verdict** — pick one:
  - `✅ Strong Consider` — good all-round match, recommend interview
  - `⭐ Top [Skill] Pick` — best match on the #1 criterion, even if not #1 overall weighted score
  - `🟡 Consider` — worthwhile but has real gaps
  - `🟡 Borderline` — marginal fit, proceed with caution
  - `🔴 Weak Match` — meets experience bar but wrong skills/domain
  - `🔴 Under-qualified` — right direction but too junior or inexperienced
  - `🔴 No Match` — wrong function or domain entirely

Use `⭐` when the best match on the single most-critical criterion isn't the #1 ranked candidate overall — this trade-off is valuable for the hiring manager to see.

---

## Step 7 – Generate the HTML Report

Write a **single self-contained HTML file** — all CSS inline in a `<style>` tag, no external dependencies, no CDN links. Name it `[role-slug]_candidate_scoring.html`.

### Required sections (in order):

**1. Header banner**
Role title, organization, salary range (if known), count of candidates evaluated, key requirements as styled pill badges.

**2. Weight legend**
All scoring dimensions and their weights shown as colored pills, so readers understand the table before looking at it.

**3. Scoring matrix table** (full-width, horizontally scrollable if needed)
- Columns: Rank | Candidate | Primary Skills/Background | [one column per dimension with weight in header] | Weighted Score /10
- **Score cell colors:** ≥8 → `bg #C6EFCE text #375623` | 5–7 → `bg #FFEB9C text #9C6500` | 1–4 → `bg #FFC7CE text #9C0006` | 0 → `bg #FF0000 text white`
- **Weighted score column:** `bg #1F3864 text white bold`, larger font
- Rank badges: gold/silver/bronze filled circles for top 3
- Sticky header, alternating row shading, hover highlight

**4. Weighted score bar chart**
Horizontal bars sorted by score descending. Top-tier bars: `#2E5F8A`. Mid-tier: `#F57C00`. Bottom-tier: `#E53935`. Add a ⭐ annotation on the core-skill specialist if they aren't ranked #1 overall.

**5. Pros & Cons cards** (responsive 2-column grid)
- Card header: `bg #1F3864 text white` — rank number, name, primary background, verdict badge
- Card body: two-column — left `bg #f0faf0` (pros, green header), right `bg #fff5f5` (cons, red header)
- Bullet lists at 12px
- Footer note row: italic, `bg #f4f6f9`
- Verdict badge colors match their tier (green/amber/red)

**6. Scoring criteria guide**
Table: Dimension | Weight | Scoring guide (1-line scale description per dimension). End with a short paragraph explaining the weight rationale — why is the top criterion weighted highest?

**7. Recommendation summary table**
| Priority tier | Candidate(s) | Justification |
Tiers: 🥇 Interview First | 🥈 Strong Interview | 🥉 If Top 3 Unavailable | ⛔ Do Not Proceed

### CSS palette

```
Dark blue:   #1F3864   (headers, nav)
Mid blue:    #2E5F8A   (secondary headers)
Light blue:  #BDD7EE   (accents)
Gold:        #C9A227   (rank badges)
Body bg:     #f4f6f9
Card bg:     white
Alt row:     #f8fafc
```

Font: Arial throughout. Max-width: 1400px centered. Readable at ≥900px. Print-friendly (cards stack single-column via `@media print`).

---

## Step 8 – Output

1. Save the HTML file to the user's workspace folder (mounted folder if available, otherwise the outputs folder)
2. Use the `present_files` tool to surface the file to the user
3. Add a brief text summary (3–5 sentences): how many candidates reviewed, who to interview and why, any standout concern

---

## Edge Cases

| Situation | Handle it this way |
|---|---|
| Single resume | Still produce the full report — functions as a structured fit assessment |
| JD as text (no URL) | Proceed; note any ambiguities in the header banner |
| Non-technical role (PM, Design, HR, Marketing) | Use functional/soft-skill dimensions — do not force tech columns onto non-tech roles |
| Resume with skills not listed | Score all relevant dimensions at 3, flag in cons: "Key area not evidenced in resume" |
| Candidate from completely wrong domain | Explain in pros/cons rather than leaving zeros unexplained |
| JD with multiple acceptable pathways | Treat each as a scoring tier within the core dimension |
| Very large candidate pool (10+) | Score all; abbreviate pros/cons to 3 each to keep report manageable |
| Portfolio or work samples mentioned | Note presence/absence of portfolio link as a signal where relevant (design, writing, devrel) |
