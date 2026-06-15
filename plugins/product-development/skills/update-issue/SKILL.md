---
name: update-issue
description: Read an existing GitHub issue, convert its current Description and Acceptance Criteria into a structured, user-facing issue format using Glific project context from CLAUDE.md files, ask for confirmation, then update the same issue in GitHub.
---

# Update Ad Hoc Issue Structuring

## When to use

Use this skill when an issue already exists on GitHub and the user wants the issue body rewritten into a clear, structured format without asking the user to manually re-enter the issue content.

## Inputs

- An existing GitHub issue reference (issue number or URL).
- Optional user instructions about what should be changed in the issue.

## Required context gathering

Before producing the structured issue, fetch and use project context from:

- `https://raw.githubusercontent.com/glific/glific/refs/heads/master/CLAUDE.md`
- `https://raw.githubusercontent.com/glific/glific-frontend/refs/heads/master/CLAUDE.md`

If either file is unavailable, continue with available context and explicitly state assumptions in your internal reasoning.

## Workflow

1. Resolve the target issue in `glific/glific` from the reference provided by the user.
2. Read the current issue title and body from GitHub using `gh issue view`.
3. Treat the current issue description/body as the primary input blob (instead of asking the user to paste issue text).
4. Parse the existing content and classify the issue as one (or more) of:
   - user-facing feature
   - bug fix
   - enhancement
5. Map the issue to exactly one issue category for GitHub title/labels:
   - `security`
   - `bug`
   - `ops`
   - `ci`
   - `testing`
   - `enhancement`
   - `docs`
   - `refactor`
   - `<epic-name>`
   If category is unclear from the existing issue/user input, ask the user via `AskQuestion` before drafting.
6. If the issue looks like it is part of an epic, ask the user to provide the epic name and use that value as the category label.
7. Format the issue title as:
   - `([<category>]: <short issue title>)`
   - Example: `([bug]: Contact import fails for CSV with empty phone fields)`
8. Ensure the selected category is also added as a GitHub issue label.
9. Extract key facts (user-facing only):
   - current behavior
   - expected behavior
   - affected actors/users
   - user-visible constraints/dependencies
   - user-visible risks and unknowns
10. Use CLAUDE.md context from both repositories to:
   - align terminology with project conventions
   - propose reasonable suggestions for unanswered questions
11. Apply role-based quality checks below.
12. If critical details are missing, ask targeted questions using the `AskQuestion` tool before drafting.
13. Produce only the final structured issue output format preview.
14. Keep the issue at a high user-facing level; avoid implementation design details unless the user explicitly asks for them.
15. Ask for explicit final confirmation (yes/no) right before updating the GitHub issue.
16. Only after confirmation, update the same issue in `glific/glific` using `gh`:
   - `gh issue edit <issue-number> --repo glific/glific --title "[<category>]: <updated title>" --body "<structured markdown content>" --add-label "<category>"`
17. Confirm back with the updated issue URL.
18. Ask the user (via `AskQuestion`) whether to add or update the issue in the **DEV Priorities** GitHub project.
19. If yes:
    - Fetch upcoming iterations (see **Project Board Assignment** below).
    - Ask for **Priority** (P0, P1, P2, or P3) and **Iteration** (from the fetched list) via `AskQuestion`.
20. Execute the project board assignment steps described in the **Project Board Assignment** section.

## Project Board Assignment

Use these exact IDs and API calls when adding or updating an issue on the DEV Priorities project.

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

**Step 2 — resolve project item ID** (add to project only if not already present):
```bash
gh api graphql -f query='
query {
  repository(owner: "glific", name: "glific") {
    issue(number: <issue-number>) {
      projectItems(first: 10) {
        nodes {
          id
          project { ... on ProjectV2 { number } }
        }
      }
    }
  }
}'
```
- If an item exists for project number `8`, use its `id` as `itemId` and **skip** `gh project item-add`.
- Otherwise add the issue, then fetch `itemId` from the project items list (same query as create-issue Step 3):
```bash
gh project item-add 8 --owner glific --url <issue-url>
```
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

**Step 3 — set Priority:**
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

**Step 4 — set Iteration:**
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

- Do not update a GitHub issue unless the user has explicitly confirmed issue update in the current chat turn.
- Do not add or update DEV Priorities project fields unless the user has explicitly confirmed in the current chat turn.
- Always read the existing issue content from GitHub first; do not ask the user to paste the existing issue description unless issue access fails.
- Always update the issue in the `glific/glific` repository unless the user explicitly overrides this.
- Always require exactly one category from: `security`, `bug`, `ops`, `ci`, `testing`, `enhancement`, `docs`, `refactor`, or `<epic-name>`.
- Always format the final title as `[<category>]: <short issue title>`.
- Always ensure the same category label exists on the issue after update.
- Preserve the final structured markdown sections in the issue body.
- If the existing issue body contains image attachments, retain them under a short `## Attachments` subsection using markdown image links (or plain links when embedding is not possible).

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

For any question not answered by the existing issue body, optional user instructions, or role requirements:

1. Use insights from the Glific `CLAUDE.md` files.
2. Ask the user for missing details using the `AskQuestion` tool (do not ask in plain text when `AskQuestion` is available).
3. Ask only high-signal questions that materially affect user impact, scope, or acceptance criteria.
4. Keep the questionnaire short:
   - prefer 1-5 questions
   - use clear, mutually exclusive options
   - allow multi-select only when truly required
5. If a required detail is still unavailable after asking:
   - make a conservative assumption aligned with project conventions
   - clearly encode that assumption in the issue description or acceptance criteria
6. Propose practical suggestions that fit project conventions.
7. Convert those suggestions into explicit acceptance criteria statements where appropriate.

## Question quality rubric (for `AskQuestion`)

- Prioritize questions that unblock:
  - user impact and target persona
  - expected behavior and success conditions
  - rollout constraints (feature flag, backwards compatibility, migration risk)
  - QA scope (edge/failure cases)
  - DEV Priorities placement (yes/no), priority (P0–P3), and iteration when adding or updating on the project board
- Avoid asking for information already inferable from the issue body or `CLAUDE.md`.
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
```

# Guidelines
- Do not add extra sections.
- Do not include a **User Flow** section in the issue body or preview.
- Do not create sections like "Backend Requirements", "Frontend Requirements", "Technical Requirements", or any implementation-specific breakdown.
- Keep all content high-level and user-facing.
- Do not ask follow-up questions unless absolutely required to avoid unsafe or invalid assumptions.
