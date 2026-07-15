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

Docusaurus serves `static/` at the site root. Always use `/img/` prefix (not `static/img/`):

```markdown
![Flows list](/img/flows/flows_list.png)
```

Never use:
- `import Image from ...` + JSX
- Absolute GitHub CDN URLs for new images
- Relative paths like `../../static/img/...`

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
