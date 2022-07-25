#!/usr/bin/python3
#
#     cmdsbyver.py
#
#  extract cmdTypes.json subset by version number
#  
#  inputs: ../release.json,
#          json_latest/cmdTypes.json
#
#  outputs: allCmds.json,
#           error messages,
#           errors.log file with error details
#
#  author: Rick Borgen
#

import os
import json
import sys
from operator import itemgetter

# assume execution in the "work" subdirectory, so
# adjust relative directories accordingly
jsondir = '../json_latest/'  # latest config json files

# track counts of error messages by json file type
msgCnt  = { "cmdTypes":0, "patterns":0, "paramTypes":0 }
msgFile = open("errors.log","w")

def getRelease():
  relfile = open("../../release.json","r")
  dict = {}
  try:
    dict=json.load(relfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err
    logMsg("release","FATAL",msg)
  return dict

def logMsg(file,type,msg):
  msgCnt[file] += 1
  msgFile.write("%11s %5s %s\n" % (file,type,msg))

def getCmdObjs():
  jname = jsondir + 'cmdTypes.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: "
    logMsg("cmdTypes","FATAL",msg)
  return dict

#-------main-------

rel = getRelease();
version = rel["seqNum"];

print ("Scanning cmdTypes for version:  %d" % version)
# formatting templates
cmdDict = getCmdObjs()
skeys = sorted(cmdDict.keys())

allCmds = {}
cmdCnt = 0
for key in skeys:
  cmdObj = cmdDict[key]
  vfrom = cmdObj['verFrom']
  vthru = cmdObj['verThru']
  if (version >= vfrom and version <= vthru):
    allCmds[key] = cmdObj
    cmdCnt += 1
print("Version command types:         %d" % cmdCnt )

with open("allCmds.json","w") as outJson:
  json.dump( allCmds, outJson, ensure_ascii=False, sort_keys=True, indent=2 )
