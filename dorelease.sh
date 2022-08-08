#!/bin/bash
#
#   dorelease.sh
#
# build a release directory tree of end-user products
#
# inputs: ionconfig development tree
#
# outputs: ionconfig-x.y.z.tar
#
# author: Rick Borgen
#
 
# assume execution at ionconfig root
#
echo "Building a new ionconfig release."

# clean up prior work
rel=/tmp/release
/bin/rm -R $rel
/bin/rm -R /tmp/ionconfig-*  # prior versioned releases
mkdir $rel

echo "Adding standard release files."
cp release.json  $rel
cp release.notes $rel
cp ./script/rel.README $rel/README

echo "Adding json config files."
cp -R json $rel

echo "Adding command-line programs & docs."
mkdir $rel/cli
cd cli
cp package*        $rel/cli
cp -R node_modules $rel/cli
cp -R bin          $rel/cli
cp -R docs         $rel/cli
cd ..

echo "Adding editor program & doc."
mkdir $rel/editor
cp -R manual $rel/editor
cp -R editor/build/* $rel/editor

echo "Adding dictionary docs."
mkdir $rel/dictionary
cd dict
cp docs/* $rel/dictionary
cd ..

echo "Building tar file."
./script/tarbyver.py
sleep 3    # allow some time to complete

echo "Storing tar file."
./script/movetar.py

echo "Done."

