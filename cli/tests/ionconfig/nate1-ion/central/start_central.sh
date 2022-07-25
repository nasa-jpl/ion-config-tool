#!/bin/bash
#  FILE:  start_central.sh
#  NODE:  central [ipn:1000]
#  DESC:  central control
#  DATE:  2022-07-25T13:50
host=`uname -n`
wdir=`pwd`
echo "Clearing old ion.log"
echo > ion.log
echo "Starting ION node ipn:1000 on $host from $wdir"
ionadmin  central.ionrc
sleep  1
ionsecadmin  central.ionsecrc
sleep  1
ltpadmin  central.ltprc
sleep  1
bpadmin  central.bpv6rc
sleep  1
ipnadmin  central.ipnrc
sleep  1
# global contact graph
ionadmin  nate1-graph.cg
echo "Startup of ION node ipn:1000 on $host complete!"
echo "Starting bpecho on ipn:1000.3."
bpecho   ipn:1000.3 &
