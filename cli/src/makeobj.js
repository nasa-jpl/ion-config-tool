// NOTE: compare to makeModelObj of IonConfig IonModel.jsx
function makeModelObj() {
  debug("makeModelObj " + ion.name);
  var model = {};    // user model built from current state

  model["ionModelName"] = ion.name;
  model["ionModelDesc"] = ion.desc;
  model["nextNodeNum"] = ion.nextNodeNum;
  model["currentContacts"] = ion.currentContacts;
  model["hosts"] = [];
  model["nodes"] = [];
  model["graphs"]  = [];

  for (var hostKey in hosts) {
    const hostObj = hosts[hostKey];
    var hostJson = {
      hostName: hostKey,
      hostDesc: hostObj.desc,
      linefeed: hostObj.linefeed,
      ipAddrs: []
    }
    for (var addrKey in ipaddrs) {
      if (ipaddrs[addrKey].hostKey === hostKey)
        hostJson["ipAddrs"].push(ipaddrs[addrKey].ipAddr)
    }
    model["hosts"].push(hostJson);
  }
  for (var nodeKey in nodes) {
    const nodeObj = nodes[nodeKey];
    var nodeJson = {
      nodeName: nodeKey,
      nodeDesc: nodeObj.longName,
      nodeNum: nodeObj.ionNodeNum,
      ionVersion: nodeObj.ionVersion,
      hostName: nodeObj.hostKey,
      configs: {}
    }
    const nodeConfigKeys = nodeObj.configKeys;
    for (var i=0; i<nodeConfigKeys.length; i++) {
      const configKey = nodeConfigKeys[i];
      const configObj = configs[configKey];
      const configType = configObj.configType;
      let configJson = makeConfigObj(configKey);
      nodeJson.configs[configType] =  configJson;
    }
    model["nodes"].push(nodeJson);
  }
  for (var ctxKey in graphs) {
    const ctxObj = graphs[ctxKey];
    var graphsJson = {
      graphName: ctxKey,
      graphDesc: ctxObj.desc,
      ionVersion: ctxObj.ionVersion,
      configs: {}
    }
    const configKey = ctxObj.configKey;  // just one config
    debug("graph configKey: " + configKey);
    const configObj = configs[configKey];
    const configType = configObj.configType;
    let configJson = makeConfigObj(configKey);
    graphsJson.configs[configType] =  configJson;
    model["graphs"].push(graphsJson);
  }
  return model;
};

// NOTE: compare to makeConfigObj of IonConfig IonModel.jsx
function makeConfigObj(configKey) {
  var config = { commands: [] };

  const configObj = configs[configKey];
  const configCmdKeys = configObj.cmdKeys;
  for (var j=0; j<configCmdKeys.length; j++) {
    const cmdId = configCmdKeys[j];
    debug("cmdId: " + cmdId);
    const cmdObj = commands[cmdId];    
    const userCmdObj = {
      type: cmdObj.typeKey,
      lastUpdate: cmdObj.lastUpdate,
      parameters: cmdObj.values
    };
    config.commands.push(userCmdObj);
  }
  return config;
};
