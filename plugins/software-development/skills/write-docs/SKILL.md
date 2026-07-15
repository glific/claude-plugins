---
name: write-docs
description: Generate, update, or review Glific user-facing documentation in the glific/docs repo. Use when a developer asks to document a feature, write a doc page, update existing docs, or refresh docs after a PR ships in glific-frontend.
---

# Write Docs (Glific user-facing documentation)

Reference and workflow for generating Glific's user-facing Docusaurus documentation. This skill
operates in the `glific/docs` repo, checked out with `glific-frontend` as a sibling directory
(`../glific-frontend/` relative to `glific/docs`).

## When to use

Trigger when the user asks to:
- Generate or update a doc page for a feature ("write docs for Flows", "document HSM Templates")
- Refresh docs after a PR ships ("update docs for #142 in glific-frontend")
- Review existing docs for completeness or accuracy

Start by reading [references/workflow.md](references/workflow.md).

## IA Principles

The docs have 8 top-level sections. Each has a different audience and purpose — read
[references/sections.md](references/sections.md) before placing any content.

### Primary audience

NGO program managers and field workers. They are **not technical users**. They need:
- Plain language explanations
- Step-by-step instructions with screenshots
- To know what something does and how to use it — not how it works internally

### Frontend code location

The Glific frontend lives at `../glific-frontend/` relative to the `glific/docs` repo.

| Path | What it contains |
|------|-----------------|
| `../glific-frontend/src/containers/` | Feature-level UI components (one dir per feature) |
| `../glific-frontend/src/routes/AuthenticatedRoute/AuthenticatedRoute.tsx` | All route paths (maps feature name → URL) |
| `../glific-frontend/src/graphql/queries/` | GraphQL queries (understand data a feature displays) |

## File index

| File | Purpose |
|------|---------|
| [references/workflow.md](references/workflow.md) | Step-by-step process from research to published markdown |
| [references/sections.md](references/sections.md) | All 8 doc sections: audience, purpose, what belongs where |
| [references/style-writing.md](references/style-writing.md) | Audience, voice, instructions format, anti-patterns |
| [references/style-page.md](references/style-page.md) | Page structure templates for each section type |
| [references/style-images.md](references/style-images.md) | Image naming, directory mapping, static/img/ conventions |
| [references/screenshots.md](references/screenshots.md) | Playwright recipe system for automated screenshots |
