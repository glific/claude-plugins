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

**Don't assume a local `glific-frontend` checkout exists.** Check first:

```bash
test -d ../glific-frontend && echo "local checkout" || echo "no local checkout — use GitHub"
```

- **Local checkout present** → read files directly at `../glific-frontend/...`.
- **No local checkout** → read the same paths from the public repo instead, no cloning needed:
  ```bash
  gh api repos/glific/glific-frontend/contents/{path} --jq '.content' | base64 -d
  ```
  or browse `gh api repos/glific/glific-frontend/contents/{dir} --jq '.[].path'` to list a directory first.
  This works for anyone with `gh` installed and no other local setup — treat it as the default,
  not a fallback of last resort.

**Mode A — Feature Name:**
1. Find the container: `src/containers/{FeatureName}/` (local path or `gh api` — see above)
2. Read the main list and form components (e.g. `FlowList.tsx`, `Flow.tsx`) to understand what the UI shows and does
3. Read `src/routes/AuthenticatedRoute/AuthenticatedRoute.tsx` to find the URL route
4. Check existing docs in `docs/` for the feature (search for the feature name in file names and content)
5. Optionally read `src/graphql/queries/{Feature}.ts` to understand what data the feature displays
6. **Verify against the running app, not just the source** — code comments can lag reality but a
   live screenshot won't. Where feasible, confirm what you read in code (button labels, which
   dialogs still fire, which options are visible) by loading the actual page during the screenshot
   step (step 5 below) before writing anything.

**Mode B — PR Number:**
1. `gh pr diff #PR_NUMBER --repo glific/glific-frontend` to see what changed
2. Identify affected containers from the changed file paths
3. Read the changed files in full to understand new behavior
4. Check existing docs for the affected area

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

Check for an existing recipe at `scripts/recipes/{feature-slug}.yaml`.

**Recipe missing** → create it. Read `screenshots.md` for the exact format. Find `data-testid` values in the relevant container files.

**Recipe exists** → review it against what you read in step 3. Add or update flows for any user path the doc will reference. Fix selectors if the UI has changed.

Then run:
```bash
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
