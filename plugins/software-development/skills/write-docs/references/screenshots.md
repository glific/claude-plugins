# Screenshot System

Automated Playwright-based screenshot capture. Recipes define what to capture; `scripts/screenshot.js` (in `glific/docs`) runs them.

## Local setup (one-time)

### 1. Install Playwright

```bash
cd /path/to/glific/docs
yarn add --dev playwright js-yaml
npx playwright install chromium
```

### 2. Add credentials to `.env`

Create a `.env` file in the root of `glific/docs` (it is gitignored):

```
GLIFIC_URL=https://glific.test:3000
GLIFIC_PHONE=+91XXXXXXXXXX
GLIFIC_PASSWORD=your_password
```

Use a **test/demo account** — not a production account. The script will log in and navigate through the UI.

### 3. Local Glific must be running

Before running the screenshot script:
- Start the backend: follow `glific/glific` setup (Elixir/Phoenix on port 4001)
- Start the frontend: `cd ../glific-frontend && yarn dev` (runs at `https://glific.test:3000`)

The script ignores HTTPS certificate errors from `mkcert`, so the self-signed cert is fine.

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

- The PhoneInput component renders a flag picker + text input. The script fills the text portion with `input[name="phoneNumber"]`. If the phone field has a different rendered `name`, inspect the DOM and update the selector in `scripts/screenshot.js`.
- After login, some features require seed data (e.g., Flow list needs existing flows). Use a demo account with pre-created data.
- The frontend uses Apollo Client with WebSocket subscriptions — some pages load data asynchronously. Use `wait` steps (not `sleep`) to wait for data to appear.

## Adding a new recipe

1. Find the feature's route in `../glific-frontend/src/routes/AuthenticatedRoute/AuthenticatedRoute.tsx`
2. Find `data-testid` attributes in `../glific-frontend/src/containers/{Feature}/`
3. Create `scripts/recipes/{feature-slug}.yaml`
4. Run `node scripts/screenshot.js {feature-slug}` and iterate on selectors until all snaps land
5. Commit the recipe + screenshots together with the doc page
