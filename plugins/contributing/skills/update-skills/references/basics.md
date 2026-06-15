# Basics — what you're editing

## What this repo is

The **claude-plugins** repository is a library of **plugins**. Each plugin belongs to a team (marketing, product-development, etc.). When someone installs a plugin in Claude Code, Claude gains new abilities tailored to that team.

You are editing **content** in that library — not building an app.

## What a skill is

A **skill** is a folder with a `SKILL.md` file (and often supporting files). It tells Claude:

- **When** to help (trigger phrases in the `description` at the top)
- **How** to help (workflow steps, rules, examples in the body and reference files)

Think of it as an internal playbook Claude reads before answering.

## Typical skill folder

```
plugins/marketing/skills/glific-positioning/
├── SKILL.md                 ← main instructions + trigger phrases
└── references/
    ├── voice-and-tone.md    ← detailed rules (safe to edit)
    └── channels/
        └── linkedin.md      ← channel-specific guide (safe to edit)
```

Some skills also have:

```
templates/
└── author-tech-design-template.md  ← a blank form Claude fills in (safe to edit)
```

## What happens after you merge

1. Your change lands in the repo on GitHub
2. Teammates refresh their marketplace copy
3. Claude starts using your updated wording on the next session (after `/reload-plugins`)

You don't deploy servers or publish packages — you edit text and open a PR.

## Words you might see

| Term | Plain meaning |
|---|---|
| **Repo** | The project folder on GitHub |
| **Branch** | A draft copy of the repo for your change |
| **Pull request (PR)** | "Please review and merge my draft" |
| **Merge** | Accept the change into the main copy everyone uses |
| **Markdown (.md)** | Text with simple formatting (`#` headings, `-` bullets) |
