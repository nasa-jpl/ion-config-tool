#!/usr/bin/env node
//
//    dtn2ion.js
//
//  generate an ion model from a dtn network model
//
//  usage:  dtn2ion.js -m [netmodelfile]
//
//  inputs: net_model.json  (or alternative name)
//
//  outputs: net_model-ion.json,  [related to input name]
//           progress messages,
//           error messages
//
//  author: Rick Borgen
//

// module imports
const mm = require('minimist');
const fs = require('fs');
const df = require('date-fns');
const buf = require('buffer');

var debugFlag = false

// schema imports (global)
const configTypes = require('../../json/configTypes.json');
const cmdTypes    = require('../../json/cmdTypes.json');
const paramTypes  = require('../../json/paramTypes.json');
const selections  = require('../../json/selections.json');
const patterns    = require('../../json/patterns.json');
const ionVersions = require('../../json/ionVersions.json');

var uniqId = 0;       // counter used to make unique names

// ion model objects (global)
var ion = {};
var graphs = {};
var nodes = {};
var configs = {};
var commands = {};
var hosts = {};
var ipaddrs = {};
var clones = {}

console.log("Build ION Model from a DTN Network Model");

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
var net = {};
var netHosts = {};
var netNodes = {};
var netHops  = {};
var netAddrs = {};
[net,netHosts,netNodes,netHops,netAddrs] = extractModel(json);
console.log("---");
console.log("DTN Network Model summary:");
console.log("netHosts: " + Object.keys(netHosts));
console.log("netNodes: " + Object.keys(netNodes));
console.log("netHops: "  + Object.keys(netHops));
console.log("netAddrs: " + netAddrs);
console.log("---");
console.log("Checking user net model.");
var errors = checkNetModel(netHosts,netNodes,netHops);
if (errors.length) {
  console.log("Validation errors.");
  for (let i=0; i<errors.length; i++) {
    error(errors[i]);
  }
} else {
  console.log("Validation successful.");
}
console.log("---");
console.log("Building user ion model components.");
buildIonModel(net.name,net.desc,netHosts,netNodes,netHops);

console.log("ION Model summary:");
console.log("hosts: "  + Object.keys(hosts));
console.log("nodes: "  + Object.keys(nodes));
console.log("graphs: " + Object.keys(graphs));
console.log("config count:  " + Object.keys(configs).length);
console.log("ipaddr count:  " + Object.keys(ipaddrs).length);
console.log("command count: " + Object.keys(commands).length );
console.log("config files:  " + Object.keys(configs));

console.log("---");
console.log("Combining single ion model object.");
var modelObj = makeModelObj();

console.log("---");
const modelName = ion.name + ".json";
console.log("Writing json model to " + modelName);
saveModel(modelName,modelObj);

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
//        netloader.js    
//
function extractModel (modelObj) {
  // extract the Net config JSON structure &
  // flatten the data structures for efficient access

  // make short names for state objects
  var net = {};
  var hosts = {};
  var nodes = {};
  var hops  = {};
  var addrs = [];

  if(modelObj.hasOwnProperty("netModelName"))
    net.name = modelObj["netModelName"];
  else {
    warn("The json file is not a Net Model.");
    return [ net, hosts, nodes, hops, addrs];
  }
  if(modelObj.hasOwnProperty("netModelDesc"))
    net.desc = modelObj["netModelDesc"];

  console.log("Ingesting user net model.  net: " + JSON.stringify(net));

  console.log("Ingesting netHosts.");
  var hostList = [];
  if(modelObj.hasOwnProperty("netHosts")) 
    hostList = modelObj.netHosts;
  var hostAttrs = ["hostName","hostDesc","ipAddrs","platform","hostNodes"];
  for (var hostKey in hostList) {
    var hostObj = hostList[hostKey];
    for (var attr in hostObj) {
      if (hostAttrs.indexOf(attr) < 0) {
         warn(attr + " is invalid attribute for host " + hostKey);
      };
    };
    var id = '';
    if(hostObj.hasOwnProperty("hostName")) {
      id = hostObj["hostName"];
      if(id != hostKey)
        warn(id + " hostName does not match key " + hostKey);
    }
    var desc = '';
    if(hostObj.hasOwnProperty("hostDesc"))
      desc = hostObj["hostDesc"];
    let ipaddrs = [];
    if(hostObj.hasOwnProperty("ipAddrs"))
      ipaddrs = hostObj["ipAddrs"];

    // build the hosts state object
    hosts[hostKey] = { 
      "id" : hostKey, 
      "hostDesc" : desc,
      "ipAddrs" : ipaddrs
    };
    // add the ip addrs to master list
    for (var i=0; i<ipaddrs.length; i++) {
      if (ipaddrs[i] === "") {
        warn("Host " + hostKey + " has an empty ip address.");
        continue;
      }
      addrs.push(ipaddrs[i]);
    };
  };
  console.log("Ingesting netNodes.");
  var nodeList = [];
  var nodeAttrs = ["nodeName","nodeDesc","nodeHost","nodeType",
      "endpointID","protocols","services"];
  if(modelObj.hasOwnProperty("netNodes"))  // optional for now.
    nodeList = modelObj.netNodes;
  for (var nodeKey in nodeList) {
    var nodeObj = nodeList[nodeKey];
    for (var attr in nodeObj) {
      if (nodeAttrs.indexOf(attr) < 0) {
         warn(attr + " is invalid attribute for node " + nodeKey);
      };
    };
    var id = '';
    if(nodeObj.hasOwnProperty("nodeName")) {
      id = nodeObj["nodeName"];
      if(id != nodeKey)
        warn(id + " nodeName does not match key " + nodeKey);
    };
    var desc = '';
    if(nodeObj.hasOwnProperty("nodeDesc"))
      desc = nodeObj["nodeDesc"];
    var host = '';
    if(nodeObj.hasOwnProperty("nodeHost"))
      host = nodeObj["nodeHost"];
    var type = '';
    if(nodeObj.hasOwnProperty("nodeType"))
      type = nodeObj["nodeType"];
    var ep = '';
    if(nodeObj.hasOwnProperty("endpointID"))
       ep = nodeObj["endpointID"];
    var servs= [];
    if(nodeObj.hasOwnProperty("services"))
      servs = nodeObj["services"];
    // build the nodes state object
    nodes[nodeKey] = { 
      "id" : nodeKey, 
      "nodeDesc" : desc, 
      "nodeHost" : host,
      "nodeType" : type,
      "endpointID" : ep,
      "services" : servs
    };
  }
  console.log("Ingesting netHops.");
  var hopList = [];
  var hopAttrs = ["hopName","hopDesc","fromNode","toNode",
        "bpLayer","ltpLayer","maxRate","symmetric"];
  if(modelObj.hasOwnProperty("netHops"))  // optional for now.
    hopList = modelObj.netHops;
  for (var hopKey in hopList) {
    var hopObj = hopList[hopKey];
    for (var attr in hopObj) {
      if (hopAttrs.indexOf(attr) < 0) {
         warn(attr + " is invalid attribute for hop " + hopKey);
      };
    };
    var id = '';
    if(hopObj.hasOwnProperty("hopName")) {
      id = hopObj["hopName"];
      if(id != hopKey)
        warn(id + " hopName does not match key " + hopKey);
    };
    var desc = '';
    if(hopObj.hasOwnProperty("hopDesc"))
      desc = hopObj["hopDesc"];
    var fromnode = '';
    if(hopObj.hasOwnProperty("fromNode"))
      fromnode = hopObj["fromNode"];
    var tonode = '';
    if(hopObj.hasOwnProperty("toNode"))
      tonode = hopObj["toNode"];
    var bp = '';
    if(hopObj.hasOwnProperty("bpLayer"))
      bp = hopObj["bpLayer"];
    var ltp = '';
    if(hopObj.hasOwnProperty("ltpLayer"))
      ltp = hopObj["ltpLayer"];
    var rate = 0;
    if(hopObj.hasOwnProperty("maxRate"))
      rate = hopObj["maxRate"];
    var flag = false;
    if(hopObj.hasOwnProperty("symmetric"))
      flag = hopObj["symmetric"];
    var sym  = true;
    if (!flag || flag === "false" || flag === "no")
      sym = false;
    // build the nodes state object
    hops[hopKey] = { 
      "id" : hopKey, 
      "hopName": hopKey,
      "hopDesc": desc,
      "fromNode": fromnode,
      "toNode": tonode,
      "bpLayer": bp,
      "ltpLayer": ltp,
      "maxRate": rate,
      "symmetric": sym
    };
  };
  console.log("Ingestion complete.");
  return [ net, hosts, nodes, hops, addrs];
};
//        checknet.js  
//

// NOTE: compare to checkNetModel of IonConfig NetModel.jsx
function checkNetModel(netHosts,netNodes,netHops) {
// make list of errors in net model
  var errors = [];   // list of messages (strings)

  // do some sanity checking on net model
  if (!netHosts)  // no host object?
    errors.push("The Net Model has no Host list.")
  if (!Object.keys(netHosts).length)   // no hosts?
    errors.push("The Net Model has no Hosts.");
  if (!netNodes)  // no node object?
    errors.push("The Net Model has no Node list.");
  if (!Object.keys(netNodes).length)   // no nodes?
    errors.push("The Net Model has no Nodes.");
  for (var nodeKey in netNodes) {
    var netNode = netNodes[nodeKey];
    var hostKey = netNode.nodeHost;
    var hostObj = netHosts[hostKey];
    if (!hostObj)
      errors.push("Invalid hostKey for node " + nodeKey + ".");
  }
  // verify node keys of each hop
  for (var hopKey in netHops) {
    var netHop = netHops[hopKey];
    var fromNode = netNodes[netHop.fromNode];
    if (!fromNode) 
      errors.push("Invalid fromNode for hop " + hopKey + ".");
    var toNode = netNodes[netHop.toNode];
    if (!toNode) 
      errors.push("Invalid toNode for hop " + hopKey + ".");
    if (!netHop.bpLayer)
      errors.push("Invalid bpLayer for hop " + hopKey + ".");
  }
  return errors;
}
// NOTE: compare to buildIonModel of IonConfig NetModel.jsx
function buildIonModel(netName, netDesc, netHosts, netNodes, netHops) {
  // translate the net model to a full ion model
  // using best-guess defaults

  // default values
  const ionName   = netName + "-ion";
  const graphName = netName + "-graph";
  const ionDesc   = "ION " + netDesc;
  const graphDesc = "ION " + netDesc + " Contacts";
  const graphConfig = graphName + ".cg";
  const nodeFeed  = "unix";
  var   nextNodeNum   = 1000;        // starting next nodeNum 
  // determine latest ion version
  var ionVer    = "4.0.0";
  var highKey   = 10;
  for (var verKey in ionVersions) {
    if (verKey > highKey) {
      ionVer = ionVersions[verKey].ionVersion;
      highKey = verKey;
    } 
  }

  // build ion object
  ion["name"] = ionName;
  ion["desc"] = ionDesc;
  ion["nextNodeNum"] = nextNodeNum;    // to be updated, depending on node defs
  ion["currentContacts"] = graphName;
  var nodeNum = nextNodeNum;

  // build ion hosts
  for (var hostKey in netHosts) {
    let netHost = netHosts[hostKey];
    hosts[hostKey] = { 
      "id" : hostKey, 
      "name" : hostKey, 
      "desc" : netHost.hostDesc, 
      "linefeed" : nodeFeed,
      "ipAddrKeys" : []
    };
    let hostCmdKey = "host_" + hostKey;
    let hostClone = { "id": hostCmdKey, "typeKey": "host_hostkey", "values":[ hostKey ] };
    let cloneVal = makeCloneVal(hostKey,hostClone);
    clones[hostCmdKey] = cloneVal;

    // build ion ipaddrs
    if (netHost.hasOwnProperty("ipAddrs")) {
      debug("****** netHost has ipAddrs!! " + hostKey);
      for (let i = 0; i < netHost.ipAddrs.length; i++) {
        let addr = netHost.ipAddrs[i];
        let uniqid = getUniqId();
        let ipAddrKey = "ipAddr_" + uniqid;
        ipaddrs[ipAddrKey] = {
          "id" : ipAddrKey,
          "hostKey" : hostKey,
          "ipAddr" : addr
        };
        hosts[hostKey].ipAddrKeys.push(ipAddrKey);

        let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ addr ] };
        cloneVal = makeCloneVal(hostKey,ipClone);
        clones[ipAddrKey] = cloneVal;
      }
    }
    // add the possible DNS entry, if no addrs provided
    if (hosts[hostKey].ipAddrKeys.length === 0 && isGoodName(hostKey)) {
      let uniqid = getUniqId();
      let ipAddrKey = "ipAddr_" + uniqid;
      ipaddrs[ipAddrKey] = {
        "id" : ipAddrKey,
        "hostKey" : hostKey,
        "ipAddr" : hostKey
      };
      hosts[hostKey].ipAddrKeys.push(ipAddrKey);

      let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ hostKey ] };
      cloneVal = makeCloneVal(hostKey,ipClone);
      clones[ipAddrKey] = cloneVal;
    }; // end of DNS addr block
  };   // end of netHost loop
  debug("makeIonModel...  hosts:   " + JSON.stringify(hosts));
  debug("makeIonModel...  ipaddrs: " + JSON.stringify(ipaddrs));
  debug("makeIonModel...  clones:  " + JSON.stringify(clones));

  // build ion nodes first, to establish all ion node numbers
  for (var nodeKey in netNodes) {
    var protocols = [];  // init node protocols list
    let netNode = netNodes[nodeKey];
    nodeNum = nextNodeNum;   // default
    if (netNode.nodeType === 'ion' && netNode.endpointID !== '') {
      try {
        nodeNum = Number(netNode.endpointID);
      }
      catch (err) {
        nodeNum= nextNodeNum;
      }
    }
    if (nodeNum === nextNodeNum) {  // used nextNodeNum?
      nextNodeNum += 1;
    }
    if (nodeNum > nextNodeNum) {    // higher node num ceiling?
      nextNodeNum = nodeNum + 1;
    }
    nodes[nodeKey] = {
      "id" : nodeKey, 
      "longName" : netNode.nodeDesc, 
      "ionNodeNum" : nodeNum,
      "ionVersion" : ionVer,
      "hostKey" : netNode.nodeHost,
      "configKeys" : []
    };
    // build nodenum & nodekey clone value
    let numCmdKey = "nodeNum_" + nodeKey;
    let nodeClone = { "id": numCmdKey, "typeKey": "node_nodenum", "values":[ nodeNum.toString() ] };
    let cloneVal = makeCloneVal(nodeKey,nodeClone);
    clones[numCmdKey] = cloneVal;
  };
  ion["nextNodeNum"] = nextNodeNum;   // update based on node loading
  // now build configs and (static) commands per node
  // ...hop-based commands must be done later
  for (nodeKey in netNodes) {
    var netNode = netNodes[nodeKey];
    var ionNode = nodes[nodeKey];
    nodeNum = ionNode.ionNodeNum;
    // build ionconfig 
    var configName = nodeKey + ".ionconfig";
    configs[configName] = {
      "id" : configName,
      "nodeKey": nodeKey,
      "configType" : "ionconfig",
      "cmdKeys" : [] 
    };
    nodes[nodeKey].configKeys.push(configName);
    var ionconfig = configName;
    // build ionconfig configFlags cmd
    var vals = ["13"];
    var cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionconfig","configFlags",vals);
    addCommandKey(configs,configName,cmdKey);
    // build ionrc 
    configName = nodeKey + ".ionrc";
    configs[configName] = {
      "id" : configName,
      "nodeKey": nodeKey,
      "configType" : "ionrc",
      "cmdKeys" : [] 
    };
    nodes[nodeKey].configKeys.push(configName);
    // build ionrc initialize cmd
    vals = [nodeNum,ionconfig];
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionrc","initialize",vals);
    addCommandKey(configs,configName,cmdKey);
    // build ionrc start cmd
    vals = [];
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionrc","start",vals);
    addCommandKey(configs,configName,cmdKey);
    // build ipnrc 
    configName = nodeKey + ".ipnrc";
    //  var ipnrc = configName;  (only needed if building a "r ipnadmin")
    configs[configName] = {
      "id" : configName,
      "nodeKey": nodeKey,
      "configType" : "ipnrc",
      "cmdKeys" : [] 
    };
    nodes[nodeKey].configKeys.push(configName);

    // build of plan cmds happens later with hop analysis

    // build bpv6rc 
    configName = nodeKey + ".bpv6rc";
    configs[configName] = {
      "id" : configName,
      "nodeKey": nodeKey,
      "configType" : "bpv6rc",
      "cmdKeys" : [] 
    };
    nodes[nodeKey].configKeys.push(configName);
    // build bpv6rc initialize cmd
    vals = [];
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","initialize",vals);
    addCommandKey(configs,configName,cmdKey);
    // build bpv6rc scheme cmd
    vals = ["ipn","ipnfw","ipnadminep"];
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","scheme",vals);
    addCommandKey(configs,configName,cmdKey);
    // build bpv6rc "low" endpoint cmds  [0...6]
    for (var i=0; i<7; i++) {
      vals = [nodeNum,i,"x",""];
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","endpoint",vals);
      addCommandKey(configs,configName,cmdKey);
    }
    // provide endpoints per service
    const services = netNode.services;
    for (i=0; i<services.length; i++) {
      var aservice = services[i];
      if (aservice === 'cfdp') {   // CFDP: endpoints 64 & 65
        vals = [nodeNum,64,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","endpoint",vals);
        addCommandKey(configs,configName,cmdKey);
        vals = [nodeNum,65,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","endpoint",vals);
        addCommandKey(configs,configName,cmdKey);
      }
      if (aservice === 'ams') {   // AMS: endpoints 71 & 72
        vals = [nodeNum,71,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","endpoint",vals);
        addCommandKey(configs,configName,cmdKey);
        vals = [nodeNum,72,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","endpoint",vals);
        addCommandKey(configs,configName,cmdKey);
      }
      if (aservice === 'amp') {   // AMS: endpoints 101 & 102
        vals = [nodeNum,101,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","endpoint",vals);
        addCommandKey(configs,configName,cmdKey);
        vals = [nodeNum,102,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","endpoint",vals);
        addCommandKey(configs,configName,cmdKey);
      }
    }
    // build protocol list for the node
    for (var hKey in netHops) {
      var netHop = netHops[hKey];
      if(nodeKey === netHop.toNode || nodeKey === netHop.fromNode)
        if(!protocols.includes(netHop.bpLayer))
          protocols.push(netHop.bpLayer);
    }
    debug("protocols: " + JSON.stringify(protocols));
     // build protocol cmds
    for (let i=0; i<protocols.length; i++) {
      var prot = protocols[i];
      vals = [prot,1400,100,""];
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","protocol",vals);
      addCommandKey(configs,configName,cmdKey);
    }
    // build of induct cmds happens later with hop analysis

    // build of outduct cmds happens later with hop analysis

    // build bpv6rc run ipnadmin cmd  (NOTE: not needed since included in our start script)
    // var cmd = "ipnadmin " + ipnrc;
    // vals = [cmd];
    // cmdKey = makeIonCommand(commands,clones,configName,"bpv6rc","run",vals);
    // configs[configName].cmdKeys.push(cmdKey);

    // build ltprc (if needed)
    var needLtp = protocols.includes("ltp");
    if (needLtp) {
      configName = nodeKey + ".ltprc";
      configs[configName] = {
        "id" : configName,
        "nodeKey": nodeKey,
        "configType" : "ltprc",
        "cmdKeys" : [] 
      };
      nodes[nodeKey].configKeys.push(configName);

      // build ltprc initialize cmd
      vals = [100];
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","initialize",vals);
      addCommandKey(configs,configName,cmdKey);

      // build of span cmds happens later with hop analysis

      // build of start link cmds happens later with hop analysis

    };  //end of needLtp loop
    // build ionsecrc (now required to be present by ION)
    configName = nodeKey + ".ionsecrc";
    configs[configName] = {
      "id" : configName,
      "nodeKey": nodeKey,
      "configType" : "ionsecrc",
      "cmdKeys" : []
    };
    nodes[nodeKey].configKeys.push(configName);
    // build ionsecrc initialize command
    vals = [];
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionsecrc","initialize",vals);
    addCommandKey(configs,configName,cmdKey);

  };  // end of nodes loop

  // build hop-related commands in two passes
  // ...this is necessary to ensure the inducts are all defined first 
  // ...so that outducts can be connected properly in 2nd pass

  // build a set of one-way hops for convenience
  var oneWays = {};
  for (hKey in netHops) {
    netHop = netHops[hKey];
    oneWays[hKey] = Object.assign({},netHop);
    if (netHop.symmetric) {  // symmetric implies a reverse hop also
      var newKey = hKey + "-2";
      oneWays[newKey] = Object.assign({},netHop);
      var newWay = oneWays[newKey];
      newWay.id = newKey;
      newWay.fromNode = netHop.toNode;
      newWay.toNode = netHop.fromNode;
    }
  };
  for (hKey in oneWays )
     debug("oneWay hop: " + JSON.stringify(oneWays[hKey]) );

  // pass 1 - build inducts
  // var toNode;
  debug("@@@@@ building inducts and links!");
  var inductKeys = {};     // record inducts to avoid duplicate inducts per protocol
  var startUdpKeys = {};   // hold ltp start udp commands for later (follows spans) per config
  var startDccpKeys = {};  // hold ltp start dccp commands for later (follows spans) per config 
  for (hKey in oneWays) {
    netHop = oneWays[hKey];
    debug("processing hop: " + JSON.stringify(netHop));
    var toNode = nodes[netHop.toNode];
    nodeKey = toNode.id;
    var bpLayer = netHop.bpLayer;
    var cli = bpLayer + "cli";
    var toNodeNum = toNode.ionNodeNum;
    var toHostKey = toNode.hostKey;
    var toAddr = toHostKey;            // default, just in case
    var toHost = netHosts[toHostKey];  // same as ion hosts
    if (toHost.ipAddrs.length > 0)
      toAddr = toHost.ipAddrs[0];
    var rate = netHop.maxRate;
    var induct = "induct_" + bpLayer;
    if (bpLayer === "ltp" ||
        bpLayer === "bssp") {
      vals = [toNodeNum,cli]
    } else 
    if (isStandardProtocol(bpLayer)) {  // the other protocols are port-based
      var ports = getHostPorts(toHostKey,hosts,ipaddrs,commands);
      var nextPort = 4556;
      while (ports.includes(nextPort))
        nextPort++;
      vals = [toAddr,nextPort,cli];
    } else {   // non-standard protocol
      induct = "induct_any";
      vals = [bpLayer, "", cli];
    }
    configName = nodeKey + ".bpv6rc";
    var inKey = configName + bpLayer;
    if(!inductKeys.hasOwnProperty(inKey)) {
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc",induct,vals);
      addCommandKey(configs,configName,cmdKey);
      inductKeys[inKey] = cmdKey;   // actual value not important, just know one exists
    }
    // build ltp links as necessary
    if (bpLayer === "ltp") {    // link candidate?
      configName = nodeKey + ".ltprc";
      toHostKey = toNode.hostKey;
      ports = getHostPorts(toHostKey,hosts,ipaddrs,commands);
      nextPort = 1113;
      while (ports.includes(nextPort))
        nextPort++;
      var linkName  = toHostKey + ":" + nextPort;
      if (netHop.ltpLayer === "udp") {
        if (startUdpKeys.hasOwnProperty(configName) )  // already have start udp?
          break;                                       // one is the limit
        vals = [toAddr,nextPort];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_udp",vals);
        startUdpKeys[configName] = cmdKey;
      };
      if (netHop.ltpLayer === "dccp") {
        if (startDccpKeys.hasOwnProperty(configName) )  // already have start dccp?
          break;                                        // one is the limit
        vals = [toAddr,nextPort];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_dccp",vals);
        startDccpKeys[configName] = cmdKey;
      };
    };
  };
  debug("$$$$$ startUdpKeys: " + JSON.stringify(startUdpKeys) );
  // pass 2 - build outducts
  // var toNode;
  debug("@@@@@ building outducts and spans!");
  for (hKey in oneWays) {
    netHop = oneWays[hKey];
    debug("processing hop: " + JSON.stringify(netHop));
    var fromNode = nodes[netHop.fromNode];
    nodeKey = fromNode.id;
    toNode = nodes[netHop.toNode];
    rate = netHop.maxRate;
    bpLayer = netHop.bpLayer;
    var outduct = "outduct_" + bpLayer;
    var clo = bpLayer + "clo";
    if (bpLayer === "ltp" ||
        bpLayer === "bssp") {
      toNodeNum = toNode.ionNodeNum;
      vals = [toNodeNum,clo,""]
    //} else if (bpLayer === "udp") {   //old udp promiscuous mode
    //  vals = ["udpclo",""]
    } else 
    if (isStandardProtocol(bpLayer)) {   // assume valid induct name
      var cloneVal = getNodeInduct(clones,toNode.id,bpLayer);
      debug ("???? cloneVal: " + JSON.stringify(cloneVal));
      var inductName = cloneVal.value;
      if (bpLayer === "udp")
        vals = [inductName,clo,"0"];
      else
        vals = [inductName,clo,""];
    } else {                       // won't know the induct name here
      outduct = "outduct_any";     // use general format
      vals = [bpLayer,"",clo,""];
    };
    configName = nodeKey + ".bpv6rc";
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc",outduct,vals);
    addCommandKey(configs,configName,cmdKey);
    //configs[configName].cmdKeys.push(cmdKey);
    // build ltp spans as necessary
    if (bpLayer === "ltp") {    // link candidate?
      configName = nodeKey + ".ltprc";
      toHostKey = toNode.hostKey;
      cloneVal = getNodeLink(clones,toNode.id,netHop.ltpLayer);
      debug ("???? cloneVal: " + JSON.stringify(cloneVal));
      linkName = cloneVal.value;
      if (netHop.ltpLayer === "udp") {
        // max block size = max-segment-size - 8  (etherenet)
        vals = [toNodeNum,100,100,1482,100000,1,linkName,1]
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","span_udp",vals);
        addCommandKey(configs,configName,cmdKey);
      };
      if (netHop.ltpLayer === "dccp") {
        // max block size = 1400  (https://wiki.linuxfoundation.org/networking/dccp)
        vals = [toNodeNum,100,100,1400,100000,1,linkName,1]
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","span_dccp",vals);
        addCommandKey(configs,configName,cmdKey);
      };
    };
  };
  // HACK Alert!  -- only now add the start commands, so span not ignored by ION
  //              -- see pass 1 for build of start commands
  for (configName in startUdpKeys)
    addCommandKey(configs,configName,startUdpKeys[configName]);
  for (configName in startDccpKeys)
    addCommandKey(configs,configName,startDccpKeys[configName]);

  // pass 3 - build plan cmds
  for (hKey in oneWays) {
    netHop = oneWays[hKey];
    debug("processing hop: " + JSON.stringify(netHop));
    fromNode = nodes[netHop.fromNode];
    nodeKey = fromNode.id;
    toNode = nodes[netHop.toNode]
    toHostKey = toNode.hostKey;
    toAddr = toHostKey;            // default, just in case
    toHost = netHosts[toHostKey];  // same as ion hosts
    if (toHost.ipAddrs.length > 0)
      toAddr = toHost.ipAddrs[0];
    toNodeNum = toNode.ionNodeNum;
    rate = netHop.maxRate;
    bpLayer = netHop.bpLayer;
    var plan = "plan_" + bpLayer;
    // assume new plan format with rate parameter...ION supporting?
    if (bpLayer === "ltp" ||
        bpLayer === "bssp") {
      vals = [toNodeNum,toNodeNum,rate];
    } else 
    if (bpLayer === "udp") {   //udp depends on induct
      cloneVal = getNodeInduct(clones,toNode.id,bpLayer);
      var outductName = cloneVal.value;
      vals = [toNodeNum,outductName,rate];
    } else 
    if (isStandardProtocol(bpLayer)) {
      cloneVal = getNodeOutduct(clones,nodeKey,toAddr,bpLayer);
      //debug ("???? cloneVal: " + JSON.stringify(cloneVal));
      outductName = cloneVal.value;
      vals = [toNodeNum,outductName,rate];
    } else {
      plan = "plan_any";
      vals = [toNodeNum,"",rate];
    };
    configName = nodeKey + ".ipnrc";
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ipnrc",plan,vals);
    addCommandKey(configs,configName,cmdKey);
  };

  // build bpv6rc start cmd, now that the duct cmds are done
  for (nodeKey in netNodes) {
    vals = [];
    configName = nodeKey + ".bpv6rc";
    cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv6rc","start",vals);
    addCommandKey(configs,configName,cmdKey);
  };
  debug("makeIonModel...  nodes:   " + JSON.stringify(nodes));
  debug("makeIonModel...  clones:  " + JSON.stringify(clones));

  // build ion contact graph
  graphs[graphName] = { 
    "id"   : graphName, 
    "name" : graphName, 
    "desc" : graphDesc,
    "ionVersion" :ionVer,
    "configKey" : graphConfig
  };
  configs[graphConfig] = {
    "id" : graphConfig,
    "nodeKey": graphName,
    "configType" : "contacts",
    "cmdKeys" : [] 
  };
  // build range and contact cmds
  var maxSecs = 50000000;
  var ranges = {};
  for (hKey in oneWays) {
    netHop = oneWays[hKey];
    rate = netHop.maxRate;
    fromNode = nodes[netHop.fromNode];
    var fromNodeNum = fromNode.ionNodeNum;
    toNode = nodes[netHop.toNode];
    toNodeNum = toNode.ionNodeNum;

    // range cmd   - build one per link...avoid implicit range for possible reverse link
    vals = [0,maxSecs,fromNodeNum,toNodeNum,1];
    cmdKey = makeIonCommand(commands,clones,graphName,configName,"contacts","range_rel_rel_time",vals);
    ranges[hKey] = cmdKey;   // save for later to group range commands
    // contact cmd
    vals = [0,maxSecs,fromNodeNum,toNodeNum,rate,1.0];
    cmdKey = makeIonCommand(commands,clones,graphName,configName,"contacts","contact_rel_rel_time",vals);
    addCommandKey(configs,graphConfig,cmdKey);
  };
  // add range cmds as a group
  for (hKey in ranges) {
    cmdKey = ranges[hKey];
    addCommandKey(configs,graphConfig,cmdKey);
  };
  assignClones(commands,clones);   //  map cloneVal to using clones (command params)
  return null;
};
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
function saveModel(modelName, modelObj) {
  debug("save ION model!");
  const modelJson = JSON.stringify(modelObj,null,2);
  //const buff = new buf.Buffer( [modelJson], {type: "text/plain; charset=utf-8"} );
  fs.writeFileSync(modelName,modelJson); 
};