# Documentation Workflow

Process to generate or update a doc page — from research to published markdown. All paths below
are relative to the `glific/docs` repo root.

## 1. Parse Input & Determine Mode

**Mode A — Feature Name** (default): input is a feature name (e.g. "Flows", "HSM Templates", "Speed Send").

**Mode B — PR Number**: input matches `#\d+`, a GitHub PR URL for `glific/glific-frontend`, or a commit range.

## 2. Load Reference Files

Read what's needed for the task:
- `sections.md` — to determine which of the 8 sections the content belongs in
- `style-writing.md`, `style-page.md` — for writing conventions and templates
- `style-images.md`, `screenshots.md` — for image handling and screenshot recipes

## 3. Research the Feature

**Read all source from GitHub. Never read it from a local checkout, even if one exists on this
machine.** A local clone is on some working branch with uncommitted changes; the docs must describe
what shipped on the default branch.

Two repos matter:

- `glific/glific-frontend` — the UI: screens, labels, fields, routes
- `glific/glific` — the backend: limits, statuses, validations, org flags

Fetch a file (no cloning, no `base64 -d` step):

```bash
gh api repos/glific/glific-frontend/contents/{path} -H 'Accept: application/vnd.github.raw'
```

List a directory before guessing at filenames:

```bash
gh api repos/glific/glific-frontend/contents/{dir} --jq '.[].name'
```

Find where something lives when you don't know the path:

```bash
gh search code 'templateV2Enabled' --repo glific/glific-frontend --json path --jq '.[].path'
```

Read a specific released version by appending `?ref={branch-or-tag}` to a contents URL. Omit it to
get the default branch, which is what you want unless the user names a release.

If `gh` is not installed or not authenticated (`gh auth status`), stop and tell the user — do not
silently fall back to a local checkout.

**Mode A — Feature Name:**
1. Find the container: `src/containers/{FeatureName}/` in `glific/glific-frontend`
2. Read the main list and form components (e.g. `FlowList.tsx`, `Flow.tsx`) to understand what the UI shows and does
3. Read `src/routes/AuthenticatedRoute/AuthenticatedRoute.tsx` to find the URL route, and
   `src/config/menu.ts` to see the left-menu path and any org flag gating the feature
4. Check existing docs in `docs/` for the feature (search for the feature name in file names and content)
5. Read `src/graphql/queries/{Feature}.ts` to understand what data the feature displays
6. **Check the backend for anything the UI only implies** — look in `glific/glific` when the doc
   needs to state a hard limit, what a status value means, or what happens after submission. Don't
   infer a number from a UI placeholder; confirm it in the backend.

   Backend filenames are not predictable — HSM templates live in `session_template_type.ex` while
   interactive messages live in `interactive_template_types.ex`. List or search rather than guess:
   ```bash
   gh api repos/glific/glific/contents/lib/glific_web/schema --jq '.[].name' | grep -i {keyword}
   gh api repos/glific/glific/contents/lib/glific --jq '.[].name' | grep -i {keyword}
   ```
7. **Verify against the running app, not just the source** — code comments can lag reality but a
   live screenshot won't. Where feasible, confirm what you read in code (button labels, which
   dialogs still fire, which options are visible) by loading the actual page during the screenshot
   step (step 5 below) before writing anything.

**Mode B — PR Number:**
1. `gh pr diff #PR_NUMBER --repo glific/glific-frontend` to see what changed
2. Identify affected containers from the changed file paths
3. Read the changed files in full from GitHub to understand new behavior
4. Check whether the PR has a backend counterpart in `glific/glific` (`gh pr list --repo glific/glific --search {feature}`) — a new field or limit usually lands there too
5. Check existing docs for the affected area

## 4. Determine Placement

Use `sections.md` to map the feature to the right section. For Product Features, check the existing numbered file list to determine the next number.

Print the placement plan and **ask the user to confirm** before writing anything:

```
Placement plan:
- Doc: docs/{section}/{filename}.md
- Images: static/img/{feature}/
- Action: {new page | update existing | add sub-page to existing dir}
- Recipe: scripts/recipes/{feature-slug}.yaml ({exists | needs creating})
```

## 5. Capture Screenshots

**Ask the user for credentials — URL, phone, password — before the first screenshot.** Point the
script at the live/staging URL they give you, never at a local stack, and never read the values
from `.env`. Ask once per session and reuse the same values for later runs. Read `screenshots.md`
before asking; it has the exact wording and the security rules.

Check for an existing recipe at `scripts/recipes/{feature-slug}.yaml`.

**Recipe missing** → create it. Read `screenshots.md` for the exact format. Find `data-testid` values
in the relevant container files on GitHub.

**Recipe exists** → review it against what you read in step 3. Add or update flows for any user path the doc will reference. Fix selectors if the UI has changed.

Then run, passing the credentials the user just gave you inline:
```bash
GLIFIC_URL={url} GLIFIC_PHONE={phone} GLIFIC_PASSWORD={password} \
  node scripts/screenshot.js {feature-slug}
```

Verify all expected files land in `static/img/{feature}/`. Iterate on any selector that misses — never ship a doc that references a non-existent image.

Use `:::info Screenshot coming soon` only when the feature requires backend data that cannot be seeded (e.g., live WhatsApp delivery receipts, billing pages).

## 6. Write Documentation

Choose the correct template from `style-page.md` based on the section. Save to the confirmed path from step 4.

Follow `style-writing.md` for voice and format. The most common mistake: writing for a technical audience. Imagine explaining this to an NGO field worker on their first day.

## 7. Validate

- [ ] All images referenced in the doc exist in `static/img/{feature}/`
- [ ] Image paths use `/img/` prefix (Docusaurus convention), not `static/img/`
- [ ] No new GitHub CDN image URLs (only old untouched pages keep those)
- [ ] Page header has the read-time badge and difficulty level
- [ ] Page matches the correct section template from `style-page.md`
- [ ] Numbered file prefix is correct and doesn't conflict with existing files

## 8. Print Next Steps

```
Documentation generated:
- Doc: docs/{section}/{filename}.md
- Images: static/img/{feature}/ ({N} screenshots captured)
- Recipe: scripts/recipes/{feature-slug}.yaml

Next:
1. Preview: yarn start  (in glific/docs)
2. Review at http://localhost:3000/docs/{slug}
3. Commit doc + recipe + screenshots together, then open a PR
```
