# assign ion version numbers (arg1 arg2)
v1=$1
v2=$2
# assign root dir of ion distros
# TBD: make the root directory refer to an environment variable.
root=/Users/dhanks/Desktop
# create report name
rpt=$v1-vs-$v2.diffs

# build report
echo "$v1 vs. $v2" > $rpt
echo '----amsrc diffs----' >> $rpt
diff $root/ion-$v1/ams/doc/pod5/amsrc.pod     $root/ion-$v2/ams/doc/pod5/amsrc.pod >> $rpt
echo '----amsxml diffs----' >> $rpt
diff $root/ion-$v1/ams/doc/pod5/amsxml.pod    $root/ion-$v2/ams/doc/pod5/amsxml.pod >> $rpt
echo '----bpv6 ascrc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/acsrc.pod    $root/ion-$v2/bpv6/doc/pod5/acsrc.pod >> $rpt
echo '----bpv6 bprc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/bprc.pod     $root/ion-$v2/bpv6/doc/pod5/bprc.pod >> $rpt
echo '----bpv6 bpsecrc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/bpsecrc.pod  $root/ion-$v2/bpv6/doc/pod5/bpsecrc.pod >> $rpt
echo '----bpv6 dtn2rc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/dtn2rc.pod   $root/ion-$v2/bpv6/doc/pod5/dtn2rc.pod >> $rpt
echo '----bpv6 imcrc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/imcrc.pod    $root/ion-$v2/bpv6/doc/pod5/imcrc.pod >> $rpt
echo '----bpv6 ipnrc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/ipnrc.pod    $root/ion-$v2/bpv6/doc/pod5/ipnrc.pod >> $rpt
echo '----bpv6 lgfile diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/lgfile.pod   $root/ion-$v2/bpv6/doc/pod5/lgfile.pod >> $rpt
echo '----bpv6 biberc diffs----' >> $rpt
diff $root/ion-$v1/bpv7/doc/pod5/biberc.pod   $root/ion-$v2/bpv7/doc/pod5/biberc.pod >> $rpt
echo '----bpv7 bprc diffs----' >> $rpt
diff $root/ion-$v1/bpv7/doc/pod5/bprc.pod     $root/ion-$v2/bpv7/doc/pod5/bprc.pod >> $rpt
echo '----bpv7 bpsecrc diffs----' >> $rpt
diff $root/ion-$v1/bpv7/doc/pod5/bpsecrc.pod  $root/ion-$v2/bpv7/doc/pod5/bpsecrc.pod >> $rpt
echo '----bpv7 dtn2rc diffs----' >> $rpt
diff $root/ion-$v1/bpv7/doc/pod5/dtn2rc.pod   $root/ion-$v2/bpv7/doc/pod5/dtn2rc.pod >> $rpt
echo '----bpv7 ipnrc diffs----' >> $rpt
diff $root/ion-$v1/bpv7/doc/pod5/ipnrc.pod    $root/ion-$v2/bpv7/doc/pod5/ipnrc.pod >> $rpt
echo '----bpv7 lgfile diffs----' >> $rpt
diff $root/ion-$v1/bpv7/doc/pod5/lgfile.pod   $root/ion-$v2/bpv7/doc/pod5/lgfile.pod >> $rpt
echo '----bssprc diffs----' >> $rpt
diff $root/ion-$v1/bssp/doc/pod5/bssprc.pod   $root/ion-$v2/bssp/doc/pod5/bssprc.pod >> $rpt
echo '----cfdprc diffs----' >> $rpt
diff $root/ion-$v1/cfdp/doc/pod5/cfdprc.pod   $root/ion-$v2/cfdp/doc/pod5/cfdprc.pod >> $rpt
echo '----dtpcrc diffs----' >> $rpt
diff $root/ion-$v1/dtpc/doc/pod5/dtpcrc.pod   $root/ion-$v2/dtpc/doc/pod5/dtpcrc.pod >> $rpt
echo '----ionconfig diffs----' >> $rpt
diff $root/ion-$v1/ici/doc/pod5/ionconfig.pod $root/ion-$v2/ici/doc/pod5/ionconfig.pod >> $rpt
echo '----ionrc diffs----' >> $rpt
diff $root/ion-$v1/ici/doc/pod5/ionrc.pod     $root/ion-$v2/ici/doc/pod5/ionrc.pod >> $rpt
echo '----ionsecrc diffs----' >> $rpt
diff $root/ion-$v1/ici/doc/pod5/ionsecrc.pod  $root/ion-$v2/ici/doc/pod5/ionsecrc.pod >> $rpt
echo '----ltprc diffs----' >> $rpt
diff $root/ion-$v1/ltp/doc/pod5/ltprc.pod     $root/ion-$v2/ltp/doc/pod5/ltprc.pod >> $rpt
echo '----ltpsecrc diffs----' >> $rpt
diff $root/ion-$v1/ltp/doc/pod5/ltpsecrc.pod  $root/ion-$v2/ltp/doc/pod5/ltpsecrc.pod >> $rpt
