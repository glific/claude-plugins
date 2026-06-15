---
name: author-tech-design
description: Turn a solution doc (or ticket / PRD / loose description) into a codebase-grounded tech design / implementation document, then a ticket-wise plan (one epic + sub-tickets), then GitHub issues. Use whenever the user wants to go from a high-level feature idea to a concrete plan and tickets — phrases like "I have a solution doc for X", "plan this feature", "break this into tickets", "create the epic and sub-tasks", "tech spec for Y", "implementation plan", "design doc", "author a tech design", or "scope this feature". The skill grounds the doc in the actual codebase, then proposes an epic + sub-tickets and creates them on GitHub via `gh` CLI after explicit user confirmation.
---

# Author Tech Design

This skill takes a developer from a feature idea to GitHub issues, in one continuous workflow:

```
Solution doc (input)  →  Implementation doc  →  Ticket plan  →  GitHub issues
```

It handles three input modes:

- **Solution doc** (most common) — a short markdown doc the user already wrote, sketching how the feature should work at a high level
- **Ticket / PRD** — they paste a Linear / Jira / GitHub issue or a PRD excerpt
- **Conversation** — they describe the feature loosely and the skill interviews them

In all modes, the skill grounds the doc in the actual codebase — finding similar patterns, identifying affected files, and checking conventions — rather than producing a generic template fill. After the doc is approved, the skill proposes a ticket-wise breakdown (one epic + sub-tickets) and, on explicit confirmation, creates them on GitHub.

## Workflow

Walk through these five phases in order. Don't skip ahead, even if the user pasted a thorough ticket — the codebase exploration step is where most of the value comes from, and the gap-finding step prevents you from confidently inventing details that aren't in the ticket.

### Phase 1: Detect mode and confirm understanding

Look at the user's first message. Classify as:

- **Solution doc** — the user references a markdown file in the repo, attaches a doc, or pastes structured content that's clearly _their own_ design sketch (not a ticket from PM). This is the most common entry point.
- **Ticket / PRD** — structured content from Linear / Jira / GitHub / PRD, usually written by someone other than the implementing engineer
- **Conversational ask** — described in their own words, no doc

If they reference a solution doc by path, **read it first** before proceeding.

State what you understood the feature to be in **one sentence**, plus what mode you detected. This gives the user a chance to correct your interpretation before you go further. Example:

> Got it — read `docs/solutions/threaded-comments.md`. Sounds like you want to add one-level-deep threaded comments to posts with optimistic UI. Let me ask a few things before I dig into the code.

### Phase 2: Identify gaps and interview

The template at `templates/author-tech-design-template.md` defines the sections the final doc needs. Read it. Then identify which sections you don't have enough information for and ask the user about the critical gaps.

Be selective with questions — most of the user's time is spent answering, so each question needs to earn its place:

- Ask only about gaps that materially affect the design. Things you can reasonably propose (table names, log format) — propose them, don't ask.
- Group related questions in a single turn; don't drip-feed them.
- Skip sections that clearly don't apply (e.g., no UI changes → skip frontend questions).
- Default to sensible answers when the user says "I don't know" — don't keep pushing.

High-value questions usually look like:

- "Does this need to be backwards-compatible with existing X?"
- "Should this work for anonymous users or authenticated only?"
- "Is there a deadline or external dependency constraining the approach?"
- "Gradual rollout (feature flag) or all-at-once?"
- "Any non-goals I should flag explicitly — things you're choosing NOT to do here?"

Low-value questions to avoid:

- "What should we name the table?"
- "Should we write tests?" (yes, always)
- "What's the priority?" (not your concern at design time)

### Phase 3: Explore the codebase

Before drafting, ground yourself in the code. **This is the step that distinguishes a useful doc from a generic one.** Do these in parallel:

- **Find similar patterns.** If the feature is "add comments to posts," search for how likes, reactions, or any existing post-attached entity is implemented. Reuse the pattern.
- **Identify affected modules and files.** Build a concrete list — these will appear in the doc.
- **Check conventions.** Naming style, test layout, API style (REST/GraphQL/RPC), migration tooling, error handling, dependency injection. The doc should match what already exists, not propose a new style without flagging it.
- **Read project guides.** If `CLAUDE.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, or similar exist, read them.
- **Follow references.** If the user mentions specific files, modules, or tickets, fetch and read them.

Summarize what you found in **one short paragraph** before drafting. This both confirms understanding and lets the user correct any misreadings of the codebase. The example below is **illustrative only** — the paths and tools shown are made up for the example; your summary must reference paths and tools you actually saw in this repo:

> _(example for a hypothetical Next.js + Drizzle repo — do not copy paths)_
> Quick read of the codebase: posts are in `apps/api/src/posts/`, with a `PostsService` and a `posts_repository.ts` that uses Drizzle. Likes follow a similar pattern at `apps/api/src/likes/`, with a join table and a count denormalized onto `posts.like_count`. I'll mirror that structure for comments. Tests live in `__tests__/` next to source, using Vitest. Migrations are in `apps/api/migrations/` via `drizzle-kit`.

### Phase 4: Draft the doc

Use the template at `templates/author-tech-design-template.md`. Fill in every section that applies. For sections that don't apply, write `N/A — [one-line reason]` rather than deleting them — that signals an intentional omission rather than an oversight.

Principles for the draft:

- **Be concrete — but only with verified paths.** Reference real files (`apps/web/src/lib/comments.ts` is a _format example only_ — never use this exact path; use what you actually saw in Phase 3), real tables, real endpoints. **Never invent file paths or module names.** If you haven't opened the file with `view` or confirmed it exists via search, don't reference it. Generic plans are forgettable; _verified-specific_ plans get implemented; _fake-specific_ plans waste reviewer time and damage trust in the doc.
- **Show your work in Alternatives Considered.** Even if the chosen approach feels obvious, name 1–2 alternatives and explain why you didn't pick them. This is where reviewers learn whether the chosen approach is robust.
- **T-shirt sizes, not hours.** Estimate effort per major chunk in XS / S / M / L / XL. Hour estimates always lie and people get attached to them.
- **Open Questions is required.** Even if empty, write "None known at draft time" — never omit the section. Surfacing unknowns is the doc's job.
- **Save the draft to a file** in the user's repo (see "Output location" below) and present it.

### Phase 5: Refine

Ask the user for feedback. Prompt specifically:

- Anything off about the codebase summary?
- Goals / non-goals to add or drop?
- Is the chosen approach right, or should we explore an alternative?

Apply feedback and update the file. Iterate until the user is satisfied. Don't ask a generic "anything else?" — name the most likely places they'll want to push back.

When the user signals the doc is good ("looks good", "ship it", "let's do tickets", etc.), proceed to Phase 6.

### Phase 6: Generate ticket plan

Read `references/ticket-plan.md` for the chunking rules and ticket templates. The short version:

- **One epic ticket** summarizes the whole feature and acts as the parent + progress tracker.
- **N sub-tickets** (typically 3–7) each cover an independently completable chunk.
- Each sub-ticket is **spec-driven and self-sufficient** — Summary, Requirements (functional MUST/SHOULD + non-functional), Acceptance Criteria in Given/When/Then, Technical Details (schema/API/files/code sketches as relevant to that chunk), Out of Scope, Dependencies, Testing Notes. A dev should be able to start coding from the ticket alone without re-reading the impl doc.
- Each sub-ticket should be **S or M sized**. If a chunk is L or XL, split it.
- Default chunking ordering: data model → backend / API → frontend → tests & docs → rollout. Adjust based on the actual feature.

Generate the plan and **display it in chat as a high-level preview first** — numbered list with titles, sizes, and one-sentence summaries. Don't write full ticket bodies yet — those come after the user confirms the breakdown, so they're not reviewing prose they might want re-chunked. Example:

> Here's the proposed breakdown:
>
> **Epic:** Add threaded comments to posts
>
> 1. **[S]** Add `comments` table, migration, and Drizzle model
> 2. **[M]** Implement `POST/GET/DELETE /api/posts/:id/comments` endpoints
> 3. **[M]** Build `<CommentThread>` and `<CommentForm>` components with optimistic UI
> 4. **[S]** Wire feature flag `comments_enabled` and rollout monitoring
> 5. **[S]** Update API docs and add user-facing help article
>
> Each sub-ticket will be spec-driven (summary, requirements, AC in Given/When/Then, full tech details) so devs can pick one up and start coding without re-reading the impl doc.
>
> Want me to generate the full ticket bodies for review, or proceed straight to creating them on GitHub?

Then **stop and wait** for the user's response. Possible paths:

- **"Show me the full bodies first"** → generate full bodies per the templates in `references/ticket-plan.md`, display them, then wait for confirmation. _Recommended path for the first run._
- **"Create them"** → generate full bodies, then proceed to Phase 7.
- **"Adjust this"** (split, merge, reorder, retitle) → update the breakdown, show again, wait.
- **"Save the plan locally, I'll create them myself"** → write the plan and the full ticket bodies as a markdown file (`docs/specs/<feature-slug>.tickets.md`) and stop.

### Phase 7: Create GitHub issues

**Only proceed with explicit confirmation from Phase 6.** Never run `gh issue create` without it.

Read `references/github.md` for the exact `gh` CLI sequence. The high-level flow:

1. **Verify prerequisites.** Check that `gh` is installed and authenticated (`gh auth status`). If not, tell the user how to fix and stop.
2. **Detect the target repo** from `git remote get-url origin`. Show it to the user. If it's wrong (e.g., they're in a clone but want to file against the upstream), ask.
3. **Generate full ticket bodies** using the templates in `references/ticket-plan.md` if you haven't already. Each body should link back to the implementation doc (use the file path; GitHub will render it as a link when the doc is on the default branch).
4. **Create the epic first.** Capture the returned issue number.
5. **Create each sub-ticket in order**, capturing each number. Each sub-ticket body references the epic by number (`Parent: #123`).
6. **Update the epic body** to include a task list with checkboxes linking to each sub-ticket (`- [ ] #124 — Add comments table…`).
7. **Report back.** Print the epic URL + all sub-ticket URLs to the user.

If any step fails (rate limit, auth, network), **stop and report**. Don't leave a half-created plan and pretend it worked. The user can resume by editing the epic body manually or re-running with the remaining items.

## Output location

The deliverable is a markdown file in the user's repository. Pick a location in this priority order:

1. If the repo has existing implementation docs (search for `docs/specs/`, `docs/features/`, `docs/rfcs/`, `docs/design/`), put it alongside them.
2. If `docs/` exists with no specs subfolder, create `docs/specs/<feature-slug>.md`.
3. If there's no `docs/` at all, ask the user where they want it. Default to `docs/specs/`.

Use **kebab-case** for the filename (`add-threaded-comments.md`, not `Add_Threaded_Comments.md`).

## Tone and style

The doc is for engineers who will implement and review. Be concise, technical, and direct.

- Lead with substance. Skip filler openings like "This document outlines..."
- Bullet lists are fine; long unstructured prose isn't.
- Active voice. "The API returns X" not "X is returned by the API."
- Don't pad sections to look thorough. A 3-bullet Testing Strategy that says the right thing beats a 12-bullet one that includes "write good code."

## Edge cases

- **User pastes a huge ticket with everything specified.** Still run codebase exploration — the ticket won't reference real files. Still write Alternatives Considered — the ticket won't have done that.
- **Solution doc is barely a stub.** Treat it as conversational input — interview the user to flesh out gaps before drafting.
- **User wants the doc without exploring the codebase** (e.g., greenfield project, or "just give me a template-style doc"). Skip Phase 3, but note in the doc that codebase grounding was skipped so reviewers know.
- **Feature is tiny** (one file, half a day of work). Suggest a PR description instead of a full doc + epic. Ask before proceeding.
- **Feature is huge** (multiple subsystems, multi-quarter). Suggest splitting into a higher-level design doc plus multiple per-component implementation docs. Offer to start with the design doc.
- **User skips the doc and wants tickets directly from a solution doc.** Allowed, but warn that the tickets will be less grounded without the intermediate impl doc. Offer to do a lightweight codebase scan even if skipping the full doc.
- **User wants to create tickets but `gh` isn't installed.** Output the ticket bodies as markdown files in `docs/specs/<feature-slug>.tickets/` (one file per ticket) and tell the user the install command for `gh`. Don't try to use the GitHub REST API directly.
- **Multiple remotes / fork workflow.** If `git remote` shows both `origin` and `upstream`, ask which the tickets should go to.
- **User asks for Linear / Jira / something else.** This skill only ships with GitHub support. Tell them, and offer to output the ticket bodies as markdown so they can paste manually.
