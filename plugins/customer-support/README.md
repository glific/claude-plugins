# customer-support — Claude Code plugin

Customer support skills and agents for the Glific team. This plugin is a scaffold — add skills and agents as your workflows evolve.

## Install

```bash
/plugin marketplace add glific/glific-team
/plugin install customer-support@glific-team
/reload-plugins
```

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
customer-support/
├── .claude-plugin/
│   └── plugin.json
├── skills/
└── agents/
```
