#!/bin/bash
#
#  pull json files from master (../json) to local (json_latest)

master=../json
local=json_latest

echo 'Pull json files from master (../json) to local (json_latest)'
echo ''

echo "pulling configTypes.json from $master to $local"
cp -p $master/configTypes.json $local

echo "pulling cmdTypes.json    from $master to $local"
cp -p $master/cmdTypes.json    $local

echo "pulling paramTypes.json  from $master to $local"
cp -p $master/paramTypes.json  $local

echo "pulling patterns.json    from $master to $local"
cp -p $master/patterns.json    $local

echo "pulling ionVersions.json from $master to $local"
cp -p $master/ionVersions.json $local
