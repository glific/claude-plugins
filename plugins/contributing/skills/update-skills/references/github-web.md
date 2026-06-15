# Edit on GitHub (web) — step by step

Use this path if the user is new to git. No terminal required.

## Before you start

- GitHub account with access to the repo (or ability to fork)
- The exact file path (from the coach — e.g. `plugins/marketing/skills/glific-positioning/references/voice-and-tone.md`)

## Steps

### 1. Open the repository

Go to the team plugins repo in a browser. If unsure of the URL, ask your coach or check the root `README.md` for the marketplace name (`glific/glific-team` or your org's equivalent).

### 2. Navigate to the file

- Click through folders: `plugins` → `<your-team>` → `skills` → `<skill-name>` → …
- Or use GitHub's search: press `/` on the repo page, type part of the filename (e.g. `voice-and-tone.md`)

### 3. Edit

- Click the **pencil icon** (Edit this file)
- Make your changes in the editor
- Preview if you want: **Preview** tab shows formatted markdown

**Tips:**
- Headings start with `#` — one `#` for title, `##` for sections
- Bullet lists start with `- ` (dash space)
- Don't remove the `---` lines at the top of `SKILL.md`

### 4. Save on a new branch

Scroll to **Commit changes**:

- **Commit message:** short summary, e.g. `Tighten LinkedIn hook examples`
- Select **Create a new branch** (important — do not commit directly to `main`)
- Branch name suggestion: `<team>/update-<topic>` e.g. `marketing/update-linkedin-hooks`
- Click **Propose changes** or **Commit changes**

### 5. Open the pull request

GitHub usually offers **Compare & pull request** immediately after committing.

- **Title:** plain English — what changed
- **Description:** use the template from the coach (what / why / how to test)
- Click **Create pull request**

### 6. Respond to review

Reviewers may leave comments or suggest edits:

- **Conversation tab** — questions and discussion
- **Files changed tab** — line-by-line comments
- **Suggested changes** — click **Commit suggestion** to accept a fix in the browser

You can push more edits to the same PR by editing the file again while on your branch (GitHub keeps the PR open).

## If you don't have write access

Ask a repo admin for access, or:

1. **Fork** the repo (Fork button, top right)
2. Edit files in **your fork**
3. Open a PR **from your fork → upstream** repo

Your coach can help with fork workflow if needed.

## Common mistakes (all fixable)

| Mistake | Fix |
|---|---|
| Committed to `main` by accident | Ask reviewer — they may ask you to redo on a branch |
| Broke YAML frontmatter | Restore the `---` lines; ask reviewer to help |
| Edited wrong file | Revert in PR or close PR and start over |
| Typo after opening PR | Edit same file on same branch — PR updates automatically |
