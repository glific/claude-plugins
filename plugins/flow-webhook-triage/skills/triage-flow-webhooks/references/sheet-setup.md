# Setup — sheet and AppSignal

One-time, by whoever owns the triage sheet. Everyone else needs only the URL and token.

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
| Who has access | **Anyone with the link** |

"Execute as: Me" is what makes the no-shared-creds property work — the script writes with the
owner's identity. "Anyone with the link" governs who may *call* it, which is why step 3 isn't
optional.

Google will ask you to authorise the script against your account. The "unverified app" warning
is expected for a personal script — Advanced → Go to (project).

Copy the `/exec` URL.

## 5. Point the skill at it

```bash
export GLIFIC_TRIAGE_SHEET_URL="https://script.google.com/macros/s/AKfycb.../exec"
export GLIFIC_TRIAGE_TOKEN="the token from step 3"
```

Put these in your shell profile, not in the repo. Verify:

```bash
node scripts/append-to-sheet.mjs watermark
# -> {"lastSeen":null,"incidentIds":[],"rowCount":0}
```

**If you get HTML instead of JSON**, the deployment's access is wrong — you're seeing a Google
login page. Redeploy with "Anyone with the link".

**After editing `Code.gs`, deploy a new version.** Saving alone does nothing; the `/exec` URL
keeps serving the old code. Deploy → Manage deployments → edit → Version: New version.

## Sharing with the team

Share the sheet read-only with whoever should see the results, and give the URL + token only
to people who should be able to *write*. Reading the sheet needs no token at all.

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
