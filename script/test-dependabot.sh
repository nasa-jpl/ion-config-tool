#!/usr/bin/env bash
#
#   test-dependabot.sh
#
# Checks that .github/dependabot.yml parses and lists the required
# ecosystem/directory pairs: npm /editor, npm /cli, github-actions /.
# actionlint does not validate this file, so this script covers it.
# Requires PyYAML (pip install pyyaml).
#
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
python3 - "$here/.github/dependabot.yml" <<'EOF'
import sys
import yaml

with open(sys.argv[1]) as f:
    cfg = yaml.safe_load(f)

updates = cfg.get("updates", [])
pairs = {(u["package-ecosystem"], u["directory"]) for u in updates}
required = {("npm", "/editor"), ("npm", "/cli"), ("github-actions", "/")}
missing = required - pairs
if missing:
    sys.exit(f"test-dependabot: FAIL missing entries: {sorted(missing)}")
for u in updates:
    if "schedule" not in u or "cooldown" not in u:
        sys.exit(f"test-dependabot: FAIL {u['package-ecosystem']} {u['directory']} lacks schedule/cooldown")
print("test-dependabot: OK")
EOF
