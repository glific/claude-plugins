# Safe files — what to edit

## Rule of thumb

**Edit content files inside your team's plugin folder.** Avoid config files unless an engineer is on the PR.

## Team → plugin folder

| Team / use case | Plugin folder |
|---|---|
| Marketing | `plugins/marketing/` |
| Product development | `plugins/product-development/` |
| Business development | `plugins/bizdev/` |
| Customer support | `plugins/customer-support/` |
| Feature specs, tickets & issue formatting | `plugins/software-development/` |
| Learning how to contribute | `plugins/contributing/` |

## Safe to edit (non-engineers)

| File | What it's for |
|---|---|
| `skills/<name>/references/*.md` | Playbooks, rules, examples, voice guides |
| `skills/<name>/templates/*.md` | Templates Claude fills in (specs, issues, docs) |
| `skills/<name>/SKILL.md` (body) | Workflow steps, examples, do/don't lists |
| `skills/<name>/SKILL.md` (`description:` line) | Phrases that make Claude auto-use the skill |
| Plugin `README.md` | Human docs for your team (optional) |

## Ask an engineer to review (or avoid editing)

| File | Why |
|---|---|
| `.claude-plugin/plugin.json` | Plugin metadata — wrong edit breaks install |
| `.claude-plugin/marketplace.json` (repo root) | Registers plugins in the marketplace |
| Renaming/moving `skills/` folders | Paths may break commands and references |
| Creating a **new** plugin from scratch | Needs marketplace registration |

## Common edit scenarios

| I want to… | Edit this |
|---|---|
| Change banned phrases or tone rules | `references/voice-and-tone.md` (or similar) |
| Change LinkedIn post structure | `references/channels/linkedin.md` |
| Change impl doc sections | `templates/author-tech-design-template.md` |
| Change how tickets are split | `references/ticket-plan.md` |
| Change default GitHub labels | `references/github.md` |
| Skill doesn't activate when I ask X | `description:` in `SKILL.md` frontmatter — add phrase X |

## YAML frontmatter (top of SKILL.md)

Every `SKILL.md` starts like this:

```yaml
---
name: glific-positioning
description: Glific's positioning, messaging… Use when…
---
```

**Safe change:** edit the `description:` text to add trigger phrases.

**Risky change:** delete the `---` lines, rename `name:`, or remove the frontmatter block — can break the skill. If unsure, only edit the `description:` value and leave everything else alone.

## One PR, one purpose

Good: update marketing voice guide
Bad: marketing voice guide + product-development ticket rules in the same PR

Small PRs get reviewed faster.
