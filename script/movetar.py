#!/usr/bin/python3
#
#     movetar.py
#
#  stach new tar file in tars subdirectory
#
#  inputs: /tmp/ionconfig-xxx.tar
#
#  outputs: error messages, 
#           errors.log file with error details
#
#  author: Rick Borgen
#
import os
import json
from operator import itemgetter

# track counts of error messages by json file type
msgCnt  = { "confgiTypes":0, "cmdTypes":0, "patterns":0, "paramTypes":0 }
msgFile = open("errors.log","w")

def logMsg(file,type,msg):
  msgCnt[file] += 1
  msgFile.write("%11s %5s %s\n" % (file,type,msg))

def getRelease():
  relfile = open("release.json","r")
  dict = {}
  try:
    dict=json.load(relfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err
    logMsg("release","FATAL",msg)
  return dict


#-------main-------
rel = getRelease();
ionconfigver = rel["ionConfigVersion"];

#  assume all operations in the /tmp dir
#  and current dir = ionconfig (root)
workdir = '/tmp'

# Move tar file to tars dir
tarfile = '%s/ionconfig-%s.tar' % (workdir,ionconfigver)
newtar  = './tars/ionconfig-%s.tar' % ionconfigver
os.rename(tarfile,newtar)

print("Tar file stored as %s." % newtar);
