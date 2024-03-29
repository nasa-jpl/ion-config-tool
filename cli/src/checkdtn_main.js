//
//    checkdtn.js 
//
//  check the validity of syntax and content of a dtnmodel
//
//  usage:  checkdtn.js -m [netmodelfile]
//
//  inputs: net_model.json  (or alternative name)
//
//  outputs: progress messages,
//           error messages
//
//  author: Rick Borgen
//

const mm = require('minimist');
const fs = require('fs');
console.log("DTN Network Model Validation");

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
console.log("Object: " + JSON.stringify(json) );
console.log("---");
var netHosts = {};
var netNodes = {};
var netHops  = {};
var netAddrs = {};
[netHosts,netNodes,netHops,netAddrs] = extractModel(json);
console.log("---");
console.log("Ingestion summary:");
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
console.log("Done.");

//----functions---
function warn(s) {
  console.log("Warning: "  + s);
}
function error(s) {
  console.log("Error: "  + s);
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
    return [ hosts, nodes, hops, addrs];
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
  return [ hosts, nodes, hops, addrs];
};

//        checknet.js  
//

// make list of errors in net model
function checkNetModel(netHosts,netNodes,netHops) {
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
      errors.push(hostKey + " is invalid hostKey for node " + nodeKey + ".");
  }
  // verify node keys of each hop
  for (var hopKey in netHops) {
    var netHop = netHops[hopKey];
    var fromNode = netNodes[netHop.fromNode];
    if (!fromNode) 
      errors.push("Invalid fromNode for hop " + hopKey + ".");
    var toNode = netNodes[netHop.toNode];
    if (!toNode) 
      errors.push(netHop.toNode + " is invalid toNode for hop " + hopKey + ".");
    if (!netHop.bpLayer)
      errors.push("Invalid bpLayer for hop " + hopKey + ".");
  }
  return errors;
}
