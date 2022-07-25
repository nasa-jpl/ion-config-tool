#!/bin/bash
#  FILE:  start_n2.sh
#  NODE:  n2 [ipn:2]
#  DESC:  n2 description
#  DATE:  2022-07-20T10:58
host=`uname -n`
wdir=`pwd`
echo "Clearing old ion.log"
echo > ion.log
echo "Starting ION node ipn:2 on $host from $wdir"
ionadmin  n2.ionrc
sleep  1
ionsecadmin  n2.ionsecrc
sleep  1
bpadmin  n2.bpv6rc
sleep  1
ipnadmin  n2.ipnrc
sleep  1
# global contact graph
ionadmin  with_udp_fail-graph.cg
echo "Startup of ION node ipn:2 on $host complete!"
echo "Starting bpecho on ipn:2.3."
bpecho   ipn:2.3 &
