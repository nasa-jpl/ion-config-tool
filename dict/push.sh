#!/bin/bash
#
#  push local json files (json_latest) to  master (../json)

local=json_latest
master=../json  

echo 'creating ../json directory'
mkdir -p ../json

echo 'push local json files (json_latest) to  master (../json)'
echo ''

echo "pushing configTypes.json to $master"
cp -p $local/configTypes.json $master

echo "pushing cmdTypes.json to $master"
cp -p $local/cmdTypes.json    $master

echo "pushing cmdMsgs.json to $master"
cp -p $local/cmdMsgs.json    $master

echo "pushing paramTypes.json to $master"
cp -p $local/paramTypes.json  $master

echo "pushing patterns.json to $master"
cp -p $local/patterns.json    $master

echo "pushing ionVersions.json to $master"
cp -p $local/ionVersions.json $master

echo "pushing selections.json to $master"
cp -p $local/selections.json  $master
