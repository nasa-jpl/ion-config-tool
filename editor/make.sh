#!/bin/bash
#
#   make.sh
#
# script to make browser-based ionconfig editor
#
# inputs:  ../json/*json   (config files)
#          ../release.josn (release info)
#          src/*           (jsx files)
#
# outputs: /build/*
#
# author: Rick Borgen
#

# stage the current json config files
echo 'Staging current json config files.'
cp -p ../json/*json src

# use node package builder (npm) to build editor
echo 'Running npm build.'
npm run build

#  changed to a local reference within the build directory
echo 'Editing the index.html'
cat build/index.html | sed -e 's/\/static/.\/static/g' > yyy
#
#  Change the browser tab title to the tool name & version
toolver=$(./toolver.py)
cat yyy | sed -e "s/React App/IonConfig $toolver/" > zzz

mv zzz build/index.html
/bin/rm yyy

echo 'Done.'
