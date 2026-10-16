#!/usr/bin/env bash
#
# Publish the churning data files to the orphan `data` branch as ONE commit.
#
# The branch is force-pushed on every run, so it never accumulates history, while
# force-pushing keeps the previous snapshot available as jobs.previous.json for
# rollback. A branch whose history is destroyed on each run needs that escape
# hatch, because a bad collect would otherwise be unrecoverable from git:
#
#   cp data/jobs.previous.json data/jobs.json
#   git push origin main --allow-empty   # re-deploy with the previous snapshot
#
# Usage: scripts/publish-data.sh <remote-url>
#   scripts/publish-data.sh "https://x-access-token:$TOKEN@github.com/owner/repo.git"

set -euo pipefail

REMOTE_URL="${1:?usage: publish-data.sh <remote-url>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT/data/jobs.json" ]; then
  echo "data/jobs.json is missing; refusing to publish an empty snapshot." >&2
  exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# Carry the snapshot currently on the branch across as the rollback copy.
if git -C "$ROOT" fetch --depth=1 "$REMOTE_URL" data 2>/dev/null; then
  OLD="$(mktemp -d)"
  if git -C "$ROOT" archive FETCH_HEAD 2>/dev/null | tar -x -C "$OLD"; then
    if [ -f "$OLD/jobs.json" ]; then
      cp "$OLD/jobs.json" "$STAGE/jobs.previous.json"
    fi
  fi
  rm -rf "$OLD"
fi

cp "$ROOT/data/jobs.json" "$STAGE/jobs.json"
if [ -f "$ROOT/data/state.json" ]; then
  cp "$ROOT/data/state.json" "$STAGE/state.json"
fi

mkdir -p "$STAGE/history"
if [ -d "$ROOT/data/history" ]; then
  cp -R "$ROOT/data/history/." "$STAGE/history/"
fi

cat > "$STAGE/README.md" <<'EOF'
# data

Squashed data branch, force-pushed on every collector run so job data does not
accumulate in the repository history. Do not send pull requests here; the
contents are overwritten.

| File | Purpose |
|---|---|
| `jobs.json` | current snapshot |
| `jobs.previous.json` | previous run, kept for rollback |
| `state.json` | collector rate-limit state |
| `history/` | daily counts |

Curated data (companies, programs, facts, profile) lives on the `main` branch.
EOF

cd "$STAGE"
git init -q -b data
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A
git commit -q -m "data: snapshot $(date -u +'%Y-%m-%d %H:%M:%SZ')"
git push -q -f "$REMOTE_URL" data

echo "Published $(du -h "$STAGE/jobs.json" | cut -f1) snapshot to the 'data' branch."
