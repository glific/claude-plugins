# Test locally and ship to the team

## After your PR merges

You don't need to do anything else personally. Tell the team (or post in Slack):

```bash
/plugin marketplace update glific-team
/reload-plugins
```

Anyone who already installed plugins needs those two commands once to pick up your change.

New teammates install as usual:

```bash
/plugin marketplace add glific/glific-team
/plugin install marketing@glific-team
/reload-plugins
```

## Test before merge (recommended)

If the contributor has Claude Code, testing catches mistakes early.

### Option 1 — Test from a cloned repo (best)

While your PR branch exists locally:

```bash
/plugin marketplace add /absolute/path/to/glific-team
/plugin install marketing@glific-team
/reload-plugins
```

Use the **absolute path** to their clone on the **PR branch** (not `main` unless that's what they edited).

Then run a prompt that should use the skill, e.g.:

- Marketing: *"Review this LinkedIn post for Glific positioning"*
- Feature planning: *"Plan the implementation for adding threaded comments"*
- Iteration planning: paste a rough issue blob and ask for a structured issue

Check that Claude follows your **new** wording or rules.

### Option 2 — Review the PR diff only (minimum)

On GitHub, open the PR → **Files changed**. Read the diff. Ask:

- Did I only change what I intended?
- Are headings and bullets still valid markdown?
- If I edited `description:`, did I add clear trigger phrases?

Good enough for small reference-file edits when the contributor doesn't have Claude Code locally.

## PR checklist (copy into PR description)

```markdown
- [ ] Only edited files under my team's plugin folder
- [ ] Did not edit plugin.json or marketplace.json
- [ ] Tested with a sample prompt OR reviewed diff carefully
- [ ] Updated `description:` in SKILL.md if trigger phrases changed
- [ ] One logical change per PR
```

## Who merges?

Depends on repo settings. Usually:

- Team lead or domain owner reviews content
- Engineer optional for YAML/structure checks

The contributor's job is to **open a clear PR** — not necessarily to merge.

## Rollback

If something went wrong after merge, open a **new PR** that reverts or fixes the text. Same workflow as the original edit — no special rollback tooling needed.
