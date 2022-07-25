#!/usr/bin/python3
#
#     checkjson.py
#
#  checks for errors or inconsistencies in the json config files
#
#  inputs: json_latest/cmdTypes.json,
#          json_latest/patterns.json,
#          json_latest/paramTypes.json
#
#  outputs: error messages, 
#           errors.log file with error details
#
#  author: Rick Borgen
#
import os
import json
from operator import itemgetter

jsondir = 'json_latest/'  # latest config json files

# track counts of error messages by json file type
msgCnt  = { "confgiTypes":0, "cmdTypes":0, "patterns":0, "paramTypes":0 }
msgFile = open("errors.log","w")

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

def getCmdObjs():
  jname = jsondir + 'cmdTypes.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err 
    logMsg("cmdTypes","FATAL",msg)
  return dict

def getPatObjs():
  jname = jsondir + 'patterns.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + err 
    logMsg("patterns","FATAL",msg)
  return dict

def getParamObjs():
  jname = jsondir + 'paramTypes.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: " + str(err)
    logMsg("paramTypes","FATAL",msg)
  return dict

def getCmdTups(dict):
  tups = []

  for key in dict.keys():
    strKey = str(key)
    entry = dict[key]

    if "name" in entry:
      name = str(entry["name"])
    else:
      logMsg("cmdTypes","ERROR", "name of " + key + " is missing.")
      name = "unk"
 
    if "configType" in entry:
      configType = str(entry["configType"])
    else:
      logMsg("cmdTypes","ERROR", "configType of " + key + " is missing.")
      configType = "unk"
 
    if "paramCnt" in entry:
      paramCnt = entry["paramCnt"]
    else:
      logMsg("cmdTypes","ERROR", "paramCnt of " + key + " is missing.")
      paramCnt = 0 
 
    if "order" in entry:
      order = entry["order"]
    else:
      logMsg("cmdTypes","ERROR", "order of " + key + " is missing.")
      order = 0 
 
    if "multiple" in entry:
      if entry["multiple"]:
        freq = "multiple"
      else:
        logMsg("cmdTypes","ERROR", "multiple of " + key + " is " + entry["multiple"])
    else:
      freq = "singleton"
 
    if "copyClone" in entry:
      if entry["copyClone"]:
        copyClone = "true"
      else:
        logMsg("cmdTypes","WARN", "copyClone of " + key + " is " + entry["copyClone"])
    else:
      copyClone = "false"
 
    if "isCloned" in entry:
      if entry["isCloned"]:
        isCloned = "true"
      else:
        logMsg("cmdTypes","WARN", "isCloned of " + key + " is " + entry["isCloned"])
    else:
      isCloned = "false"
 
    if "pickClone" in entry:
      if entry["pickClone"]:
        pickClone = "true"
      else:
        logMsg("cmdTypes","WARN", "pickClone of " + key + " is " + entry["pickClone"])
    else:
      pickClone = "false"
    
    tup = (strKey,name,configType,paramCnt,order,freq,isCloned,copyClone,pickClone)
    tups.append(tup)
    # end for loop
  return tups
# end getCmdTups

def getParamTups(dict):
  tups = []

  for key in dict.keys():
    strKey = str(key)
    entry = dict[key]

    if "id" in entry:
      id = str(entry["id"])
    else:
      logMsg("paramTypes","ERROR", "id of " + key + " is missing.")
      name = "unk"
    if (id != key):
      logMsg("paramTypes","ERROR", "id of " + key + " does not match key.")

    if "name" in entry:
      name = str(entry["name"])
    else:
      logMsg("paramTypes","ERROR", "name of " + key + " is missing.")
      name = "unk"
 
    if "configType" in entry:
      configType = str(entry["configType"])
    else:
      logMsg("paramTypes","ERROR", "configType of " + key + " is missing.")
      configType = "unk"
 
    if "cmdType" in entry:
      cmdType = str(entry["cmdType"])
    else:
      logMsg("paramTypes","ERROR", "cmdType of " + key + " is missing.")
      cmdType = "unk"
 
    if "valType" in entry:
      valType = str(entry["valType"])
    else:
      logMsg("paramTypes","ERROR", "valType of " + key + " is missing.")
      valType = "unk"
 
    if "units" in entry:
      units = str(entry["units"])
    else:
      logMsg("paramTypes","ERROR", "units of " + key + " is missing.")
      units = "unk"
 
    if "defaultValue" in entry:
      default = str(entry["defaultValue"])
    else:
      logMsg("paramTypes","ERROR", "default of " + key + " is missing.")
      default = "unk"
 
    if "optional" in entry:
      if entry["optional"]:
        optional = "true"
      else:
        logMsg("paramTypes","WARN", "optional of " + key + " is " + entry["optional"])
    else:
      optional = "false"
 
    if "copyClone" in entry:
      if entry["copyClone"]:
        copyClone = "true"
      else:
        logMsg("paramTypes","WARN", "copyClone of " + key + " is " + entry["copyClone"])
    else:
      copyClone = "false"
 
    if "pickClone" in entry:
      if entry["pickClone"]:
        pickClone = "true"
      else:
        logMsg("paramTypes","WARN", "pickClone of " + key + " is " + entry["pickClone"])
    else:
      pickClone = "false"
    
    tup = (strKey,name,configType,cmdType,valType,units,default,optional,copyClone,pickClone)
    tups.append(tup)
    # end for loop
  return tups
# end getParamTups

def chkPatterns(cmdDict,patDict):
  for key in cmdDict:
    if key in patDict:
      pass
    else:
      logMsg("patterns","ERROR", "pattern of " + key + " cmdType is missing.")
  for key in patDict:
    if key in cmdDict:
      pass
    else:
      if (key != 'nada'):
        logMsg("patterns","ERROR", "cmdType of " + key + " pattern is missing.")
# end chkPatterns

def chkParamCnt(cmdDict,paramTups):
  lastCmdType =  "nada"
  cnt = 1
  for tup in paramTups:
    # print("tup: ",tup[1],tup[3])
    cmdType = tup[3]
    if (cmdType == lastCmdType):
      cnt += 1
    else:
      if (lastCmdType != "nada"):
        if (lastCmdType in cmdDict):
          cmd = cmdDict[lastCmdType]
          if "paramCnt" in cmd:
            pCnt = cmd["paramCnt"]
          else:
            pCnt = 0
          if (pCnt != cnt):
            logMsg("paramTypes","ERROR", "cmdType " + lastCmdType + " paramCnt differs from paramTypes...")
            logMsg("paramTypes","ERROR", "cmdType count: " + str(pCnt) + " paramType count: " + str(cnt))
        else:
          logMsg("paramTypes","WARN", "cmdType: " + lastCmdType + "  of " + lastKey + " is missing.")
      lastCmdType = cmdType
      lastKey = tup[0]
      cnt = 1
  # end for loop
  for key in cmdDict:
    cmd = cmdDict[key]
    if ("paramCnt" in cmd):
      if (cmd["paramCnt"] > 0):
        noParams = True
        for tup in paramTups:
          cmdType = tup[3]
          if (cmdType == key):
            noParams = False
        if (noParams):
          logMsg("paramTypes","ERROR", "cmdType " + key + " has no paramType defined.") 
  # end for key...
# end chkParamCnt

def chkClones(cmdDict,paramDict):
  for key in paramDict:
    if "cmdType" in paramDict[key]:
      cmdType = paramDict[key]["cmdType"]
    else:
      continue
    if "copyClone" in paramDict[key]:
      if "copyClone" in cmdDict[cmdType]:
        pass
      else:
        logMsg("paramTypes","ERROR", "cmdType " + cmdType + " missing copyClone.")
    if "pickClone" in paramDict[key]:
      if "pickClone" in cmdDict[cmdType]:
        pass
      else:
        logMsg("paramTypes","ERROR", "cmdType " + cmdType + " missing pickClone.")
# end chkClones


#-------main-------
cmdRowsFile   = open("cmdTypes.rows","w");
paramRowsFile = open("paramTypes.rows","w");
eol = '\n'

confDict = getConfigObjs()

cmdDict = getCmdObjs()
cmdTups = getCmdTups(cmdDict) 
cmdTups = sorted(cmdTups,key=itemgetter(0))
for tup in cmdTups:
  cmdRowsFile.write(str(tup) + eol)

patDict = getPatObjs()
chkPatterns(cmdDict,patDict)

paramDict = getParamObjs()
paramTups = getParamTups(paramDict) 
paramTups = sorted(paramTups,key=itemgetter(0))
for tup in paramTups:
  paramRowsFile.write(str(tup) + eol)

chkParamCnt(cmdDict,paramTups)
chkClones(cmdDict,paramDict)

print("Error msg summary...")
print("cmdTypes msgs:   %2d" % msgCnt["cmdTypes"])
print("patterns msgs:   %2d" % msgCnt["patterns"])
print("paramTypes msgs: %2d" % msgCnt["paramTypes"])
