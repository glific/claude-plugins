# Setup — sheet and AppSignal

## Read this first: there is ONE shared sheet

The team writes to a single sheet. That is the point — dedup, `times_seen`, and the
month-scale pattern analysis all depend on everyone's runs landing in the same place. Six
personal sheets would mean six diagnoses of the same incident and no shared history.

So **most people do not do the sheet setup at all.** Only its owner does, once.

**If a sheet already exists** (ask the team), you need three env vars and nothing else — no
Apps Script, no deploy, no sheet creation:

```bash
export GLIFIC_TRIAGE_WEBAPP_URL="...the team's /exec URL..."  # shared with you
export GLIFIC_TRIAGE_TOKEN="...the team's token..."          # shared with you
export APPSIGNAL_API_KEY="...your own Personal API token..." # YOURS — see below
```

The first two are the owner's and get shared (password manager, not the repo). The third is
personal: AppSignal tokens are tied to your identity, so sharing one destroys attribution and
means revoking it breaks everyone. Generate your own.

Then skip to **AppSignal access** below. The rest of this page is for the sheet's owner.

---

# Owner setup

One-time, by whoever owns the triage sheet. Do this only if there is no sheet yet, or you
deliberately need a separate one (staging vs prod, a different team).

## Why it's built this way

Sharing a sheet as "anyone with the link can edit" makes it writable by a **human in a
browser**. It does not make it writable by a script — the Sheets API requires OAuth for any
write, and an API key only ever grants read access to published sheets.

So something must authenticate. The options were a service-account JSON (a real credential,
shared with everyone who runs the skill) or an Apps Script Web App bound to the sheet, which
Google runs **as the sheet's owner**. The second shares no credentials: the deployment URL is
the only secret, and it can be revoked by redeploying.

## 1. Create the sheet

A blank Google Sheet. The script creates and formats the `triage` tab on first write — don't
hand-make it, or the column order may not match.

## 2. Add the script

Extensions → Apps Script. Delete the placeholder `Code.gs` and paste the contents of
`../scripts/apps-script/Code.gs`. Save.

## 3. Set a token

In the Apps Script editor: Project Settings → Script Properties → Add:

| Property | Value |
|---|---|
| `TRIAGE_TOKEN` | any long random string |

This matters. The deployment is reachable by anyone with the URL, so without a token, anyone
who gets the link can write rows. If the property is absent the script accepts any request —
tolerable for a throwaway test, not for the real sheet.

## 4. Deploy

Deploy → New deployment → **Web app**:

| Field | Value |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

"Execute as: Me" is what makes the no-shared-creds property work — the script writes with the
owner's identity.

"Who has access" must be **Anyone** (older Google docs call this "Anyone with the link"). The
other choices all require the *caller* to be signed into Google, and the script POSTs with a
plain `fetch` that has no Google session — it would be bounced to a login page and get HTML
back instead of JSON:

| Option | Works? |
|---|---|
| **Anyone** | ✅ no caller auth — `TRIAGE_TOKEN` is what guards it |
| Anyone with Google account | ❌ caller must be signed in |
| Anyone within *your org* | ❌ same, just narrower |
| Only myself | ❌ same |

**Anyone** is why step 3 is not optional. The URL is unguessable and the token is checked on
every write, so a leaked URL without the token gets `unauthorized`.

Google will ask you to authorise the script against your account. The "unverified app" warning
is expected for a personal script — Advanced → Go to (project).

Copy the `/exec` URL.

## 5. Point the skill at it

```bash
export GLIFIC_TRIAGE_WEBAPP_URL="https://script.google.com/macros/s/AKfycb.../exec"
export GLIFIC_TRIAGE_TOKEN="the token from step 3"
```

Put these in your shell profile, not in the repo. Verify:

```bash
node scripts/append-to-sheet.mjs watermark
# -> {"lastSeen":null,"incidentIds":[],"rowCount":0}
```

**If you get HTML instead of JSON**, the deployment's access is wrong — you're seeing a Google
login page. Redeploy with "Who has access" set to **Anyone**.

**After editing `Code.gs`, deploy a new version.** Saving alone does nothing; the `/exec` URL
keeps serving the old code. Deploy → Manage deployments → edit → Version: New version.

## Who can see what — two separate doors

These get conflated constantly. They are unrelated:

| Door | Guarded by | Grants |
|---|---|---|
| **The sheet** | normal Google sharing | reading/editing the actual data |
| **The `/exec` URL** | `TRIAGE_TOKEN` | appending rows, reading the watermark |

The token does **not** grant access to the sheet. Someone with the URL + token can write rows
and enumerate incident ids; they cannot open the sheet unless you share it with their Google
account. Conversely, someone you've shared the sheet with can read everything without ever
knowing the token.

**When a teammate runs the triage**, their client POSTs to your URL with the token, and Google
executes the script as *you* — so the row lands under your identity. They never handle your
credentials, and you never handle theirs. To let them *see* results, share the sheet read-only.

**How the write finds your sheet without a sheet id anywhere:** the script is *bound* to the
spreadsheet — created from inside it via Extensions → Apps Script — so
`SpreadsheetApp.getActiveSpreadsheet()` resolves to its container. ("Active" is a misnomer; it
means "the sheet I belong to", not "the sheet someone has open".) The identity lives in the
deployment, not the code, which is why the URL alone routes a teammate's rows into your sheet,
and why the same `Code.gs` can back a second sheet with no edits.

So there are three things to hand out, for three different purposes:

| To let them… | Give them | How |
|---|---|---|
| **see** results | the sheet | Google share, read-only |
| **run** the triage | the `/exec` URL + `TRIAGE_TOKEN` | password manager or DM — never the repo |
| **own a separate sheet** | nothing — they follow *Owner setup* | only for a genuinely separate scope |

**If the token leaks**, someone can write junk rows and read incident ids. Rotate it: change
`TRIAGE_TOKEN` in Script Properties and redeploy. The old token dies immediately.

**The bigger risk is the sheet being over-shared** — that exposes every diagnosis at once.
Keep it to the people who need it.

## Personal data

Incident text comes from providers and can quote a contact's phone number, their message, or
an echoed credential. Glific carries WhatsApp traffic for NGOs, so treat this as a real risk,
not a theoretical one.

`append-to-sheet.mjs` redacts phone numbers, emails, credentials, JWTs and opaque blobs from
free-text fields before they leave. Verify it still works after any edit:

```bash
node scripts/test-redact.mjs
```

**It is a backstop, not a guarantee.** Regexes cannot catch a name in prose or a sentence a
contact typed — the test file documents these limits explicitly rather than hiding them. The
controls that actually hold are: keep sheet sharing tight, and write diagnoses that paraphrase
instead of quoting. The SKILL's "Personal data" section is the rule the diagnosis step follows.

`contact_id` is deliberately not a column. `org_id` and `flow_id` are — they're pseudonymous
and the trend analysis needs them.

## AppSignal access

Incident data comes from the `project-tech4dev` org, app `Glific/prod`. The skill uses
`scripts/fetch-incidents.mjs` (GraphQL, no MCP needed), or an AppSignal connector/MCP server
if one happens to be available.

### Get the right token — this is the part everyone gets wrong

AppSignal has **two kinds of key**, and they are not interchangeable:

| Kind | Where it lives | Direction | Reads incidents? |
|---|---|---|---|
| **Push API key** | App settings → Push & deploy | your app → AppSignal | **No.** Write-only. |
| **Personal API token** | **User** settings → Personal API tokens | you → AppSignal | Yes |

Glific's own config uses the push key (`APPSIGNAL_PUSH_API_KEY` in `config/runtime.exs`) — that
is how the running app *sends* errors. It cannot read anything back. Copying it here gets a 401.

You want a **Personal API token**, from *your user settings*, not the app's page:

```bash
# ~/.zshrc
export APPSIGNAL_API_KEY="your-personal-api-token"
```

Then open a new shell and check:

```bash
node scripts/fetch-incidents.mjs verify
# token OK — authenticated as am***@projecttech4dev.org
#   org: project-tech4dev (Project Tech4Dev)
```

A 401 here means it's still a push key. The env var is not the issue — `export FOO=bar` in
`.zshrc` *is* an env var, and it is the right place for it. Only the value needs changing.

### If the query breaks

The GraphQL query in `fetch-incidents.mjs` has not been validated against a live token. If it
errors on field names:

```bash
node scripts/fetch-incidents.mjs introspect
```

That dumps the real schema; correct `QUERY` to match. The output contract (one object per
incident, with the tags) is what the rest of the skill depends on — the query is just how you
get there.

### Using an MCP server instead

Two different things get called "setting up AppSignal MCP":

- **A claude.ai connector** — appears as `mcp__claude_ai_AppSignal__*`, alongside Gmail/Drive.
  Works in Claude Code, Desktop, and Cowork, but interactively only.
- **A CLI MCP server** — declared in `~/.claude.json` or a project `.mcp.json` under
  `mcpServers`. Local to Claude Code.

To see what's declared:

```bash
cat ~/.claude.json | python3 -c "import sys,json; d=json.load(sys.stdin); print('global:', list(d.get('mcpServers',{}).keys())); [print(k, list(v.get('mcpServers',{}).keys())) for k,v in d.get('projects',{}).items() if v.get('mcpServers')]"
```

Note that **a token in your shell does not declare a server**. If nothing is listed, no
AppSignal tools will appear no matter how valid the token is — that's what
`fetch-incidents.mjs` exists to sidestep.
