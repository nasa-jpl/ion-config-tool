#!/usr/bin/python3
#
#     cmdsdelta.py
#
#  filter cmdTypes.json by version number delta
#  (which cmds are dropped and which added)
#  
#  inputs: ../release.json,
#          json_latest/ionVersion.json,
#          json_latest/cmdTypes.json
#       
#  outputs: dropCmds.json,
#           newCmds.json,
#           error messages, 
#           errors.log file with error details
#
#  author: Rick Borgen
#   

import os
import json
import sys
from operator import itemgetter

# track counts of error messages by json file type
msgCnt  = { "cmdTypes":0, "patterns":0, "paramTypes":0 }
msgFile = open("errors.log","w")

# assume execution in the "work" subdirectory, so
# adjust relative directories accordingly
jsondir = '../json_latest/'  # latest config json files

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
  cmdTypes = jsondir + 'cmdTypes.json'
  jfile = open(cmdTypes,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err 
    logMsg("cmdTypes","FATAL",msg)
  return dict

def getIonVersions():
  ionVersions = jsondir + 'ionVersions.json'
  jfile = open(ionVersions,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err 
    logMsg("ionVersions","FATAL",msg)
  return dict

#-------main-------

rel = getRelease();
ionver = rel["ionVersion"];
version = rel["seqNum"];
priorver = version - 1

print ("scanning cmdTypes for changes from version seq num: %d to %d" % (priorver,version))
# formatting templates
cmdDict = getCmdObjs()
skeys = sorted(cmdDict.keys())

print ('----dropped commands in version: %d ---' % version)
hits = 0
dropCmds = {}
for key in skeys:
  cmdObj = cmdDict[key]
  vthru = cmdObj['verThru']
  if (priorver == vthru):
    dropCmds[key] = cmdObj
    print (key)
    hits += 1

with open('dropCmds.json',"w") as outJson1:
  json.dump( dropCmds, outJson1, ensure_ascii=False, sort_keys=True, indent=2 )
if (hits == 0):
  print('[none]')

print ('----added commands in version: %d ---' % version)
hits = 0
newCmds = {}
for key in skeys:
  cmdObj = cmdDict[key]
  vfrom = cmdObj['verFrom']
  if (version == vfrom):
    newCmds[key] = cmdObj
    print (key)
    hits += 1

with open('newCmds.json',"w") as outJson2:
  json.dump( newCmds, outJson2, ensure_ascii=False, sort_keys=True, indent=2 )
if (hits == 0):
  print('[none]')
