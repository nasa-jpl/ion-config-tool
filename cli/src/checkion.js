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
