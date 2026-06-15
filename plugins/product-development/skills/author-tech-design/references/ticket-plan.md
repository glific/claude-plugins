# Ticket plan reference

Read this when generating a ticket plan from an implementation doc (Phase 6 of the workflow).

## Structure

Every plan has exactly one **epic ticket** and 3–7 **sub-tickets**. The epic is the parent — it summarizes the feature and tracks the sub-tickets via a task list. Sub-tickets are the actual units of work.

## Chunking rules

Good sub-tickets follow these properties:

- **Independently completable.** A sub-ticket can be picked up, finished, and reviewed without waiting on another sub-ticket. (Ordering dependencies are fine — "B depends on A" — but B should still be a self-contained PR.)
- **S or M sized.** If a chunk is L or larger, split it. If it's XS, fold it into a sibling.
- **One reviewer can review it in one sitting.** ~200 lines of meaningful diff is a rough ceiling.
- **Has clear acceptance criteria.** A reviewer should know whether the ticket is "done" from the criteria alone.

Default chunking patterns (pick what fits the feature):

| Pattern | When to use | Typical chunks |
|---|---|---|
| **Horizontal (layered)** | Most features. Clear separation of concerns. | data → backend → frontend → tests → rollout |
| **Vertical (slices)** | When you want incremental user-visible value, or the feature has multiple independent surfaces | "comments on posts MVP", "comments on profiles", "moderation tools" |
| **Hybrid** | Common for medium features | "data + backend API" as one ticket, "frontend" as another, "tests + docs" as a third |

If unsure, default to **hybrid horizontal** (data + backend together if small, otherwise split; frontend separate; tests folded into each ticket; rollout separate).

## Ordering

Suggest a working order in the plan, but let the user reorder. Default order:

1. Data model changes (unblocks everything downstream)
2. Backend / API (depends on data model)
3. Frontend (depends on API)
4. Tests (often folded into each ticket above; only separate if there's a meaningful test infra chunk)
5. Rollout — feature flag, monitoring, docs (often last)

## Epic ticket template

```markdown
# [Feature name]

Implementation doc: [`docs/specs/<feature-slug>.md`](docs/specs/<feature-slug>.md)

## Summary

[1–2 sentences pulled from the doc's Summary section.]

## Goals

- [Goal 1]
- [Goal 2]

## Non-goals

- [Non-goal 1]
- [Non-goal 2]

## Sub-tickets

- [ ] #XXX — [Sub-ticket 1 title]
- [ ] #XXX — [Sub-ticket 2 title]
- [ ] #XXX — [Sub-ticket 3 title]

(Filled in after sub-tickets are created.)

## Estimated effort

**Total:** [T-shirt size from the doc]

## References

- Implementation doc: `docs/specs/<feature-slug>.md`
- [Any external links from the doc — PRD, design, related tickets]
```

## Sub-ticket template

```markdown
# [Sub-ticket title]

**Parent:** #XXX
**Implementation doc:** [`docs/specs/<feature-slug>.md`](docs/specs/<feature-slug>.md) — see [relevant section]

## Scope

[1–2 sentences. What this ticket delivers.]

## Out of scope

- [Adjacent work that belongs in another ticket — explicitly call it out]

## Acceptance criteria

- [ ] [Specific, verifiable criterion 1]
- [ ] [Specific, verifiable criterion 2]
- [ ] Tests added / updated for the changes above

## Files likely touched

- `path/to/file1.ts`
- `path/to/file2.tsx`

## Size

[S | M]

## Notes

[Any context the implementer needs that isn't already in the doc. Often empty.]
```

## Titling conventions

- Use **imperative mood**, action-first: "Add comments table", not "Comments table" or "Adding comments table".
- Keep titles under ~70 characters so they don't wrap badly in lists.
- Don't include redundant prefixes like "[Feature]" or "[Frontend]" — that's what labels are for.

Examples:

- ✅ `Add comments table, migration, and Drizzle model`
- ✅ `Implement POST/GET/DELETE /api/posts/:id/comments endpoints`
- ✅ `Build CommentThread and CommentForm components with optimistic UI`
- ❌ `Comments DB stuff` (too vague)
- ❌ `[Backend] [Feature: Comments] Add the comments table and the migration and also the Drizzle model file` (redundant prefixes + run-on)

## Labels

Default label set to apply on creation, in priority order (use whichever exists in the target repo):

- `feature` or `enhancement` — applied to all tickets
- `epic` — applied to the parent ticket only
- Component labels if the repo uses them: `backend`, `frontend`, `infra`, `docs`

Check what exists with `gh label list` before applying. Don't auto-create labels — ask the user first if a desired label is missing.

## Validation before creation

Before sending anything to GitHub, sanity-check:

- [ ] Every sub-ticket title is unique
- [ ] Every sub-ticket has acceptance criteria
- [ ] Every sub-ticket has a size (S or M, not L/XL)
- [ ] Total sub-ticket sizes roughly match the doc's total estimate
- [ ] No sub-ticket title contains "TODO" or placeholder text

If any check fails, fix before creating. The user shouldn't have to clean up after the skill.
