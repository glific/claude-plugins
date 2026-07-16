# documentation

Writing user-facing documentation for `glific/docs`.

## What's inside

| Component | Type | What it does |
|-----------|------|--------------|
| `write-docs` | skill | Generates or updates Glific's user-facing Docusaurus docs in `glific/docs`. Researches the feature in `glific-frontend` (locally if checked out, or via the public GitHub repo otherwise) or a shipped PR, places the page in the right IA section, captures screenshots via a Playwright-driven recipe system, and writes the page following the docs style guide. Use when asked to "write docs for Flows" or "update docs for #142". |

## Requirements

- Run this skill from a checkout of **`glific/docs`** — it reads and writes `docs/`, `static/img/`,
  and `scripts/recipes/` relative to that repo's root.
- Frontend source is read either from a local `../glific-frontend` sibling checkout, or directly
  from the public `glific/glific-frontend` GitHub repo via `gh api` if no local checkout exists —
  no local setup is required either way.
- To capture screenshots: Playwright installed in `glific/docs`
  (`yarn add --dev playwright js-yaml && npx playwright install chromium`), and credentials for a
  **test/demo account** (URL, phone, password) on any reachable Glific instance — local dev or a
  staging/demo deployment. The skill asks for these directly; it doesn't require a local backend
  or frontend stack running.

## Usage

Ask Claude, e.g.:
- "Write docs for Flows"
- "Update docs for #142 in glific-frontend"
- "Review the HSM Templates doc for accuracy"

The skill proposes a placement plan (doc path, image directory, screenshot recipe) and asks you to
confirm before writing anything.

## Output

A new/updated page in `docs/{section}/`, screenshots in `static/img/{feature}/`, and a Playwright
recipe in `scripts/recipes/{feature-slug}.yaml` — all meant to be committed together as one PR in
`glific/docs`.

See [skills/write-docs/SKILL.md](skills/write-docs/SKILL.md) for the full workflow, IA rules, style
guide, and screenshot recipe format.
