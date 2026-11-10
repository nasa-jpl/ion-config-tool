#!/usr/bin/env bash
#
#   test-ci-verify.sh
#
# Negative self-test for ci-verify-release.sh. Builds a fixture release
# tree, asserts the verifier passes on it, then asserts it fails when each
# manifest entry is removed, when index.html has an absolute /static
# reference, and when the title is wrong.
#
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
verify="$here/ci-verify-release.sh"
manifest="$here/ci-release-manifest.txt"
ver="9.9.9b1"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# make_fixture <dir>: create a complete, valid fixture tree under <dir>/ionconfig-<ver>
make_fixture() {
  local root="$1/ionconfig-$ver" entry prog
  mkdir -p "$root"
  while IFS= read -r entry; do
    case "$entry" in
      ''|\#*) continue ;;
      */) mkdir -p "$root/${entry%/}" && touch "$root/${entry%/}/.keep" ;;
      *) mkdir -p "$(dirname "$root/$entry")" && echo "fixture" > "$root/$entry" ;;
    esac
  done < "$manifest"
  printf '{"ionConfigVersion": "%s"}\n' "$ver" > "$root/release.json"
  cat > "$root/editor/index.html" <<EOF
<!doctype html><html><head><title>IonConfig $ver</title>
<script src="./static/js/main.js"></script></head><body></body></html>
EOF
  for prog in checkdtn dtn2ion ionconfig ionsurvey; do
    echo "process.exit(0);" > "$root/cli/$prog.js"
  done
}

# pack <dir> <tarball>: tar the fixture's top-level ionconfig-<ver> dir
pack() {
  tar -czf "$2" -C "$1" "ionconfig-$ver"
}

expect_pass() {
  local name="$1" tarball="$2"
  if "$verify" "$tarball" "$ver" >/dev/null 2>&1; then
    echo "ok   pass: $name"
  else
    echo "FAIL expected pass: $name" >&2
    exit 1
  fi
}

expect_fail() {
  local name="$1" tarball="$2"
  if "$verify" "$tarball" "$ver" >/dev/null 2>&1; then
    echo "FAIL expected failure: $name" >&2
    exit 1
  else
    echo "ok   fail: $name"
  fi
}

# 1. valid fixture passes
good="$work/good"; make_fixture "$good"; pack "$good" "$work/good.tar.gz"
expect_pass "valid fixture" "$work/good.tar.gz"

# 2. removing each manifest entry fails
n=0
while IFS= read -r entry; do
  case "$entry" in ''|\#*) continue ;; esac
  n=$((n + 1))
  d="$work/rm$n"; make_fixture "$d"
  rm -rf "$d/ionconfig-$ver/${entry%/}"
  pack "$d" "$work/rm$n.tar.gz"
  expect_fail "removed $entry" "$work/rm$n.tar.gz"
done < "$manifest"

# 3. absolute /static reference fails
d="$work/abs"; make_fixture "$d"
sed -i.bak 's#\./static#/static#' "$d/ionconfig-$ver/editor/index.html" && rm -f "$d/ionconfig-$ver/editor/index.html.bak"
pack "$d" "$work/abs.tar.gz"
expect_fail "absolute /static reference" "$work/abs.tar.gz"

# 4. wrong title fails
d="$work/title"; make_fixture "$d"
sed -i.bak 's#IonConfig 9.9.9b1#React App#' "$d/ionconfig-$ver/editor/index.html" && rm -f "$d/ionconfig-$ver/editor/index.html.bak"
pack "$d" "$work/title.tar.gz"
expect_fail "wrong title" "$work/title.tar.gz"

echo "test-ci-verify: all checks passed"
