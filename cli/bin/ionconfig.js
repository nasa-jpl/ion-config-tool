#!/usr/bin/env node
//
//    ionconfig.js
//
//  generate full set of ion config files based on ion model
//
//  usage:  ionconfig.js -m [ionmodelfile]
//
//  inputs: ion_model.json  (or alternative name)
//
//  outputs: ion_model directory,    (using model name)
//           ion_model/node1 subdir, (per node using node names from model)
//           ion_model/node1/node1.xxxrc,   (per node per config file)
//           ion_model/node1/start_node1.sh, (start script per node)
//           progress messages,
//           error messages
//
//  author: Rick Borgen
//

// module imports
const mm  = require('minimist');
const fs  = require('fs');
const df  = require('date-fns');
const buf = require('buffer');
const zip = require('jszip');

var debugFlag = false

// schema imports (global)
const configTypes = require('../../json/configTypes.json');
const cmdTypes    = require('../../json/cmdTypes.json');
const paramTypes  = require('../../json/paramTypes.json');
const selections  = require('../../json/selections.json');
const patterns    = require('../../json/patterns.json');
const versions    = require('../../json/ionVersions.json');

var uniqId = 0;       // counter used to make unique names

// ion model objects (global)
var ion = {};
var graphs = {};
var nodes = {};
var configs = {};
var commands = {};
var hosts = {};
var ipaddrs = {};
var cloneValues = {}

console.log("Build ION Configurations from an ION Model");

var argv = mm(process.argv.slice(2));
var long = argv.l;
if (long)
  console.log("long mode");
var fname = argv.m;
console.log("Model file: " + fname);  
var json;
try {
  json = JSON.parse(fs.readFileSync(fname,'utf8'));
} catch (err) {
  error("Cannot process file: " + fname);
  console.log("" + err);
  process.exit();
}
console.log("JSON parsing successful.");
console.log("---");

// complete initialization of policy objects
// assign cmdTypes list to each configType
for (var cmdType in cmdTypes) {
  let confType = cmdTypes[cmdType].configType;
  configTypes[confType].cmdTypes.push(cmdType);
}
// assign paramTypes list to each cmdType
for (var pType in paramTypes) {
  let cType = paramTypes[pType].cmdType;
  cmdTypes[cType].paramTypes.push(pType);
}

// build hosts, nodes, configs, etc. from model
extractIonModel(json);
console.log("---");
console.log("ION Model summary:");
console.log("hosts:   " + Object.keys(hosts));
console.log("nodes:   " + Object.keys(nodes));
console.log("configs: " + Object.keys(configs));
console.log("ipAddrs: " + ipaddrs);
console.log("---");
console.log("Checking user ion model.");
var errors = checkIonModel();
if (errors.length) {
  console.log("Validation errors.");
  for (let i=0; i<errors.length; i++) {
    error(errors[i]);
  }
} else {
  console.log("Validation successful.");
}
console.log("---");

console.log("ION Model summary:");
console.log("hosts: "  + Object.keys(hosts));
console.log("nodes: "  + Object.keys(nodes));
console.log("graphs: " + Object.keys(graphs));
console.log("config count:  " + Object.keys(configs).length);
console.log("ipaddr count:  " + Object.keys(ipaddrs).length);
console.log("command count: " + Object.keys(commands).length );
console.log("config files:  " + Object.keys(configs));

console.log("---");

console.log("Build and save all configurations.");
saveAllConfigs();

console.log("---");
console.log("Done.");

//----functions---
function warn(s) {
  console.log("Warning: "  + s);
}
function error(s) {
  console.log("Error: "  + s);
}
function debug(s) {
  if (debugFlag) 
    console.log("$$$ " + s);
}
// NOTE: compare to extractModel of IonConfig IonModelLoader.jsx
function extractIonModel (modelObj) {
  // extract the Ion config JSON structure &
  // flatten the data structures for efficient access

  if(modelObj.hasOwnProperty("ionModelName"))
    ion.name = modelObj["ionModelName"];
  else {
     console.log("The json file is not an Ion Model.");
     return false;
  }
  if(modelObj.hasOwnProperty("ionModelDesc"))
    ion.desc = modelObj["ionModelDesc"];
  if(modelObj.hasOwnProperty("nextNodeNum"))
    ion.nextNodeNum = modelObj["nextNodeNum"];
  if(modelObj.hasOwnProperty("currentContacts"))
    ion.currentContacts = modelObj["currentContacts"];

  var hostList = [];
  if(modelObj.hasOwnProperty("hosts"))  // optional for now.
    hostList = modelObj.hosts;
  for (var i=0; i<hostList.length; i++) {
    var hostObj = hostList[i];
    var hostKey = hostObj.hostName;
    var ipAddrs = hostObj.ipAddrs;
    // build the nodes state object
    hosts[hostKey] = { 
      "id" : hostKey, 
      "name" : hostObj["hostName"], 
      "desc" : hostObj["hostDesc"], 
      "linefeed" : hostObj["linefeed"],
      "ipAddrKeys" : []
    };
    let hostCmdKey = "host_" + hostKey;
    let cmdObj = { "id": hostCmdKey, "typeKey": "host_hostkey", "values":[ hostKey ] };
    let cloneVal = makeCloneVal(hostKey,cmdObj);
    cloneValues[hostCmdKey] = cloneVal;
    // get ipAddrs
    const ipCnt = ipAddrs?  ipAddrs.length : 0 ;
    for (var j=0; j<ipCnt; j++) { 
      let uniqid = getUniqId();
      let ipCmdKey = "ipAddr_" + uniqid;
      let ipAddr = ipAddrs[j];
      ipaddrs[ipCmdKey] = {
        "id" : ipCmdKey,
        "hostKey" : hostKey,
        "ipAddr" : ipAddr
      }
      hosts[hostKey].ipAddrKeys.push(ipCmdKey);
      let ipObj = { "id": ipCmdKey, "typeKey": "host_ipaddr", "values":[ ipAddr ] };
      let cloneVal = makeCloneVal(hostKey,ipObj);
      cloneValues[ipCmdKey] = cloneVal;
    }
  };
  console.log("ion IS:  " + JSON.stringify(ion));
  var nodeList = [];
  if(modelObj.hasOwnProperty("nodes"))  // optional for now.
    nodeList = modelObj.nodes;
  for (i=0; i<nodeList.length; i++) {
    var nodeObj = nodeList[i];
    var nodeKey = nodeObj["nodeName"];
    // build the nodes state object
    nodes[nodeKey] = { 
      "id" : nodeObj["nodeName"], 
      "longName" : nodeObj["nodeDesc"], 
      "ionNodeNum" : nodeObj["nodeNum"],
      "ionVersion" : nodeObj["ionVersion"],
      "hostKey" : nodeObj["hostName"],
      "configKeys" : []
    };
    // build nodenum & nodekey clone value
    let numCmdKey = "nodeNum_" + nodeKey;
    let cmdObj = { "id": numCmdKey, "typeKey": "node_nodenum", "values":[ nodeObj["nodeNum"] ] };
    let cloneVal = makeCloneVal(nodeKey,cmdObj);
    cloneValues[numCmdKey] = cloneVal;
    let nodeCmdKey = "nodeKey_" + nodeKey;
    cmdObj = { "id": nodeCmdKey, "typeKey": "node_nodekey", "values":[ nodeKey ] };
    cloneVal = makeCloneVal(nodeKey,cmdObj);
    cloneValues[nodeCmdKey] = cloneVal;

    console.log("node item=" + JSON.stringify(nodeObj) );
    var configsObj = nodeObj.configs;
    console.log("node configs=" + JSON.stringify(configsObj) );
    const configKeyList = extractConfigs(nodeKey,configsObj);
    console.log("Node got configKeys: " + configKeyList);
    nodes[nodeKey].configKeys = configKeyList;
  }
  console.log("=== Ingesting contacts.");
  var graphList = [];
  if (modelObj.hasOwnProperty("graphs"))  // optional for now.
    graphList = modelObj.graphs
  for (i=0; i<graphList.length; i++) {  // normally just one item
    var graphObj = graphList[i];
    var graphKey = graphObj["graphName"];
    // build the graph state object
    graphs[graphKey] = { 
      "id"   : graphObj["graphName"], 
      "name" : graphObj["graphName"], 
      "desc" : graphObj["graphDesc"],
      "ionVersion" : graphObj["ionVersion"],
      "configKey" : ""
    };
    console.log("graph item=" + JSON.stringify(graphObj) );
    configsObj = graphObj.configs;
    console.log("graph configs=" + JSON.stringify(configsObj) );
    const configKeyList = extractConfigs(graphKey,configsObj);
    console.log("Node got configKeys: " + configKeyList);
    graphs[graphKey].configKey = configKeyList[0];   // assuming just one
  }
  // NOTE: contacts was old name with old attributes
  var contactsList = [];
  if (modelObj.hasOwnProperty("contacts"))  // optional for now.
    contactsList = modelObj.contacts;
  for (i=0; i<contactsList.length; i++) {  // normally just one item
    graphObj  = contactsList[i];
    graphKey  = graphObj.contactsName;
    // build the graph state object
    graphs[graphKey] = { 
      "id"   : graphObj["graphName"], 
      "name" : graphObj["graphName"], 
      "desc" : graphObj["graphDesc"],
      "configKey" : ""
    };
    console.log("graph item=" + JSON.stringify(graphObj) );
    configsObj = graphObj.configs;
    console.log("contacts configs=" + JSON.stringify(configsObj) );
    const configKeyList = extractConfigs(graphKey,configsObj);
    console.log("Node got configKeys: " + configKeyList);
    graphs[graphKey].configKey = configKeyList[0];   // assuming just one
  }
  assignClones();   // analyze full new command set for cloneVal dependents
  return true;
};

// NOTE: compare to extractConfigs of IonConfig IonModelLoader.jsx
function extractConfigs(groupKey,configsObj) {
  // groupKey is for a group of configs (a node or contacts)
  console.log("extractConfigs groupKey:" + groupKey);
  //console.log("extractConfigs configsObj:" + JSON.stringify(configsObj) );
  // make short names for state objects

  if (configsObj === undefined) { configsObj = {}; }
  var keyList = [];  // save generated keys for caller
  for (var configType in configsObj) {   // object names are configTypes
    //console.log("loop for configType:" + configType);
    var configKey = groupKey + "." + configType;
    if (configType === "contacts")   // special case for ionrc used for contacts
      configKey = groupKey + ".cg";
    keyList.push(configKey);    // save for caller
    // build the configs state object
    configs[configKey] = {
      "id" : configKey,
      "nodeKey": groupKey,
      "configType" : configType,
      "cmdKeys" : [] 
    };
    var commandsList = configsObj[configType].commands;
    const cmdKeyList = extractCommands(groupKey,configType,configKey,commandsList);
    //console.log("Config got cmdKeys: " + cmdKeyList);
    configs[configKey].cmdKeys = cmdKeyList;
  }
  return keyList;   // return list of configKeys
};

// NOTE: compare to extractCommands of IonConfig IonModelLoader.jsx
function extractCommands(groupKey,configType,configKey,commandsList) {
  // extract JSON config definition & build config with commands & cloneValues
  console.log("extractCommands groupKey:" + groupKey);
  console.log("extractCommands configType:" + configType);
  console.log("extractCommands configKey:" + configKey);
  if (commandsList === undefined) { commandsList = []; }
  var keyList = [];
  // make short names for state objects

  //console.log("commands list=" + JSON.stringify(commandsList) );
  for (let i = 0; i < commandsList.length; i++) {
    const cmdObj = commandsList[i];
    const cmdTypeKey = cmdObj.type;
    console.log("cmdTypeKey: " + cmdTypeKey);
    const uniqid = getUniqId();
    const cmdKey = "cmd_" + uniqid;
    keyList.push(cmdKey);
    const cmdType = cmdTypes[cmdTypeKey];
    commands[cmdKey] = {
      "id" : cmdKey,
      "configKey" : configKey,
      "typeKey" : cmdTypeKey,
      "typeName" : cmdObj.type,
      "order" : cmdType.order,
      "lastUpdate" : cmdObj.lastUpdate,
      "values" : []
    };
    //console.log("command item=" + JSON.stringify(commands[cmdKey]) );
    for (var j = 0; j < cmdObj.parameters.length; j++) {
      const pVal = cmdObj.parameters[j];
      commands[cmdKey].values.push(pVal);
    };
    // build object with all clone-able values
    if (cmdTypes[cmdTypeKey].isCloned) {
      var cloneVal = makeCloneVal(groupKey,commands[cmdKey]);
      var cvKey = cloneVal.id;
      cloneValues[cvKey] = cloneVal;
    }
  }
  return keyList;    // return list of cmdKeys
};

// NOTE: compare to extractModel of IonConfig IonModelLoader.jsx
function assignClones() {
  // review all commands for cloneVal sources and cloneVal dependents
  // make short names for state objects

  // identify commands dependent on cloneValues
  // and push them on to the cloneValue list for update notifications
  console.log("=== Identify clones using cloneValues from user ion model.");
  for (var cmdKey in commands) {
    let cmd = commands[cmdKey];
    let cmdTypeKey = cmd.typeKey;
    console.log("$$$ cmdKey: " + cmdKey + " has type: " + cmdTypeKey);
    let cmdType = cmdTypes[cmd.typeKey];
    if(cmdType.copyClone  || cmdType.pickClone) {
      for (let i = 0; i < cmdType.paramTypes.length; i++) {
         let paramTypeKey = cmdType.paramTypes[i];
         let paramType = paramTypes[paramTypeKey];
         console.log("$$$ consider paramType " + paramType.id + " for cloning.")
         if (paramType.copyClone || paramType.pickClone) { 
            let val = cmd.values[i];
            let type = paramType.valType;
            console.log("$$$ seeking clone value for type: " + type + " with value of " + val);
            let cloneVal = findCloneVal(cloneValues,type,val);
            if(cloneVal) {
              console.log("=== building clone.");
              let clone = { "cmdKey" : cmdKey, "valIdx" : i };
              console.log ("$$$ created clone key: " + JSON.stringify(clone));
              cloneVal.clones.push(clone);
            }
         }
      }
    }
  }
};
// NOTE: compare to checkModel of IonConfig IonModel.jsx
function checkIonModel() {
  // check model for errors
  let alerts = [];
  const modelName = ion.name;
  // Model-level
  if (Object.keys(graphs).length === 0)
    alerts.push({"type": "IonModel", "name": modelName, "level":"warn", "msg":"No graphs created."});
  if (Object.keys(nodes).length === 0)
    alerts.push({"type": "IonModel", "name": modelName, "level":"warn", "msg":"No nodes created."});
  // Node-level   required configs
  const reqConfigs = ["ionrc", "ionconfig","ipnrc"];
  // TODO : add req for bprc of either v6 or v7
  // Config-level required command types
  var reqCmds = {}; 
  reqCmds["ionrc"] = ["initialize","start"];
  reqCmds["bpv6rc"] = ["initialize","scheme","start"];
  reqCmds["bpv7rc"] = ["initialize","scheme","start"];
  reqCmds["ionconfig"] = [];
  reqCmds["ipnrc"] = ["plan"];
  reqCmds["ltprc"] = ["initialize"];
  reqCmds["bssprc"] = ["initialize"];
  // host loop
  for (var hostKey in hosts) {
    const host = hosts[hostKey];
    if (host.ipAddrKeys.length === 0) {
      let msg = "has no IP addresses defined.";
      alerts.push({"type": "Host", "name": hostKey, "level":"warn", "msg": msg});
    }
  }
  // node loop
  for (var nodeKey in nodes) {
    const node = nodes[nodeKey];
    if (node.hostKey === "") {
      let msg = "has no host machine assigned.";
      alerts.push({"type": "Node", "name": nodeKey, "level":"warn", "msg": msg});
    }
    var ionVerSeqNo = getIonVerSeqNo(nodeKey);
    var ionVer = versions[ionVerSeqNo].ionVersion;
    let protFlags = {};  // dict for protocol cmd existence
    let ductFlags = {};  // dict for duct cmd existence by protocol
    console.log("checking commands for version seq: " + ionVerSeqNo.toString())
    var nconfs = node.configKeys;
    for (let i=0; i<reqConfigs.length; i++) {
      let chkConf = reqConfigs[i];
      let missing = true;
      for (let j=0; j<nconfs.length; j++) {
        if (nconfs[j].indexOf(chkConf) >= 0)
          missing = false;
      }
      if (missing) {
        let msg = "Has no " + chkConf + " file.";
        alerts.push({"type": "Node", "name": nodeKey, "level":"warn", "msg": msg});
      }
    }
    console.log("+++ conf count: " + nconfs.length);
    // node configs loop
    for (let k=0; k<nconfs.length; k++) {
      let confKey = nconfs[k];
      var configObj = configs[confKey];
      let chkConf = configObj.configType;
      let cmdCounts = {};   // dict for cmd type counts

      let missed = [];   // assume all required commands missing...will drop from list if found
      if (reqCmds.hasOwnProperty(chkConf) ) 
        missed = reqCmds[chkConf];
      console.log("+++ checking reqd cmds" + missed.toString());
      // node config commands loop
      for (let n=0; n<configObj.cmdKeys.length; n++) { 
        let cmdKey = configObj.cmdKeys[n];
        let cmdTypeKey = commands[cmdKey].typeKey;
        var cmdType = cmdTypes[cmdTypeKey];
        console.log("checking command type: " + cmdTypeKey + " " );
        if (cmdType.verFrom > ionVerSeqNo) {
          let msg = "Node " + nodeKey + "(" + ionVer + ") needs earlier variant of this command";
          alerts.push({"type": "Command", "name": cmdTypeKey, "level":"warn", "msg": msg});
        }
        if (cmdType.verThru < ionVerSeqNo) {
          let msg = "Node " + nodeKey + "(" + ionVer + ") needs later variant of this command";
          alerts.push({"type": "Command", "name": cmdTypeKey, "level":"warn", "msg": msg});
        }
        // keep count of each cmdType
        if (cmdCounts.hasOwnProperty(cmdTypeKey))
          cmdCounts[cmdTypeKey] += 1; 
        else 
          cmdCounts[cmdTypeKey] = 1;

        for (let c=0; c<missed.length; c++) {
          let reqCmd = missed[c];
          if (cmdTypeKey.indexOf(reqCmd) >= 0) {
            missed.splice(c,1);  // drop this one from missing list
            break;               // and exit loop
          }
        }
        // check for missing command parameters
        let cmdObj = commands[cmdKey];
        let cmdStr = makeCmdLine(cmdTypeKey,cmdObj.values);
        if (cmdStr.indexOf("??") > -1) {
          let msg = "Missing parameter(s).";
          let cmdTag = nodeKey + "." + cmdTypeKey;
          alerts.push({"type": "Command", "name": cmdTag, "level":"warn","msg": msg});
        }
        // check for missing protocol cmds
        if (cmdStr.indexOf("induct")  > -1 || 
            cmdStr.indexOf("outduct") > -1 ) {
           let pList = cmdStr.split(" ").filter(Boolean);  // get non-empty tokens
           let prot = pList[2];   // 3rd token should be protocol
           ductFlags[prot] = 1;  // don't need full count
        }
        if (cmdStr.indexOf("protocol")  > -1) {
           let pList = cmdStr.split(" ").filter(Boolean);  // get non-empty tokens
           let prot = pList[2];   // 3rd token should be protocol
           protFlags[prot] = 1;  // don't need full count
        }
      }  // end of command loop
      // check for incorrect command duplicates
      console.log("***** cmdCounts " + JSON.stringify(cmdCounts));
      for (var cntKey in cmdCounts) {
        if (cmdCounts[cntKey] > 1) {
          console.log("***** " + cntKey + " count =" + cmdCounts[cntKey].toString() );
          if (!cmdTypes[cntKey].hasOwnProperty("multiple")) {   // singleton command?
            let msg = "Improper duplicate command: " + cntKey;
            alerts.push({"type": "Config", "name": confKey, "level":"warn", "msg": msg});
          }
        }
      }
      // alert any missing commands
      for (let m=0; m<missed.length; m++) {
        let missedCmd = missed[m];
        let msg = "Has no " + missedCmd + " command.";
        alerts.push({"type": "Config", "name": confKey, "level":"warn", "msg": msg});
      }
    } //end of config loop
    console.log("***** ductFlags " + JSON.stringify(ductFlags));
    console.log("***** protFlags " + JSON.stringify(protFlags));
    // alert any missing protocol commands
    for (var prot in ductFlags) {
      if (!protFlags.hasOwnProperty(prot)) {
        let msg = "The bprc is missing the protocol " + prot + " command.";
        alerts.push({"type": "Node", "name": nodeKey, "level":"error", "msg": msg});
      }
    }
  } // end of node loop

  return alerts;
}
// NOTE: compare to isGoodName of IonConfig App.js
function isGoodName(name) {
// check if a new name is valid
debug("isGoodName ?? " + name);
  if (name === '')
    return false;
  if (name.indexOf(' ') >= 0)
    return false;
  return true;
}
// NOTE: compare to isStandardProtocol of IonConfig App.js
function isStandardProtocol(protocol) {
//check if protocol has a standard ION CLI
  if (protocol === "tcp"  ||
      protocol === "stcp" ||
      protocol === "udp"  ||
      protocol === "dccp" ||
      protocol === "bssp" ||
      protocol === "ltp") 
    return true;
  else
    return false;
}
// NOTE: compare to isStandardProtocol of IonConfig App.js
function getUniqId() {
  // generate next uniq id...used by all types
  let nextId = uniqId + 1;
  uniqId = nextId;
  return nextId;
}
// NOTE: compare to addCommandKey of IonConfig NetModel.jsx
function addCommandKey(configs,configName,cmdKey) {
// add commmand to a configuration, unless its null
  if (cmdKey == null) {
    debug("addCommandKey discarded for configFile: " + configName);
    return;
  }
  configs[configName].cmdKeys.push(cmdKey);
}

// NOTE: compare to makeIonCommand of IonConfig NetModel.jsx
function makeIonCommand(commands,clones,groupKey,configKey,configType,cmdName,values) {
// build an ion command object
  let cmdTypeKey = configType + "_" + cmdName;
  let uniqid = getUniqId();
  let cmdKey = "cmd_" + uniqid;
  let cmdType = cmdTypes[cmdTypeKey];
  debug("makeIonCommand ... configType: " + configType + 
              " groupKey: " + groupKey + " cmdName: " + cmdName +
              " cmdKey: " + cmdKey + " values: " + values);
  if (cmdType === null)
    return null;
  // check for duplicate command & exit if dup exists
  for (var cKey in commands) {
    let cmd = commands[cKey];
    if (cmd.configKey === configKey) {     // matching config file?
      if (cmd.typeKey === cmdTypeKey) {    // matching command type
        var match = true;
        for (let i = 0; i < cmd.values.length; i++) {
          if (cmd.values[i] !== values[i])
            match = false;
        }
        if (match) {
          debug("makeIonCommand duplicate command: " + JSON.stringify(cmd));
          return null;
        }
      } // end cmdTypeKey check
    }   // end configKey check
  }     // end commands loop
  let tranTime = getNow();
  commands[cmdKey] = {
    "id" : cmdKey,
    "configKey" : configKey,
    "typeKey" : cmdTypeKey,
    "typeName" : cmdType.name,
    "order" : cmdType.order,
    "lastUpdate" : tranTime,
    "values" : values
  };
  if (cmdType.isCloned) {
    var cloneVal = makeCloneVal(groupKey,commands[cmdKey]);
    var cvKey = cloneVal.id;
    clones[cvKey] = cloneVal;
  } 
  return cmdKey;
};
// get now date-time in standard format
function getNow() {
  const now = new Date();
  var goodNow = df.formatISO(now); 
  goodNow = goodNow.substring(0,16);
  return goodNow;
};
// NOTE: compare to makeCloneVal of IonConfig App.jsx
function makeCloneVal(nodeKey,cmd) {
  // make a clone-able value object (or expression) based on special command types
  var cloneVal = {};
  // first assign properties not dependent on type
  cloneVal["id"] = cmd.id;
  cloneVal["nodeKey"] = nodeKey;
  cloneVal["clones"] = []     // a list for clone id objects (cmdKey & valIdx)
  cloneVal["value"] = makeComboValue(cmd,cmd.typeKey);
  // then check specific type for other init rules
  if (cmd.typeKey === "node_nodenum") {    /// special model command (not ion)
    cloneVal["type"] = "nodeNum";
    cloneVal["label"] = nodeKey;
  } else
  if (cmd.typeKey === "node_nodekey") {    /// special model command (not ion)
    cloneVal["type"] = "nodeKey";
    cloneVal["label"] = nodeKey;
  } else
  if (cmd.typeKey === "host_hostkey") {    /// special model command (not ion)
    cloneVal["type"] = "hostKey";
    cloneVal["label"] = 'Host:' + cmd.values[0];
  } else
  if (cmd.typeKey === "host_ipaddr") {         /// special model command (not ion)
    cloneVal["type"] = "ipAddr";
    cloneVal["label"] = 'Host: ' + nodeKey + ' IpAddr:' + cmd.values[0];
  } else
  if (cmd.typeKey === "bpv6rc_endpoint" ||
      cmd.typeKey === "bpv7rc_endpoint") {
    cloneVal["type"] = "ionEndpoint";
    // should annotate endpoint purpose in the the label
    let suffix = '';
    if (cmd.values[3] !== "")
      suffix = ' [' + cmd.values[3] + ']';
    cloneVal["label"] = 'node:' + nodeKey + ' servNum:' + cmd.values[1] + suffix;
  } else
  if (cmd.typeKey === "bpv6rc_induct_ltp" ||
      cmd.typeKey === "bpv7rc_induct_ltp") {
    cloneVal["type"] = "ltpInduct";
    cloneVal["label"] = 'toNode: ' + nodeKey + ' ltpInductName: ' + cloneVal.value;
  } else
  if (cmd.typeKey === "bpv6rc_induct_udp" ||
      cmd.typeKey === "bpv7rc_induct_udp") {
    cloneVal["type"] = "udpInduct";
    cloneVal["label"] = 'toNode: ' + nodeKey + ' udpInductName: ' + cloneVal.value;
  } else 
  if (cmd.typeKey === "bpv6rc_induct_stcp" ||
      cmd.typeKey === "bpv7rc_induct_stcp") {
    cloneVal["type"] = "stcpInduct";
    cloneVal["label"] = 'toNode:' + nodeKey + ' stcpInductName: ' + cloneVal.value; 
  } else 
  if (cmd.typeKey === "bpv6rc_induct_tcp" ||
      cmd.typeKey === "bpv7rc_induct_tcp") {
    cloneVal["type"] = "tcpInduct";
    cloneVal["label"] = 'toNode: ' + nodeKey + ' tcpInductName: ' + cloneVal.value;
  } else 
  if (cmd.typeKey === "bpv6rc_induct_dccp" ||
      cmd.typeKey === "bpv7rc_induct_dccp") {
    cloneVal["type"] = "dccpInduct";
    cloneVal["label"] = 'toNode: ' + nodeKey + ' dccpInductName: ' + cloneVal.value; 
  } else
  if (cmd.typeKey === "bpv6rc_induct_bssp" ||
      cmd.typeKey === "bpv7rc_induct_bssp") {
    cloneVal["type"] = "bsspInduct";
    cloneVal["label"] = 'toNode: ' + nodeKey + ' bsspInductName: ' + cloneVal.value;
  } else 
  if (cmd.typeKey === "bpv6rc_outduct_ltp" ||
      cmd.typeKey === "bpv7rc_outduct_ltp") {
    cloneVal["type"] = "ltpOutduct";
    cloneVal["label"] = 'fromNode: ' + nodeKey + ' ltpOutductName: ' + cloneVal.value;
  } else
  if (cmd.typeKey === "bpv6rc_outduct_udp" ||
      cmd.typeKey === "bpv7rc_outduct_udp") {
    cloneVal["type"] = "udpOutduct";
    cloneVal["label"] = 'fromNode: ' + nodeKey + ' udpOutductName: ' + cloneVal.value;
  } else 
  if (cmd.typeKey === "bpv6rc_outduct_stcp" ||
      cmd.typeKey === "bpv7rc_outduct_stcp") {
    cloneVal["type"] = "stcpOutduct";
    cloneVal["label"] = 'fromNode:' + nodeKey + ' stcpOutductName: ' + cloneVal.value; 
  } else 
  if (cmd.typeKey === "bpv6rc_outduct_tcp" ||
      cmd.typeKey === "bpv7rc_outduct_tcp") {
    cloneVal["type"] = "tcpOutduct";
    cloneVal["label"] = 'fromNode: ' + nodeKey + ' tcpOutductName: ' + cloneVal.value;
  } else 
  if (cmd.typeKey === "bpv6rc_outduct_dccp" ||
      cmd.typeKey === "bpv7rc_outduct_dccp") {
    cloneVal["type"] = "dccpOutduct";
    cloneVal["label"] = 'fromNode: ' + nodeKey + ' dccpOutductName: ' + cloneVal.value; 
  } else 
  if (cmd.typeKey === "ltprc_start_udp") {
    cloneVal["type"] = "udpLink";
    cloneVal["label"] = 'toNode: ' + nodeKey + ' udpLinkName: ' + cloneVal.value;
  } else 
  if (cmd.typeKey === "ltprc_start_dccp") {
    cloneVal["type"] = "dccpLink";
    cloneVal["label"] = 'toNode: ' + nodeKey + ' dccpLinkName: ' + cloneVal.value;
  } else
  if (cmd.typeKey === "bpv6rc_outduct_bssp" ||
      cmd.typeKey === "bpv7rc_outduct_bssp") {
    cloneVal["type"] = "bsspOutduct";
    cloneVal["label"] = 'fromNode: ' + nodeKey + ' bsspOutductName: ' + cloneVal.value;
  } else {
    debug("!!! nodeKey: " + nodeKey + " is not clone type!! ");
    return null;
  }
  debug(" new cloneVal = " + JSON.stringify(cloneVal));
  return cloneVal;
}
// NOTE: compare to makeComboValue of IonConfig App.jsx
function makeComboValue(cmd,type) {
  // make a combined value used for cloning (duct names, endpoints, etc.)
  debug(" makeComboVal = " + type + ' ' + cmd.values[0]);
  let combo = "";
  if (type === "node_nodenum") 
    combo = cmd.values[0];
  else if (type === "node_nodekey") 
    combo = cmd.values[0];
  else if (type === "host_hostkey") 
    combo = cmd.values[0];
  else if (type === "host_ipaddr") 
    combo = cmd.values[0];
  else if (type === "bpv6rc_endpoint"
        || type === "bpv7rc_endpoint")
    combo = "ipn:" + cmd.values[0] + '.' + cmd.values[1];
  else if (type === "bpv6rc_induct_ltp"
        || type === "bpv6rc_induct_bssp"
        || type === "bpv7rc_induct_ltp"
        || type === "bpv7rc_induct_bssp")
    combo = cmd.values[0];
  else if (type === "bpv6rc_induct_udp"
        || type === "bpv6rc_induct_stcp"
        || type === "bpv6rc_induct_tcp"
        || type === "bpv6rc_induct_dccp" 
        || type === "bpv7rc_induct_tcp"
        || type === "bpv7rc_induct_stcp"
        || type === "bpv7rc_induct_tcp"
        || type === "bpv7rc_induct_dccp" )
    combo = cmd.values[0] + ':' + cmd.values[1];
  else if (type === "bpv6rc_outduct_ltp"
        || type === "bpv6rc_outduct_bssp"
        || type === "bpv7rc_outduct_ltp"
        || type === "bpv7rc_outduct_bssp")
    combo = cmd.values[0];
  else if (type === "bpv6rc_outduct_stcp"
        || type === "bpv6rc_outduct_tcp"
        || type === "bpv6rc_outduct_dccp" 
        || type === "bpv6rc_outduct_udp"
        || type === "bpv7rc_outduct_stcp"
        || type === "bpv7rc_outduct_tcp"
        || type === "bpv7rc_outduct_dccp" 
        || type === "bpv7rc_outduct_udp")
    combo = cmd.values[0];
  else if (type === "ltprc_start_udp"
        || type === "ltprc_start_dccp" )
    combo = cmd.values[0] + ':' + cmd.values[1];
  return combo;
}

// NOTE: compare to findCloneVal of IonConfig App.jsx
function findCloneVal(cloneVals,type,value) {
  // find a cloneValue based on type & value
  if (value === '??')   // just a fake default value
    return null;
  let target = String(value);  // force string compare, avoid num issues
  for (var key in cloneVals) {
    let cloneVal = cloneVals[key];
    //debug(" checking cloneVal: " + JSON.stringify(cloneVal));
    if (cloneVal.type === type && String(cloneVal.value) === target) 
      return cloneVal;
  }
  debug ("!!! failed to find cloneVal for type: " + type + "  value: " + value);
  return null;
}

// NOTE: compare to getAnyCloneVal of IonConfig App.jsx
function getAnyCloneVal(cloneVals,type) {
  // find any cloneValue based on type (defaults for new commands)
  for (var key in cloneVals) {
    let cloneVal = cloneVals[key];
    //debug(" finding any cloneVal: " + JSON.stringify(cloneVal));
    if (cloneVal.type === type)
      return cloneVal.value;
  }
  debug ("!!! found no cloneVal for type: " + type);
  return "";
}

// NOTE: compare to getCloneVal of IonConfig App.jsx
function getCloneVal(cloneVals,cmdKey) {
// find a cloneValue based on type & value
  for (var key in cloneVals) {
    let cloneVal = cloneVals[key];
    //debug(" checking cloneVal: " + JSON.stringify(cloneVal));
    if (cloneVal.id === cmdKey) {
      return cloneVal;
    }
  }
  debug ("!!! failed to get cloneVal for cmdKey: " + cmdKey);
  return null;
}
// NOTE: compare to getIonVerSeqNo of IonConfig IonModel.jsx
function getIonVerSeqNo(nodeKey) {
  // translate version to sequence number for command effectivity
  console.log("getIonVerSeqNo for:" + nodeKey);
  if (!(nodes.hasOwnProperty(nodeKey) || graphs.hasOwnProperty(nodeKey) ) )
    return 0;
  var ver = 0;
  if (nodeKey in nodes) {
    const node = nodes[nodeKey];
    console.log("??? node: " + JSON.stringify(node));
    ver = node.ionVersion;
  } else {
    const graph = graphs[nodeKey];
    console.log("??? graph: " + JSON.stringify(graph));
    ver = graph.ionVersion;
  }
  console.log("???nodeKey: " + nodeKey + " ionVer: "+ ver);
  for (var seqno in versions) {
    if (ver === versions[seqno].ionVersion)
      return seqno;
  }
  return 0;                       
};
// NOTE: compare to makeCmdLine of IonConfig IonModel.jsx
function makeCmdLine(cmdTypeKey,cmdParams) {
  // console.log("makeCmdLine cmdTypeKey: " + cmdTypeKey + "  Params : " + JSON.stringify(cmdParams));
  const targets = [ "[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]", "[9]" ];
  var cmdPattern = patterns[cmdTypeKey];
  let cmdType = cmdTypes[cmdTypeKey];
  for (var i = 0; i < cmdParams.length; i++) {
    console.log("makeCmdLine Pattern: " + cmdPattern + " tgt: " + cmdTypeKey + "  " + targets[i] + "  " + cmdParams[i]);
    let paramTypeKey = cmdType.paramTypes[i];
    if (paramTypeKey === undefined) {
      console.log("ERROR: ignoring bad parameter " + cmdTypeKey + "  " + targets[i] + "  " + cmdParams[i]);
      continue;
    }
    let paramType = paramTypes[paramTypeKey];
    if (cmdParams[i] === "")
      if (paramType.optional)
        cmdPattern = cmdPattern.replace(targets[i],"");
      else
        cmdPattern = cmdPattern.replace(targets[i],"??");
    else
      cmdPattern = cmdPattern.replace(targets[i],cmdParams[i]);
  }
  //console.log("cmd Type pattern " + cmdTypeKey + " " + cmd);
  return cmdPattern;
};

// NOTE: compare to makeCmdLines of IonConfig IonModel.jsx
function makeCmdLines(configKey) {
  console.log("makeCmdLines for: " + configKey);
  const configObj = configs[configKey];
  const cmdKeys = configObj.cmdKeys;
  const configTypeKey = configObj.configType;
  const configTypeObj = configTypes[configTypeKey];
  //console.log("makeConfigElem configType:" + JSON.stringify(configType));
  const modelName = ion.name;
  const modelDesc = ion.desc;
  const nodeKey = configObj.nodeKey;
  const node = nodes[nodeKey];
  let nodeDesc = "";
  let nodeLabel = "";
  if (node) {  // a node?,  might be a graphs key)    
    nodeDesc = nodes[nodeKey].longName; 
    nodeLabel = "ipn:" + node.ionNodeNum;
  };
  const content = configTypeObj.content;
  const program = configTypeObj.program;

  const fileDate = getNow();
  var cmdLines = [];
  // build header 
  cmdLines.push("#  FILE:      " + configObj.id);
  cmdLines.push("#  CONTENT:   " + content);
  cmdLines.push("#  FOR:       " + program);
  cmdLines.push("#  BUILDER:   ION Configuration Editor");
  cmdLines.push("#  NETWORK:   " + modelName + "    [" + modelDesc + "]");
  if (node) {
    cmdLines.push("#  NODE:      " + nodeKey +  "    [" + nodeDesc + "]");
    cmdLines.push("#  IPN:       " + nodeLabel);
  }
  cmdLines.push("#  DATE:      " + fileDate);
  // build commands
  for (var i=0; i<cmdKeys.length; i++) {
    const cmdKey = cmdKeys[i];
    const cmd = commands[cmdKey];
    const cmdTypeKey = cmd.typeKey;
    const cmdType = cmdTypes[cmdTypeKey];
    const cmdName = cmdType.name;
    cmdLines.push("#");
    cmdLines.push("#  " + cmdName.toUpperCase());
    const pTypeKeys = cmdType.paramTypes;
    const cmdVals = cmd.values;
    for (let j=0; j<pTypeKeys.length; j++) {
      const pTypeKey = pTypeKeys[j];
      const val = cmdVals[j];
      cmdLines.push(makeParamNote(pTypeKey,j,val));
    }
    cmdLines.push(makeCmdLine(cmdTypeKey,cmdVals));
  }
  return cmdLines;
}
// NOTE: compare to makeStartLines of IonConfig IonModel.jsx
function makeStartLines(nodeKey) {
  // build the start script text lines for a node
  let node = nodes[nodeKey];
  let fileName = "start_" + nodeKey + ".sh";
  let nodeLabel = "ipn:" + node.ionNodeNum;
  const fileDate = getNow();
  var cmdLines = [];
  cmdLines.push("#!/bin/bash");
  cmdLines.push("#  FILE:  " + fileName);
  cmdLines.push("#  NODE:  " + nodeKey + " [" + nodeLabel + "]");
  cmdLines.push("#  DESC:  " + node.longName);
  cmdLines.push("#  DATE:  " + fileDate);
  cmdLines.push("host=`uname -n`");
  cmdLines.push("wdir=`pwd`");
  cmdLines.push('echo "Clearing old ion.log"');
  cmdLines.push("echo > ion.log");

  let nodeConfigs = [];
  for (var i=0; i<node.configKeys.length; i++) {
    let configKey = node.configKeys[i];
    let configType = configs[configKey].configType;
    let order = configTypes[configType].start_order;
    let nodeConfig = configs[configKey];
    nodeConfig.order = order;
    if (configKey.indexOf("ionconfig") < 0)  // add all except ionconfig
       nodeConfigs.push(nodeConfig);
  }
  nodeConfigs.sort( (a,b) => (a.order > b.order) ? 1 : -1);
  console.log("makeStartLines sortConfigs: " + JSON.stringify(nodeConfigs));
  for (var j=0; j<nodeConfigs.length; j++) {
    let configObj = nodeConfigs[j];
    let configKey = configObj.id;
    console.log("makeStartLines configKey: " + configKey);
    let configTypeKey = configObj.configType;
    let configTypeObj = configTypes[configTypeKey];
    let prog = configTypeObj.program;
    if (j === 0) 
      cmdLines.push('echo "Starting ION node ' + nodeLabel + ' on $host from $wdir"');
    else
      cmdLines.push("sleep  1");
    cmdLines.push(prog + "  " + configKey);
  }
  // special case for (global) graphs file
  let contacts = ion.currentContacts;
  if (contacts !== "") {
    let contactsFile = contacts + ".cg";
    cmdLines.push("sleep  1");
    cmdLines.push("# global contact graph");
    cmdLines.push("ionadmin  " + contactsFile);
  }
  cmdLines.push('echo "Startup of ION node ' + nodeLabel + ' on $host complete!"');
  let nodeId = node.ionNodeNum;
  cmdLines.push('echo "Starting bpecho on ipn:' + nodeId + '.3."');
  cmdLines.push('bpecho   ipn:' + nodeId + '.3 &');
  return cmdLines;
}
// NOTE: compare to makeParamNote of IonConfig IonModel.jsx
function makeParamNote(pTypeKey,pIdx,paramVal) {
  // build ION parameter annotation (commands file format)
  // define padit here, because "this" can be weird
  function padit (w,str,pad) {
    return (w <= str.length) ? str : padit(w, pad + str, pad);
  };
  var pType = paramTypes[pTypeKey];
  var longname = pType.name;
  longname = padit(34,longname," ");
  const position = pIdx + 1;
  const posTag = "["+ position + "]";
  var units = "";
  if (pType.units !== "") {
    units = "(" + pType.units + ")";
  }
  var descrip = "";
  var sels = undefined;
  if (pTypeKey in selections) {
    sels = selections[pTypeKey];
  }
  if (sels) {
    for (var i = 0; i < sels.length; i++) {
      var select = sels[i];
      if(Object.keys(select)[0] === paramVal) {
        descrip = "[" + select[paramVal] + "]";
      }
    }
  }
  const note = "#  " + posTag + " " + longname + " : " + paramVal + " " + units + " " + descrip;
  return note;
}
// NOTE: compare to makecCmdLine of IonConfig IonModel.jsx
//  NOTE: Conpare to saveConfigs of IonModel.jsx
function saveAllConfigs() {
  console.log("let's save all config files in a zip file!");
  //var zip = new JSZip();
  //var rootdir = zip.folder(ion.name);   // the network name
  // fs.mkdirsSync(ion.name);   // the network name
  // build common contact graph
  try 
    { fs.mkdirSync(ion.name); }  // the network name
  catch (err)
    { console.log(ion.name + " dir already exists."); }
  const graphKey = ion.currentContacts + ".cg";
  var graphLines = makeCmdLines(graphKey);

  // build config files node-by-node
  for (var nodeKey in nodes) {
    const node = nodes[nodeKey]
    const nodeDir = ion.name + '/' + node.id;
    try 
      { fs.mkdirSync(nodeDir); }  // the network name
    catch (err)
      { console.log(nodeDir + " dir already exists."); }
    const confKeys = node.configKeys;
    var lf = "\n";   // assign linefeed format for text files
    var host = hosts[node.hostKey];  // get host object of node
    if (host.linefeed === 'windows')            // windows is different
      lf = "\r\n";

    for (let j=0; j<confKeys.length; j++) {
      var configKey = confKeys[j];
      console.log("Saving config file: " + configKey);
      const cmdLines = makeCmdLines(configKey);
      const page = cmdLines.join(lf) + lf;
      var configFile = ion.name + '/' + node.id + '/' + configKey;
      try 
        { fs.writeFileSync(configFile,page); }
      catch (err)
        { console.log(err); }
    };
    // add common contact graph
    let graphPage = graphLines.join(lf) + lf;
    let fullGraph = ion.name + '/' + node.id + '/' + graphKey;
    try 
      { fs.writeFileSync(fullGraph, graphPage); }
    catch (err)
      { console.log(err); }
    // ... and build start scripts for each node
    let startName = "start_" + nodeKey + ".sh";
    console.log("Saving start file: " + startName);
    let cmdLines = makeStartLines(nodeKey);
    let page = cmdLines.join(lf) + lf;
    let fullStart = ion.name + '/' + node.id + '/' + startName;
    try 
      { fs.writeFileSync(fullStart, page); }
    catch (err)
      { console.log(err); }
  };
};