#!/bin/bash
#  FILE:  start_stubtwo.sh
#  NODE:  stubtwo [ipn:1002]
#  DESC:  another ltp termianal
#  DATE:  2022-07-25T13:50
host=`uname -n`
wdir=`pwd`
echo "Clearing old ion.log"
echo > ion.log
echo "Starting ION node ipn:1002 on $host from $wdir"
ionadmin  stubtwo.ionrc
sleep  1
ionsecadmin  stubtwo.ionsecrc
sleep  1
ltpadmin  stubtwo.ltprc
sleep  1
bpadmin  stubtwo.bpv6rc
sleep  1
ipnadmin  stubtwo.ipnrc
sleep  1
# global contact graph
ionadmin  nate1-graph.cg
echo "Startup of ION node ipn:1002 on $host complete!"
echo "Starting bpecho on ipn:1002.3."
bpecho   ipn:1002.3 &
