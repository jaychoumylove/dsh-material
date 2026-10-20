#!/usr/bin/env bash
# Wire dsh-material-theme into a DSH profile.
#
#   ./scripts/install.sh            # web profile
#   ./scripts/install.sh desktop    # desktop app profile
#   ./scripts/install.sh web --uninstall
#
# The plugin is linked (not copied), so edits to client/client.js are visible to
# the app after a reload/restart without reinstalling.
set -euo pipefail

PROFILE="${1:-web}"
ACTION="${2:-install}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_DIR="${DSH_HOME:-$HOME/.dsh}/profiles/$PROFILE"
TARGET="$PROFILE_DIR/node_modules/dsh-material-theme"

[ -d "$PROFILE_DIR" ] || { echo "no such profile: $PROFILE_DIR" >&2; exit 1; }
[ -f "$PROFILE_DIR/package.json" ] || { echo "profile has no package.json: $PROFILE_DIR" >&2; exit 1; }

NODE="${NODE:-$(command -v node || true)}"
[ -n "$NODE" ] && [ -x "$NODE" ] || { echo "node not found; set NODE=/path/to/node" >&2; exit 1; }

if [ "$ACTION" = "--uninstall" ] || [ "$ACTION" = "uninstall" ]; then
  rm -rf "$TARGET"
  "$NODE" - "$PROFILE_DIR/package.json" <<'JS'
const fs = require("fs")
const file = process.argv[2]
const pkg = JSON.parse(fs.readFileSync(file, "utf8"))
delete pkg.dependencies?.["dsh-material-theme"]
const bundles = pkg.dsh?.profile?.bundles
if (Array.isArray(bundles)) pkg.dsh.profile.bundles = bundles.filter((b) => b !== "dsh-material-theme")
fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
console.log("removed dsh-material-theme from", file)
JS
  echo "Uninstalled. Restart DSH Desktop to drop the layer."
  exit 0
fi

mkdir -p "$(dirname "$TARGET")"
rm -rf "$TARGET"
ln -sfn "$ROOT" "$TARGET"

"$NODE" - "$PROFILE_DIR/package.json" "$ROOT" <<'JS'
const fs = require("fs")
const [file, root] = process.argv.slice(2)
const pkg = JSON.parse(fs.readFileSync(file, "utf8"))
pkg.dependencies = pkg.dependencies ?? {}
pkg.dependencies["dsh-material-theme"] = `file:${root}`
pkg.dsh = pkg.dsh ?? {}
pkg.dsh.profile = pkg.dsh.profile ?? {}
const bundles = (pkg.dsh.profile.bundles = pkg.dsh.profile.bundles ?? [])
if (!bundles.includes("dsh-material-theme")) bundles.push("dsh-material-theme")
pkg.dsh.profile.patchReload = pkg.dsh.profile.patchReload ?? "live"
fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
console.log("wired dsh-material-theme into", file)
JS

echo
echo "Installed at $TARGET -> $ROOT"
echo "Next: restart DSH Desktop (or reload the window). The theme row shows up"
echo "      under Settings → General → Material Theme."
