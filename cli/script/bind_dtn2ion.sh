#!/bin/bash
#
#   bind_dtn2ion.sh
#
# bind sub modules together for complete dtn2ion.js
#
# inputs:  ../src
#
# outputs: ../bin/dtn2ion.js
#
# author: Rick Borgen
#
echo "Binding together dtn2ion.js"

src=../src
bin=../bin

echo "#!/usr/bin/env node" > $bin/dtn2ion.js
echo "// THIS FILE IS AUTOMATICALLY GENERATED DURING THE BUILD PROCESS"   >> $bin/dtn2ion.js
echo "// SEE THE MAKE SCRIPT FOR WHICH SOURCE FILES ARE USED TO BUILD IT" >> $bin/dtn2ion.js

cat $src/dtn2ion_main.js >> $bin/dtn2ion.js
cat $src/netloader.js    >> $bin/dtn2ion.js
cat $src/checknet.js     >> $bin/dtn2ion.js
cat $src/buildion.js     >> $bin/dtn2ion.js
cat $src/appfunc.js      >> $bin/dtn2ion.js
cat $src/clone.js        >> $bin/dtn2ion.js
cat $src/getfunc.js      >> $bin/dtn2ion.js
cat $src/makeobj.js      >> $bin/dtn2ion.js
cat $src/savemodel.js    >> $bin/dtn2ion.js

chmod +x $bin/dtn2ion.js
