# Screenshot System

Automated Playwright-based screenshot capture. Recipes define what to capture; `scripts/screenshot.js` (in `glific/docs`) runs them.

**Any reachable Glific instance works** — a local dev stack (`https://glific.test:3000`) or a
staging/demo deployment (e.g. `https://staging.glific.com`). Don't assume the user has the local
backend/frontend stack running; a staging URL is a fine default and needs no other local setup.

## One-time setup

### 1. Install Playwright (in `glific/docs`)

```bash
cd /path/to/glific/docs
yarn add --dev playwright js-yaml
npx playwright install chromium
```

### 2. Get credentials — always ask, up front

**Always ask the user for all three values before doing anything else** — don't check for a
`.env` file first, don't ask one value at a time, don't ask about approach and then circle back
for credentials. First message, one shot:

- Glific URL (local dev, e.g. `https://glific.test:3000`, or staging/demo, e.g. `https://staging.glific.com`)
- Phone number for a **test/demo account** — never production
- Password for that account

Pass the values as environment variables to the script invocation; never write the password into
a script file, a `.env` you commit, or any file that isn't gitignored.

Note: the phone field on the login page is a **country-code selector + local-number input** —
pass the number *without* the country code prefix (e.g. `7905556238`, not `+917905556238`), or
`fill()` on `input[name="phoneNumber"]` will leave the field looking empty and login will silently
not submit.

### 3. Local stack (only if using a local dev URL)

If `GLIFIC_URL` points at `glific.test`, the local backend and frontend must be running:
- Backend: follow `glific/glific` setup (Elixir/Phoenix on port 4001)
- Frontend: `cd ../glific-frontend && yarn dev` (runs at `https://glific.test:3000`)

The script ignores HTTPS certificate errors from `mkcert`, so the self-signed cert is fine. Skip
this section entirely when pointing at a staging/demo URL.

## Running the script

```bash
# Single feature
node scripts/screenshot.js flows

# All recipes
node scripts/screenshot.js

# Output lands in static/img/{output_dir}/
```

## Recipe format

Each recipe is a YAML file in `scripts/recipes/{feature-slug}.yaml`.

```yaml
name: flows               # Human-readable name
output_dir: flows         # Maps to static/img/{output_dir}/
flows:
  - name: flow_list       # Slug for this flow
    description: The list of all flows
    required: true        # If true, failure aborts the recipe. If false, logs warning and continues.
    steps:
      - navigate: /flow                        # Navigate to this path
      - wait: '[data-testid="flow-list"]'      # Wait for selector (CSS or data-testid)
      - snap: flows_list.png                   # Take screenshot, save as this filename
      - click: '[data-testid="add-flow"]'      # Click a selector
      - wait_text: Create Flow                 # Wait for visible text to appear
      - snap: flows_create_dialog.png
```

### Step types

| Step key | What it does |
|----------|-------------|
| `navigate: /path` | Go to `GLIFIC_URL + path` |
| `wait: 'selector'` | Wait for CSS selector to appear (8s timeout) |
| `wait_text: 'text'` | Wait for visible text to appear on the page |
| `click: 'selector'` | Click a CSS selector |
| `snap: filename.png` | Take a full-viewport screenshot |
| `snap: filename.png` + `element: 'selector'` | Crop to that element only — hides sidebar, nav, unrelated UI |
| `sleep: 500` | Wait N milliseconds (use sparingly, prefer `wait`) |

### Element cropping

**Always add `element:` when the screenshot should show only one section.** This keeps docs focused and avoids capturing sidebar/nav that may change independently.

```yaml
# Full viewport — only for canvas/editor views where context matters
- snap: flows_editor_canvas.png

# Cropped to element — use for lists, forms, dialogs, cards
- snap: flows_list.png
  element: '[data-testid="flow-list"]'

- snap: flows_create_dialog.png
  element: '[role="dialog"]'
```

Common element selectors:
- Dialog/modal → `[role="dialog"]`
- Named section → `[data-testid="..."]`
- Main content only (no sidebar) → `main`

### Selector strategy

Prefer in this order:
1. `[data-testid="..."]` — most stable, survives CSS refactors
2. ARIA role + name: `role=button[name="Create Flow"]`
3. Visible text: use `wait_text` step, then screenshot
4. CSS class — **avoid**, breaks on any style change

Glific's frontend has `data-testid` on most interactive elements. Check the container's `.tsx` file to find them.

### Auth flow

The script authenticates once per run using phone + password (Glific uses phone number login, not email). The session cookie is reused across all flows in the recipe.

Login selectors (from `Auth.tsx` / `Login.tsx`):
- Phone field: `input[name="phoneNumber"]`
- Password field: `input[name="password"]`
- Submit button: `[data-testid="SubmitButton"]`
- Post-login: waits for URL to contain `/chat`

### Nuances

- The PhoneInput component renders a flag picker + text input. Fill the text portion via `input[name="phoneNumber"]` with the number **without** the country code — the code is a separate selector next to it, and including it (e.g. `+917905556238`) leaves the field empty and login never fires.
- After login, some features require seed data (e.g., Flow list needs existing flows). Use a demo account with pre-created data.
- The frontend uses Apollo Client with WebSocket subscriptions — some pages load data asynchronously. Use `wait` steps (not `sleep`) to wait for data to appear.
- **List/table pages render skeleton loaders first** (gray placeholder rows) before real data arrives. Waiting only for the page header or table shell produces a screenshot full of loading skeletons. Wait for content that only exists once data has loaded — an icon inside a row's actions column, real row text, or a correct pagination count — not just the container.

## Adding a new recipe

1. Find the feature's route in `../glific-frontend/src/routes/AuthenticatedRoute/AuthenticatedRoute.tsx`
2. Find `data-testid` attributes in `../glific-frontend/src/containers/{Feature}/`
3. Create `scripts/recipes/{feature-slug}.yaml`
4. Run `node scripts/screenshot.js {feature-slug}` and iterate on selectors until all snaps land
5. Commit the recipe + screenshots together with the doc page
