# marketing — Claude Code plugin

Marketing skills and agents for the Glific team.

## Install

```bash
/plugin marketplace add glific/claude-plugins
/plugin install marketing@glific-team
/reload-plugins
```

## Skills

| Skill | Use when |
|-------|----------|
| `glific-positioning` | Drafting, reviewing, or auditing any Glific-facing content — LinkedIn, newsletters, website copy, decks, case studies, campaigns, and more |

## Add a skill

Create a folder under `skills/` with a `SKILL.md` file:

```
skills/
└── your-skill-name/
    └── SKILL.md
```

Each `SKILL.md` needs YAML frontmatter with `name` and `description`. After adding or editing skills, run `/reload-plugins`.

## Add an agent

Add a Markdown file under `agents/`:

```
agents/
└── your-agent-name.md
```

See the [Claude Code plugins docs](https://code.claude.com/docs/en/plugins) for agent frontmatter and options.

## Structure

```
marketing/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── glific-positioning/
│       ├── SKILL.md
│       └── references/
└── agents/
```
