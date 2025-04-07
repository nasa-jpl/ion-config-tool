#!/bin/bash
#
#   make.sh
#
# simple script to make ionconfig cli programs
#
# inputs:  /script/*
#
# outputs: /bin/checkdtn.js
#          /bin/dtn2ion.js
#          /bin/ionconfig.js
#
# author: Rick Borgen
#
echo "Making all ionconfig cli programs"
cd script

./bind_checkdtn.sh
./bind_dtn2ion.sh
./bind_ionconfig.sh
./bind_ionsurvey.sh
