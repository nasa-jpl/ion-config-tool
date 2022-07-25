#!/bin/bash
#
#  compare local json files to master at ../json

master=../json
local=json_latest

echo 'Compare local json (json_latest) to master (../json)'
echo ''

echo "diffing configTypes.json to $master"
diff -n $local/configTypes.json    $master 

echo "diffing cmdTypes.json to $master"
diff -n $local/cmdTypes.json    $master 

echo "diffing paramTypes.json to $master"
diff -n $local/paramTypes.json  $master

echo "diffing patterns.json to $master"
diff -n $local/patterns.json    $master

echo "diffing ionVersions.json to $master"
diff -n $local/ionVersions.json $master
