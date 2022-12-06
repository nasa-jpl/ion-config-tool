#!/usr/bin/python3
#
#     init.py
#
#  set up release-based json directory
#
#  inputs: ../release.json,
#
#  outputs: new json-x.y.z dir
#           linked to json_latest
#           clear docs & work dirs
#           error messages,
#           errors.log file with error details
#
#  author: Rick Borgen
#

import os
import sys 
import subprocess
import json
import time
from operator import itemgetter

# track counts of error messages by json file type
msgCnt  = { "cmdTypes":0, "patterns":0, "paramTypes":0 }
msgFile = open("errors.log","w")

def logMsg(file,type,msg):
  msgCnt[file] += 1
  msgFile.write("%11s %5s %s\n" % (file,type,msg))

def getRelease():
  relfile = open("../release.json","r")
  dict = {}
  try:
    dict=json.load(relfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err 
    logMsg("release","FATAL",msg)
  return dict


#-------main-------
rel = getRelease();
ionver = rel["ionVersion"];
configver = rel["ionConfigVersion"];
seq = rel["seqNum"];
print("Initialize for ionConfig dictionary release");
print("  ionConfig release    %s" % configver);

print("------");

dictdir = os.getcwd() 
print ("dictdir: %s" % dictdir)
delcmd =  '/bin/rm json_latest'
print("Drop sym link   cmd: '%s'" % delcmd);
try:
  process=subprocess.Popen(delcmd,shell=True,stdout=subprocess.PIPE,universal_newlines=True)
  print("Link dropped.")
except FileNotFoundError:
  print("File not found.")

os.chdir(dictdir)    # ensure home dir
jsondir = "json-" + configver

delcmd =  '/bin/rm -r %s' % jsondir
print("Drop json version cmd: '%s'" % delcmd);
try:
  process=subprocess.Popen(delcmd,shell=True,stdout=subprocess.PIPE,universal_newlines=True)
  print("json dir dropped.")
except FileNotFoundError:
  print("File not found.")

print("Take a short break...")
time.sleep(1)

print("Make json subdir   cmd: os.mkdir(%s)" % jsondir);
try:
  os.mkdir(jsondir);
  print("Directory created.")
except FileExistsError:
  print("%s already exists." % jsondir)
  pass

os.chdir(dictdir)    # ensure home dir
linkcmd = 'ln -s %s/%s json_latest' % (dictdir,jsondir)
print("Make sym link   cmd: '%s'" % linkcmd);
try:
  process=subprocess.Popen(linkcmd,shell=True,stdout=subprocess.PIPE,universal_newlines=True)
  print("Link OK.")
except FileNotFoundError:
  print("File not found.")

os.chdir(dictdir)    # ensure home dir
clearcmd = '/bin/rm work/* docs/*.html' 
print("Clear work & docs dirs   cmd: '%s'" % clearcmd);
try:
  process=subprocess.Popen(clearcmd,shell=True,stdout=subprocess.PIPE,universal_newlines=True)
  print("work & docs cleared")
except FileNotFoundError:
  print("File not found.")
