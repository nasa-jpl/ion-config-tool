// Special wrapper function for console.log debug messages
function debug_log(msg) {
  if (DEBUG_MODE)
     console.log(msg);
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
