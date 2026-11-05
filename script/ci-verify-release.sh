#!/usr/bin/env bash
#
#   ci-verify-release.sh
#
# Check a packaged ionconfig release tarball against the expected layout.
#
# usage: ci-verify-release.sh <tarball> <expected-version>
#
# Checks:
#  - the tarball has exactly one top-level directory, ionconfig-<ver>
#  - every entry in script/ci-release-manifest.txt is present
#  - editor/index.html has no absolute /static references
#  - editor/index.html <title> is "IonConfig <ver>"
#  - the CLI starts without a module-not-found error
#
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <tarball> <expected-version>" >&2
  exit 2
fi
tarball="$1"
ver="$2"

here="$(cd "$(dirname "$0")" && pwd)"
manifest="$here/ci-release-manifest.txt"

fail() {
  echo "ci-verify-release: FAIL: $*" >&2
  exit 1
}

[ -f "$tarball" ] || fail "tarball not found: $tarball"
[ -f "$manifest" ] || fail "manifest not found: $manifest"

top_count="$(tar -tzf "$tarball" | cut -d/ -f1 | sort -u | wc -l | tr -d ' ')"
top_name="$(tar -tzf "$tarball" | cut -d/ -f1 | sort -u)"
[ "$top_count" = "1" ] || fail "expected one top-level entry, found $top_count"
[ "$top_name" = "ionconfig-$ver" ] || fail "top-level is '$top_name', expected 'ionconfig-$ver'"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
tar -xzf "$tarball" -C "$tmp"
root="$tmp/ionconfig-$ver"

# Layout manifest: entries ending in "/" must be directories.
while IFS= read -r entry; do
  case "$entry" in
    ''|\#*) continue ;;
    */)
      [ -d "$root/${entry%/}" ] || fail "missing directory: $entry"
      ;;
    *)
      [ -f "$root/$entry" ] || fail "missing file: $entry"
      ;;
  esac
done < "$manifest"

index="$root/editor/index.html"
if grep -Eq '(href|src)="/static' "$index"; then
  fail "editor/index.html has absolute /static references"
fi
if ! grep -Fq "<title>IonConfig $ver</title>" "$index"; then
  fail "editor/index.html title is not 'IonConfig $ver'"
fi

# Smoke test: the CLI must load its modules. Exit status is not checked
# because usage output may return non-zero; only module loading matters.
if command -v node >/dev/null 2>&1; then
  for prog in checkdtn dtn2ion ionconfig ionsurvey; do
    out="$(cd "$root/cli" && node "$prog.js" --help 2>&1 </dev/null || true)"
    if printf '%s' "$out" | grep -q 'Cannot find module\|MODULE_NOT_FOUND'; then
      fail "cli/$prog.js failed to load modules:"$'\n'"$out"
    fi
  done
else
  fail "node is required for the CLI smoke test"
fi

echo "ci-verify-release: OK ($top_name)"
