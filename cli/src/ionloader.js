// NOTE: compare to extractModel of IonConfig IonModelLoader.jsx
function extractIonModel (modelObj) {
  // extract the Ion config JSON structure &
  // flatten the data structures for efficient access

  if(modelObj.hasOwnProperty("ionModelName"))
    ion.name = modelObj["ionModelName"];
  else {
     debug_log("The json file is not an Ion Model.");
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
  debug_log("ion IS:  " + JSON.stringify(ion));
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

    debug_log("node item=" + JSON.stringify(nodeObj) );
    var configsObj = nodeObj.configs;

    // check for watch flags requested on the command line
    for (cfg in configsObj) {
      fname = cfg.toString();
      if (wflags[fname]) {
        configsObj[fname].commands.push(wflags[fname]);
      }
    }

    debug_log("node configs=" + JSON.stringify(configsObj) );
    const configKeyList = extractConfigs(nodeKey,configsObj);
    debug_log("Node got configKeys: " + configKeyList);
    nodes[nodeKey].configKeys = configKeyList;
  }
  debug_log("=== Ingesting contacts.");
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
    debug_log("graph item=" + JSON.stringify(graphObj) );
    configsObj = graphObj.configs;
    debug_log("graph configs=" + JSON.stringify(configsObj) );
    const configKeyList = extractConfigs(graphKey,configsObj);
    debug_log("Node got configKeys: " + configKeyList);
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
    debug_log("graph item=" + JSON.stringify(graphObj) );
    configsObj = graphObj.configs;
    debug_log("contacts configs=" + JSON.stringify(configsObj) );
    const configKeyList = extractConfigs(graphKey,configsObj);
    debug_log("Node got configKeys: " + configKeyList);
    graphs[graphKey].configKey = configKeyList[0];   // assuming just one
  }
  assignClones();   // analyze full new command set for cloneVal dependents
  return true;
};

// NOTE: compare to extractConfigs of IonConfig IonModelLoader.jsx
function extractConfigs(groupKey,configsObj) {
  // groupKey is for a group of configs (a node or contacts)
  debug_log("extractConfigs groupKey:" + groupKey);
  // make short names for state objects

  if (configsObj === undefined) { configsObj = {}; }
  var keyList = [];  // save generated keys for caller
  for (var configType in configsObj) {   // object names are configTypes
    debug_log("loop for configType:" + configType);
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
    //debug_log("Config got cmdKeys: " + cmdKeyList);
    configs[configKey].cmdKeys = cmdKeyList;
  }
  return keyList;   // return list of configKeys
};

// NOTE: compare to extractCommands of IonConfig IonModelLoader.jsx
function extractCommands(groupKey,configType,configKey,commandsList) {
  // extract JSON config definition & build config with commands & cloneValues
  debug_log("extractCommands groupKey:" + groupKey);
  debug_log("extractCommands configType:" + configType);
  debug_log("extractCommands configKey:" + configKey);
  if (commandsList === undefined) { commandsList = []; }
  var keyList = [];
  // make short names for state objects

  //debug_log("commands list=" + JSON.stringify(commandsList) );
  for (let i = 0; i < commandsList.length; i++) {
    const cmdObj = commandsList[i];
    const cmdTypeKey = cmdObj.type;
    debug_log("cmdTypeKey: " + cmdTypeKey);
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
    //debug_log("command item=" + JSON.stringify(commands[cmdKey]) );
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
  debug_log("=== Identify clones using cloneValues from user ion model.");
  for (var cmdKey in commands) {
    let cmd = commands[cmdKey];
    let cmdTypeKey = cmd.typeKey;
    debug_log("$$$ cmdKey: " + cmdKey + " has type: " + cmdTypeKey);
    let cmdType = cmdTypes[cmd.typeKey];
    if(cmdType.copyClone  || cmdType.pickClone) {
      for (let i = 0; i < cmdType.paramTypes.length; i++) {
         let paramTypeKey = cmdType.paramTypes[i];
         let paramType = paramTypes[paramTypeKey];
         debug_log("$$$ consider paramType " + paramType.id + " for cloning.")
         if (paramType.copyClone || paramType.pickClone) { 
            let val = cmd.values[i];
            let type = paramType.valType;
            debug_log("$$$ seeking clone value for type: " + type + " with value of " + val);
            let cloneVal = findCloneVal(cloneValues,type,val);
            if(cloneVal) {
              debug_log("=== building clone.");
              let clone = { "cmdKey" : cmdKey, "valIdx" : i };
              debug_log ("$$$ created clone key: " + JSON.stringify(clone));
              cloneVal.clones.push(clone);
            }
         }
      }
    }
  }
};
