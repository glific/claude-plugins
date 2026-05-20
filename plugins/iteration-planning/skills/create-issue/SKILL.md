---
name: create-issue
description: Convert a user-provided issue blob into a structured issue with Description and Acceptance Criteria using Glific project context from CLAUDE.md files. Use when users share rough bug/enhancement/feature text and need a production-ready issue draft.
---

# Ad Hoc Issue Structuring

## When to use

Use this skill when the user shares an unstructured blob of text describing a problem, bug, enhancement, or feature request and wants it converted into a structured issue.

## Inputs

- A free-form text blob from the user that explains the issue.

## Required context gathering

Before producing the structured issue, fetch and use project context from:

- `https://raw.githubusercontent.com/glific/glific/refs/heads/master/CLAUDE.md`
- `https://raw.githubusercontent.com/glific/glific-frontend/refs/heads/master/CLAUDE.md`

If either file is unavailable, continue with available context and explicitly state assumptions in your internal reasoning.

## Workflow

1. Parse the blob and classify the issue as one (or more) of:
   - user-facing feature
   - bug fix
   - enhancement
2. Map the issue to exactly one issue category for GitHub title/labels:
   - `security`
   - `bug`
   - `ops`
   - `ci`
   - `testing`
   - `enhancement`
   - `docs`
   - `refactor`
   - `<epic-name>`
   If category is unclear from the blob/input, ask the user via `AskQuestion` before drafting.
3. If the issue looks like it is part of an epic, ask the user to provide the epic name and use that value as the category label.
4. Format the issue title as:
   - `([<category>]: <short issue title>)`
   - Example: `([bug]: Contact import fails for CSV with empty phone fields)`
5. Ensure the selected category is also added as a GitHub issue label.
6. Extract key facts (user-facing only):
   - current behavior
   - expected behavior
   - affected actors/users
   - user-visible constraints/dependencies
   - user-visible risks and unknowns
7. Use CLAUDE.md context from both repositories to:
   - align terminology with project conventions
   - propose reasonable suggestions for unanswered questions
8. Apply role-based quality checks below.
9. If critical details are missing, ask targeted questions using the `AskQuestion` tool before drafting.
10. Produce only the final structured issue output format.
11. Keep the issue at a high user-facing level; avoid implementation design details unless the user explicitly asks for them.
12. After presenting suggestions/improvements, ask for explicit final confirmation (yes/no) right before issue creation.
13. If the user provided image attachments with the instructions, include them in the final GitHub issue body under a short `## Attachments` subsection using markdown image links (or plain links when embedding is not possible).
14. Only after that confirmation, create the issue in `glific/glific` using `gh`:
   - `gh issue create --repo glific/glific --title "[<category>]: <title>" --body "<structured markdown content>" --label "<category>"`
15. Confirm back with created issue URL.
16. Ask the user (via `AskQuestion`) whether to add the issue to the **DEV Priorities** GitHub project.
17. If yes:
    - Fetch upcoming iterations (see **Project Board Assignment** below).
    - Ask for **Priority** (P0, P1, P2, or P3) and **Iteration** (from the fetched list) via `AskQuestion`.
18. Execute the project board assignment steps described in the **Project Board Assignment** section.

## Project Board Assignment

Use these exact IDs and API calls when adding an issue to the DEV Priorities project.

**Fixed IDs (do not change):**
- Project number: `8`, owner: `glific`
- Project node ID: `PVT_kwDOA_E5C84AUMGc`
- Priority field ID: `PVTSSF_lADOA_E5C84AUMGczg_5jSs`
  - P0 option ID: `676bd10e`
  - P1 option ID: `2792e7da`
  - P2 option ID: `6bf6e802`
  - P3 option ID: `3b907b58`
- Iteration field ID: `PVTIF_lADOA_E5C84AUMGczgM5uHk`

**Step 1 — fetch upcoming iterations** to present to the user:
```bash
gh api graphql -f query='
query {
  organization(login: "glific") {
    projectV2(number: 8) {
      fields(first: 20) {
        nodes {
          ... on ProjectV2IterationField {
            name
            configuration { iterations { id title startDate } }
          }
        }
      }
    }
  }
}'
```
Present the `iterations` list (title + startDate) to the user and ask them to pick one via `AskQuestion`.

**Step 2 — add the issue to the project:**
```bash
gh project item-add 8 --owner glific --url <issue-url>
```

**Step 3 — get the new item's node ID:**
```bash
gh api graphql -f query='
query {
  organization(login: "glific") {
    projectV2(number: 8) {
      items(last: 5) {
        nodes {
          id
          content { ... on Issue { number } }
        }
      }
    }
  }
}'
```
Match on the issue number to get the `itemId`.

**Step 4 — set Priority:**
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwDOA_E5C84AUMGc"
    itemId: "<itemId>"
    fieldId: "PVTSSF_lADOA_E5C84AUMGczg_5jSs"
    value: { singleSelectOptionId: "<priority-option-id>" }
  }) { projectV2Item { id } }
}'
```

**Step 5 — set Iteration:**
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwDOA_E5C84AUMGc"
    itemId: "<itemId>"
    fieldId: "PVTIF_lADOA_E5C84AUMGczgM5uHk"
    value: { iterationId: "<iteration-id>" }
  }) { projectV2Item { id } }
}'
```

Confirm back with the issue URL, assigned priority, and iteration name.

Requires `gh auth refresh -s read:project` (and project write scope) if project commands fail.

## GitHub issue management rules (must enforce)

- Do not create a GitHub issue unless the user has explicitly confirmed issue creation in the current chat turn.
- Do not add an issue to the DEV Priorities project unless the user has explicitly confirmed in the current chat turn.
- Always create the issue in the `glific/glific` repository (not `glific/glific-frontend` unless the user explicitly overrides this).
- Always require exactly one category from: `security`, `bug`, `ops`, `ci`, `testing`, `enhancement`, `docs`, `refactor`, or `<epic-name>`.
- Always format the final title as `[<category>]: <short issue title>`.
- Always add the same category as a GitHub label when creating the issue.
- Preserve the final structured markdown sections in the issue body.
- If the user shared image attachments, include them in the issue body as attachment links/images.

## Role-based checks (must enforce)

### Product Manager

- If the issue is user-facing, include:
  - a feature flag requirement (name it if possible)
  - metrics to measure usage/adoption
- If the issue is a bug fix, include:
  - explicit conditions to reproduce/simulate the bug
  - expected behavior after the fix

### Tech Lead

- Keep requirements outcome-focused and user-facing.
- Do not include implementation split sections such as backend requirements, frontend requirements, API changes, DB changes, or architecture breakdowns.

### QA

- Ensure acceptance criteria covers:
  - happy path
  - edge cases
  - failure/validation scenarios where relevant

## Handling missing information

For any question not answered by the user blob or role requirements:

1. Use insights from the Glific `CLAUDE.md` files.
2. Ask the user for missing details using the `AskQuestion` tool (do not ask in plain text when `AskQuestion` is available).
3. Grill the user until you have all the information you need.
4. If the user is intentionally not providing the information add that to open questions section.
6. During the conversation also evaluate answers from the user and propose better alternatives if you see fit.
7. Again don't stop asking questions until you have all the information you need.
7. Convert those suggestions into explicit acceptance criteria statements where appropriate.

## Question quality rubric (for `AskQuestion`)

- Prioritize questions that unblock:
  - user impact and target persona
  - expected behavior and success conditions
  - rollout constraints (feature flag, backwards compatibility, migration risk)
  - QA scope (edge/failure cases)
  - DEV Priorities placement (yes/no), priority (P0–P3), and iteration when adding to the project board
- Avoid asking for information already inferable from the blob or `CLAUDE.md`.
- Do not ask speculative or low-value preference questions.

## Output format (STRICTLY FOLLOW THIS FORMAT)

Return only:

```markdown
## Description
...

## Acceptance Criteria
...

## Edge cases
...

## Open Questions
...
```

# Guidelines
- Do not add extra sections.
- Do not include a **User Flow** section in the issue body or preview.
- Do not create sections like "Backend Requirements", "Frontend Requirements", "Technical Requirements", or any implementation-specific breakdown.
- Keep all content high-level and user-facing.
- Do not ask follow-up questions unless absolutely required to avoid unsafe or invalid assumptions.
