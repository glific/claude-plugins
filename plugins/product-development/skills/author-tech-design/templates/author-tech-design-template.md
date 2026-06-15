# [Feature Name]

| | |
|---|---|
| **Author** | [Your name] |
| **Date** | [YYYY-MM-DD] |
| **Status** | Draft \| In Review \| Approved \| Implemented |
| **Ticket(s)** | [Link to Linear / Jira / GitHub issue / PRD] |
| **Reviewers** | [@reviewer1, @reviewer2] |

## Summary

[2–3 sentences. What is this, who is it for, why now. A reader should know whether to keep reading after this section.]

## Context & Motivation

[The problem this solves. Current behavior or pain. Why now. Link to user research, support tickets, or strategic docs if relevant. Skip generic framing — get to the specific problem.]

## Goals

- [Specific, measurable outcome 1]
- [Specific, measurable outcome 2]
- [Specific, measurable outcome 3]

## Non-goals

- [Thing this explicitly will NOT do]
- [Adjacent feature being deferred]
- [Scope limit worth flagging]

## Proposed Solution

[The approach in 1–3 paragraphs. High-level enough that a reviewer understands without diving into details, but specific enough that you couldn't substitute a different approach without rewriting this section.]

[Include a diagram if it earns its place — sequence diagram, data flow, state machine, ER diagram. Skip ASCII art that doesn't add information.]

## Detailed Design

### Data Model

[Schema changes, new tables, columns, indexes, migrations. Reference existing files / models where relevant.]

```sql
-- example
CREATE TABLE comments (
  id uuid PRIMARY KEY,
  ...
);
```

### API Changes

[New endpoints, modified endpoints, request/response shapes. GraphQL schema additions. Auth requirements.]

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/posts/:id/comments` | Create a comment | required |

### Frontend

[New components, modified components, state, routing, key UX flows. Skip if no UI change.]

### Affected Files / Modules

- `path/to/file1.ts` — [what changes]
- `path/to/file2.tsx` — [what changes]
- `path/to/migration.sql` — [new]

## Alternatives Considered

### Alternative 1: [Name]

[What it is. Why we didn't pick it — be specific. "It's slower" is weak; "it would require a join across the events table on every render, which we've already optimized away once" is strong.]

### Alternative 2: [Name]

[What it is, why we didn't pick it.]

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| [Risk description] | Low / Med / High | Low / Med / High | [How we'll handle it] |

## Testing Strategy

- **Unit:** [Key units and what they cover]
- **Integration:** [What flows we'll integration-test]
- **E2E / Manual QA:** [What needs human verification before ship]
- **Performance / load:** [If relevant — load expectations and how we'll verify]

## Rollout & Migration

- **Feature flag:** [Name, default, target audience for gradual rollout]
- **Data migration:** [Backfill needed? Online vs. offline? How long does it take?]
- **Backwards compatibility:** [What happens to existing clients / data?]
- **Rollback:** [How we revert if it goes wrong. Be specific.]

## Observability

- **Logs:** [Key events to log, at what level]
- **Metrics:** [Counters / gauges / histograms to add]
- **Alerts:** [Thresholds and notification channels]
- **Dashboards:** [New dashboard or addition to existing?]

## Security & Privacy

[Auth model, data sensitivity, PII handling, rate limiting, abuse vectors. Skip with "N/A — no new attack surface" if genuinely not applicable.]

## Open Questions

- [ ] [Question we don't have an answer for yet — flag who needs to weigh in]
- [ ] [Decision deferred to implementation — note why it's safe to defer]

(If none: "None known at draft time.")

## Estimated Effort

| Chunk | Size | Notes |
|---|---|---|
| Data model + migration | S | |
| API endpoints | M | |
| Frontend | M | |
| Tests + docs | S | |

**Total:** [XS / S / M / L / XL]

Sizing key: XS ≈ <1 day · S ≈ 1–3 days · M ≈ 3–7 days · L ≈ 1–2 weeks · XL ≈ 2+ weeks (split into multiple docs)
