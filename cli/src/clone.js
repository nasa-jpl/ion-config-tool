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
        || type === "bpv7rc_induct_udp"
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
