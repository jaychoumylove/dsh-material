#!/usr/bin/env bash
# Publish dsh-material-theme to the npm registry and (optionally) tag the repo
# so the DSH community market discovers it.
#
#   NPM_TOKEN=... ./scripts/publish.sh              # publish current version
#   NPM_TOKEN=... ./scripts/publish.sh --dry-run    # everything except the upload
#   NPM_TOKEN=... GITHUB_TOKEN=... ./scripts/publish.sh
#
# Environment:
#   NPM      npm executable (default: npm on PATH, then node's bundled npm)
#   NODE     node executable used for scripts/check.mjs
#   REPO     owner/repo used for the topic update (default: jaychoumylove/dsh-material)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DRY_RUN=""
[ "${1:-}" = "--dry-run" ] && DRY_RUN="--dry-run"

NODE="${NODE:-$(command -v node || true)}"
# npm from PATH, else the npm CLI bundled with the node above ($NPM_CLI)
if command -v npm >/dev/null 2>&1; then
  NPM=("$(command -v npm)")
elif [ -n "${NPM_CLI:-}" ]; then
  NPM=("$NODE" "$NPM_CLI")
else
  NPM=("$NODE" "$(dirname "$NODE")/../lib/node_modules/npm/bin/npm-cli.js")
fi
run_npm() { "${NPM[@]}" "$@"; }
REPO="${REPO:-jaychoumylove/dsh-material}"

name="$("$NODE" -p "require('./package.json').name")"
version="$("$NODE" -p "require('./package.json').version")"

echo "==> $name@$version"

echo "==> verification"
"$NODE" scripts/check.mjs >/tmp/dsh-material-check.log 2>&1 || {
  tail -20 /tmp/dsh-material-check.log
  echo "check failed" >&2
  exit 1
}
tail -2 /tmp/dsh-material-check.log

if [ -n "${NPM_TOKEN:-}" ]; then
  echo "==> npm auth (token)"
  run_npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN" --location=user >/dev/null
fi

echo "==> npm publish ${DRY_RUN:-}"
# shellcheck disable=SC2086
run_npm publish --access public $DRY_RUN

if [ -n "$DRY_RUN" ]; then
  echo "dry run: nothing was uploaded"
  exit 0
fi

echo "==> verifying registry"
curl -fsSL "https://registry.npmjs.org/$name/latest" | head -c 300 | tr -d '\n'
echo

if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "==> GitHub topics"
  curl -fsSL -X PUT "https://api.github.com/repos/$REPO/topics" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -d '{"names":["dsh-plugin","dsh-theme","material-theme","dsh-desktop"]}' >/dev/null
  echo "topics updated"
fi

cat <<EOF

next steps (see market/PUBLISH.md):
  1. dsh plugin --profile desktop add $name@latest
  2. submit catalog/plugins entry to imsai-sh/awesome-deepseek-harness-plugins
EOF
