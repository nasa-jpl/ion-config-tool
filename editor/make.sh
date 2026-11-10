#!/bin/bash
#
#   make.sh
#
# script to make browser-based ionconfig editor
#
# inputs:  src/json/*json  (config files)
#          ../release.json (release info)
#          src/*           (jsx files)
#
# outputs: /build/*
#
# Note: this rewrites src/App.jsx in place. Callers that need a clean
# tree afterwards (ci-build.sh) must save and restore that file.
#
# The in-place edits use "sed -i.bak ... && rm" instead of the BSD-only
# "sed -i ''" form so the same script runs on macOS and Linux.
#
# authors: Rick Borgen, Dave Hanks
#

# get the current release version
toolver=$(python3 ./toolver.py)

echo 'Fixing the version in App.jsx'
echo 'WAS:'
grep "Configuration Editor" src/App.jsx
sed -i.bak "s/Editor.*<\/h3>/Editor  $toolver<\/h3>/" src/App.jsx && rm -f src/App.jsx.bak
echo 'IS:'
grep "Configuration Editor" src/App.jsx

# use node package builder (npm) to build editor
echo 'Running npm build.'
npm run build

echo 'Editing the index.html'
#  Fix the subdirectory references to be relative
sed -i.bak 's/\/static/.\/static/g' build/index.html && rm -f build/index.html.bak
#
#  Change the browser tab title to the tool name & version
sed -i.bak "s/React App/IonConfig $toolver/" build/index.html && rm -f build/index.html.bak

echo 'Done.'
