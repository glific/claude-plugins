# software-development

Engineering workflows for the Glific team. Today it ships the **end-to-end browser tester** for
the Glific frontend.

## What's inside

| Component | Type | What it does |
|-----------|------|--------------|
| `test-feature` | skill | On-demand, comprehensive live E2E test of a Glific frontend feature via the **Playwright MCP**: builds a scenario matrix (happy + failure + edge), measures latency against budgets, captures a screenshot per scenario (success **and** error), generates the matching FE tests (Vitest + Cypress), and emits a results sheet (CSV + Markdown). Invoke with `/test-feature <feature>` (defaults to the Prompt Generator). |
| `browser-tester` | agent | The autonomous/background version of the same contract — launch it to fully test or regression-test a feature against the live local stack before review or release. |

## Requirements

- The **Playwright MCP** must be connected (the skill/agent drive a real Chromium through it).
- The **local Glific stack** must be running — frontend `https://glific.test:3000` and backend
  `https://glific.test:4001` / `http://localhost:4000`. The skill verifies this first and tells you
  what to start if it's down.
- **Login is behind reCAPTCHA** — the tester pauses and asks you to log in manually in the
  Playwright window; it never handles credentials.

## Usage

```
/test-feature                 # default: Prompt Generator wizard
/test-feature prompt-generator
/test-feature assistants
```

Or ask Claude to "use the browser-tester agent to test <feature>".

## Fix policy

The tester may create/modify **test code** (Vitest specs, Cypress specs, mocks, fixtures). It will
**not** edit application code to make a scenario pass — bugs and latency findings are written into
the results sheet with a proposed fix and surfaced for your decision.

## Result cache (saves tokens on re-runs)

Driving the browser is the expensive part, so the skill keeps a per-feature **result cache** in the
project repo at `.claude/test-feature/` (`fingerprint.sh`, `watch/<feature>.txt`, `manifest.json`).
Before testing, it fingerprints the feature's source files; if they're **unchanged** since the last
run it reuses the stored scenarios instead of re-driving the browser. A teammate re-running the same
feature on unchanged code gets the cached sheet back instantly; they can still name a specific
scenario/edge case to actually run, or force a full re-run. If the feature's code changed, the
fingerprint differs and it re-tests. (These files live in the **target project repo**, committed so
the team shares one tested-scenario history — not in this plugin.)

## Output

A run writes `test-runs/<feature>-<timestamp>/` with `results.md`, `results.csv`, and a
`screenshots/` folder (one PNG per scenario), and prints the results table inline.

See [skills/test-feature/SKILL.md](skills/test-feature/SKILL.md) and
[skills/test-feature/reference.md](skills/test-feature/reference.md) for the full contract,
scenario matrix, latency budget, results-sheet schema, and the Vitest/Cypress generation guide.
