#!/bin/bash
#
#   bind_ionconfig.sh
#
# bind sub modules together for complete ionconfig.js
#
# inputs:  ../src
#
# outputs: ../bin/ionconfig.js
#
# author: Rick Borgen
#
echo "Binding together ionconfig.js"

src=../src
bin=../bin

cat $src/ionconfig_main.js  > $bin/ionconfig.js
cat $src/ionloader.js      >> $bin/ionconfig.js
cat $src/checkion.js       >> $bin/ionconfig.js
cat $src/appfunc.js        >> $bin/ionconfig.js
cat $src/clone.js          >> $bin/ionconfig.js
cat $src/ionfunc.js        >> $bin/ionconfig.js
cat $src/allconfigs.js     >> $bin/ionconfig.js

chmod +x  $bin/ionconfig.js
