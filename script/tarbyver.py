#!/usr/bin/python3
#
#     tarbyver.py
#
#  tar a release with the latest version
#
#  inputs: release.json,
#          release directory tree
#
#  outputs: error messages, 
#           errors.log file with error details
#
#  author: Rick Borgen
#
import os
import subprocess
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
mydir = os.getcwd()
reldir = "%s/release" % workdir
verdir = "%s/ionconfig-%s" % (workdir,ionconfigver)
print ("Tarring the new release: %s." % ionconfigver)
print ("Stage release in %s." % verdir)
print ("Current directory: %s." % mydir)

# Move release dir to versioned dir
verdir = "%s/ionconfig-%s" % (workdir,ionconfigver)
movecmd = "mv %s %s" % (reldir,verdir)
print("Move cmd: '%s'" % movecmd);
try:
  process=subprocess.Popen(movecmd,shell=True,stdout=subprocess.PIPE,universal_newlines=True)
  print("Move OK.")
except FileNotFoundError:
  print("File not found.")

# Tar up the versioned dir
verdir = "ionconfig-%s" % ionconfigver   # use simple dir name for tar purposes
print ("Tar the directory: %s." % verdir)
tarfile = 'ionconfig-%s.tar' % ionconfigver
tarcmd = "cd %s; tar cvf %s %s" % (workdir,tarfile,verdir)
print("Tar cmd: '%s'" % tarcmd);
try:
  # hide the stdout to avoid ugly tar info
  process=subprocess.Popen(tarcmd,shell=True,stdout=subprocess.DEVNULL,
     stderr=subprocess.STDOUT,universal_newlines=True)
  print("Tar OK.")
except FileNotFoundError:
  print("File not found.")

print ("Done.")
