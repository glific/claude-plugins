# Glific Claude Plugins

This repository contains Claude plugins for Glific workflows.

## Available plugins

### `iteration-planning`
Issue creation and update workflows for `glific/glific`.

**Skills:**
- `create-issue`: Convert rough issue notes into a structured GitHub issue draft and create the issue after confirmation.
- `update-issue`: Read an existing GitHub issue, rewrite it into a structured format, and update it after confirmation.

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
   /plugin marketplace add glific/claude-code-plugins
   ```

2. Open the plugin manager and install from the **Discover** tab:

   ```bash
   /plugin
   ```

   Or install directly by name:

   ```bash
   /plugin install iteration-planning@glific-claude-plugins
   /plugin install feature-doc@glific-claude-plugins
   ```

3. Reload plugins in the current session:

   ```bash
   /reload-plugins
   ```

## Upgrade marketplace and plugin

When plugin metadata changes, refresh marketplace data and reinstall/update:

1. Refresh marketplace metadata:

   ```bash
   /plugin marketplace update claude-code-plugins
   ```

2. Reinstall or upgrade the plugin:

   ```bash
   /plugin install iteration-planning@claude-code-plugins
   ```

3. Reload plugins in the current session:

   ```bash
   /reload-plugins
   ```

## Add local marketplace for testing

Use a local checkout as a marketplace source while validating plugin changes:

1. Add the local marketplace path:

   ```bash
   /plugin marketplace add /absolute/path/to/claude-code-plugins
   ```

2. Install the plugin from that local marketplace entry:

   ```bash
   /plugin install iteration-planning@claude-code-plugins
   ```

3. Reload plugins after each local change:

   ```bash
   /reload-plugins
   ```

## Use

Run a skill from an installed plugin:

```bash
/iteration-planning-plugins:create-issue
/iteration-planning-plugins:update-issue
```

```bash
/feature-doc-plugins:feature-doc
```

```bash
/hiring:candidate-reviewer
```

## Notes

- The `iteration-planning` skills use GitHub CLI (`gh`) — make sure `gh` is installed and authenticated (`gh auth login`).
- Run `gh auth refresh -s read:project` to grant access to project management commands.
- The `iteration-planning` skills are designed for the `glific/glific` repository by default.
