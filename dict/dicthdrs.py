#!/usr/bin/python3
#
#     dicthdrs.py
#
#  build dict headers for release and config file info
#  
#  inputs: ../release.json,
#          json_latest/ionVersion.json,
#          json_latest/configTypes.json,
#          json_latest/cmdTypes.json,
#
#  outputs: head-dict.html,
#           conf-dict.html,
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

def getConfigObjs():
  jname = jsondir + 'configTypes.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: ??"
    logMsg("cmdTypes","FATAL",msg)
  return dict

def getIonVersions():
  jname = jsondir + 'ionVersions.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err
    logMsg("ionVersions","FATAL",msg)
  return dict

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

def getConfigTups(dict):
  tups = []
  ckeys = sorted(dict.keys())

  for key in ckeys:
    strKey = str(key)
    entry = dict[key]

    if "program" in entry:
      program = str(entry["program"])
    else:
      program = "unk"

    if "content" in entry:
      content = str(entry["content"])
    else:
      content = "unk"
    tup = (strKey,program,content)
    tups.append(tup)
    # end for loop
  return tups
# end getConfigTups

#-------main-------

rel = getRelease();
version = rel["seqNum"];

configDict = getConfigObjs()
configTups = getConfigTups(configDict)
configCnt = len(configDict)

kws = configDict.keys()

# compute version-specific command count
cmdCnt = 0
cmdDict = getCmdObjs()
skeys = sorted(cmdDict.keys())
for key in skeys:
  cmdObj = cmdDict[key]
  vfrom = cmdObj['verFrom']
  vthru = cmdObj['verThru']
  if (version >= vfrom and version <= vthru):
    cmdCnt += 1

print("Config file types:         %d" % len(kws) )
print("Version %2d command types:  %d" % (version,cmdCnt) )

# build header html
headName = "head-dict.html"
headFile = open(headName,"w")
confName = "conf-dict.html"
confFile = open(confName,"w")
eol = '\n'
verDict = getIonVersions()
newVer = verDict[str(version)]["ionVersion"]
newRel = verDict[str(version)]["released"]
headFile.write("<h1>ION Config Dictionary Report</h1>" + eol)
headFile.write("<h3>ION Version: %s</h3>" % newVer + eol)
headFile.write("<h3>ION Release Date: %s</h3>" % newRel + eol)
headFile.write("<h4>Dictionary Seq No: %s</h4>" % version + eol)
headFile.write("<h4>Configuration Files: %d</h4>" % configCnt + eol)
headFile.write("<h4>Commands: %d</h4>" % cmdCnt + eol)

# formatting templates
title    =  '<h3>ION Command File Types</h3>'
cellTemp = '<td>%s</td><td>%s</td><td>%s</td>'
tblOpen  =  '<table>'
tblShut  =  '</table>'
bodyOpen =  '<tbody>'
bodyShut =  '</tbody>'
rowOpen =  '<tr>'
rowShut =  '</tr>'
tblHead  =  '<thead><tr class="header">'
tblHead +=  '<th align="left">Config File</th>'
tblHead +=  '<th align="left">Program</th>'
tblHead +=  '<th align="left">Description</th>'
tblHead +=  '</tr></thead>'
eol = '\n'

# write Config File summary
confFile.write(title + eol)
confFile.write(tblOpen  + eol)
confFile.write(tblHead  + eol)
confFile.write(bodyOpen + eol)

for tup in configTups:
  confFile.write(rowOpen)
  confFile.write(cellTemp % tup)
  confFile.write(rowShut + eol)

confFile.write(bodyShut + eol)
confFile.write(tblShut  + eol)
confFile.write("<br>" + eol)
