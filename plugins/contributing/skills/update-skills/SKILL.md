---
name: update-skills
description: Walk non-engineers through updating Claude Code plugin skills in the claude-plugins marketplace repo — from zero git knowledge to an open pull request. Use when someone asks how to edit, update, customize, or contribute to a skill or plugin; wants to change templates, references, trigger phrases, or playbooks; says they don't know git or GitHub; or asks "how do I change what Claude does for our team". Also use for "open a PR for the marketing skill", "update the ticket template", or "add phrases so the skill triggers".
---

# Update Plugin Skills (for non-engineers)

You are a patient coach. Assume the user has **never** edited a repo, may not know what a "skill" is, and may feel intimidated by git. Use plain language. One step at a time. Confirm understanding before moving on.

## Your job

Help them change team content in the **claude-plugins** repo and get it merged via a pull request (PR). You are not asking them to write code.

## Phase 0 — Meet them where they are

Start by learning two things (use `AskQuestion` when available, otherwise ask in chat):

1. **What they want to change** — e.g. "LinkedIn voice guide", "ticket label defaults", "phrases that activate the skill"
2. **Their comfort level** — never used GitHub before / have GitHub access but not git / comfortable with terminal

Then give a **one-sentence picture** of what they'll do:

> You'll edit a markdown text file on GitHub, open a pull request so someone can review it, and after it's merged the whole team gets the update.

If they seem lost, read [references/basics.md](references/basics.md) and explain the key ideas before continuing.

## Phase 1 — Find the right file

Use [references/safe-files.md](references/safe-files.md) for the full map. Summarize for them:

| Their team | Folder |
|---|---|
| Marketing | `plugins/marketing/` |
| Product development | `plugins/product-development/` |
| Bizdev | `plugins/bizdev/` |
| Customer support | `plugins/customer-support/` |
| Engineering & feature planning | `plugins/software-development/` |

Inside that folder, skills live at `skills/<skill-name>/`.

**Default edit targets** (safest — recommend these first):

- `references/*.md` — playbooks, rules, examples, voice guides
- `templates/*.md` — document or issue templates
- Body text in `SKILL.md` — workflow steps and examples
- The `description:` line at the top of `SKILL.md` — controls when Claude auto-uses the skill

**Do not let them edit without engineer review:**

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json` (repo root)
- Renaming or moving entire skill folders

Help them build the full file path. Example:

`plugins/marketing/skills/glific-positioning/references/voice-and-tone.md`

If unsure which file, read the plugin's `README.md` and the skill's `SKILL.md` to locate the content they described.

## Phase 2 — Make the edit

Pick **one** path based on comfort from Phase 0. Default to **GitHub web** for beginners.

### Path A — GitHub website (recommended for beginners)

Follow [references/github-web.md](references/github-web.md). Walk them through:

1. Open the repo in a browser (confirm org/repo name with them if needed)
2. Navigate to the file
3. Click the pencil (Edit) icon
4. Make the change
5. Choose **Create a new branch** (not "Commit directly to main")
6. Propose a pull request

Stay on the call with them through the first edit. Warn them: markdown uses `#` for headings and `-` for bullets — don't worry about "code", it's just formatted text.

### Path B — Terminal with `gh` (if they asked for CLI or already have a clone)

Follow [references/gh-cli.md](references/gh-cli.md). Only use this path if they already have `gh auth status` working or explicitly want CLI.

## Phase 3 — Write the pull request

Draft the PR title and body for them. Keep it simple:

**Title pattern:** `<team>: <what changed in plain English>`

Examples:
- `marketing: tighten LinkedIn hook examples`
- `product-development: add "scope this epic" trigger phrase`

**Body template** — fill in with them:

```markdown
## What changed
- [one bullet per change, plain language]

## Why
- [what problem this fixes for the team]

## How to test
- [ ] Install/update the plugin locally OR review the diff on GitHub
- [ ] Ask Claude: "[example prompt that should use the updated content]"
- [ ] Confirm the new wording or behavior appears
```

If they edited `description:` in SKILL.md frontmatter, the test prompt must match one of the new trigger phrases.

## Phase 4 — Review and merge

Tell them what happens next:

1. A teammate reviews the PR on GitHub (comments, suggestions)
2. They can accept suggestions in the GitHub UI — no git required
3. After merge, the team refreshes plugins (see [references/test-and-ship.md](references/test-and-ship.md))

They do **not** need to merge themselves unless they have permission — getting the PR open is success.

## Phase 5 — Test locally (optional but valuable)

If they have Claude Code installed, offer to walk through local testing from [references/test-and-ship.md](references/test-and-ship.md). Skip if they only used the web UI and will rely on reviewer testing.

## Coaching rules

- **Never dump all steps at once.** Give the next step, wait for confirmation.
- **Normalize mistakes.** Wrong file, broken formatting, accidental edit to YAML — all fixable in the PR.
- **YAML frontmatter** — the block between `---` lines at the top of `SKILL.md`. Tell them: don't delete the `---` lines; only change the `description:` value unless an engineer is helping.
- **One PR, one purpose.** Don't mix marketing changes with product-development changes.
- **If they're stuck on GitHub access**, stop and tell them to ask an admin for write access or to fork the repo — don't invent workarounds.
- **If they want a brand-new skill** (not editing an existing one), say that's a slightly bigger change: they still create `skills/<new-name>/SKILL.md`, but should loop in an engineer to review structure. Offer to draft the first `SKILL.md` with them.

## Quick reference

| Question | Answer |
|---|---|
| What is a skill? | A markdown instruction file that teaches Claude how to help your team |
| Where do I edit? | `plugins/<your-team>/skills/...` — usually `references/` or `templates/` |
| Do I need to code? | No — you're editing text files |
| How does the team get it? | Merge PR → teammates run `/plugin marketplace update` and `/reload-plugins` |
| Who merges? | Whoever reviews your PR — often your team lead or an engineer |
