#!/bin/bash
#
#   makeDict.sh
#
# make html dictionary report for version nn
#
# inputs: none
#
# outputs: docs/dict.html
#
# author: Rick Borgen
#
echo "Assembling html dictionary for new ion version"

# switch to work area for misc files
cd work

# extract commands for specific version to allCmds.json
../cmdsbyver.py

# build front matter for html: head-dict.html &
# build condig file summary table: conf-dict.html
../dicthdrs.py

# start html file for dict report
cp ../table.css             front.html
cat head-dict.html       >> front.html
cat ../dict_notes.html   >> front.html
cat conf-dict.html       >> front.html
cat ../param_notes.html  >> front.html

# build commands section
cp allCmds.json cmdTypes.json
echo 'a small cmdTypes.json file for this version only...'
echo 'wc cmdTypes.json'
wc cmdTypes.json

# build version-specific dictionary of cmds: dict.html
../cmds2html.py

# combine front & command body
cat front.html dict.html > combo.html
mv  combo.html dict.html

# save as final doc
cp dict.html  ../docs
