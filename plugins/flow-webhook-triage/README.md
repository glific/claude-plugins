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

**There is one shared team sheet.** Everyone's runs land in it — that's what makes dedup and
the trend analysis work. So unless you're the person creating it, you do **not** set up a
sheet. Three env vars and you're done:

```bash
export GLIFIC_TRIAGE_WEBAPP_URL="...team's /exec URL..."      # ask the team
export GLIFIC_TRIAGE_TOKEN="...team's token..."              # ask the team
export APPSIGNAL_API_KEY="...your own Personal API token..." # yours alone
```

Two are shared; the AppSignal token is personal — it's tied to your identity, so sharing one
wrecks attribution and revoking it would break everyone.

Get the AppSignal one from your **user** settings, *not* the app's settings page. That page has
the push API key, which is write-only and will 401. Check with:

```bash
node skills/triage-flow-webhooks/scripts/fetch-incidents.mjs verify
```

**Creating the sheet** (once, by its owner) is in
`skills/triage-flow-webhooks/references/sheet-setup.md` — deploy the bundled Apps Script,
share the URL + token with the team.

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
