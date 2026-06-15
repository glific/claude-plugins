---
name: npm-vet-package
description: Vet an npm package for safety before using it. Checks release recency, outside contributor activity, security update hygiene, and GitHub stars. Rates risk as low/medium/high and blocks high-risk packages even if the user explicitly requests them. Trigger this before adding or recommending any npm/frontend package.
---

# npm Package Vetting

## When to use

Invoke this skill **before** adding, installing, or recommending any npm package — whether you chose it yourself or the user named a specific package. This includes:

- Suggesting a package to solve a problem
- Running `npm install`, `yarn add`, `pnpm add`, or equivalent
- Importing a new package not already in `package.json`
- Upgrading a package to a major version you have not vetted before

Even if the user explicitly asks to use a specific package, run the vetting first.

## Inputs

- `package` — the npm package name (e.g. `react-query`, `lodash`, `axios`)

If the package name is not provided, ask for it before proceeding.

## Vetting procedure

Run all checks in parallel (use WebSearch or WebFetch as needed). Collect data for each criterion below.

### Criterion 1 — Recent release activity (last few months)

- Fetch the npm registry page: `https://registry.npmjs.org/<package-name>`
- Check the `time` field for the most recent version publish date.
- **Pass**: a new version was published within the last 6 months.
- **Warn**: last version is 6–18 months ago.
- **Fail**: no release in more than 18 months, or package is marked deprecated.

### Criterion 2 — Outside contributor activity

- Find the GitHub repository linked in the npm page (`repository` field or homepage).
- Use WebSearch or WebFetch to check: `https://github.com/<owner>/<repo>/graphs/contributors`
- **Pass**: 3 or more contributors with commits in the last 12 months who are not the sole maintainer.
- **Warn**: 1–2 outside contributors recently active, or activity is sparse.
- **Fail**: only one contributor (sole maintainer), or all commits are from a single person/bot in the last year.

### Criterion 3 — Security update hygiene

- Check the npm advisory database via WebFetch: `https://registry.npmjs.org/-/npm/v1/security/advisories/search?text=<package-name>`
- Also search using WebSearch: `site:github.com/<owner>/<repo> "security" "CVE" OR "vulnerability" OR "patch"`
- **Pass**: no open CVEs; any past advisories have been patched promptly (within 90 days of disclosure).
- **Warn**: one open advisory that is low-severity, or past patches took 90–180 days.
- **Fail**: unpatched moderate/high/critical CVE open for more than 90 days, or maintainer has a history of ignoring security issues.

### Criterion 4 — GitHub stars

- Fetch the GitHub repo metadata (via WebFetch or WebSearch) and read the star count.
- **Pass**: ≥ 1 000 stars.
- **Warn**: 100–999 stars.
- **Fail**: fewer than 100 stars.

## Risk rating

Score each criterion:
- Pass = 0 points
- Warn = 1 point
- Fail = 2 points

| Total points | Risk level |
|---|---|
| 0 | **Low** |
| 1–2 | **Medium** |
| 3+ | **High** |

Any single **Fail on Criterion 3** (unpatched security vulnerability) immediately elevates the rating to **High**, regardless of other scores.

## Decision rules

### Low risk
Continue with the task. Include a brief one-line note to the user:

> **Package vetting — Low risk**: `<package>` passed all checks. Safe to use.

### Medium risk
Continue with the task **but warn the user** with a concise summary before proceeding:

> **Package vetting — Medium risk**: `<package>` raised concerns:
> - [list each Warn/Fail criterion and the specific finding]
>
> Proceeding, but consider evaluating alternatives.

### High risk
**Stop immediately.** Do not install, import, or recommend the package. Inform the user:

> **Package vetting — High risk: cannot use `<package>`**
>
> This package failed the following checks:
> - [list each Fail criterion and the specific finding]
>
> Using this package carries significant risk. I will not proceed with it even if explicitly requested.
>
> Suggested alternatives: [list 1–3 well-vetted alternatives that solve the same problem, if known]

If the user re-asks to use the same high-risk package, re-state the finding and decline again. Do not comply.

## Output format

Always present the vetting result **before** any code, installation command, or import suggestion. Use the format:

```
## Package vetting: <package-name>

| Criterion | Result | Detail |
|---|---|---|
| Recent releases | ✅ Pass / ⚠️ Warn / ❌ Fail | <date of last release> |
| Outside contributors | ✅ Pass / ⚠️ Warn / ❌ Fail | <number of recent outside contributors> |
| Security hygiene | ✅ Pass / ⚠️ Warn / ❌ Fail | <advisory status summary> |
| GitHub stars | ✅ Pass / ⚠️ Warn / ❌ Fail | <star count> |

**Risk rating: Low / Medium / High**
```

Then apply the decision rule above.

## If data is unavailable

If any criterion cannot be checked (e.g. private repo, no GitHub link, network error):

- Treat that criterion as **Warn** (not a hard Fail), except for security — treat a missing security check as **Warn** unless you have other signals.
- Note clearly which checks could not be completed and why.
- Do not skip vetting entirely; partial data is better than no vetting.

## Notes

- This vetting applies to **new** packages being added. It is not required for packages already listed in `package.json` unless you are upgrading to a new major version.
- When multiple packages are being added at once, vet each one before proceeding.
- For well-known, industry-standard packages (e.g. `react`, `typescript`, `eslint`), you may skip the full check and note: "Skipped vetting — widely adopted standard package." Only apply this shortcut to packages with >50 000 GitHub stars and ubiquitous ecosystem usage.
