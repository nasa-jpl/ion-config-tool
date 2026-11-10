#!/usr/bin/env bash
#
#   ci-build.sh
#
# Build the editor and CLI and stage the same tree that dorelease.sh
# produces, then package it as dist/ionconfig-<ver>.tar.gz, .zip and
# dist/SHA256SUMS. Runs on a clean Linux checkout (CI) or locally.
#
# inputs:  release.json, release.notes, script/rel.*, editor/, cli/,
#          manual/, dict/docs/, editor/src/json/*.json
#
# outputs: dist/ionconfig-<ver>/     (staged tree, for inspection)
#          dist/ionconfig-<ver>.tar.gz
#          dist/ionconfig-<ver>.zip
#          dist/SHA256SUMS
#
# Notes:
#  - Version comes from release.json ionConfigVersion (single source).
#  - json/ is copied from editor/src/json. dorelease.sh copies dict/json_latest,
#    which is a gitignored copy of editor/src/json made by the dictionary
#    scripts; CI does not run those scripts, so the source is used directly.
#  - editor/make.sh rewrites editor/src/App.jsx; it is restored from a
#    backup on exit so the working tree is unchanged by this script.
#  - Packaging uses "npm ci --omit=dev" for cli/ so the release does not
#    bundle dev dependencies. dorelease.sh copied the build tree's
#    node_modules as-is; this is a deliberate content change.
#
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

VERSION="$(python3 -c 'import json; print(json.load(open("release.json"))["ionConfigVersion"])')"
export VERSION
if [ -z "$VERSION" ]; then
  echo "ci-build.sh: could not read ionConfigVersion from release.json" >&2
  exit 1
fi
echo "Building ionconfig $VERSION"

# editor/make.sh stamps the version into App.jsx; restore it on any exit.
app="editor/src/App.jsx"
app_backup="$(mktemp)"
cp "$app" "$app_backup"
restore_app() {
  cp "$app_backup" "$app"
  rm -f "$app_backup"
}
trap restore_app EXIT

echo "--- editor"
(cd editor && npm ci && ./make.sh)

echo "--- cli"
(cd cli && npm ci && ./make.sh)
for prog in checkdtn dtn2ion ionconfig ionsurvey; do
  if [ ! -f "cli/bin/$prog.js" ]; then
    echo "ci-build.sh: missing cli/bin/$prog.js" >&2
    exit 1
  fi
done

dist="$root/dist"
rel="$dist/ionconfig-$VERSION"
rm -rf "$dist"
mkdir -p "$rel/json" "$rel/cli" "$rel/editor" "$rel/dictionary"

echo "--- staging $rel"
cp release.json release.notes "$rel/"
cp script/rel.README "$rel/README"
cp script/rel.ion3node.json "$rel/ion3node.json"

cp editor/src/json/*.json "$rel/json/"

cp cli/package*.json "$rel/cli/"
cp -R cli/bin/*.js "$rel/cli/"
cp -R cli/docs "$rel/cli/"
(cd "$rel/cli" && npm ci --omit=dev)

cp -R manual "$rel/editor/"
cp -R editor/build/* "$rel/editor/"

cp dict/docs/* "$rel/dictionary/"

echo "--- packaging"
tar -czf "$dist/ionconfig-$VERSION.tar.gz" -C "$dist" "ionconfig-$VERSION"
(cd "$dist" && zip -qr "ionconfig-$VERSION.zip" "ionconfig-$VERSION")
(cd "$dist" && sha256sum "ionconfig-$VERSION.tar.gz" "ionconfig-$VERSION.zip" > SHA256SUMS)

echo "Built:"
ls -l "$dist"
