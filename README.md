# Glific Claude Plugins

This repository is a Claude Code plugin marketplace for Glific team workflows. Each plugin is scoped to a role or function so teams can install only what they need and contribute skills and agents in the right place.

## Available plugins

| Plugin | Description | Status |
|---|---|---|
| `software-development` | Issue management, engineering workflows, and tooling | Skills included |
| `product-development` | Tech design docs, implementation specs, and ticket breakdowns | Skills included |
| `contributing` | Walkthrough for updating skills (non-engineers welcome) | Skills included |

See each plugin's `README.md` under `plugins/<plugin-name>/` for details.

---

### `feature-doc`
Turn a solution doc into a feature implementation doc, then a ticket plan, then GitHub issues. Grounds the doc in your actual codebase; creates one epic + sub-tickets via the `gh` CLI after your confirmation.

---

### `hiring`
Score and rank job candidates against a job description, producing a detailed self-contained HTML report a hiring manager can open in a browser. Works for Engineering, Support, Product, Design, Engineering Management, Solutions/Sales, Marketing, and HR/Operations roles.

**Skills:**
- `candidate-reviewer`: Evaluate resumes against a JD, score across weighted dimensions, and generate a full HTML scoring report with matrix, bar chart, pros/cons cards, and shortlist recommendations.

---

## Install

Install a plugin through Claude Code marketplace commands (GitHub repo source):

1. Add this repository as a marketplace:

   ```bash
   /plugin marketplace add glific/glific-team
   ```

2. Install one or more plugins:

   ```bash
   /plugin install product-development@glific-team
   /plugin install software-development@glific-team
   ```

3. Reload plugins in the current session:

   ```bash
   /reload-plugins
   ```

Or open `/plugin` and install from the **Discover** tab.

## Upgrade marketplace and plugins

When plugin metadata changes, refresh marketplace data and reinstall:

```bash
/plugin marketplace update glific-team
/plugin install software-development@glific-team
/reload-plugins
```

## Add local marketplace for testing

```bash
/plugin marketplace add /absolute/path/to/claude-code-plugins
/plugin install software-development@glific-team
/reload-plugins
```

## Contribute

New to git or GitHub? Install the `contributing` plugin and ask Claude:

```
How do I update our team's skill?
```

It walks you through editing the right files and opening a pull request — no coding required.

To add a skill or agent for your role manually:

1. Open the plugin folder for your team (e.g. `plugins/marketing/`).
2. Add a skill under `skills/<skill-name>/SKILL.md` or an agent under `agents/<agent-name>.md`.
3. Run `/reload-plugins` locally to test.
4. Open a PR to this repo.

Empty scaffold plugins include `skills/` and `agents/` directories ready for contributions.

## Notes

- Issue-related skills use GitHub CLI (`gh`) — install and authenticate with `gh auth login`.
- Run `gh auth refresh -s read:project` for project management commands.
- Skills are designed for the `glific/glific` repository by default unless a skill specifies otherwise.
