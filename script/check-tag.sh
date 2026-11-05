#!/usr/bin/env bash
#
#   check-tag.sh
#
# Decide whether a release may be published, from release.json.
#
# usage: check-tag.sh [--dry-run] [<tag>]
#
#   <tag>        Git tag being released, e.g. v4.10.0b1. Must equal
#                "v" + release.json ionConfigVersion.
#   --dry-run    Skip the tag comparison (a manual run has no tag). The
#                version format is still validated.
#
# Output (stdout, key=value, suitable for $GITHUB_OUTPUT):
#   version=<ionConfigVersion>
#   prerelease=true|false    true when the version has a letter suffix
#                            (e.g. 4.10.0b1, 4.10.0rc1)
#
# Environment:
#   RELEASE_JSON   path to release.json (default: release.json in cwd)
#
set -euo pipefail

dry_run=0
tag=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    -*) echo "check-tag: unknown option $arg" >&2; exit 2 ;;
    *) tag="$arg" ;;
  esac
done

release_json="${RELEASE_JSON:-release.json}"
version="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ionConfigVersion"])' "$release_json")"

# Numeric X.Y.Z with an optional letter-based suffix such as b1 or rc2.
if ! printf '%s' "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+([a-zA-Z]+[0-9]*)?$'; then
  echo "check-tag: malformed ionConfigVersion '$version' in $release_json" >&2
  exit 1
fi

if [ "$dry_run" -eq 0 ]; then
  if [ "$tag" != "v$version" ]; then
    echo "check-tag: tag '$tag' does not match release.json version 'v$version'" >&2
    exit 1
  fi
fi

prerelease=false
if printf '%s' "$version" | grep -Eq '[a-zA-Z]'; then
  prerelease=true
fi

echo "version=$version"
echo "prerelease=$prerelease"
