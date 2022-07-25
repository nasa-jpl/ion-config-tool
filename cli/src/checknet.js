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
