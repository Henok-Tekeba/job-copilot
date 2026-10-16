#!/usr/bin/env bash
#
# Sync the churning data files out of the orphan `data` branch into ./data.
#
# Why this exists: data/jobs.json is ~5 MB and is rewritten on every collector
# run. Committing it to main added roughly 15 MB to the repository history per
# day. It now lives on a `data` branch that is force-pushed as a single commit,
# so its history never grows.
#
# Curated data (companies.json, programs.json, facts.json, ...) stays on main;
# only the churning files are synced here.
#
# Usage: scripts/sync-data.sh [remote]      (default: origin)

set -euo pipefail

REMOTE="${1:-origin}"
BRANCH="data"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/data"

if ! git -C "$ROOT" fetch --depth=1 "$REMOTE" "$BRANCH" 2>/dev/null; then
  echo "No '$BRANCH' branch on '$REMOTE' yet; leaving ./data unchanged."
  exit 0
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# `git archive` reads the fetched tree without touching the working copy.
git -C "$ROOT" archive FETCH_HEAD | tar -x -C "$STAGE"

mkdir -p "$DEST/history"

for file in jobs.json jobs.previous.json state.json; do
  if [ -f "$STAGE/$file" ]; then
    cp "$STAGE/$file" "$DEST/$file"
  fi
done

if [ -d "$STAGE/history" ]; then
  cp -R "$STAGE/history/." "$DEST/history/"
fi

echo "Synced job data from '$REMOTE/$BRANCH'."
