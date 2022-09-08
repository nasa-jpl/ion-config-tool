// NOTE: compare to getIonVerSeqNo of IonConfig IonModel.jsx
function getIonVerSeqNo(nodeKey) {
  // translate version to sequence number for command effectivity
  debug_log("getIonVerSeqNo for:" + nodeKey);
  if (!(nodes.hasOwnProperty(nodeKey) || graphs.hasOwnProperty(nodeKey) ) )
    return 0;
  var ver = 0;
  if (nodeKey in nodes) {
    const node = nodes[nodeKey];
    debug_log("??? node: " + JSON.stringify(node));
    ver = node.ionVersion;
  } else {
    const graph = graphs[nodeKey];
    debug_log("??? graph: " + JSON.stringify(graph));
    ver = graph.ionVersion;
  }
  debug_log("???nodeKey: " + nodeKey + " ionVer: "+ ver);
  for (var seqno in versions) {
    if (ver === versions[seqno].ionVersion)
      return seqno;
  }
  return 0;                       
};
// NOTE: compare to makeCmdLine of IonConfig IonModel.jsx
function makeCmdLine(cmdTypeKey,cmdParams) {
  // debug_log("makeCmdLine cmdTypeKey: " + cmdTypeKey + "  Params : " + JSON.stringify(cmdParams));
  const targets = [ "[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]", "[9]" ];
  var cmdPattern = patterns[cmdTypeKey];
  let cmdType = cmdTypes[cmdTypeKey];
  for (var i = 0; i < cmdParams.length; i++) {
    debug_log("makeCmdLine Pattern: " + cmdPattern + " tgt: " + cmdTypeKey + "  " + targets[i] + "  " + cmdParams[i]);
    let paramTypeKey = cmdType.paramTypes[i];
    if (paramTypeKey === undefined) {
      debug_log("ERROR: ignoring bad parameter " + cmdTypeKey + "  " + targets[i] + "  " + cmdParams[i]);
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
  //debug_log("cmd Type pattern " + cmdTypeKey + " " + cmd);
  return cmdPattern;
};

// NOTE: compare to makeCmdLines of IonConfig IonModel.jsx
function makeCmdLines(configKey) {
  debug_log("makeCmdLines for: " + configKey);
  const configObj = configs[configKey];
  const cmdKeys = configObj.cmdKeys;
  const configTypeKey = configObj.configType;
  const configTypeObj = configTypes[configTypeKey];
  //debug_log("makeConfigElem configType:" + JSON.stringify(configType));
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
  debug_log("makeStartLines sortConfigs: " + JSON.stringify(nodeConfigs));
  for (var j=0; j<nodeConfigs.length; j++) {
    let configObj = nodeConfigs[j];
    let configKey = configObj.id;
    debug_log("makeStartLines configKey: " + configKey);
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
