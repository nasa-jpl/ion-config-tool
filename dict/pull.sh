#!/bin/bash
#
#  pull json files from master (../editor/src/json) to local (json_latest)

master=../editor/src/json
local=json_latest

echo 'Pull json files from master (../editor/src/json) to local (json_latest)'
echo ''

echo "pulling configTypes.json from $master to $local"
cp -p $master/configTypes.json $local

echo "pulling cmdTypes.json    from $master to $local"
cp -p $master/cmdTypes.json    $local

echo "pulling cmdMsgs.json    from $master to $local"
cp -p $master/cmdMsgs.json    $local

echo "pulling paramTypes.json  from $master to $local"
cp -p $master/paramTypes.json  $local

echo "pulling patterns.json    from $master to $local"
cp -p $master/patterns.json    $local

echo "pulling ionVersions.json from $master to $local"
cp -p $master/ionVersions.json $local

echo "pulling selections.json  from $master to $local"
cp -p $master/selections.json  $local
