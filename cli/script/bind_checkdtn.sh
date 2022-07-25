#!/bin/bash
#
#   bind_checkdtn.sh
#
# bind sub modules together for complete checkdtn.js
#
# inputs:  ../src
#
# outputs: ../bin/checkdtn.js
#
# author: Rick Borgen
#
echo "Binding together checkdtn.js"

src=../src
bin=../bin

cat $src/checkdtn_main.js  > $bin/checkdtn.js

chmod +x  $bin/checkdtn.js
