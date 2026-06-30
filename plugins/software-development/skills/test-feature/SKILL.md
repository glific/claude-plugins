---
name: test-feature
description: >-
  Run a comprehensive live end-to-end browser test of a Glific frontend feature via the Playwright
  MCP against the running local stack. Exercises every scenario (happy + failure + edge), measures
  latency against budgets, captures a screenshot per scenario (success AND error), generates the
  matching FE tests (Vitest unit + Cypress e2e), and emits a results sheet (CSV + Markdown) plus a
  screenshots folder. Use when the user asks to test/smoke-test a feature in the browser, "run the
  <feature> flow", or invokes test-feature. Default scenario is the Prompt Generator wizard.
disable-model-invocation: true
---

# Test a Feature (comprehensive live browser E2E)

End-to-end browser test of a **Glific frontend** feature against the **running local stack**,
driven through the **Playwright MCP**. Goes well beyond a single happy path: it exercises **every
scenario** (happy, failure, edge), **measures latency** against budgets, captures a **screenshot
per scenario** (success *and* error), **generates the FE tests** for each scenario (Vitest unit +
Cypress e2e), and emits a **results sheet** so the run is auditable and trustworthy.

This skill is the **on-demand trigger**. For larger or autonomous runs, delegate to the
**`browser-tester`** agent (bundled in this plugin's `agents/`) — same contract, can run in the
background. See [reference.md](reference.md) for stack URLs, the Playwright-MCP cheat-sheet, the
scenario-matrix + latency + sheet schemas, the FE-test generation guide, and the Prompt Generator
walkthrough.

## Argument

`/test-feature <feature>` — the feature to test. If omitted, default to the **Prompt Generator**.
Examples: `prompt-generator`, `assistants`, `flows`, `contacts-import`.

## What you produce (every run)

1. A **scenario matrix** — happy + failure + edge cases for the feature (don't stop at the happy path).
2. A **screenshot per scenario** — the success state on pass, the error state on fail (so the user can
   *see* every outcome, not take your word for it).
3. **Latency measurements** per scenario, graded against the budget (see [reference.md](reference.md)
   § Latency). Anything slow is flagged as an issue with a root-cause hypothesis.
4. The **FE tests** for each scenario: **Vitest** unit/integration tests (mock GraphQL) **and**
   **Cypress** e2e specs. Scaffold Cypress in `glific-frontend` if it isn't set up yet.
5. A **results sheet** — `results.csv` + `results.md` written to the run folder, one row per
   scenario: action, expected, observed, status, latency, screenshot, issue/root-cause, suggested
   fix, fixed?.

## Hard rules

- **Never** ask for, type, or store the user's credentials. Login is behind reCAPTCHA and the
  Playwright Chromium has no session — when you reach `/login`, **stop and ask the user to log in
  manually** in the Playwright window, then continue on their confirmation.
- **Fix policy (apply test code only):** you MAY create/modify **test artifacts** — Vitest specs,
  Cypress specs, mocks, fixtures, Cypress scaffolding. You may **not** edit **application code**
  (FE components, GraphQL, backend) to "make it pass." When you find an app bug or a latency
  problem, write the root cause + a concrete proposed fix into the sheet and **ask** before
  touching app code.
- **Never** claim a scenario passed unless you **saw its result render in the UI** and captured the
  screenshot. Mocked or short-circuited browser paths do not count as a live pass (the Vitest layer
  is separate).
- **Do not** try to fix the user's machine silently. If the stack is down, report what to start.
- Every scenario gets a screenshot **whether it passes or fails** — a failing scenario with no
  error screenshot is an incomplete result.

## Progress checklist

```
- [ ] Phase 1 — Verify stack is up
- [ ] Phase 2 — Open app + ensure logged in
- [ ] Phase 3 — Build the scenario matrix (happy + failure + edge)
- [ ] Phase 4 — Execute each scenario: drive, time, screenshot, record
- [ ] Phase 5 — Generate FE tests (Vitest + Cypress) for each scenario
- [ ] Phase 6 — Emit the results sheet
- [ ] Phase 7 — Report (per-scenario PASS/FAIL/BLOCKED + issues + fixes)
```

---

## Phase 1 — Verify the stack is up

Before any clicking, confirm the app responds (see [reference.md](reference.md) § Stack):

```bash
curl -sk -o /dev/null -w "frontend %{http_code}\n" https://glific.test:3000
curl -sk -o /dev/null -w "backend  %{http_code}\n" https://glific.test:4001
curl -s  -o /dev/null -w "local    %{http_code}\n" http://localhost:4000
```

If anything is not `200`/`302`, **stop and tell the user what to start** (Vite, Phoenix,
`yarn floweditor` for stale floweditor chunks, Stripe key). See the troubleshooting table in
[reference.md](reference.md). A live run needs the **backend up** — failure/async scenarios depend on
real GraphQL responses.

## Phase 2 — Open the app and ensure logged in

1. Load each Playwright MCP tool's schema with `ToolSearch` (`select:mcp__playwright__browser_*`)
   before first use — they are deferred.
2. `browser_navigate` to `https://glific.test:3000` → `browser_snapshot`.
3. If the URL is `/login`: **ask the user to log in manually** in the Playwright window. Wait for
   their confirmation, then re-snapshot to confirm you're on the dashboard.

## Phase 3 — Build the scenario matrix

Enumerate the scenarios **before** driving — don't improvise only the happy path. Cover at least:

- **Happy:** the primary success path(s) end-to-end.
- **Failure:** validation errors (empty/invalid required fields), backend/GraphQL error,
  async error/failed-status, async timeout, acting out of order (e.g. "Use result" before generating).
- **Edge:** boundary inputs (very long text, special characters, language switching), repeat/retry,
  cancel/close mid-flow, feature-flag-off (BLOCKED, not FAIL).

Write the matrix down as the skeleton of the results sheet (one row each). See
[reference.md](reference.md) § Scenario matrix for templates and the Prompt Generator's full set.

## Phase 4 — Execute each scenario (drive · time · screenshot · record)

For every scenario, run the loop and **record a sheet row**:

1. `browser_snapshot` for fresh `ref=` handles (**re-snapshot after every DOM-changing action**).
2. Interact via `browser_click` / `browser_type` / `browser_fill_form` / `browser_select_option`,
   passing the latest `ref` as `target`.
3. **Time it.** Note the wall-clock before the triggering action and after the observable result
   appears; for async, wrap `browser_wait_for` (`textGone: "Generating…"`, etc.) and record how long
   the wait took. Cross-check with `browser_network_requests` timings. Grade against the latency
   budget ([reference.md](reference.md) § Latency) — `>10s` or "not instant when it should be" is an
   **issue**, not a pass-with-shrug.
4. **Assert** by snapshotting and checking the expected text/element (success) or the expected error
   message/state (failure).
5. **Screenshot every outcome:** `browser_take_screenshot` to the run folder and `Read` it back to
   confirm visually — the success view on pass, the **error view on fail**. Name it
   `<NN>-<scenario-slug>-<pass|fail>.png`.
6. On failure or slowness, pull `browser_console_messages` + `browser_network_requests`; separate a
   **pre-existing** console error from one your action caused, and capture the decisive line.
7. For a latency or bug finding, write a **root-cause hypothesis + concrete fix** into the row
   (e.g. "2s poll interval + 6 polls before ready → raise poll cadence / add optimistic spinner").
   Apply only if it's **test code**; otherwise propose and ask.

## Phase 5 — Generate the FE tests (Vitest + Cypress)

For each scenario, produce the matching automated test in `glific-frontend` (you MAY write these):

- **Vitest unit/integration** — mirror the repo's pattern (`MockedProvider` + the scenario mocks in
  `src/mocks/`). Extend the existing `*.test.tsx` next to the component; reuse existing mocks, add
  new ones for any uncovered scenario. Run `yarn test:no-watch <file>` and record pass/fail + timing.
- **Cypress e2e** — a `.cy.ts` spec per feature covering the happy + failure scenarios against the
  running app. If `glific-frontend` has **no Cypress harness** (no `cypress.config.ts` / `cypress/`),
  **scaffold it** (config, `cypress/support`, `cypress/e2e`, add `cypress` devDep) — see
  [reference.md](reference.md) § Cypress.

Record, per scenario, which test(s) now cover it and whether they pass.

## Phase 6 — Emit the results sheet

Write to a run folder `test-runs/<feature>-<YYYYMMDD-HHMM>/` (stamp from `date`):

- `results.csv` and `results.md` — same columns (see [reference.md](reference.md) § Results sheet):
  `# | Scenario | Type | Action | Expected | Observed | Status | Latency | Screenshot | Issue / root cause | Suggested fix | Fixed?`
- `screenshots/` — the per-scenario PNGs (Playwright MCP writes to `.playwright-mcp/`; copy/reference
  them here).
- A short header: feature, stack/commit, login user role, totals (pass/fail/blocked), date.

Print the Markdown table back in your reply so the user sees the sheet inline.

## Phase 7 — Report

State the verdict and evidence:

- **Per-scenario** PASS / FAIL / BLOCKED with the one-line observation and screenshot path.
- **Issues** (bugs + latency) with root cause and the proposed fix; mark which fixes you applied
  (test code) vs. which await the user's OK (app code).
- **Tests generated** — the Vitest + Cypress files added/updated and their status.
- **Sheet location** — the `test-runs/...` folder, plus the inline Markdown table.
- **Anomalies** (pre-existing console errors, flaky waits) flagged separately from the verdicts.

---

## When to ask the user

- At the login page (manual reCAPTCHA login).
- Stack component down or misconfigured (which one + how to start it) — esp. the backend, without
  which failure/async scenarios can't be exercised.
- A gated control is missing (feature flag may be off for the org) → BLOCKED, not FAIL.
- Before editing **application** code to fix a bug/latency issue you found (test code you may apply).

## Related

- **`browser-tester`** agent — autonomous / background runs of this same contract.
- [reference.md](reference.md) — stack URLs, Playwright-MCP cheat-sheet, scenario-matrix + latency +
  sheet schemas, Vitest/Cypress generation guide, Prompt Generator walkthrough.
