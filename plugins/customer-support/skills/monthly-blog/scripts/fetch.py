#!/usr/bin/env python3
"""
Fetch the raw material for Glific's monthly release blog.

Pulls, for one calendar month:
  - closed ISSUES from the code repos (default: glific, glific-frontend)
      -> source for the "Bug Fixes" and "Enhancement Done" sections
  - merged PULL REQUESTS from the docs repo (default: docs)
      -> source for the "Documentation Update" section

Prints a single JSON object to stdout. It does NOT decide what goes in the
blog or write any prose -- that judgment is the skill's job (see SKILL.md).

Auth: uses the GitHub CLI (`gh api`) when available, which respects the
user's `gh auth login` and gives higher rate limits / private-repo access.
If `gh` is not installed, it falls back to anonymous GitHub API calls over
HTTPS (works for public repos, lower rate limit).

Usage:
  python fetch_month.py --month 2026-05
  python fetch_month.py --month 2026-05 --code-repos glific,glific-frontend --doc-repo docs
"""
import argparse, calendar, json, shutil, subprocess, sys, urllib.parse, urllib.request

ORG = "glific"
BODY_LIMIT = 500


def _date_range(month):
    try:
        year, mon = (int(x) for x in month.split("-"))
        last = calendar.monthrange(year, mon)[1]
    except Exception:
        sys.exit(f"--month must look like YYYY-MM (got: {month!r})")
    return f"{year}-{mon:02d}-01", f"{year}-{mon:02d}-{last:02d}"


def _via_gh(path):
    out = subprocess.run(
        ["gh", "api", "-H", "Accept: application/vnd.github+json", path],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        err = out.stderr.strip()
        if "gh auth login" in err or "authentication" in err.lower():
            sys.exit("GitHub CLI is not logged in. Run: gh auth login")
        sys.exit(f"gh api failed for {path}\n{err}")
    return json.loads(out.stdout)


def _via_http(path):
    url = "https://api.github.com/" + path
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "glific-monthly-blog-skill",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            sys.exit("GitHub rate limit hit (anonymous). Install & log in to "
                     "the GitHub CLI (`gh auth login`) for a higher limit.")
        sys.exit(f"GitHub API error {e.code} for {url}")


def search(query, use_gh):
    """Return all items for a search query, following pagination."""
    items, page = [], 1
    while True:
        q = urllib.parse.quote(query)
        path = f"search/issues?q={q}&per_page=100&page={page}"
        data = _via_gh(path) if use_gh else _via_http(path)
        batch = data.get("items", [])
        for it in batch:
            items.append({
                "number": it["number"],
                "title": it.get("title", ""),
                "body": (it.get("body") or "")[:BODY_LIMIT],
                "labels": [l["name"] for l in it.get("labels", [])],
                "url": it.get("html_url", ""),
            })
        if len(batch) < 100 or len(items) >= data.get("total_count", 0):
            break
        page += 1
        if page > 5:
            break
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--month", required=True, help="Target month, YYYY-MM")
    ap.add_argument("--code-repos", default="glific,glific-frontend")
    ap.add_argument("--doc-repo", default="docs")
    args = ap.parse_args()

    start, end = _date_range(args.month)
    use_gh = shutil.which("gh") is not None

    code_issues = []
    for repo in [r.strip() for r in args.code_repos.split(",") if r.strip()]:
        q = f"repo:{ORG}/{repo} is:issue is:closed closed:{start}..{end}"
        for it in search(q, use_gh):
            it["repo"] = repo
            code_issues.append(it)

    doc_prs = []
    if args.doc_repo.strip():
        repo = args.doc_repo.strip()
        q = f"repo:{ORG}/{repo} is:pr is:merged merged:{start}..{end}"
        for it in search(q, use_gh):
            it["repo"] = repo
            doc_prs.append(it)

    print(json.dumps({
        "month": args.month,
        "date_range": [start, end],
        "auth": "gh" if use_gh else "anonymous",
        "counts": {"code_issues": len(code_issues), "doc_prs": len(doc_prs)},
        "code_issues": code_issues,
        "doc_prs": doc_prs,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()