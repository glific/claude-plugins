# contributing — Claude Code plugin

Teaches non-engineers how to update team skills in the Glific Claude plugins marketplace — no prior git or coding experience required.

## Install

```bash
/plugin marketplace add glific/glific-team
/plugin install contributing@glific-team
/reload-plugins
```

## Use

Ask Claude to walk you through updating a skill:

```
How do I update our marketing skill?
```

```
I need to change the ticket template in software-development
```

```
Help me open a PR to update a plugin
```

The `update-skills` skill starts from zero — it explains what skills are, which files you can edit, and how to get changes merged via GitHub.

## Structure

```
contributing/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── update-skills/
        ├── SKILL.md
        └── references/
            ├── basics.md
            ├── safe-files.md
            ├── github-web.md
            ├── gh-cli.md
            └── test-and-ship.md
```
