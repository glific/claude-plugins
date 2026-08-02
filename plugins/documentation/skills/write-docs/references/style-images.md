# Style: Images

## Storage policy

| Image type | Where to store |
|------------|----------------|
| New screenshots (all new pages) | `static/img/{feature}/` in `glific/docs` |
| Existing GitHub CDN images on old pages | Leave as-is — do not migrate unless rewriting the page |

**Never add new GitHub CDN image URLs to a page.** Use local `static/img/` for all new content.

## Directory mapping

One directory per feature area under `static/img/`:

| Feature | Directory |
|---------|-----------|
| Chats | `static/img/chats/` |
| Speed Sends | `static/img/speed-sends/` |
| Flows | `static/img/flows/` |
| Triggers | `static/img/triggers/` |
| Searches | `static/img/searches/` |
| HSM Templates | `static/img/hsm-templates/` |
| Interactive Messages | `static/img/interactive-messages/` |
| Notifications | `static/img/notifications/` |
| Collections | `static/img/collections/` |
| Contact Management | `static/img/contact-management/` |
| Staff Management | `static/img/staff-management/` |
| Settings | `static/img/settings/` |
| Integrations (OpenAI) | `static/img/integrations/openai/` |
| Integrations (Sheets) | `static/img/integrations/sheets/` |
| WhatsApp Groups | `static/img/wa-groups/` |

If a feature doesn't have a directory yet, create it. The screenshot script creates it automatically.

## File naming

Format: `{feature}_{description}.png` — lowercase, underscores, no spaces.

Examples:
- `flows_list.png` — the list of flows
- `flows_create_dialog.png` — the create flow dialog
- `hsm-templates_new_template_form.png` — the new template form
- `chats_session_timer.png` — the session timer in the chat window

## Markdown syntax

Use a **relative path** from the doc file to the image under `static/img/`, not the absolute
`/img/...` site-root path:

```markdown
![Flows list](../../static/img/flows/flows_list.png)
```

Count `..` segments from the doc file's own directory back to the repo root, then descend into
`static/img/...` (e.g. a file at `docs/4. Product Features/06.  HSM Templates.md` needs `../..` to
reach the repo root).

**Why relative, not `/img/...`:** an absolute `/img/...` path only resolves once the site is built
and deployed by Docusaurus — GitHub's markdown renderer resolves a leading `/` against
`github.com` itself, so the image shows as broken on the raw file view and in PR diffs until the
branch merges and the site rebuilds. A relative path resolves both ways: GitHub renders it inline
immediately (PR diff, raw file view) by resolving it against the file's repo location, and
Docusaurus's markdown loader bundles the same relative reference through webpack when the site
builds. Verified against `glific/docs` main: no existing page actually uses the absolute `/img/`
form — confirm this still holds (`git grep -c '](/img/' origin/main -- docs/`) before trusting it
blindly if the repo's asset pipeline ever changes.

Never use:
- `import Image from ...` + JSX
- Absolute GitHub CDN URLs (`user-attachments`, `raw.githubusercontent.com`) for new images — those
  require a manual browser upload or a branch-pinned URL; relative paths need neither
- Absolute `/img/...` site-root paths — breaks PR/raw-file preview, see above

## Screenshot placement

Screenshot goes **after** the step it illustrates, never before. One screenshot per major step or UI state.

## Missing screenshots

If the feature isn't built yet or requires backend data that can't be seeded locally:

```markdown
:::info Screenshot coming soon
:::
```

Never use HTML comment placeholders (`<!-- SCREENSHOT: ... -->`).

## Image dimensions

Capture at **1440×900 viewport** (set in `scripts/screenshot.js`). Do not resize or compress — Docusaurus serves them at natural size and the browser scales them.
