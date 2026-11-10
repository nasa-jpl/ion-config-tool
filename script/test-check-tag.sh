#!/usr/bin/env bash
#
#   test-check-tag.sh
#
# Tests for check-tag.sh: tag match, tag mismatch, prerelease detection,
# stable detection, and --dry-run behaviour.
#
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
check="$here/check-tag.sh"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

write_rel() {  # write_rel <file> <version>
  printf '{"ionConfigVersion": "%s"}\n' "$2" > "$1"
}

write_rel "$work/beta.json" "4.10.0b1"
write_rel "$work/stable.json" "4.10.0"
write_rel "$work/bad.json" "4.10"

# expect_ok <name> <expected-stdout-fragment> <args...> (uses RELEASE_JSON from env)
expect_ok() {
  local name="$1" want="$2"; shift 2
  local out
  if ! out="$("$check" "$@" 2>&1)"; then
    echo "FAIL expected success: $name: $out" >&2; exit 1
  fi
  if ! printf '%s\n' "$out" | grep -qx -- "$want"; then
    echo "FAIL $name: wanted line '$want', got: $out" >&2; exit 1
  fi
  echo "ok   $name"
}

expect_fail() {
  local name="$1"; shift
  if "$check" "$@" >/dev/null 2>&1; then
    echo "FAIL expected failure: $name" >&2; exit 1
  fi
  echo "ok   $name"
}

export RELEASE_JSON="$work/beta.json"
expect_ok "tag matches beta version, prerelease" "prerelease=true" v4.10.0b1
expect_ok "tag matches beta version, version output" "version=4.10.0b1" v4.10.0b1
expect_fail "tag mismatch rejected" v4.10.0
expect_fail "missing tag rejected"
expect_fail "tag without v prefix rejected" 4.10.0b1

export RELEASE_JSON="$work/stable.json"
expect_ok "stable version is not prerelease" "prerelease=false" v4.10.0
expect_fail "stable tag mismatch rejected" v4.10.0b1

export RELEASE_JSON="$work/beta.json"
expect_ok "dry-run skips tag comparison" "version=4.10.0b1" --dry-run
expect_ok "dry-run still reports prerelease" "prerelease=true" --dry-run
export RELEASE_JSON="$work/bad.json"
expect_fail "malformed version rejected without dry-run" v4.10
expect_fail "dry-run rejects malformed version" --dry-run

echo "test-check-tag: all checks passed"
