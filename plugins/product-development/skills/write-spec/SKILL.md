---
name: write-spec
description: Write a new product feature spec from an idea, prototype URL, PRD, or design notes — or scope a versioned iteration from an existing spec. Use whenever the user wants to turn a rough feature idea, a design prototype, or a PRD into a structured PM-style spec with problem statement, user stories, acceptance criteria, scope, and technical implications. Also use when the user points at an existing features/ folder and wants to scope a v1/v2 iteration from it — phrases like "write a spec for X", "scope a version", "create a feature spec", "v1 of this spec", "product spec for Y", or "turn this PRD into a spec" should all trigger this skill.
---

# Write a Feature Spec

## Input: $ARGUMENTS

Write a new feature spec from an idea, or scope a versioned iteration from an existing spec.

## Process

### Step 1: Parse Input & Determine Mode

**Mode A — New Spec** (default):
- `$ARGUMENTS` is an inline feature description (e.g. `"bulk broadcast scheduling"`)
- Or `$ARGUMENTS` is a URL to a prototype, PRD, or design doc
- Or `$ARGUMENTS` is a file path to notes/requirements to read as input
- Creates `features/{feature-name}/spec.md`

**Mode B — Scope a Version**:
- `$ARGUMENTS` points to an existing feature folder (e.g. `features/flow_analytics`)
- Or `$ARGUMENTS` points to an existing spec (e.g. `features/flow_analytics/spec.md`)
- Creates `features/{feature-name}/v{N}/spec.md`

To determine mode: check if `$ARGUMENTS` matches an existing `features/` folder or spec. If yes, Mode B. Otherwise, Mode A.

---

## Mode A: New Spec (full vision)

### Check for Existing Work
Search `features/` for an existing folder with a similar feature name.
- If a related spec exists, inform the user and ask whether to update or create new.

### Gather Context
If the user provided URLs (prototype, PRD, design doc, GitHub repo), fetch them using WebFetch before writing. Extract:
- What the UI/screens look like and what interactions exist
- Design decisions, rationale, and open questions from any design docs
- Requirements and user stories from any PRD

### Write the Spec
Use a senior product manager approach for a WhatsApp-based NGO communication platform:

1. **Understand the idea** — Parse the input, identify the core problem being solved.
2. **Research context** — Fetch URLs, read any provided files, check existing features.
3. **Pressure-test from user perspective** — Apply these tests for Glific's NGO users:
   - **Comprehension**: Can a low-digital-literacy NGO staff member understand and use this?
   - **Language**: Does this work across multiple languages / regional scripts (Hindi, Tamil, etc.)?
   - **WhatsApp constraints**: Does this stay within WhatsApp's messaging policies and template approval rules?
   - **Connectivity**: Does this work reliably on poor internet connections?
   - **Trust**: Will beneficiaries trust and engage with this flow/message?
   - **Independence**: Can an NGO admin set this up without developer help?
4. **Structure the spec** with these sections:
   - Problem Statement — What problem, for whom?
   - Target Users — Which Glific persona(s)? (NGO Admin / NGO Staff / Beneficiary / Super Admin)
   - Success Metrics — How to measure success?
   - User Stories — As a [role], I want [thing], so that [outcome]. With acceptance criteria.
   - Scope — What's IN for MVP, what's OUT for later?
   - Technical Implications — Which repos/services affected?
   - Open Questions — What needs deciding before planning?
   - Handoff Checklist — Is this ready for engineering?

### Glific User Personas
- **NGO Admin** — Manages the organization's Glific instance; sets up users, WhatsApp templates, and integrations
- **NGO Staff / Program Officer** — Creates and manages flows, broadcasts, and contact collections day-to-day
- **Beneficiary** — End-user interacting via WhatsApp (not a direct Glific UI user)
- **Super Admin** — Glific platform admin managing multiple NGO organizations

### Glific Domain Concepts (use these terms consistently)
- **Flow** — A chatbot conversation built in the visual flow editor
- **Contact** — A beneficiary registered in Glific (identified by phone number)
- **Collection / Group** — A set of contacts targeted for a broadcast or flow
- **Template / HSM** — Pre-approved WhatsApp message template (required for outbound messages)
- **Broadcast** — A bulk message sent to a collection
- **Trigger** — An automated rule that starts a flow (time-based, keyword-based, etc.)
- **Organization** — An NGO instance on Glific
- **Interactive Message** — WhatsApp button or list message for structured replies

### Save
Save to: `features/{feature-name}/spec.md`

This is the **PM's original spec** — the full vision. Use snake_case feature name. Create the directory if needed.

### Print Next Step
```
Spec saved to: features/{feature-name}/spec.md

Next steps:
1. Review with the team
2. Scope a v1: /product-development:write-spec features/{feature-name}
3. Then plan engineering work from features/{feature-name}/v1/spec.md
```

---

## Mode B: Scope a Version

### Read the Original Spec
- Read `features/{feature-name}/spec.md` (the PM's full vision)

### Determine Version Number
- Check which versions already exist (`v1/`, `v2/`, etc.)
- If previous versions exist, read their `spec.md` files to understand what's already been scoped
- New version = next sequential number

### Scope the Iteration
From the original spec, identify what to include in this version:

1. **If this is v1**: Pick the smallest subset that delivers end-to-end value. Focus on the core user story. Defer nice-to-haves.
2. **If this is v2+**: Pull from the "Out of Scope" items of previous versions, or from remaining items in the original spec not yet covered.

For each version, consider:
- What's the smallest shippable slice?
- Does it deliver standalone value to NGO staff without requiring further versions?
- Are there WhatsApp policy or template approval dependencies to account for?
- What's the logical ordering?

### Write the Versioned Spec
Create `features/{feature-name}/v{N}/spec.md` with:

```markdown
# {Feature Name} — v{N}

**Scoped from**: ../spec.md
**Version**: v{N}
**Status**: Draft

## Scope for this iteration

### What's included
- [Capability 1 — from original spec's user story X]
- [Capability 2]

### What's deferred to later versions
- [Deferred item] — [reason for deferral]

## User Stories (scoped)

### Story 1: [Title]
**As a** [role], **I want** [capability], **so that** [outcome].

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Technical Scope
- **glific** (Elixir/Phoenix backend): [what changes in this version]
- **glific_frontend** (React): [what changes in this version]

## Dependencies
- Requires: [any prerequisites, previous version completion, or WhatsApp template approvals]
- Enables: [what future versions this unblocks]
```

### Print Next Step
```
Scoped version saved to: features/{feature-name}/v{N}/spec.md

Next: Plan engineering work from features/{feature-name}/v{N}/spec.md
```

---

## Guidelines
- Be specific, not generic. Name real NGO workflows, real contact/flow patterns, real WhatsApp constraints.
- Scope ruthlessly for MVP. Move nice-to-haves to "Out of Scope" explicitly.
- Think in NGO staff workflows, not isolated features.
- Each version should be independently shippable — NGO staff get value even if v2 never happens.
- Don't over-scope v1. Ship a thin slice fast rather than a thick slice late.
- Always consider WhatsApp policy limits (template approval, opt-in rules, 24-hour messaging window).
- Explicitly list what's deferred and why — makes scoping v2 easier.
- If the original spec is small enough for one iteration, v1/spec.md can be a near-copy with tightened acceptance criteria.
