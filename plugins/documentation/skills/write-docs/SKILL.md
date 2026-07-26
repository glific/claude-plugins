---
name: write-docs
description: Generate, update, or review Glific user-facing documentation in the glific/docs repo, reading product source from the glific/glific-frontend and glific/glific repos on GitHub. Use when a developer asks to document a feature, write a doc page, update existing docs, or refresh docs after a PR ships.
---

# Write Docs (Glific user-facing documentation)

Reference and workflow for generating Glific's user-facing Docusaurus documentation. This skill
writes into the `glific/docs` repo and reads all source code straight from GitHub.

## Source of truth: GitHub, never a local checkout

**Always read product source from the official GitHub repos — `glific/glific-frontend` and
`glific/glific`.** Never read it from a sibling directory, a local clone, or any path on this
machine, even when one exists.

A local checkout sits on whatever branch the developer was last working on, with uncommitted
edits and stale files. Docs describe what shipped, so the default branch on GitHub is the only
source that matches what NGO users actually see.

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

### Where the code lives

Read every path below from GitHub — see [references/workflow.md](references/workflow.md) for the
exact `gh api` commands.

**Frontend — `glific/glific-frontend`** (the UI the docs describe):

| Path | What it contains |
|------|-----------------|
| `src/containers/` | Feature-level UI components (one dir per feature) |
| `src/routes/AuthenticatedRoute/AuthenticatedRoute.tsx` | All route paths (maps feature name → URL) |
| `src/config/menu.ts` | Left-menu entries, and which features are hidden behind an org flag |
| `src/graphql/queries/` | GraphQL queries (understand data a feature displays) |
| `src/common/constants.ts` | Shared limits and option lists (button types, media types) |

**Backend — `glific/glific`** (the rules behind the UI):

| Path | What it contains |
|------|-----------------|
| `lib/glific/` | Domain logic per feature — the real limits, defaults, and validations |
| `lib/glific_web/schema/` | GraphQL types, so you can see every field a feature accepts |
| `lib/glific/providers/` | WhatsApp provider behaviour (Gupshup), e.g. template submission |

Backend filenames don't follow one convention — list the directory and grep for a keyword instead
of guessing a path.

Reach for the backend when a doc needs to state something the UI only implies — a hard limit, what
a status value means, what happens after a form is submitted, or which org setting gates a feature.

## File index

| File | Purpose |
|------|---------|
| [references/workflow.md](references/workflow.md) | Step-by-step process from research to published markdown |
| [references/sections.md](references/sections.md) | All 8 doc sections: audience, purpose, what belongs where |
| [references/style-writing.md](references/style-writing.md) | Audience, voice, instructions format, anti-patterns |
| [references/style-page.md](references/style-page.md) | Page structure templates for each section type |
| [references/style-images.md](references/style-images.md) | Image naming, directory mapping, static/img/ conventions |
| [references/screenshots.md](references/screenshots.md) | Playwright recipe system for automated screenshots |
