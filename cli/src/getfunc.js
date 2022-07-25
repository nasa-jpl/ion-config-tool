// NOTE: compare to assignClones of IonConfig NetModel.jsx
function assignClones(commands,cloneValues) {
  // identify commands dependent on cloneValues
  // and push them on to the cloneValue list for update notifications

  debug("=== Identify clones using cloneValues from the network model.");
  for (var cmdKey in commands) {
    let cmd = commands[cmdKey];
    let cmdTypeKey = cmd.typeKey;
    debug(" cmdKey: " + cmdKey + " has type: " + cmdTypeKey);
    let cmdType = cmdTypes[cmd.typeKey];
    if(cmdType.copyClone || cmdType.pickClone) {
      for (let i = 0; i < cmdType.paramTypes.length; i++) {
         let paramTypeKey = cmdType.paramTypes[i];
         let paramType = paramTypes[paramTypeKey];
         debug(" consider paramType " + paramType.id + " for cloning.")
         if (paramType.copyClone || paramType.pickClone) { 
            let val = cmd.values[i];
            let type = paramType.valType;
            debug(" seeking clone value for type: " + type + " with value of " + val);
            let cloneVal = findCloneVal(cloneValues,type,val);
            if(cloneVal) {
              debug("=== building clone.");
              let clone = { "cmdKey" : cmdKey, "valIdx" : i };
              debug (" created clone key: " + JSON.stringify(clone));
              cloneVal.clones.push(clone);
            }
         }
      }
    }
  }
};

// NOTE: compare to getHostPorts of IonConfig NetModel.jsx
function getHostPorts (hostKey, hosts, ipaddrs, commands) {
  // get assigned ports of a host
  var ports = [];
  const hostObj = hosts[hostKey];
  const ipAddrs = hostObj.ipAddrKeys;
  for (var i=0; i<ipAddrs.length; i++) {
    var ipAddrKey = ipAddrs[i];
    var ipAddr = ipaddrs[ipAddrKey].ipAddr;
    for (var cmdKey in commands) {
      var cmdObj = commands[cmdKey];        
      if  ( (cmdObj.typeKey.indexOf("induct") >= 0
         && cmdObj.typeKey.indexOf("ltp") < 0 ) 
        || (cmdObj.typeKey.indexOf("start_udp") >= 0) 
        || (cmdObj.typeKey.indexOf("start_dccp") >= 0) ) {
        if ( cmdObj.values[0] === ipAddr)    // correct ipAddr?
          ports.push(cmdObj.values[1]);
      }
    }
  }
  debug("host: " + hostKey + " ports: " + ports.toString() );
  return ports;
} 

// NOTE: compare to getNodeInducts of IonConfig NetModel.jsx
function getNodeInduct(cloneVals,nodeKey,bpLayer) {
  // find an Induct cloneValue based on nodeKey & type (bpLayer)
  var cloneType = bpLayer + "Induct";
  for (var key in cloneVals) {
    let cloneVal = cloneVals[key];
    //debug(" checking cloneVal: " + JSON.stringify(cloneVal));
    if (cloneVal.type=== cloneType && cloneVal.nodeKey === nodeKey) {
      return cloneVal;
    }
  }
  debug ("!!! failed to get cloneVal for nodeKey: " + nodeKey + " cloneType: " + cloneType);
  return "";
};

// NOTE: compare to getNodeLink of IonConfig NetModel.jsx
function getNodeLink(cloneVals,nodeKey,ltpLayer) {
  // find a Link cloneValue based on nodeKey & type (ltpLayer)
  var cloneType = ltpLayer + "Link";
  for (var key in cloneVals) {
    let cloneVal = cloneVals[key];
    //debug(" checking cloneVal: " + JSON.stringify(cloneVal));
    if (cloneVal.type=== cloneType && cloneVal.nodeKey === nodeKey) {
      return cloneVal;
    }
  }
  debug ("!!! failed to get cloneVal for nodeKey: " + nodeKey + " cloneType: " + cloneType);
  return "";
};

// NOTE: compare to getNodeOutduct of IonConfig NetModel.jsx
function getNodeOutduct(cloneVals,nodeKey,toAddr,bpLayer) {
  // find an Outduct cloneValue based on nodeKey & toHostKey & type (bpLayer)
  var cloneType = bpLayer + "Outduct";
  debug ("!!! seeking cloneVal for nodeKey: " + nodeKey 
               + " toAddr: " + toAddr + " cloneType: " + cloneType) ;
  for (var key in cloneVals) {
    let cloneVal = cloneVals[key];
    //debug(" checking cloneVal: " + JSON.stringify(cloneVal));
    if (cloneVal.type === cloneType && cloneVal.nodeKey === nodeKey) {
      if (cloneVal.value.indexOf(toAddr) >= 0)
        return cloneVal;
    }
  }
  debug ("!!! failed to get cloneVal for nodeKey: " + nodeKey 
               + " toAddr: " + toAddr + " cloneType: " + cloneType) ;
  return "";
};
