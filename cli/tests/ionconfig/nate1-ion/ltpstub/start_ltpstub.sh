#!/bin/bash
#  FILE:  start_ltpstub.sh
#  NODE:  ltpstub [ipn:1001]
#  DESC:  ltp terminal
#  DATE:  2022-07-25T13:50
host=`uname -n`
wdir=`pwd`
echo "Clearing old ion.log"
echo > ion.log
echo "Starting ION node ipn:1001 on $host from $wdir"
ionadmin  ltpstub.ionrc
sleep  1
ionsecadmin  ltpstub.ionsecrc
sleep  1
ltpadmin  ltpstub.ltprc
sleep  1
bpadmin  ltpstub.bpv6rc
sleep  1
ipnadmin  ltpstub.ipnrc
sleep  1
# global contact graph
ionadmin  nate1-graph.cg
echo "Startup of ION node ipn:1001 on $host complete!"
echo "Starting bpecho on ipn:1001.3."
bpecho   ipn:1001.3 &
