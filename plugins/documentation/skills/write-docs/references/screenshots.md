# Screenshot System

Automated Playwright-based screenshot capture. Recipes define what to capture; `scripts/screenshot.js` (in `glific/docs`) runs them.

**Point the script at a live deployment the user gives you** — staging, demo, or any hosted Glific
instance (e.g. `https://staging.glific.com`). Never spin up or depend on a local dev stack: a live
URL needs no local setup, and starting someone's backend and frontend is not your call.

## One-time setup

### 1. Install Playwright (in `glific/docs`)

```bash
cd /path/to/glific/docs
yarn add --dev playwright js-yaml
npx playwright install chromium
```

### 2. Get credentials — ask the user once

**Ask the user for all three values before taking any screenshot.** These are credentials to a
live Glific instance, so the user picks which instance and which account gets used — not a file
on disk.

- Glific URL of a live deployment (e.g. staging/demo `https://staging.glific.com`)
- Phone number for a **test/demo account** — never production
- Password for that account

Ask in one message, not one value at a time, and not after circling back from a question about
approach.

**Ask once per session, then reuse.** Once the user has given you the three values, keep using them
for every later run in that conversation — re-running a recipe, fixing a selector, or capturing a
second feature. Only ask again if the user says to use a different instance or account, or if the
credentials stop working.

**Never source credentials from anywhere but that answer:**

| Don't                                                           | Why                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Read `.env`, `.env.local`, or any dotfile for `GLIFIC_*` values | Whatever is in there was set for someone else's purpose, and may point at production |
| Grep a file for the phone/password and pipe it into the command | Same thing, one step removed — still not the user's choice                           |
| Write the values into `.env`, the recipe, or the script         | Passwords do not belong in files, gitignored or not                                  |

Pass the values inline to each invocation that needs them, so they live only in that command:

```bash
GLIFIC_URL={url} GLIFIC_PHONE={phone} GLIFIC_PASSWORD={password} \
  node scripts/screenshot.js {feature-slug}
```

Note: pass `GLIFIC_PHONE` in whatever form the user gave it — `+917905556238`, `917905556238`, and
`7905556238` all work. The runner reduces it to the local part itself, so don't hand-strip the
country code. See **Auth flow** below for why that normalising step exists.

Note this does **not** change where you read code: source always comes from GitHub
(`glific/glific-frontend`, `glific/glific`), never from a local checkout.

## Running the script

```bash
# Single feature
GLIFIC_URL={url} GLIFIC_PHONE={phone} GLIFIC_PASSWORD={password} \
  node scripts/screenshot.js flows

# All recipes
GLIFIC_URL={url} GLIFIC_PHONE={phone} GLIFIC_PASSWORD={password} \
  node scripts/screenshot.js

# Output lands in static/img/{output_dir}/
```

## Recipe format

Each recipe is a YAML file in `scripts/recipes/{feature-slug}.yaml`.

```yaml
name: flows # Human-readable name
output_dir: flows # Maps to static/img/{output_dir}/
flows:
  - name: flow_list # Slug for this flow
    description: The list of all flows
    required: true # If true, failure aborts the recipe. If false, logs warning and continues.
    steps:
      - navigate: /flow # Navigate to this path
      - wait: '[data-testid="flow-list"]' # Wait for selector (CSS or data-testid)
      - snap: flows_list.png # Take screenshot, save as this filename
      - click: '[data-testid="add-flow"]' # Click a selector
      - wait_text: Create Flow # Wait for visible text to appear
      - snap: flows_create_dialog.png
```

### Step types

| Step key                                     | What it does                                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `navigate: /path`                            | Go to `GLIFIC_URL + path`, waiting only for `domcontentloaded` — **always follow with a `wait`**                       |
| `wait: 'selector'`                           | Wait for CSS selector to appear (8s timeout)                                                                           |
| `wait_text: 'text'`                          | Wait for visible text to appear on the page                                                                            |
| `click: 'selector'`                          | Click a CSS selector                                                                                                   |
| `click_optional: 'selector'`                 | Click it if it's there, move on if it isn't — for announcement banners, tips, and other UI that appears only sometimes |
| `hover: 'selector'`                          | Hover the first match — for UI that only appears on hover (tooltips, row previews)                                     |
| `move_mouse_away: true`                      | Park the cursor in a corner so leftover hover state doesn't bleed into the next snap                                   |
| `snap: filename.png`                         | Take a full-viewport screenshot                                                                                        |
| `snap: filename.png` + `element: 'selector'` | Crop to that element only — hides sidebar, nav, unrelated UI                                                           |
| `sleep: 500`                                 | Wait N milliseconds (use sparingly, prefer `wait`)                                                                     |

**`navigate` does not wait for the network to settle.** The app holds a websocket open and some list
pages poll on a timer, so the network never goes idle and waiting for it would hang. What actually
establishes that a page is ready is your `wait` step — a `navigate` with no `wait` after it will
screenshot a half-rendered page.

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

**The script logs in exactly once per run, no matter how many flows the recipe has.** It
authenticates in a throwaway context, captures the browser `storageState`, and seeds every
per-flow context with it. Each flow still gets its own context — that keeps `--video` recordings
separate — but it opens already signed in.

Glific keeps its session in `localStorage` (`glific_session`, `glific_user`,
`organizationServices`), not in a cookie. Playwright's `storageState()` captures `localStorage`
alongside cookies, which is what makes the one-login approach work.

Login is retried up to **3 times** before the run gives up, because a cold or busy instance can
take a while to hand back a session.

Login selectors (from `Auth.tsx` / `Login.tsx`):

- Phone field: `input[name="phoneNumber"]`
- Password field: `input[name="password"]`
- Submit button: `[data-testid="SubmitButton"]`
- Post-login: waits for URL to contain `/chat` (45s — the first load after a deploy is slow)

If you ever see the login form appear once per flow, the `storageState` is not reaching the
per-flow contexts — fix the runner rather than living with 13 logins in a 13-flow recipe. Don't add
a login step to a recipe; authentication is the runner's job, not the recipe's.

#### The phone field

`PhoneInput` **prepends the dial code to whatever you type**. That makes it the single most
fragile part of the run, and the runner handles three separate traps so recipes don't have to:

- Filling it with a number that already carries the country code produces `+91917905556238`, and
  the API answers **401**. The runner reduces `GLIFIC_PHONE` to its local part first, so any input
  form works.
- The dial code is inserted **asynchronously after mount**. Filling before it lands gives a value
  with no code at all, so the runner waits for a leading `+<digit>` in the field before typing.
- **Never clear the field first.** Clearing removes the dial code, leaving the component nothing to
  prepend.

After filling, the runner verifies the field reads `+{dialCode}{local}` and retries up to 3 times,
failing with the actual field contents rather than silently submitting a wrong number. The dial
code defaults to `91`; a non-`91` number needs that default changed in `screenshot.js`.

### Nuances

- The phone field needs care, but the runner already handles it — see **The phone field** above. Don't normalise `GLIFIC_PHONE` yourself or add login steps to a recipe.
- After login, some features require seed data (e.g., Flow list needs existing flows). Use a demo account with pre-created data.
- The frontend uses Apollo Client with WebSocket subscriptions — some pages load data asynchronously. Use `wait` steps (not `sleep`) to wait for data to appear.
- **List/table pages render skeleton loaders first** (gray placeholder rows) before real data arrives. Waiting only for the page header or table shell produces a screenshot full of loading skeletons. Wait for content that only exists once data has loaded — an icon inside a row's actions column, real row text, or a correct pagination count — not just the container.

## Adding a new recipe

Read both source files from GitHub, not from a local checkout:

1. Find the feature's route:
   ```bash
   gh api repos/glific/glific-frontend/contents/src/routes/AuthenticatedRoute/AuthenticatedRoute.tsx \
     -H 'Accept: application/vnd.github.raw'
   ```
2. Find `data-testid` attributes in the feature's containers:
   ```bash
   gh api repos/glific/glific-frontend/contents/src/containers/{Feature} --jq '.[].name'
   gh api repos/glific/glific-frontend/contents/src/containers/{Feature}/{File}.tsx \
     -H 'Accept: application/vnd.github.raw' | grep data-testid
   ```
3. Create `scripts/recipes/{feature-slug}.yaml`
4. Ask the user for credentials, then run the script with them inline and iterate on selectors until all snaps land
5. Commit the recipe + screenshots together with the doc page
