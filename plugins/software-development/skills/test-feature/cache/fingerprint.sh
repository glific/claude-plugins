#!/usr/bin/env bash
#
# fingerprint.sh — emit a content hash for a feature's source files.
#
# Usage:  bash .claude/test-feature/fingerprint.sh <feature>
# Reads:  .claude/test-feature/watch/<feature>.txt   (one "<repo>:<path>" per line)
#           repo = fe  -> ../glific-frontend
#           repo = be  -> this repo (glific)
# Prints: "<sha256>  files=<n>  missing=<m>"
#
# The sha changes iff any watched file's *current working-tree content* changes
# (uses `git hash-object` so uncommitted edits are detected too). The test skill
# compares this against the fingerprint stored in manifest.json: a match means the
# feature's code is unchanged and the cached scenario results can be reused instead
# of re-driving the browser.
set -euo pipefail

feature="${1:?usage: fingerprint.sh <feature>}"
here="$(cd "$(dirname "$0")" && pwd)"
be_root="$(cd "$here/../.." && pwd)"                 # .claude/test-feature -> repo root
fe_root="$(cd "$be_root/../glific-frontend" 2>/dev/null && pwd || echo "")"
watch="$here/watch/$feature.txt"

[ -f "$watch" ] || { echo "NO_WATCHLIST for '$feature' (expected $watch)"; exit 2; }

acc=""; n=0; missing=0
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%$'\r'}"
  [ -z "$line" ] && continue
  case "$line" in \#*) continue ;; esac
  repo="${line%%:*}"; path="${line#*:}"
  case "$repo" in
    fe) root="$fe_root" ;;
    be) root="$be_root" ;;
    *)  echo "BAD_REPO '$repo' in $watch"; exit 2 ;;
  esac

  if [ -n "$root" ] && [ -f "$root/$path" ]; then
    if h="$(git -C "$root" hash-object "$path" 2>/dev/null)" && [ -n "$h" ]; then :; else
      h="$(shasum -a 256 "$root/$path" | cut -d' ' -f1)"
    fi
  else
    h="MISSING"; missing=$((missing + 1))
  fi
  acc="${acc}${repo}:${path}:${h}"$'\n'
  n=$((n + 1))
done < "$watch"

sha="$(printf '%s' "$acc" | shasum -a 256 | cut -d' ' -f1)"
echo "${sha}  files=${n}  missing=${missing}"
