# flow-webhook-triage

Daily triage for Glific flow-webhook errors.

Pulls incidents from the two AppSignal namespaces the webhook subsystem reports into,
diagnoses each one against the actual `glific/glific` code, and upserts a row into a
shared Google Sheet — so the sheet accumulates into a month-scale record of *why* flow
webhooks fail.

| | |
|---|---|
| **Skill** | `triage-flow-webhooks` |
| **Namespaces** | `flow_webhooks` (system → pages on-call), `flow_webhook_config_errors` (config → notifies support) |
| **Output** | One diagnosis row per incident in a shared Google Sheet |
| **Cadence** | Daily; resumes from the last run's watermark |

## What it's for

The webhook subsystem classifies its own failures — but `:unknown` is the fail-safe, so
anything a webhook can't name lands in `flow_webhooks` and pages on-call. Two questions
follow, and neither is answerable from AppSignal alone:

1. **What's actually in the unknown bucket?** Diagnose each one against the code and the
   pattern shows up over weeks, not in a single incident.
2. **Which config errors keep repeating?** A misconfiguration that many NGOs hit is a
   product problem — validate it at the source instead of triaging it forever.

The sheet is what makes both visible. Each incident gets one row that persists, with a
`times_seen` counter that increments every run it reappears — so repeat offenders sort
straight to the top.

## Setup

Two things, both one-time. Both are walked through in
`skills/triage-flow-webhooks/references/sheet-setup.md`.

1. **AppSignal token** — a **Personal API token** (user settings), *not* a push API key (app
   settings). Push keys are write-only and will 401. Set `APPSIGNAL_API_KEY` and check with
   `node skills/triage-flow-webhooks/scripts/fetch-incidents.mjs verify`.
2. **The sheet** — deploy the bundled Apps Script Web App against your sheet and set
   `GLIFIC_TRIAGE_SHEET_URL` + `GLIFIC_TRIAGE_TOKEN`.

No Google credentials are shared. The sheet's owner deploys a script that runs as them;
everyone else just needs the URL.

## Usage

```
Run the flow webhook triage
```

Or for a specific window:

```
Run the flow webhook triage for the last 3 days
```

## Files

```
skills/triage-flow-webhooks/
├── SKILL.md                          # the routine
├── references/
│   ├── error-taxonomy.md             # classification map, grounded in the code
│   └── sheet-setup.md                # Apps Script deploy + AppSignal wiring
└── scripts/
    ├── fetch-incidents.mjs           # AppSignal GraphQL — verify / introspect / fetch
    ├── append-to-sheet.mjs           # client — upserts rows, fetches watermark
    └── apps-script/
        ├── Code.gs                   # the bound Web App (dedup lives here)
        └── test-upsert.js            # simulates Sheets to test Code.gs locally
```

`Code.gs` can't be tested without deploying it to Google, so `test-upsert.js` stubs
`SpreadsheetApp` and exercises the upsert, dedup, auth and watermark paths in plain Node:

```bash
node skills/triage-flow-webhooks/scripts/apps-script/test-upsert.js
```

Run it after any edit to `Code.gs` — it already caught one real bug (an in-batch duplicate
id taking the update path and writing to row -1).
