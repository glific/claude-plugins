---
name: monthly-blog
description: >-
  Generate Glific's monthly release blog (the "Bug Fixes, Enhancements &
  Documentation Updates" post) from the GitHub issues closed and docs PRs merged
  in a given month. Use this whenever someone asks to write, draft, generate, or
  update the monthly blog, the release notes, the changelog post, or the
  "bug fixes and enhancements" blog for Glific — even if they just name a month
  (e.g. "do the May blog", "write up what shipped in June"). Pulls the raw
  material from GitHub, filters out internal engineering work, and writes the
  draft in Glific's house format ready to paste into WordPress.
---

# Glific monthly blog

Turn a month of GitHub activity into the published-style release blog. The script
does the fetching; you do the curation and writing. A human reviews before
publishing, so surface what you left out.

## Workflow

### 1. Settle the month
Confirm which month the post covers as `YYYY-MM`. If the user didn't say, assume
the **previous** calendar month and state that assumption.

### 2. Fetch the raw material
You need three things for the chosen month: closed **issues** from `glific` and
`glific-frontend` (→ bug fixes & enhancements) and merged **PRs** from `docs`
(→ documentation). Glific's repos are public, so no login is required. Pick the
retrieval method your environment supports:

**(a) If you can run code with internet access** (e.g. Cowork, Claude Code, or a
code sandbox with egress) — run the bundled script, which handles pagination:

```bash
python scripts/fetch_month.py --month YYYY-MM
```

**(b) Otherwise (e.g. a normal free/Pro chat)** — fetch these GitHub API URLs with
your web/fetch tool and read the `items` array of each. Replace `START` and `END`
with the first and last day of the month (e.g. `2026-05-01` and `2026-05-31`):

- `https://api.github.com/search/issues?q=repo:glific/glific is:issue is:closed closed:START..END&per_page=100`
- `https://api.github.com/search/issues?q=repo:glific/glific-frontend is:issue is:closed closed:START..END&per_page=100`
- `https://api.github.com/search/issues?q=repo:glific/docs is:pr is:merged merged:START..END&per_page=100`

For each item keep `title`, `number`, `labels`, `body`, and `html_url`.

**(c) If neither works** — give the user those three URLs (with the dates filled
in) and ask them to open each in a browser and paste back what they see. Work
from whatever they paste.

Either way, you end up with the same raw list. Move on to filtering and writing.

### 3. Read the house style
Read `references/blog.md` for the exact output format, the include/exclude
rules, the voice, and a worked example. Follow it closely — the published posts
are consistent and tightly curated.

### 4. Curate and write
From the fetched items:
- Keep only user-facing changes; set internal engineering work aside (see the
  exclude list in blog.md). When unsure, leave it out.
- Group related kept issues into a few themes, each with a benefit title, a
  short paragraph, and "Highlights" bullets (one reworded issue each).
- Build the "Documentation Update" section from the substantive doc PRs only.
- Write everything in Glific's plain, benefit-led voice. Never invent a feature
  or capability that isn't in the issue/PR text.

### 5. Deliver
Output the finished post as Markdown (it pastes cleanly into WordPress, keeping
bold and bullets). Then, below the draft, add a short **"Left out as internal
work"** list — issue numbers with a one-word reason — so the reviewer can confirm
nothing user-facing was dropped. Remind them the wording is a first draft to
review, not final copy.

## Notes
- Documentation comes from merged docs **PRs**, not issues — new docs ship as PRs.
- The blog is intentionally short: a handful of themes, not every closed issue.
- If a month is unusually busy, it's fine to suggest splitting into two posts.