#!/bin/bash
#
#   makeDelta.sh
#
# make html dictionary report of command deltas since last version  
#
# inputs: none
#
# outputs: docs/delta.html
#
# author: Rick Borgen
#

cd work

# analyze deltas for new/dropped commands: dropCmds.json & newCmds.json
../cmdsdelta.py

# build header with version info: head-delta.html
../deltahdrs.py

# start html file for delta report
# standard css stuff
cp  ../table.css       delta.html
# version info
cat head-delta.html >> delta.html
echo '<hr>'         >> delta.html

# build new commands section
echo '<h2>New commands</h2>' >>  delta.html
cp newCmds.json cmdTypes.json
echo 'a small temporary cmdTypes.json for new commands...'
echo 'wc cmdTypes.json'
wc cmdTypes.json

# format new commands in html
../cmds2html.py
cat dict.html   >> delta.html
echo '<hr>'     >> delta.html

# build obsolete commands section
echo '<h2>Obsolete commands</h2>' >>  delta.html
cp dropCmds.json cmdTypes.json
echo 'a small temporary cmdTypes.json for obsolete commands...'
echo 'wc cmdTypes.json'
wc cmdTypes.json

# format dropped/replaced commands in html
../cmds2html.py
cat dict.html  >> delta.html

# push completed delta doc to 'docs' directory
cp delta.html ../docs
