# Glific Monthly Review — Data Sources Reference

## Google Sheets

### KPI Master Sheet
- **File ID**: `1K6gkFSU2TGf9bNRE0gFGiDXqKQhiXKHIoJjzABcDeFg` *(replace with actual)*
- **Sheet**: "KPI Dashboard" (or the tab containing all KPI rows)
- MCP tool: `read_file_content` with the file ID

| Section | KPI Labels to Find | Notes |
|---|---|---|
| Overall | Orgs on Glific, WhatsApp messages sent/month, Active orgs (last 30d), Active contacts, CSP MRR, Consulting Revenue YTD, Other Revenue YTD | Row labels in column A, values in the current month column |
| Biz Dev | Leads in pipeline, SQLs, Demos done, Proposals sent, Deals closed, MRR new this month | |
| CS Consulting | Consulting Revenue (month), Consulting Revenue (YTD), Churn Rate, Consulting Org Names | Org names may be a comma-separated list in one cell |
| CS Support | P0 issues (count + avg resolution hrs), P1 issues (count + avg resolution hrs), # of Incidents | # of Incidents cell should have a hyperlink to the Drive incidents folder |
| Platform | Deployments/week, Uptime %, Critical bugs open | |

---

### Biz Dev Tracker Sheet
- **File ID**: `1BizDevTrackerFileIdHere` *(replace with actual)*
- **Sheet tab**: "Monthly Tracker" or similar
- **Column layout**: Column A = category/label; monthly columns across the top (e.g., "Apr 2026", "May 2026")
- **What to extract**: Rows under "This Month Updates" and "Next Month Plan" for the target month column

> ⚠️ **Size warning**: This sheet is large (~230K chars). After reading, save to a temp file and use Python to filter:
> ```bash
> python3 -c "
> import sys, json
> data = open('/tmp/bizdev_raw.txt').read()
> lines = [l for l in data.splitlines() if 'month' in l.lower() or 'update' in l.lower() or 'plan' in l.lower()]
> print('\n'.join(lines[:100]))
> "
> ```

---

### CS / Product Tracker Sheet
- **File ID**: `1CSProductTrackerFileIdHere` *(replace with actual)*
- **Sheet tab**: "CS Updates" or "Monthly" or similar
- **Column layout**: Column A = section (CS Consulting / Platform); subsequent columns = months
- **What to extract**:
  - CS Consulting rows → `csConsulting.thisMonth` and `csConsulting.nextMonth`
  - Blog/release notes row → `platformOps.monthlyUpdates` (append to GitHub PR list)
- **Previous month column**: For CS Consulting updates, read the **previous month's** column (the month before the target month)

---

## GitHub

### Repositories to check

| Repo | Purpose | Endpoint |
|---|---|---|
| `glific/docs` | Documentation PRs → CS Support docUpdates | `https://api.github.com/repos/glific/docs/pulls?state=closed&per_page=20` |
| `glific/glific` | Backend PRs → Platform monthly updates | `https://api.github.com/repos/glific/glific/pulls?state=closed&per_page=30` |
| `glific/glific-frontend` | Frontend PRs → Platform monthly updates | `https://api.github.com/repos/glific/glific-frontend/pulls?state=closed&per_page=30` |

### Filtering PRs by month
After fetching, filter by `merged_at` date falling within the target month:
```python
import json, sys
from datetime import datetime

month_str = "2026-04"   # change to target month YYYY-MM
prs = json.loads(open('/tmp/prs_raw.json').read())
filtered = [
    pr['title'] for pr in prs
    if pr.get('merged_at') and pr['merged_at'].startswith(month_str)
]
print(json.dumps(filtered, indent=2))
```

### Platform GitHub Project Board (Next Month)
- **URL**: `https://github.com/orgs/glific/projects/8/views/16`
- **Note**: Page is client-rendered (JavaScript). `web_fetch` returns an empty shell.
- **Fallback**: Use Claude in Chrome MCP:
  ```
  mcp__Claude_in_Chrome__navigate  → URL above
  mcp__Claude_in_Chrome__get_page_text  → extract "In Progress" / "Next Sprint" items
  ```

---

## Data Compilation Notes

- **Overall slide updates** (right panel): Synthesise 0–3 bullets from the other 4 slides — pick the most impactful highlights, not raw data.
- **CS Consulting org names**: If the KPI cell is a comma-separated list, split into individual org names for the KPI row value.
- **Platform monthly updates deduplication**: Merge CS/Product sheet blog bullets + glific/glific PRs + glific-frontend PRs, then deduplicate any that mention the same feature.
- **# of Incidents hyperlink**: When building the `csSupport.kpis` array, set `labelHyperlink` to the Google Drive incidents folder URL found in the KPI sheet cell's hyperlink.
