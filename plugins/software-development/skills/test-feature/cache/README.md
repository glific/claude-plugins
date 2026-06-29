# Result-cache seed

This folder is the **seed** for the `test-feature` result cache. The *live* cache lives in the
**target project repo** at `.claude/test-feature/` (committed there so the team shares one
tested-scenario history). A plugin is installed read-only, so runs can't write back here — they
read/write the project copy.

| File | Role |
|------|------|
| `fingerprint.sh` | Hashes a feature's watched files → a content fingerprint. Same code → same hash (uses `git hash-object`, so uncommitted edits count). |
| `watch/<feature>.txt` | The files that define a feature (`fe:` = ../glific-frontend, `be:` = the project). Edit when a feature gains/loses relevant files. |
| `manifest.seed.json` | A snapshot of the cache (fingerprint + last run + scenarios + issues). A **static seed** — it goes stale; the live one is the project's `manifest.json`. |

## Bootstrap (first time in a project)

If the project has no `.claude/test-feature/`, copy this seed into it and rename the manifest:

```bash
mkdir -p .claude/test-feature/watch
cp "$CLAUDE_PLUGIN_ROOT/skills/test-feature/cache/fingerprint.sh" .claude/test-feature/
cp -r "$CLAUDE_PLUGIN_ROOT/skills/test-feature/cache/watch/." .claude/test-feature/watch/
cp "$CLAUDE_PLUGIN_ROOT/skills/test-feature/cache/manifest.seed.json" .claude/test-feature/manifest.json
```

From then on, `/test-feature` reads and updates **`.claude/test-feature/manifest.json`** in the
project — commit it so teammates reuse your tested scenarios.
