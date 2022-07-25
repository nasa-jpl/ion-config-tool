#!/bin/bash
#  FILE:  start_n1.sh
#  NODE:  n1 [ipn:1]
#  DESC:  n1 description
#  DATE:  2022-07-20T10:58
host=`uname -n`
wdir=`pwd`
echo "Clearing old ion.log"
echo > ion.log
echo "Starting ION node ipn:1 on $host from $wdir"
ionadmin  n1.ionrc
sleep  1
ionsecadmin  n1.ionsecrc
sleep  1
bpadmin  n1.bpv6rc
sleep  1
ipnadmin  n1.ipnrc
sleep  1
# global contact graph
ionadmin  with_udp_fail-graph.cg
echo "Startup of ION node ipn:1 on $host complete!"
echo "Starting bpecho on ipn:1.3."
bpecho   ipn:1.3 &
