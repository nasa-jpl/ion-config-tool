#!/bin/bash
#  FILE:  start_n3.sh
#  NODE:  n3 [ipn:3]
#  DESC:  n3 description
#  DATE:  2022-07-20T10:58
host=`uname -n`
wdir=`pwd`
echo "Clearing old ion.log"
echo > ion.log
echo "Starting ION node ipn:3 on $host from $wdir"
ionadmin  n3.ionrc
sleep  1
ionsecadmin  n3.ionsecrc
sleep  1
bpadmin  n3.bpv6rc
sleep  1
ipnadmin  n3.ipnrc
sleep  1
# global contact graph
ionadmin  with_udp_fail-graph.cg
echo "Startup of ION node ipn:3 on $host complete!"
echo "Starting bpecho on ipn:3.3."
bpecho   ipn:3.3 &
