# Edit with gh CLI — step by step

Use this path only if the user is comfortable in a terminal and has `gh` installed.

## One-time setup

```bash
# Check GitHub CLI is logged in
gh auth status

# If not logged in:
gh auth login

# Clone the repo (once)
gh repo clone glific/claude-plugins
cd claude-plugins
```

Replace `glific/claude-plugins` with your org/repo if different.

## Every change

### 1. Start from latest main

```bash
cd claude-plugins
git checkout main
git pull
```

### 2. Create a branch

```bash
git checkout -b marketing/update-voice-guide
```

Use your team name and a short topic in the branch name.

### 3. Edit files

Open the file in any text editor (VS Code, Cursor, nano, etc.). Only edit files under your team's plugin folder unless an engineer directed otherwise.

### 4. Commit and push

```bash
git add plugins/marketing/skills/glific-positioning/references/voice-and-tone.md
git commit -m "Tighten voice guide for LinkedIn posts"
git push -u origin HEAD
```

`git add` paths should list only the files you changed.

### 5. Open the pull request

```bash
gh pr create --title "marketing: tighten voice guide" --body "$(cat <<'EOF'
## What changed
- Updated LinkedIn hook examples in voice-and-tone.md

## Why
- Team feedback: drafts were too theatrical

## How to test
- [ ] Ask Claude: "Review this LinkedIn draft for Glific tone"
- [ ] Confirm Sage register rules appear in the response
EOF
)"
```

`gh pr create` prints the PR URL — share it with your reviewer.

## Useful commands

```bash
# See what you changed
git status
git diff

# See open PR for your branch
gh pr view

# Check PR status / CI
gh pr checks
```

## If push is rejected

Usually means `main` moved ahead. Run:

```bash
git checkout main
git pull
git checkout your-branch-name
git merge main
# fix conflicts if any, then:
git push
```

If that feels scary, stop and ask a teammate — or switch to the GitHub web path for this PR.

## When to prefer GitHub web instead

- First time editing the repo
- Small one-file text change
- Unsure about git merge/rebase

The web UI does the same thing with fewer commands.
