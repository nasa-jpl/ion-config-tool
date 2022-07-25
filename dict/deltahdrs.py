#!/usr/bin/python3
#
#     deltahdrs.py
#
#  build delta header with release info
#  
#  inputs: ../release.json,
#          json_latest/ionVersion.json
#       
#  outputs: head-delta.html
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

# build header html
headName = 'head-delta.html'
headFile = open(headName,"w")
eol = '\n'
verDict = getIonVersions()
newVer = verDict[str(version)]["ionVersion"]
newRel = verDict[str(version)]["released"]
headFile.write("<h1>ION Config Version Delta Report</h1>" + eol)
headFile.write("<table><tr>" + eol)
headFile.write("<tr><td><b>Later ION Version:</b> %s </td>\
   <td><b>Released:</b> %s </td><td><b>Seqno:</b> %d </td></tr>"
   % (newVer,newRel,version) + eol )
oldVer = verDict[str(priorver)]["ionVersion"]
oldRel = verDict[str(priorver)]["released"]
headFile.write("<tr><td><b>Prior ION Version:</b> %s </td>\
    <td><b>Released:</b> %s </td><td><b>Seqno:</b> %d </td></tr>"
    % (oldVer,oldRel,priorver) + eol )
headFile.write("</table>" + eol)

print("Delta header complete for version %d vs. version %d." % (version,priorver))
