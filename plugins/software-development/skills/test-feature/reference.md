# test-feature — reference

Stack details, Playwright-MCP cheat-sheet, scenario-matrix + latency + results-sheet schemas, the
Vitest/Cypress generation guide, and the worked Prompt Generator walkthrough.
Keep [SKILL.md](SKILL.md) lean; put the lookups here.

## Stack

| Component | URL | Notes |
|-----------|-----|-------|
| Frontend (Vite) | `https://glific.test:3000` | React `glific-frontend`, sibling repo at `../glific-frontend`, served over TLS via `glific.test` host alias |
| Backend (Phoenix) | `https://glific.test:4001` | GraphQL at `/api`; webhooks under `/webhook`, `/kaapi` |
| Backend (local) | `http://localhost:4000` | same Phoenix server |

Health check:

```bash
curl -sk -o /dev/null -w "frontend %{http_code}\n" https://glific.test:3000
curl -sk -o /dev/null -w "backend  %{http_code}\n" https://glific.test:4001
curl -s  -o /dev/null -w "local    %{http_code}\n" http://localhost:4000
```

A live run needs the **backend up** (200/302). With the backend down you can still run the **Vitest**
layer (mocked, no network) but **not** the browser failure/async scenarios — report those rows as
BLOCKED.

### Troubleshooting (report to user; do not silently fix their machine)

| Symptom | Likely cause | User action |
|---------|--------------|-------------|
| Frontend ≠ 200 | Vite not running | start the frontend dev server (`yarn dev` in glific-frontend) |
| Backend ≠ 200/302 (`000`) | Phoenix not running | start Phoenix: `iex -S mix phx.server` in glific |
| Floweditor chunks 404 in console | stale floweditor build | run `yarn floweditor` in glific-frontend |
| Blank page / Stripe error | empty `VITE_STRIPE_PUBLISH_KEY` | set a test Stripe publishable key in frontend env |
| Async feature never resolves | provider creds / public callback tunnel missing (e.g. Kaapi + ngrok) | confirm provider creds and the public callback URL |

## Login

- Login is behind **reCAPTCHA**; the Playwright MCP uses its **own Chromium profile** with no
  shared session, so it always starts at `/login`.
- **You cannot solve reCAPTCHA.** Ask the user to log in manually in the Playwright window, then
  continue. Never request or store credentials.
- Feature flags are read from `localStorage` **at login**. If a gated control is missing, the flag
  may be off for the org, or the user logged in before it was enabled → **BLOCKED**, not FAIL.

## Playwright MCP cheat-sheet

Tools are **deferred** — load each schema before first use:
`ToolSearch` with `select:mcp__playwright__browser_snapshot` (comma-separate to load several).

| Tool | Use |
|------|-----|
| `browser_navigate` | go to a URL |
| `browser_snapshot` | accessibility tree with `ref=` handles — **re-run after every DOM change** |
| `browser_click` | click; pass the latest `ref` as `target` |
| `browser_type` | type into one field |
| `browser_fill_form` | fill many fields in one call (preferred for multi-field forms) |
| `browser_select_option` | choose from a `combobox`/`select` |
| `browser_wait_for` | `text` / `textGone` / `time` — use for async, not blind sleeps; time the wait |
| `browser_take_screenshot` | capture evidence (saved under `.playwright-mcp/`); `Read` the PNG to verify |
| `browser_console_messages` | diagnose errors (separate pre-existing from action-triggered) |
| `browser_network_requests` | inspect GraphQL / REST calls + timing for latency grading |

Rules: refs are valid only for the snapshot they came from; prefer accessible names/roles over CSS
selectors; the manual login happens in the same Chromium window you drive.

## Scenario matrix

Don't test only the happy path. For any feature, enumerate at least:

| Type | What to cover |
|------|---------------|
| **Happy** | each primary success path, end-to-end, result rendered |
| **Failure** | empty/invalid required fields (validation); backend/GraphQL error; async error / failed-status; async **timeout**; acting **out of order** (use a result before producing it) |
| **Edge** | very long input; special characters / emoji; language switching; retry after failure; cancel / close mid-flow; double-submit; feature-flag-off (→ BLOCKED) |

Each row → one screenshot, one latency reading, one Vitest test, one Cypress step.

## Latency budget

Time from the **triggering action** to the **observable result** (wall clock around the
`browser_wait_for`, cross-checked with `browser_network_requests`):

| Grade | Threshold | Meaning |
|-------|-----------|---------|
| ✅ instant | ≤ 1s | feels immediate (clicks, validation, local UI) |
| ✅ ok | ≤ 3s | acceptable for a network round-trip |
| ⚠️ slow | 3–10s | flag as an issue; hypothesize a cause (waterfall, poll cadence, render, N+1) |
| ❌ fail | > 10s | latency bug — content should not take this long; root-cause + propose fix |

For genuinely long async work (LLM generation), the budget applies to **feedback** (spinner/progress
must be immediate) and to **each poll cadence**, not to the model's total think time — but still
record the end-to-end duration and whether the wait was communicated to the user.

## Results sheet

Write `results.csv` + `results.md` (same columns) into `test-runs/<feature>-<YYYYMMDD-HHMM>/`:

| Col | Meaning |
|-----|---------|
| `#` | scenario number |
| `Scenario` | short name |
| `Type` | happy / failure / edge |
| `Action` | the user-level action(s) exercised |
| `Expected` | what should happen |
| `Observed` | what actually happened in the UI |
| `Status` | ✅ pass / ❌ fail / ⚠️ pass-with-issue / ⛔ blocked |
| `Latency` | duration + grade (e.g. `4.2s ⚠️ slow`) |
| `Screenshot` | path under `screenshots/` |
| `Issue / root cause` | bug or latency finding + hypothesis (or `—`) |
| `Suggested fix` | concrete fix (or `—`) |
| `Fixed?` | `test ✅` (test code applied) / `proposed` (app code, awaiting OK) / `—` |

Header block: feature, frontend/backend commit, login user role, date, totals (pass/fail/blocked).
Print the Markdown table inline in the final reply.

Screenshots: Playwright MCP writes to `.playwright-mcp/`; copy the per-scenario PNGs into the run's
`screenshots/` folder named `<NN>-<scenario-slug>-<pass|fail>.png`.

## Generating FE tests

The frontend (`../glific-frontend`) tests with **Vitest** + Testing Library. Commands:

```bash
cd ../glific-frontend
yarn test:no-watch <path>     # run one spec
yarn test:coverage            # full run with coverage
yarn cy:run                   # cypress run (once scaffolded)
```

### Vitest (unit / integration)

- Mirror the existing pattern: `MockedProvider` (from `@apollo/client/testing`) + scenario mocks in
  `src/mocks/`. The Prompt Generator already has `src/containers/Assistants/CreateAssistant/PromptGeneratorModal.test.tsx`
  and `src/mocks/PromptGenerator.ts` (`promptGeneratorSuccessMocks`, `…ErrorMocks`,
  `…FailedStatusMocks`, `…ReadyEmptyMocks`, `…PollFailedMocks`) — **reuse these**, add mocks only for
  uncovered scenarios.
- Async/polling components use a **fake clock** (`vi.useFakeTimers`) and advance deterministically —
  follow the helper in the existing test rather than wall-clock waits.
- One `test(...)` per scenario row; assert the rendered success state or the error message.

### Cypress (e2e) — scaffold if absent

If there's no `cypress.config.ts` / `cypress/` dir, scaffold it:

```
glific-frontend/
  cypress.config.ts            # e2e baseUrl https://glific.test:3000, chromeWebSecurity:false
  cypress/
    support/{e2e.ts,commands.ts}
    e2e/<feature>.cy.ts        # one spec per feature
```

- Add `cypress` to devDependencies (the repo already has `cypress-split` + a `cy:run` script).
- Because login is behind reCAPTCHA, gate the e2e behind a programmatic session (seed the auth token
  / `localStorage` via a `cy.login()` custom command) or document it as requiring a logged-in session
  — never automate reCAPTCHA.
- Cover the happy + failure scenarios; stub GraphQL with `cy.intercept` for deterministic failure /
  timeout cases.
- Keep specs out of the way of CI until the harness is wired into the pipeline; note this in the sheet.

## Prompt Generator — full scenario set (default feature)

End-to-end path: UI wizard → GraphQL `generatePrompt` mutation → backend → **Kaapi** async generation
→ poll to ready → prompt rendered → inserted into the assistant form. Kaapi creds **and a public
callback tunnel** (e.g. ngrok) must be configured, or generation hangs/fails → BLOCKED.

Component: `src/containers/Assistants/CreateAssistant/PromptGeneratorModal.tsx` (modal polls every
**2s**, **20s** timeout). The 9 wizard answers:

| # | Field | Example value |
|---|-------|---------------|
| 1 | Name (org + bot) | `SNEHA DIDI, by org. SNEHA` |
| 2 | Core purpose | early childhood healthcare, pregnancy, government schemes |
| 3 | Audience | pregnant/new mothers, urban slums, low literacy, Hindi/Hinglish |
| 4 | Language | match user; default Hinglish, Hindi script if user writes Hindi |
| 5 | Tone | simple, warm, friendly — like a caring health worker |
| 6 | Response format | max 3 short sentences; numbered steps for instructions |
| 7 | Off-limits | no medical diagnosis, no prescriptions, no legal advice |
| 8 | Fallback | exact "Sorry, I'm not sure…" message |
| 9 | Escalation | Reply AGENT / call helpline number |

Live path: **AI toolkit → AI Assistant** (`/assistants`) → **Create New Assistant** (`/assistants/add`)
→ confirm **"Generate with AI (BETA)"** next to *Instructions (Prompt)* (missing → BLOCKED, flag off)
→ open the 9-question wizard.

Scenarios to run (each → screenshot + latency + Vitest + Cypress row):

| # | Type | Scenario | Expected |
|---|------|----------|----------|
| 1 | happy | Fill all 9 → **Generate** → poll to ready | preview renders, weaves in the 9 answers incl. **exact** fallback |
| 2 | happy | **Use this Prompt** (optionally after editing the preview) | "Prompt added to Instructions" toast; Instructions textarea populated |
| 3 | failure | **Generate** with gaps (required answers empty) | validation blocks generation, jumps to first gap (no mutation fires) |
| 4 | failure | Mutation returns error | error state with **Retry**; no preview |
| 5 | failure | Mutation returns a failed status directly | error state shown |
| 6 | failure | Ready response with **no prompt text** | treated as failure (not a blank success) |
| 7 | failure | Polling resolves to a failed status | error state shown |
| 8 | failure | Generation exceeds the 20s timeout | timeout error, not an infinite spinner |
| 9 | edge | **Clear** resets all answers | all 9 fields empty |
| 10 | edge | Very long / special-character answers | accepted; no layout break / crash |
| 11 | edge | Re-generate after a successful generation | new preview replaces the old |

Latency focus for the Prompt Generator: the **spinner/"Generating…" must appear immediately** on
click (≤1s); grade the end-to-end generation time and whether each 2s poll is communicated; flag a
preview that appears only after a long blank gap (no feedback) as a UX latency issue.

Vitest: 1–7, 9 are already covered in `PromptGeneratorModal.test.tsx` (reuse/extend); add 8, 10, 11.
Cypress: cover 1–2 (happy) + 3–4 (validation/error via `cy.intercept`) as the e2e smoke.
PASS = the live UI result observed + screenshot. BLOCKED = button absent (flag) or generation never
resolves (Kaapi creds / callback tunnel).
