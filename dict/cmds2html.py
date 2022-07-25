#!/usr/bin/python3
#
#     cmds2html.py
#
#  convert ionconfig command dictionary json to html
#
#  inputs: none
#
#  outputs: dict.html
#
#  author: Rick Borgen
#
import os
import json
from operator import itemgetter

# assume execution in the "work" subdirectory, so
# adjust relative directories accordingly
jsondir = '../json_latest/'  # latest config json files

# track counts of error messages by json file type
msgCnt  = { "cmdTypes":0, "patterns":0, "paramTypes":0 }
msgFile = open("errors.log","w")

def logMsg(file,type,msg):
  msgCnt[file] += 1
  msgFile.write("%11s %5s %s\n" % (file,type,msg))

def getCmdObjs():
  # use the "small" cmdTypes file in the local 'work' directory
  jname = 'cmdTypes.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: ??" 
    logMsg("cmdTypes","FATAL",msg)
  kws = dict.keys()
  print ("cmd Objs (filtered)  = %d" % len(kws) )
  return dict

def getPatObjs():
  jname = jsondir + 'patterns.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: "
    logMsg("patterns","FATAL",msg)
  kws = dict.keys()
  print ("pattern Objs (all versions) = %d" % len(kws) )
  return dict

def getParamObjs():
  jname = jsondir + 'paramTypes.json'
  jfile = open(jname,"r")
  dict = {}
  try:
    dict=json.load(jfile,object_hook=None)
  except ValueError as err:
    msg = "JSON parse failed: "
    logMsg("paramTypes","FATAL",msg)
  kws = dict.keys()
  print ("param Objs (all versions) = %d" % len(kws) )
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
    
    #tup = (strKey,name,configType,paramCnt,order,freq,isCloned,copyClone,pickClone)
    tup = (strKey,name)
    tups.append(tup)
    # end for loop
  return tups
# end getCmdTups

def getParamTup(dict,strKey):
  entry = dict[strKey]

  if "id" in entry:
    id = str(entry["id"])
  else:
    logMsg("paramTypes","ERROR", "id of " + strKey + " is missing.")
    name = "unk"
  if (id != strKey):
    logMsg("paramTypes","ERROR", "id of " + strKey + " does not match key.")

  if "name" in entry:
    name = str(entry["name"])
  else:
    logMsg("paramTypes","ERROR", "name of " + strKey + " is missing.")
    name = "unk"
 
  if "configType" in entry:
    configType = str(entry["configType"])
  else:
    logMsg("paramTypes","ERROR", "configType of " + strKey + " is missing.")
    configType = "unk"
 
  if "cmdType" in entry:
    cmdType = str(entry["cmdType"])
  else:
    logMsg("paramTypes","ERROR", "cmdType of " + strKey + " is missing.")
    cmdType = "unk"
 
  if "valType" in entry:
    valType = str(entry["valType"])
  else:
    logMsg("paramTypes","ERROR", "valType of " + strKey + " is missing.")
    valType = "unk"
 
  if "units" in entry:
    units = str(entry["units"])
  else:
    logMsg("paramTypes","ERROR", "units of " + strKey + " is missing.")
    units = "unk"
 
  if "defaultValue" in entry:
    default = str(entry["defaultValue"])
  else:
    logMsg("paramTypes","ERROR", "default of " + strKey + " is missing.")
    default = "unk"
 
  if "optional" in entry:
    if entry["optional"]:
      required = "false"
    else:
      logMsg("paramTypes","WARN", "optional of " + strKey + " is " + entry["optional"])
  else:
    required = "true"
 
  if "copyClone" in entry:
    if entry["copyClone"]:
      copyClone = "true"
    else:
      logMsg("paramTypes","WARN", "copyClone of " + strKey + " is " + entry["copyClone"])
  else:
    copyClone = "false"
 
  if "pickClone" in entry:
    if entry["pickClone"]:
      pickClone = "true"
    else:
     logMsg("paramTypes","WARN", "pickClone of " + strKey + " is " + entry["pickClone"])
  else:
    pickClone = "false"
    
  #tup = (strKey,name,configType,cmdType,valType,units,default,optional,copyClone,pickClone)
  tup = (name,required,valType,units,default,copyClone,pickClone)

    # end for loop
  return tup
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
      logMsg("patterns","ERROR", "cmdType of " + key + " pattern is missing.")
# end chkPatterns

def chkParamCnt(cmdDict,paramTups):
  lastCmdType =  "nada"
  cnt = 1
  for tup in paramTups:
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
htmlFile   = open("dict.html","w");
# formatting templates
fileTemp =  '<h3>ION Command File Type: %s</h3>'
cmdTemp  =  '</br><b>ION Config Command Name: </b>%s</br>'
patTemp  =  '<b>ION Command Pattern: </b><code>%s</code></br>'
cellTemp  = '<td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td>'
tblOpen  =  '<table>'
tblShut  =  '</table>'
bodyOpen =  '<tbody>'
bodyShut =  '</tbody>'
rowOpen =  '<tr>'
rowShut =  '</tr>'
tblHead  =  '<thead><tr class="header">'
tblHead +=  '<th align="left">Parameters</th>'
tblHead +=  '<th align="left">Required</th>'
tblHead +=  '<th align="left">Value Type</th>'
tblHead +=  '<th align="left">Units</th>'
tblHead +=  '<th align="left">Default</th>'
tblHead +=  '<th align="left">CopyClone</th>'
tblHead +=  '<th align="left">PickClone</th>'
tblHead +=  '</tr></thead>'
eol = '\n'

cmdDict = getCmdObjs()
patDict = getPatObjs()
paramDict = getParamObjs()
cmdTups = getCmdTups(cmdDict) 
cmdTups = sorted(cmdTups,key=itemgetter(0))

currType = ''
for tup in cmdTups:
  cmdKey = tup[0]
  type = cmdDict[cmdKey]["configType"]
  if (type != currType):
    htmlFile.write("<hr>" + eol) 
    htmlFile.write(fileTemp % type + eol) 
    currType = type
  name = cmdDict[cmdKey]["name"]
  htmlFile.write(cmdTemp % name + eol)
  pattern = patDict[cmdKey]
  htmlFile.write(patTemp % pattern + eol)
  # build parameters table
  paramCnt = cmdDict[cmdKey]["paramCnt"]
  print ('Command: %s  paramCnt: %d' % (cmdKey,paramCnt) )
  htmlFile.write(tblOpen  + eol)
  htmlFile.write(tblHead  + eol)
  htmlFile.write(bodyOpen + eol)
  base = cmdKey + '_p'
  for i in range(paramCnt):
    htmlFile.write(rowOpen)
    pKey = base + str(i)
    paramtup = getParamTup(paramDict,pKey)
    htmlFile.write(cellTemp % paramtup)
    htmlFile.write(rowShut + eol)
  htmlFile.write(bodyShut + eol)
  htmlFile.write(tblShut  + eol)
  htmlFile.write("<br>" + eol)


print("Error msg summary...")
print("cmdTypes msgs:   %2d" % msgCnt["cmdTypes"])
print("patterns msgs:   %2d" % msgCnt["patterns"])
print("paramTypes msgs: %2d" % msgCnt["paramTypes"])
