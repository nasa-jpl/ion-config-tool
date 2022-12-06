#!/bin/bash
#
#   make.sh
#
# script to make browser-based ionconfig editor
#
# inputs:  ../json/*json   (config files)
#          ../release.json (release info)
#          src/*           (jsx files)
#
# outputs: /build/*
#
# author: Rick Borgen
#

# stage the current json config files
echo 'Staging current json config files.'
cp -p ../json/*json src

# get the current release version
toolver=$(./toolver.py)

echo 'Fixing the version in App.jsx'
echo 'WAS:'
grep "Configuration Editor" src/App.jsx
sed -i ""  "s/Editor.*<\/h3>/Editor  $toolver<\/h3>/" src/App.jsx
echo 'IS:'
grep "Configuration Editor" src/App.jsx

# use node package builder (npm) to build editor
echo 'Running npm build.'
npm run build

echo 'Editing the index.html'
#  Fix the subdirectory references to be relative
sed -i "" 's/\/static/.\/static/g' build/index.html
#
#  Change the browser tab title to the tool name & version
sed -i ""  "s/React App/IonConfig $toolver/" build/index.html

echo 'Done.'
