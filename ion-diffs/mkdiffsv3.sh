# assign ion version numbers (arg1 arg2)
v1=$1
v2=$2
# assign root dir of ion distros
root=/Users/rlborgen/Desktop
# create report name
rpt=$v1-vs-$v2.diffs

# build report
echo "$v1 vs. $v2" > $rpt
echo '----amsrc diffs----' >> $rpt
diff $root/ion-$v1/ams/doc/pod5/amsrc.pod     $root/ion-$v2/ams/doc/pod5/amsrc.pod >> $rpt
echo '----amsxml diffs----' >> $rpt
diff $root/ion-$v1/ams/doc/pod5/amsxml.pod    $root/ion-$v2/ams/doc/pod5/amsxml.pod >> $rpt
echo '----ipnrc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/ipnrc.pod    $root/ion-$v2/bpv6/doc/pod5/ipnrc.pod >> $rpt
echo '----ascrc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/acsrc.pod    $root/ion-$v2/bpv6/doc/pod5/acsrc.pod >> $rpt
echo '----bprc diffs----' >> $rpt
#
# NOTE: bpv6 is used by versions 3.7.1 & up,  prior versions simply used bp
#
diff $root/ion-$v1/bpv6/doc/pod5/bprc.pod     $root/ion-$v2/bpv6/doc/pod5/bprc.pod >> $rpt
echo '----dtn2rc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/dtn2rc.pod   $root/ion-$v2/bpv6/doc/pod5/dtn2rc.pod >> $rpt
echo '----imcrc diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/imcrc.pod    $root/ion-$v2/bpv6/doc/pod5/imcrc.pod >> $rpt
echo '----lgfile diffs----' >> $rpt
diff $root/ion-$v1/bpv6/doc/pod5/lgfile.pod   $root/ion-$v2/bpv6/doc/pod5/lgfile.pod >> $rpt

echo '----bssprc diffs----' >> $rpt
diff $root/ion-$v1/bssp/doc/pod5/bssprc.pod   $root/ion-$v2/bssp/doc/pod5/bssprc.pod >> $rpt
echo '----cfdprc diffs----' >> $rpt
diff $root/ion-$v1/cfdp/doc/pod5/cfdprc.pod   $root/ion-$v2/cfdp/doc/pod5/cfdprc.pod >> $rpt
echo '----dtpcrc diffs----' >> $rpt
diff $root/ion-$v1/dtpc/doc/pod5/dtpcrc.pod   $root/ion-$v2/dtpc/doc/pod5/dtpcrc.pod >> $rpt
echo '----ionrc diffs----' >> $rpt
diff $root/ion-$v1/ici/doc/pod5/ionrc.pod     $root/ion-$v2/ici/doc/pod5/ionrc.pod >> $rpt
echo '----ionconfig diffs----' >> $rpt
diff $root/ion-$v1/ici/doc/pod5/ionconfig.pod $root/ion-$v2/ici/doc/pod5/ionconfig.pod >> $rpt
echo '----ionsecrc diffs----' >> $rpt
diff $root/ion-$v1/ici/doc/pod5/ionsecrc.pod  $root/ion-$v2/ici/doc/pod5/ionsecrc.pod >> $rpt
echo '----ltprc diffs----' >> $rpt
diff $root/ion-$v1/ltp/doc/pod5/ltprc.pod     $root/ion-$v2/ltp/doc/pod5/ltprc.pod >> $rpt
